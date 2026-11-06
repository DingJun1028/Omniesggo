"use client";

import { useState } from "react";
import type { OmniApiNode, OmniBlockType } from "@/lib/api";
import { appendBlock, OMNI_BLOCK_TYPES } from "@/lib/api";

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
            <span className="break-all text-xs text-slate-200">{b.content}</span>
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
