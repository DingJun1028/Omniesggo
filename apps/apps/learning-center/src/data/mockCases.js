const mockCases = [
  {
    id: 1,
    title: '模擬提問卡 01：承岳精密工業股份有限公司 (COMPLETED SAMPLE)',
    desc: 'Berkeley ESG Consulting Lab Question Card | Profile 01',
    content: `<div class="space-y-4">
      <h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4>
      <ul class="list-disc pl-5 text-sm text-slate-700 space-y-1">
        <li><strong>課程：</strong>Berkeley ESG Strategy & Innovation Program - Consulting Lab Question Card (COMPLETED SAMPLE)</li>
        <li><strong>姓名：</strong>GM Lin (Anonymous)</li>
        <li><strong>組織：</strong>ESG Precision Industries Co., Ltd. (Anonymous)</li>
        <li><strong>職位/角色：</strong>Project Manager, Office of the General Manager / Acting ESG Project Coordinator</li>
        <li><strong>產業/領域：</strong>Precision metal components, industrial equipment, and electronics supply chain</li>
        <li><strong>國家/地點：</strong>Taiwan | Taoyuan and Taichung</li>
      </ul>

      <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 2｜ESG 階段</h4>
      <ul class="list-disc pl-5 text-sm text-slate-700 space-y-1">
        <li>☑ <strong>ESG Reporting / Compliance：</strong>We are working on ESG reporting, disclosure, regulations, or customer requirements.</li>
        <li>☐ ESG Beginner / ESG Implementation / ESG Strategy / ESG Innovation / ESG & AI / ESG for Nonprofit / Other</li>
      </ul>
      <p class="text-sm text-slate-600 mt-1"><strong>現況註記：</strong>Our ESG work is currently driven mainly by international customer questionnaires and requests for carbon, environmental, labor, and supply-chain information. We have not yet converted these one-time responses into a consistent governance and management system.</p>

      <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 3｜主要挑戰</h4>
      <ul class="list-disc pl-5 text-sm text-slate-700 space-y-1">
        <li>▢ We do not know how to start from the strategy level.</li>
        <li>▢ ESG is still viewed as a cost, not a source of value.</li>
        <li>☑ <strong>We lack a practical ESG project or action plan.</strong></li>
        <li>☑ <strong>We lack cross-departmental consensus or internal support.</strong></li>
        <li>▢ We need help with ESG reporting, GRI, IFRS, or disclosure.</li>
        <li>☑ <strong>We need to respond to supply-chain, customer, or low-carbon requirements.</strong></li>
        <li>▢ We want to develop ESG-related business models or services.</li>
        <li>▢ We want to measure impact or build evidence for ESG outcomes.</li>
      </ul>
      <p class="text-sm text-slate-600 mt-1"><strong>挑戰摘要：</strong>Three major international customers have requested carbon data, environmental policies, labor and human-rights information, supplier-code evidence, and improvement plans. Each questionnaire is currently handled on an ad hoc basis by different departments, with no common data definitions, formal owner, or evidence repository.</p>

      <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4>
      <p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">Our company is receiving increasing ESG and carbon-data requirements from international customers. However, our data is fragmented across departments, responsibilities are unclear, and ESG is still treated as an additional administrative task. How should we design a practical 90-day ESG foundation that allows us to respond to immediate customer requirements while also building the governance, data, and implementation capabilities needed for longer-term transformation?</p>

      <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 5｜背景說明</h4>
      <p class="text-sm text-slate-700 mb-2">Chengyue Precision Industries is a 28-year-old family-owned manufacturer of customized precision metal components for industrial equipment, electronics, and automation applications. The company employs approximately 350 people across two production sites. About 75% of revenue comes from European, U.S., and Japanese customers.</p>
      <p class="text-sm text-slate-600 mb-1"><strong>已建立基礎：</strong></p>
      <ul class="list-disc pl-5 text-sm text-slate-600 space-y-0.5">
        <li>Monthly electricity, water, and waste records are available at both production sites.</li>
        <li>The finance team retains utility bills and major purchasing records.</li>
        <li>The human-resources team maintains employment policies, training records, and occupational safety information.</li>
        <li>The procurement team has supplier lists and quality-performance records.</li>
        <li>The factories have implemented energy-efficiency improvements, including lighting, compressed-air, and equipment upgrades.</li>
      </ul>
      <p class="text-sm text-slate-600 mb-1 mt-2"><strong>尚未建立：</strong></p>
      <ul class="list-disc pl-5 text-sm text-slate-600 space-y-0.5">
        <li>No formal organizational greenhouse-gas inventory</li>
        <li>No common data definitions, reporting periods, or organizational boundaries</li>
        <li>No formally appointed executive sponsor, ESG owner, or cross-functional working group</li>
        <li>No shared ESG evidence repository or document-control process</li>
        <li>No ESG baselines, KPIs, targets, or regular management reviews</li>
      </ul>
      <p class="text-sm text-slate-600 mt-2"><strong>為什麼重要：</strong>A European customer representing approximately 20% of annual revenue has requested preliminary carbon-emissions data, product-level carbon information, environmental/labor/human-rights policies, supplier code of conduct evidence, and a two-year ESG improvement plan within six months.</p>

      <h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4>
      <ul class="list-disc pl-5 text-sm text-slate-700 space-y-1">
        <li>☑ <strong>A prioritized 90-day ESG work plan</strong></li>
        <li>☑ <strong>A practical governance and ownership structure</strong></li>
        <li>☑ <strong>A first-stage data and evidence checklist</strong></li>
        <li>☑ A distinction between immediate customer-response needs and longer-term management capabilities</li>
        <li>☑ An ESG foundation that can be expanded rather than rebuilt</li>
      </ul>

      <div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]">
        <strong>💡 為什麼這是好問題？</strong><br/>It includes organization context, external pressure, known gaps, a decision question, and expected outcomes. It converts vague "many customer requests" into a concrete operating-foundation design problem that can progress within 90 days.
      </div>
    </div>`,
  },
  {
    id: 2,
    title: '模擬提問卡 02：綠識科技股份有限公司',
    desc: '技術強但 ESG 基礎與市場驗證不成熟的 AI 新創',
    content: `<div class="space-y-4"><h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4><ul class="list-disc pl-5 text-sm text-slate-700"><li><strong>角色：</strong>陳柏睿 (共同創辦人暨產品長)</li><li><strong>產業：</strong>AI-enabled ESG SaaS、企業永續資料與決策分析</li><li><strong>狀態：</strong>具有很強的開發能力，但功能範圍過廣，尚未找到最具支付意願的優先市場，也尚未建立足以取得大型企業信任的 Responsible AI 治理。</li></ul><h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4><p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">我們已開發多個 AI-enabled ESG 模組，但尚未確認哪一個 use case 同時具有最強客戶痛點、支付意願與規模化潛力。<br/><br/>我們應如何選出第一個核心市場，設計 90 天驗證計畫，並建立企業客戶所需的 Responsible AI、資料治理與證據機制？</p><h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4><ul class="list-disc pl-5 text-sm text-slate-700"><li>第一個核心客群與優先 use case 的選擇原則</li><li>90 天 Product-Market Fit 驗證計畫</li><li>Responsible AI 最低可行治理架構</li></ul><div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]"><strong>💡 為什麼這是好問題？</strong><br/>它展現了企業的 ESG 解方能力走在自身 ESG 管理能力之前的典型困境，要求 Mentor 協助從「功能」收斂到「問題」，從「快速開發」收斂到「可信治理」。</div></div>`,
  },
  {
    id: 3,
    title: '模擬提問卡 03：仁域國際人道基金會',
    desc: '使命成熟但 ESG 治理與 Impact Evidence 未系統化的大型 NPO',
    content: `<div class="space-y-4"><h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4><ul class="list-disc pl-5 text-sm text-slate-700"><li><strong>角色：</strong>張雅雯 (副執行長暨策略與影響力主管)</li><li><strong>產業：</strong>國際人道救援、醫療、教育與社區發展</li><li><strong>狀態：</strong>擁有大量人道服務成果，但影響力資料分散，尚未形成整合治理、環境責任與長期組織韌性的共同架構。</li></ul><h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4><p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">我們具有明確使命與大量人道服務成果，但影響力資料分散，且內部擔心 ESG 過度企業化。<br/><br/>我們應如何建立整合使命、治理、環境責任、利害關係人信任與長期成果證據的 NPO ESG 策略，並以不增加第一線過度負擔的方式逐步落地？</p><h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4><ul class="list-disc pl-5 text-sm text-slate-700"><li>適合大型 NPO 的 ESG 與 Impact Strategy 架構</li><li>可用於不同事業的共同核心指標與彈性指標設計</li><li>Evidence Chain 與資料治理的基本架構</li></ul><div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]"><strong>💡 為什麼這是好問題？</strong><br/>點出了 NPO 的核心張力：專業管理與人文使命之間的平衡。要求 Mentor 協助讓「善意有治理、行動有證據、影響有學習」。</div></div>`,
  },
  {
    id: 4,
    title: '模擬提問卡 04：寰宇智造科技集團',
    desc: 'ESG 1.0 成熟，但缺乏策略投資組合與創價路徑的大型企業',
    content: `<div class="space-y-4"><h4 class="font-bold text-[#003262] border-b pb-2">Part 1｜基本資料</h4><ul class="list-disc pl-5 text-sm text-slate-700"><li><strong>角色：</strong>王思涵 (全球永續策略處處長)</li><li><strong>產業：</strong>電子產品製造、工業自動化與全球供應鏈</li><li><strong>狀態：</strong>已建立成熟的合規底盤，但百項 ESG 專案分散，尚未形成明確的策略投資組合與 ESG 2.0 創價路徑。</li></ul><h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 4｜最想請教師資的問題</h4><p class="text-sm bg-slate-50 p-3 rounded border border-slate-200">我們已有成熟 ESG 制度及超過 120 項專案，但缺乏區分合規、效率、韌性與成長型創新的共同方法。<br/><br/>我們應如何建立 ESG 投資組合與決策治理，選出三至五項企業級優先事項，並決定哪些專案應擴大、整合、重新設計或停止？</p><h4 class="font-bold text-[#003262] border-b pb-2 mt-4">Part 6｜期待產出</h4><ul class="list-disc pl-5 text-sm text-slate-700"><li>ESG 專案投資組合的分類方法</li><li>集團層級 strategic priority 的選擇標準</li><li>Scale、Integrate、Redesign、Stop 的決策規則</li></ul><div class="bg-[#FDB515]/10 p-3 rounded mt-4 text-sm text-[#003262]"><strong>💡 為什麼這是好問題？</strong><br/>展現了大型企業「做得多，但選得不準」的痛點。要求建立 Portfolio Governance，將 ESG 從「成本專案」轉化為「策略投資」。</div></div>`,
  },
];

export default mockCases;
