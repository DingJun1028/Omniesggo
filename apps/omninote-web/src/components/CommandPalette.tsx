"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { OmniApiNode } from "@/lib/api";

export interface PaletteAction {
  id: string;
  label: string;
  hint: string;
  run: () => void;
}

/** ⌘K 指令面板：全域動作 + 節點跳轉（鍵盤上下選擇、Enter 執行、Esc 關閉）。 */
export function CommandPalette({
  open,
  onClose,
  actions,
  notes,
  onSelectNote,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  actions: PaletteAction[];
  notes: OmniApiNode[];
  onSelectNote: (uuid: string) => void;
}>) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const acts = actions.filter((a) => q.length === 0 || a.label.toLowerCase().includes(q));
    const hits = notes
      .filter((n) => {
        if (q.length === 0) return false;
        const hay = `${n.topology.tags.join(" ")} ${n.blocks.map((b) => b.content).join(" ")}`.toLowerCase();
        return hay.includes(q) || n.uuid.startsWith(q);
      })
      .slice(0, 8);
    return [
      ...acts.map((a) => ({ kind: "action" as const, key: `a-${a.id}`, label: a.label, hint: a.hint, go: a.run })),
      ...hits.map((n) => ({
        kind: "note" as const,
        key: `n-${n.uuid}`,
        label: (n.blocks[0]?.content ?? n.uuid.slice(0, 8)).slice(0, 40),
        hint: n.matrix_phase,
        go: () => onSelectNote(n.uuid),
      })),
    ];
  }, [query, actions, notes]);

  useEffect(() => {
    setCursor(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  // 以程式化聚焦取代 autoFocus，避免 S9379 可及性議題。
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) return null;

  function runAt(index: number): void {
    const item = items[index];
    if (item === undefined) return;
    onClose();
    item.go();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 pt-24 backdrop-blur-sm"
      role="button"
      tabIndex={-1}
      aria-label="關閉指令面板"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="glass w-full max-w-lg p-4">
        <input
          ref={inputRef}
          className="field"
          placeholder="輸入動作或筆記關鍵字…（↑↓ 選擇 · Enter 執行 · Esc 關閉）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, items.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              runAt(cursor);
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
        />
        <ul className="mt-2 max-h-72 overflow-auto">
          {items.map((item, i) => (
            <li key={item.key}>
              <button
                type="button"
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${
                  i === cursor ? "bg-omni-alpha/15 text-slate-100" : "text-slate-300 hover:bg-slate-100/5"
                }`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => runAt(i)}
              >
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${
                    item.kind === "action" ? "bg-omni-sigma/25 text-omni-sigma" : "bg-omni-omega/20 text-omni-omega"
                  }`}
                >
                  {item.kind === "action" ? "動作" : "筆記"}
                </span>
                <span className="truncate">{item.label}</span>
                <span className="ml-auto shrink-0 text-[10px] text-slate-500">{item.hint}</span>
              </button>
            </li>
          ))}
          {items.length === 0 && (
            <li className="px-3 py-2 text-xs text-slate-500">無符合項目。</li>
          )}
        </ul>
      </div>
    </div>
  );
}
