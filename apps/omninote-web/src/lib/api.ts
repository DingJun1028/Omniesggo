// OmniNote Web — 本機回環 REST API 客戶端（零依賴 fetch）
// 對接 packages/omninote-unified 之 OmniNoteLocalApiServer（預設 127.0.0.1:52710）。
// 回應形狀嚴格對齊引擎實作（api-server.ts 之 sendJson 信封）。
// 型別名稱一律加 OmniApi 前綴，避免與終始矩陣正典（src/types 等）遮蔽。

export interface OmniApiBlock {
  block_id: string;
  type: string;
  content: string;
  lamport_ts: number;
  peer_id: string;
  deleted: boolean;
}

export interface OmniApiEvidence {
  source_origin: string;
  captured_at: string;
  content_hash: string;
  hook_lifecycle: string;
  audit_formula: string;
}

export interface OmniApiOutlink {
  target_uuid: string;
  wikilink_alias: string;
  resolved: boolean;
}

export interface OmniApiNode {
  uuid: string;
  version: string;
  timestamp: number;
  matrix_phase: "ALPHA_ORIGIN_CAPTURE" | "SIGMA_GRAPH_SYNTHESIS" | "OMEGA_OBJECT_CRYSTAL";
  entity_type: string;
  blocks: OmniApiBlock[];
  topology: { outlinks: OmniApiOutlink[]; tags: string[] };
  properties: Record<string, unknown>;
  evidence: OmniApiEvidence[];
  lock_hash: string;
  entropy_score?: number;
}

export interface OmniApiHealth {
  ok: boolean;
  nodes: number;
  vectors: number;
  drafts: number;
}

export interface OmniApiDraft {
  draft_id: string;
  content: string;
  origin_tag: string;
  tags: string[];
  revision: number;
  created_at: string;
  saved_at: string;
}

export interface OmniApiSearchResult {
  nodeUuid: string;
  blockId?: string;
  score: number;
}

export const OMNI_BLOCK_TYPES = [
  "paragraph",
  "heading",
  "checklist_item",
  "sketch_vector",
  "audio_transcript",
  "object_attribute_card",
] as const;

export type OmniBlockType = (typeof OMNI_BLOCK_TYPES)[number];

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

/** 引擎僅回 uuid 清單；逐讀完整節點（本機回環，量級可控）。 */
export async function fetchNotes(): Promise<OmniApiNode[]> {
  const list = await request<{ ok: boolean; uuids: string[] }>("/api/notes");
  const nodes = await Promise.all(
    list.uuids.map((uuid) =>
      request<{ ok: boolean; node: OmniApiNode }>(`/api/notes/${uuid}`)
        .then((r) => r.node)
        .catch(() => null),
    ),
  );
  return nodes.filter((n): n is OmniApiNode => n !== null);
}

export async function fetchNote(uuid: string): Promise<OmniApiNode | null> {
  const r = await request<{ ok: boolean; node: OmniApiNode } | { ok: false }>(`/api/notes/${uuid}`);
  return "node" in r ? r.node : null;
}

export async function captureNote(text: string, tags: string[]): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>("/api/notes", {
    method: "POST",
    body: JSON.stringify({ text, tags }),
  });
  return r.node;
}

export async function appendBlock(
  uuid: string,
  type: OmniBlockType,
  content: string,
): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(`/api/notes/${uuid}/blocks`, {
    method: "POST",
    body: JSON.stringify({ type, content }),
  });
  return r.node;
}

/** 區塊編輯（PATCH /api/notes/:uuid/blocks/:blockId）：LWW 就地更新、outlinks 熔合重建。 */
export async function editBlock(
  uuid: string,
  blockId: string,
  content: string,
): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(
    `/api/notes/${uuid}/blocks/${blockId}`,
    { method: "PATCH", body: JSON.stringify({ content }) },
  );
  return r.node;
}

/** 區塊軟刪除（DELETE /api/notes/:uuid/blocks/:blockId）：CRDT tombstone，保留原文與 block_id。 */
export async function softDeleteBlock(uuid: string, blockId: string): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(
    `/api/notes/${uuid}/blocks/${blockId}`,
    { method: "DELETE" },
  );
  return r.node;
}

/** 熵減自癒（POST /api/notes/:uuid/purify）：重標註死鏈並計算 entropy_score。 */
export async function purifyNote(uuid: string): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(`/api/notes/${uuid}/purify`, {
    method: "POST",
  });
  return r.node;
}

/** ALPHA → SIGMA 躍遷（POST /api/notes/:uuid/sigma）：非墓碑區塊熔合為長文、outlinks 熔合重建。 */
export async function sigmaFuse(uuid: string): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(`/api/notes/${uuid}/sigma`, {
    method: "POST",
  });
  return r.node;
}

/** SIGMA → OMEGA 結晶（POST /api/notes/:uuid/crystallize）：強型別實體注入。 */
export async function crystallizeNote(uuid: string, entityType: string): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(`/api/notes/${uuid}/crystallize`, {
    method: "POST",
    body: JSON.stringify({ entity_type: entityType }),
  });
  return r.node;
}

/** OMEGA → ALPHA 逆向投影（POST /api/notes/:uuid/reverse）。 */
export async function reverseProject(uuid: string): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(`/api/notes/${uuid}/reverse`, {
    method: "POST",
  });
  return r.node;
}

export async function deleteNote(uuid: string): Promise<void> {
  await request<{ ok: boolean; deleted: string }>(`/api/notes/${uuid}`, { method: "DELETE" });
}

export interface OmniApiSearchResponse {
  ok: boolean;
  results: OmniApiSearchResult[];
  degraded: boolean;
  reason?: string;
}

export async function semanticSearch(query: string): Promise<OmniApiSearchResponse> {
  return request<OmniApiSearchResponse>("/api/search", {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function fetchDrafts(): Promise<OmniApiDraft[]> {
  const r = await request<{ ok: boolean; drafts: OmniApiDraft[] }>("/api/drafts");
  return r.drafts;
}

export async function saveDraft(draftId: string, content: string): Promise<OmniApiDraft> {
  const r = await request<{ ok: boolean; draft: OmniApiDraft }>("/api/drafts", {
    method: "POST",
    body: JSON.stringify({ draft_id: draftId, content }),
  });
  return r.draft;
}

export async function promoteDraft(draftId: string): Promise<OmniApiNode> {
  const r = await request<{ ok: boolean; node: OmniApiNode }>(`/api/drafts/${draftId}/promote`, {
    method: "POST",
  });
  return r.node;
}

export async function deleteDraft(draftId: string): Promise<void> {
  await request<{ ok: boolean; deleted: string }>(`/api/drafts/${draftId}`, { method: "DELETE" });
}

export function buildExportUrl(): string {
  return `${API_BASE}/api/export`;
}

export interface OmniApiImportReport {
  imported: number;
  skipped: number;
  overwritten: number;
  tampered: number;
}

export async function importArchive(
  file: File,
  conflict: "skip" | "overwrite",
): Promise<OmniApiImportReport> {
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
  const r = (await res.json()) as { ok: boolean; report: OmniApiImportReport };
  return r.report;
}
