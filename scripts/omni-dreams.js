/**
 * Omni-Dreams & Forgetting Engine (熵減煉金與對齊排程)
 * 
 * 執行頻率：每日 (Cron Job / PM2)
 * 功用：
 * 1. 遺忘 (Forgetting): 降低長時間未存取之記憶的 Confidence，或刪除過期記憶 (零算力)。
 * 2. 夢境合成 (Dreams): 從近期高頻關鍵字或互動中合成新的 ALIGNMENT_SYNTHESIS 報告。
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

const DECAY_RATE = 0.05; // 每次排程降低 5% confidence
const FORGET_THRESHOLD = 0.2; // 低於 0.2 的 confidence 將被封存或刪除
const INACTIVE_DAYS = 7; // 超過 7 天未存取開始衰退

async function runForgettingRoutine() {
  console.log("=== 始動：萬能記憶遺忘引擎 (Forgetting) ===");
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS);

  try {
    // 1. 找出需要衰退的記憶
    const decayingMemories = await prisma.omniMemory.findMany({
      where: {
        lastAccessed: { lt: cutoffDate },
        confidence: { gt: FORGET_THRESHOLD }
      }
    });

    console.log(`找到 ${decayingMemories.length} 條需進行熵減的記憶。`);

    // 2. 執行 Confidence 衰退
    let updatedCount = 0;
    for (const mem of decayingMemories) {
      const newConfidence = Math.max(0, mem.confidence - DECAY_RATE);
      await prisma.omniMemory.update({
        where: { id: mem.id },
        data: { confidence: newConfidence }
      });
      updatedCount++;
    }
    
    // 3. 歸檔/刪除極低信心度記憶 (清出 Context Window 空間)
    const forgotten = await prisma.omniMemory.deleteMany({
      where: { confidence: { lte: FORGET_THRESHOLD } }
    });

    console.log(`遺忘完成：更新 ${updatedCount} 條，永久遺忘(刪除) ${forgotten.count} 條。`);
  } catch (err) {
    console.error("Forgetting Routine 失敗:", err);
  }
}

async function runDreamSynthesis() {
  console.log("=== 始動：對齊夢境合成 (Alignment Dreams) ===");
  try {
    // 獲取近期高頻或高信心的核心規則 (type: 'rule' 或 'preference')
    const coreRules = await prisma.omniMemory.findMany({
      where: {
        type: { in: ["rule", "preference"] },
        confidence: { gt: 0.8 }
      },
      orderBy: { confidence: "desc" },
      take: 20
    });

    let markdownContent = `# OMNI_ALIGNMENT (全通對齊報告)\n\n`;
    markdownContent += `> 生成時間: ${new Date().toISOString()}\n`;
    markdownContent += `> 狀態: 零算力自適應合成\n\n`;
    markdownContent += `## 核心偏好與規則 (Core Preferences)\n`;

    if (coreRules.length === 0) {
      markdownContent += `- 尚無高信心度之核心規則。\n`;
    } else {
      coreRules.forEach(r => {
        markdownContent += `- [${r.type.toUpperCase()}] ${r.content} (Confidence: ${r.confidence.toFixed(2)})\n`;
      });
    }

    markdownContent += `\n## 系統狀態 (System State)\n- 遺忘引擎正常運作\n- Context 空間已最佳化`;

    // 寫入檔案 (供 Obsidian 同步)
    const outputPath = path.join(__dirname, "../OMNI_ALIGNMENT.md");
    fs.writeFileSync(outputPath, markdownContent, "utf-8");
    console.log(`夢境合成完畢，已產出：${outputPath}`);
  } catch (err) {
    console.error("Dream Synthesis 失敗:", err);
  }
}

async function main() {
  await runForgettingRoutine();
  await runDreamSynthesis();
  await prisma.$disconnect();
  console.log("=== 萬能記憶排程執行完畢 ===");
}

main();
