# Nous Research Inference API 參考

> **歸檔日期**：2026-09-26  
> **來源**：使用者提供的 API 文件（Nous Research Inference API 1.0.0，OAS 3.0）  
> **用途**：供未來參考之用，與當前系統無直接關聯  

---

## API 概要

- **API Base URL**：`https://inference-api.nousresearch.com/v1`
- **格式**：OpenAI 相容（Chat Completion / Completion）
- **認證方式**：
  - **Option 1**：API Key（Bearer Token），需註冊帳號並儲值
  - **Option 2（beta）**：x402 協議，使用 Solana USDC 支付（免註冊、按次付費）

---

## 認證與支付

### Option 1：API Key
1. 註冊：`https://portal.nousresearch.com`
2. 儲值或啟用訂閱，產生 API Key
3. 請求時以 `Authorization: Bearer <key>` 標頭傳送

### Option 2：x402 協議（beta）
- 無需帳號註冊或 API Key
- 需準備 Solana 錢包 + USDC _balance_
- 請求不帶 `Authorization` header → 回應 `402` 含支付要求
- 構造支付簽章，放入 `X-PAYMENT` header 重送請求
- **注意**：須明確設定 `max_tokens`，否則預設高上限可能導致高費用

---

## 使用與定價

- 依消費 token 計費（含 x402 小幅附加費）
- 完整定價見 `https://portal.nousresearch.com`

### API Key 速限

| 等級 | RPM | TPM |
|---|---|---|
| Ultra | 1,600 | 16,000,000 |
| Super | 800 | 8,000,000 |
| Plus | 400 | 4,000,000 |
| Default paid | 180 | 720,000 |
| Free | 50 | 500,000 |

---

## 可用模型

| 模型 | Context |
|---|---|
| Hermes-4.3-36B | 128k |
| Hermes-4-70B | 128k |
| Hermes-4-405B | 128k |

> **注意**：2026-09-26 測試時，模型 `Hermes-4.3-36B` 回傳 404（模型不存在）。可能已下線或名稱有誤，實際使用前需確認模型目錄。

---

## Reasoning（深度推理）配置

### Hermes 4 / DeepHermes 系統提示詞
```
You are a deep thinking AI, you may use extremely long chains of thought to deeply
consider the problem and deliberate with yourself via systematic reasoning processes
to help come to a correct solution prior to answering. You should enclose your thoughts
and internal monologue inside <think> </think> tags...
```

### 輸出位置差異
| 模型 | 推理輸出位置 |
|---|---|
| Deep Hermes 3 | 標準回應內容中，介於 `<think></think>` 標籤之間 |
| Hermes 4（ prefill `<think>`） | 標準回應內容中，介於 `<think></think>` 標籤之間 |
| Hermes 4（使用推理系統提示詞、不 prefill） | 回應的 `reasoning_content` 欄位 |

---

## 請求範例（供未來參考）

### Chat Completion
```bash
curl.exe -X 'POST' \
  'https://inference-api.nousresearch.com/v1/chat/completions' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "model": "Hermes-4.3-36B",
    "messages": [{"role": "user", "content": "What is the capital of France?"}],
    "temperature": 0.7,
    "max_tokens": 100
  }'
```

### Completion（串流）
```json
{
  "model": "Hermes-4.3-36B",
  "prompt": "Once upon a time",
  "max_tokens": 60,
  "temperature": 0.8,
  "stream": true
}
```

---

## 已知問題（2026-09-26 測試）

1. **模型 404**：`Hermes-4.3-36B` 回傳 `{"status": 404, "message": "Model 'Hermes-4.3-36B' not found."}`
2. **餘額**：使用者帳號顯示 Low Balance -$0.03（已透支），需先充值方可使用 API Key 方式

---

## 整合考量（供未來參考）

- 若未來要將此 API 整合進代理人系統（如 aistation 的 LLM 層），需先解決：
  - 帳號餘額與充值
  - 模型目錄確認（404 問題）
  - x402 支付流程（若選免註冊方式）
  - 速限與 TPM 是否足以支援預期負載

---

*歸檔由 OA-Team Agent（萬能分身）執行，反映 2026-09-26 使用者提供的文件內容。*  
*如有模型目錄更動或定價調整，請參考原始來源：https://portal.nousresearch.com*
