"use client";
import { useState, useCallback, useEffect } from "react";
import { useAgnesApi } from "../../src/components/AgnesProvider";

export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  createdAt: number;
}

import DOMPurify from "isomorphic-dompurify";

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

function loadNotes(): Promise<NoteData[]> {
  return fetch("/api/notes").then((r) => {
    if (!r.ok) throw new Error("Failed to fetch notes");
    return r.json();
  }).then((data) => {
    const notes = Array.isArray(data?.notes) ? data.notes : [];
    return notes
      .map((n: unknown) => {
        const raw = n as Record<string, unknown>;
        return {
        id: String(raw.id ?? raw._id ?? ""),
        title: String(raw.title ?? ""),
        content: String(raw.content ?? ""),
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        fiveTGate: raw.fiveTGate ?? raw.five_t_gate ?? undefined,
        createdAt: typeof raw.createdAt === "number"
          ? raw.createdAt
          : typeof raw.created_at === "string" || typeof raw.created_at === "number"
            ? new Date(raw.created_at).getTime()
            : Date.now(),
        };
      })
      .filter((n: NoteData) => n.id);
  });
}

export function OmniNoteCRUD() {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [editing, setEditing] = useState<NoteData | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    content: "",
    tags: "",
    fiveTGate: "",
  });
  const [preview, setPreview] = useState<string | null>(null);

  const { isReady, processMessage } = useAgnesApi();
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const data = await loadNotes();
        if (!cancelled) setNotes(data);
      } catch {
        if (!cancelled) setNotes([]);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const startCreate = () => {
    setDraft({ title: "", content: "", tags: "", fiveTGate: "" });
    setCreating(true);
    setEditing(null);
  };
  const startEdit = (n: NoteData) => {
    setDraft({
      title: n.title,
      content: n.content,
      tags: (n.tags ?? []).join(", "),
      fiveTGate: n.fiveTGate || "",
    });
    setEditing(n);
    setCreating(false);
  };
  const cancel = useCallback(() => {
    setCreating(false);
    setEditing(null);
  }, []);

  const save = useCallback(async () => {
    const tags = (draft.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: draft.title || "未命名",
      content: draft.content,
      tags,
      fiveTGate: draft.fiveTGate || null,
      createdAt: editing?.createdAt ?? Date.now(),
    };

    const endpoint = editing
      ? `/api/notes/${editing.id}`
      : "/api/notes";

    const method = editing ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Notes API failed: ${res.status}`);
    const data = await res.json();
    const saved = data?.note ?? data;

    if (editing) {
      setNotes((prev) => prev.map((item) => (item.id === editing.id ? { ...item, ...saved } : item)));
    } else {
      setNotes((prev) => [saved, ...prev]);
    }

    cancel();
  }, [draft, editing, cancel]);

  const remove = useCallback(async (id: string) => {
    const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setNotes((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const gateColorVar = (g?: string) =>
    g === "traceable"
      ? "var(--accent-blue)"
      : g === "transparent"
        ? "var(--accent-green)"
        : g === "tangible"
          ? "var(--accent-gold)"
          : g === "trustworthy"
            ? "var(--accent-purple)"
            : g === "trackable"
              ? "var(--accent-cyan)"
              : "var(--text-secondary)";

  const renderMd = (s: string) => {
    const sanitized = sanitizeHtml(s);
    return sanitized
      .replace(
        /^### (.+)$/gm,
        '<h3 style="color:var(--accent-gold);font-size:14px;margin:8px 0 4px">$1</h3>',
      )
      .replace(
        /^## (.+)$/gm,
        '<h2 style="color:var(--accent-teal);font-size:15px;margin:10px 0 4px">$1</h2>',
      )
      .replace(
        /^# (.+)$/gm,
        '<h1 style="color:var(--accent-teal);font-size:17px;margin:10px 0 6px">$1</h1>',
      )
      .replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="color:var(--text-primary)">$1</strong>',
      )
      .replace(
        /`(.+?)`/g,
        '<code style="background:var(--bg);padding:1px 5px;border-radius:3px;font-family:monospace;font-size:12px;color:var(--accent-cyan)">$1</code>',
      )
      .replace(/\n/g, "<br/>");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-textSecondary tracking-wider">
          萬能筆記 (OmniNote) — CRUD
        </div>
        <button
          onClick={startCreate}
          className="border-none rounded-lg px-3.5 py-1.5 text-xs cursor-pointer font-semibold bg-accentTeal text-white hover:opacity-90 transition-opacity"
        >
          + 新增筆記
        </button>
      </div>

      {/* Editor */}
      {(creating || editing) && (
        <div className="bg-secondary border border-accentTeal rounded-xl p-4 mb-3.5">
          <div className="text-xs text-accentTeal mb-2.5 font-semibold">
            {editing ? "✏️ 編輯筆記" : "✨ 新增筆記"}
          </div>
          <input
            className="w-full bg-primary border border-borderColor rounded-lg px-2.5 py-2 text-textPrimary text-[13px] outline-none font-['Noto_Sans_TC',sans-serif] mb-2 focus:border-accentTeal"
            placeholder="標題"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />

          <div className="flex gap-1.5 mb-2">
            <button
              onClick={() => setPreview(null)}
              className={`flex-1 border-none rounded-lg px-3.5 py-1.5 text-xs cursor-pointer font-semibold transition-colors ${preview === null ? "bg-accentTeal text-white" : "bg-primary text-textSecondary"}`}
            >
              ✏️ 編輯
            </button>
            <button
              onClick={() => setPreview(draft.content)}
              className={`flex-1 border-none rounded-lg px-3.5 py-1.5 text-xs cursor-pointer font-semibold transition-colors ${preview !== null ? "bg-accentGold text-white" : "bg-primary text-textSecondary"}`}
            >
              👁 預覽
            </button>
          </div>

          {preview !== null ? (
            <div
              className="min-h-[100px] bg-primary border border-borderColor rounded-lg px-3 py-2.5 text-[13px] leading-[1.8] text-textPrimary"
              dangerouslySetInnerHTML={{ __html: renderMd(preview) }}
            />
          ) : (
            <textarea
              className="w-full bg-primary border border-borderColor rounded-lg px-2.5 py-2 text-textPrimary text-[13px] outline-none font-['Noto_Sans_TC',sans-serif] min-h-[100px] resize-y block focus:border-accentTeal"
              placeholder="內容 (支援 Markdown: # ## ### **粗體** `code`)"
              value={draft.content}
              onChange={(e) =>
                setDraft((d) => ({ ...d, content: e.target.value }))
              }
            />
          )}

          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="flex gap-1.5">
              <input
                className="w-full bg-primary border border-borderColor rounded-lg px-2.5 py-2 text-textPrimary text-[13px] outline-none font-['Noto_Sans_TC',sans-serif] focus:border-accentTeal"
                placeholder="標籤 (逗號分隔)"
                value={draft.tags}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, tags: e.target.value }))
                }
              />
              {isReady && (
                <button
                  onClick={async () => {
                    if (!draft.content) return;
                    setIsGenerating(true);
                    const res = await processMessage(
                      `Extract 3 short comma-separated keywords/tags for this text, return ONLY the keywords separated by commas: ${draft.content.substring(0, 300)}`,
                    );
                    if (res) setDraft((d) => ({ ...d, tags: res }));
                    setIsGenerating(false);
                  }}
                  disabled={isGenerating}
                  className={`shrink-0 border-none rounded-lg px-2.5 py-1.5 text-xs font-semibold ${isGenerating ? "bg-primary text-textSecondary cursor-not-allowed" : "bg-accentPurple text-white cursor-pointer hover:opacity-90"}`}
                  title="Auto Generate Tags via AGNES"
                >
                  {isGenerating ? "⏳" : "🪄 AI"}
                </button>
              )}
            </div>
            <select
              className="w-full bg-primary border border-borderColor rounded-lg px-2.5 py-2 text-textPrimary text-[13px] outline-none font-['Noto_Sans_TC',sans-serif] cursor-pointer focus:border-accentTeal"
              value={draft.fiveTGate}
              onChange={(e) =>
                setDraft((d) => ({ ...d, fiveTGate: e.target.value }))
              }
            >
              <option value="">5T 門控 (選填)</option>
              {[
                "traceable",
                "transparent",
                "tangible",
                "trustworthy",
                "trackable",
              ].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 mt-3">
            <button
              onClick={save}
              className="border-none rounded-lg px-3.5 py-1.5 text-xs cursor-pointer font-semibold bg-accentGreen text-white hover:opacity-90 transition-opacity"
            >
              💾 儲存
            </button>
            <button
              onClick={cancel}
              className="border-none rounded-lg px-3.5 py-1.5 text-xs cursor-pointer font-semibold bg-primary text-textSecondary hover:opacity-90 transition-opacity"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* Note List */}
      <div className="flex flex-col gap-2">
        {notes.length === 0 && (
          <div className="text-textSecondary text-[13px] text-center p-5">
            尚無筆記，點擊「新增筆記」開始
          </div>
        )}
        {notes.map((n) => (
          <div
            key={n.id}
            className="bg-primary rounded-xl p-3 border"
            style={{ borderColor: gateColorVar(n.fiveTGate) }}
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] text-textPrimary mb-1">
                  {n.title}
                </div>
                <div className="text-xs text-textSecondary leading-[1.6] mb-1.5 overflow-hidden line-clamp-2">
                  {n.content}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {n.fiveTGate && (
                    <span
                      className="text-[10px] rounded px-1.5 py-[1px] font-bold"
                      style={{
                        color: gateColorVar(n.fiveTGate),
                        backgroundColor: "var(--surface)",
                        border: `1px solid ${gateColorVar(n.fiveTGate)}`,
                      }}
                    >
                      {n.fiveTGate}
                    </span>
                  )}
                  {(n.tags ?? []).map((t) => (
                    <span
                      key={t}
                      className="text-[10px] text-accentTeal bg-accentTeal/10 rounded px-1.5 py-[1px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button
                  onClick={() => startEdit(n)}
                  className="border-none rounded-lg px-2.5 py-1 text-[11px] cursor-pointer font-semibold bg-accentGold text-white hover:opacity-90 transition-opacity"
                >
                  編輯
                </button>
                <button
                  onClick={() => remove(n.id)}
                  className="border-none rounded-lg px-2.5 py-1 text-[11px] cursor-pointer font-semibold bg-[#FF4D6D] text-white hover:opacity-90 transition-opacity"
                >
                  刪除
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
