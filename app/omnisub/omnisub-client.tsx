'use client';

import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, Globe, ExternalLink, Radio, Tv } from 'lucide-react';
import { AkkaduBroadcastWall } from './akkadu-broadcast-wall';

export function OmniSubClient() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [mode, setMode] = useState<'akkadu' | 'speech'>('akkadu');

  useEffect(() => {
    setMounted(true);
    fetch('/api/omnisub/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-col min-h-screen bg-[#070b12] text-[#f3ede1] items-center justify-center p-6 font-mono">
        <div className="flex items-center gap-3 text-[#c9a24b] text-base animate-pulse">
          <Mic className="w-6 h-6" />
          <span>OmniSub 系統載入中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070b12] text-[#f3ede1] overflow-x-hidden selection:bg-[#c9a24b]/30 selection:text-[#f3ede1]">
      {/* Top Navigation & Status Bar (OmniSub Solid Theme - No Gradients) */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#10243f] border-b border-[#c9a24b]/30 z-20 shrink-0 shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#c9a24b]/20 border border-[#c9a24b]/50 text-[#c9a24b] shadow-[0_0_20px_rgba(201,162,75,0.3)]">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-black text-xl tracking-tight text-[#c9a24b]">
                OmniSub.esggo.co 萬能即時語音與 Akkadu 字幕轉播牆
              </h1>
              <span className="text-[10px] font-mono bg-[#c9a24b]/20 text-[#c9a24b] px-2.5 py-0.5 rounded-lg border border-[#c9a24b]/40 font-bold whitespace-nowrap shrink-0 shadow-[0_0_12px_rgba(201,162,75,0.25)]">
                101/101 VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#f3ede1]/70 font-mono mt-0.5">
              Akkadu 直播連線 • 繁中 ⇄ English 雙向自動對翻 • 5T 密碼學刻印封印
            </p>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-wrap">
          <div className="flex items-center gap-1 bg-[#070b12] p-1.5 rounded-2xl border border-[#c9a24b]/35 shadow-[inset_0_2px_8px_rgba(0,0,0,0.7)]">
            <button
              type="button"
              onClick={() => setMode('akkadu')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'akkadu'
                  ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_20px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/65 hover:text-[#f3ede1] hover:bg-[#10243f]'
              }`}
            >
              <Radio className="w-4 h-4" />
              Akkadu 連線轉播牆
            </button>
            <button
              type="button"
              onClick={() => setMode('speech')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'speech'
                  ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_20px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/65 hover:text-[#f3ede1] hover:bg-[#10243f]'
              }`}
            >
              <Tv className="w-4 h-4" />
              單機離線 STT 模式
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070b12]/90 border border-[#c9a24b]/35 text-xs font-mono text-[#c9a24b]">
            <ShieldCheck className="w-4 h-4 text-[#3c6e47]" />
            <span suppressHydrationWarning>5T: {status?.hashLock ? status.hashLock.substring(0, 10) + '...' : 'SEALED'}</span>
          </div>

          <a
            href="/omnisub.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c9a24b]/15 hover:bg-[#c9a24b]/25 border border-[#c9a24b]/40 text-xs font-bold text-[#c9a24b] transition-all shadow-[0_0_12px_rgba(201,162,75,0.2)]"
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
          <div className="w-full h-[80vh] rounded-2xl overflow-hidden border border-[#c9a24b]/30 shadow-[0_20px_56px_rgba(0,0,0,0.6),0_0_42px_rgba(201,162,75,0.12)] relative bg-[#070b12]">
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
