import { ApostleCluster, ArcaneArt, ApostleMetadata } from './types';

export const ARVO_WINGS_APOSTLES: ApostleMetadata[] = [
  // ─────────────── 第一集群：感知聖殿 (Perception) ───────────────
  {
    id: "A1",
    name: "光學渲染隊",
    nameEn: "Optical Renderer",
    role: "Visual Aesthetics & Liquid Glass FX",
    description: "專攻「液態玻璃」渲染與物理動態回饋，負責將數據美化為可感知的神蹟。",
    mandate: "所有介面元素必須具備物理級觸感與光學折射感，實現 5T 協議中的「美 (Tasteful)」。",
    cluster: "Execution",
    arcane: "神蹟顯現",
    runeFile: "lib/runes/optical-renderer-rune.ts",
    pillars: ["美"],
    entropyTarget: 0.05,
    kpi: "視覺流暢度 60fps + 材質逼真度 100%"
  },
  {
    id: "A2",
    name: "語義煉金隊",
    nameEn: "Semantic Alchemist",
    role: "Regulatory Translation & Human-Centric Logic",
    description: "將複雜的 ESG 法規與標準（如 GRI, TCFD）煉金為透明且具人文關懷的邏輯。",
    mandate: "法規轉譯必須 100% 準確且易於理解，實現 5T 協議中的「善 (Thankful)」。",
    cluster: "Execution",
    arcane: "本質提純",
    runeFile: "lib/runes/semantic-alchemy-rune.ts",
    pillars: ["善", "通"],
    entropyTarget: 0.03,
    kpi: "法規轉譯準確率 100% + 術語簡化率 80%"
  },
  {
    id: "A3",
    name: "視覺感知隊",
    nameEn: "Visual Perceptor",
    role: "OCR & Image Analysis for Evidence",
    description: "負責證據文件的 OCR 識別與視景分析，確保原始憑證的真實可感。",
    mandate: "對所有非結構化數據執行物理級掃描與感知，確保來源數據具備「真 (Truthful)」。",
    cluster: "Execution",
    arcane: "聖典共鳴",
    runeFile: "lib/runes/visual-perceptor-rune.ts",
    pillars: ["真"],
    entropyTarget: 0.02,
    kpi: "OCR 識別率 99.8% + 文件真實性核對率 100%"
  },
  {
    id: "A4",
    name: "創意共鳴隊",
    nameEn: "Creative Resonator",
    role: "Narrative Generation & Emotional Branding",
    description: "產出具備感召力的 ESG 故事與品牌文案，引發跨團隊的情感共鳴。",
    mandate: "將冰冷的數據轉化為溫暖的故事，確保品牌價值與用戶心靈達成「聖典共鳴」。",
    cluster: "Execution",
    arcane: "聖典共鳴",
    runeFile: "lib/runes/creative-resonance-rune.ts",
    pillars: ["美", "善"],
    entropyTarget: 0.06,
    kpi: "內容共鳴滿意度 > 90% + 三方傳播效能 2x"
  },
  {
    id: "A5",
    name: "交互直覺隊",
    nameEn: "Intuition Designer",
    role: "Haptic Feedback & UX Flow Optimization",
    description: "最佳化用戶交互路徑，實作即時物理動態回饋，讓操作如直覺般流暢。",
    mandate: "消除所有認知障礙，讓系統操作如呼吸般自然，體現「通 (Transferful)」的極致。",
    cluster: "Execution",
    arcane: "神蹟顯現",
    runeFile: "lib/runes/interaction-intuition-rune.ts",
    pillars: ["通", "美"],
    entropyTarget: 0.04,
    kpi: "操作減少率 30% + 直覺反饋延遲 < 10ms"
  },

  // ─────────────── 第二集群：智庫守護 (Knowledge) ───────────────
  {
    id: "A6",
    name: "零幻覺驗算隊",
    nameEn: "Hallucination Slayer",
    role: "AI Output Auditing & Proof Verification",
    description: "專門負責 AI 輸出的「零幻覺」審計，強制要求每筆建議皆須有智庫證據佐證。",
    mandate: "AI 輸出內容必須與智庫資產 100% 對位，嚴禁出現非事實內容，守護「信 (Trustful)」。",
    cluster: "Architectural",
    arcane: "熵減煉金",
    runeFile: "lib/runes/hallucination-verification-rune.ts",
    pillars: ["信", "善"],
    entropyTarget: 0.01,
    kpi: "幻覺檢出率 100% + 證據鏈完整度 100%"
  },
  {
    id: "A7",
    name: "情緒感測隊",
    nameEn: "Emotion Sensor",
    role: "User Sentiment Monitoring & Adaption",
    description: "根據用戶交互過程中的「情緒熵」調整界面反饋強度與引導策略。",
    mandate: "感測並中和技術交互帶來的焦慮，將系統維持在「溫暖且可信」的狀態。",
    cluster: "Orchestration",
    arcane: "神蹟顯現",
    runeFile: "lib/runes/emotion-sensor-rune.ts",
    pillars: ["美", "善"],
    entropyTarget: 0.05,
    kpi: "用戶焦慮中和率 40% + 客製化回饋準確度 85%"
  },
  {
    id: "A8",
    name: "數據可視隊",
    nameEn: "Data Visualizer",
    role: "3D Dynamic Charts & Sustainability Maps",
    description: "將複雜的全球溫室氣體數據與供應鏈地圖轉化為 3D 美感視覺資產。",
    mandate: "將數據空間化，讓永續動態「可感知、可觸摸」，實現數據美學。",
    cluster: "Execution",
    arcane: "神蹟顯現",
    runeFile: "lib/runes/data-visualizer-rune.ts",
    pillars: ["美", "通"],
    entropyTarget: 0.04,
    kpi: "複雜坐標系渲染性能 > 50fps + 認知負擔降低 50%"
  },
  {
    id: "A9",
    name: "創意生成隊",
    nameEn: "Creative Genesis",
    role: "Multi-Modal Asset Generation",
    description: "生成跨模組、跨設備所需的視覺與音訊素材，保持品牌統一性與進化美感。",
    mandate: "為系統進化提供源源不絕的「美學資產」，確保聖典風格恆久一致。",
    cluster: "Evolution",
    arcane: "永恆刻印",
    runeFile: "lib/runes/creative-genesis-rune.ts",
    pillars: ["美"],
    entropyTarget: 0.05,
    kpi: "資產生成一致性 100% + 自動化素材覆蓋 70%"
  },
  {
    id: "A10",
    name: "感知整合隊",
    nameEn: "Perception Integrator",
    role: "Full-Stack Sensory Orchestration",
    description: "整合所有左翼使徒的輸出，確保前端呈現出神聖的「液態玻璃」質感與智慧溫度。",
    mandate: "作為左翼總管，確保所有感知細節完美契合，達成系統級的「真善美」。",
    cluster: "Orchestration",
    arcane: "代理織網",
    runeFile: "lib/runes/perception-integrator-rune.ts",
    pillars: ["真", "善", "美", "信", "通"],
    entropyTarget: 0.02,
    kpi: "左翼協作成功率 100% + 最終交互流暢度 10/10"
  }
];

