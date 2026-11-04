"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  createdAt: number;
  updatedAt?: number;
}

interface NotesEnvelope {
  success?: boolean;
  data?: { notes?: Note[]; note?: Note; deleted?: string; total?: number };
  notes?: Note[];
  note?: Note;
}

function parseNotes(json: unknown): Note[] {
  const j = json as NotesEnvelope;
  const list = j?.data?.notes ?? j?.notes ?? [];
  return Array.isArray(list) ? list : [];
}

function parseNote(json: unknown): Note | null {
  const j = json as NotesEnvelope;
  return j?.data?.note ?? j?.note ?? null;
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatTs(ts: number): string {
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

function snippet(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 80);
}

export default function NotesClient() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"list" | "editor">("list");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/notes", { cache: "no-store" });
      if (!r.ok) throw new Error(`GET /api/notes -> ${r.status}`);
      setNotes(parseNotes(await r.json()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入筆記失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.tags ?? []) set.add(t);
    return [...set].sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes.filter((n) => {
      if (activeTag && !(n.tags ?? []).includes(activeTag)) return false;
      if (!q) return true;
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [notes, search, activeTag]);

  const selectNote = useCallback((n: Note) => {
    setSelectedId(n.id);
    setTitle(n.title);
    setContent(n.content);
    setTagsInput((n.tags ?? []).join(", "));
    setPreview(false);
    setNotice(null);
    setMobilePanel("editor");
  }, []);

  const newNote = useCallback(() => {
    setSelectedId(null);
    setTitle("");
    setContent("");
    setTagsInput("");
    setPreview(false);
    setNotice(null);
    setMobilePanel("editor");
  }, []);

  const save = useCallback(async () => {
    if (!title.trim()) {
      setNotice("請先輸入標題");
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const payload = { title: title.trim(), content, tags: parseTags(tagsInput) };
      if (selectedId) {
        const r = await fetch(`/api/notes/${encodeURIComponent(selectedId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`PUT -> ${r.status}`);
        const saved = parseNote(await r.json());
        setNotes((prev) =>
          prev.map((n) => (n.id === selectedId && saved ? saved : n))
        );
        setNotice("已儲存");
      } else {
        const r = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`POST -> ${r.status}`);
        const created = parseNote(await r.json());
        if (created) {
          setNotes((prev) => [created, ...prev]);
          setSelectedId(created.id);
        }
        setNotice("已建立");
      }
    } catch (e) {
      setNotice(e instanceof Error ? `儲存失敗: ${e.message}` : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }, [title, content, tagsInput, selectedId]);

  const remove = useCallback(async () => {
    if (!selectedId) return;
    if (!window.confirm("確定要刪除這則筆記嗎？")) return;
    setSaving(true);
    setNotice(null);
    try {
      const r = await fetch(`/api/notes/${encodeURIComponent(selectedId)}`, {
        method: "DELETE",
      });
      if (!r.ok) throw new Error(`DELETE -> ${r.status}`);
      setNotes((prev) => prev.filter((n) => n.id !== selectedId));
      newNote();
      setNotice("已刪除");
    } catch (e) {
      setNotice(e instanceof Error ? `刪除失敗: ${e.message}` : "刪除失敗");
    } finally {
      setSaving(false);
    }
  }, [selectedId, newNote]);

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:gap-3 sm:px-4">
        <h1 className="text-lg font-semibold">萬能筆記</h1>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋標題、內容、標籤…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 sm:w-64"
        />
        <div className="flex max-w-full flex-1 items-center gap-1 overflow-x-auto">
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={`rounded-full px-2.5 py-1 text-xs ${
                activeTag === t
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          {notice && <span className="text-xs text-slate-500">{notice}</span>}
          <button
            onClick={newNote}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
          >
            新增筆記
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={`${
            mobilePanel === "editor" ? "hidden" : "flex"
          } w-full max-h-[45vh] shrink-0 flex-col overflow-y-auto border-b border-slate-200 dark:border-slate-800 md:max-h-none md:w-80 md:border-b-0 md:border-r`}
        >
          {loading && <p className="p-4 text-sm text-slate-500">載入中…</p>}
          {error && (
            <div className="p-4 text-sm text-red-600">
              <p>載入失敗：{error}</p>
              <button
                onClick={load}
                className="mt-2 rounded-md border border-red-300 px-2 py-1 text-xs text-red-600"
              >
                重試
              </button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="p-4 text-sm text-slate-500">沒有筆記。點「新增筆記」建立第一則。</p>
          )}
          <ul>
            {filtered.map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => selectNote(n)}
                  className={`block w-full border-b border-slate-100 px-4 py-3 text-left dark:border-slate-900 ${
                    n.id === selectedId
                      ? "bg-blue-50 dark:bg-slate-900"
                      : "hover:bg-slate-100 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <div className="truncate text-sm font-medium">{n.title || "（無標題）"}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500">{snippet(n.content)}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatTs(n.updatedAt ?? n.createdAt)}</span>
                    <span>{(n.tags ?? []).map((t) => `#${t}`).join(" ")}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <main
          className={`${
            mobilePanel === "list" ? "hidden" : "flex"
          } min-w-0 flex-1 flex-col md:flex`}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800 sm:px-4">
            <button
              onClick={() => setMobilePanel("list")}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 md:hidden"
            >
              ← 列表
            </button>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="筆記標題"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-slate-400"
            />
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="標籤（以逗號分隔）"
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 sm:w-48"
            />
            <button
              onClick={() => setPreview((p) => !p)}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs dark:border-slate-700"
            >
              {preview ? "編輯" : "預覽"}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "儲存中…" : "儲存"}
            </button>
            {selectedId && (
              <button
                onClick={remove}
                disabled={saving}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs text-white hover:bg-red-700 disabled:opacity-50"
              >
                刪除
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {preview ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="以 Markdown 撰寫筆記內容…"
                className="h-full w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-slate-400"
              />
            )}
          </div>

          {selected && (
            <footer className="border-t border-slate-200 px-4 py-1.5 text-[11px] text-slate-400 dark:border-slate-800">
              建立於 {formatTs(selected.createdAt)}
              {selected.updatedAt ? ` · 更新於 ${formatTs(selected.updatedAt)}` : ""}
              {selected.fiveTGate ? ` · 5T Gate: ${selected.fiveTGate}` : ""}
            </footer>
          )}
        </main>
      </div>
    </div>
  );
}
