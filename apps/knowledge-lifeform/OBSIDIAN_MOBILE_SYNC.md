# Obsidian 手機 + 電腦 Git 同步 + Hermex 整合指南

> 目標：手機/電腦 Obsidian vault 雙向同步，Hermex（手機 Hermes WebUI）可操作 vault。

## 架構
```
📱 手機 Obsidian ──┐
                   ├── obsidian-git ──→ GitHub (DingJun1028/esggo) ←── Hermex (hermex.esggo.co)
💻 電腦 Obsidian ──┘                                        ↑ hermes-agent 插件 (localhost:8642)
```

## 電腦端（已就緒 ✅）
- vault: `C:/Project/esggo/vault`
- 已裝: obsidian-git, hermes-agent, obsidian-local-rest-api
- hermes-agent gateway: `http://127.0.0.1:8642` (Hermex 讀寫 vault 橋樑)
- git remote: `git@github.com:DingJun1028/esggo.git`

## 手機端設定（你照做）
1. 手機裝 Obsidian app（iOS/Android）
2. 裝社群插件 **obsidian-git**（設定 → 社群插件 → 瀏覽 → obsidian-git）
3. 開啟 vault 從 **Clone with Git**：
   - Repository URL: `https://github.com/DingJun1028/esggo.git`
   - 注意：vault 在 `vault/` 子目錄，手機 clone 後選該子目錄作為 vault
4. 設定 obsidian-git 自動同步（每 10 分鐘 pull + push）
5. 裝 **hermes-agent** 插件（社群插件搜尋），gateway 填你 VPS 的 Hermes 地址（或手機本機 Hermes）

## Hermex 操作 vault
- Hermex 透過 `hermes-agent` 插件的 local-rest-api（port 8642）讀寫 vault
- 手機開 `hermex.esggo.co` → 對話中要求「把 X 寫入 vault」→ Hermes 經 hermes-agent 寫入
- 寫入後 vault git 變動 → obsidian-git 自動同步到 GitHub → 手機/電腦 Obsidian 收到

## 狀態檢查
```bash
bash apps/knowledge-lifeform/obsidian-sync-status.sh
```
輸出 JSON: vault_clean / unpushed / hermes_agent / obsidian_git_plugin

## 注意
- 手機/電腦同時編輯同檔會衝突，obsidian-git 預設自動 merge，嚴重衝突需手動解
- GitHub 用 HTTPS clone 手機較穩（SSH key 手機難配）
- hermes-agent 的 apiKey 在 config.json（Hermes 脫敏顯示，磁碟真值）
