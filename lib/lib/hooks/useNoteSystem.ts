import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NoteData {
  id: string;
  contextId: string;
  content: string;
  tags: string[];
  updatedAt: number;
}

interface NoteStore {
  notes: Record<string, NoteData>; // Key: contextId
  saveNote: (contextId: string, content: string, tags?: string[]) => void;
  getNote: (contextId: string) => NoteData | undefined;
}

export const useNoteSystem = create<NoteStore>()(
  persist(
    (set, get) => ({
      notes: {},
      
      saveNote: (contextId: string, content: string, tags: string[] = []) => set((state: NoteStore) => ({
        notes: {
          ...state.notes,
          [contextId]: {
            id: state.notes[contextId]?.id || crypto.randomUUID(),
            contextId,
            content,
            tags: tags.length > 0 ? tags : (state.notes[contextId]?.tags || []),
            updatedAt: Date.now()
          }
        }
      })),

      getNote: (contextId) => get().notes[contextId],
    }),
    { name: 'omni-note-system' }
  )
);
