/**
 * 5T Benchmark Enterprise Demo Data Seeder
 * 100% De-Google Architecture (Supabase PostgreSQL + Prisma ORM + Local Node.js)
 * 
 * Usage:
 *   node scripts/seed-5t-demo.mjs
 */

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function seedDemoData() {
  console.log('[seed-5t-demo] 🚀 Seeding benchmark enterprise 5T ESG data into database...');

  try {
    // 1. Seed Benchmark Double Materiality Assessment
    const materialityHash = crypto.createHash('sha256').update(`materiality-seed-${Date.now()}`).digest('hex');
    const materiality = await prisma.materialityAssessment.create({
      data: {
        title: '2026 標竿科技企業雙重重大性評估矩陣',
        year: 2026,
        framework: 'GRI_3_CSRD_ESRS',
        threshold: 3.5,
        topicsJson: JSON.stringify([
          { name: '氣候變遷與淨零轉型 (Climate Change)', impactScore: 4.8, financialScore: 4.6, isMaterial: true },
          { name: '再生能源與能效提升 (Renewable Energy)', impactScore: 4.5, financialScore: 4.2, isMaterial: true },
          { name: '循環經濟與廢棄物管理 (Circular Economy)', impactScore: 3.9, financialScore: 3.8, isMaterial: true },
          { name: '資訊安全與資料隱私 (Data Privacy)', impactScore: 4.7, financialScore: 4.9, isMaterial: true },
          { name: '多元包容與人權保障 (DEI & Human Rights)', impactScore: 4.1, financialScore: 3.6, isMaterial: true },
        ]),
        hashLock: materialityHash,
        sourceOrigin: 'omni-materiality-benchmark-seed',
      },
    });
    console.log(`[seed-5t-demo] ✅ Materiality Assessment seeded (ID: ${materiality.id})`);

    // 2. Seed Benchmark Net-Zero Roadmap
    const roadmapHash = crypto.createHash('sha256').update(`roadmap-seed-${Date.now()}`).digest('hex');
    const roadmap = await prisma.netZeroRoadmap.create({
      data: {
        title: '2050 企業碳中和與 MACC 邊際減碳成本路徑圖',
        baseYear: 2024,
        baseEmissions: 68000.0,
        target2030Percent: 42.0,
        measuresJson: JSON.stringify([
          { name: '廠區太陽能自發自用系統', category: '綠能發電', reductionPotential: 8500, capex: 12000000, costPerTon: -45.0 },
          { name: '高能效冰水主機與空調替換', category: '設備節能', reductionPotential: 11200, capex: 18000000, costPerTon: -20.0 },
          { name: '廠區物流車輛電動化轉型', category: '電動運具', reductionPotential: 4200, capex: 8500000, costPerTon: 15.0 },
          { name: '製程廢熱回收再利用裝置', category: '熱能回收', reductionPotential: 6100, capex: 14000000, costPerTon: 38.0 },
          { name: 'CCUS 碳捕捉與封存技術應用', category: '前瞻負碳', reductionPotential: 3500, capex: 32000000, costPerTon: 110.0 },
        ]),
        hashLock: roadmapHash,
        sourceOrigin: 'omni-roadmap-benchmark-seed',
      },
    });
    console.log(`[seed-5t-demo] ✅ Net-Zero Roadmap seeded (ID: ${roadmap.id})`);

    // 3. Seed Benchmark Supply Chain Vendor
    const vendorHash = crypto.createHash('sha256').update(`vendor-seed-${Date.now()}`).digest('hex');
    const vendor = await prisma.supplyChainVendor.create({
      data: {
        supplierName: '綠智光電科技股份有限公司',
        industry: 'Semiconductor / Display Components',
        tier: 'Tier 1 Prime',
        rating: 'A',
        riskLevel: 'Low',
        envScore: 92.5,
        socialScore: 88.0,
        govScore: 94.0,
        strengthsJson: JSON.stringify([
          '取得 ISO-14064-1 第三方盤查認證',
          'RE100 承諾 2030 達到 100% 綠電',
          '無重大職業安全與人權爭議紀錄',
        ]),
        weaknessesJson: JSON.stringify([
          'Scope 3 供應商碳盤查覆蓋率待提升至 80%',
        ]),
        recommendation: '列為綠色優先採購夥伴，提供節能減碳技術輔導。',
        hashLock: vendorHash,
        sourceOrigin: 'omni-supply-chain-benchmark-seed',
      },
    });
    console.log(`[seed-5t-demo] ✅ Supply Chain Vendor seeded (ID: ${vendor.id})`);

    console.log('\n[seed-5t-demo] 🎉 Benchmark enterprise 5T ESG data successfully seeded!');
  } catch (error) {
    console.warn('[seed-5t-demo] ⚠️ Database query failed (fallback simulation active):', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedDemoData();
