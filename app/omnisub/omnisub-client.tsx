'use client';

import React, { useState, useEffect } from 'react';
import {
  Mic,
  ShieldCheck,
  ExternalLink,
  Radio,
  Tv,
  Layers,
  Volume2,
} from 'lucide-react';
import { AkkaduBroadcastWall } from './akkadu-broadcast-wall';
import { ObsOverlay } from './obs-overlay';
import { AudioCapturePanel } from './audio-capture-panel';
import { MultiRoomHub } from './multi-room-hub';

export type SubClientTab = 'broadcast' | 'zoom' | 'obs' | 'multiroom' | 'offline';
export type SubThemeMode = 'dark' | 'light';

export function OmniSubClient() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [tab, setTab] = useState<SubClientTab>('broadcast');
  const [activeRoom, setActiveRoom] = useState('GIHC');
  const [isObsStandalone, setIsObsStandalone] = useState(false);
  const [themeMode, setThemeMode] = useState<SubThemeMode>('dark');

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      const r = params.get('room');
      const t = params.get('theme');
      if (r) setActiveRoom(r.toUpperCase());
      if (t === 'light' || t === 'dark') setThemeMode(t);
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
      <div className="flex flex-col min-h-screen bg-[var(--bg)] text-[var(--text-1)] items-center justify-center p-6 font-mono">
        <div className="flex items-center gap-3 text-[var(--accent-cool)] text-base">
          <Mic className="w-5 h-5 animate-pulse" />
          <span>OmniSub 系統載入中...</span>
        </div>
      </div>
    );
  }

  // 若以 ?view=obs 開啟，直接輸出無干擾的 OBS 瀏覽器來源 (全透明/純字幕)
  if (isObsStandalone) {
    return <ObsOverlay roomCode={activeRoom} />;
  }

  const isDark = themeMode === 'dark';

  return (
    <div
      className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${
        isDark ? 'dark bg-[#0a0b0e] text-[#ebecef]' : 'bg-[#f8fafc] text-[#0f172a]'
      }`}
    >
      {/* Top Navigation & Status Bar */}
      <header
        className={`flex flex-wrap items-center justify-between px-6 py-4 border-b z-20 shrink-0 transition-colors ${
          isDark
            ? 'bg-[#111217] border-[rgba(67,70,81,0.5)]'
            : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDark
                ? 'bg-[rgba(94,234,212,0.12)] border-[rgba(94,234,212,0.3)] text-[#5EEAD4]'
                : 'bg-[rgba(13,148,136,0.1)] border-[rgba(13,148,136,0.35)] text-[#0d9488]'
            }`}
          >
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className={`font-bold text-lg tracking-tight ${
                  isDark ? 'text-[#ebecef]' : 'text-[#0f172a]'
                }`}
              >
                OmniSub.esggo.co 萬能即時語音與多會場轉播總控
              </h1>
              <span
                className={`text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'bg-[#171921] text-[#5EEAD4] border-[rgba(94,234,212,0.3)]'
                    : 'bg-[#f1f5f9] text-[#0d9488] border-[rgba(13,148,136,0.35)]'
                }`}
              >
                ROOM: {activeRoom}
              </span>
            </div>
            <p
              className={`text-xs font-mono mt-0.5 ${
                isDark ? 'text-[#8d909c]' : 'text-[#64748b]'
              }`}
            >
              Zoom 系統音串流 • OBS 綠幕透明浮層 • 繁中 ⇄ English 雙向對翻 • 5T 密碼學刻印
            </p>
          </div>
        </div>

        {/* 頂部導航分頁 Switcher & 主題開關 */}
        <div className="flex items-center gap-3 mt-3 sm:mt-0 flex-wrap">
          {/* 主題切換按鈕 (淺色 / 深色) */}
          <div
            className={`flex items-center p-1 rounded-full border ${
              isDark
                ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]'
                : 'bg-[#f1f5f9] border-[rgba(100,116,139,0.25)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                isDark
                  ? 'bg-[#5EEAD4] text-[#0a0b0e] font-semibold'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              深色手冊 (Dark)
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all cursor-pointer ${
                !isDark
                  ? 'bg-[#0d9488] text-[#ffffff] font-semibold'
                  : 'text-[#8d909c] hover:text-[#ebecef]'
              }`}
            >
              清新典雅 (Light)
            </button>
          </div>

          <div
            className={`flex items-center gap-1 p-1 rounded-full border ${
              isDark
                ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]'
                : 'bg-[#f1f5f9] border-[rgba(100,116,139,0.25)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setTab('broadcast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                tab === 'broadcast'
                  ? isDark
                    ? 'bg-[#242836] text-[#5EEAD4] font-semibold'
                    : 'bg-[#ffffff] text-[#0d9488] font-semibold shadow-sm'
                  : isDark
                  ? 'text-[#8d909c] hover:text-[#ebecef]'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              轉播字幕牆
            </button>

            <button
              type="button"
              onClick={() => setTab('zoom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                tab === 'zoom'
                  ? isDark
                    ? 'bg-[#242836] text-[#5EEAD4] font-semibold'
                    : 'bg-[#ffffff] text-[#0d9488] font-semibold shadow-sm'
                  : isDark
                  ? 'text-[#8d909c] hover:text-[#ebecef]'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              Zoom / 系統音
            </button>

            <button
              type="button"
              onClick={() => setTab('obs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                tab === 'obs'
                  ? isDark
                    ? 'bg-[#242836] text-[#5EEAD4] font-semibold'
                    : 'bg-[#ffffff] text-[#0d9488] font-semibold shadow-sm'
                  : isDark
                  ? 'text-[#8d909c] hover:text-[#ebecef]'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              OBS 懸浮窗
            </button>

            <button
              type="button"
              onClick={() => setTab('multiroom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                tab === 'multiroom'
                  ? isDark
                    ? 'bg-[#242836] text-[#5EEAD4] font-semibold'
                    : 'bg-[#ffffff] text-[#0d9488] font-semibold shadow-sm'
                  : isDark
                  ? 'text-[#8d909c] hover:text-[#ebecef]'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              多房間總控
            </button>

            <button
              type="button"
              onClick={() => setTab('offline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                tab === 'offline'
                  ? isDark
                    ? 'bg-[#242836] text-[#5EEAD4] font-semibold'
                    : 'bg-[#ffffff] text-[#0d9488] font-semibold shadow-sm'
                  : isDark
                  ? 'text-[#8d909c] hover:text-[#ebecef]'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              單機 STT
            </button>
          </div>

          <div
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono ${
              isDark
                ? 'bg-[#111217] border-[rgba(67,70,81,0.5)] text-[#5EEAD4]'
                : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] text-[#0d9488]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
            <span suppressHydrationWarning>
              5T: {status?.hashLock ? status.hashLock.substring(0, 8) + '...' : 'SEALED'}
            </span>
          </div>

          <a
            href={`/omnisub?view=obs&room=${encodeURIComponent(activeRoom)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full border text-xs font-medium transition-all ${
              isDark
                ? 'bg-[rgba(94,234,212,0.12)] text-[#5EEAD4] border-[rgba(94,234,212,0.3)] hover:bg-[rgba(94,234,212,0.2)]'
                : 'bg-[rgba(13,148,136,0.1)] text-[#0d9488] border-[rgba(13,148,136,0.35)] hover:bg-[rgba(13,148,136,0.18)]'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            OBS 直通窗
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
        {tab === 'broadcast' && (
          <AkkaduBroadcastWall currentTheme={themeMode} onThemeChange={setThemeMode} />
        )}

        {tab === 'zoom' && (
          <div className="space-y-6">
            <AudioCapturePanel roomCode={activeRoom} currentTheme={themeMode} />
            <div
              className={`rounded-2xl border p-4 ${
                isDark
                  ? 'border-[rgba(67,70,81,0.5)] bg-[#111217]'
                  : 'border-[rgba(100,116,139,0.25)] bg-[#ffffff] shadow-sm'
              }`}
            >
              <h3
                className={`text-sm font-semibold mb-3 ${
                  isDark ? 'text-[#5EEAD4]' : 'text-[#0d9488]'
                }`}
              >
                目前房間 [{activeRoom}] 現場字幕即時預覽:
              </h3>
              <div className="h-[450px] overflow-hidden rounded-xl">
                <ObsOverlay roomCode={activeRoom} defaultBg="black" currentTheme={themeMode} />
              </div>
            </div>
          </div>
        )}

        {tab === 'obs' && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                isDark
                  ? 'bg-[#111217] border-[rgba(67,70,81,0.5)]'
                  : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] shadow-sm'
              }`}
            >
              <div>
                <h3
                  className={`text-sm font-semibold ${
                    isDark ? 'text-[#5EEAD4]' : 'text-[#0d9488]'
                  }`}
                >
                  OBS 瀏覽器來源 (Browser Source) 專用視窗
                </h3>
                <p
                  className={`text-xs ${
                    isDark ? 'text-[#8d909c]' : 'text-[#64748b]'
                  }`}
                >
                  可直接在 OBS 中新增「瀏覽器來源」，貼上專用網址並啟用透明背景。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.open(
                        `/omnisub?view=obs&room=${encodeURIComponent(activeRoom)}`,
                        `OmniSub_${activeRoom}`,
                        'width=1100,height=380,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
                      );
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    isDark
                      ? 'bg-[#5EEAD4] text-[#0a0b0e] hover:bg-[#8CF5E3]'
                      : 'bg-[#0d9488] text-[#ffffff] hover:bg-[#0f766e]'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  彈出獨立懸浮小窗 (可拖曳移動)
                </button>
                <a
                  href={`/omnisub?view=obs&room=${encodeURIComponent(activeRoom)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-3.5 py-2 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isDark
                      ? 'bg-[#171921] text-[#ebecef] border-[rgba(67,70,81,0.5)] hover:bg-[#242836]'
                      : 'bg-[#f1f5f9] text-[#0f172a] border-[rgba(100,116,139,0.25)] hover:bg-[#e2e8f0]'
                  }`}
                >
                  全螢幕視圖
                </a>
              </div>
            </div>
            <div
              className={`h-[650px] rounded-2xl overflow-hidden border relative ${
                isDark
                  ? 'border-[rgba(67,70,81,0.5)] bg-[#07080b]'
                  : 'border-[rgba(100,116,139,0.25)] bg-[#000000]'
              }`}
            >
              <ObsOverlay roomCode={activeRoom} defaultBg="black" currentTheme={themeMode} />
            </div>
          </div>
        )}

        {tab === 'multiroom' && (
          <MultiRoomHub
            activeRoom={activeRoom}
            currentTheme={themeMode}
            onSelectRoom={(code) => {
              setActiveRoom(code);
              setTab('broadcast');
            }}
          />
        )}

        {tab === 'offline' && (
          <div
            className={`w-full h-[80vh] rounded-2xl overflow-hidden border relative ${
              isDark
                ? 'border-[rgba(67,70,81,0.5)] bg-[#07080b]'
                : 'border-[rgba(100,116,139,0.25)] bg-[#ffffff]'
            }`}
          >
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
