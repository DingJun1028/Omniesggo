'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@lib/firebase';
import { collection, onSnapshot, query } from '@lib/firebase';

export interface OmniTask {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: number;
  status: 'Pending' | 'Completed';
  tags: string[];
}

const liquidGlassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
  borderTop: '1px solid rgba(255, 255, 255, 0.7)',
  borderLeft: '1px solid rgba(255, 255, 255, 0.7)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.05), inset 0 0 0 1px rgba(255,255,255,0.2)',
  borderRadius: '16px',
};

// ⚡ Bolt: Hoisted static variables and pure functions out of component to prevent redundant memory allocation per render
const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export function OmniCalendarView() {
  const [tasks, setTasks] = useState<OmniTask[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'omni_tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OmniTask));
      setTasks(data);
    });
    return () => unsubscribe();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // ✅ 修復：統一使用 ISO 格式 yyyy-MM-dd（month + 1 轉為 1-indexed，補零對齊）
  const tasksByDate = useMemo(() => {
    const map: Record<string, OmniTask[]> = {};
    tasks.forEach(t => {
      if (!t.dueDate) return;
      const d = new Date(t.dueDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0'); // 1-indexed, zero-padded
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(t);
    });
    return map;
  }, [tasks]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const renderCells = () => {
    const cells = [];
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 min-h-[100px] border border-transparent" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      // ✅ 修復：與 tasksByDate 格式對齊 — month + 1 轉為 1-indexed，補零
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      const dayTasks = tasksByDate[dateStr] || [];
      const isToday = isCurrentMonth && today.getDate() === day;

      cells.push(
        <div 
          key={dateStr} 
          style={liquidGlassCard}
          className={`p-2 min-h-[100px] flex flex-col gap-1 transition-all hover:scale-[1.02] cursor-default
            ${isToday ? 'ring-2 ring-accentTeal ring-offset-2 ring-offset-transparent' : ''} dark:border-white/10`}
        >
          <div className={`font-bold text-sm ${isToday ? 'text-accentTeal' : 'text-textPrimary'}`}>
            {day}
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {dayTasks.map(t => (
              <div 
                key={t.id} 
                className={`text-[10px] truncate px-1.5 py-0.5 rounded
                  ${t.status === 'Completed' ? 'bg-accentGreen/20 text-accentGreen line-through' : 'bg-accentPurple/10 text-accentPurple'}`}
                title={t.title}
              >
                {t.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-textPrimary flex items-center gap-2">
            📅 萬能日曆 (OmniCalendar)
          </h2>
          <p className="text-[13px] text-textSecondary mt-1">無作妙德．Liquid Glass 視覺連動版</p>
        </div>
        
        <div style={liquidGlassCard} className="flex items-center p-1 dark:bg-slate-800/40 dark:border-white/10">
          <button onClick={handlePrevMonth} className="px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-textPrimary">
            ◀
          </button>
          <button onClick={handleToday} className="px-4 py-1 font-semibold hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-textPrimary">
            {year} 年 {monthNames[month]}
          </button>
          <button onClick={handleNextMonth} className="px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors text-textPrimary">
            ▶
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-[13px] font-semibold text-textSecondary">
        {dayNames.map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {renderCells()}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
        }
      `}} />
    </div>
  );
}
