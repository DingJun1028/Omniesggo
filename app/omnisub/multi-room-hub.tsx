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
}

export function MultiRoomHub({ onSelectRoom, activeRoom }: MultiRoomHubProps) {
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
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-[#10243f]/90 border border-[#c9a24b]/40 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/40">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#c9a24b] flex items-center gap-2">
              OmniSub 多房間轉播矩陣總控台
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/30">
                MASTER HUB
              </span>
            </h2>
            <p className="text-xs text-[#f3ede1]/70">
              即時監控會場各分廳字幕流轉、OBS 串流來源與全域緊急公告推播
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={refreshRooms}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 hover:bg-black/60 border border-white/20 text-xs font-mono text-gray-300 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c9a24b]' : ''}`} />
            即時整理
          </button>
          <button
            type="button"
            onClick={() => setShowAddRoom(!showAddRoom)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#c9a24b] hover:bg-[#b89139] text-black font-bold text-xs shadow-md transition-all cursor-pointer"
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
          className="p-4 rounded-xl bg-[#0a0f1d] border border-[#c9a24b]/40 flex flex-wrap items-center gap-3 animate-in fade-in"
        >
          <div className="flex-1 min-w-[140px]">
            <input
              type="text"
              required
              value={newRoomCode}
              onChange={(e) => setNewRoomCode(e.target.value)}
              placeholder="房間代碼 (如 STAGE-3)"
              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white uppercase focus:border-[#c9a24b] focus:outline-none"
            />
          </div>
          <div className="flex-2 min-w-[200px]">
            <input
              type="text"
              value={newRoomTitle}
              onChange={(e) => setNewRoomTitle(e.target.value)}
              placeholder="會場名稱 (如 第三會場：永續供應鏈論壇)"
              className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/20 text-xs text-white focus:border-[#c9a24b] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-[#c9a24b] hover:bg-[#b89139] text-black text-xs font-bold transition-all cursor-pointer"
          >
            建立房間
          </button>
          <button
            type="button"
            onClick={() => setShowAddRoom(false)}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-gray-300 text-xs hover:bg-white/20 cursor-pointer"
          >
            取消
          </button>
        </form>
      )}

      {/* 全域同步廣播操作區 */}
      <div className="p-5 rounded-2xl bg-[#070b12]/90 border border-[#c9a24b]/30 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-[#c9a24b] font-bold flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            跨會場全域同步廣播 (Global Multi-Room Broadcast)
          </span>
          <span className="text-gray-400">一鍵推送至 {rooms.length} 個會場</span>
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
            className="flex-1 px-4 py-2 rounded-xl bg-black/70 border border-white/20 text-xs text-white focus:outline-none focus:border-[#c9a24b]"
          />
          <button
            type="button"
            disabled={!broadcastText.trim() || isBroadcasting}
            onClick={handleGlobalBroadcast}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-lg cursor-pointer shrink-0"
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
                  ? 'bg-[#10243f] border-[#c9a24b] shadow-[0_0_20px_rgba(201,162,75,0.2)]'
                  : 'bg-[#0a0f1d]/90 border-white/10 hover:border-white/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#c9a24b]/20 text-[#c9a24b] border border-[#c9a24b]/30">
                      {room.code}
                    </span>
                    <h3 className="font-bold text-sm text-[#f8fafc] mt-1.5">{room.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {room.itemCount} 條字幕
                  </span>
                </div>

                {/* 最新字幕動態 */}
                <div className="p-2.5 rounded-lg bg-black/60 border border-white/5 text-xs space-y-1">
                  <div className="text-[10px] font-mono text-gray-400 flex items-center justify-between">
                    <span>講者: {room.lastSpeaker || '暫無活動'}</span>
                    <span>
                      {room.lastUpdated
                        ? new Date(room.lastUpdated).toLocaleTimeString()
                        : '--:--'}
                    </span>
                  </div>
                  <div className="text-gray-200 truncate font-sans">
                    {room.lastOriginal || '等待講者即時發言...'}
                  </div>
                  {room.lastTranslated && (
                    <div className="text-[#c9a24b] truncate text-[11px]">
                      {room.lastTranslated}
                    </div>
                  )}
                </div>
              </div>

              {/* 底部操作按鈕 */}
              <div className="flex items-center gap-2 pt-2 border-t border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectRoom(room.code)}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-center transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#c9a24b] text-black'
                      : 'bg-white/10 hover:bg-white/20 text-[#f3ede1]'
                  }`}
                >
                  {isActive ? '目前連線中' : '進入轉播牆'}
                </button>

                <button
                  type="button"
                  onClick={() => copyObsLink(room.code)}
                  title="複製 OBS 綠幕/透明背景懸浮字幕連結"
                  className="p-1.5 rounded-lg bg-black/50 hover:bg-black border border-white/20 text-[#c9a24b] transition-all cursor-pointer flex items-center gap-1 text-[11px] font-mono"
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
