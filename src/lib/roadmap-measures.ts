// 共用型別與預設資料：不得 import prisma / pg / node 內建模組，
// 以免 client component（app/roadmap/page.tsx）把 pg 拉進瀏覽器 bundle。
export interface AbatementMeasure {
  id: string;
  name: string;
  category: 'Energy' | 'Efficiency' | 'Mobility' | 'ValueChain' | 'Offsets';
  reductionPotential: number; // tCO2e/year
  costPerTon: number; // TWD / tCO2e (Negative means net financial savings!)
  capex: number; // Total Initial Investment in TWD
  status: 'Planned' | 'In_Progress' | 'Completed';
}

export const DEFAULT_MEASURES: AbatementMeasure[] = [
  { id: 'm1', name: '全廠 LED 與高效率 IE4 馬達替換', category: 'Efficiency', reductionPotential: 3200, costPerTon: -1500, capex: 4800000, status: 'Completed' },
  { id: 'm2', name: '屋頂型太陽能光電案場 (1.2MW)', category: 'Energy', reductionPotential: 6500, costPerTon: -800, capex: 36000000, status: 'In_Progress' },
  { id: 'm3', name: '廠區堆高機與公務車全電動化', category: 'Mobility', reductionPotential: 2100, costPerTon: 250, capex: 7500000, status: 'Planned' },
  { id: 'm4', name: '綠電 CPPA 企業購電協議 (RE100)', category: 'Energy', reductionPotential: 12000, costPerTon: 600, capex: 0, status: 'Planned' },
  { id: 'm5', name: '供應鏈低碳循環材料替代專案', category: 'ValueChain', reductionPotential: 5400, costPerTon: 1200, capex: 12000000, status: 'Planned' },
  { id: 'm6', name: '高品質碳抵換與森林碳匯專案', category: 'Offsets', reductionPotential: 3000, costPerTon: 2500, capex: 7500000, status: 'Planned' },
];
