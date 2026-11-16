"use client";

import { useEffect, useState } from "react";
import type { OmniApiDraft, OmniApiNode, OmniApiTagsOverview } from "@/lib/api";
import {
  buildExportUrl,
  deleteDraft,
  deleteNote,
  fetchEntropyStats,
  fetchTagsOverview,
  importArchive,
  promoteDraft,
  semanticSearch,
} from "@/lib/api";

const PHASE_CLASS: Record<string, string> = {
  ALPHA_ORIGIN_CAPTURE: "phase-alpha",
  SIGMA_GRAPH_SYNTHESIS: "phase-sigma",
  OMEGA_OBJECT_CRYSTAL: "phase-omega",
};

export function NotesBoard({
  notes,
  selectedUuid,
  onSelect,
  onChanged,
}: {
  notes: OmniApiNode[];
  selectedUuid: string | null;
  onSelect: (uuid: string) => void;
  onChanged: () => void;
}) {
  const [filter, setFilter] = useState("");
  // 二十八期：標籤軸徽章（對接 GET /api/tags），點擊切換標籤過濾
  const [tagAxis, setTagAxis] = useState<OmniApiTagsOverview | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  // 三十一期：熵值總覽徽章（對接 GET /api/entropy/stats），僅顯示不過濾
  const [entropy, setEntropy] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTagsOverview()
      .then((overview) => {
        if (!cancelled) setTagAxis(overview);
      })
      .catch(() => {
        if (!cancelled) setTagAxis(null);
      });
    fetchEntropyStats()
      .then((stats) => {
        if (cancelled) return;
        setEntropy(
          stats.with_entropy === 0
            ? null
            : `熵值 ${stats.with_entropy}/${stats.total_notes} · 平均 ${stats.avg_entropy ?? "-"} · 最高 ${stats.max_entropy ?? "-"}`,
        );
      })
      .catch(() => {
        if (!cancelled) setEntropy(null);
      });
    return () => {
      cancelled = true;
    };
  }, [notes]);

  const norm = filter.trim().toLowerCase();
  /** 十九期關鍵字過濾：比對區塊內容與拓撲標籤（大小寫不敏感），與語意檢索面板互補。
   *  二十八期標籤過濾：精確匹配之標籤軸過濾，與關鍵字過濾採交集。 */
  const visible = notes.filter((note) => {
    const byKeyword =
      norm.length === 0 ||
      note.blocks.some((b) => b.content.toLowerCase().includes(norm)) ||
      note.topology.tags.some((t) => t.toLowerCase().includes(norm));
    const byTag = tagFilter === null || note.topology.tags.includes(tagFilter);
    return byKeyword && byTag;
  });

  return (
    <div className="glass p-5">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200">
        筆記結晶板{(norm.length > 0 || tagFilter !== null) && `（${visible.length}/${notes.length}）`}
      </h2>
      {entropy !== null && (
        <p
          className="mt-1 text-[10px] text-slate-500"
          title="全域熵值總覽（GET /api/entropy/stats）：entropy_score 僅於熵減自癒（purify）後存在，avg/max 僅統計具值節點"
        >
          {entropy}
        </p>
      )}
      {tagAxis !== null && tagAxis.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-slate-500" title="全域標籤彙整（GET /api/tags）：count 為含該標籤之節點數">
            標籤軸 {tagAxis.tags.length} 種 ·
          </span>
          {tagAxis.tags.map((t) => (
            <button
              key={t.tag}
              type="button"
              className={`rounded px-1.5 py-0.5 text-[10px] transition ${
                tagFilter === t.tag
                  ? "bg-omni-alpha/30 text-omni-alpha"
                  : "bg-omni-sigma/20 text-omni-sigma hover:bg-omni-sigma/40"
              }`}
              title={`點擊以 ${t.tag} 過濾此板筆記`}
              onClick={() => setTagFilter(tagFilter === t.tag ? null : t.tag)}
            >
              {t.tag} × {t.count}
            </button>
          ))}
          {tagFilter !== null && (
            <button
              type="button"
              className="text-[10px] text-slate-500 underline decoration-dotted transition hover:text-slate-300"
              onClick={() => setTagFilter(null)}
            >
              清除標籤過濾
            </button>
          )}
        </div>
      )}
      {notes.length > 0 && (
        <input
          className="field mt-3"
          placeholder="關鍵字過濾此板筆記（內容或標籤）…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="筆記關鍵字過濾"
        />
      )}
      {notes.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">尚無筆記 — 從上方速記欄捕獲第一個靈感。</p>
      ) : visible.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">沒有符合關鍵字的筆記。</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((note) => (
            <article
              key={note.uuid}
              className={`glass glass-hover p-4 ${PHASE_CLASS[note.matrix_phase] ?? ""} ${
                selectedUuid === note.uuid ? "border-omni-alpha/60" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="phase-dot" aria-hidden />
                <span className="text-[11px] text-slate-400">{note.matrix_phase}</span>
                <button
                  type="button"
                  className="ml-auto text-[11px] text-slate-500 transition hover:text-rose-300"
                  onClick={() => void deleteNote(note.uuid).then(onChanged).catch(() => undefined)}
                  aria-label="刪除筆記"
                >
                  刪除
                </button>
              </div>
              <button
                type="button"
                className="mt-2 block w-full text-left"
                onClick={() => onSelect(note.uuid)}
              >
                <p className="line-clamp-3 text-sm text-slate-100">
                  {note.blocks.map((b) => b.content).join(" ") || "（空）"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {note.topology.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <span className="mt-2 inline-block text-[11px] text-slate-400 underline-offset-2 transition hover:text-omni-alpha">
                  檢視詳情
                </span>
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function SearchPanel({ onJump }: { onJump: (uuid: string) => void }) {
  const [query, setQuery] = useState("");
  const [degraded, setDegraded] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ nodeUuid: string; score: number }>>([]);
  const [message, setMessage] = useState<string | null>(null);

  async function run(): Promise<void> {
    const q = query.trim();
    if (q.length === 0) return;
    setMessage(null);
    try {
      const res = await semanticSearch(q);
      setDegraded(res.degraded);
      setReason(res.degraded ? (res.reason ?? "嵌入引擎未啟用") : null);
      setResults(res.results);
      if (res.degraded) setMessage("已回退零結果（零算力降級）");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "搜尋失敗");
    }
  }

  return (
    <div className="glass p-5">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200">雙鏈熔合檢索</h2>
      <div className="mt-3 flex gap-2">
        <input
          id="omni-search"
          className="field"
          placeholder="語意搜尋既有筆記…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void run();
          }}
        />
        <button
          type="button"
          className="shrink-0 rounded-xl bg-omni-sigma/90 px-4 py-2 text-sm text-slate-100 transition hover:bg-omni-sigma"
          onClick={() => void run()}
        >
          熔合
        </button>
      </div>
      {message !== null && (
        <p className="mt-2 text-xs text-amber-300/90">
          {message}
          {reason !== null && ` — ${reason}`}
        </p>
      )}
      {results.length > 0 && !degraded && (
        <ul className="mt-3 space-y-1.5">
          {results.map((r) => (
            <li key={r.nodeUuid}>
              <button
                type="button"
                className="w-full rounded-lg border border-slate-500/15 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-omni-omega/50"
                onClick={() => onJump(r.nodeUuid)}
              >
                <span className="text-omni-omega">{(r.score * 100).toFixed(1)}%</span>{" "}
                {r.nodeUuid.slice(0, 8)}…
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DraftsPanel({
  drafts,
  onChanged,
}: {
  drafts: OmniApiDraft[];
  onChanged: () => void;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function crystallize(id: string): Promise<void> {
    try {
      await promoteDraft(id);
      setMessage(`草稿已結晶成實體 ✓`);
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "結晶失敗");
    } finally {
      setTimeout(() => setMessage(null), 2800);
    }
  }

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">隨想草稿（結晶前）</h2>
        <a
          className="text-xs text-omni-omega underline-offset-2 transition hover:text-omni-omegaGlow"
          href={buildExportUrl()}
        >
          封印導出 ⤓
        </a>
      </div>
      {drafts.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">目前無草稿。</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {drafts.map((d) => (
            <li key={d.draft_id} className="rounded-xl border border-slate-500/15 bg-slate-900/40 p-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-700/50 px-2 py-0.5 text-[10px] text-slate-300">
                  r{d.revision}
                </span>
                <span className="truncate text-xs text-slate-300">
                  {d.content.slice(0, 48) || "（空白）"}
                </span>
                <span className="ml-auto flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="text-[11px] text-omni-omega transition hover:text-omni-omegaGlow"
                    onClick={() => void crystallize(d.draft_id)}
                  >
                    結晶
                  </button>
                  <button
                    type="button"
                    className="text-[11px] text-slate-500 transition hover:text-rose-300"
                    onClick={() => void deleteDraft(d.draft_id).then(onChanged).catch(() => undefined)}
                  >
                    刪除
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      {message !== null && <p className="mt-2 text-xs text-slate-300">{message}</p>}
    </div>
  );
}

/**
 * 封存面板（三十期）：對接引擎既有 GET /api/export（封存匯出）與 POST /api/import（封存匯入）。
 * 匯出以 Blob 下載快照（exported_at 為伺服器當下時間，lock_hash 逐節點驗算，篡改即拒絕）；
 * 匯入可選衝突策略（skip 保留既有／overwrite 覆寫），回 report 如實顯示 imported/skipped/overwritten/tampered。
 */
export function ArchivePanel({ onChanged }: { onChanged: () => void }) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [conflict, setConflict] = useState<"skip" | "overwrite">("skip");

  async function exportArchive(): Promise<void> {
    setBusy(true);
    try {
      const res = await fetch(buildExportUrl(), { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`匯出失敗 HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omninote-archive-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("封存快照已下載 ⤓");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "匯出失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2800);
    }
  }

  async function handleImport(file: File | null): Promise<void> {
    if (file === null) return;
    setBusy(true);
    try {
      const report = await importArchive(file, conflict);
      setMessage(
        `匯入完成：新增 ${report.imported} · 保留 ${report.skipped} · 覆寫 ${report.overwritten} · 篡改拒絕 ${report.tampered}`,
      );
      onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "匯入失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 4200);
    }
  }

  return (
    <div className="glass p-5">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200">封存（匯出／匯入）</h2>
      <p className="mt-1 text-[10px] text-slate-500">
        匯出為全量封存快照（引擎逐節點驗算 lock_hash，篡改即刻拒絕）；匯入僅接受同格式 JSON 封存，衝突時依所選策略處理（skip 保留既有，overwrite 覆寫）。
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-slate-100/10 px-3 py-1.5 text-xs text-slate-200 transition hover:border-omni-omega/60 disabled:opacity-50"
          disabled={busy}
          onClick={() => void exportArchive()}
        >
          下載封存快照 ⤓
        </button>
        <label
          className={`cursor-pointer rounded-xl border border-slate-100/10 px-3 py-1.5 text-xs text-slate-200 transition hover:border-omni-omega/60 ${
            busy ? "pointer-events-none opacity-50" : ""
          }`}
          title="選擇 omninote-archive JSON 檔後立即匯入"
        >
          匯入封存 ⤒
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              e.target.value = "";
              void handleImport(file);
            }}
          />
        </label>
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <button
            type="button"
            className={`rounded-full border px-2 py-0.5 transition ${
              conflict === "skip"
                ? "border-emerald-400/70 bg-emerald-400/10 text-emerald-200"
                : "border-slate-100/10 hover:border-slate-100/30"
            }`}
            title="既有節點且 lock_hash 相異時保留既有"
            onClick={() => setConflict("skip")}
          >
            衝突：保留
          </button>
          <button
            type="button"
            className={`rounded-full border px-2 py-0.5 transition ${
              conflict === "overwrite"
                ? "border-amber-400/70 bg-amber-400/10 text-amber-200"
                : "border-slate-100/10 hover:border-slate-100/30"
            }`}
            title="既有節點且 lock_hash 相異時覆寫"
            onClick={() => setConflict("overwrite")}
          >
            衝突：覆寫
          </button>
        </div>
      </div>
      {message !== null && <p className="mt-2 text-xs text-slate-300">{message}</p>}
    </div>
  );
}
