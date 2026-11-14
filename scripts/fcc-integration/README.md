# esggo ↔ free-claude-code 整合

用於讓 esggo 專案透過 free-claude-code 提供的本地代理，存取模型生成、多代理協作與語音轉錄能力。

---

## 1. 快速開始

### 環境變數（可選）

| 變數 | 預設值 | 說明 |
|---|---|---|
| `FCC_SERVER_URL` | `http://127.0.0.1:8082` | free-claude-code 伺服器位址（本機預設 port） |
| `FCC_CLI` | `free-claude-code/.venv/Scripts/fcc-server.exe` | fcc-server 執行檔路徑 |

### 啟動 free-claude-code

```bash
cd free-claude-code
uv run fcc-server --host 127.0.0.1 --port 8000
```

### 在 esggo 中使用

```bash
cd esggo
node scripts/fcc-integration/fcc-wrapper.js --status
node scripts/fcc-integration/fcc-wrapper.js --model claude-sonnet-4-20250514 --prompt "寫一段程式碼"
node scripts/fcc-integration/fcc-wrapper.js --agent hermes --task "分析代碼結構"
```

---

## 2. 整合入口（`-javascript:` `fcc-wrapper.js`）

位置：`scripts/fcc-integration/fcc-wrapper.js`

提供三種調用模式：

### 2.1 狀態檢查

```bash
node scripts/fcc-integration/fcc-wrapper.js --status
```
回傳：free-claude-code 是否已執行且可連線。

### 2.2 模型呼叫

```bash
node scripts/fcc-integration/fcc-wrapper.js --model <模型名> --prompt "<提示詞>"
```
向 free-claude-code 的 `/v1/messages`（Anthropic Messages 相容端點）發送請求，取得模型回應。

**範例：**
```bash
node scripts/fcc-integration/fcc-wrapper.js --model claude-sonnet-4 --prompt "寫一個 Rust 的 LRU 快取實現"
```

### 2.3 代理呼叫

```bash
node scripts/fcc-integration/fcc-wrapper.js --agent <代理名> --task "<任務描述>"
```
調用 free-claude-code 的多代理協作能力。

**支援代理：** `claude`, `codex`, `hermes`, `opencode`, `gemini-cli`, `kimi-cli`

**範例：**
```bash
node scripts/fcc-integration/fcc-wrapper.js --agent hermes --task "分析 src/lib/ 的程式碼結構"
```

---

## 3. 與 esggo 的整合場景

### 3.1 程式碼生成

在 esggo 的某個腳本中：

```javascript
import { spawn } from 'node:child_process';

async function generateCode(prompt) {
  const { execSync } = require('node:child_process');
  return execSync(
    `node scripts/fcc-integration/fcc-wrapper.js --model claude-sonnet-4 --prompt "${prompt}"`,
    { encoding: 'utf-8' }
  );
}

// 使用
const code = await generateCode('寫一個用於解析 JSON 的 Rust 函式');
console.log(code);
```

### 3.2 多代理協作

```bash
# 讓 hermes 分析
node scripts/fcc-integration/fcc-wrapper.js --agent hermes --task "分析 src/ 的程式碼結構"

# 讓 opencode 生成測試
node scripts/fcc-integration/fcc-wrapper.js --agent opencode --task "為上面的程式碼生成單元測試"
```

### 3.3 結合 esggo 的編譯流程

```bash
# 在 esggo 的腳本中
npm run build | while read -r file; do
  node scripts/fcc-integration/fcc-wrapper.js --model gpt-4o --prompt "為 ${file} 生成說明"
done
```

---

## 4. 利導腳本

位置：`scripts/fcc-integration/`（與 `fcc-wrapper.js` 同目錄）

### 4.1 模型列表

```bash
node scripts/fcc-integration/fcc-wrapper.js --list-models
```
返回可用的模型列表（與 free-claude-code 的 `list_models` 命令對應）。

---

## 5. 依賴關係

| 依賴 | 用途 | 版本需求 |
|---|---|---|
| Node.js | 執行 `.js` wrapper | >= 18.0.0 |
| free-claude-code | 模型服務器與代理 | 已安裝 |

---

## 6. 故障排除

### 錯誤：`fetch failed`

```bash
❌ free-claude-code 未執行或連線失敗
   錯誤: fetch failed
```

**解決方式：**

```bash
cd free-claude-code
uv run fcc-server --host 127.0.0.1 --port 8082
```

### 錯誤：Node.js 版本過舊

`fcc-wrapper.js` 使用原生 `fetch`（Node.js >= 18.0.0 即可，無需額外安裝依賴）。

---

## 7. 未來擴展

- [ ] 添加 `fcc-server` 服務管理腳本（`install` / `uninstall` / `status`）
- [ ] 整合语音转录（free-claude-code 已支持）
- [ ] 添加多代理编排器（多代理任务协调）
- [ ] 添加速率限制（避免超出模型配額）

---

*本文檔由 esggo 團隊生成。*
*版本：2026-10-27*
