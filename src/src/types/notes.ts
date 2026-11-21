// ============================================================
// AI 萬能筆記 - 類型定義
// ============================================================

// ========== 基礎類型 ==========

export type NoteType = 'text' | 'image' | 'audio' | 'pdf' | 'mixed';
export type NoteSource = 'manual' | 'import' | 'api' | 'email';
export type RelationType = 'similar' | 'reference' | 'follow_up';
export type EntityType = 'company' | 'regulation' | 'metric' | 'risk' | 'goal';

// ========== 筆記相關 ==========

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: NoteType;
  category?: string;
  summary?: string;
  source: NoteSource;
  embedding_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CreateNoteInput {
  user_id: string;
  title: string;
  content: string;
  type?: NoteType;
  category?: string;
  source?: NoteSource;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  type?: NoteType;
  category?: string;
  summary?: string;
  tags?: string[];
}

// ========== 標籤相關 ==========

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

// ========== 附件相關 ==========

export interface Attachment {
  id: string;
  note_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text?: string;
  created_at: string;
}

export interface CreateAttachmentInput {
  note_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_text?: string;
}

// ========== 筆記關聯 ==========

export interface NoteRelation {
  id: string;
  note_id: string;
  related_note_id: string;
  relation_type: RelationType;
  confidence: number;
  created_at: string;
}

// ========== 向量相關 ==========

export interface NoteEmbedding {
  id: string;
  note_id: string;
  embedding: number[];
  model: string;
  created_at: string;
  updated_at: string;
}

// ========== ESG 相關 ==========

export interface ESGEntity {
  id: string;
  note_id: string;
  entity_type: EntityType;
  entity_name: string;
  entity_id?: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ========== 搜尋相關 ==========

export interface SearchQuery {
  text: string;
  filters?: {
    categories?: string[];
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    user_id?: string;
  };
  limit?: number;
  threshold?: number;
}

export interface SearchResult {
  note: Note;
  similarity: number;
  highlights?: string[];
}

// ========== AI 處理相關 ==========

export interface ClassificationResult {
  category: string;
  subcategory?: string;
  tags: string[];
  confidence: number;
}

export interface SummaryOptions {
  style: 'brief' | 'detailed' | 'bullet_points' | 'action_items';
  maxLength?: number;
  focus?: string[];
}

export interface ActionItem {
  text: string;
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  assignee?: string;
}

// ========== API 回應 ==========

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ========== NoCodeBackend 配置 ==========

export interface NCBConfig {
  apiKey: string;
  baseUrl: string;
  timeout?: number;
}

// ========== 筆記與標籤的關聯結果 ==========

export interface NoteWithTags extends Note {
  tags: Tag[];
}

export interface NoteWithRelations extends NoteWithTags {
  related_notes: Note[];
  embedding?: NoteEmbedding;
  esg_entities?: ESGEntity[];
}
