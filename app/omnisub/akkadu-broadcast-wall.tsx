'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, Maximize2, Minimize2, Share2, Check, Send } from 'lucide-react';
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
  const [roomCode, setRoomCode] = useState('AKKADU-LIVE-888');
  const [isStreaming, setIsStreaming] = useState(true);
  const [viewMode, setViewMode] = useState<'wall' | 'grid' | 'marquee'>('wall');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState(24);
  const [subtitles, setSubtitles] = useState<AkkaduSubtitle[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inputText, setInputText] = useState('');
  const [speakerName, setSpeakerName] = useState('Akkadu Live Interpreter');

  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className={`w-full transition-all ${isFullscreen ? 'fixed inset-0 z-50 bg-[#020617] p-6 overflow-y-auto flex flex-col justify-between' : ''}`}>
      {/* Akkadu Controller Top Bar (OmniSub Solid Theme - No Gradients) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl bg-[#10243f] border border-[#c9a24b]/30 shadow-[0_20px_56px_rgba(0,0,0,0.6)] mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#c9a24b] flex items-center justify-center text-[#070b12] font-black shadow-[0_0_20px_rgba(201,162,75,0.4)] shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-[#c9a24b]">
                Akkadu 即時連線 · 字幕轉播牆
              </h2>
              <span className="text-[10px] font-mono font-bold bg-[#c9a24b]/20 text-[#c9a24b] px-2.5 py-0.5 rounded-lg border border-[#c9a24b]/40 shrink-0 whitespace-nowrap shadow-[0_0_12px_rgba(201,162,75,0.25)]">
                5T VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#f3ede1]/70 font-medium leading-relaxed">
              Akkadu Live Subtitle Stream • 雙語即時牆 • 5T 密碼學刻印封印
            </p>
          </div>
        </div>

        {/* Room & Mode Settings */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
          <div className="flex items-center gap-2 bg-[#070b12] px-3 py-1.5 rounded-xl border border-[#c9a24b]/40 shrink-0 shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
            <span className="text-xs font-mono text-[#c9a24b] font-bold shrink-0">房號/Stream Code:</span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-28 sm:w-32 bg-transparent text-xs font-mono font-bold text-[#f3ede1] outline-none uppercase tracking-wider"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#070b12] p-1 rounded-xl border border-[#c9a24b]/30 shrink-0">
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
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c9a24b]/15 hover:bg-[#c9a24b]/25 text-[#c9a24b] border border-[#c9a24b]/40 text-xs font-bold transition-all whitespace-nowrap shadow-[0_0_12px_rgba(201,162,75,0.2)]"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-[#3c6e47]" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? '已複製轉播連結' : '分享轉播牆'}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-[#10243f] hover:bg-[#10243f]/80 text-[#f3ede1] border border-[#c9a24b]/35 text-xs font-bold transition-all shrink-0 cursor-pointer"
              title={isFullscreen ? '退出全螢幕' : '全螢幕轉播'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Broadcast Wall Screen */}
      <OmniBaseCard className="!p-4 sm:!p-6 relative overflow-hidden !bg-[#10243f] !border-[#c9a24b]/35 shadow-[0_20px_56px_rgba(0,0,0,0.6)]" statusIndicator="trustworthy">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#c9a24b]/20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3c6e47] animate-ping" />
            <span className="text-xs font-mono font-bold text-[#c9a24b] tracking-wider">
              LIVE BROADCAST STREAM · {roomCode}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[#f3ede1]/70">
            <span>字型大小:</span>
            <input
              type="range"
              min="16"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 accent-[#c9a24b] cursor-pointer"
            />
            <span className="w-8 font-bold text-[#c9a24b]">{fontSize}px</span>
          </div>
        </div>

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
                    <span className="text-[10px] font-mono text-[#f3ede1]/50">
                      {new Date(sub.timestamp).toLocaleTimeString()}
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
                    <span className="text-[10px] font-mono text-[#f3ede1]/50">
                      {new Date(sub.timestamp).toLocaleTimeString()}
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
