"use client";

import type { OmniApiHealth } from "@/lib/api";

export function HealthPanel({
  health,
  error,
}: {
  health: OmniApiHealth | null;
  error: string | null;
}) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-slate-200">本機回環引擎</h2>
        {/* JunAiKey .status 語意徽章 Semantic status pill（online/offline 由 globals.css 代幣衍生） */}
        <span className={`status ${error !== null ? "offline" : "online"}`}>
          {error !== null ? "離線" : "在線"}
        </span>
      </div>
      {error !== null ? (
        <p className="mt-3 text-xs leading-5 text-[color:var(--danger)] opacity-90">{error}</p>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="節點" value={health?.nodes ?? "…"} />
          <Stat label="向量" value={health?.vectors ?? "…"} />
          <Stat label="草稿" value={health?.drafts ?? "…"} />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-500/15 bg-slate-900/40 px-3 py-2.5 text-center">
      <div className="text-lg font-semibold text-slate-100">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{label}</div>
    </div>
  );
}
