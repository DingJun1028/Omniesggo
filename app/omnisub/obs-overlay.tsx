'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AkkaduSubtitle, LangViewMode } from './akkadu-broadcast-wall';

interface ObsOverlayProps {
  roomCode?: string;
  defaultBg?: 'transparent' | 'chroma-green' | 'black';
  defaultFontSize?: number;
  maxLines?: number;
  langMode?: LangViewMode;
  showBadge?: boolean;
}

export function ObsOverlay({
  roomCode = 'GIHC',
  defaultBg = 'transparent',
  defaultFontSize = 32,
  maxLines = 2,
  langMode = 'bilingual',
  showBadge = true,
}: ObsOverlayProps) {
  const [subtitles, setSubtitles] = useState<AkkaduSubtitle[]>([]);
  const [currentRoom, setCurrentRoom] = useState(roomCode);
  const [fontSize, setFontSize] = useState(defaultFontSize);
  const [bgColor, setBgColor] = useState(defaultBg);
  const [linesLimit, setLinesLimit] = useState(maxLines);
  const [lang, setLang] = useState<LangViewMode>(langMode);
  const [badgeVisible, setBadgeVisible] = useState(showBadge);
  const [showConfig, setShowConfig] = useState(false);

  // 讀取 URL 參數自定義覆寫
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const r = params.get('room');
      if (r) setCurrentRoom(r.toUpperCase());
      const fs = params.get('size');
      if (fs && !isNaN(Number(fs))) setFontSize(Number(fs));
      const bg = params.get('bg');
      if (bg === 'green' || bg === 'chroma-green') setBgColor('chroma-green');
      if (bg === 'black') setBgColor('black');
      const l = params.get('lines');
      if (l && !isNaN(Number(l))) setLinesLimit(Number(l));
      const lm = params.get('lang');
      if (lm === 'zh' || lm === 'en' || lm === 'bilingual') setLang(lm);
      const b = params.get('badge');
      if (b === '0' || b === 'false') setBadgeVisible(false);
    }
  }, []);

  // 輪詢獲取房間最新字幕
  useEffect(() => {
    let active = true;
    const fetchLatest = async () => {
      try {
        const res = await fetch(`/api/omnisub/akkadu?room=${encodeURIComponent(currentRoom)}`);
        if (!res.ok) return;
        const result = await res.json();
        const data = result.data || result;
        const items = data.subtitles || [];
        if (active && Array.isArray(items)) {
          setSubtitles(items.slice(-linesLimit));
        }
      } catch (err) {
        console.warn('[OBS Overlay] fetch error:', err);
      }
    };

    fetchLatest();
    const timer = setInterval(fetchLatest, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [currentRoom, linesLimit]);

  const bgStyles: Record<string, string> = {
    transparent: 'bg-transparent',
    'chroma-green': 'bg-[#00FF00]',
    black: 'bg-black/90',
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col justify-end p-6 select-none overflow-hidden transition-colors ${
        bgStyles[bgColor] || 'bg-transparent'
      }`}
      style={{
        textShadow:
          '0 2px 4px rgba(0,0,0,0.9), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 0 0 16px rgba(0,0,0,0.85)',
      }}
    >
      {/* 快捷控制懸浮按鈕 (滑鼠移入時顯示，OBS 預覽設定用) */}
      <div className="fixed top-4 right-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="px-3 py-1.5 bg-black/80 hover:bg-black text-[#f3ede1] text-xs font-mono rounded-lg border border-white/20 backdrop-blur shadow-lg cursor-pointer"
        >
          {showConfig ? '隱藏 OBS 設定' : '⚙️ OBS 參數設定'}
        </button>

        {showConfig && (
          <div className="mt-2 p-4 bg-[#0a0f1d]/95 border border-[#c9a24b]/40 rounded-xl text-xs text-white space-y-3 shadow-2xl backdrop-blur-md w-64">
            <div className="font-bold text-[#c9a24b] border-b border-white/10 pb-1">
              OBS 懸浮窗設定 (房號: {currentRoom})
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">背景模式:</label>
              <div className="grid grid-cols-3 gap-1">
                {(['transparent', 'chroma-green', 'black'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBgColor(b)}
                    className={`py-1 rounded text-[10px] font-mono border ${
                      bgColor === b
                        ? 'bg-[#c9a24b] text-black border-[#c9a24b] font-bold'
                        : 'bg-black/50 text-gray-300 border-white/10'
                    }`}
                  >
                    {b === 'transparent' ? '全透明' : b === 'chroma-green' ? '綠幕' : '黑底'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                字級大小: {fontSize}px
              </label>
              <input
                type="range"
                min="20"
                max="64"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full accent-[#c9a24b]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">
                最多保留行數: {linesLimit} 行
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setLinesLimit(n)}
                    className={`flex-1 py-1 rounded text-center text-[10px] font-mono border ${
                      linesLimit === n
                        ? 'bg-[#c9a24b] text-black border-[#c9a24b] font-bold'
                        : 'bg-black/50 text-gray-300 border-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[11px] text-gray-400 mb-1">語言模式:</label>
              <div className="grid grid-cols-3 gap-1">
                {(['bilingual', 'zh', 'en'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLang(m)}
                    className={`py-1 rounded text-[10px] font-mono border ${
                      lang === m
                        ? 'bg-[#c9a24b] text-black border-[#c9a24b] font-bold'
                        : 'bg-black/50 text-gray-300 border-white/10'
                    }`}
                  >
                    {m === 'bilingual' ? '雙語' : m === 'zh' ? '中文' : '英文'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5T 防偽驗證浮水印標籤 (可選) */}
      {badgeVisible && (
        <div className="flex items-center gap-2 mb-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 w-fit">
          <div className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
          <span className="text-[11px] font-mono text-[#c9a24b] font-bold tracking-wider">
            OMNISUB LIVE • 5T CERTIFIED • ROOM: {currentRoom}
          </span>
        </div>
      )}

      {/* 字幕顯示區域 (最新項目置底) */}
      <div className="space-y-4 max-w-6xl w-full mx-auto">
        {subtitles.length === 0 ? (
          <div className="text-white/60 font-mono text-center py-6 text-sm animate-pulse">
            等待即時語音或講者發言... (房號: {currentRoom})
          </div>
        ) : (
          subtitles.map((sub, idx) => (
            <div
              key={sub.id || idx}
              className="transition-all duration-300 transform translate-y-0 opacity-100 font-sans"
            >
              {/* 講者標籤 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#c9a24b] bg-black/70 px-2 py-0.5 rounded border border-[#c9a24b]/40">
                  {sub.speaker || '即時講者'}
                </span>
                <span className="text-[10px] font-mono text-white/50">
                  {new Date(sub.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* 中文 / 原文 */}
              {(lang === 'bilingual' || lang === 'zh') && (
                <div
                  className="font-bold text-[#f8fafc] leading-snug tracking-wide"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {sub.originalText}
                </div>
              )}

              {/* 英文 / 譯文 */}
              {(lang === 'bilingual' || lang === 'en') && (
                <div
                  className="font-medium text-[#fde047] leading-snug tracking-wide mt-1"
                  style={{ fontSize: `${Math.round(fontSize * 0.88)}px` }}
                >
                  {sub.translatedText || sub.originalText}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
