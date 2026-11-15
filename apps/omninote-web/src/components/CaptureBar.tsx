"use client";

import { useRef, useState } from "react";
import type { PointerEvent } from "react";
import { appendBlock, captureNote } from "@/lib/api";

const CAPTURE_PLACEHOLDER = "靈感碎片… 一句話捕獲，Alpha 起點";

export function CaptureBar({ onCaptured }: { onCaptured: () => void }) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function submit(): Promise<void> {
    const trimmed = text.trim();
    if (trimmed.length === 0 || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await captureNote(trimmed, tags.split(/[,，\s]+/).filter((t) => t.length > 0));
      setText("");
      setTags("");
      setMessage("已捕獲 ✓");
      onCaptured();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "捕獲失敗");
    } finally {
      setBusy(false);
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), 2600);
    }
  }

  return (
    <div className="glass p-5">
      <textarea
        id="omni-capture"
        className="field min-h-[76px] resize-none"
        placeholder={CAPTURE_PLACEHOLDER}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
        }}
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          className="field flex-1 min-w-[160px]"
          placeholder="標籤（逗號分隔，可留空）"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <button
          type="button"
          className="rounded-xl bg-omni-alpha/90 px-5 py-2 text-sm font-medium text-slate-950 transition hover:bg-omni-alpha disabled:opacity-50"
          disabled={busy || text.trim().length === 0}
          onClick={() => void submit()}
        >
          {busy ? "捕獲中…" : "速記 ⌘↵"}
        </button>
        {message !== null && <span className="text-xs text-slate-300">{message}</span>}
      </div>
    </div>
  );
}

type SketchPoint = readonly [number, number];

function sketchPath(points: readonly SketchPoint[]): string {
  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]} ${p[1]}`).join(" ");
}

export function SketchBar({ onCaptured }: { onCaptured: () => void }) {
  const [points, setPoints] = useState<SketchPoint[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  function locate(e: PointerEvent<SVGSVGElement>): SketchPoint {
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect === undefined) return [0, 0];
    return [Math.round(e.clientX - rect.left), Math.round(e.clientY - rect.top)];
  }

  async function save(): Promise<void> {
    if (points.length < 2 || busy) return;
    setBusy(true);
    try {
      const stamp = new Date().toISOString();
      const note = await captureNote(`sketch ${stamp}`, ["sketch"]);
      await appendBlock(
        note.uuid,
        "sketch_vector",
        `![[sketch_${note.uuid.slice(0, 8)}.svg]] ${sketchPath(points)}`,
      );
      setPoints([]);
      setMessage("塗鴉已封存 ✓");
      onCaptured();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "塗鴉儲存失敗");
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 2600);
    }
  }

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">塗鴉速寫</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-500/30 px-3 py-1 text-xs text-slate-300 transition hover:border-omni-alpha/60"
            onClick={() => setPoints([])}
          >
            清空
          </button>
          <button
            type="button"
            className="rounded-lg bg-omni-sigma/90 px-3 py-1 text-xs text-slate-100 transition hover:bg-omni-sigma disabled:opacity-50"
            disabled={busy}
            onClick={() => void save()}
          >
            封存塗鴉
          </button>
        </div>
      </div>
      <svg
        ref={svgRef}
        className="mt-3 h-40 w-full touch-none rounded-xl border border-slate-500/20 bg-slate-950/50 cursor-crosshair"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setPoints([locate(e)]);
        }}
        onPointerMove={(e) => {
          setPoints((prev) => (prev.length === 0 ? prev : [...prev, locate(e)]));
        }}
        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
      >
        <path
          d={sketchPath(points)}
          stroke="#00A896"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {message !== null && <p className="mt-2 text-xs text-slate-300">{message}</p>}
    </div>
  );
}
