# Tencent RTC TUIKit 集成指引

> 適用：OmniBlueprintHub + esggo 生態系統  
> 最後更新：2026-08-16

---

## 1. 快速開始

### 1.1 安裝 MCP Skill
```bash
cd C:\Project\esggopps\omni-blueprint-hub
npx @tencent-rtc/trtc-agent-skills@latest add --ide cursor
```

### 1.2 配置環境變量
```env
TENCENT_RTC_APP_ID=<your-app-id>
TENCENT_RTC_SECRET=<your-secret>
```

---

## 2. 基礎集成

### 2.1 Web (React/Vue)
- 引入 TUIKit 組件
- 配置 AppID + UserSig
- 初始化 TRTC 客戶端

### 2.2 僅聊天窗口
適合客服場景：
- 單聊天窗口
- 無會話列表
- 自定義 UI

---

## 3. 與 esggo 集成

### 3.1 AI Station + 語音通訊
- edge-tts → TTS
- Tencent RTC → 語音通訊
- AI Station → 自動生成內容

### 3.2 5T 驗證
- Traceable：消息溯源
- Trackable：連接狀態追踪
- Tangible：即時體驗
- Transparent：連接日誌公開
- Trustworthy：消息加密

---

## 4. 參考文件
- [Tencent RTC Chat 集成](https://trtc.io/zh/document/72277)
- [LLMs.txt](https://trtc.io/llms/chat.txt)

---

## 5. 驗證
- [ ] Chat 連接成功
- [ ] 消息發送/接收正常
- [ ] 與 AI Station 集成測試通過
