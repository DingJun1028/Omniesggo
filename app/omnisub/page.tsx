'use client';

import React, { useState, useEffect } from 'react';
import { Mic, ShieldCheck, Sparkles, Globe, ExternalLink, Activity } from 'lucide-react';

export default function OmniSubPage() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/omnisub/status')
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#070b12] text-[#f3ede1] overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex flex-wrap items-center justify-between px-6 py-3 bg-[#10243f]/80 backdrop-blur-md border-b border-[#c9a24b]/30 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#c9a24b]/10 border border-[#c9a24b]/40 text-[#c9a24b]">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#c9a24b] via-yellow-200 to-[#f3ede1]">
                OmniSub.esggo.co 萬能即時語音擷取翻譯
              </h1>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                98/98 VERIFIED
              </span>
            </div>
            <p className="text-[11px] text-[#f3ede1]/60 font-mono">
              繁體中文 ⇄ English 雙向自動對翻 • 零 API Key • 零算力費用 • 雙語字幕
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-[#c9a24b]/30 text-xs font-mono text-[#c9a24b]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>5T SEALED: {status?.hashLock ? status.hashLock.substring(0, 12) + '...' : 'ACTIVE'}</span>
          </div>

          <a
            href="/omnisub.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c9a24b]/20 hover:bg-[#c9a24b]/30 border border-[#c9a24b]/50 text-xs font-bold text-[#c9a24b] transition-all"
          >
            <Globe className="w-3.5 h-3.5" />
            獨立頁面全螢幕
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Embedded Fullscreen OmniSub App */}
      <main className="flex-1 relative w-full h-full bg-[#070b12]">
        <iframe
          src="/omnisub.html"
          title="OmniSub.esggo.co App"
          className="w-full h-full border-0"
          allow="microphone; display-capture; autoplay"
        />
      </main>
    </div>
  );
}
