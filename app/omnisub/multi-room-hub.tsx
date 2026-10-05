'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  Tv,
  ExternalLink,
  Copy,
  Check,
  Send,
  Download,
  Users,
  Layers,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { OmniBaseCard } from '@/components/omni-base-card';

interface RoomMeta {
  code: string;
  title: string;
  itemCount: number;
  lastSpeaker?: string;
  lastOriginal?: string;
  lastTranslated?: string;
  lastUpdated?: number;
  hashLock?: string;
}

const DEFAULT_ROOMS: RoomMeta[] = [
  { code: 'GIHC', title: '全球永續高峰會 (GIHC 主會場)', itemCount: 0 },
  { code: 'MAIN-STAGE', title: '大會主題演講廳 (Main Stage)', itemCount: 0 },
  { code: 'BREAKOUT-A', title: '平行論壇 A：低碳科技轉型', itemCount: 0 },
  { code: 'BREAKOUT-B', title: '平行論壇 B：自然解方與生物多樣性', itemCount: 0 },
  { code: 'ESG-VIP', title: 'ESG 高階主管閉門論壇', itemCount: 0 },
];

interface MultiRoomHubProps {
  onSelectRoom: (roomCode: string) => void;
  activeRoom: string;
  currentTheme?: 'dark' | 'light';
}

