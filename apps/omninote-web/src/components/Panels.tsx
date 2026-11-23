"use client";

import { useEffect, useState } from "react";
import type {
  OmniApiDraft,
  OmniApiGlobalEvidencePage,
  OmniApiGlobalEvidenceStats,
  OmniApiNode,
  OmniApiTagsOverview,
} from "@/lib/api";
import {
  batchProjectAlpha,
  batchUpdateTags,
  batchFuseSigma,
  buildExportUrl,
  deleteDraft,
  deleteNote,
  fetchEntropyStats,
  fetchGlobalEvidenceStats,
  fetchGlobalEvidenceTimeline,
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

  // 三十三期：批次標籤操作（對接 POST /api/notes/tags），多選節點後附加或移除標籤
  const [batchSelected, setBatchSelected] = useState<ReadonlySet<string>>(new Set());
  const [batchTag, setBatchTag] = useState("");
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  /** 三十三期：批次標籤附加/移除；報告之 updated/missing/unchanged 如實顯示，busy 期間防抖。 */
  const runBatch = async (op: "add" | "remove") => {
    const tag = batchTag.trim();
    if (batchBusy || tag.length === 0 || batchSelected.size === 0) return;
    setBatchBusy(true);
    setBatchMessage("操作中…");
    try {
      const report = await batchUpdateTags(
        [...batchSelected],
        op === "add" ? [tag] : undefined,
        op === "remove" ? [tag] : undefined,
      );
      const parts = [`已更新 ${report.updated.length} 則`, `無變化 ${report.unchanged}`];
      if (report.missing.length > 0) parts.push(`不存在 ${report.missing.length}`);
      setBatchMessage(parts.join(" · "));
      setBatchTag("");
      setBatchSelected(new Set());
      onChanged();
    } catch (err) {
      setBatchMessage(err instanceof Error ? err.message : "批次操作失敗");
    } finally {
      setBatchBusy(false);
    }
  };

  /** 三十九期：批次熔合 SIGMA；四十三期：批次逆向投影 ALPHA（共用執行輔助，對接 POST /api/notes/phases）。
   *  報告 updated/unchanged/skipped/missing 四類如實顯示；操作進行中 busy 防抖。 */
  const runBatchPhases = async (
    toPhase: "SIGMA_GRAPH_SYNTHESIS" | "ALPHA_ORIGIN_CAPTURE",
    failLabel: string,
  ): Promise<void> => {
    if (batchBusy || batchSelected.size === 0) return;
    setBatchBusy(true);
    setBatchMessage("操作中…");
    try {
      const report =
        toPhase === "SIGMA_GRAPH_SYNTHESIS"
          ? await batchFuseSigma([...batchSelected])
          : await batchProjectAlpha([...batchSelected]);
      const parts = [`已更新 ${report.updated.length} 則`, `無變化 ${report.unchanged}`];
      if (report.skipped.length > 0) parts.push(`跳過 ${report.skipped.length}`);
      if (report.missing.length > 0) parts.push(`不存在 ${report.missing.length}`);
      setBatchMessage(parts.join(" · "));
      setBatchSelected(new Set());
      onChanged();
    } catch (err) {
      setBatchMessage(err instanceof Error ? err.message : failLabel);
    } finally {
      setBatchBusy(false);
    }
  };

  const runBatchFuse = (): Promise<void> => runBatchPhases("SIGMA_GRAPH_SYNTHESIS", "批次熔合失敗");
  /** 四十三期：批次逆向投影（to_phase ALPHA_ORIGIN_CAPTURE）：OMEGA 結晶體或 SIGMA 節點逐節點回流 ALPHA 捕獲態。 */
  const runBatchReverse = (): Promise<void> => runBatchPhases("ALPHA_ORIGIN_CAPTURE", "批次逆向投影失敗");

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
        <>
        {batchSelected.size > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100/10 bg-slate-900/40 p-3">
            <span className="text-[10px] text-slate-500" title="批次標籤操作（POST /api/notes/tags）：missing 為不存在之節點、unchanged 為無變化節點數，皆如實回報">
              已選 {batchSelected.size} 則 ·
            </span>
            <input
              className="field max-w-[160px] py-1 text-xs"
              placeholder="批次標籤…"
              value={batchTag}
              onChange={(e) => setBatchTag(e.target.value)}
              aria-label="批次標籤"
            />
            <button
              type="button"
              className="rounded-lg border border-slate-100/10 px-3 py-1 text-xs text-slate-200 transition hover:border-omni-omega/60 disabled:opacity-50"
              disabled={batchBusy || batchTag.trim().length === 0}
              onClick={() => void runBatch("add")}
            >
              附加標籤
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-100/10 px-3 py-1 text-xs text-slate-200 transition hover:border-[color:var(--danger)] disabled:opacity-50"
              disabled={batchBusy || batchTag.trim().length === 0}
              onClick={() => void runBatch("remove")}
            >
              移除標籤
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-100/10 px-3 py-1 text-xs text-slate-200 transition hover:border-omni-sigma/60 disabled:opacity-50"
              disabled={batchBusy}
              onClick={() => void runBatchFuse()}
              title="批次熔合 SIGMA（POST /api/notes/phases）：OMEGA 結晶體與無非墓碑區塊者如實跳過"
            >
              批次熔合 SIGMA
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-100/10 px-3 py-1 text-xs text-slate-200 transition hover:border-omni-alpha/60 disabled:opacity-50"
              disabled={batchBusy}
              onClick={() => void runBatchReverse()}
              title="批次逆向投影 ALPHA（POST /api/notes/phases to_phase ALPHA_ORIGIN_CAPTURE，四十一期端點擴充）：OMEGA 結晶體或 SIGMA 節點逐節點回流 ALPHA 捕獲態（證據入鏈 ON_REVERSE_PROJECT）；已在 ALPHA 者如實回報無變化"
            >
              批次逆向投影 ALPHA
            </button>
            <button
              type="button"
              className="text-[10px] text-slate-500 underline decoration-dotted transition hover:text-slate-300"
              onClick={() => setBatchSelected(new Set())}
            >
              清除選取
            </button>
            {batchMessage !== null && (
              <span className="text-[10px] text-slate-400">{batchMessage}</span>
            )}
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((note) => (
            <article
              key={note.uuid}
              className={`glass glass-hover p-4 ${PHASE_CLASS[note.matrix_phase] ?? ""} ${
                selectedUuid === note.uuid ? "border-omni-alpha/60" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-3.5 accent-omni-alpha"
                  checked={batchSelected.has(note.uuid)}
                  onChange={(e) => {
                    const next = new Set(batchSelected);
                    if (e.target.checked) next.add(note.uuid);
                    else next.delete(note.uuid);
                    setBatchSelected(next);
                  }}
                  aria-label="批次選取"
                />
                <span className="phase-dot" aria-hidden />
                <span className="text-[11px] text-slate-400">{note.matrix_phase}</span>
                <button
                  type="button"
                  className="ml-auto text-[11px] text-slate-500 transition hover:text-[color:var(--danger)]"
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
        </>
      )}
    </div>
  );
}

export function GlobalEvidenceTimeline({ onJump }: { onJump: (uuid: string) => void }) {
  /** 四十六期：每頁筆數選擇（10／20／50）與頁碼視窗跳轉。 */
  const PAGE_SIZES = [10, 20, 50] as const;
  const [pageSize, setPageSize] = useState<number>(20);
  const [page, setPage] = useState(0);
  const [hook, setHook] = useState("");
  const [data, setData] = useState<OmniApiGlobalEvidencePage | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<OmniApiGlobalEvidenceStats | null>(null);
  const [statsBusy, setStatsBusy] = useState(false);
  const [statsMessage, setStatsMessage] = useState<string | null>(null);

  const load = async (target: number, hookOverride?: string, sizeOverride?: number): Promise<void> => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const trimmed = (hookOverride ?? hook).trim();
      const size = sizeOverride ?? pageSize;
      const res = await fetchGlobalEvidenceTimeline({
        limit: size,
        offset: target * size,
        hook: trimmed.length > 0 ? trimmed : undefined,
      });
      setData(res);
      setPage(target);
      if (res.total === 0) setMessage("時間軸為空");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "時間軸載入失敗");
    } finally {
      setBusy(false);
    }
  };

  /** 四十五期：全域證據 hook 別統計（唯讀聚合）；失敗如實顯示不打斷時間軸。 */
  const loadStats = async (): Promise<void> => {
    if (statsBusy) return;
    setStatsBusy(true);
    setStatsMessage(null);
    try {
      setStats(await fetchGlobalEvidenceStats());
    } catch (err) {
      setStatsMessage(err instanceof Error ? err.message : "統計載入失敗");
    } finally {
      setStatsBusy(false);
    }
  };

  /** 點擊徽章即以該 hook 篩選時間軸（同步更新輸入框，避免狀態不同步）。 */
  const applyHookBadge = (h: string): void => {
    setHook(h);
    void load(0, h);
  };

  useEffect(() => {
    void load(0);
    void loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPrev = (data?.offset ?? 0) > 0;
  const hasNext = data !== null && data.offset + data.entries.length < data.total;
  const totalPages = data !== null ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;
  const pageWindow: Array<number | "ellipsis"> = [];
  if (totalPages <= 7) {
    for (let i = 0; i < totalPages; i++) pageWindow.push(i);
  } else {
    pageWindow.push(0);
    const lo = Math.max(1, page - 1);
    const hi = Math.min(totalPages - 2, page + 1);
    if (lo > 1) pageWindow.push("ellipsis");
    for (let i = lo; i <= hi; i++) pageWindow.push(i);
    if (hi < totalPages - 2) pageWindow.push("ellipsis");
    pageWindow.push(totalPages - 1);
  }
  const jumpTo = (target: number): void => {
    if (target >= 0 && target < totalPages) void load(target);
  };
  const changePageSize = (size: number): void => {
    if (!PAGE_SIZES.includes(size as (typeof PAGE_SIZES)[number]) || size === pageSize) return;
    setPageSize(size);
    void load(0, undefined, size);
  };

  return (
    <div className="glass p-5">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200">
        全域證據時間軸
        {data !== null && `（${data.total} 筆）`}
      </h2>
      <p className="mt-1 text-[10px] text-slate-500">
        跨節點彙整 · captured_at 升冪（字串排序非時間權威）· 綁定 node_version 與 lock_hash
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className="field max-w-[180px] py-1 text-xs"
          placeholder="hook 精確過濾（如 ON_ALPHA_CAPTURE）"
          value={hook}
          onChange={(e) => setHook(e.target.value)}
          aria-label="證據 hook 過濾"
        />
        <button
          type="button"
          className="rounded-lg border border-slate-100/10 px-3 py-1 text-xs text-slate-200 transition hover:border-omni-alpha/60 disabled:opacity-50"
          disabled={busy}
          onClick={() => void load(0)}
          title="GET /api/evidence?hook= 精確匹配；空值為全量"
        >
          篩選
        </button>
        {busy && <span className="text-[10px] text-slate-500">載入中…</span>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          className="rounded-lg border border-slate-100/10 px-2.5 py-1 text-[10px] text-slate-300 transition hover:border-omni-alpha/60 disabled:opacity-50"
          disabled={statsBusy}
          onClick={() => void loadStats()}
          title="GET /api/evidence/stats 全域 hook 別統計（唯讀聚合）"
        >
          {statsBusy ? "統計載入中…" : "hook 別統計"}
        </button>
        {stats !== null && (
          <span className="text-[10px] text-slate-500">
            共 {stats.total} 筆證據 · 首筆 {stats.first_captured_at ?? "—"} · 末筆 {stats.last_captured_at ?? "—"}（字串排序非時間權威）
          </span>
        )}
        {statsMessage !== null && <span className="text-[10px] text-slate-400">{statsMessage}</span>}
      </div>
      {stats !== null && stats.hooks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {stats.hooks.map((h) => (
            <button
              key={h}
              type="button"
              className={`filter-chip px-2 py-0.5 text-[10px] ${
                hook.trim() === h ? "chip-on" : ""
              }`}
              onClick={() => applyHookBadge(h)}
              title={`${h} × ${stats.by_hook[h] ?? 0} 筆，點擊以該 hook 篩選時間軸`}
            >
              {h} × {stats.by_hook[h] ?? 0}
            </button>
          ))}
        </div>
      )}
      {data !== null && data.entries.length > 0 && (
        <p className="mt-2 text-[10px] text-slate-500">
          第 {data.offset + 1}–{data.offset + data.entries.length} 筆 / 共 {data.total} 筆
        </p>
      )}
      {message !== null && <p className="mt-2 text-[10px] text-slate-400">{message}</p>}
      {data !== null && data.entries.length > 0 && (
        <ul className="mt-3 space-y-2">
          {data.entries.map((e, i) => (
            <li
              key={`${e.uuid}-${e.entry.captured_at}-${i}`}
              className="rounded-xl border border-slate-100/10 bg-slate-900/40 p-2.5 text-[11px]"
              title={`node_version ${e.node_version} · lock_hash ${e.lock_hash}（綁定當下節點狀態）`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  className="rounded bg-omni-alpha/20 px-1.5 py-0.5 text-omni-alpha transition hover:bg-omni-alpha/40"
                  onClick={() => onJump(e.uuid)}
                  title="跳轉至該節點"
                >
                  {e.uuid.slice(0, 8)}
                </button>
                <span className="rounded bg-omni-sigma/20 px-1.5 py-0.5 text-omni-sigma">{e.entry.hook_lifecycle}</span>
                <span className="text-slate-500">{e.entry.captured_at}</span>
              </div>
              <p className="mt-1 text-slate-400">
                {e.entry.source_origin} · {e.entry.content_hash.slice(0, 12)}…
              </p>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-[10px] text-slate-400" htmlFor="omni-evidence-page-size">
          每頁
        </label>
        <select
          id="omni-evidence-page-size"
          className="rounded-lg border border-slate-100/10 bg-slate-900/60 px-1.5 py-1 text-[10px] text-slate-200 disabled:opacity-50"
          value={pageSize}
          disabled={busy}
          onChange={(e) => changePageSize(Number(e.target.value))}
          title="每頁筆數（limit 1..500 道閘內之 10／20／50）"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>{size} 筆</option>
          ))}
        </select>
        <button
          type="button"
          className="rounded-lg border border-slate-100/10 px-2.5 py-1 text-[10px] text-slate-300 disabled:opacity-40"
          disabled={busy || !hasPrev}
          onClick={() => jumpTo(page - 1)}
        >
          上一頁
        </button>
        {pageWindow.map((item, i) =>
          item === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[10px] text-slate-500">…</span>
          ) : (
            <button
              key={item}
              type="button"
              className={`min-w-[24px] rounded-lg border px-1.5 py-1 text-[10px] transition ${
                item === page
                  ? "border-omni-alpha/60 bg-omni-alpha/20 text-omni-alpha"
                  : "border-slate-100/10 text-slate-300 hover:border-omni-alpha/40"
              }`}
              disabled={busy}
              onClick={() => jumpTo(item)}
              title={`跳轉至第 ${item + 1} 頁`}
            >
              {item + 1}
            </button>
          ),
        )}
        <button
          type="button"
          className="rounded-lg border border-slate-100/10 px-2.5 py-1 text-[10px] text-slate-300 disabled:opacity-40"
          disabled={busy || !hasNext}
          onClick={() => jumpTo(page + 1)}
        >
          下一頁
        </button>
      </div>
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
          className="btn btn-primary shrink-0"
          onClick={() => void run()}
        >
          熔合
        </button>
      </div>
      {message !== null && (
        <p className="mt-2 text-xs text-[color:var(--warning)] opacity-90">
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
                    className="text-[11px] text-slate-500 transition hover:text-[color:var(--danger)]"
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
            className={`filter-chip px-2 py-0.5 text-[10px] ${
              conflict === "skip" ? "chip-on-success" : ""
            }`}
            title="既有節點且 lock_hash 相異時保留既有"
            onClick={() => setConflict("skip")}
          >
            衝突：保留
          </button>
          <button
            type="button"
            className={`filter-chip px-2 py-0.5 text-[10px] ${
              conflict === "overwrite" ? "chip-on-warning" : ""
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
