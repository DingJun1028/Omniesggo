/**
 /** GET /api/notes — Fetch all notes from Supabase */
 import { jsonResponse, jsonError } from '@lib/api-utils';
 import { getSupabaseClient } from '@/lib/supabase-client';

 export interface NoteData {
   id: string;
   title: string;
   content: string;
   tags: string[];
   fiveTGate?: string;
   createdAt: number;
 }

 export const dynamic = 'force-dynamic';

 export async function GET() {
   try {
     const supabase = getSupabaseClient();

     const { data, error } = await supabase
       .from('notes')
       .select('*')
       .order('createdAt', { ascending: false })
       .limit(100);

     if (error) {
       console.error('[API] /api/notes GET error:', error.message);
       return jsonError('INTERNAL_ERROR', 'Failed to fetch notes', 500);
     }

     const notes: NoteData[] = (data ?? []).map((r: any) => ({
       id: r.id,
       title: r.title || '',
       content: r.content || '',
       tags: Array.isArray(r.tags) ? r.tags : [],
       fiveTGate: r.fiveTGate ?? undefined,
       createdAt: typeof r.createdAt === 'number' ? r.createdAt : new Date(r.createdAt).getTime(),
     }));

     return jsonResponse({ notes, total: notes.length });
   } catch (err) {
     console.error('[API] /api/notes GET error:', err);
     return jsonError('INTERNAL_ERROR', 'Failed to fetch notes', 500);
   }
 }

 export async function POST(request: Request) {
   try {
     const { title, content, tags = [], fiveTGate } = await request.json();

     if (!title || typeof title !== 'string') {
       return jsonError('INVALID_PARAMS', 'title is required', 400);
     }

     const supabase = getSupabaseClient();

     const record = {
       title,
       content: content || '',
       tags,
       fiveTGate: fiveTGate || null,
       actor: 'api',
       sourceOrigin: 'api:on',
       hashLock: '' /* filled by DB trigger / application */,
       createdAt: new Date(),
       updatedAt: new Date(),
     };

     const { data, error } = await supabase
       .from('notes')
       .insert(record)
       .select('*')
       .single();

     if (error) {
       console.error('[API] /api/notes POST error:', error.message);
       return jsonError('INTERNAL_ERROR', 'Failed to create note', 500);
     }

     return jsonResponse({ note: data }, 201);
   } catch (err) {
     console.error('[API] /api/notes POST error:', err);
     return jsonError('INTERNAL_ERROR', 'Failed to create note', 500);
   }
 }
