/**
 * Omni-Dreams & Forgetting Engine (熵減煉金與對齊排程)
 *
 * 執行頻率：每日 (Cron Job / PM2)
 * 功用：
 * 1. 遺忘 (Forgetting): 降低長時間未存取之記憶的 Confidence，或刪除過期記憶 (零算力)。
 * 2. 夢境合成 (Dreams): 從近期高頻關鍵字或互動中合成新的 ALIGNMENT_SYNTHESIS 報告。
 * Prisma 已移除：改以 pg (DATABASE_URL) 直接執行 SQL。
 */

const pg = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "",
  max: 5,
});

const DECAY_RATE = 0.05;
const FORGET_THRESHOLD = 0.2;
const INACTIVE_DAYS = 7;

async function runForgettingRoutine() {
  console.log("=== 始動：萬能記憶遺忘引擎 (Forgetting) ===");

  try {
    // 1. 找出需要衰退的記憶
    const { rows: decayingMemories } = await pool.query(
      `SELECT "id", "confidence" FROM public."OmniMemory"
         WHERE "lastAccessed" < now() - ($1 || ' days')::interval
           AND "confidence" > $2`,
      [String(INACTIVE_DAYS), FORGET_THRESHOLD],
    );

    console.log(`找到 ${decayingMemories.length} 條需進行熵減的記憶。`);

    // 2. 執行 Confidence 衰退
    let updatedCount = 0;
    for (const mem of decayingMemories) {
      const newConfidence = Math.max(0, mem.confidence - DECAY_RATE);
      await pool.query(
        `UPDATE public."OmniMemory" SET "confidence" = $1 WHERE "id" = $2`,
        [newConfidence, mem.id],
      );
      updatedCount++;
    }

    // 3. 歸檔/刪除極低信心度記憶 (清出 Context Window 空間)
    const forgotten = await pool.query(
      `DELETE FROM public."OmniMemory" WHERE "confidence" <= $1`,
      [FORGET_THRESHOLD],
    );

    console.log(`遺忘完成：更新 ${updatedCount} 條，永久遺忘(刪除) ${forgotten.rowCount} 條。`);
  } catch (err) {
    console.error("Forgetting Routine 失敗:", err);
  }
}

async function runDreamSynthesis() {
  console.log("=== 始動：對齊夢境合成 (Alignment Dreams) ===");
  try {
    const { rows: coreRules } = await pool.query(
      `SELECT "type", "content", "confidence" FROM public."OmniMemory"
         WHERE "type" = ANY($1) AND "confidence" > 0.8
         ORDER BY "confidence" DESC LIMIT 20`,
      [["rule", "preference"]],
    );

    let markdownContent = `# OMNI_ALIGNMENT (全通對齊報告)\n\n`;
    markdownContent += `> 生成時間: ${new Date().toISOString()}\n`;
    markdownContent += `> 狀態: 零算力自適應合成\n\n`;
    markdownContent += `## 核心偏好與規則 (Core Preferences)\n`;

    if (coreRules.length === 0) {
      markdownContent += `- 尚無高信心度之核心規則。\n`;
    } else {
      coreRules.forEach(r => {
        markdownContent += `- [${r.type.toUpperCase()}] ${r.content} (Confidence: ${Number(r.confidence).toFixed(2)})\n`;
      });
    }

    markdownContent += `\n## 系統狀態 (System State)\n- 遺忘引擎正常運作\n- Context 空間已最佳化`;

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
  await pool.end();
  console.log("=== 萬能記憶排程執行完畢 ===");
}

main();
