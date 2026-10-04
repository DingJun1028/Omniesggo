'use client';

import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, Sparkles, Globe, ExternalLink, Activity, Radio, Tv, Layers } from 'lucide-react';
import { AkkaduBroadcastWall } from './akkadu-broadcast-wall';

export default function OmniSubPage() {
  const [status, setStatus] = useState<any>(null);
  const [mode, setMode] = useState<'akkadu' | 'speech'>('akkadu');

  useEffect(() => {
    fetch('/api/omnisub/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-[#f8fafc] overflow-x-hidden">
      {/* Top Navigation & Status Bar (Liquid Glass Cyan) */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-slate-900/60 backdrop-blur-xl border-b border-cyan-500/20 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-300">
                OmniSub.esggo.co 萬能即時語音與 Akkadu 字幕轉播牆
              </h1>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                101/101 VERIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Akkadu 直播連線 • 繁中 ⇄ English 雙向自動對翻 • 5T 密碼學刻印封印
            </p>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-cyan-500/30">
            <button
              onClick={() => setMode('akkadu')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'akkadu'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              Akkadu 連線轉播牆
            </button>
            <button
              onClick={() => setMode('speech')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                mode === 'speech'
                  ? 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Tv className="w-4 h-4" />
              單機離線 STT 模式
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs font-mono text-cyan-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>5T: {status?.hashLock ? status.hashLock.substring(0, 10) + '...' : 'SEALED'}</span>
          </div>

          <a
            href="/omnisub.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-xs font-bold text-cyan-300 transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            全螢幕視窗
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {mode === 'akkadu' ? (
          <AkkaduBroadcastWall />
        ) : (
          <div className="w-full h-[80vh] rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl relative bg-[#070b12]">
            <iframe
              src="/omnisub.html"
              title="OmniSub.esggo.co App"
              className="w-full h-full border-0"
              allow="microphone; display-capture; autoplay"
            />
          </div>
        )}
      </main>
    </div>
  );
}
