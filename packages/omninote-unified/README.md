
## 匯入匯出（OmniNote Archive）

\`src/import-export.ts\` 提供歸檔級雙向無損遷移：

- \`exportNotesArchive(nodes)\`：全量封存為單一 JSON 歸檔（format: omninote-archive / format_version: 1.0.0）；匯出前逐節點以 \`computeNodeLockHash\` 重算驗證，任何竄改即刻拒絕（零竄改外流承諾）。
- \`parseArchive(json)\`：格式標頭與逐節點 TypeBox 契約驗證，畸形即刻拋出。
- \`importNotesArchive(storage, archive, { conflict })\`：匯入前逐節點完整性稽核；lock_hash 相同則跳過；相異時依衝突策略 skip（保留既有）或 overwrite（覆寫為歸檔版本）；竄改節點計入 tampered 且不落地，全程零例外中斷，回傳逐項計數報告。

API 端點：

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| GET | /api/export | 全量匯出歸檔（attachment：omninote-export.json）；儲存庫含竄改節點時回 409 |
| POST | /api/import?conflict=overwrite | 匯入歸檔（主體為歸檔 JSON；預設 conflict=skip）；回傳計數報告 |

\`\`\`bash
curl -s http://127.0.0.1:52710/api/export -H "Authorization: Bearer my-secret" > backup.json
curl -s -X POST "http://127.0.0.1:52710/api/import?conflict=overwrite" \\
  -H "Authorization: Bearer my-secret" -H "Content-Type: application/json" --data-binary @backup.json
\`\`\`
