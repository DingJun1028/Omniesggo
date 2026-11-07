/**
 * ============================================================================
 * OmniNote 匯入匯出 — 歸檔（Archive）雙向無損遷移
 * 匯出：全部節點 + 逐節點 lock_hash 重算驗證（零竄改外流）。
 * 匯入：格式驗證 → 逐節點完整性稽核 → 衝突策略（skip / overwrite）。
 * ============================================================================
 */
import { Value } from "@sinclair/typebox/value";
import { UnifiedNodeSchema, type UnifiedNode } from "./core-types.js";
import { computeNodeLockHash } from "./matrix-engine.js";
import type { OmniStorageAdapter } from "./storage-adapter.js";

export type ImportConflictStrategy = "skip" | "overwrite";

export interface OmniNoteArchive {
  readonly format: "omninote-archive";
  readonly format_version: "1.0.0";
  readonly exported_at: string;
  readonly nodes: UnifiedNode[];
}

export interface ImportOptions {
  /** 既有節點且 lock_hash 相異時之策略：skip（保留既有）或 overwrite（覆寫） */
  readonly conflict?: ImportConflictStrategy;
}

export interface ImportReport {
  readonly total: number;
  readonly imported: number;
  readonly skipped: number;
  readonly overwritten: number;
  readonly tampered: number;
}

function assertValidNode(node: unknown, context: string): asserts node is UnifiedNode {
  if (!Value.Check(UnifiedNodeSchema, node)) {
    throw new Error("[OmniNoteArchive] " + context + " 內含不符合 UnifiedNode 契約之節點");
  }
}

/** 匯出：逐節點重算 lock_hash 稽核，任何竄改即刻拒絕（零竄改外流承諾） */
export async function exportNotesArchive(nodes: readonly UnifiedNode[]): Promise<OmniNoteArchive> {
  const hashOk = await Promise.all(
    nodes.map(async (node) => {
      assertValidNode(node, "匯出來源");
      return (await computeNodeLockHash(node)) === node.lock_hash ? null : node.uuid;
    }),
  );
  const tampered = hashOk.filter((u): u is string => u !== null);
  if (tampered.length > 0) {
    throw new Error("[OmniNoteArchive] 拒絕匯出：lock_hash 驗算不符（竄改或損毀）之節點：" + tampered.join(", "));
  }
  return {
    format: "omninote-archive",
    format_version: "1.0.0",
    exported_at: new Date().toISOString(),
    nodes: nodes.map((n) => structuredClone(n) as UnifiedNode),
  };
}

export function serializeArchive(archive: OmniNoteArchive): string {
  return JSON.stringify(archive, null, 2);
}

/** 解析：格式欄位與逐節點契約驗證；任何畸形即刻拋出 */
export function parseArchive(json: string): OmniNoteArchive {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("[OmniNoteArchive] 非 JSON 格式");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("[OmniNoteArchive] 非物件");
  }
  const candidate = parsed as Record<string, unknown>;
  if (candidate.format !== "omninote-archive" || typeof candidate.format_version !== "string") {
    throw new Error("[OmniNoteArchive] 缺少 format / format_version 標頭");
  }
  if (!Array.isArray(candidate.nodes)) {
    throw new TypeError("[OmniNoteArchive] 缺少 nodes 陣列");
  }
  for (let i = 0; i < candidate.nodes.length; i++) {
    assertValidNode(candidate.nodes[i], "nodes[" + String(i) + "]");
  }
  return {
    format: "omninote-archive",
    format_version: "1.0.0",
    exported_at: typeof candidate.exported_at === "string" ? candidate.exported_at : "",
    nodes: candidate.nodes as UnifiedNode[],
  };
}

/** 匯入：完整性稽核 → 衝突策略；回傳逐項計數報告（零例外中斷） */
export async function importNotesArchive(
  storage: OmniStorageAdapter,
  archive: OmniNoteArchive,
  options: ImportOptions = {},
): Promise<ImportReport> {
  const conflict: ImportConflictStrategy = options.conflict ?? "skip";
  const verified = await Promise.all(
    archive.nodes.map(async (node) => {
      assertValidNode(node, "匯入來源");
      return (await computeNodeLockHash(node)) === node.lock_hash ? node : null;
    }),
  );
  const validNodes = verified.filter((n): n is UnifiedNode => n !== null);
  const tampered = archive.nodes.length - validNodes.length; // 竄改或損毀：保留既有資料，不落地
  const existingNodes = await Promise.all(validNodes.map((node) => storage.read(node.uuid)));
  const toWrite: UnifiedNode[] = [];
  let imported = 0;
  let skipped = 0;
  let overwritten = 0;
  validNodes.forEach((node, i) => {
    const existing = existingNodes[i] ?? null;
    if (existing !== null && existing.lock_hash === node.lock_hash) {
      skipped++; // 完全相同：零動作
      return;
    }
    if (existing !== null && conflict === "skip") {
      skipped++;
      return;
    }
    toWrite.push(node);
    if (existing !== null) overwritten++; else imported++;
  });
  await Promise.all(toWrite.map((node) => storage.write(node)));
  return { total: archive.nodes.length, imported, skipped, overwritten, tampered };
}
