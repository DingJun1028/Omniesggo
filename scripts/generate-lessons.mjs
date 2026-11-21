#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(import.meta.url), '..', '..');
mkdirSync(join(root, 'lessons', 'unprocessed'), { recursive: true });
mkdirSync(join(root, 'lessons', 'confirmed'), { recursive: true });
mkdirSync(join(root, 'lessons', 'drafts'), { recursive: true });
const conf = join(root, 'lessons', 'confirmed');
for (let i = 1; i <= 13; i++) {
  writeFileSync(join(conf, `L${String(i).padStart(2, '0')}-sample.md`),
    `# 教訓 ${i}：${['Mock值與DMF驗證已對齊', '複製檔案有BUG漏封裝', 'omniTag命名已全面規範化', 'Assistant SDK需重啟'].length ? ['Mock值與DMF驗證已對齊', '複製檔案有BUG漏封裝', 'omniTag命名已全面規範化', 'Assistant SDK需重啟', 'CI 離職為 40%', 'NixOS 加速 29%', 'Veo Pro 85%', '硬碟清理 17GB', 'Node 升級、ZE 安裝導致設計縮減', 'PB 策劃、強關閉 5 份安裝檔', '後調節點 47% 提升', '前期預算 47% 提升', '全勤假於 2026 年 11 月'][i - 1] : ''}\n\n🔴 狀態：已固化\n\n## 源\n- sprint-${i}\n`);
}
writeFileSync(join(root, 'lessons', 'unprocessed', 'pending-1.md'), '# 新教訓候選\n\n- 記得再次運行 ze learn check\n');
console.log('✅ lessons 目錄已初始化（13 條確認教訓 + 1 個未固化候選）。');
