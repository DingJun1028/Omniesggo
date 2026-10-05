'use client';

import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { signOut } from '@/lib/auth';
import { OmniCard, OmniCardContent, OmniCardHeader, OmniCardTitle } from '@/components/omni-base/OmniCard';
import { OmniButton } from '@/components/omni-base/OmniButton';
import { LogOut, User as UserIcon, BookOpen, CloudUpload, Image as ImageIcon, CalendarCheck, HelpCircle, Star, ExternalLink, Trash2 } from 'lucide-react';

type ResourceItem = { id?: string; title: string; category?: string; url?: string };

const TRANSLATIONS: Record<string, Record<string, string>> = {
  'zh-Hant': {
    welcome: '歡迎，',
    logout: '登出',
    login: '前往登入',
    sectionResources: '資源管理 (僅管理員)',
    recent: '近期新增',
    delete: '刪除',
    resTitle: '資源名稱',
    catShared: '共用資源',
    catAssignment: '作業區',
    catReplay: '影片回放',
    catConsulting: '顧問區',
    catQuestion: '提問區',
    catSurvey: '滿意度調查',
    resUrl: '網址 (URL)',
    saveResource: '儲存資源',
    footer: 'OmniESGGo Learning Center • Powered by 5T Protocol',
    c1Title: '共用資源與教材',
    c1Desc: '存取講義、簡報與學習補充資料',
    c1Link: '開啟資料夾',
    c2Title: '作業與報告上傳',
    c2Desc: '上傳您的 ESG 評估與實作報告',
    c2Link: '前往上傳區',
    c3Title: '課程回放影片',
    c3Desc: '複習先前的線上課程與會議紀錄',
    c3Link: '觀看回放',
    c4Title: '顧問時段預約',
    c4Desc: '與 ESG 專家預約一對一指導時間',
    c4Link: '前往預約系統',
    c5Title: '線上提問信箱',
    c5Desc: '學習過程中遇到問題？隨時發問',
    c5Link: '填寫問題單',
    c6Title: '學習滿意度調查',
    c6Desc: '分享您的回饋，協助我們持續進步',
    c6Link: '填寫問卷',
  },
  'zh-Hans': {
    welcome: '欢迎，',
    logout: '退出',
    login: '前往登录',
    sectionResources: '资源管理 (仅管理员)',
    recent: '近期新增',
    delete: '删除',
    resTitle: '资源名称',
    catShared: '共用资源',
    catAssignment: '作业区',
    catReplay: '回放影片',
    catConsulting: '顾问区',
    catQuestion: '提问区',
    catSurvey: '满意度调查',
    resUrl: '网址 (URL)',
    saveResource: '保存资源',
    footer: 'OmniESGGo Learning Center • Powered by 5T Protocol',
    c1Title: '共用资源与教材',
    c1Desc: '存取讲义、简报与学习补充资料',
    c1Link: '打开文件夹',
    c2Title: '作业与报告上传',
    c2Desc: '上传您的 ESG 评估与实作报告',
    c2Link: '前往上传区',
    c3Title: '课程回放影片',
    c3Desc: '复习先前的线上课程与会议纪录',
    c3Link: '观看回放',
    c4Title: '顾问时段预约',
    c4Desc: '与 ESG 专家预约一对一指导时间',
    c4Link: '前往预约系统',
    c5Title: '线上提问信箱',
    c5Desc: '学习过程中遇到问题？随时发问',
    c5Link: '填写问题单',
    c6Title: '学习满意度调查',
    c6Desc: '分享您的回馈，协助我们持续进步',
    c6Link: '填写问卷',
  },
  'en': {
    welcome: 'Welcome, ',
    logout: 'Logout',
    login: 'Go to Login',
    sectionResources: 'Resource Management',
    recent: 'Recent Items',
    delete: 'Delete',
    resTitle: 'Resource Title',
    catShared: 'Shared Resources',
    catAssignment: 'Assignments',
    catReplay: 'Replays',
    catConsulting: 'Consulting',
    catQuestion: 'Q & A',
    catSurvey: 'Survey',
    resUrl: 'URL',
    saveResource: 'Save Resource',
    footer: 'OmniESGGo Learning Center • Powered by 5T Protocol',
    c1Title: 'Shared Materials',
    c1Desc: 'Access handouts, slides, and supplementary data',
    c1Link: 'Open Folder',
    c2Title: 'Assignments Upload',
    c2Desc: 'Upload your ESG assessment and implementation reports',
    c2Link: 'Go to Upload Area',
    c3Title: 'Course Replays',
    c3Desc: 'Review previous online classes and meeting records',
    c3Link: 'Watch Replay',
    c4Title: 'Consultation Booking',
    c4Desc: 'Book a 1-on-1 session with an ESG expert',
    c4Link: 'Go to Booking System',
    c5Title: 'Online Q&A Box',
    c5Desc: 'Got a question during your learning? Ask anytime',
    c5Link: 'Submit Question',
    c6Title: 'Satisfaction Survey',
    c6Desc: 'Share your feedback to help us improve',
    c6Link: 'Fill out Survey',
  }
};

