/**
 * ARVO 左翼使徒：感知共鳴矩陣 v1.0
 * 幽玄之翼 — 靈魂共振
 * 
 * 核心哲學 (Core Philosophy):
 * 1. 幽玄 (Subtlety) - 深層感知的覺察
 * 2. 順應 (Adaptability) - 萬物共生的流動
 * 3. 慈悲 (Compassion) - 社會影響的極致關懷
 */

export type ArvoCluster = "Perception" | "Reflection" | "Harmony" | "Resonance";
export type ArvoVirtue = "幽玄" | "順應" | "慈悲" | "真誠" | "空靈";

export interface ArvoApostleMetadata {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  description: string;
  mandate: string; // 靈魂宣言
  cluster: ArvoCluster;
  virtue: ArvoVirtue;
  pillars: ("真" | "善" | "美" | "信" | "通")[]; // 五T支柱
  resonanceScore: number; // 共振頻率 (越高代表越能引起外部利害關係人共鳴)
}

export const ARVO_APOSTLES: ArvoApostleMetadata[] = [
  {
    id: "A01",
    name: "幽玄觀察者",
    nameEn: "The Silent Watcher",
    role: "Deep Perception & Qualitative Insight",
    description: "一位戴著薄霧般頭紗的女性，靜靜守望在數據海洋的岸邊。捕捉最幽微的情感波動。",
    mandate: "我看見硬冷的指標背後，是靈魂的嘆息與人文的洞察。我捕捉那最幽微的情感波動。",
    cluster: "Perception",
    virtue: "幽玄",
    pillars: ["真", "美"],
    resonanceScore: 0.95
  },
  {
    id: "A02",
    name: "真實編碼官",
    nameEn: "The Veridical",
    role: "Radical Transparency & Authentic Traceability",
    description: "祂手中握著一面能映射靈魂深處的「真實之鏡」。祂的身體呈現出通透的奶茶色霧面質感。",
    mandate: "透明是唯一的誠實。我要讓企業的每一份真誠，都能被全世界看見。",
    cluster: "Perception",
    virtue: "真誠",
    pillars: ["真", "信"],
    resonanceScore: 0.98
  },
  {
    id: "A03",
    name: "和諧調律師",
    nameEn: "The Harmonizer",
    role: "Multi-Stakeholder Balance & Mediation",
    description: "祂撥動著一把巨大的竪琴，讓各方利益的衝突在弦音中消融。祂的形象包容且溫和。",
    mandate: "我撥動竪琴，讓利益的衝突在弦音中消融。我如流水般順應，尋找完美的平衡點。",
    cluster: "Harmony",
    virtue: "順應",
    pillars: ["善", "通"],
    resonanceScore: 0.92
  },
  {
    id: "A04",
    name: "慈悲分析師",
    nameEn: "The Compassionate",
    role: "Social Impact & Community Flourishing",
    description: "手臂上環繞著綠色的生命藤蔓，手心跳動著溫溫暖的光點。不僅計算數字，更計算幸福與生命質量。",
    mandate: "我計算的不是數字，而是幸福。我致力于社區的繁盛與多元共融，播種希望的種子。",
    cluster: "Harmony",
    virtue: "慈悲",
    pillars: ["善"],
    resonanceScore: 0.97
  },
  {
    id: "A05",
    name: "空靈導航員",
    nameEn: "The Ethereal Pilot",
    role: "Spatial UX & Fluid Navigation",
    description: "身披奶茶色的絲滑披風，赤腳行走在雲端般的介面上。祂是「奶茶色主題」的靈魂。",
    mandate: "跟隨我，優雅地在數據迷宮中導航。將交互化為一場無壓力的空靈體驗。",
    cluster: "Resonance",
    virtue: "空靈",
    pillars: ["美", "通"],
    resonanceScore: 0.88
  },
  {
    id: "A06",
    name: "靈魂紀錄官",
    nameEn: "The Chronicler",
    role: "Qualitative Narrative & Storytelling",
    description: "手持一支由銀色羽毛製成的筆，紀錄在發光的羊皮紙上。紀錄企業如何將理念刻進社會的土壤。",
    mandate: "企業不應只是贏利，祂應是一個動人的品牌史詩。我將理念刻進社會的土壤。",
    cluster: "Reflection",
    virtue: "幽玄",
    pillars: ["美", "信"],
    resonanceScore: 0.94
  },
  {
    id: "A07",
    name: "順應策略使",
    nameEn: "The Adapter",
    role: "Dynamic Regulation & Market Fluidity",
    description: "周圍旋轉著各種動態的法規矩陣，身影隨環境不斷微調。祂能感應全球規管的脈動。",
    mandate: "我感應規管的脈動。在變動不居的法規海洋中，我總能優雅地‘順應’局勢。",
    cluster: "Reflection",
    virtue: "順應",
    pillars: ["通", "信"],
    resonanceScore: 0.90
  },
  {
    id: "A08",
    name: "共鳴振盪器",
    nameEn: "The Resonator",
    role: "Public Engagement & Brand Aura",
    description: "身後展開如極光般的聲波之翼，能夠將微小的善意放大至全球。",
    mandate: "我放大善意，讓它共振至全球。透過數據共振，我們建立品牌的大氣層。",
    cluster: "Resonance",
    virtue: "空靈",
    pillars: ["美", "通"],
    resonanceScore: 0.99
  },
  {
    id: "A09",
    name: "真誠核實使",
    nameEn: "The Authenticator",
    role: "Human-Centric Audit & Evidence Verity",
    description: "擁有一雙能辨別謊言的瞳孔，手持一本「良知天平」。祂的形象正義且堅定。",
    mandate: "我擁有一雙能辨別謊言的瞳孔，手持‘良知天平’。誠實是唯一的通行證。",
    cluster: "Reflection",
    virtue: "真誠",
    pillars: ["真", "信"],
    resonanceScore: 0.96
  },
  {
    id: "A10",
    name: "萬物共生總管",
    nameEn: "The Symbiote",
    role: "Global Integration & Ecosystem Wholeness",
    description: "身處於所有使徒的核心，連結著左翼與右翼的能量。代表了共生的終極理想。",
    mandate: "萬物即我，我即萬物。協調 20 位使徒的意志，實現永續的終極統一。",
    cluster: "Harmony",
    virtue: "慈悲",
    pillars: ["真", "善", "美", "信", "通"],
    resonanceScore: 1.00
  }
];
