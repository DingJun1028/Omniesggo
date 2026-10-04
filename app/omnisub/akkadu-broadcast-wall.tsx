'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Radio, Tv, Maximize2, Minimize2, Share2, Copy, Check, Play, Pause, RefreshCw, Volume2, ShieldCheck, Sparkles, Globe, Layers } from 'lucide-react';
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
  const [connected, setConnected] = useState(true);
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
      {/* Akkadu Controller Top Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300">
                Akkadu 即時連線 · 字幕轉播牆
              </h2>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40">
                5T VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Akkadu Live Subtitle Stream • 雙語即時牆 • 5T 密碼學刻印封印
            </p>
          </div>
        </div>

        {/* Room & Mode Settings */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-cyan-500/30">
            <span className="text-xs font-mono text-cyan-400 font-bold">房號/Stream Code:</span>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-36 bg-transparent text-xs font-mono font-bold text-slate-100 outline-none uppercase"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-cyan-500/30">
            <button
              onClick={() => setViewMode('wall')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'wall' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              轉播牆
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              網格卡片
            </button>
            <button
              onClick={() => setViewMode('marquee')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${viewMode === 'marquee' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'}`}
            >
              跑馬燈
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? '已複製轉播連結' : '分享轉播牆'}
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all"
              title={isFullscreen ? '退出全螢幕' : '全螢幕轉播'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Broadcast Wall Screen */}
      <OmniBaseCard className="!p-6 relative overflow-hidden" statusIndicator="trustworthy">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider">
              LIVE BROADCAST STREAM · {roomCode}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>字型大小:</span>
            <input
              type="range"
              min="16"
              max="48"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span>{fontSize}px</span>
          </div>
        </div>

        {/* Dynamic Display Modes */}
        {viewMode === 'wall' && (
          <div
            ref={scrollRef}
            className="space-y-4 max-h-[550px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyan-500/30"
          >
            {subtitles.map((sub, idx) => (
              <div
                key={sub.id || idx}
                className="p-5 rounded-2xl bg-slate-950/60 border border-cyan-500/30 backdrop-blur-xl hover:border-cyan-400/60 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[11px] font-bold border border-cyan-500/40">
                      🎙️ {sub.speaker}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(sub.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <span className="font-mono text-[10px] text-cyan-500/70 border border-cyan-500/20 px-2 py-0.5 rounded">
                    5T HASH: {sub.hashLock ? sub.hashLock.substring(0, 10) + '...' : 'SEALED'}
                  </span>
                </div>

                <div
                  className="font-semibold text-slate-100 leading-relaxed tracking-wide mb-1"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {sub.originalText}
                </div>

                {sub.translatedText && (
                  <div
                    className="font-bold text-cyan-300 leading-relaxed tracking-wide bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"
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
                className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-cyan-400">{sub.speaker}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {new Date(sub.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-2">{sub.originalText}</p>
                  <p className="text-sm font-bold text-emerald-400">{sub.translatedText}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-cyan-500/10 text-[9px] font-mono text-slate-500 truncate">
                  HashLock: {sub.hashLock}
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'marquee' && (
          <div className="py-12 bg-slate-950/80 rounded-2xl border border-cyan-500/30 overflow-hidden relative">
            <div className="animate-marquee whitespace-nowrap flex gap-8">
              {subtitles.map((sub, idx) => (
                <div key={sub.id || idx} className="inline-block px-6 py-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
                  <div className="text-sm text-slate-300 font-semibold">{sub.originalText}</div>
                  <div className="text-base text-cyan-300 font-bold">{sub.translatedText}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Input Simulator Form */}
        <form onSubmit={handlePushSubtitle} className="mt-6 pt-4 border-t border-cyan-500/20 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="講者名稱 (Speaker Name)"
            value={speakerName}
            onChange={(e) => setSpeakerName(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-xs rounded-xl bg-slate-950/80 border border-cyan-500/30 text-slate-100 outline-none focus:border-cyan-400"
          />
          <input
            type="text"
            placeholder="輸入即時字幕內容推送到轉播牆 (Push subtitle to Akkadu stream wall)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 w-full px-4 py-2 text-xs rounded-xl bg-slate-950/80 border border-cyan-500/30 text-slate-100 outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] whitespace-nowrap"
          >
            推送即時字幕 🚀
          </button>
        </form>
      </OmniBaseCard>
    </div>
  );
}
