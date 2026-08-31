// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// ============================================================
// NoCodeBackend 客戶端模組
// ============================================================

import type {
  NCBConfig,
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  Tag,
  CreateTagInput,
  Attachment,
  CreateAttachmentInput,
  NoteRelation,
  NoteWithTags,
  PaginatedResponse,
} from '@/types/notes';

export class NCBClient {
  private config: NCBConfig;

  constructor(config: NCBConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  // ========== 基礎請求方法 ==========

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`NCB API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ========== 筆記操作 ==========

  async createNote(input: CreateNoteInput): Promise<Note> {
    return this.request<Note>('POST', '/notes', {
      user_id: input.user_id,
      title: input.title,
      content: input.content,
      type: input.type || 'text',
      category: input.category,
      source: input.source || 'manual',
    });
  }

  async getNote(noteId: string): Promise<Note> {
    return this.request<Note>('GET', `/notes/${noteId}`);
  }

  async getNotes(params?: {
    user_id?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Note>> {
    const query = new URLSearchParams();
    if (params?.user_id) query.append('user_id', params.user_id);
    if (params?.category) query.append('category', params.category);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const path = `/notes${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Note>>('GET', path);
  }

  async updateNote(noteId: string, input: UpdateNoteInput): Promise<Note> {
    return this.request<Note>('PUT', `/notes/${noteId}`, input);
  }

  async deleteNote(noteId: string): Promise<void> {
    await this.request<void>('DELETE', `/notes/${noteId}`);
  }

  // ========== 標籤操作 ==========

  async createTag(input: CreateTagInput): Promise<Tag> {
    return this.request<Tag>('POST', '/tags', {
      name: input.name,
      color: input.color || '#3B82F6',
    });
  }

  async getTags(): Promise<Tag[]> {
    return this.request<Tag[]>('GET', '/tags');
  }

  async getTag(tagId: string): Promise<Tag> {
    return this.request<Tag>('GET', `/tags/${tagId}`);
  }

  async deleteTag(tagId: string): Promise<void> {
    await this.request<void>('DELETE', `/tags/${tagId}`);
  }

  // ========== 筆記-標籤關聯 ==========

  async addNoteTag(noteId: string, tagId: string): Promise<void> {
    await this.request<void>('POST', '/note_tags', {
      note_id: noteId,
      tag_id: tagId,
    });
  }

  async removeNoteTag(noteId: string, tagId: string): Promise<void> {
    await this.request<void>('DELETE', `/note_tags/${noteId}/${tagId}`);
  }

  async getNoteTags(noteId: string): Promise<Tag[]> {
    const result = await this.request<{ tags: Tag[] }>(
      'GET',
      `/note_tags?note_id=${noteId}`
    );
    return result.tags;
  }

  // ========== 附件操作 ==========

  async createAttachment(input: CreateAttachmentInput): Promise<Attachment> {
    return this.request<Attachment>('POST', '/attachments', input);
  }

  async getAttachments(noteId: string): Promise<Attachment[]> {
    return this.request<Attachment[]>(
      'GET',
      `/attachments?note_id=${noteId}`
    );
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    await this.request<void>('DELETE', `/attachments/${attachmentId}`);
  }

  // ========== 筆記關聯 ==========

  async createNoteRelation(
    noteId: string,
    relatedNoteId: string,
    relationType: string,
    confidence: number
  ): Promise<NoteRelation> {
    return this.request<NoteRelation>('POST', '/note_relations', {
      note_id: noteId,
      related_note_id: relatedNoteId,
      relation_type: relationType,
      confidence,
    });
  }

  async getNoteRelations(noteId: string): Promise<NoteRelation[]> {
    return this.request<NoteRelation[]>(
      'GET',
      `/note_relations?note_id=${noteId}`
    );
  }

  // ========== 複合查詢 ==========

  async getNoteWithTags(noteId: string): Promise<NoteWithTags> {
    const [note, tags] = await Promise.all([
      this.getNote(noteId),
      this.getNoteTags(noteId),
    ]);

    return {
      ...note,
      tags,
    };
  }

  async searchNotes(params: {
    query?: string;
    user_id?: string;
    category?: string;
    tags?: string[];
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Note>> {
    const query = new URLSearchParams();
    if (params.query) query.append('q', params.query);
    if (params.user_id) query.append('user_id', params.user_id);
    if (params.category) query.append('category', params.category);
    if (params.tags?.length) query.append('tags', params.tags.join(','));
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const queryString = query.toString();
    const path = `/notes/search${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Note>>('GET', path);
  }
}

// ========== 單例實例 ==========

let ncbClientInstance: NCBClient | null = null;

export function getNCBClient(): NCBClient {
  if (!ncbClientInstance) {
    const apiKey = process.env.NCB_API_KEY;
    const baseUrl = process.env.NCB_BASE_URL;

    if (!apiKey || !baseUrl) {
      throw new Error('Missing NCB_API_KEY or NCB_BASE_URL environment variables');
    }

    ncbClientInstance = new NCBClient({ apiKey, baseUrl });
  }

  return ncbClientInstance;
}
