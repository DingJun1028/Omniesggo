'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  ShieldCheck,
  Globe,
  ExternalLink,
  Radio,
  Tv,
  Layers,
  Volume2,
  Sliders,
} from 'lucide-react';
import { AkkaduBroadcastWall } from './akkadu-broadcast-wall';
import { ObsOverlay } from './obs-overlay';
import { AudioCapturePanel } from './audio-capture-panel';
import { MultiRoomHub } from './multi-room-hub';

export type SubClientTab = 'broadcast' | 'zoom' | 'obs' | 'multiroom' | 'offline';

export function OmniSubClient() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [tab, setTab] = useState<SubClientTab>('broadcast');
  const [activeRoom, setActiveRoom] = useState('GIHC');
  const [isObsStandalone, setIsObsStandalone] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const r = params.get('room');
      if (r) setActiveRoom(r.toUpperCase());
      if (view === 'obs' || view === 'overlay') {
        setIsObsStandalone(true);
      }
    }

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

  // 若以 ?view=obs 開啟，直接輸出無干擾的 OBS 瀏覽器來源 (全透明/純字幕)
  if (isObsStandalone) {
    return <ObsOverlay roomCode={activeRoom} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#070b12] text-[#f3ede1] overflow-x-hidden selection:bg-[#c9a24b]/30 selection:text-[#f3ede1]">
      {/* Top Navigation & Status Bar */}
      <header className="flex flex-wrap items-center justify-between px-6 py-4 bg-[#10243f] border-b border-[#c9a24b]/30 z-20 shrink-0 shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#c9a24b]/20 border border-[#c9a24b]/50 text-[#c9a24b] shadow-[0_0_20px_rgba(201,162,75,0.3)]">
            <Mic className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="font-black text-xl tracking-tight text-[#c9a24b]">
                OmniSub.esggo.co 萬能即時語音與多會場轉播總控
              </h1>
              <span className="text-[10px] font-mono bg-[#c9a24b]/20 text-[#c9a24b] px-2.5 py-0.5 rounded-lg border border-[#c9a24b]/40 font-bold whitespace-nowrap shrink-0 shadow-[0_0_12px_rgba(201,162,75,0.25)]">
                ROOM: {activeRoom}
              </span>
            </div>
            <p className="text-xs text-[#f3ede1]/70 font-mono mt-0.5">
              Zoom 系統音串流 • OBS 綠幕透明浮層 • 繁中 ⇄ English 雙向對翻 • 5T 密碼學刻印
            </p>
          </div>
        </div>

        {/* 頂部導航分頁 Switcher */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-wrap">
          <div className="flex items-center gap-1 bg-[#070b12] p-1.5 rounded-2xl border border-[#c9a24b]/35 shadow-[inset_0_2px_8px_rgba(0,0,0,0.7)]">
            <button
              type="button"
              onClick={() => setTab('broadcast')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                tab === 'broadcast'
                  ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_20px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/65 hover:text-[#f3ede1] hover:bg-[#10243f]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              轉播字幕牆
            </button>

            <button
              type="button"
              onClick={() => setTab('zoom')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                tab === 'zoom'
                  ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_20px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/65 hover:text-[#f3ede1] hover:bg-[#10243f]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              Zoom / 系統音
            </button>

            <button
              type="button"
              onClick={() => setTab('obs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                tab === 'obs'
                  ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_20px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/65 hover:text-[#f3ede1] hover:bg-[#10243f]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              OBS 懸浮窗
            </button>

            <button
              type="button"
              onClick={() => setTab('multiroom')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                tab === 'multiroom'
                  ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_20px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/65 hover:text-[#f3ede1] hover:bg-[#10243f]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              多房間總控
            </button>

            <button
              type="button"
              onClick={() => setTab('offline')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                tab === 'offline'
                  ? 'bg-[#c9a24b] text-[#070b12] shadow-[0_0_20px_rgba(201,162,75,0.5)]'
                  : 'text-[#f3ede1]/65 hover:text-[#f3ede1] hover:bg-[#10243f]'
              }`}
            >
              單機 STT
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070b12]/90 border border-[#c9a24b]/35 text-xs font-mono text-[#c9a24b]">
            <ShieldCheck className="w-4 h-4 text-[#3c6e47]" />
            <span suppressHydrationWarning>
              5T: {status?.hashLock ? status.hashLock.substring(0, 8) + '...' : 'SEALED'}
            </span>
          </div>

          <a
            href={`/omnisub?view=obs&room=${encodeURIComponent(activeRoom)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c9a24b]/15 hover:bg-[#c9a24b]/25 border border-[#c9a24b]/40 text-xs font-bold text-[#c9a24b] transition-all shadow-[0_0_12px_rgba(201,162,75,0.2)]"
          >
            <Tv className="w-3.5 h-3.5" />
            OBS 直通窗
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {tab === 'broadcast' && <AkkaduBroadcastWall />}

        {tab === 'zoom' && (
          <div className="space-y-6">
            <AudioCapturePanel roomCode={activeRoom} />
            <div className="rounded-2xl border border-white/10 bg-[#0a0f1d]/80 p-4">
              <h3 className="text-sm font-bold text-[#c9a24b] mb-3">
                目前房間 [{activeRoom}] 現場字幕即時預覽:
              </h3>
              <div className="h-[450px] overflow-hidden rounded-xl">
                <ObsOverlay roomCode={activeRoom} defaultBg="black" />
              </div>
            </div>
          </div>
        )}

        {tab === 'obs' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#10243f]/90 border border-[#c9a24b]/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#c9a24b]">
                  OBS 瀏覽器來源 (Browser Source) 專用視窗
                </h3>
                <p className="text-xs text-gray-300">
                  可直接在 OBS 中新增「瀏覽器來源」，貼上專用網址並啟用透明背景。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/omnisub?view=obs&room=${encodeURIComponent(activeRoom)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-[#c9a24b] hover:bg-[#b89139] text-black text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  開啟獨立 OBS 視窗
                </a>
              </div>
            </div>
            <div className="h-[650px] rounded-2xl overflow-hidden border border-[#c9a24b]/30 shadow-2xl relative">
              <ObsOverlay roomCode={activeRoom} defaultBg="black" />
            </div>
          </div>
        )}

        {tab === 'multiroom' && (
          <MultiRoomHub
            activeRoom={activeRoom}
            onSelectRoom={(code) => {
              setActiveRoom(code);
              setTab('broadcast');
            }}
          />
        )}

        {tab === 'offline' && (
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
