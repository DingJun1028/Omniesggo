import React, { useState, useEffect, useRef } from 'react';
import { useFirebase, initAuth, subscribeSubmissions, addSubmission, uploadFiles, signInWithGoogle, signOut, migrateLocalToNcb } from './db';
import { getKnowledgeEntries } from './repositories/rag.repository';
import { refreshRoleFromClaims, setupProfileIfMissing } from './repositories/auth.repository';
import { getUserProfile, upsertUserProfile } from './repositories/profile.repository';
import {
  BookOpen, Upload, PlayCircle,
  Smile, Database, ShieldCheck, ArrowLeft, Send, ChevronDown, FileText,
  Search, Trash2, Filter, Users, LogIn, LogOut,
  User, Download
} from 'lucide-react';
import translations from './i18n/translations';

const ADMIN_PASS = import.meta.env?.VITE_ADMIN_PASS || import.meta.env.VITE_ADMIN_PASS || '';

const CardLink = ({ href, icon, title }) => (
  <a href={href} target="_blank" rel="noreferrer" className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer min-h-[130px] sm:min-h-[160px]">
    <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">{icon}</div>
    <h3 className="text-lg font-bold text-[#003262]">{title}</h3>
  </a>
);

const CardAction = ({ onClick, icon, title }) => (
  <div onClick={onClick} className="bg-white p-5 sm:p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer min-h-[130px] sm:min-h-[160px]">
    <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">{icon}</div>
    <h3 className="text-lg font-bold text-[#003262]">{title}</h3>
  </div>
);

