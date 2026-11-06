"use client";

import { useCallback, useEffect, useState } from "react";
import type { OmniApiDraft, OmniApiHealth, OmniApiNote } from "@/lib/api";
import { fetchDrafts, fetchHealth, fetchNotes } from "@/lib/api";
import { CaptureBar, SketchBar } from "@/components/CaptureBar";
import { HealthPanel } from "@/components/HealthPanel";
import { DraftsPanel, NotesBoard, SearchPanel } from "@/components/Panels";

export default function HomePage() {
  const [health, setHealth] = useState<OmniApiHealth | null>(null);
  const [notes, setNotes] = useState<OmniApiNote[]>([]);
  const [drafts, setDrafts] = useState<OmniApiDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-slate-50">
          OmniNote<span className="text-omni-alpha">:</span> Unified
        </h1>
        <p className="text-xs text-slate-400">
          全生命週期流式筆記 — 速記 · 塗鴉 · 雙鏈熔合 · 結晶 · 封印
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <CaptureBar onCaptured={() => void refresh()} />
          <SketchBar onCaptured={() => void refresh()} />
        </section>
        <section className="space-y-4">
          <HealthPanel health={health} error={error} />
          <SearchPanel onJump={() => undefined} />
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <NotesBoard notes={notes} onChanged={() => void refresh()} />
        </section>
        <section>
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
