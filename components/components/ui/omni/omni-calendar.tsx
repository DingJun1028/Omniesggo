"use client";

import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalIcon, 
  ShieldCheck, 
  Zap, 
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimeNexus } from '@/lib/hooks/useTimeNexus';
import { cn } from '@/lib/utils';
import { Badge } from "@/components/ui/badge";

const DayCell = React.memo(({ day, isToday, isSelected, events, onClick }: any) => {
  return (
    <button
      onClick={() => onClick(day)}
      className={cn(
        "relative h-12 md:h-14 rounded-[20px] border transition-all duration-300 flex flex-col items-center justify-center group/day p-2",
        isSelected 
          ? "bg-accent/10 border-accent shadow-[0_0_30px_rgba(var(--accent),0.15)] scale-[1.02] z-20" 
          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20",
        isToday && !isSelected && "border-white/20"
      )}
    >
      <span className={cn(
        "text-xs md:text-sm font-bold transition-all",
        isSelected ? "text-accent scale-110" : "text-text-muted/60 group-hover/day:text-text-main",
        isToday && "relative after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-accent after:rounded-full"
      )}>
        {day}
      </span>
      
      <div className="flex gap-1 mt-2 flex-wrap justify-center">
        {events.slice(0, 4).map((e: any) => (
          <div 
            key={e.id} 
            className={cn(
              "w-1.5 h-1.5 rounded-full shadow-lg",
              e.type === 'ENTROPY_HEAL' && "bg-status-lethal animate-pulse",
              e.type === 'AUTOMATION' && "bg-accent shadow-accent/50",
              e.type === 'TASK_DUE' && "bg-status-optimal shadow-status-optimal/50",
              e.type === 'NOTE_SAVED' && "bg-white/40"
            )} 
          />
        ))}
        {events.length > 4 && (
          <div className="w-px h-1 bg-text-muted/20 self-center mx-0.5" />
        )}
      </div>
    </button>
  );
});

DayCell.displayName = 'DayCell';


export const OmniCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { getEventsForDate } = useTimeNexus();
  const [selectedDate, setSelectedDate] = useState<string | null>(() => 
    new Date().toISOString().split('T')[0]
  );

  const { year, month, days } = React.useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    
    const d = [];
    for (let i = 0; i < firstDay; i++) d.push(null);
    for (let i = 1; i <= daysInMonth; i++) d.push(i);
    return { year: y, month: m, days: d };
  }, [currentDate]);

  const handleDateClick = React.useCallback((day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  }, [year, month]);

  const selectedEvents = React.useMemo(() => 
    selectedDate ? getEventsForDate(selectedDate) : []
  , [selectedDate, getEventsForDate]);

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 h-full">
      {/* Calendar Matrix */}
      <div className="flex-1 bg-bg-surface/80 backdrop-blur-3xl border border-white/10 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-accent/20 transition-all duration-1000"></div>

        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl">
              <CalIcon className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-main tracking-tight">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] opacity-50">Temporal Nexus Station</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))} 
              className="p-3 hover:bg-white/10 rounded-xl text-text-muted transition-all border border-transparent hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="上一個月"
              title="上一個月"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))} 
              className="p-3 hover:bg-white/10 rounded-xl text-text-muted transition-all border border-transparent hover:border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label="下一個月"
              title="下一個月"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 md:gap-3 mb-6">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
            <div key={d} className="text-center text-[10px] md:text-xs font-bold text-text-muted tracking-widest">
              {d}
            </div>
          ))}
        </div>

        {/* Grid Body */}
        <div className="grid grid-cols-7 gap-1 md:gap-3 relative z-10">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="h-16 md:h-20" />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = getEventsForDate(dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isSelected = selectedDate === dateStr;

            return (
              <DayCell
                key={day}
                day={day}
                isSelected={isSelected}
                isToday={isToday}
                events={dayEvents}
                onClick={handleDateClick}
              />
            );
          })}
        </div>
      </div>

      {/* Side Panel: Temporal Details */}
      <div className="w-full lg:w-96 flex flex-col gap-6 pb-20 lg:pb-0">
        <div className="bg-bg-surface/50 border border-white/10 rounded-[32px] p-6 flex-1 backdrop-blur-md flex flex-col">
          <div className="mb-6">
            <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Temporal Log</h3>
            <p className="text-lg font-bold text-text-main">
              {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, { dateStyle: 'full' }) : 'Select Point'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {selectedEvents.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center mb-4 opacity-20">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-text-muted/40 font-mono italic">Time stream is quiet.<br/>No temporal anomalies detected.</p>
                </motion.div>
              ) : (
                selectedEvents.map((event) => (
                  <motion.div 
                    layout
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-4 rounded-2xl border transition-all hover:scale-[1.02] border-white/5",
                      event.type === 'ENTROPY_HEAL' && "bg-status-lethal/10 border-status-lethal/20",
                      event.type === 'AUTOMATION' && "bg-accent/10 border-accent/20",
                      event.type === 'TASK_DUE' && "bg-status-optimal/10 border-status-optimal/20",
                      event.type === 'NOTE_SAVED' && "bg-white/5"
                    )}
                  >
                    <div className="flex gap-4">
                      <div className="mt-1">
                        {event.type === 'ENTROPY_HEAL' && <ShieldCheck className="w-5 h-5 text-status-lethal" />}
                        {event.type === 'AUTOMATION' && <Zap className="w-5 h-5 text-accent" />}
                        {event.type === 'TASK_DUE' && <CheckCircle className="w-5 h-5 text-status-optimal" />}
                        {event.type === 'NOTE_SAVED' && <CalIcon className="w-5 h-5 text-text-muted" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            event.type === 'ENTROPY_HEAL' && "text-status-lethal",
                            event.type === 'AUTOMATION' && "text-accent",
                            event.type === 'TASK_DUE' && "text-status-optimal",
                            event.type === 'NOTE_SAVED' && "text-text-muted"
                          )}>
                            {event.type.replace('_', ' ')}
                          </h4>
                        </div>
                        <p className="text-[13px] text-text-main font-medium leading-relaxed">
                          {event.title}
                        </p>
                        {event.contextId && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <Badge variant="optimal" styleType="soft" className="px-1.5 py-0 bg-white/5 border-white/10 lowercase text-[9px] text-text-muted">
                              ctx: {event.contextId}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Sync Button */}
          <button className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted transition-all group">
            <ExternalLink className="w-3.5 h-3.5 group-hover:text-accent transition-colors" />
            Sync Dimensions
          </button>
        </div>
      </div>
    </div>
  );
};
