"use client";

import { useMemo } from 'react';
import { useTaskSystem } from './useTaskSystem';
import { useNoteSystem } from './useNoteSystem';

export type TemporalEventType = 
  | 'ENTROPY_HEAL'   // 過去：免疫系統修復記錄 (Amber)
  | 'AUTOMATION'     // 過去：自動化執行記錄 (Purple)
  | 'TASK_DUE'       // 未來：筆記中的待辦事項 (Emerald)
  | 'PREDICTION'     // 未來：AI 預測的風險日 (Red)
  | 'EXTERNAL'       // 外部：Google/Apple Calendar (Blue/Silver)
  | 'NOTE_SAVED'      // 記錄：筆記保存
  | 'VILLAGE_MILESTONE'; // 永續村里程碑

export interface TemporalEvent {
  id: string;
  date: string;      // YYYY-MM-DD
  type: TemporalEventType;
  title: string;
  intensity: number; // 1-10
  contextId?: string;
}

export const useTimeNexus = () => {
  const { tasks } = useTaskSystem();
  const { notes } = useNoteSystem();
  
  const events = useMemo(() => {
    const nexusEvents: TemporalEvent[] = [];

    // 1. Tasks (Future)
    tasks.forEach((task: any) => {
      if (task.dueDate && task.status !== 'DONE') {
        nexusEvents.push({
          id: `task-${task.id}`,
          date: task.dueDate,
          type: 'TASK_DUE',
          title: task.title,
          intensity: task.priority === 'CRITICAL' ? 10 : 6,
          contextId: task.contextId
        });
      }
    });

    // 2. Notes (Recent Activity)
    Object.values(notes).forEach((note: any) => {
      const dateStr = new Date(note.updatedAt).toISOString().split('T')[0];
      nexusEvents.push({
        id: `note-${note.id}`,
        date: dateStr,
        type: 'NOTE_SAVED',
        title: `Note evolved for ${note.contextId}`,
        intensity: 5,
        contextId: note.contextId
      });
    });

    // 3. System Entropy Logs (Simulated for protocol compliance)
    const today = new Date().toISOString().split('T')[0];
    nexusEvents.push({
      id: 'entropy-auto-01',
      date: today,
      type: 'ENTROPY_HEAL',
      title: 'Shield Protocol: Automated Entropy Correction',
      intensity: 7,
      contextId: 'SYS-SHIELD'
    });
    
    // 4. Village Milestones (Simulated based on village progress)
    nexusEvents.push({
      id: 'village-milestone-01',
      date: today,
      type: 'VILLAGE_MILESTONE',
      title: 'Village Achievement: Carbon Behemoth Purified to 65%',
      intensity: 8,
      contextId: 'VILLAGE-QUEST'
    });

    return nexusEvents;
  }, [tasks, notes]);

  const getEventsForDate = (dateStr: string) => 
    events.filter(e => e.date === dateStr);

  return { events, getEventsForDate };
};