export function MultiRoomHub({
  onSelectRoom,
  activeRoom,
  currentTheme = 'dark',
}: MultiRoomHubProps) {
  const isDark = currentTheme === 'dark';
  const [rooms, setRooms] = useState<RoomMeta[]>(DEFAULT_ROOMS);
  const [loading, setLoading] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [showAddRoom, setShowAddRoom] = useState(false);

  // 輪詢更新所有房間的最新狀態
  const refreshRooms = async () => {
    setLoading(true);
    try {
      const updated = await Promise.all(
        rooms.map(async (r) => {
          try {
            const res = await fetch(`/api/omnisub/akkadu?room=${encodeURIComponent(r.code)}`);
            if (!res.ok) return r;
            const json = await res.json();
            const data = json.data || json;
            const subs = data.subtitles || [];
            const last = subs[subs.length - 1];
            return {
              ...r,
              itemCount: subs.length,
              lastSpeaker: last?.speaker,
              lastOriginal: last?.originalText,
              lastTranslated: last?.translatedText,
              lastUpdated: last?.timestamp,
              hashLock: last?.hashLock,
            };
          } catch {
            return r;
          }
        })
      );
      setRooms(updated);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshRooms();
    const timer = setInterval(refreshRooms, 5000);
    return () => clearInterval(timer);
  }, []);

  // 全域廣播至所有房間
  const handleGlobalBroadcast = async () => {
    if (!broadcastText.trim() || isBroadcasting) return;
    setIsBroadcasting(true);
    setBroadcastSuccess(false);

    try {
      // 1. 先取得英文翻譯
      const transRes = await fetch('/api/omnisub/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcastText.trim() }),
      });
      const transData = await transRes.json();
      const translation =
        transData.data?.translatedText || transData.translatedText || broadcastText;

      // 2. 同步平行推送至所有房間
      await Promise.all(
        rooms.map((r) =>
          fetch('/api/omnisub/akkadu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              room: r.code,
              speaker: '總控台全域廣播 (Omni Broadcast)',
              originalText: broadcastText.trim(),
              translatedText: translation,
              srcLang: transData.data?.sourceLang || 'zh-TW',
              targetLang: transData.data?.targetLang || 'en',
            }),
          })
        )
      );

      setBroadcastText('');
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4000);
      refreshRooms();
    } catch (e) {
      console.error('[Global Broadcast Error]:', e);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // 複製 OBS 網址
  const copyObsLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://omnisub.esggo.co';
    const obsUrl = `${origin}/omnisub?view=obs&room=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(obsUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // 新增自訂房間
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomCode.trim()) return;
    const code = newRoomCode.trim().toUpperCase();
    if (rooms.some((r) => r.code === code)) {
      alert('該房間代碼已存在！');
      return;
    }
    setRooms([
      ...rooms,
      {
        code,
        title: newRoomTitle.trim() || `專屬轉播會議室 (${code})`,
        itemCount: 0,
      },
    ]);
    setNewRoomCode('');
    setNewRoomTitle('');
    setShowAddRoom(false);
  };

  return (
    <div className="space-y-6">
      {/* 總控台頂部概覽 */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl border shadow-md ${
          isDark
            ? 'bg-[#111217] border-[rgba(67,70,81,0.5)]'
            : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDark
                ? 'bg-[rgba(94,234,212,0.12)] text-[#5EEAD4] border-[rgba(94,234,212,0.3)]'
                : 'bg-[rgba(13,148,136,0.1)] text-[#0d9488] border-[rgba(13,148,136,0.3)]'
            }`}
          >
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2
              className={`text-lg font-bold flex items-center gap-2 ${
                isDark ? 'text-[#ebecef]' : 'text-[#0f172a]'
              }`}
            >
              OmniSub 多房間轉播矩陣總控台
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  isDark
                    ? 'bg-[#171921] text-[#5EEAD4] border-[rgba(94,234,212,0.3)]'
                    : 'bg-[#f1f5f9] text-[#0d9488] border-[rgba(13,148,136,0.3)]'
                }`}
              >
                MASTER HUB
              </span>
            </h2>
            <p className={`text-xs ${isDark ? 'text-[#8d909c]' : 'text-[#64748b]'}`}>
              即時監控會場各分廳字幕流轉、OBS 串流來源與全域緊急公告推播
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshRooms}
            disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
              isDark
                ? 'bg-[#171921] border-[rgba(67,70,81,0.5)] text-[#ebecef] hover:bg-[#242836]'
                : 'bg-[#f1f5f9] border-[rgba(100,116,139,0.25)] text-[#0f172a] hover:bg-[#e2e8f0]'
            }`}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                loading ? `animate-spin ${isDark ? 'text-[#5EEAD4]' : 'text-[#0d9488]'}` : ''
              }`}
            />
            即時整理
          </button>
          <button
            type="button"
            onClick={() => setShowAddRoom(!showAddRoom)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${
              isDark
                ? 'bg-[#5EEAD4] text-[#0a0b0e] hover:bg-[#8CF5E3]'
                : 'bg-[#0d9488] text-white hover:bg-[#0f766e]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            新增房間
          </button>
        </div>
      </div>

      {/* 新增自訂房間抽屜 */}
      {showAddRoom && (
        <form
          onSubmit={handleAddRoom}
          className={`p-4 rounded-xl border flex flex-wrap items-center gap-3 animate-in fade-in ${
            isDark
              ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]'
              : 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]'
          }`}
        >
          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              required
              value={newRoomCode}
              onChange={(e) => setNewRoomCode(e.target.value)}
              placeholder="房間代碼 (如 STAGE-3)"
              className={`w-full px-3 py-1.5 rounded-lg border text-xs uppercase outline-none ${
                isDark
                  ? 'bg-[#0a0b0e] border-[rgba(67,70,81,0.5)] text-[#ebecef] focus:border-[#5EEAD4]'
                  : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] text-[#0f172a] focus:border-[#0d9488]'
              }`}
            />
          </div>
          <div className="flex-2 min-w-[200px]">
            <input
              type="text"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="會場名稱 (如 第三會場：永續供應鏈論壇)"
              className={`w-full px-3 py-1.5 rounded-lg border text-xs outline-none ${
                isDark
                  ? 'bg-[#0a0b0e] border-[rgba(67,70,81,0.5)] text-[#ebecef] focus:border-[#5EEAD4]'
                  : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] text-[#0f172a] focus:border-[#0d9488]'
              }`}
            />
          </div>
          <button
            type="submit"
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-[#5EEAD4] text-[#0a0b0e] hover:bg-[#8CF5E3]'
                : 'bg-[#0d9488] text-white hover:bg-[#0f766e]'
            }`}
          >
            建立房間
          </button>
          <button
            type="button"
            onClick={() => setShowAddRoom(false)}
            className={`px-3 py-1.5 rounded-lg text-xs cursor-pointer border ${
              isDark
                ? 'bg-[#111217] text-[#8d909c] border-[rgba(67,70,81,0.5)] hover:text-[#ebecef]'
                : 'bg-[#ffffff] text-[#64748b] border-[rgba(100,116,139,0.25)] hover:text-[#0f172a]'
            }`}
          >
            取消
          </button>
        </form>
      )}

      {/* 全域同步廣播操作區 */}
      <div
        className={`p-5 rounded-2xl border space-y-3 ${
          isDark
            ? 'bg-[#171921] border-[rgba(67,70,81,0.5)]'
            : 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]'
        }`}
      >
        <div className="flex items-center justify-between text-xs font-mono">
          <span
            className={`font-bold flex items-center gap-2 ${
              isDark ? 'text-[#5EEAD4]' : 'text-[#0d9488]'
            }`}
          >
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            跨會場全域同步廣播 (Global Multi-Room Broadcast)
          </span>
          <span className={isDark ? 'text-[#8d909c]' : 'text-[#64748b]'}>
            一鍵推送至 {rooms.length} 個會場
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={broadcastText}
            onChange={(e) => setBroadcastText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGlobalBroadcast();
            }}
            placeholder="輸入全域公告（例如：全體大會將於 10 分鐘後開始，請各分廳來賓就座...）"
            className={`flex-1 px-4 py-2 rounded-xl border text-xs outline-none ${
              isDark
                ? 'bg-[#0a0b0e] border-[rgba(67,70,81,0.5)] text-[#ebecef] placeholder:text-[#8d909c]/50 focus:border-[#5EEAD4]'
                : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] text-[#0f172a] placeholder:text-[#64748b]/50 focus:border-[#0d9488]'
            }`}
          />
          <button
            type="button"
            disabled={!broadcastText.trim() || isBroadcasting}
            onClick={handleGlobalBroadcast}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-md cursor-pointer shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            {isBroadcasting ? '全域發送中...' : '發布全域公告'}
          </button>
        </div>

        {broadcastSuccess && (
          <div className="text-xs text-[#10b981] font-mono flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            全域公告已成功透過 5T 協議加密發送至所有會場！
          </div>
        )}
      </div>

      {/* 房間矩陣列表 (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const isActive = room.code === activeRoom;
          return (
            <div
              key={room.code}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                isActive
                  ? isDark
                    ? 'bg-[#171921] border-[#5EEAD4] shadow-[0_0_20px_rgba(94,234,212,0.15)]'
                    : 'bg-[#ffffff] border-[#0d9488] shadow-md'
                  : isDark
                  ? 'bg-[#111217] border-[rgba(67,70,81,0.5)] hover:border-[rgba(94,234,212,0.4)]'
                  : 'bg-[#ffffff] border-[rgba(100,116,139,0.25)] hover:border-[rgba(13,148,136,0.4)] shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        isDark
                          ? 'bg-[#0a0b0e] text-[#5EEAD4] border-[rgba(94,234,212,0.3)]'
                          : 'bg-[#f1f5f9] text-[#0d9488] border-[rgba(13,148,136,0.3)]'
                      }`}
                    >
                      {room.code}
                    </span>
                    <h3
                      className={`font-bold text-sm mt-1.5 ${
                        isDark ? 'text-[#ebecef]' : 'text-[#0f172a]'
                      }`}
                    >
                      {room.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
                      isDark
                        ? 'text-[#5EEAD4] bg-[#0a0b0e] border-[rgba(94,234,212,0.3)]'
                        : 'text-[#0d9488] bg-[#f1f5f9] border-[rgba(13,148,136,0.3)]'
                    }`}
                  >
                    {room.itemCount} 條字幕
                  </span>
                </div>

                {/* 最新字幕動態 */}
                <div
                  className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                    isDark
                      ? 'bg-[#0a0b0e] border-[rgba(67,70,81,0.5)]'
                      : 'bg-[#f8fafc] border-[rgba(100,116,139,0.25)]'
                  }`}
                >
                  <div
                    className={`text-[10px] font-mono flex items-center justify-between ${
                      isDark ? 'text-[#8d909c]' : 'text-[#64748b]'
                    }`}
                  >
                    <span>講者: {room.lastSpeaker || '暫無活動'}</span>
                    <span>
                      {room.lastUpdated
                        ? new Date(room.lastUpdated).toLocaleTimeString()
                        : '--:--'}
                    </span>
                  </div>
                  <div
                    className={`truncate font-sans font-medium ${
                      isDark ? 'text-[#ebecef]' : 'text-[#0f172a]'
                    }`}
                  >
                    {room.lastOriginal || '等待講者即時發言...'}
                  </div>
                  {room.lastTranslated && (
                    <div
                      className={`truncate text-[11px] font-semibold ${
                        isDark ? 'text-[#5EEAD4]' : 'text-[#0d9488]'
                      }`}
                    >
                      {room.lastTranslated}
                    </div>
                  )}
                </div>
              </div>

              {/* 底部操作按鈕 */}
              <div
                className={`flex items-center gap-2 pt-2 border-t text-xs ${
                  isDark ? 'border-[rgba(67,70,81,0.5)]' : 'border-[rgba(100,116,139,0.25)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectRoom(room.code)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'bg-[#5EEAD4] text-[#0a0b0e]'
                        : 'bg-[#0d9488] text-white'
                      : isDark
                      ? 'bg-[#171921] hover:bg-[#242836] text-[#ebecef] border border-[rgba(67,70,81,0.5)]'
                      : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f172a] border border-[rgba(100,116,139,0.25)]'
                  }`}
                >
                  {isActive ? '目前連線中' : '進入轉播牆'}
                </button>

                <button
                  type="button"
                  onClick={() => copyObsLink(room.code)}
                  title="複製 OBS 綠幕/透明背景懸浮字幕連結"
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono ${
                    isDark
                      ? 'bg-[#0a0b0e] hover:bg-[#171921] border-[rgba(67,70,81,0.5)] text-[#5EEAD4]'
                      : 'bg-[#f1f5f9] hover:bg-[#e2e8f0] border-[rgba(100,116,139,0.25)] text-[#0d9488]'
                  }`}
                >
                  {copiedCode === room.code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                      已複製
                    </>
                  ) : (
                    <>
                      <Tv className="w-3.5 h-3.5" />
                      OBS 網址
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
