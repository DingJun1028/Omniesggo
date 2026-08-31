# Tencent RTC 聊天集成文檔模塊

> 來源文件：`https://trtc.io/zh/document/72277`  
> 最後更新：2026-08-16  
> 所屬模塊：esggo-omni-center / 外部集成

---

## 1. 概覽

Tencent RTC 提供 **TUIKit** 組件，讓開發者快速獲得即時通訊能力：
- 單聊、群聊、會話列表
- AI 編碼工具輔助集成
- 多平台支援：React、Vue、Java/Kotlin、Swift/Objective-C、Flutter

---

## 2. 核心能力

### 2.1 AI 輔助集成
- 用自然語言描述需求
- AI 自動生成集成代碼
- 無需手寫大量重複代碼

### 2.2 TUIKit 組件
- **會話列表**：管理聊天會話
- **單聊**：一對一即時通訊
- **群聊**：多人協作通訊
- **聊天窗口**：嵌入已有頁面

---

## 3. 使用 MCP 協議

### 3.1 MCP Server 安裝
```bash
npx @tencent-rtc/trtc-agent-skills@latest add --ide codebuddy
npx @tencent-rtc/trtc-agent-skills@latest add --ide cursor
npx @tencent-rtc/trtc-agent-skills@latest add --ide codex
npx @tencent-rtc/trtc-agent-skills@latest add --ide claude
```

### 3.2 Skill 功能
- **Chat 知識諮詢**：API 用法、錯誤碼、計費、REST API
- **Vue3 無 UI 整合方案**：State API 集成

---

## 4. 平台集成指南

### 4.1 Web
- React 18
- Vue 3

### 4.2 Mobile
- **Android**：Java / Kotlin
- **iOS**：Swift / Objective-C
- **Flutter**：Dart（跨平台）

### 4.3 僅聊天窗口
適合在已有頁面中嵌入單個聊天窗口：
- 客服支持
- 在線諮詢
- 會議內文字聊天

詳見：[僅集成聊天窗口（React/Vue）](https://trtc.io/zh/document/78213)

---

## 5. LLMs.txt

| 產品 | 文檔 |
|------|------|
| Conference | https://trtc.io/llms/conference.txt |
| Live | https://trtc.io/llms/live.txt |
| Chat | https://trtc.io/llms/chat.txt |
| Call | https://trtc.io/llms/call.txt |
| RTC Engine | https://trtc.io/llms/rtc-engine.txt |

---

## 6. 常見問題

[MCP 連接、憑證、依賴包或平台問題](https://trtc.io/zh/document/78214)

---

## 7. esggo 集成計劃

### P1
- [ ] 建立 `apps/tencent-rtc` 模塊
- [ ] 配置 MCP Server
- [ ] 測試 TUIKit 基礎聊天

### P2
- [ ] 集成到 omni-blueprint-hub
- [ ] 多平台支持
- [ ] AI Station 語音 + 即時通訊

---

## 8. 相關技能書
- `tencent-rtc-tuikit-integration`
- `esggo-aistation-deployment`
- `hermes-cron-webhook-scheduling`

---

## 9. 參考連結
- https://trtc.io/zh/document/72277
- https://trtc.io/zh/document/78212
- https://trtc.io/zh/document/78213
- https://trtc.io/zh/document/78214
