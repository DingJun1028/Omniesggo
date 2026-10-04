'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  Radio,
  Tv,
  Share2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Sliders,
  Send,
} from 'lucide-react';
import { OmniBaseCard } from '@/components/omni-base-card';

interface AudioCapturePanelProps {
  roomCode: string;
  onSubtitlePushed?: () => void;
}

export function AudioCapturePanel({ roomCode, onSubtitlePushed }: AudioCapturePanelProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [speaker, setSpeaker] = useState('Zoom / 系統講者');
  const [sttText, setSttText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [lastPushed, setLastPushed] = useState<string | null>(null);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // 清理音訊資源
  const cleanupAudio = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setIsCapturing(false);
    setAudioLevel(0);
  };

  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, []);

  // 啟動 Zoom / 螢幕共用系統音訊擷取
  const startSystemAudioCapture = async () => {
    setErrorMsg('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('您的瀏覽器不支援螢幕/系統音訊擷取 (getDisplayMedia)');
      }

      // 要求擷取螢幕畫面與系統聲音 (audio: true 是擷取 Zoom/音訊的關鍵)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'window' } as any,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        } as any,
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        displayStream.getTracks().forEach((t) => t.stop());
        throw new Error(
          '未偵測到系統音訊！請在共用視窗時，務必勾選「分享系統音訊 (Share system audio)」核取方塊。'
        );
      }

      streamRef.current = displayStream;

      // 監聽使用者主動停止共用
      displayStream.getVideoTracks()[0].onended = () => {
        cleanupAudio();
      };
      audioTracks[0].onended = () => {
        cleanupAudio();
      };

      // 建立 Web Audio API 監控音量 VU Meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(displayStream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
      setIsCapturing(true);

      // 同步嘗試啟動語音識別 (若瀏覽器支援)
      startSpeechRecognition();
    } catch (err: any) {
      console.error('[Audio Capture Error]:', err);
      setErrorMsg(err.message || '啟動系統音訊擷取失敗');
      cleanupAudio();
    }
  };

  // 語音識別接收與推送
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Web Speech API not available on this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-TW';

      recognition.onresult = async (event: any) => {
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          }
        }

        if (final && final.trim()) {
          setSttText(final.trim());
          if (autoTranslate) {
            await pushTranslatedSubtitle(final.trim());
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('[SpeechRecognition error]:', e);
      };

      recognition.onend = () => {
        if (streamRef.current && streamRef.current.active) {
          try {
            recognition.start();
          } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('SpeechRecognition start failed:', e);
    }
  };

  // 推送雙語字幕至房間
  const pushTranslatedSubtitle = async (textToPush: string) => {
    if (!textToPush.trim() || isTranslating) return;
    setIsTranslating(true);
    try {
      // 1. 呼叫翻譯 API
      const transRes = await fetch('/api/omnisub/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToPush }),
      });
      const transData = await transRes.json();
      const translation =
        transData.data?.translatedText || transData.translatedText || textToPush;

      // 2. 推送至房間字幕串流
      const pushRes = await fetch('/api/omnisub/akkadu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomCode,
          speaker: speaker || 'Zoom / 系統音訊',
          originalText: textToPush,
          translatedText: translation,
          srcLang: transData.data?.sourceLang || 'zh-TW',
          targetLang: transData.data?.targetLang || 'en',
        }),
      });

      if (pushRes.ok) {
        setLastPushed(`${textToPush} ➔ ${translation}`);
        setSttText('');
        if (onSubtitlePushed) onSubtitlePushed();
      }
    } catch (e) {
      console.error('[Push Subtitle Error]:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <OmniBaseCard className="bg-[#10243f]/90 border border-[#c9a24b]/40 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c9a24b]/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#c9a24b] flex items-center gap-2">
              Zoom / 系統音訊即時擷取錄音室
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE STUDIO
              </span>
            </h2>
            <p className="text-xs text-[#f3ede1]/70">
              直錄 Zoom 會議、YouTube 或電腦音訊，經雙向翻譯後自動同步發布至房間{' '}
              <span className="text-[#c9a24b] font-mono font-bold">[{roomCode}]</span>
            </p>
          </div>
        </div>

        {/* 啟動 / 停止擷取按鈕 */}
        <div className="flex items-center gap-3">
          {isCapturing ? (
            <button
              type="button"
              onClick={cleanupAudio}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-700 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <VolumeX className="w-4 h-4" />
              停止音訊擷取
            </button>
          ) : (
            <button
              type="button"
              onClick={startSystemAudioCapture}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#c9a24b] hover:bg-[#b89139] text-[#070b12] font-black text-xs shadow-[0_0_20px_rgba(201,162,75,0.4)] transition-all cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              擷取 Zoom / 系統音訊
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* 音量指示 VU Meter 與狀態 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 音量柱狀顯示 */}
        <div className="md:col-span-2 p-4 rounded-xl bg-[#070b12]/80 border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#f3ede1]/80 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-[#c9a24b]" />
              音訊輸入動態 (VU Level)
            </span>
            <span
              className={`font-bold ${
                audioLevel > 10 ? 'text-[#10b981]' : 'text-gray-500'
              }`}
            >
              {audioLevel}% {audioLevel > 5 ? '• 接收音訊中' : '• 無音訊'}
            </span>
          </div>

          <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                audioLevel > 80
                  ? 'bg-rose-500'
                  : audioLevel > 40
                  ? 'bg-[#10b981]'
                  : 'bg-[#c9a24b]'
              }`}
              style={{ width: `${audioLevel}%` }}
            />
          </div>

          <div className="text-[11px] text-[#f3ede1]/60 flex justify-between font-mono">
            <span>-60 dB</span>
            <span>-20 dB</span>
            <span>0 dB (PEAK)</span>
          </div>
        </div>

        {/* 講者設定與自動翻譯設定 */}
        <div className="p-4 rounded-xl bg-[#070b12]/80 border border-white/10 space-y-3">
          <div>
            <label className="block text-[11px] text-[#f3ede1]/70 mb-1 font-mono">
              講者識別標籤:
            </label>
            <input
              type="text"
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-black/50 border border-white/20 text-xs text-white focus:outline-none focus:border-[#c9a24b]"
              placeholder="例如: Zoom Keynote Speaker"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-[#f3ede1]/80">自動雙向翻譯並推送</span>
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="w-4 h-4 accent-[#c9a24b] rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 手動輸入或最後一筆辨識字幕預覽 */}
      <div className="p-4 rounded-xl bg-[#070b12]/80 border border-white/10 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#c9a24b] font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            系統音訊辨識字詞 (即時暫存):
          </span>
          {isTranslating && (
            <span className="text-amber-400 animate-pulse text-[11px]">
              5T 密碼學翻譯處理中...
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={sttText}
            onChange={(e) => setSttText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') pushTranslatedSubtitle(sttText);
            }}
            placeholder="若無自動語音，亦可在此手動輸入講者內容按下 Enter 發布..."
            className="flex-1 px-3.5 py-2 rounded-xl bg-black/60 border border-white/20 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#c9a24b]"
          />
          <button
            type="button"
            disabled={!sttText.trim() || isTranslating}
            onClick={() => pushTranslatedSubtitle(sttText)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c9a24b] hover:bg-[#b89139] disabled:opacity-40 text-black font-bold text-xs transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            推送
          </button>
        </div>

        {lastPushed && (
          <div className="flex items-center gap-2 text-xs font-mono text-[#10b981] bg-[#10b981]/10 p-2.5 rounded-lg border border-[#10b981]/30">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">已成功發布：{lastPushed}</span>
          </div>
        )}
      </div>
    </OmniBaseCard>
  );
}
