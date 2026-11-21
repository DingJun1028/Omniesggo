// Knowledge Collector – 轉化成功自癒方案為聖典模板
const { omniBus } = require('./omni-agent-bus');
const fs = require('fs');
const path = require('path');

// 確保 knowledge/templates 目錄存在
const TEMPLATE_DIR = path.resolve(__dirname, '../../knowledge/templates');
if (!fs.existsSync(TEMPLATE_DIR)) {
  fs.mkdirSync(TEMPLATE_DIR, { recursive: true });
  console.info(`[KnowledgeCollector] 建立目錄 ${TEMPLATE_DIR}`);
}

// 監聽 heal 成功事件
omniBus.broadcastHooks.add(async ev => {
  if (ev.event !== 'system:heal:success') return;
  const { healId } = ev.payload;
  // 從黑板取得對應的 HealingAction 條目
  const healEntry = omniBus.blackboard.get(healId);
  if (!healEntry) {
    console.warn(`[KnowledgeCollector] 找不到 healId ${healId} 的黑板條目`);
    return;
  }

  // 建構模板內容（Markdown）
  const tmpl = {
    id: healId,
    timestamp: healEntry.timestamp,
    source_origin: healEntry.source_origin,
    action: healEntry.payload,
  };
  const markdown = `# 聖典模板 – ${new Date(tmpl.timestamp).toISOString()}

## 來源

- **來源**: ${tmpl.source_origin}
- **事件 UUID**: ${tmpl.id}\n\n## 修復動作

\`\`\`json\n${JSON.stringify(tmpl.action, null, 2)}\n\`\`\`\n\n---\n*此模板由自癒機制自動生成，可作為未來類似故障的參考解決方案。*\n`;

  const filePath = path.join(TEMPLATE_DIR, `${healId}.md`);
  fs.writeFileSync(filePath, markdown);
  console.info(`[KnowledgeCollector] 已保存聖典模板 ${filePath}`);
});

// 保持活躍讓 PM2 不會立即退出
setInterval(() => {}, 60_000);