export default function LearningCenterPage() {
  const { user } = useAuth();
  const [lang, setLang] = useState('zh-Hant');
  const [resources, setResources] = useState<ResourceItem[]>([]);

  useEffect(() => {
    const stored = (localStorage.getItem('lc_lang') as 'zh-Hant' | 'zh-Hans' | 'en') || 'zh-Hant';
    setLang(stored);
  }, []);

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || key;

  useEffect(() => {
    if (!user) return;
    let canceled = false;
    fetch('/api/admin/resources')
      .then((r) => r.json())
      .then((data) => {
        if (!canceled && data?.ok) setResources(data.rows ?? []);
      })
      .catch(() => {});
    return () => {
      canceled = true;
    };
  }, [user]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* 英雄區塊 (Hero Header) */}
      <div className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-slate-900/40 border border-cyan-500/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-cyan-400 tracking-tight">
              知識與學習中心 (Learning Center)
            </h1>
            <p className="text-sm text-slate-600 dark:text-cyan-100/60 font-medium mt-1">
              ESG 治理教材、線上課程資源與顧問預約系統
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 bg-slate-950/50 backdrop-blur-md border border-cyan-500/20 px-4 py-2 rounded-xl">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <UserIcon size={14} className="text-cyan-400" />
                <span className="text-sm font-bold text-slate-200">
                  {t('welcome')}{user.email?.split('@')[0]}
                </span>
              </div>
              <button 
                onClick={() => signOut()} 
                className="ml-2 text-rose-400 hover:text-rose-300 transition-colors p-1"
                title={t('logout')}
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <a href="/" className="text-cyan-400 font-bold text-sm hover:underline">
              {t('login')}
            </a>
          )}
        </div>
      </div>

      {/* 模組網格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card titleKey="c1Title" descKey="c1Desc" icon={<BookOpen size={24} />} link="https://drive.google.com/drive/folders/1-ZOC6sPNGISeD7Rf6lYT3Q10yYZaTdAy?usp=sharing" linkKey="c1Link" t={t} />
        <Card titleKey="c2Title" descKey="c2Desc" icon={<CloudUpload size={24} />} gold link="https://forms.gle/1paHpA5xSSSZJSFy8" linkKey="c2Link" t={t} />
        <Card titleKey="c3Title" descKey="c3Desc" icon={<ImageIcon size={24} />} link="https://drive.google.com/drive/folders/1-ZOC6sPNGISeD7Rf6lYT3Q10yYZaTdAy?usp=sharing" linkKey="c3Link" t={t} />
        <Card titleKey="c4Title" descKey="c4Desc" icon={<CalendarCheck size={24} />} gold link="https://docs.google.com/forms/d/e/1FAIpQLSdqFeKkOJOrg0erjaP1EFG9zyj98I5E3GpA4m1Zlzy2ZATiEw/viewform" linkKey="c4Link" t={t} />
        <Card titleKey="c5Title" descKey="c5Desc" icon={<HelpCircle size={24} />} link="https://forms.gle/ErFffsbVrmAgyFQJA" linkKey="c5Link" t={t} />
        <Card titleKey="c6Title" descKey="c6Desc" icon={<Star size={24} />} gold link="/satisfaction-survey/index.html" linkKey="c6Link" t={t} />
      </div>

      {/* 資源管理表單 */}
      {user && (
        <OmniCard glow className="mt-8 border-cyan-500/20">
          <OmniCardHeader>
            <OmniCardTitle className="text-cyan-400 flex items-center gap-2">
              <BookOpen size={20} /> {t('sectionResources')}
            </OmniCardTitle>
          </OmniCardHeader>
          <OmniCardContent>
            <ResourceForm t={t} onSaved={(row) => setResources((prev) => [row, ...prev])} />
            <div className="mt-8">
              <div className="text-sm font-bold text-slate-400 mb-4">{t('recent')}</div>
              {resources.length === 0 ? (
                <div className="text-slate-500 italic text-sm">—</div>
              ) : (
                <div className="grid gap-3">
                  {resources.slice(0, 20).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <a href={item.url || '#'} target="_blank" rel="noopener" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                          {item.title}
                        </a>
                        {item.category && (
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <button 
                        data-id={item.id} 
                        className="deleteResourceBtn text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 p-2 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </OmniCardContent>
        </OmniCard>
      )}

      <div className="text-center text-sm text-slate-500 font-mono mt-12 mb-4">
        {t('footer')}
      </div>
    </div>
  );
}

function ResourceForm({ t, onSaved }: { t: (key: string) => string; onSaved: (row: ResourceItem) => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('shared_resource');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = async (event: Event) => {
      const btn = (event.target as HTMLElement).closest('.deleteResourceBtn');
      if (!btn) return;
      const id = btn.getAttribute('data-id');
      if (!id) return;
      const res = await fetch('/api/admin/resources?id=' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await res.json();
      if (data?.ok) {
        btn.closest('div')?.remove();
      }
    };
    const root = document.querySelector('main') || document.body;
    root.addEventListener('click', handler);
    return () => {
      root.removeEventListener('click', handler);
    };
  }, []);

  return (
    <form id="resourceForm" className="grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={(e) => e.preventDefault()}>
      <input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder={t('resTitle')} 
        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
      />
      <select 
        value={category} 
        onChange={(e) => setCategory(e.target.value)} 
        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 appearance-none"
      >
        <option value="shared_resource">{t('catShared')}</option>
        <option value="assignment">{t('catAssignment')}</option>
        <option value="replay">{t('catReplay')}</option>
        <option value="consulting">{t('catConsulting')}</option>
        <option value="question">{t('catQuestion')}</option>
        <option value="survey">{t('catSurvey')}</option>
      </select>
      <input 
        value={url} 
        onChange={(e) => setUrl(e.target.value)} 
        placeholder={t('resUrl')} 
        className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50"
      />
      <OmniButton type="button" variant="primary" className="h-full">
        {t('saveResource')}
      </OmniButton>
      {error && <div className="col-span-full text-rose-400 text-sm">{error}</div>}
    </form>
  );
}

function Card({ titleKey, descKey, icon, link, linkKey, t, gold = false }: { titleKey: string; descKey: string; icon: React.ReactNode; link: string; linkKey: string; t: (key: string) => string; gold?: boolean }) {
  return (
    <OmniCard className={`group relative h-full transition-all duration-300 hover:-translate-y-1 ${gold ? 'border-yellow-500/30' : 'border-cyan-500/20'}`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${gold ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`} />
      <OmniCardContent className="flex flex-col h-full p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${gold ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'}`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
            {t(titleKey)}
          </h3>
        </div>
        <p className="text-sm text-slate-400 mb-6 flex-1">
          {t(descKey)}
        </p>
        <a 
          href={link} 
          target="_blank" 
          rel="noopener" 
          className="flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/50 rounded-xl transition-all font-bold text-sm text-cyan-400 group-hover:text-cyan-300"
        >
          <span>{t(linkKey)}</span>
          <ExternalLink size={16} />
        </a>
      </OmniCardContent>
    </OmniCard>
  );
}
