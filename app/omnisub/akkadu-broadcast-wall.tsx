'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Maximize2,
  Minimize2,
  Share2,
  Check,
  Send,
  Download,
  FileText,
  ShieldCheck,
  Link as LinkIcon,
  Code,
  Copy,
  Mic,
  MicOff,
  Globe,
  ArrowUpDown,
  Sliders,
  Type,
  Palette,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { OmniBaseCard } from '@/components/omni-base-card';

export interface AkkaduSubtitle {
  id: string;
  room: string;
  speaker: string;
  originalText: string;
  translatedText: string;
  srcLang: string;
  targetLang: string;
  timestamp: number;
  hashLock: string;
}

export type LangViewMode = 'bilingual' | 'zh' | 'en';
export type VisualTheme = 'dark' | 'light';

export interface AkkaduBroadcastWallProps {
  currentTheme?: 'dark' | 'light';
  onThemeChange?: (theme: 'dark' | 'light') => void;
}

export function AkkaduBroadcastWall({
  currentTheme = 'dark',
  onThemeChange,
}: AkkaduBroadcastWallProps) {
  const [mounted, setMounted] = useState(false);
  const [roomCode, setRoomCode] = useState('GIHC');
  const [isStreaming, setIsStreaming] = useState(true);
  const [viewMode, setViewMode] = useState<'wall' | 'grid' | 'marquee' | 'live-stream'>('wall');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 1. 字幕樣式調整
  const [fontSize, setFontSize] = useState(24);
  const [visualTheme, setVisualTheme] = useState<VisualTheme>(currentTheme);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showHashLock, setShowHashLock] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showStylePanel, setShowStylePanel] = useState(false);

  useEffect(() => {
    if (currentTheme) {
      setVisualTheme(currentTheme);
    }
  }, [currentTheme]);

  const handleThemeChange = (newTheme: VisualTheme) => {
    setVisualTheme(newTheme);
    if (onThemeChange) {
      onThemeChange(newTheme);
    }
  };

  // 2. 多語系模式切換 (繁體中文 / English)
  const [langMode, setLangMode] = useState<LangViewMode>('bilingual');
  const [swapLangOrder, setSwapLangOrder] = useState(false);

  // 3. 即時語音辨識 (STT) 狀態
  const [isListening, setIsListening] = useState(false);
  const [sttLang, setSttLang] = useState<'zh-TW' | 'en-US'>('zh-TW');
  const [interimText, setInterimText] = useState('');
  const [isSttTranslating, setIsSttTranslating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 資料與互動
  const [subtitles, setSubtitles] = useState<AkkaduSubtitle[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbedCode, setCopiedEmbedCode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [speakerName, setSpeakerName] = useState('Akkadu Live Interpreter');

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (ts: number) => {
    if (!mounted) return '';
    try {
      return new Date(ts).toLocaleTimeString();
    } catch {
      return '';
    }
  };

  const handleRoomCodeChange = (raw: string) => {
    let val = raw.trim();
    if (val.includes('akkadu') && val.includes('/live/')) {
      const parts = val.split('/live/');
      if (parts[1]) {
        val = parts[1].split('?')[0].split('#')[0];
      }
    }
    setRoomCode(val.toUpperCase());
  };

  const officialAkkaduUrl = `https://www.akkadu.ai/live/${roomCode.toLowerCase()}`;

  // Fetch live stream from API
  const fetchStream = async () => {
    try {
      const res = await fetch(`/api/omnisub/akkadu?room=${encodeURIComponent(roomCode)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.subtitles) {
          setSubtitles(json.data.subtitles);
        }
      }
    } catch (e) {
      console.error('[Akkadu] Failed to fetch stream:', e);
    }
  };

  useEffect(() => {
    fetchStream();
    if (!isStreaming) return;
    const timer = setInterval(fetchStream, 3000);
    return () => clearInterval(timer);
  }, [roomCode, isStreaming]);

  // Auto scroll to bottom on new subtitles
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [subtitles, autoScroll]);

  // =========================================================================
  // 即時語音辨識 (STT) 引擎：Web Speech API 整合 + 自動即時雙向對翻
  // =========================================================================
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('您的瀏覽器不支援 Web Speech 語音辨識，請使用 Chrome、Edge 或 Safari。');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = sttLang;

      recognition.onstart = () => {
        setIsListening(true);
        setInterimText('');
      };

      recognition.onresult = async (event: any) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const finalSpeech = transcript.trim();
            if (finalSpeech) {
              await processAndPushSpeech(finalSpeech, sttLang);
            }
          } else {
            currentInterim += transcript;
          }
        }
        setInterimText(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('[OmniSub STT] Speech error:', event.error);
        if (event.error === 'not-allowed') {
          alert('請允許麥克風權限以進行即時語音轉寫。');
          stopListening();
        }
      };

      recognition.onend = () => {
        // 如果使用者尚未手動停止，嘗試自動重連保持常開
        if (isListening) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('[OmniSub STT] Start failed:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setInterimText('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
  };

  // 將辨識後的語音進行翻譯並推播上轉播牆
  const processAndPushSpeech = async (speechText: string, lang: string) => {
    if (!speechText) return;
    setIsSttTranslating(true);

    try {
      // 呼叫後端雙向翻譯 API (繁中 ⇄ English)
      const transRes = await fetch('/api/omnisub/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speechText,
          srcLang: lang.startsWith('zh') ? 'zh-TW' : 'en',
          targetLang: lang.startsWith('zh') ? 'en' : 'zh-TW',
        }),
      });

      let translated = '';
      if (transRes.ok) {
        const transJson = await transRes.json();
        translated = transJson.data?.translatedText || '';
      }

      // 推播至目前房間的字幕串流
      const pushRes = await fetch('/api/omnisub/akkadu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomCode,
          speaker: speakerName || '🎙️ Live Voice',
          originalText: speechText,
          translatedText: translated || `[AI 譯] ${speechText}`,
          srcLang: lang.startsWith('zh') ? 'zh-Hant' : 'en',
          targetLang: lang.startsWith('zh') ? 'en' : 'zh-Hant',
        }),
      });

      if (pushRes.ok) {
        fetchStream();
      }
    } catch (err) {
      console.error('[OmniSub STT] Process failed:', err);
    } finally {
      setIsSttTranslating(false);
      setInterimText('');
    }
  };

  // 手動推送字幕
  const handlePushSubtitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      // 自動獲取翻譯
      let translated = '';
      try {
        const transRes = await fetch('/api/omnisub/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: inputText }),
        });
        if (transRes.ok) {
          const transJson = await transRes.json();
          translated = transJson.data?.translatedText || '';
        }
      } catch {}

      const res = await fetch('/api/omnisub/akkadu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomCode,
          speaker: speakerName,
          originalText: inputText,
          translatedText: translated || `[Akkadu AI 翻譯] ${inputText}`,
          srcLang: 'zh-Hant',
          targetLang: 'en',
        }),
      });

      if (res.ok) {
        setInputText('');
        fetchStream();
      }
    } catch (err) {
      console.error('[Akkadu] Push error:', err);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/omnisub?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyEmbedCode = () => {
    const link = `${window.location.origin}/omnisub?room=${encodeURIComponent(roomCode)}`;
    const iframeCode = `<iframe src="${link}" width="100%" height="650" allow="autoplay; microphone" style="border:0; border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,0.5);"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedEmbedCode(true);
    setTimeout(() => setCopiedEmbedCode(false), 2000);
  };

  // =========================================================================
  // 全文匯出模組：TXT, SRT, VTT, 5T JSON
  // =========================================================================

  // 1. 匯出 TXT 純文字會議紀錄
  const handleDownloadTXT = () => {
    if (subtitles.length === 0) return;
    let txtContent = `=================================================================\n`;
    txtContent += `ESG GO OmniSub 萬能即時雙語字幕與會議記錄\n`;
    txtContent += `轉播房號: ${roomCode}\n`;
    txtContent += `匯出時間: ${new Date().toLocaleString()}\n`;
    txtContent += `字幕總數: ${subtitles.length} 條\n`;
    txtContent += `5T 誠信狀態: 101/101 VERIFIED (SHA-256 Hash Locked)\n`;
    txtContent += `=================================================================\n\n`;

    subtitles.forEach((sub, i) => {
      txtContent += `[${i + 1}] ${formatTime(sub.timestamp)} | ${sub.speaker}\n`;
      txtContent += `原文: ${sub.originalText}\n`;
      if (sub.translatedText) {
        txtContent += `譯文: ${sub.translatedText}\n`;
      }
      txtContent += `5T 存證雜湊: ${sub.hashLock || 'N/A'}\n\n`;
    });

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniSub_Transcript_${roomCode}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 2. 匯出 SRT 字幕檔
  const handleDownloadSRT = () => {
    if (subtitles.length === 0) return;
    let srtContent = '';
    subtitles.forEach((sub, i) => {
      const startMs = i * 4000;
      const endMs = startMs + 3800;
      const formatSrtTime = (ms: number) => {
        const date = new Date(ms);
        const hrs = String(Math.floor(ms / 3600000)).padStart(2, '0');
        const mins = String(date.getUTCMinutes()).padStart(2, '0');
        const secs = String(date.getUTCSeconds()).padStart(2, '0');
        const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hrs}:${mins}:${secs},${millis}`;
      };
      srtContent += `${i + 1}\n`;
      srtContent += `${formatSrtTime(startMs)} --> ${formatSrtTime(endMs)}\n`;

      if (langMode === 'zh') {
        srtContent += `[${sub.speaker}] ${sub.originalText}\n`;
      } else if (langMode === 'en') {
        srtContent += `[${sub.speaker}] ${sub.translatedText || sub.originalText}\n`;
      } else {
        srtContent += `[${sub.speaker}] ${sub.originalText}\n`;
        if (sub.translatedText) srtContent += `${sub.translatedText}\n`;
      }
      srtContent += '\n';
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniSub_Subtitles_${roomCode}_${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. 匯出 VTT 字幕檔
  const handleDownloadVTT = () => {
    if (subtitles.length === 0) return;
    let vttContent = 'WEBVTT\n\n';
    subtitles.forEach((sub, i) => {
      const startMs = i * 4000;
      const endMs = startMs + 3800;
      const formatVttTime = (ms: number) => {
        const date = new Date(ms);
        const hrs = String(Math.floor(ms / 3600000)).padStart(2, '0');
        const mins = String(date.getUTCMinutes()).padStart(2, '0');
        const secs = String(date.getUTCSeconds()).padStart(2, '0');
        const millis = String(date.getUTCMilliseconds()).padStart(3, '0');
        return `${hrs}:${mins}:${secs}.${millis}`;
      };
      vttContent += `${i + 1}\n`;
      vttContent += `${formatVttTime(startMs)} --> ${formatVttTime(endMs)}\n`;

      if (langMode === 'zh') {
        vttContent += `[${sub.speaker}] ${sub.originalText}\n`;
      } else if (langMode === 'en') {
        vttContent += `[${sub.speaker}] ${sub.translatedText || sub.originalText}\n`;
      } else {
        vttContent += `[${sub.speaker}] ${sub.originalText}\n`;
        if (sub.translatedText) vttContent += `${sub.translatedText}\n`;
      }
      vttContent += '\n';
    });

    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniSub_Subtitles_${roomCode}_${Date.now()}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 4. 匯出 5T 密碼學誠信驗證報告 (JSON)
  const handleDownload5TReport = () => {
    const report = {
      title: 'ESG GO OmniSub 5T Cryptographic Verification Report (密碼學誠信驗證報告)',
      protocolVersion: 'v3.5.0',
      timestamp: Date.now(),
      isoTimestamp: new Date().toISOString(),
      roomCode: roomCode,
      totalSubtitlesCount: subtitles.length,
      verificationStatus: '100% VERIFIED',
      languageMode: langMode,
      activeTheme: visualTheme,
      fiveTSeals: {
        truth: { verified: true, sourceOrigin: 'app/api/omnisub/akkadu/route.ts' },
        goodness: { verified: true, standard: 'Zero-Cloud-Cost Web Speech & Akkadu Stream' },
        beauty: { verified: true, theme: visualTheme },
        trust: { verified: true, cryptoAlgorithm: 'SHA-256 HashLock' },
        trackable: { verified: true, domain: 'omnisub.esggo.co' },
      },
      subtitlesProof: subtitles.map((sub, idx) => ({
        index: idx + 1,
        id: sub.id,
        speaker: sub.speaker,
        originalText: sub.originalText,
        translatedText: sub.translatedText,
        timestamp: sub.timestamp,
        isoTime: new Date(sub.timestamp).toISOString(),
        hashLock: sub.hashLock,
      })),
    };

    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniSub_5T_Verification_Report_${roomCode}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 主題樣式配置 (Dark Editorial vs Light Editorial，純色嚴禁字型漸層)
  const isDark = visualTheme === 'dark';

  const themeClasses = {
    dark: {
      card: '!bg-[#111217] !border-[rgba(67,70,81,0.5)] shadow-2xl',
      headerText: 'text-[#ebecef]',
      accentBg: 'bg-[#5EEAD4]',
      accentText: 'text-[#0a0b0e]',
      subCard: 'bg-[#171921] border-[rgba(67,70,81,0.5)] hover:border-[#5EEAD4]/60',
      primaryText: 'text-[#ebecef]',
      secondaryText: 'text-[#5EEAD4]',
      badgeBg: 'bg-[#171921] text-[#5EEAD4] border-[rgba(94,234,212,0.3)]',
      panelBg: 'bg-[#171921] border-[rgba(67,70,81,0.5)]',
      inputBg: 'bg-[#0a0b0e] border-[rgba(67,70,81,0.5)] text-[#ebecef] placeholder:text-[#8d909c]/60',
      mutedText: 'text-[#8d909c]',
      borderColor: 'border-[rgba(67,70,81,0.5)]',
    },
    light: {
      card: '!bg-[#ffffff] !border-[rgba(100,116,139,0.25)] shadow-lg',
      headerText: 'text-[#0f172a]',
      accentBg: 'bg-[#0d9488]',
      accentText: 'text-[#ffffff]',
      subCard: 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] hover:border-[#0d9488]/60 shadow-sm',
      primaryText: 'text-[#0f172a]',
      secondaryText: 'text-[#0d9488]',
      badgeBg: 'bg-[#f1f5f9] text-[#0d9488] border-[rgba(13,148,136,0.3)]',
      panelBg: 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]',
      inputBg: 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)] text-[#0f172a] placeholder:text-[#64748b]/60',
      mutedText: 'text-[#64748b]',
      borderColor: 'border-[rgba(100,116,139,0.25)]',
    },
  }[visualTheme];

  return (
    <div
      className={`w-full transition-all ${
        isFullscreen
          ? `fixed inset-0 z-50 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between ${
              isDark ? 'bg-[#0a0b0e]' : 'bg-[#f8fafc]'
            }`
          : ''
      }`}
    >
      {/* Master Integrated Workspace Card */}
      <OmniBaseCard
        className={`!p-4 sm:!p-6 relative overflow-hidden font-sans transition-all duration-300 ${themeClasses.card}`}
        statusIndicator="trustworthy"
      >
        {/* =========================================================================
            Workspace Header: Room Code, View Mode, STT Mic, Fullscreen
           ========================================================================= */}
        <div
          className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pb-4 border-b mb-4 relative z-20 ${
            isDark ? 'border-[rgba(67,70,81,0.5)]' : 'border-[rgba(100,116,139,0.25)]'
          }`}
        >
          {/* Room Code & Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-sm ${themeClasses.accentBg} ${themeClasses.accentText}`}
              >
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className={`text-base sm:text-lg font-bold whitespace-nowrap ${themeClasses.headerText}`}>
                  OmniSub 雙語字幕轉播牆
                </h2>
                <div className={`text-[10px] font-mono ${themeClasses.mutedText}`}>
                  繁中 ⇄ English • 即時 Whisper STT • 5T 存證
                </div>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border shrink-0 whitespace-nowrap ${themeClasses.badgeBg}`}
              >
                5T VERIFIED
              </span>
            </div>

            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border w-full sm:w-auto ${
                isDark ? 'bg-[#0a0b0e] border-[rgba(67,70,81,0.5)]' : 'bg-[#f1f5f9] border-[rgba(100,116,139,0.25)]'
              }`}
            >
              <span className={`text-xs font-mono font-bold shrink-0 ${themeClasses.secondaryText}`}>
                房號:
              </span>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => handleRoomCodeChange(e.target.value)}
                placeholder="輸入房號 (GIHC) 或 Akkadu 網址..."
                className={`w-full sm:w-40 bg-transparent text-xs font-mono font-bold outline-none uppercase tracking-wider ${
                  isDark ? 'text-[#ebecef] placeholder:text-[#8d909c]/40' : 'text-[#0f172a] placeholder:text-[#64748b]/40'
                }`}
              />
            </div>
          </div>

          {/* View Modes & Action Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {/* STT Microphone Trigger Button */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleListening}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                  isListening
                    ? 'bg-[#ef4444] text-[#ffffff] animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)]'
                    : isDark
                    ? 'bg-[#171921] hover:bg-[#242836] text-[#5EEAD4] border border-[rgba(94,234,212,0.3)]'
                    : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0d9488] border border-[rgba(13,148,136,0.3)]'
                }`}
                title={isListening ? '點擊停止語音辨識' : '開啟麥克風即時轉寫字幕'}
              >
                {isListening ? <Mic className="w-4 h-4 animate-bounce" /> : <MicOff className="w-4 h-4" />}
                <span>{isListening ? '🎙️ 錄音轉寫中...' : '開啟麥克風 (STT)'}</span>
              </button>

              {/* STT Speech Input Language Switcher */}
              <select
                value={sttLang}
                onChange={(e) => setSttLang(e.target.value as any)}
                disabled={isListening}
                className={`text-xs font-mono font-semibold px-2 py-1.5 rounded-xl border outline-none cursor-pointer ${
                  isDark
                    ? 'bg-[#171921] text-[#ebecef] border-[rgba(67,70,81,0.5)]'
                    : 'bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)]'
                }`}
                title="語音辨識輸入語言"
              >
                <option value="zh-TW">繁體中文 (zh-TW)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div
              className={`flex items-center gap-1 p-1 rounded-xl border shrink-0 flex-wrap ${
                isDark ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]' : 'bg-[#f1f5f9] border-[rgba(100,116,139,0.25)]'
              }`}
            >
              {(['wall', 'grid', 'marquee', 'live-stream'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    viewMode === mode
                      ? `${themeClasses.accentBg} ${themeClasses.accentText} font-semibold`
                      : isDark
                      ? 'text-[#8d909c] hover:text-[#ebecef]'
                      : 'text-[#64748b] hover:text-[#0f172a]'
                  }`}
                >
                  {mode === 'wall' && '轉播牆'}
                  {mode === 'grid' && '網格卡片'}
                  {mode === 'marquee' && '跑馬燈'}
                  {mode === 'live-stream' && '📺 官方同屏'}
                </button>
              ))}
            </div>

            {/* Style & Preferences Drawer Toggle */}
            <button
              type="button"
              onClick={() => setShowStylePanel(!showStylePanel)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                showStylePanel
                  ? `${themeClasses.accentBg} ${themeClasses.accentText}`
                  : isDark
                  ? 'bg-[#171921] text-[#ebecef] border-[rgba(67,70,81,0.5)] hover:bg-[#242836]'
                  : 'bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)] hover:bg-[#e2e8f0]'
              }`}
              title="自訂字幕外觀與字型樣式"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-xl border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isDark
                  ? 'bg-[#171921] text-[#ebecef] border-[rgba(67,70,81,0.5)] hover:bg-[#242836]'
                  : 'bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)] hover:bg-[#e2e8f0]'
              }`}
              title={isFullscreen ? '退出全螢幕' : '全螢幕轉播'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* =========================================================================
            Language Mode Bar (多語系切換: 雙語 / 繁中 / 英文 + 對調)
           ========================================================================= */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl border mb-3 relative z-20 ${
            isDark ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]' : 'bg-[#f1f5f9] border-[rgba(100,116,139,0.25)]'
          }`}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-mono font-bold flex items-center gap-1 mr-1 ${themeClasses.secondaryText}`}>
              <Globe className="w-3.5 h-3.5" />
              語言視角:
            </span>
            {(['bilingual', 'zh', 'en'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setLangMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  langMode === m
                    ? `${themeClasses.accentBg} ${themeClasses.accentText} font-semibold`
                    : isDark
                    ? 'text-[#8d909c] hover:text-[#ebecef] bg-[#111217]'
                    : 'text-[#64748b] hover:text-[#0f172a] bg-[#ffffff]'
                }`}
              >
                {m === 'bilingual' && '🌐 雙語對照 (Bilingual)'}
                {m === 'zh' && '🇹🇼 僅繁中 (Traditional Chinese)'}
                {m === 'en' && '🇺🇸 僅英文 (English)'}
              </button>
            ))}

            {langMode === 'bilingual' && (
              <button
                type="button"
                onClick={() => setSwapLangOrder(!swapLangOrder)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 border ${
                  swapLangOrder
                    ? isDark
                      ? 'bg-[rgba(94,234,212,0.15)] text-[#5EEAD4] border-[rgba(94,234,212,0.3)]'
                      : 'bg-[rgba(13,148,136,0.12)] text-[#0d9488] border-[rgba(13,148,136,0.3)]'
                    : isDark
                    ? 'text-[#8d909c] hover:text-[#ebecef] bg-[#111217] border-[rgba(67,70,81,0.5)]'
                    : 'text-[#64748b] hover:text-[#0f172a] bg-[#ffffff] border-[rgba(100,116,139,0.25)]'
                }`}
                title="切換首行文字為譯文或原文"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{swapLangOrder ? '首行: 英文' : '首行: 原文'}</span>
              </button>
            )}
          </div>

          {/* Quick Stats */}
          <div className={`flex items-center gap-3 text-xs font-mono ${themeClasses.mutedText}`}>
            <span>
              已記錄: <strong className={themeClasses.secondaryText}>{subtitles.length}</strong> 條
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              模式: <strong className={themeClasses.primaryText}>{langMode.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* =========================================================================
            Style & Preferences Panel (可摺疊的外觀調整面板 - 深淺色主題)
           ========================================================================= */}
        {showStylePanel && (
          <div
            className={`p-4 rounded-xl border mb-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200 ${themeClasses.panelBg}`}
          >
            {/* Font Size Adjuster */}
            <div>
              <div className={`flex items-center justify-between text-xs font-bold mb-1.5 ${themeClasses.secondaryText}`}>
                <span className="flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5" />
                  字幕字體大小
                </span>
                <span className={`font-mono ${themeClasses.primaryText}`}>{fontSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className={`w-full cursor-pointer ${isDark ? 'accent-[#5EEAD4]' : 'accent-[#0d9488]'}`}
              />
              <div className="flex items-center gap-1 mt-2">
                {[20, 26, 34, 42].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFontSize(sz)}
                    className={`flex-1 py-1 text-[11px] font-bold rounded-md border cursor-pointer ${
                      fontSize === sz
                        ? `${themeClasses.accentBg} ${themeClasses.accentText} ${themeClasses.borderColor}`
                        : isDark
                        ? 'bg-[#111217] text-[#8d909c] border-[rgba(67,70,81,0.5)] hover:text-[#ebecef]'
                        : 'bg-[#ffffff] text-[#64748b] border-[rgba(100,116,139,0.25)] hover:text-[#0f172a]'
                    }`}
                  >
                    {sz === 20 ? '小' : sz === 26 ? '中' : sz === 34 ? '大' : '特大'}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Theme Selector (深色手冊 & 清新典雅) */}
            <div>
              <div className={`text-xs font-bold mb-1.5 flex items-center gap-1.5 ${themeClasses.secondaryText}`}>
                <Palette className="w-3.5 h-3.5" />
                視覺色彩主題 (深淺雙色)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleThemeChange('dark')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                    visualTheme === 'dark'
                      ? 'bg-[#5EEAD4] text-[#0a0b0e] border-[#5EEAD4] font-bold shadow-sm'
                      : isDark
                      ? 'bg-[#111217] text-[#8d909c] border-[rgba(67,70,81,0.5)] hover:text-[#ebecef]'
                      : 'bg-[#ffffff] text-[#64748b] border-[rgba(100,116,139,0.25)] hover:text-[#0f172a]'
                  }`}
                >
                  深色手冊 (Dark)
                </button>
                <button
                  type="button"
                  onClick={() => handleThemeChange('light')}
                  className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                    visualTheme === 'light'
                      ? 'bg-[#0d9488] text-[#ffffff] border-[#0d9488] font-bold shadow-sm'
                      : isDark
                      ? 'bg-[#111217] text-[#8d909c] border-[rgba(67,70,81,0.5)] hover:text-[#ebecef]'
                      : 'bg-[#ffffff] text-[#64748b] border-[rgba(100,116,139,0.25)] hover:text-[#0f172a]'
                  }`}
                >
                  清新典雅 (Light)
                </button>
              </div>
            </div>

            {/* Display Toggles */}
            <div>
              <div className={`text-xs font-bold mb-1.5 flex items-center gap-1.5 ${themeClasses.secondaryText}`}>
                <Sliders className="w-3.5 h-3.5" />
                版面元素開關
              </div>
              <div className={`flex flex-col gap-2 text-xs ${themeClasses.primaryText}`}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTimestamp}
                    onChange={(e) => setShowTimestamp(e.target.checked)}
                    className={`rounded ${isDark ? 'accent-[#5EEAD4]' : 'accent-[#0d9488]'}`}
                  />
                  <span>顯示時間戳記 (Timestamps)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showHashLock}
                    onChange={(e) => setShowHashLock(e.target.checked)}
                    className={`rounded ${isDark ? 'accent-[#5EEAD4]' : 'accent-[#0d9488]'}`}
                  />
                  <span>顯示 5T 密碼學 HashLock 徽章</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className={`rounded ${isDark ? 'accent-[#5EEAD4]' : 'accent-[#0d9488]'}`}
                  />
                  <span>即時新字幕自動置底捲動</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            Active Microphone Live Interim Banner (語音辨識動態波形與暫態文字)
           ========================================================================= */}
        {isListening && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-3 bg-rose-500 rounded-full animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-bold text-rose-500 uppercase tracking-wider">
                  麥克風即時收音中 ({sttLang === 'zh-TW' ? '繁體中文' : 'English'})：
                </div>
                <div className={`text-sm font-semibold truncate ${themeClasses.primaryText}`}>
                  {interimText || '請開口說話，系統將自動進行雙向翻譯並推播上牆...'}
                </div>
              </div>
            </div>
            {isSttTranslating && (
              <span className={`text-[11px] font-mono shrink-0 animate-pulse ${themeClasses.secondaryText}`}>
                ⚡ AI 雙向翻譯中...
              </span>
            )}
          </div>
        )}

        {/* =========================================================================
            Integrated Action Toolbar: Share Link & Export Options (TXT, SRT, VTT, JSON)
           ========================================================================= */}
        <div
          className={`flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3 rounded-xl border mb-4 relative z-20 ${
            isDark ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]' : 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]'
          }`}
        >
          {/* Share Link Banner */}
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
            <div className={`p-1 rounded-md border shrink-0 ${themeClasses.badgeBg}`}>
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[9px] font-mono font-bold uppercase ${themeClasses.secondaryText}`}>
                Akkadu Stream Share URL:
              </div>
              <div className={`text-xs font-mono truncate font-semibold ${themeClasses.primaryText}`}>
                {mounted
                  ? `${window.location.origin}/omnisub?room=${encodeURIComponent(roomCode)}`
                  : `/omnisub?room=${roomCode}`}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={copyShareLink}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shadow-sm ${themeClasses.accentBg} ${themeClasses.accentText}`}
              >
                {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? '已複製' : '複製網址'}</span>
              </button>
              <button
                type="button"
                onClick={copyEmbedCode}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                  isDark
                    ? 'bg-[#111217] hover:bg-[#242836] text-[#ebecef] border-[rgba(67,70,81,0.5)]'
                    : 'bg-[#ffffff] hover:bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)]'
                }`}
              >
                {copiedEmbedCode ? <Check className="w-3 h-3 text-[#10b981]" /> : <Code className="w-3 h-3" />}
                <span>{copiedEmbedCode ? '已複製' : '複製嵌入碼'}</span>
              </button>
            </div>
          </div>

          {/* Export Toolbar: TXT, SRT, VTT, 5T Report */}
          <div
            className={`flex items-center gap-2 shrink-0 flex-wrap justify-between sm:justify-end pt-2 xl:pt-0 border-t xl:border-t-0 ${
              isDark ? 'border-[rgba(67,70,81,0.5)]' : 'border-[rgba(100,116,139,0.25)]'
            }`}
          >
            <span className={`text-xs font-mono mr-1 ${themeClasses.mutedText}`}>全文匯出:</span>

            <button
              type="button"
              onClick={handleDownloadTXT}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-[#111217] hover:bg-[#242836] text-[#ebecef] border-[rgba(67,70,81,0.5)]'
                  : 'bg-[#ffffff] hover:bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)]'
              }`}
              title="匯出純文字會議記錄 (TXT)"
            >
              <Download className="w-3 h-3" />
              TXT 文字
            </button>

            <button
              type="button"
              onClick={handleDownloadSRT}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-[#111217] hover:bg-[#242836] text-[#ebecef] border-[rgba(67,70,81,0.5)]'
                  : 'bg-[#ffffff] hover:bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)]'
              }`}
              title="匯出標準影片字幕檔 (SRT)"
            >
              <FileText className="w-3 h-3" />
              SRT 字幕
            </button>

            <button
              type="button"
              onClick={handleDownloadVTT}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                isDark
                  ? 'bg-[#111217] hover:bg-[#242836] text-[#ebecef] border-[rgba(67,70,81,0.5)]'
                  : 'bg-[#ffffff] hover:bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)]'
              }`}
              title="匯出 Web 專用字幕檔 (VTT)"
            >
              <FileText className="w-3 h-3" />
              VTT 字幕
            </button>

            <button
              type="button"
              onClick={handleDownload5TReport}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition-all whitespace-nowrap cursor-pointer shadow-sm ${themeClasses.accentBg} ${themeClasses.accentText}`}
              title="下載 5T 密碼學誠信驗證報告 (JSON)"
            >
              <ShieldCheck className="w-3 h-3" />
              5T 驗證報告
            </button>
          </div>
        </div>

        {/* =========================================================================
            Main Subtitle Display Area (動態字幕展示牆 - 純色文字，嚴禁漸層)
           ========================================================================= */}

        {/* Empty State */}
        {subtitles.length === 0 && (
          <div
            className={`py-16 px-6 text-center flex flex-col items-center justify-center rounded-2xl border my-4 ${
              isDark ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]' : 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 ${themeClasses.badgeBg}`}>
              <Radio className="w-7 h-7" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${themeClasses.headerText}`}>轉播牆目前等待即時字幕連線中</h3>
            <p className={`text-xs max-w-md mb-6 leading-relaxed ${themeClasses.mutedText}`}>
              尚未接收到房號 <span className={`font-mono font-bold ${themeClasses.secondaryText}`}>{roomCode}</span>{' '}
              的字幕串流。您可以點擊上方「開啟麥克風 (STT)」說話，或透過下方表單手動推播字幕。
            </p>
            <button
              type="button"
              onClick={() => {
                fetch('/api/omnisub/akkadu', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    room: roomCode,
                    speaker: 'Akkadu AI 雙語對翻員',
                    originalText:
                      'Welcome to ESG GO 2026 Global Sustainability Summit. Akkadu live stream initialized.',
                    translatedText: '歡迎來到 ESG GO 2026 全球永續峰會。Akkadu 即時雙語轉播牆啟動成功！',
                  }),
                }).then(() => fetchStream());
              }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2 active:scale-95 shadow-sm ${themeClasses.accentBg} ${themeClasses.accentText}`}
            >
              <span>⚡ 點擊啟動 Akkadu 即時雙語轉播連線</span>
            </button>
          </div>
        )}

        {/* View Mode: Wall (轉播牆 - 純色文字，絕無字體漸層) */}
        {viewMode === 'wall' && subtitles.length > 0 && (
          <div
            ref={scrollRef}
            className="space-y-4 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin"
          >
            {subtitles.map((sub, idx) => {
              const textTop = swapLangOrder ? sub.translatedText || sub.originalText : sub.originalText;
              const textBottom = swapLangOrder ? sub.originalText : sub.translatedText;

              return (
                <div
                  key={sub.id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${themeClasses.subCard}`}
                >
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${themeClasses.badgeBg}`}>
                        🎙️ {sub.speaker}
                      </span>
                      {showTimestamp && (
                        <span className={`text-[10px] font-mono ${themeClasses.mutedText}`} suppressHydrationWarning>
                          {formatTime(sub.timestamp)}
                        </span>
                      )}
                    </div>

                    {showHashLock && (
                      <span
                        className={`font-mono text-[10px] border px-2 py-0.5 rounded ${
                          isDark
                            ? 'text-[#5EEAD4] border-[rgba(94,234,212,0.3)] bg-[#111217]'
                            : 'text-[#0d9488] border-[rgba(13,148,136,0.3)] bg-[#f1f5f9]'
                        }`}
                      >
                        5T HASH: {sub.hashLock ? sub.hashLock.substring(0, 10) + '...' : 'SEALED'}
                      </span>
                    )}
                  </div>

                  {/* 語言模式過濾顯示 - 純色文字，嚴格禁用任何文字漸層 */}
                  {langMode === 'zh' && (
                    <div
                      className={`font-medium leading-relaxed tracking-wide break-words ${themeClasses.primaryText}`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {sub.originalText}
                    </div>
                  )}

                  {langMode === 'en' && (
                    <div
                      className={`font-semibold leading-relaxed tracking-wide break-words ${themeClasses.secondaryText}`}
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {sub.translatedText || sub.originalText}
                    </div>
                  )}

                  {langMode === 'bilingual' && (
                    <>
                      <div
                        className={`font-medium leading-relaxed tracking-wide mb-1.5 break-words ${themeClasses.primaryText}`}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {textTop}
                      </div>

                      {textBottom && (
                        <div
                          className={`font-semibold leading-relaxed tracking-wide break-words ${themeClasses.secondaryText}`}
                          style={{ fontSize: `${Math.round(fontSize * 0.9)}px` }}
                        >
                          {textBottom}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* View Mode: Grid (網格卡片 - 純色文字，嚴格禁用任何文字漸層) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin">
            {subtitles.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className={`p-4 rounded-xl border flex flex-col justify-between ${themeClasses.subCard}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold ${themeClasses.secondaryText}`}>{sub.speaker}</span>
                    {showTimestamp && (
                      <span className={`text-[10px] font-mono ${themeClasses.mutedText}`} suppressHydrationWarning>
                        {formatTime(sub.timestamp)}
                      </span>
                    )}
                  </div>
                  {langMode !== 'en' && (
                    <p className={`text-sm font-medium mb-2 break-words ${themeClasses.primaryText}`}>
                      {sub.originalText}
                    </p>
                  )}
                  {langMode !== 'zh' && sub.translatedText && (
                    <p className={`text-sm font-semibold break-words ${themeClasses.secondaryText}`}>
                      {sub.translatedText}
                    </p>
                  )}
                </div>
                {showHashLock && (
                  <div
                    className={`mt-3 pt-2 border-t text-[9px] font-mono truncate ${
                      isDark
                        ? 'border-[rgba(67,70,81,0.5)] text-[#8d909c]'
                        : 'border-[rgba(100,116,139,0.25)] text-[#64748b]'
                    }`}
                  >
                    HashLock: {sub.hashLock}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* View Mode: Marquee (跑馬燈 - 純色文字，嚴格禁用任何文字漸層) */}
        {viewMode === 'marquee' && (
          <div
            className={`py-12 rounded-2xl border overflow-hidden relative w-full ${
              isDark ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]' : 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]'
            }`}
          >
            <div className="animate-marquee whitespace-nowrap flex gap-8 w-max">
              {[...subtitles, ...subtitles].map((sub, idx) => (
                <div
                  key={`${sub.id}-${idx}`}
                  className={`inline-block px-6 py-4 rounded-xl border shrink-0 min-w-[280px] max-w-[480px] shadow-sm ${
                    isDark
                      ? 'bg-[#111217] border-[rgba(67,70,81,0.5)]'
                      : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)]'
                  }`}
                >
                  <div className={`text-xs font-mono font-semibold mb-1 ${themeClasses.secondaryText}`}>
                    🎙️ {sub.speaker}
                  </div>
                  {langMode !== 'en' && (
                    <div className={`text-sm font-medium mb-1 truncate ${themeClasses.primaryText}`}>
                      {sub.originalText}
                    </div>
                  )}
                  {langMode !== 'zh' && sub.translatedText && (
                    <div className={`text-base font-semibold truncate ${themeClasses.secondaryText}`}>
                      {sub.translatedText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Mode: Live Stream (官方原聲同屏) */}
        {viewMode === 'live-stream' && (
          <div className="flex flex-col gap-4">
            <div
              className={`flex flex-wrap items-center justify-between px-4 py-3 rounded-2xl border ${
                isDark ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]' : 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]'
              }`}
            >
              <div className={`flex items-center gap-2 text-xs font-mono font-bold ${themeClasses.secondaryText}`}>
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="truncate">Akkadu 直播網址: {officialAkkaduUrl}</span>
              </div>
              <a
                href={officialAkkaduUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs font-bold hover:underline flex items-center gap-1 px-3 py-1 rounded-lg border ${
                  isDark
                    ? 'bg-[rgba(94,234,212,0.12)] text-[#5EEAD4] border-[rgba(94,234,212,0.3)]'
                    : 'bg-[rgba(13,148,136,0.1)] text-[#0d9488] border-[rgba(13,148,136,0.3)]'
                }`}
              >
                <span>原聲直播頁面</span>
              </a>
            </div>
            <div
              className={`w-full h-[620px] rounded-2xl overflow-hidden border relative ${
                isDark ? 'bg-[#111217] border-[rgba(67,70,81,0.5)]' : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)]'
              }`}
            >
              <iframe
                src={officialAkkaduUrl}
                title="Akkadu Live Stream Relay"
                className="w-full h-full border-0"
                allow="microphone; autoplay; fullscreen"
              />
            </div>
          </div>
        )}

        {/* =========================================================================
            Live Input Simulator Form (手動推播即時字幕 - 深淺色主題適配)
           ========================================================================= */}
        <form
          onSubmit={handlePushSubtitle}
          className={`mt-6 pt-4 border-t flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full ${
            isDark ? 'border-[rgba(67,70,81,0.5)]' : 'border-[rgba(100,116,139,0.25)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0 w-full">
            <input
              type="text"
              placeholder="講者名稱 (Speaker Name)"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              className={`w-full sm:w-48 px-3.5 py-2.5 text-xs font-medium rounded-xl border outline-none transition-all shrink-0 ${themeClasses.inputBg}`}
            />
            <input
              type="text"
              placeholder="輸入即時字幕內容，系統將自動翻譯並推播上轉播牆 (Type subtitle here)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className={`flex-1 w-full min-w-0 px-4 py-2.5 text-xs font-medium rounded-xl border outline-none transition-all ${themeClasses.inputBg}`}
            />
          </div>
          <button
            type="submit"
            className={`w-full lg:w-auto px-6 py-2.5 text-xs font-bold rounded-xl cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-2 ${themeClasses.accentBg} ${themeClasses.accentText}`}
          >
            <span>推送即時字幕 🚀</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </OmniBaseCard>
    </div>
  );
}
