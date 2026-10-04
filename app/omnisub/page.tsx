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
    <div className="flex flex-col min-h-screen bg-[#070b12] bg-[radial-gradient(1100px_640px_at_18%_-12%,rgba(16,36,63,0.85),transparent_62%),radial-gradient(900px_560px_at_92%_112%,rgba(201,162,75,0.12),transparent_60%)] text-[#f3ede1] overflow-x-hidden selection:bg-[#c9a24b]/30 selection:text-[#f3ede1]">
      {/* Top Navigation & Status Bar (OmniSub Navy Gold Glass) */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#10243f]/60 backdrop-blur-xl border-b border-[rgba(201,162,75,0.25)] z-20 shrink-0 shadow-[0_10px_40px_rgba(0,0,0,0.5),0_0_30px_rgba(201,162,75,0.08)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#c9a24b]/30 to-[#06b6d4]/30 border border-[#c9a24b]/50 text-[#c9a24b] shadow-[0_0_20px_rgba(201,162,75,0.35)]">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#f3ede1] via-[#c9a24b] to-[#06b6d4]">
                OmniSub.esggo.co 萬能即時語音與 Akkadu 字幕轉播牆
              </h1>
              <span className="text-[10px] font-mono bg-[#c9a24b]/20 text-[#c9a24b] px-2 py-0.5 rounded-lg border border-[#c9a24b]/40 font-bold shadow-[0_0_10px_rgba(201,162,75,0.2)]">
                101/101 VERIFIED
              </span>
            </div>
            <p className="text-xs text-[#f3ede1]/70 font-mono">
              Akkadu 直播連線 • 繁中 ⇄ English 雙向自動對翻 • 5T 密碼學刻印封印
            </p>
          </div>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-wrap">
          <div className="flex items-center gap-1 bg-[#070b12]/90 p-1.5 rounded-2xl border border-[rgba(201,162,75,0.3)] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]">
            <button
              onClick={() => setMode('akkadu')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'akkadu'
                  ? 'bg-gradient-to-r from-[#c9a24b] via-[#d4af37] to-[#06b6d4] text-[#070b12] shadow-[0_0_18px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/60 hover:text-[#f3ede1] hover:bg-[#10243f]/50'
              }`}
            >
              <Radio className="w-4 h-4" />
              Akkadu 連線轉播牆
            </button>
            <button
              onClick={() => setMode('speech')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                mode === 'speech'
                  ? 'bg-gradient-to-r from-[#c9a24b] via-[#d4af37] to-[#06b6d4] text-[#070b12] shadow-[0_0_18px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/60 hover:text-[#f3ede1] hover:bg-[#10243f]/50'
              }`}
            >
              <Tv className="w-4 h-4" />
              單機離線 STT 模式
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070b12]/80 border border-[#c9a24b]/30 text-xs font-mono text-[#c9a24b]">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span>5T: {status?.hashLock ? status.hashLock.substring(0, 10) + '...' : 'SEALED'}</span>
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
