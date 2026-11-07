"use client";

import { useState } from "react";
import type { OmniApiNode, OmniBlockType } from "@/lib/api";
import {
  appendBlock,
  editBlock,
  softDeleteBlock,
  purifyNote,
  sigmaFuse,
  crystallizeNote,
  reverseProject,
  OMNI_BLOCK_TYPES,
} from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  paragraph: "段落",
  heading: "標題",
  checklist_item: "清單",
  sketch_vector: "塗鴉",
  audio_transcript: "語音轉錄",
  object_attribute_card: "屬性卡",
};

export function NoteDetail({
  note,
  onClose,
  onUpdated,
}: {
  note: OmniApiNode;
  onClose: () => void;
  onUpdated: (node: OmniApiNode) => void;
}) {
  const [type, setType] = useState<OmniBlockType>("paragraph");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [entityType, setEntityType] = useState("note.crystal");

  async function append(): Promise<void> {
    const trimmed = content.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await appendBlock(note.uuid, type, trimmed);
      setContent("");
      setMessage("區塊已追加（ON_API_APPEND 證據入鏈）✓");
      onUpdated(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "追加失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2800);
    }
  }

  async function saveEdit(blockId: string): Promise<void> {
    const trimmed = draft.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await editBlock(note.uuid, blockId, trimmed);
      setEditingId(null);
      setDraft("");
      setMessage("區塊已編輯（ON_BLOCK_EDIT 證據入鏈、outlinks 熔合重建）✓");
      onUpdated(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "編輯失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2800);
    }
  }

  async function removeBlock(blockId: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await softDeleteBlock(note.uuid, blockId);
      setMessage("區塊已軟刪除（CRDT tombstone、ON_BLOCK_TOMBSTONE 證據入鏈）✓");
      onUpdated(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "刪除失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2800);
    }
  }

  async function purify(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await purifyNote(note.uuid);
      setMessage(
        `淨化完成（ON_ENTROPY_PURIFICATION 證據入鏈）✓ 熵值 ${
          next.entropy_score !== undefined ? next.entropy_score.toFixed(4) : "未計算"
        }`,
      );
      onUpdated(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "淨化失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2800);
    }
  }

  async function runTransition(op: () => Promise<OmniApiNode>, done: string): Promise<void> {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const next = await op();
      setMessage(`${done}✓`);
      onUpdated(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "躍遷失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2800);
    }
  }

  return (
    <div className="glass p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">節點詳情</h2>
        <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300">
          {note.matrix_phase}
        </span>
        <span className="text-[10px] text-slate-500">
          v{note.version} · {note.entity_type} · {new Date(note.timestamp).toLocaleString()}
        </span>
        {note.entropy_score !== undefined && (
          <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300">
            熵 {note.entropy_score.toFixed(4)}
          </span>
        )}
        <button
          type="button"
          className="rounded-lg bg-omni-omega/25 px-2 py-1 text-[10px] text-omni-omega transition hover:bg-omni-omega/40 disabled:opacity-50"
          disabled={busy}
          onClick={() => void purify()}
        >
          淨化
        </button>
        {note.matrix_phase !== "OMEGA_OBJECT_CRYSTAL" && (
          <button
            type="button"
            className="rounded-lg bg-omni-sigma/25 px-2 py-1 text-[10px] text-omni-sigma transition hover:bg-omni-sigma/40 disabled:opacity-50"
            disabled={busy}
            onClick={() =>
              void runTransition(
                () => sigmaFuse(note.uuid),
                "已熔合為 SIGMA（區塊長文熔煉、ON_SIGMA_SYNTHESIS 證據入鏈）",
              )
            }
          >
            熔合 SIGMA
          </button>
        )}
        {note.matrix_phase !== "OMEGA_OBJECT_CRYSTAL" && (
          <input
            className="field w-auto max-w-[120px] px-2 py-1 text-[10px]"
            aria-label="結晶實體型別"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          />
        )}
        {note.matrix_phase !== "OMEGA_OBJECT_CRYSTAL" && (
          <button
            type="button"
            className="rounded-lg bg-omni-omega/25 px-2 py-1 text-[10px] text-omni-omega transition hover:bg-omni-omega/40 disabled:opacity-50"
            disabled={busy || entityType.trim().length === 0}
            onClick={() =>
              void runTransition(
                () => crystallizeNote(note.uuid, entityType.trim()),
                "已結晶為 OMEGA（ON_OMEGA_CRYSTALLIZE 證據入鏈）",
              )
            }
          >
            結晶 OMEGA
          </button>
        )}
        {note.matrix_phase === "OMEGA_OBJECT_CRYSTAL" && (
          <button
            type="button"
            className="rounded-lg bg-omni-alpha/25 px-2 py-1 text-[10px] text-omni-alpha transition hover:bg-omni-alpha/40 disabled:opacity-50"
            disabled={busy}
            onClick={() =>
              void runTransition(
                () => reverseProject(note.uuid),
                "已逆向投影回 ALPHA（ON_REVERSE_PROJECT 證據入鏈）",
              )
            }
          >
            逆向投影 ALPHA
          </button>
        )}
        <button
          type="button"
          className="ml-auto text-xs text-slate-400 transition hover:text-slate-200"
          onClick={onClose}
        >
          收起 ✕
        </button>
      </div>

      <ol className="mt-3 space-y-1.5">
        {note.blocks.map((b) => (
          <li
            key={b.block_id}
            className="flex items-start gap-2 rounded-lg border border-slate-500/15 bg-slate-900/40 px-3 py-2"
          >
            <span className="shrink-0 rounded bg-omni-sigma/25 px-1.5 py-0.5 text-[10px] text-omni-sigma">
              {TYPE_LABEL[b.type] ?? b.type}
            </span>
            {editingId === b.block_id ? (
              <span className="flex flex-1 flex-wrap items-center gap-1.5">
                <input
                  className="field min-w-[140px] flex-1"
                  value={draft}
                  aria-label="編輯區塊內容"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void saveEdit(b.block_id);
                    if (e.key === "Escape") {
                      setEditingId(null);
                      setDraft("");
                    }
                  }}
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-omni-alpha/90 px-2 py-1 text-[10px] text-slate-950 transition hover:bg-omni-alpha disabled:opacity-50"
                  disabled={busy || draft.trim().length === 0}
                  onClick={() => void saveEdit(b.block_id)}
                >
                  儲存
                </button>
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-slate-700/60 px-2 py-1 text-[10px] text-slate-200 transition hover:bg-slate-700"
                  onClick={() => {
                    setEditingId(null);
                    setDraft("");
                  }}
                >
                  取消
                </button>
              </span>
            ) : (
              <>
                <span
                  className={`break-all text-xs ${
                    b.deleted ? "text-slate-500 line-through" : "text-slate-200"
                  }`}
                >
                  {b.content}
                </span>
                {b.deleted ? (
                  <span className="ml-auto shrink-0 text-[10px] text-slate-500">已刪除（CRDT tombstone）</span>
                ) : (
                  <span className="ml-auto flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="rounded-lg bg-slate-700/60 px-2 py-1 text-[10px] text-slate-200 transition hover:bg-slate-700"
                      disabled={busy}
                      onClick={() => {
                        setEditingId(b.block_id);
                        setDraft(b.content);
                      }}
                    >
                      編輯
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-omni-omega/25 px-2 py-1 text-[10px] text-omni-omega transition hover:bg-omni-omega/40 disabled:opacity-50"
                      disabled={busy}
                      onClick={() => void removeBlock(b.block_id)}
                    >
                      刪除
                    </button>
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className="field w-auto"
          value={type}
          onChange={(e) => setType(e.target.value as OmniBlockType)}
        >
          {OMNI_BLOCK_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        <input
          className="field flex-1 min-w-[160px]"
          placeholder="追加區塊內容（寫入後重算 lock_hash）"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void append();
          }}
        />
        <button
          type="button"
          className="shrink-0 rounded-xl bg-omni-alpha/90 px-4 py-2 text-sm text-slate-950 transition hover:bg-omni-alpha disabled:opacity-50"
          disabled={busy || content.trim().length === 0}
          onClick={() => void append()}
        >
          追加
        </button>
      </div>
      {message !== null && <p className="mt-2 text-xs text-slate-300">{message}</p>}

      <details className="mt-4">
        <summary className="cursor-pointer text-[11px] text-slate-400 transition hover:text-slate-200">
          證據鏈（{note.evidence.length}）與 lock_hash
        </summary>
        <ul className="mt-2 space-y-1">
          {note.evidence.map((e, i) => (
            <li key={`${e.content_hash}-${i}`} className="text-[10px] leading-4 text-slate-400">
              {e.hook_lifecycle} · {e.source_origin} · {e.captured_at}
            </li>
          ))}
        </ul>
        <p className="mt-2 break-all text-[10px] text-slate-500">lock_hash: {note.lock_hash}</p>
      </details>
    </div>
  );
}
