"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase-client";
import {
  onAuthChange,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  type User,
} from "@/lib/auth";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  createdAt: number;
  updatedAt?: number;
}

interface Attachment {
  id: string;
  noteId: string;
  name: string;
  path: string;
  size: number;
  type: string;
  url: string;
  createdAt: number;
}

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
}

type NotesPayload = { notes?: Note[]; total?: number; note?: Note; deleted?: string };
type AttachmentsPayload = { attachments?: Attachment[]; attachment?: Attachment };

const SUPABASE_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const ATTACHMENTS_BUCKET = "note-attachments";

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

function formatSize(size: number): string {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export default function NotesClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!SUPABASE_ENABLED);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"in" | "up">("in");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [accessToken, setAccessToken] = useState<string>("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiFetch = useCallback(
    (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
      if (init?.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(url, { ...init, headers });
    },
    [accessToken]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await apiFetch("/api/notes", { cache: "no-store" });
      if (!r.ok) throw new Error(`GET /api/notes -> ${r.status}`);
      const j = (await r.json()) as ApiEnvelope<NotesPayload>;
      setNotes(j.data?.notes ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "載入筆記失敗");
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  const loadAttachments = useCallback(
    async (noteId: string) => {
      try {
        const r = await apiFetch(`/api/notes/${encodeURIComponent(noteId)}/attachments`, {
          cache: "no-store",
        });
        if (!r.ok) throw new Error(`GET attachments -> ${r.status}`);
        const j = (await r.json()) as ApiEnvelope<AttachmentsPayload>;
        setAttachments(j.data?.attachments ?? []);
      } catch {
        setAttachments([]);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    if (!SUPABASE_ENABLED) {
      load();
      return;
    }
    const unsub = onAuthChange((u) => {
      setUser(u);
      setAuthReady(true);
      supabase.auth.getSession().then(({ data }) => {
        setAccessToken(data.session?.access_token ?? "");
      });
    });
    return unsub;
  }, [load]);

  useEffect(() => {
    if (authReady) load();
  }, [authReady, load]);

  useEffect(() => {
    if (selectedId) loadAttachments(selectedId);
    else setAttachments([]);
  }, [selectedId, loadAttachments]);

  useEffect(() => {
    if (!SUPABASE_ENABLED || !user || !accessToken) return;
    const channel = supabase
      .channel(`notes:${user.uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `user_id=eq.${user.uid}`,
        },
        (payload) => {
          const row = payload.new as Note | undefined;
          const oldRow = payload.old as { id?: string } | undefined;
          if (payload.eventType === "INSERT" && row) {
            setNotes((prev) => [row, ...prev.filter((n) => n.id !== row.id)]);
          } else if (payload.eventType === "UPDATE" && row) {
            setNotes((prev) => prev.map((n) => (n.id === row.id ? row : n)));
          } else if (payload.eventType === "DELETE" && oldRow?.id) {
            setNotes((prev) => prev.filter((n) => n.id !== oldRow.id));
            if (selectedId === oldRow.id) newNote();
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, accessToken, selectedId]);

  const selected = useMemo(
    () => notes.find((n) => n.id === selectedId) ?? null,
    [notes, selectedId]
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.tags ?? []) set.add(t);
    return [...set].sort((a, b) => a.localeCompare(b));
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
        const r = await apiFetch(`/api/notes/${encodeURIComponent(selectedId)}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`PUT -> ${r.status}`);
        const j = (await r.json()) as ApiEnvelope<NotesPayload>;
        const saved = j.data?.note;
        setNotes((prev) => prev.map((n) => (n.id === selectedId && saved ? saved : n)));
        setNotice("已儲存");
      } else {
        const r = await apiFetch("/api/notes", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(`POST -> ${r.status}`);
        const j = (await r.json()) as ApiEnvelope<NotesPayload>;
        const created = j.data?.note;
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
  }, [apiFetch, title, content, tagsInput, selectedId]);

  const remove = useCallback(async () => {
    if (!selectedId) return;
    if (!window.confirm("確定要刪除這則筆記嗎？")) return;
    setSaving(true);
    setNotice(null);
    try {
      const r = await apiFetch(`/api/notes/${encodeURIComponent(selectedId)}`, {
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
  }, [apiFetch, selectedId, newNote]);

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0 || !selectedId || !user) return;
      setUploading(true);
      setNotice(null);
      try {
        for (const file of Array.from(files)) {
          const storagePath = `${user.uid}/${selectedId}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage
            .from(ATTACHMENTS_BUCKET)
            .upload(storagePath, file, { contentType: file.type || undefined });
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage
            .from(ATTACHMENTS_BUCKET)
            .getPublicUrl(storagePath);
          const r = await apiFetch(`/api/notes/${encodeURIComponent(selectedId)}/attachments`, {
            method: "POST",
            body: JSON.stringify({
              name: file.name,
              path: storagePath,
              size: file.size,
              type: file.type,
              url: pub.publicUrl,
            }),
          });
          if (!r.ok) throw new Error(`register attachment -> ${r.status}`);
        }
        await loadAttachments(selectedId);
        setNotice("附件已上傳");
      } catch (e) {
        setNotice(e instanceof Error ? `上傳失敗: ${e.message}` : "上傳失敗");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [apiFetch, loadAttachments, selectedId, user]
  );

  const removeAttachmentById = useCallback(
    async (attId: string) => {
      try {
        const r = await apiFetch(
          `/api/notes/${encodeURIComponent(selectedId ?? "")}/attachments?id=${encodeURIComponent(attId)}`,
          { method: "DELETE" }
        );
        if (!r.ok) throw new Error(`DELETE attachment -> ${r.status}`);
        setAttachments((prev) => prev.filter((a) => a.id !== attId));
      } catch (e) {
        setNotice(e instanceof Error ? `刪除附件失敗: ${e.message}` : "刪除附件失敗");
      }
    },
    [apiFetch, selectedId]
  );

  const submitAuth = useCallback(async () => {
    setAuthBusy(true);
    setAuthError(null);
    try {
      if (authMode === "in") {
        await signInWithEmail(authEmail.trim(), authPassword);
      } else {
        await signUpWithEmail(authEmail.trim(), authPassword);
      }
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "驗證失敗");
    } finally {
      setAuthBusy(false);
    }
  }, [authEmail, authPassword, authMode]);

  if (SUPABASE_ENABLED && authReady && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-lg font-semibold">萬能筆記</h1>
          <p className="mt-1 text-sm text-slate-500">
            使用 Supabase 帳號登入（免費層）以同步你的筆記
          </p>
          <input
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="mt-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          <input
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="密碼（至少 6 位）"
            type="password"
            minLength={6}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
          />
          {authError && <p className="mt-2 text-xs text-red-600">{authError}</p>}
          <button
            onClick={submitAuth}
            disabled={authBusy || !authEmail || !authPassword}
            className="mt-4 w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {authBusy ? "處理中…" : authMode === "in" ? "登入" : "註冊"}
          </button>
          <button
            onClick={() => setAuthMode(authMode === "in" ? "up" : "in")}
            className="mt-2 w-full text-center text-xs text-blue-600 hover:underline"
          >
            {authMode === "in" ? "沒有帳號？註冊" : "已有帳號？登入"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:gap-3 sm:px-4">
        <h1 className="text-lg font-semibold">萬能筆記</h1>
        {user && (
          <span className="truncate text-xs text-slate-500">{user.email}</span>
        )}
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
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs ${
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
          {user && (
            <button
              onClick={() => signOut()}
              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs dark:border-slate-700"
            >
              登出
            </button>
          )}
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

          {selectedId && SUPABASE_ENABLED && (
            <div className="border-t border-slate-200 px-3 py-2 dark:border-slate-800 sm:px-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">附件</span>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 disabled:opacity-50"
                >
                  {uploading ? "上傳中…" : "上傳檔案"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => onFiles(e.target.files)}
                />
              </div>
              {attachments.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {attachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate text-blue-600 hover:underline"
                      >
                        {a.name}
                      </a>
                      <span className="shrink-0 text-slate-400">{formatSize(a.size)}</span>
                      <button
                        onClick={() => removeAttachmentById(a.id)}
                        className="ml-auto shrink-0 rounded border border-red-300 px-1.5 py-0.5 text-[11px] text-red-600"
                      >
                        移除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

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
