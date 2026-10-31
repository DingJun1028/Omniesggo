import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, PlayCircle, CalendarCheck, MessageCircleQuestion, Smile, Database, ShieldCheck, ArrowLeft, Send, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, addDoc } from 'firebase/firestore';

// --- Firebase Init ---
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { apiKey: "dummy", projectId: "dummy" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const translations = {
  'zh-TW': {
    heroTitle: '2026 柏克萊國際人才培育課程 學習中心',
    f1: '學員資源區',
    f2: '作業上傳',
    f3: '課程回放',
    f4: '諮詢預約',
    f5: '提問提交',
    f6: '滿意調查',
    records: '用戶資源庫',
    admin: '管理後台',
    myRecords: '我的紀錄',
    roleStudent: '🧑‍🎓 學員視角',
    roleAdmin: '🛡️ 管理員視角',
    back: '返回首頁',
    submit: '送出提交',
    saving: '儲存中...',
    success: '提交成功！',
    footer: '2026 Berkeley ESG Strategy & Innovation Program',
    forms: {
      upload: { title: '作業上傳', file: '選擇檔案', desc: '作業備註說明 (選填)' },
      booking: { title: '諮詢預約', date: '預約日期', time: '預約時段', topic: '諮詢主題' }
    },
    table: { type: '類型', date: '提交時間', details: '內容細節', user: '用戶ID' },
    types: { upload: '作業', booking: '預約', question: '提問', survey: '問卷' }
  },
  'zh-CN': {
    heroTitle: '2026 柏克萊國際人才培育課程 學習中心',
    f1: '學員資源區',
    f2: '作業上傳',
    f3: '課程回放',
    f4: '諮詢預約',
    f5: '提問提交',
    f6: '滿意調查',
    records: '使用者資源庫',
    admin: '管理后台',
    myRecords: '我的紀錄',
    roleStudent: '🧑‍🎓 學員視角',
    roleAdmin: '🛡️ 管理員視角',
    back: '返回首頁',
    submit: '提交',
    saving: '保存中...',
    success: '提交成功！',
    footer: '2026 Berkeley ESG Strategy & Innovation Program',
    forms: {
      upload: { title: '作業上傳', file: '選擇檔案', desc: '備註說明 (選填)' },
      booking: { title: '諮詢預約', date: '預約日期', time: '預約時段', topic: '諮詢主題' }
    },
    table: { type: '型別', date: '提交時間', details: '內容細節', user: '使用者ID' },
    types: { upload: '作業', booking: '預約', question: '提問', survey: '問卷' }
  },
  'en': {
    heroTitle: '2026 Berkeley International Talent Training Center',
    f1: 'Student Resources',
    f2: 'Assignment Upload',
    f3: 'Course Replay',
    f4: 'Consulting Booking',
    f5: 'Submit Question',
    f6: 'Satisfaction Survey',
    records: 'User Resources',
    admin: 'Admin Dashboard',
    myRecords: 'My Records',
    roleStudent: '🧑‍🎓 Student View',
    roleAdmin: '🛡️ Admin View',
    back: 'Back to Home',
    submit: 'Submit',
    saving: 'Saving...',
    success: 'Submitted successfully!',
    footer: '2026 Berkeley ESG Strategy & Innovation Program',
    forms: {
      upload: { title: 'Assignment Upload', file: 'Select file(s)', desc: 'Description (optional)' },
      booking: { title: 'Consulting Booking', date: 'Date', time: 'Time Slot', topic: 'Topic' }
    },
    table: { type: 'Type', date: 'Date', details: 'Details', user: 'User ID' },
    types: { upload: 'Assignment', booking: 'Booking', question: 'Question', survey: 'Survey' }
  }
};

// 滿意度調查表結構
const surveySchema = [
  {
    id: "sec1", title: "一、課程內容與學習價值",
    questions: [
      { id: "q1_1", text: "本週課程主題與內容安排清楚，容易掌握學習重點。" },
      { id: "q1_2", text: "本週課程幫助我深化對 ESG 策略、創新或實務議題的理解。" },
      { id: "q1_3", text: "本週所學對我的工作、組織或專案具有實際應用價值。" }
    ]
  },
  {
    id: "sec2", title: "二、講師教學品質",
    questions: [
      { id: "q2_1", text: "講師對本週主題具有充分的專業知識與實務經驗。" },
      { id: "q2_2", text: "講師能清楚說明重要概念、框架與案例。" },
      { id: "q2_3", text: "講師能有效引導學員思考，並回應學員問題。" },
      { id: "q2_4", text: "講師提供的觀點或工具有助於我形成下一步行動方向。" }
    ]
  },
  {
    id: "sec3", title: "三、教材與學習支持",
    questions: [
      { id: "q3_1", text: "講義、課前學習包或延伸資料有助於我理解本週內容。" },
      { id: "q3_2", text: "課程中的案例、討論或練習有助於將概念轉化為實務。" }
    ]
  },
  {
    id: "sec4", title: "四、行政團隊與課務支持",
    questions: [
      { id: "q4_1", text: "行政團隊能清楚並及時提供課程時間、連結、教材與重要通知。" },
      { id: "q4_2", text: "Zoom、錄影、AI 同傳或其他線上學習工具整體運作順暢。" },
      { id: "q4_3", text: "行政團隊能適時回應本週課程相關問題與需求。" }
    ]
  }
];

// 模擬提問卡資料庫
const mockCases = [
  {
    id: 1, title: "模擬提問卡 01：承岳精密工業股份有限公司", desc: "國際供應鏈壓力下的傳統中小製造業",
    content: `
      <div class="space-y-4">
        <h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li><strong>角色：</strong>林怡君 (總經理室專案經理／兼任 ESG 專案窗口)</li>
          <li><strong>產業：</strong>精密金屬零組件、工業設備與電子零組件供應鏈</li>
          <li><strong>狀態：</strong>公司目前的 ESG 工作主要由客戶問卷與碳資料要求所驅動，尚未從一次性回應轉成可持續管理的制度。</li>
        </ul>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4>
        <p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">
          我們正陸續收到國際客戶對碳排、供應商行為準則、環境與人權資料的要求，但目前資料分散於各部門、責任不清，內部也多將 ESG 視為額外行政工作。<br/><br/>
          我們應如何在 90 天內建立一套最低可行的 ESG 管理底盤，既能回應目前客戶要求，又能逐步建立後續治理、資料與轉型能力？
        </p>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li>90 天內應完成的 ESG 優先工作清單</li>
          <li>跨部門 owner 與責任分工建議</li>
          <li>第一版 ESG 資料與證據清單</li>
        </ul>
        <div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]">
          <strong>💡 為什麼這是好問題？</strong><br/>
          它具備了「組織情境、外部壓力、已知缺口、決策問題與期待產出」。把模糊的「客戶要求很多」轉成了可在 90 天內推進的具體管理底盤設計問題。
        </div>
      </div>
    `
  },
  {
    id: 2, title: "模擬提問卡 02：綠識科技股份有限公司", desc: "技術強但 ESG 基礎與市場驗證不成熟的 AI 新創",
    content: `
      <div class="space-y-4">
        <h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li><strong>角色：</strong>陳柏睿 (共同創辦人暨產品長)</li>
          <li><strong>產業：</strong>AI-enabled ESG SaaS、企業永續資料與決策分析</li>
          <li><strong>狀態：</strong>具有很強的開發能力，但功能範圍過廣，尚未找到最具支付意願的優先市場，也尚未建立足以取得大型企業信任的 Responsible AI 治理。</li>
        </ul>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4>
        <p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">
          我們已開發多個 AI-enabled ESG 模組，但尚未確認哪一個 use case 同時具有最強客戶痛點、支付意願與規模化潛力。<br/><br/>
          我們應如何選出第一個核心市場，設計 90 天驗證計畫，並建立企業客戶所需的 Responsible AI、資料治理與證據機制？
        </p>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li>第一個核心客群與優先 use case 的選擇原則</li>
          <li>90 天 Product-Market Fit 驗證計畫</li>
          <li>Responsible AI 最低可行治理架構</li>
        </ul>
        <div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]">
          <strong>💡 為什麼這是好問題？</strong><br/>
          它展現了企業的 ESG 解方能力走在自身 ESG 管理能力之前的典型困境，要求 Mentor 協助從「功能」收斂到「問題」，從「快速開發」收斂到「可信治理」。
        </div>
      </div>
    `
  },
  {
    id: 3, title: "模擬提問卡 03：仁域國際人道基金會", desc: "使命成熟但 ESG 治理與 Impact Evidence 未系統化的大型 NPO",
    content: `
      <div class="space-y-4">
        <h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li><strong>角色：</strong>張雅雯 (副執行長暨策略與影響力主管)</li>
          <li><strong>產業：</strong>國際人道救援、醫療、教育與社區發展</li>
          <li><strong>狀態：</strong>擁有大量人道服務成果，但影響力資料分散，尚未形成整合治理、環境責任與長期組織韌性的共同架構。</li>
        </ul>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4>
        <p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">
          我們具有明確使命與大量人道服務成果，但影響力資料分散，且內部擔心 ESG 過度企業化。<br/><br/>
          我們應如何建立整合使命、治理、環境責任、利害關係人信任與長期成果證據的 NPO ESG 策略，並以不增加第一線過度負擔的方式逐步落地？
        </p>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li>適合大型 NPO 的 ESG 與 Impact Strategy 架構</li>
          <li>可用於不同事業的共同核心指標與彈性指標設計</li>
          <li>Evidence Chain 與資料治理的基本架構</li>
        </ul>
        <div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]">
          <strong>💡 為什麼這是好問題？</strong><br/>
          點出了 NPO 的核心張力：專業管理與人文使命之間的平衡。要求 Mentor 協助讓「善意有治理、行動有證據、影響有學習」。
        </div>
      </div>
    `
  },
  {
    id: 4, title: "模擬提問卡 04：寰宇智造科技集團", desc: "ESG 1.0 成熟，但缺乏策略投資組合與創價路徑的大型企業",
    content: `
      <div class="space-y-4">
        <h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li><strong>角色：</strong>王思涵 (全球永續策略處處長)</li>
          <li><strong>產業：</strong>電子產品製造、工業自動化與全球供應鏈</li>
          <li><strong>狀態：</strong>已建立成熟的合規底盤，但百項 ESG 專案分散，尚未形成明確的策略投資組合與 ESG 2.0 創價路徑。</li>
        </ul>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4>
        <p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">
          我們已有成熟 ESG 制度及超過 120 項專案，但缺乏區分合規、效率、韌性與成長型創新的共同方法。<br/><br/>
          我們應如何建立 ESG 投資組合與決策治理，選出三至五項企業級優先事項，並決定哪些專案應擴大、整合、重新設計或停止？
        </p>
        <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4>
        <ul class="list-disc pl-5 text-sm text-slate-700">
          <li>ESG 專案投資組合的分類方法</li>
          <li>集團層級 strategic priority 的選擇標準</li>
          <li>Scale、Integrate、Redesign、Stop 的決策規則</li>
        </ul>
        <div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]">
          <strong>💡 為什麼這是好問題？</strong><br/>
          展現了大型企業「做得多，但選得不準」的痛點。要求建立 Portfolio Governance，將 ESG 從「成本專案」轉化為「策略投資」。
        </div>
      </div>
    `
  }
];

export default function App() {
  const [lang, setLang] = useState('zh-TW');
  const [view, setView] = useState('home'); 
  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  
  const [role, setRole] = useState('student'); // 'student' or 'admin'
  const t = translations[lang];

  // Auth Effect
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'artifacts', appId, 'public', 'data', 'submissions');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSubmissions(data);
    }, (err) => console.error("Snapshot error:", err));
    return () => unsubscribe();
  }, [user]);

  // Handle Form Submission
  const handleSubmit = async (e, type, formData) => {
    e.preventDefault();
    if (!user) return;
    
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerText;
    btn.innerText = t.saving;
    btn.disabled = true;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'submissions'), {
        userId: user.uid,
        type: type,
        data: formData,
        createdAt: new Date().toISOString()
      });
      alert(t.success);
      setView(role === 'admin' ? 'admin' : 'records');
    } catch (err) {
      console.error(err);
      alert('Error saving data.');
    } finally {
      if(btn) { btn.innerText = originalText; btn.disabled = false; }
    }
  };

  const HomeView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <a href="https://drive.google.com/drive/folders/1-ZOC6sPNGISeD7Rf6lYT3Q10yYZaTdAy" target="_blank" rel="noreferrer" 
         className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer">
        <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">
          <BookOpen size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#003262]">{t.f1}</h3>
      </a>
      <div onClick={() => setView('upload')} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer">
        <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">
          <Upload size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#003262]">{t.f2}</h3>
      </div>
      <a href="https://www.youtube.com" target="_blank" rel="noreferrer" 
         className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer">
        <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">
          <PlayCircle size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#003262]">{t.f3}</h3>
      </a>
      <div onClick={() => setView('booking')} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer">
        <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">
          <CalendarCheck size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#003262]">{t.f4}</h3>
      </div>
      <div onClick={() => setView('question')} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer">
        <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">
          <MessageCircleQuestion size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#003262]">{t.f5}</h3>
      </div>
      <div onClick={() => setView('survey')} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-[#FDB515] transition-all flex flex-col items-center justify-center gap-4 group cursor-pointer">
        <div className="bg-slate-50 p-4 rounded-full text-[#003262] group-hover:bg-[#003262] group-hover:text-white transition-colors">
          <Smile size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#003262]">{t.f6}</h3>
      </div>
    </div>
  );

  const QuestionForm = () => {
    const [tab, setTab] = useState('write');
    const [openCase, setOpenCase] = useState(null);
    const [formData, setFormData] = useState({});

    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <div className="flex border-b border-slate-200 mb-6">
          <button onClick={()=>setTab('write')} className={`pb-3 px-6 font-bold text-lg ${tab==='write'?'border-b-2 border-[#FDB515] text-[#003262]':'text-slate-400 hover:text-slate-600'}`}>撰寫提問提交</button>
          <button onClick={()=>setTab('cases')} className={`pb-3 px-6 font-bold text-lg flex items-center gap-2 ${tab==='cases'?'border-b-2 border-[#FDB515] text-[#003262]':'text-slate-400 hover:text-slate-600'}`}><FileText size={18}/> 模擬提問卡參考</button>
        </div>

        {tab === 'write' ? (
          <form onSubmit={(e) => handleSubmit(e, 'question', formData)} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">組織與角色</label>
              <input required type="text" onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" placeholder="例如：承岳精密 / 專案經理" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">主要挑戰摘要</label>
              <input required type="text" onChange={e => setFormData({...formData, challenge: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" placeholder="一兩句話摘要目前困境" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">最想請教師資的問題 (Main Question)</label>
              <textarea required onChange={e => setFormData({...formData, mainQuestion: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none h-32" placeholder="詳細描述背景與您的問題..."></textarea>
            </div>
            <button type="submit" className="mt-4 bg-[#003262] text-white font-bold py-3 rounded-lg hover:bg-[#002244] transition-colors flex items-center justify-center gap-2">
              <Send size={18} /> {t.submit}
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-slate-500 mb-2">協助您理解如何把模糊的「客戶要求很多」轉成一個可由 Mentor 診斷、可在 90 天內推進的具體問題。</p>
            {mockCases.map(c => (
              <div key={c.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <button onClick={() => setOpenCase(openCase === c.id ? null : c.id)} className="w-full bg-slate-50 p-4 text-left flex justify-between items-center hover:bg-slate-100 transition-colors">
                  <div>
                    <h4 className="font-bold text-[#003262]">{c.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                  </div>
                  {openCase === c.id ? <ChevronUp size={20} className="text-slate-400"/> : <ChevronDown size={20} className="text-slate-400"/>}
                </button>
                {openCase === c.id && (
                  <div className="p-5 border-t border-slate-200 bg-white" dangerouslySetInnerHTML={{__html: c.content}}></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SurveyForm = () => {
    const [formData, setFormData] = useState({ meta: {}, ratings: {}, open: {} });

    const handleRating = (qId, val) => {
      setFormData(prev => ({ ...prev, ratings: { ...prev.ratings, [qId]: val } }));
    };

    const handleMeta = (field, val) => {
      setFormData(prev => ({ ...prev, meta: { ...prev.meta, [field]: val } }));
    };

    const handleOpen = (field, val) => {
      setFormData(prev => ({ ...prev, open: { ...prev.open, [field]: val } }));
    };

    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-[#003262] mb-2 text-center">每週課後滿意度調查表</h2>
        <p className="text-sm text-slate-500 text-center mb-8">感謝您完成本週課程。您的回覆將作為後續課程優化依據。問卷約需 3–5 分鐘。</p>
        
        <form onSubmit={(e) => handleSubmit(e, 'survey', formData)} className="flex flex-col gap-8">
          
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-lg border border-slate-200">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">課程週次</label><input required onChange={e=>handleMeta('week', e.target.value)} type="text" className="w-full p-2 border rounded outline-none" placeholder="例如：第 1 週"/></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">上課日期</label><input required onChange={e=>handleMeta('date', e.target.value)} type="date" className="w-full p-2 border rounded outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">本週主題</label><input required onChange={e=>handleMeta('theme', e.target.value)} type="text" className="w-full p-2 border rounded outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">講師姓名</label><input required onChange={e=>handleMeta('lecturer', e.target.value)} type="text" className="w-full p-2 border rounded outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">學員姓名 (選填)</label><input onChange={e=>handleMeta('name', e.target.value)} type="text" className="w-full p-2 border rounded outline-none" /></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">所屬組織 (選填)</label><input onChange={e=>handleMeta('org', e.target.value)} type="text" className="w-full p-2 border rounded outline-none" /></div>
          </div>

          <div className="text-sm text-[#003262] font-semibold bg-[#FDB515]/20 p-3 rounded-md text-center">
            評量尺度：1＝非常不同意 ｜ 2＝不同意 ｜ 3＝普通 ｜ 4＝同意 ｜ 5＝非常同意
          </div>

          {surveySchema.map(sec => (
            <div key={sec.id}>
              <h3 className="font-bold text-[#003262] mb-3 border-b-2 border-[#003262] pb-2 inline-block">{sec.title}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-3 text-left font-semibold border-b border-slate-200">評量題目</th>
                      <th className="p-3 text-center w-12 font-semibold border-b border-slate-200">1</th>
                      <th className="p-3 text-center w-12 font-semibold border-b border-slate-200">2</th>
                      <th className="p-3 text-center w-12 font-semibold border-b border-slate-200">3</th>
                      <th className="p-3 text-center w-12 font-semibold border-b border-slate-200">4</th>
                      <th className="p-3 text-center w-12 font-semibold border-b border-slate-200">5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sec.questions.map(q => (
                      <tr key={q.id} className="hover:bg-slate-50 border-b border-slate-100 transition-colors">
                        <td className="p-3 text-slate-700">{q.text}</td>
                        {[1,2,3,4,5].map(val => (
                          <td key={val} className="p-3 text-center align-middle">
                            <input type="radio" name={q.id} value={val} required onChange={() => handleRating(q.id, val)} className="w-4 h-4 text-[#003262] cursor-pointer" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div>
            <h3 className="font-bold text-[#003262] mb-3 border-b-2 border-[#003262] pb-2 inline-block">五、開放式回饋</h3>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">1. 本週課程中，對您最有價值的主題、觀點、案例或工具是什麼？為什麼？</label>
                <textarea required onChange={e=>handleOpen('open_1', e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none h-24 resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">2. 本週課程在內容、教學方式、教材或行政安排上，有哪些地方可以改善？</label>
                <textarea required onChange={e=>handleOpen('open_2', e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none h-24 resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">3. 您希望下週課程或後續學習能進一步回應哪一個問題？</label>
                <textarea required onChange={e=>handleOpen('open_3', e.target.value)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none h-24 resize-none"></textarea>
              </div>
            </div>
          </div>

          <button type="submit" className="mt-4 bg-[#003262] text-white font-bold py-4 rounded-lg hover:bg-[#002244] shadow-md transition-all flex items-center justify-center gap-2 text-lg">
            <Send size={20} /> 提交滿意度調查
          </button>
        </form>
      </div>
    );
  };

  const DynamicForm = ({ type }) => {
    if (type === 'question') return <QuestionForm />;
    if (type === 'survey') return <SurveyForm />;
    
    const config = t.forms[type];
    const [formData, setFormData] = useState({});

    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-[#003262] mb-6 flex items-center gap-3">{config.title}</h2>
        <form onSubmit={(e) => handleSubmit(e, type, formData)} className="flex flex-col gap-5">
          {type === 'upload' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{config.file}</label>
                <input required type="file" multiple onChange={e => handleFiles(e.target.files)} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-[#003262] file:font-semibold hover:file:bg-slate-200" />
                {formData.files && formData.files.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {formData.files.map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><FileText size={14} /> <span className="truncate">{f.name}</span> <span className="text-slate-400">({(f.size / 1024).toFixed(0)} KB)</span></li>
                    ))}
                  </ul>
                )}
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">{config.desc}</label><textarea onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none h-32"></textarea></div>
            </>
          )}
          {type === 'booking' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">{config.date}</label><input required type="date" onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none" /></div>
                <div><label className="block text-sm font-semibold text-slate-700 mb-1">{config.time}</label><select required onChange={e => setFormData({...formData, time: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none"><option value="">Select...</option><option value="Morning">Morning</option><option value="Afternoon">Afternoon</option></select></div>
              </div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">{config.topic}</label><textarea required onChange={e => setFormData({...formData, topic: e.target.value})} className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#003262] outline-none h-24"></textarea></div>
            </>
          )}
          <button type="submit" className="mt-4 bg-[#003262] text-white font-bold py-3 rounded-lg hover:bg-[#002244] transition-colors flex items-center justify-center gap-2"><Send size={18} /> {t.submit}</button>
        </form>
      </div>
    );
  };

  const DataTable = ({ data, isAdmin }) => (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#003262] text-white">
              <th className="p-4 font-semibold text-sm">{t.table.date}</th>
              {isAdmin && <th className="p-4 font-semibold text-sm">{t.table.user}</th>}
              <th className="p-4 font-semibold text-sm">{t.table.type}</th>
              <th className="p-4 font-semibold text-sm">{t.table.details}</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={isAdmin ? 4 : 3} className="p-8 text-center text-slate-500">No records found.</td></tr>
            ) : (
              data.map(item => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-sm text-slate-600 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                  {isAdmin && <td className="p-4 text-xs font-mono text-slate-400">{item.userId.slice(0,8)}...</td>}
                  <td className="p-4 text-sm font-bold text-[#003262]"><span className="bg-[#FDB515]/20 text-[#b47b00] px-2 py-1 rounded-md">{t.types[item.type]}</span></td>
                  <td className="p-4 text-sm text-slate-700">
                    <pre className="whitespace-pre-wrap font-sans text-xs bg-slate-50 p-2 rounded border border-slate-200">{JSON.stringify(item.data, null, 2)}</pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#003262] text-[#FDB515] flex items-center justify-center rounded-lg font-bold text-xl shadow-md">B</div>
          {view !== 'home' && (
            <button onClick={() => setView('home')} className="text-sm font-bold text-slate-500 hover:text-[#003262] flex items-center gap-1 transition-colors bg-slate-100 px-3 py-1.5 rounded-md hover:bg-slate-200">
              <ArrowLeft size={16} /> {t.back}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-slate-100 border-none text-sm font-semibold text-[#003262] rounded-lg py-2 px-3 outline-none cursor-pointer hover:bg-slate-200 transition-colors">
            <option value="zh-TW">繁體中文</option>
            <option value="zh-CN">簡體中文</option>
            <option value="en">English</option>
          </select>

          {}
          <select value={role} onChange={(e) => { setRole(e.target.value); setView('home'); }} className="bg-[#FDB515]/10 border border-[#FDB515]/30 text-sm font-semibold text-[#b47b00] rounded-lg py-2 px-3 outline-none cursor-pointer hover:bg-[#FDB515]/20 transition-colors">
            <option value="student">{t.roleStudent}</option>
            <option value="admin">{t.roleAdmin}</option>
          </select>
          
          {role === 'student' && (
            <button onClick={() => setView('records')} className="flex items-center gap-2 bg-[#003262] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#002244] transition-colors shadow-sm">
              <Database size={16} /> <span className="hidden sm:inline">{t.myRecords}</span>
            </button>
          )}

          {role === 'admin' && (
            <button onClick={() => setView('admin')} className="flex items-center gap-2 bg-[#FDB515] text-[#003262] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#e5a213] transition-colors shadow-sm">
              <ShieldCheck size={16} /> <span className="hidden sm:inline">{t.admin}</span>
            </button>
          )}
        </div>
      </nav>

      <main className="p-6">
        {view === 'home' && (
          <div className="max-w-5xl mx-auto mb-10">
            <div className="bg-[#003262] rounded-2xl p-10 md:p-16 text-center shadow-lg relative overflow-hidden border-b-4 border-[#FDB515]">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#FDB515] rounded-full opacity-10 blur-3xl"></div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-6 relative z-10 font-serif tracking-tight">{t.heroTitle}</h1>
              <a href="https://berkeley-portal-deploy.vercel.app/" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-[#FDB515] text-[#003262] font-bold text-sm px-6 py-2.5 rounded-full hover:bg-yellow-400 transition shadow-md relative z-10"><Globe size={16}/> 前往授權入口網站</a>
            </div>
          </div>
        )}

        {view === 'home' && <HomeView />}
        {['upload', 'booking', 'question', 'survey'].includes(view) && <DynamicForm type={view} />}
        
        {}
        {view === 'records' && role === 'student' && (
          <>
            <h2 className="text-2xl font-bold text-[#003262] max-w-5xl mx-auto mb-6 flex items-center gap-3"><Database className="text-[#FDB515]" /> {t.myRecords}</h2>
            <DataTable data={submissions.filter(s => s.userId === user?.uid)} isAdmin={false} />
          </>
        )}

        {view === 'admin' && role === 'admin' && (
          <>
            <h2 className="text-2xl font-bold text-[#003262] max-w-5xl mx-auto mb-6 flex items-center gap-3"><ShieldCheck className="text-[#FDB515]" /> {t.admin}</h2>
            <DataTable data={submissions} isAdmin={true} />
          </>
        )}
      </main>

      <footer className="text-center text-slate-400 text-xs mt-12 pb-6">
        {t.footer}
      </footer>
    </div>
  );
}