const renderFiles = (files) => (
  <div className="flex flex-col gap-2">
    {files.map((f, i) => (
      <a key={i} href={f.url || f.data} download={f.name} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[#003262] hover:underline text-xs bg-slate-50 border border-slate-200 rounded p-2">
        <FileText size={14} className="shrink-0" />
        <span className="truncate font-medium">{f.name}</span>
        <span className="text-slate-400 ml-auto whitespace-nowrap">{(f.size ? `${(f.size / 1024).toFixed(0)} KB` : '')} ↓</span>
      </a>
    ))}
  </div>
);

const Field = ({ label, value }) => value ? (
  <div className="mb-2">
    <div className="text-xs font-bold text-slate-400 mb-0.5">{label}</div>
    <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">{value}</div>
  </div>
) : null;

const DetailPanel = ({ t, item }) => {
  const d = item.data || {};
  const atts = d.attachments || [];
  return (
    <div className="text-sm">
      {item.type === 'upload' && (<>
        <Field label={t.detail.note} value={d.desc} />
        {atts.length > 0 && (<><div className="text-xs font-bold text-slate-400 mb-0.5">{t.detail.files}</div>{renderFiles(atts)}</>)}
        {atts.length === 0 && <div className="text-xs text-slate-400">{t.detail.noFiles}</div>}
      </>)}
      {item.type === 'booking' && (<><Field label={t.detail.booking.name} value={d.name} /><Field label={t.detail.booking.email} value={d.email} /><Field label={t.detail.booking.time} value={d.time} /><Field label={t.detail.booking.topic} value={d.topic} /></>)}
      {item.type === 'question' && (<><Field label={t.detail.question.submitterName || '提問人姓名'} value={d.submitterName} /><Field label={t.detail.question.submitterEmail || '提問人 Email'} value={d.submitterEmail} /><Field label={t.detail.question.role} value={d.role} /><Field label={t.detail.question.challenge} value={d.challenge} /><Field label={t.detail.question.mainQuestion} value={d.mainQuestion} />{atts.length > 0 && (<><div className="text-xs font-bold text-slate-400 mb-0.5">{t.detail.supplements}</div>{renderFiles(atts)}</>)}</>)}
      {item.type === 'survey' && (<>
        <Field label={t.detail.survey.week} value={d.meta?.week} />
        <Field label={t.detail.survey.date} value={d.meta?.date} />
        <Field label={t.detail.survey.theme} value={d.meta?.theme} />
        <Field label={t.detail.survey.lecturer} value={d.meta?.lecturer} />
        <Field label={t.detail.survey.name} value={d.meta?.name} />
        <Field label={t.detail.survey.org} value={d.meta?.org} />
        {d.ratings && Object.keys(d.ratings).length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-3">{Object.entries(d.ratings).map(([q, v]) => (<span key={q} className="text-xs bg-[#FDB515]/15 text-[#b47b00] px-2 py-1 rounded font-mono">Q:{q.slice(-1)} = {v}</span>))}</div>
        ) : <div className="text-xs text-slate-400 mb-2">{t.detail.survey.noRatings}</div>}
        <Field label={t.detail.survey.feedback + ' 1'} value={d.open?.open_1} />
        <Field label={t.detail.survey.feedback + ' 2'} value={d.open?.open_2} />
        <Field label={t.detail.survey.feedback + ' 3'} value={d.open?.open_3} />
        {atts.length > 0 && (<><div className="text-xs font-bold text-slate-400 mb-0.5">{t.detail.supplements}</div>{renderFiles(atts)}</>)}
      </>)}
    </div>
  );
};



const ReplayListView = ({ t, videos, onSelect }) => {
  if (!videos) return <div className="p-6 text-center text-slate-500">{t.replay.loading}</div>;
  if (!videos.length) return <div className="p-6 text-center text-slate-500">{t.replay.empty}</div>;
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
      {videos.map((video) => (
        <button key={video.id} onClick={() => onSelect(video)} className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-slate-100 text-left hover:shadow-md hover:border-[#FDB515] transition-all">
          <div className="text-xs font-bold text-[#b47b00] mb-1">{video.week}</div>
          <div className="text-sm font-semibold text-[#003262] mb-1 truncate">{video.title}</div>
          <div className="text-xs text-slate-400">{video.date}</div>
        </button>
      ))}
    </div>
  );
};

const ReplayPlayerView = ({ t, video, onBack }) => (
  <div className="max-w-5xl mx-auto" onContextMenu={(e) => e.preventDefault()}>
    <button onClick={onBack} className="text-sm font-bold text-[#003262] hover:underline mb-3 inline-flex items-center gap-1"><ArrowLeft size={16} /> {t.replay.backToList}</button>
    <div className="relative bg-black rounded-xl overflow-hidden select-none">
      <iframe src={`https://drive.google.com/file/d/${video.id}/preview`} className="w-full aspect-video" allow="autoplay" title={video.title}></iframe>
      <div className="absolute bottom-2 right-3 text-white/60 text-xs pointer-events-none select-none">{t.replay.watermark}</div>
    </div>
    <div className="mt-3">
      <div className="text-xs font-bold text-[#b47b00]">{video.week}</div>
      <div className="text-lg font-bold text-[#003262]">{video.title}</div>
      <div className="text-xs text-slate-400">{video.date}</div>
    </div>
  </div>
);

const RecordsView = ({ data, isAdmin, t, lang }) => {
  const [filterType, setFilterType] = useState('all');
  const [filterQuery, setFilterQuery] = useState('');
  const filtered = data.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (filterQuery) {
      const hay = `${item.userId} ${JSON.stringify(item.data || {})}`.toLowerCase();
      if (!hay.includes(filterQuery.toLowerCase())) return false;
    }
    return true;
  });
  const [expanded, setExpanded] = useState(null);
  const deleteSubmission = async (id) => {
    if (!confirm(t.list.confirmDelete)) return;
    await deleteSubmission(id);
  };
  const exportCsv = () => {
    if (!filtered.length) return;
    const header = ['id', 'userId', 'type', 'createdAt'];
    const rows = filtered.map((item) => [item.id, item.userId, item.type, item.createdAt]);
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `submissions_${lang}_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 text-[#003262]"><Filter size={16} /> <span className="text-sm font-bold">{t.list.filters}</span></div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-slate-100 border-none text-sm rounded-lg py-2 px-3 outline-none cursor-pointer">
            <option value="all">{t.list.all}</option>
            <option value="upload">{t.types.upload}</option>
            <option value="booking">{t.types.booking}</option>
            <option value="question">{t.types.question}</option>
            <option value="survey">{t.types.survey}</option>
          </select>
          <button onClick={() => { setFilterQuery(''); setFilterType('all'); }} className="text-xs text-slate-500 hover:text-[#003262] underline">{t.list.reset}</button>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} placeholder={t.list.search} className="bg-transparent outline-none text-sm w-full" />
          </div>
          {isAdmin && (<button onClick={exportCsv} className="flex items-center gap-2 bg-[#003262] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#002244] transition-colors"><Download size={16} /> {t.list.export}</button>)}
        </div>
        <div className="text-xs text-slate-400">{t.list.count.replace('{n}', String(filtered.length))}</div>
      </div>
      {filtered.length === 0 && (<div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">{t.list.noResults}</div>)}
      <div className="flex flex-col gap-3">
        {filtered.map((item) => {
          const isOpen = expanded === item.id;
          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : item.id)} className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="bg-[#FDB515]/20 text-[#b47b00] px-2 py-0.5 rounded-md text-sm font-bold">{t.types[item.type] || item.type}</span>
                    {isAdmin && (<span className="text-xs font-mono text-slate-400">{item.userId.slice(0,8)}…</span>)}
                    {item.type === 'question' && item.data?.submitterName && (<span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">{item.data.submitterName}</span>)}
                    {isAdmin && item.data?.submitterEmail && (<span className="text-xs text-slate-500">{item.data.submitterEmail}</span>)}
                  </div>
                  <div className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                {isOpen ? <ChevronDown size={20} className="text-slate-400 shrink-0 rotate-180" /> : <ChevronDown size={20} className="text-slate-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50">
                  <DetailPanel t={t} item={item} />
                  {isAdmin && (<button onClick={() => deleteSubmission(item.id)} className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"><Trash2 size={14} /> {t.list.delete}</button>)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function App() {
  const [lang, setLang] = useState('zh-TW');
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [role, setRole] = useState('student');
    const [adminPrompt, setAdminPrompt] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e) => { if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) setProfileMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileMenuOpen]);
  const [replayView, setReplayView] = useState('list');
  const [replayVideos, setReplayVideos] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
      const [authMessage, setAuthMessage] = useState('');
  const [profileSetup, setProfileSetup] = useState(false);
  const [profileForm, setProfileForm] = useState({ displayName: '', email: '', org: '' });
  const [error, setError] = useState(null);
  const t = translations[lang];

  useEffect(() => {
    window.onerror = (_msg, _url, _line, _col, err) => { setError(err || new Error(String(_msg))); };
    window.addEventListener('unhandledrejection', (e) => { const err = e?.reason; setError(err || new Error(String(e))); });
    const unsub = initAuth((u) => {
      setUser(u);
      if (!u) return;
      refreshRoleFromClaims(u).then((r) => setRole(r));
    });
    // 2026-08-25 無縫轉移: 若啟用 NCBDB (VITE_NCB_API_KEY 已設), 自動把 localStorage 資料遷移至 NCBDB
    // 無 Key 時 migrateLocalToNcb 內部自動 skip, 不影響現有 localStorage 行為
    migrateLocalToNcb().catch((e) => console.warn('[NCB Migration] skipped:', e?.message || e));
    return () => { if (unsub) unsub(); };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeSubmissions(user.uid, setSubmissions);
    return () => { if (unsub) unsub(); };
  }, [user]);

  useEffect(() => {
    if (view !== 'replay') return;
    setReplayView('list'); setSelectedVideo(null);
    let cancelled = false;
    (async () => {
      try {
        const replayUrl = import.meta.env?.VITE_REPLAY_WEB_APP_URL || import.meta.env.VITE_REPLAY_WEB_APP_URL || '';
        const trimmed = replayUrl.trim();
        if (!trimmed) { if (!cancelled) setReplayVideos([]); return; }
        const res = await fetch(trimmed);
        const text = await res.text();
        const jsonp = text.match(/^[^(]*\((.*)\);\s*$/s);
        const payload = jsonp ? JSON.parse(jsonp[1]) : JSON.parse(text);
        if (!cancelled) setReplayVideos(payload.videos || []);
      } catch (err) {
        console.error('replay fetch failed', err);
        if (!cancelled) setReplayVideos([]);
      }
    })();
    return () => { cancelled = true; };
  }, [view]);

  const handleReplaySelect = (video) => { setSelectedVideo(video); setReplayView('player'); };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      setAuthMessage(t.auth.signInSuccess || '登入成功');
      const auth = await import('firebase/auth').then((m) => m.getAuth());
      const currentUser = auth.currentUser;
      if (currentUser) {
        const existing = await getUserProfile(currentUser.uid);
        if (!existing) {
          setProfileForm({ displayName: currentUser.displayName || '', email: currentUser.email || '', org: '' });
          setProfileSetup(true);
        }
      }
    } catch (err) {
      console.error(err);
      const msg = String(err?.message || err);
      setAuthMessage(msg || (t.auth.signInFailed || '登入失敗，請稍後再試。'));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setRole('student'); setAdminOk(false); setProfileMenuOpen(false); setAuthMessage('');
    setView('home'); setProfileSetup(false); setProfileForm({ displayName: '', email: '', org: '' });
  };

  useEffect(() => {
    if (view !== 'knowledge') return;
    let cancelled = false;
    (async () => {
      const entries = await getKnowledgeEntries();
      if (!cancelled) setKnowledgeEntries(entries);
    })();
    return () => { cancelled = true; };
  }, [view]);


  const confirmAdmin = () => {
    if (!ADMIN_PASS || adminInput === ADMIN_PASS) { setAdminOk(true); setRole('admin'); setView('admin'); }
    else { alert(t.error?.adminWrongPassword || t.admin?.wrongPassword || '管理員密碼錯誤'); }
    setAdminPrompt(false); setAdminInput('');
  };

  const handleSubmit = async (e, type, formData) => {
    e.preventDefault();
    if (!user) return;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn?.innerText; if (submitBtn) { submitBtn.innerText = t.saving; submitBtn.disabled = true; }
    try {
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      const attachments = await uploadFiles(formData.attachments || []);
      await addSubmission({ userId: user.uid, type, data: formData }, attachments, id);
      alert(t.success);
      setView('records');
    } catch (err) {
      console.error(err);
      alert(t.error.generic || '發生錯誤');
    } finally { if (submitBtn) { submitBtn.innerText = originalText; submitBtn.disabled = false; } }
  };

  const layoutShell = (children) => (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center gap-2 sm:gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="text-sm font-extrabold text-[#003262] tracking-tight">ESGGO</span>
          {view !== 'home' && (
            <button onClick={() => setView('home')} className="text-sm font-bold text-slate-500 hover:text-[#003262] inline-flex items-center gap-1 transition-colors bg-slate-100 px-3 py-1.5 rounded-md hover:bg-slate-200">
              <ArrowLeft size={16} /> {t.back}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end">
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-slate-100 border-none text-sm font-semibold text-[#003262] rounded-lg py-2 px-3 outline-none cursor-pointer hover:bg-slate-200 transition-colors">
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">简体中文</option>
            <option value="en">English</option>
          </select>
          <div className="relative" ref={profileMenuRef}>
            {user && !user.isLocal && !user.isAnonymous ? (
              <button onClick={() => setProfileMenuOpen(!profileMenuOpen)} className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#003262] px-3 py-2 rounded-lg text-sm font-semibold transition-colors" title={user.email || user.displayName || ''}>
                {user.photoURL ? (<img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />) : (<User size={16} />)}
                <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0] || ''}</span>
                <ChevronDown size={14} />
              </button>
            ) : (
              <button onClick={handleGoogleSignIn} className="inline-flex items-center gap-2 bg-[#003262] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#002244] transition-colors shadow-sm">
                <LogIn size={16} /> <span className="hidden sm:inline">{t.auth?.signInGoogle || 'Google 登入'}</span>
              </button>
            )}
            {profileMenuOpen && user && !user.isLocal && !user.isAnonymous && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg w-56 z-[60] overflow-hidden" onClick={() => setProfileMenuOpen(false)}>
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-sm font-bold text-[#003262] truncate">{user.displayName || ''}</div>
                  <div className="text-xs text-slate-400 truncate">{user.email || ''}</div>
                  <div className="mt-1 text-[10px] font-semibold text-[#b47b00] bg-[#FDB515]/15 inline-block px-2 py-0.5 rounded">{t[`role${role === 'admin' ? 'Admin' : role === 'TA' ? 'TA' : 'Student'}`] || role}</div>
                </div>
                <button onClick={async () => { await handleSignOut(); setProfileMenuOpen(false); }} className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 inline-flex items-center gap-2 transition-colors">
                  <LogOut size={16} /> {t.auth?.signOut || '登出'}
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      {children}
      <footer className="text-center text-slate-400 text-xs mt-12 pb-6">{t.footer}</footer>
    </div>
  );

  return layoutShell(
    <>
      {authMessage && (<div className="max-w-5xl mx-auto mb-4"><div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{authMessage}</div></div>)}
      {error && (<div className="max-w-5xl mx-auto mb-6"><div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-4 whitespace-pre-wrap font-mono">{error?.message}{'\n'}{error?.stack}</div></div>)}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-1">
        <div className="text-[10px] text-slate-400">{useFirebase ? t.list.storageMode : t.list.localMode}</div>
      </div>

      {view === 'home' && (
        <div className="max-w-5xl mx-auto mb-10">
          <div className="bg-[#003262] rounded-2xl p-6 sm:p-10 md:p-14 text-center shadow-lg relative overflow-hidden border-b-4 border-[#FDB515]">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#FDB515] rounded-full opacity-10 blur-3xl"></div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 relative z-10 font-serif tracking-tight leading-[1.5]">{t.heroTitleLine1}<br className="hidden sm:inline" />{t.heroTitleLine2}</h2>
          </div>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <CardLink href="https://drive.google.com/drive/folders/1-ZOC6sPNGISeD7Rf6lYT3Q10yYZaTdAy?usp=drive_link" icon={<BookOpen size={28} />} title={t.f1} />
            <CardLink href="https://forms.gle/B5hSmQSBi3t24Tn38" icon={<Upload size={28} />} title={t.f2} />
            <CardAction onClick={() => setView('replay')} icon={<PlayCircle size={28} />} title={t.f3} />
            <CardLink href="https://docs.google.com/forms/d/e/1FAIpQLSeLEij5XZ1TtBqxHYoNAx22QCSvfr-WPg0yp26hceq6d_ZMWg/viewform" icon={<Smile size={28} />} title={t.f6} />
          </div>
        </div>
      )}

      {['upload','booking','question','survey'].includes(view) && (
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sm:p-8">
            <h2 className="text-2xl font-bold text-[#003262] mb-6">{t.forms[view]?.title || view}</h2>
            <form onSubmit={(e) => {
              const fd = { ...(view === 'question' ? {
                submitterName: e.target.elements.questionSubmitterName?.value || '',
                submitterEmail: e.target.elements.questionSubmitterEmail?.value || '',
              } : {}) };
              handleSubmit(e, view, fd);
            }} className="flex flex-col gap-5">
              {view === 'question' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.question.fieldSubmitter || '提問人姓名'} <span className="text-red-500">*</span></label>
                    <input required name="questionSubmitterName" type="text" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" placeholder={t.question.fieldSubmitterPlaceholder || '您的姓名'} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.question.fieldSubmitterEmail || '提問人 Email'} <span className="text-red-500">*</span></label>
                    <input required name="questionSubmitterEmail" type="email" className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" placeholder={t.question.fieldSubmitterEmailPlaceholder || '您的 Email'} />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{view === 'upload' ? t.forms.upload.file : view === 'booking' ? t.forms.booking.name : ''}</label>
                <input required type="file" multiple onChange={() => {}} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-[#003262] file:font-semibold hover:file:bg-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{view === 'upload' ? t.forms.upload.desc : view === 'booking' ? t.forms.booking.topic : ''}</label>
                <textarea onChange={() => {}} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none h-32" placeholder={t.common.optionalLabel}></textarea>
              </div>
              <button type="submit" className="mt-4 bg-[#003262] text-white font-bold py-3 rounded-lg hover:bg-[#002244] transition-colors inline-flex items-center justify-center gap-2"><Send size={18} /> {t.submit}</button>
            </form>
          </div>
        </div>
      )}

      {view === 'replay' && replayView === 'list' && <ReplayListView t={t} videos={replayVideos} onSelect={handleReplaySelect} />}
      {view === 'replay' && replayView === 'player' && selectedVideo && <ReplayPlayerView t={t} video={selectedVideo} onBack={() => setReplayView('list')} />}

      {view === 'records' && (
        <>
          <div className="max-w-5xl mx-auto mt-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003262] mb-4 sm:mb-6 inline-flex items-center gap-3"><Database className="text-[#FDB515]" /> {t.myRecords}</h2>
            <RecordsView data={submissions.filter((s) => s.userId === user?.uid)} isAdmin={false} t={t} lang={lang} />
          </div>
        </>
      )}
      {view === 'ta' && (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-[#003262] mb-4 sm:mb-6 inline-flex items-center gap-3"><Users className="text-[#FDB515]" /> {t.taPanel || 'TA 助教視角'}</h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
            <p className="text-sm text-slate-500">TA 配對與管理畫面將於下一階段完成。目前請使用其他功能。</p>
          </div>
        </div>
      )}
      {view === 'admin' && (
        <>
          <div className="max-w-5xl mx-auto mt-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#003262] mb-4 sm:mb-6 inline-flex items-center gap-3"><ShieldCheck className="text-[#FDB515]" /> {t.admin}</h2>
            <RecordsView data={submissions} isAdmin={true} t={t} lang={lang} />
          </div>
        </>
      )}
      {adminPrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-[#003262] mb-2">管理員驗證</h3>
            <p className="text-xs text-slate-500 mb-3">請輸入管理員密碼以切換為管理員視角。</p>
            <input type="password" value={adminInput} onChange={(e) => setAdminInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmAdmin()} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-[#003262] mb-3" autoFocus />
            <div className="flex gap-2">
              <button onClick={confirmAdmin} className="flex-1 bg-[#003262] text-white font-bold py-2 rounded-lg">確認</button>
              <button onClick={() => { setAdminPrompt(false); setAdminInput(''); }} className="flex-1 bg-slate-100 text-slate-700 font-bold py-2 rounded-lg">取消</button>
            </div>
          </div>
        </div>
      )}
      {profileSetup && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => {}}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              await setupProfileIfMissing({ ...user, displayName: profileForm.displayName, email: profileForm.email, });
              await upsertUserProfile(user.uid, { displayName: profileForm.displayName, email: profileForm.email, org: profileForm.org, });
              setProfileSetup(false);
            } catch (err) { console.error('Profile setup error:', err); }
          }} className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[#003262]">{t.auth?.setupProfile || '個人資料設定'}</h3>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.auth?.displayName || '顯示名稱'}</label>
              <input autoFocus type="text" required value={profileForm.displayName} onChange={(e) => setProfileForm((prev) => ({ ...prev, displayName: e.target.value }))} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.auth?.email || 'Email'}</label>
              <input type="email" required value={profileForm.email} onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{t.auth?.org || '組織'}</label>
              <input type="text" value={profileForm.org} onChange={(e) => setProfileForm((prev) => ({ ...prev, org: e.target.value }))} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" />
            </div>
            <button type="submit" className="mt-2 bg-[#003262] text-white font-bold py-3 rounded-lg hover:bg-[#002244] transition-colors">{t.auth?.saveAndContinue || '儲存並繼續'}</button>
          </form>
        </div>
      )}
    </>
  );
}
