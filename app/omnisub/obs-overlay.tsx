'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GripHorizontal,
  Move,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  AlignVerticalJustifyCenter,
  ExternalLink,
  Settings,
  X,
} from 'lucide-react';
import { AkkaduSubtitle, LangViewMode } from './akkadu-broadcast-wall';

interface ObsOverlayProps {
  roomCode?: string;
  defaultBg?: 'transparent' | 'chroma-green' | 'black';
  defaultFontSize?: number;
  maxLines?: number;
  langMode?: LangViewMode;
  showBadge?: boolean;
}

type AnchorPosition = 'bottom' | 'center' | 'top' | 'free';

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

  // 拖曳與自由定位狀態
  const [anchor, setAnchor] = useState<AnchorPosition>('bottom');
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number }>({
    startMouseX: 0,
    startMouseY: 0,
    startPosX: 0,
    startPosY: 0,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // 讀取 URL 參數與記憶中的位置
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

      // 讀取先前儲存的自訂座標
      try {
        const savedPos = localStorage.getItem('omnisub_obs_pos');
        if (savedPos) {
          const parsed = JSON.parse(savedPos);
          if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
            setPos(parsed);
            setAnchor('free');
          }
        }
      } catch {}
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

  // 滑鼠拖曳處理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 忽略按鈕等互動元素的點擊
    if ((e.target as HTMLElement).closest('button, input, select, a')) return;
    e.preventDefault();
    setIsDragging(true);
    setAnchor('free');

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  }, [pos]);

  // 觸控拖曳處理 (平板 / 觸控螢幕)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, a')) return;
    if (e.touches.length !== 1) return;
    setIsDragging(true);
    setAnchor('free');

    const touch = e.touches[0];
    dragStartRef.current = {
      startMouseX: touch.clientX,
      startMouseY: touch.clientY,
      startPosX: pos.x,
      startPosY: pos.y,
    };
  }, [pos]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.startMouseX;
      const deltaY = e.clientY - dragStartRef.current.startMouseY;
      const newPos = {
        x: dragStartRef.current.startPosX + deltaX,
        y: dragStartRef.current.startPosY + deltaY,
      };
      setPos(newPos);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.startMouseX;
      const deltaY = touch.clientY - dragStartRef.current.startMouseY;
      const newPos = {
        x: dragStartRef.current.startPosX + deltaX,
        y: dragStartRef.current.startPosY + deltaY,
      };
      setPos(newPos);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      try {
        localStorage.setItem('omnisub_obs_pos', JSON.stringify(pos));
      } catch {}
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, pos]);

  // 定位快捷切換
  const setPresetAnchor = (mode: AnchorPosition) => {
    setAnchor(mode);
    setPos({ x: 0, y: 0 });
    try {
      if (mode === 'bottom') localStorage.removeItem('omnisub_obs_pos');
    } catch {}
  };

  // 開啟無邊框獨立彈出視窗
  const openPopoutWindow = () => {
    if (typeof window === 'undefined') return;
    const url = `/omnisub?view=obs&room=${encodeURIComponent(currentRoom)}`;
    window.open(
      url,
      `OmniSub_${currentRoom}`,
      'width=1100,height=380,menubar=no,toolbar=no,location=no,status=no,resizable=yes'
    );
  };

  const bgStyles: Record<string, string> = {
    transparent: 'bg-transparent',
    'chroma-green': 'bg-[#00FF00]',
    black: 'bg-black/90',
  };

  // 判斷容器排版位置
  const anchorLayoutStyles: Record<AnchorPosition, string> = {
    bottom: 'justify-end items-center pb-8',
    center: 'justify-center items-center',
    top: 'justify-start items-center pt-8',
    free: 'justify-start items-start',
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col p-6 select-none overflow-hidden transition-colors ${
        bgStyles[bgColor] || 'bg-transparent'
      } ${anchorLayoutStyles[anchor]}`}
      style={{
        textShadow:
          '0 2px 4px rgba(0,0,0,0.95), -1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000, 0 0 16px rgba(0,0,0,0.9)',
      }}
    >
      {/* 快捷控制懸浮工具列 (常駐微型按鈕，OBS 設定與拖曳說明) */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={openPopoutWindow}
          title="以獨立無邊框漂浮小視窗開啟 (可置頂於 Zoom 或螢幕任意處)"
          className="px-2.5 py-1.5 bg-black/80 hover:bg-[#c9a24b] text-[#f3ede1] hover:text-black text-xs font-mono rounded-lg border border-white/20 backdrop-blur shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">彈出漂浮小窗</span>
        </button>

        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="px-3 py-1.5 bg-black/80 hover:bg-black text-[#c9a24b] text-xs font-mono rounded-lg border border-[#c9a24b]/40 backdrop-blur shadow-lg cursor-pointer flex items-center gap-1.5"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>{showConfig ? '關閉設定' : 'OBS/位置設定'}</span>
        </button>

        {showConfig && (
          <div className="absolute top-10 right-0 p-4 bg-[#0a0f1d]/95 border border-[#c9a24b]/40 rounded-xl text-xs text-white space-y-3 shadow-2xl backdrop-blur-md w-72 z-50">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="font-bold text-[#c9a24b]">OBS 懸浮窗設定 (房號: {currentRoom})</span>
              <button
                type="button"
                onClick={() => setShowConfig(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 位置錨點選擇 */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-mono">
                字幕位置錨點:
              </label>
              <div className="grid grid-cols-4 gap-1">
                <button
                  type="button"
                  onClick={() => setPresetAnchor('top')}
                  className={`py-1 rounded text-[10px] font-mono border flex items-center justify-center gap-0.5 ${
                    anchor === 'top'
                      ? 'bg-[#c9a24b] text-black border-[#c9a24b] font-bold'
                      : 'bg-black/50 text-gray-300 border-white/10'
                  }`}
                >
                  <ArrowUp className="w-3 h-3" />
                  置頂
                </button>
                <button
                  type="button"
                  onClick={() => setPresetAnchor('center')}
                  className={`py-1 rounded text-[10px] font-mono border flex items-center justify-center gap-0.5 ${
                    anchor === 'center'
                      ? 'bg-[#c9a24b] text-black border-[#c9a24b] font-bold'
                      : 'bg-black/50 text-gray-300 border-white/10'
                  }`}
                >
                  <AlignVerticalJustifyCenter className="w-3 h-3" />
                  置中
                </button>
                <button
                  type="button"
                  onClick={() => setPresetAnchor('bottom')}
                  className={`py-1 rounded text-[10px] font-mono border flex items-center justify-center gap-0.5 ${
                    anchor === 'bottom'
                      ? 'bg-[#c9a24b] text-black border-[#c9a24b] font-bold'
                      : 'bg-black/50 text-gray-300 border-white/10'
                  }`}
                >
                  <ArrowDown className="w-3 h-3" />
                  置底
                </button>
                <button
                  type="button"
                  onClick={() => setAnchor('free')}
                  className={`py-1 rounded text-[10px] font-mono border flex items-center justify-center gap-0.5 ${
                    anchor === 'free'
                      ? 'bg-[#c9a24b] text-black border-[#c9a24b] font-bold'
                      : 'bg-black/50 text-gray-300 border-white/10'
                  }`}
                >
                  <Move className="w-3 h-3" />
                  自由拖曳
                </button>
              </div>
            </div>

            {/* 背景模式 */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-mono">背景模式:</label>
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

            {/* 字級大小 */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-mono">
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

            {/* 語言模式 */}
            <div>
              <label className="block text-[11px] text-gray-400 mb-1 font-mono">語言模式:</label>
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

            {/* 座標重設 */}
            {anchor === 'free' && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setPresetAnchor('bottom')}
                  className="w-full py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs text-gray-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  重設位置回預設置底
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5T 防偽驗證浮水印標籤 (可選) */}
      {badgeVisible && (
        <div className="fixed top-4 left-4 z-40 flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10">
          <div className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
          <span className="text-[11px] font-mono text-[#c9a24b] font-bold tracking-wider">
            OMNISUB LIVE • 5T CERTIFIED • ROOM: {currentRoom}
          </span>
        </div>
      )}

      {/* =========================================================================
          可拖曳移動字幕卡片容器 (Draggable Subtitle Container)
         ========================================================================= */}
      <div
        ref={containerRef}
        style={{
          transform: anchor === 'free' ? `translate(${pos.x}px, ${pos.y}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        className={`max-w-5xl w-full mx-auto relative group ${
          isDragging ? 'opacity-90 scale-[1.01] shadow-2xl' : ''
        }`}
      >
        {/* 拖曳把手工具列 (Draggable Handle Bar) */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={`flex items-center justify-between px-3 py-1.5 mb-2 rounded-lg bg-black/70 hover:bg-black/90 border border-white/15 text-xs text-gray-300 transition-all cursor-grab active:cursor-grabbing backdrop-blur-md select-none ${
            isDragging ? 'border-[#c9a24b] bg-black/95 text-[#c9a24b]' : ''
          }`}
          title="按住此處可自由拖曳字幕至螢幕任意位置"
        >
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <GripHorizontal className="w-4 h-4 text-[#c9a24b] shrink-0" />
            <span className="font-bold text-[#c9a24b]">
              {isDragging ? '拖曳移動中...' : '⠿ 按住拖曳移動字幕位置'}
            </span>
            <span className="hidden sm:inline text-white/50">
              (目前錨點: {anchor === 'free' ? '自由定位' : anchor})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPresetAnchor('top')}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 hover:bg-white/20 text-gray-300 cursor-pointer"
              title="快速置頂"
            >
              置頂
            </button>
            <button
              type="button"
              onClick={() => setPresetAnchor('center')}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 hover:bg-white/20 text-gray-300 cursor-pointer"
              title="快速置中"
            >
              置中
            </button>
            <button
              type="button"
              onClick={() => setPresetAnchor('bottom')}
              className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 hover:bg-white/20 text-gray-300 cursor-pointer"
              title="快速置底"
            >
              置底
            </button>
          </div>
        </div>

        {/* 字幕顯示區域 */}
        <div className="space-y-4">
          {subtitles.length === 0 ? (
            <div className="text-white/60 font-mono text-center py-6 text-sm animate-pulse bg-black/40 rounded-xl border border-white/10">
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
                  <span className="text-xs font-mono font-bold text-[#c9a24b] bg-black/80 px-2 py-0.5 rounded border border-[#c9a24b]/40">
                    {sub.speaker || '即時講者'}
                  </span>
                  <span className="text-[10px] font-mono text-white/60">
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
    </div>
  );
}
