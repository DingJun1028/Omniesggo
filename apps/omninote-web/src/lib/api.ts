// OmniNote Web — 本機回環 REST API 客戶端（零依賴 fetch）
// 對接 packages/omninote-unified 之 OmniNoteLocalApiServer（預設 127.0.0.1:52710）。
// 型別名稱一律加 OmniApi 前綴，避免與終始矩陣正典（src/types 等）遮蔽。

export interface OmniApiHealth {
  ok: boolean;
  notes: number;
  drafts: number;
  embedding_enabled: boolean;
}

export interface OmniApiBlock {
  type: string;
  content: string;
}

export interface OmniApiNote {
  omni_uuid: string;
  entity_type: string;
  origin_tag: string;
  tags: string[];
  blocks: OmniApiBlock[];
  created_at: string;
}

export interface OmniApiDraft {
  draft_id: string;
  revision: number;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface OmniApiSearchResponse {
  results: Array<{ omni_uuid: string; score: number; origin_tag: string; preview: string }>;
  degraded: boolean;
}

export interface OmniApiImportReport {
  imported: number;
  skipped: number;
  overwritten: number;
  tampered: number;
}

const API_BASE: string =
  process.env.NEXT_PUBLIC_OMNINOTE_API ?? "http://127.0.0.1:52710";

export class OmniApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "OmniApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...init,
    });
  } catch (err) {
    throw new OmniApiError(0, `OmniNote API 無法連線（${API_BASE}）：${String(err)}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new OmniApiError(res.status, `HTTP ${res.status}：${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export async function fetchHealth(): Promise<OmniApiHealth> {
  return request<OmniApiHealth>("/health");
}

export async function fetchNotes(): Promise<OmniApiNote[]> {
  return request<OmniApiNote[]>("/api/notes");
}

export async function captureNote(text: string, tags: string[]): Promise<OmniApiNote> {
  return request<OmniApiNote>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ text, tags }),
  });
}

export async function appendBlock(uuid: string, block: OmniApiBlock): Promise<OmniApiNote> {
  return request<OmniApiNote>(`/api/notes/${uuid}/blocks`, {
    method: "POST",
    body: JSON.stringify(block),
  });
}

export async function deleteNote(uuid: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/notes/${uuid}`, { method: "DELETE" });
}

export async function semanticSearch(query: string): Promise<OmniApiSearchResponse> {
  return request<OmniApiSearchResponse>("/api/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function fetchDrafts(): Promise<OmniApiDraft[]> {
  return request<OmniApiDraft[]>("/api/drafts");
}

export async function saveDraft(draftId: string, text: string): Promise<OmniApiDraft> {
  return request<OmniApiDraft>("/api/drafts", {
    method: "POST",
    body: JSON.stringify({ draft_id: draftId, text }),
  });
}

export async function promoteDraft(draftId: string): Promise<OmniApiNote> {
  return request<OmniApiNote>(`/api/drafts/${draftId}/promote`, { method: "POST" });
}

export async function deleteDraft(draftId: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/drafts/${draftId}`, { method: "DELETE" });
}

export function buildExportUrl(): string {
  return `${API_BASE}/api/export`;
}

export async function importArchive(file: File, conflict: "skip" | "overwrite"): Promise<OmniApiImportReport> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/import?conflict=${conflict}`, {
      method: "POST",
      body: file,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    throw new OmniApiError(0, `OmniNote API 無法連線：${String(err)}`);
  }
  if (!res.ok) {
    throw new OmniApiError(res.status, `匯入失敗 HTTP ${res.status}`);
  }
  return (await res.json()) as OmniApiImportReport;
}
