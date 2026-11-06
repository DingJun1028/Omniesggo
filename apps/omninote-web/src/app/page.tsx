"use client";

import { useCallback, useEffect, useState } from "react";
import type { OmniApiDraft, OmniApiHealth, OmniApiNode } from "@/lib/api";
import { buildExportUrl, fetchDrafts, fetchHealth, fetchNotes } from "@/lib/api";
import { CaptureBar, SketchBar } from "@/components/CaptureBar";
import { HealthPanel } from "@/components/HealthPanel";
import { DraftsPanel, NotesBoard, SearchPanel } from "@/components/Panels";
import { NoteDetail } from "@/components/NoteDetail";
import { FusionGraph } from "@/components/FusionGraph";
import { CommandPalette, type PaletteAction } from "@/components/CommandPalette";

export default function HomePage() {
  const [health, setHealth] = useState<OmniApiHealth | null>(null);
  const [notes, setNotes] = useState<OmniApiNode[]>([]);
  const [drafts, setDrafts] = useState<OmniApiDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const [h, n, d] = await Promise.all([fetchHealth(), fetchNotes(), fetchDrafts()]);
      setHealth(h);
      setNotes(n);
      setDrafts(d);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "資料載入失敗");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const selected =
    selectedUuid === null ? null : (notes.find((n) => n.uuid === selectedUuid) ?? null);

  const paletteActions: PaletteAction[] = [
    { id: "capture", label: "聚焦速記欄", hint: "⌘↵ 捕獲", run: () => focusById("omni-capture") },
    { id: "search", label: "聚焦熔合檢索", hint: "語意搜尋", run: () => focusById("omni-search") },
    { id: "refresh", label: "重新整理全部資料", hint: "30s 自動輪詢", run: () => void refresh() },
    { id: "export", label: "封印導出（稽核封存）", hint: "GET /api/export", run: () => window.open(buildExportUrl(), "_blank") },
    { id: "bottom", label: "跳至圖譜與草稿區", hint: "結晶/封印", run: () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" }) },
  ];

  function updateNode(next: OmniApiNode): void {
    setNotes((prev) => prev.map((n) => (n.uuid === next.uuid ? next : n)));
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          OmniNote<span className="text-omni-alpha">:</span> Unified
        </h1>
        <p className="text-xs text-slate-400">
          全生命週期流式筆記 — 速記 · 塗鴉 · 雙鏈熔合 · 結晶 · 封印
        </p>
        <button
          type="button"
          className="ml-auto rounded-lg border border-slate-500/30 px-3 py-1.5 text-xs text-slate-300 transition hover:border-omni-alpha/60 hover:text-slate-100"
          onClick={() => setPaletteOpen(true)}
        >
          ⌘K 指令面板
        </button>
      </header>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        actions={paletteActions}
        notes={notes}
        onSelectNote={(uuid) => {
          setSelectedUuid(uuid);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <CaptureBar onCaptured={() => void refresh()} />
          <SketchBar onCaptured={() => void refresh()} />
        </section>
        <section className="space-y-4">
          <HealthPanel health={health} error={error} />
          <SearchPanel
            onJump={(uuid) => {
              setSelectedUuid(uuid);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </section>
      </div>

      {selected !== null && (
        <div className="mt-4">
          <NoteDetail
            note={selected}
            onClose={() => setSelectedUuid(null)}
            onUpdated={updateNode}
          />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <NotesBoard
            notes={notes}
            selectedUuid={selectedUuid}
            onSelect={setSelectedUuid}
            onChanged={() => void refresh()}
          />
        </section>
        <section className="space-y-4">
          <FusionGraph
            notes={notes}
            onSelect={(uuid) => {
              setSelectedUuid(uuid);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
          <DraftsPanel drafts={drafts} onChanged={() => void refresh()} />
        </section>
      </div>

      <footer className="fixed inset-x-0 bottom-4 flex justify-center px-4">
        <nav className="glass flex max-w-[428px] items-center justify-around gap-1 px-2 py-2">
          <NavButton label="速記" hint="⌘↵ 一句捕獲" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <NavButton label="塗鴉" hint="向量速寫" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <NavButton label="熔合" hint="語意檢索" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
          <NavButton label="結晶" hint="草稿晉升" onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })} />
          <NavButton label="封印" hint="稽核導出" onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })} />
        </nav>
      </footer>
    </main>
  );
}

function NavButton({ label, hint, onClick }: { label: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="group flex flex-col items-center rounded-xl px-3 py-1.5 transition hover:bg-slate-100/5"
      onClick={onClick}
    >
      <span className="text-sm font-medium text-slate-200 group-hover:text-omni-alpha">{label}</span>
      <span className="text-[10px] text-slate-500">{hint}</span>
    </button>
  );
}

function focusById(id: string): void {
  const el = document.getElementById(id);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  el?.focus();
}
