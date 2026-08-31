# Tencent RTC MCP Server 安裝

## 支援 IDE
- CodeBuddy
- Cursor
- Codex CLI
- Claude Code CLI

## 安裝命令
```bash
npx @tencent-rtc/trtc-agent-skills@latest add --ide cursor
```

## 功能
- **Chat 知識諮詢**：API 用法、錯誤碼、計費、REST API
- **Vue3 無 UI 整合方案**：State API 集成

## 與 OmniBlueprintHub 整合
1. 安裝 MCP skill 到開發環境
2. 在 `plugins/tencent-rtc/index.ts` 配置 `aiStationWebhook`
3. 使用 `forwardToAiStation()` 橋接 TRTC 回調到 AI Station
