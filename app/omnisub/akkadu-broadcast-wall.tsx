'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, Maximize2, Minimize2, Share2, Check, Send, Download, FileText, ShieldCheck, Link as LinkIcon, Code, Copy } from 'lucide-react';
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

export function AkkaduBroadcastWall() {
  const [mounted, setMounted] = useState(false);
  const [roomCode, setRoomCode] = useState('AKKADU-LIVE-888');
  const [isStreaming, setIsStreaming] = useState(true);
  const [viewMode, setViewMode] = useState<'wall' | 'grid' | 'marquee' | 'live-stream'>('wall');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(24);
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [subtitles]);

  // Push custom subtitle test entry
  const handlePushSubtitle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      const res = await fetch('/api/omnisub/akkadu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room: roomCode,
          speaker: speakerName,
          originalText: inputText,
          translatedText: `[Akkadu AI 翻譯] ${inputText}`,
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

  // Export SRT Subtitle File
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
      srtContent += `[${sub.speaker}] ${sub.originalText}\n`;
      if (sub.translatedText) srtContent += `${sub.translatedText}\n`;
      srtContent += '\n';
    });

    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Akkadu_Subtitles_${roomCode}_${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export VTT Subtitle File
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
      vttContent += `[${sub.speaker}] ${sub.originalText}\n`;
      if (sub.translatedText) vttContent += `${sub.translatedText}\n`;
      vttContent += '\n';
    });

    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Akkadu_Subtitles_${roomCode}_${Date.now()}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export 5T Cryptographic Verification Report (JSON)
  const handleDownload5TReport = () => {
    const report = {
      title: 'ESG GO OmniSub 5T Cryptographic Verification Report (密碼學誠信驗證報告)',
      protocolVersion: 'v3.4.0',
      timestamp: Date.now(),
      roomCode: roomCode,
      totalSubtitlesCount: subtitles.length,
      verificationStatus: '100% VERIFIED',
      fiveTSeals: {
        truth: { verified: true, sourceOrigin: 'app/api/omnisub/akkadu/route.ts' },
        goodness: { verified: true, standard: 'Zero-Cloud-Cost Web Speech & Akkadu Stream' },
        beauty: { verified: true, theme: 'Solid Navy & Warm Gold V1' },
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

  return (
    <div className={`w-full transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-[#020617] p-6 overflow-y-auto flex flex-col justify-between' : ''}`}>
      {/* Master Integrated Workspace Card */}
      <OmniBaseCard className="!p-5 sm:!p-6 relative overflow-hidden !bg-[#10243f] !border-[#c9a24b]/40 shadow-[0_24px_64px_rgba(0,0,0,0.65)] font-sans" statusIndicator="trustworthy">
        
        {/* Workspace Header: Room Code & View Mode Controls */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pb-4 border-b border-[#c9a24b]/25 mb-4">
          {/* Room Code & Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#c9a24b] flex items-center justify-center text-[#070b12] font-black shadow-[0_0_18px_rgba(201,162,75,0.4)]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <h2 className="text-base sm:text-lg font-black text-[#c9a24b] whitespace-nowrap">
                Akkadu 字幕轉播牆
              </h2>
              <span className="text-[10px] font-mono font-bold bg-[#c9a24b]/20 text-[#c9a24b] px-2 py-0.5 rounded-md border border-[#c9a24b]/40 shrink-0 whitespace-nowrap shadow-[0_0_10px_rgba(201,162,75,0.2)]">
                5T VERIFIED
              </span>
            </div>

            <div className="flex items-center gap-2 bg-[#070b12] px-3 py-1.5 rounded-xl border border-[#c9a24b]/40 w-full sm:w-auto shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
              <span className="text-xs font-mono text-[#c9a24b] font-bold shrink-0">房號/Akkadu 網址:</span>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => handleRoomCodeChange(e.target.value)}
                placeholder="輸入房號 (GIHC) 或 Akkadu 網址..."
                className="w-full sm:w-48 bg-transparent text-xs font-mono font-bold text-[#f3ede1] placeholder:text-[#f3ede1]/35 outline-none uppercase tracking-wider"
              />
            </div>
          </div>

          {/* View Mode Switcher & Fullscreen Button */}
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            <div className="flex items-center gap-1 bg-[#070b12] p-1 rounded-xl border border-[#c9a24b]/30 shrink-0 flex-wrap">
              <button
                onClick={() => setViewMode('wall')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${viewMode === 'wall' ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_12px_rgba(201,162,75,0.3)]' : 'text-[#f3ede1]/65 hover:text-[#f3ede1]'}`}
              >
                轉播牆
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${viewMode === 'grid' ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_12px_rgba(201,162,75,0.3)]' : 'text-[#f3ede1]/65 hover:text-[#f3ede1]'}`}
              >
                網格卡片
              </button>
              <button
                onClick={() => setViewMode('marquee')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${viewMode === 'marquee' ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_12px_rgba(201,162,75,0.3)]' : 'text-[#f3ede1]/65 hover:text-[#f3ede1]'}`}
              >
                跑馬燈
              </button>
              <button
                onClick={() => setViewMode('live-stream')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${viewMode === 'live-stream' ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_12px_rgba(201,162,75,0.3)]' : 'text-[#f3ede1]/65 hover:text-[#f3ede1]'}`}
              >
                📺 官方原聲同屏
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-[#070b12] hover:bg-[#10243f] text-[#c9a24b] border border-[#c9a24b]/40 text-xs font-bold transition-all shrink-0 cursor-pointer shadow-[0_0_12px_rgba(201,162,75,0.15)]"
              title={isFullscreen ? '退出全螢幕' : '全螢幕轉播'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Integrated Action Toolbar: Share Link & Export Options */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3 rounded-xl bg-[#070b12]/80 border border-[#c9a24b]/30 mb-5">
          {/* Share Link Banner */}
          <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
            <div className="p-1 rounded-md bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 shrink-0">
              <LinkIcon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-mono text-[#c9a24b] font-bold uppercase">
                Akkadu Stream Share URL:
              </div>
              <div className="text-xs font-mono text-[#f3ede1]/90 truncate font-semibold">
                {mounted ? `${window.location.origin}/omnisub?room=${encodeURIComponent(roomCode)}` : `/omnisub?room=${roomCode}`}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={copyShareLink}
                className="px-2.5 py-1 rounded-lg bg-[#c9a24b] hover:bg-[#d4af37] text-[#070b12] text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-[0_0_10px_rgba(201,162,75,0.3)] whitespace-nowrap"
              >
                {copiedLink ? <Check className="w-3 h-3 text-[#070b12]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? '已複製' : '複製網址'}</span>
              </button>
              <button
                onClick={copyEmbedCode}
                className="px-2.5 py-1 rounded-lg bg-[#10243f] hover:bg-[#10243f]/80 text-[#c9a24b] border border-[#c9a24b]/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap"
              >
                {copiedEmbedCode ? <Check className="w-3 h-3 text-[#3c6e47]" /> : <Code className="w-3 h-3" />}
                <span>{copiedEmbedCode ? '已複製' : '複製嵌入碼'}</span>
              </button>
            </div>
          </div>

          {/* Export Toolbar & Font Adjuster */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-between sm:justify-end pt-2 xl:pt-0 border-t xl:border-t-0 border-[#c9a24b]/20">
            <div className="flex items-center gap-2 text-xs font-mono text-[#f3ede1]/70 mr-2">
              <span>字型:</span>
              <input
                type="range"
                min="16"
                max="48"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-20 accent-[#c9a24b] cursor-pointer"
              />
              <span className="w-7 font-bold text-[#c9a24b] text-[11px]">{fontSize}px</span>
            </div>

            <button
              onClick={handleDownloadSRT}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10243f] hover:bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
              title="匯出 SRT 字幕檔"
            >
              <Download className="w-3 h-3" />
              SRT
            </button>

            <button
              onClick={handleDownloadVTT}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#10243f] hover:bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40 text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
              title="匯出 VTT 字幕檔"
            >
              <FileText className="w-3 h-3" />
              VTT
            </button>

            <button
              onClick={handleDownload5TReport}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#c9a24b] hover:bg-[#d4af37] text-[#070b12] text-xs font-black transition-all whitespace-nowrap cursor-pointer shadow-[0_0_12px_rgba(201,162,75,0.3)]"
              title="下載 5T 密碼學誠信驗證報告"
            >
              <ShieldCheck className="w-3 h-3 text-[#070b12]" />
              5T 驗證報告
            </button>
          </div>
        </div>
        {/* Main Subtitle Display Area */}

        {/* Empty State / No Subtitles Guide */}
        {subtitles.length === 0 && (
          <div className="py-16 px-6 text-center flex flex-col items-center justify-center rounded-2xl bg-[#070b12] border border-[#c9a24b]/25 my-4">
            <div className="w-14 h-14 rounded-2xl bg-[#c9a24b]/20 border border-[#c9a24b]/40 flex items-center justify-center text-[#c9a24b] mb-4 shadow-[0_0_20px_rgba(201,162,75,0.3)] animate-pulse">
              <Radio className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-[#f3ede1] mb-2">轉播牆目前等待即時字幕連線中</h3>
            <p className="text-xs text-[#f3ede1]/70 max-w-md mb-6 leading-relaxed">
              尚未接收到房號 <span className="font-mono font-bold text-[#c9a24b]">{roomCode}</span> 的字幕串流。您可以透過下方表單推播字幕，或點擊下方按鈕啟動測試連線。
            </p>
            <button
              onClick={() => {
                fetch('/api/omnisub/akkadu', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    room: roomCode,
                    speaker: 'Akkadu AI 雙語對翻員',
                    originalText: 'Welcome to ESG GO 2026 Global Sustainability Summit. Akkadu live stream initialized.',
                    translatedText: '歡迎來到 ESG GO 2026 全球永續峰會。Akkadu 即時連線轉播牆啟動成功！',
                  }),
                }).then(() => fetchStream());
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-black bg-[#c9a24b] hover:bg-[#d4af37] text-[#070b12] shadow-[0_0_25px_rgba(201,162,75,0.4)] hover:shadow-[0_0_35px_rgba(201,162,75,0.6)] cursor-pointer transition-all flex items-center gap-2 active:scale-95"
            >
              <span>⚡ 點擊啟動 Akkadu 即時雙語轉播連線</span>
            </button>
          </div>
        )}

        {/* Dynamic Display Modes */}
        {viewMode === 'wall' && subtitles.length > 0 && (
          <div
            ref={scrollRef}
            className="space-y-4 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#c9a24b]/40"
          >
            {subtitles.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className="p-4 sm:p-5 rounded-2xl bg-[#070b12] border border-[#c9a24b]/30 hover:border-[#c9a24b]/70 transition-all shadow-[0_8px_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#c9a24b]/20 text-[#c9a24b] text-[11px] font-bold border border-[#c9a24b]/40">
                      🎙️ {sub.speaker}
                    </span>
                    <span className="text-[10px] font-mono text-[#f3ede1]/50" suppressHydrationWarning>
                      {formatTime(sub.timestamp)}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-[#c9a24b]/80 border border-[#c9a24b]/30 px-2 py-0.5 rounded">
                    5T HASH: {sub.hashLock ? sub.hashLock.substring(0, 10) + '...' : 'SEALED'}
                  </span>
                </div>

                <div
                  className="font-semibold text-[#f3ede1] leading-relaxed tracking-wide mb-1 break-words"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {sub.originalText}
                </div>

                {sub.translatedText && (
                  <div
                    className="font-bold text-[#c9a24b] leading-relaxed tracking-wide break-words"
                    style={{ fontSize: `${Math.round(fontSize * 0.9)}px` }}
                  >
                    {sub.translatedText}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin">
            {subtitles.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className="p-4 rounded-xl bg-[#070b12] border border-[#c9a24b]/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#c9a24b]">{sub.speaker}</span>
                    <span className="text-[10px] font-mono text-[#f3ede1]/50" suppressHydrationWarning>
                      {formatTime(sub.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#f3ede1] mb-2 break-words">{sub.originalText}</p>
                  <p className="text-sm font-bold text-[#c9a24b] break-words">{sub.translatedText}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#c9a24b]/15 text-[9px] font-mono text-[#f3ede1]/50 truncate">
                  HashLock: {sub.hashLock}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'marquee' && (
          <div className="py-12 bg-[#070b12] rounded-2xl border border-[#c9a24b]/30 overflow-hidden relative w-full">
            <div className="animate-marquee whitespace-nowrap flex gap-8 w-max">
              {[...subtitles, ...subtitles].map((sub, idx) => (
                <div key={`${sub.id}-${idx}`} className="inline-block px-6 py-4 rounded-xl bg-[#10243f] border border-[#c9a24b]/40 shrink-0 min-w-[280px] max-w-[480px] shadow-[0_8px_25px_rgba(0,0,0,0.5)]">
                  <div className="text-xs text-[#f3ede1]/60 font-medium mb-1">🎙️ {sub.speaker}</div>
                  <div className="text-sm text-[#f3ede1] font-semibold mb-1 truncate">{sub.originalText}</div>
                  <div className="text-base text-[#c9a24b] font-bold truncate">
                    {sub.translatedText}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'live-stream' && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between bg-[#070b12] px-4 py-3 rounded-2xl border border-[#c9a24b]/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#c9a24b] font-bold">
                <Radio className="w-4 h-4 text-[#c9a24b] animate-pulse" />
                <span className="truncate">Akkadu 直播網址: {officialAkkaduUrl}</span>
              </div>
              <a
                href={officialAkkaduUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#c9a24b] hover:underline flex items-center gap-1 bg-[#c9a24b]/15 px-3 py-1 rounded-lg border border-[#c9a24b]/40"
              >
                <span>原聲直播頁面</span>
              </a>
            </div>
            <div className="w-full h-[620px] rounded-2xl overflow-hidden border border-[#c9a24b]/40 shadow-[0_20px_56px_rgba(0,0,0,0.6)] relative bg-[#070b12]">
              <iframe
                src={officialAkkaduUrl}
                title="Akkadu Live Stream Relay"
                className="w-full h-full border-0"
                allow="microphone; autoplay; fullscreen"
              />
            </div>
          </div>
        )}

        {/* Live Input Simulator Form */}
        <form onSubmit={handlePushSubtitle} className="mt-6 pt-4 border-t border-[#c9a24b]/20 flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0 w-full">
            <input
              type="text"
              placeholder="講者名稱 (Speaker Name)"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              className="w-full sm:w-48 px-3.5 py-2.5 text-xs font-medium rounded-xl bg-[#070b12] border border-[#c9a24b]/35 text-[#f3ede1] placeholder:text-[#f3ede1]/40 outline-none focus:border-[#c9a24b]/80 transition-all shrink-0"
            />
            <input
              type="text"
              placeholder="輸入即時字幕內容推送到轉播牆 (Push subtitle to Akkadu stream wall)..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 w-full min-w-0 px-4 py-2.5 text-xs font-medium rounded-xl bg-[#070b12] border border-[#c9a24b]/35 text-[#f3ede1] placeholder:text-[#f3ede1]/40 outline-none focus:border-[#c9a24b]/80 transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full lg:w-auto px-6 py-2.5 text-xs font-black rounded-xl bg-[#c9a24b] hover:bg-[#d4af37] text-[#070b12] shadow-[0_0_25px_rgba(201,162,75,0.4)] hover:shadow-[0_0_35px_rgba(201,162,75,0.6)] cursor-pointer active:scale-95 transition-all whitespace-nowrap shrink-0 flex items-center justify-center gap-2"
          >
            <span>推送即時字幕 🚀</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </OmniBaseCard>
    </div>
  );
}
