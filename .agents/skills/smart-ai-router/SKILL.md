# Smart AI Router Skill

**版本：2.0.0-beta.2（測試版）**

⚠️ 此版本為測試版，請勿在生產環境使用於未充分驗證的場景。

Smart AI model routing for free LLM providers. Routes chat completions to optimal free AI models with automatic failover when approaching rate limits or encountering errors.

## Architecture

- **Core Module**: `vps/smart-ai-router.mjs` — 轉換路由器核心邏輯
- **CLI Integration**: `packages/cli/src/omni.mjs` — `omni router` 子命令
- **Rate Limit Tracking**: Per-provider request counting with automatic threshold detection
- **Fallback Chain**: NVIDIA NIM → Gemini (configurable priority)
- **OpenAI Compatible**: Unified output format regardless of provider

## Provider Fallback Chain

| Priority | Provider | Endpoint | Models | Rate Limit |
|----------|----------|----------|--------|------------|
| 1 | NVIDIA NIM | `https://integrate.api.nvidia.com/v1/chat/completions` | `nvidia/nemotron-3-super-120b-a12b`, `openai/gpt-oss-20b` | 60 req/min |
| 2 | Google Gemini | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | `gemini-3.1-flash-lite`, `gemini-3-flash-preview` | 60 req/min |

## CLI Usage

```bash
# Health check
omni router health

# Chat completion (auto-routes to best available provider)
omni router chat "Hello, how are you?"

# Specify provider
omni router chat "Write a poem" --provider gemini
omni router chat "Explain quantum computing" --provider nvidia

# Specify model
omni router chat "Say hello" --model nvidia/nemotron-3-super-120b-a12b

# JSON output
omni router chat "Hello" --json

# Statistics
omni router stats
```

## Features

- **Automatic Failover**: When a provider returns 429 (rate limit) or 503 (service unavailable), automatically falls back to the next provider in the chain
- **Rate Limit Tracking**: Tracks requests per minute per provider; when usage exceeds 80% of limit, proactively switches to next provider
- **Reasoning Model Support**: Handles reasoning models (e.g., nemotron-3) where content may be in `reasoning_content` field instead of `content`
- **Unified Output**: All providers return OpenAI-compatible chat completion format
- **Vault Integration**: API keys loaded from `C:/Users/dingj/secret-vault/ENV20230818.env` — never hardcoded

## 5T Protocol Compliance

- **Traceable**: All requests logged with provider + model + timestamp
- **Trackable**: Rate limit tracking + fallback event recording
- **Tangible**: Structured output + clear error messages
- **Transparent**: Decision logic (fallback chain + rate limit) is open and configurable
- **Trustworthy**: API keys only read from vault, never written to disk or logs

## Configuration

Default configuration in `vps/smart-ai-router.mjs`:

```javascript
{
  providers: {
    nvidia: { priority: 1, rateLimit: 60, models: [...] },
    gemini: { priority: 2, rateLimit: 60, models: [...] },
  },
  fallbackChain: ['nvidia', 'gemini'],
  rateLimitThreshold: 0.8,  // Switch at 80% of rate limit
  maxRetries: 2,
  retryDelayMs: 1000,
  requestTimeoutMs: 30000,
}
```

## Testing & Validation

- 2026-10-16: Health check passed for both providers
- 2026-10-16: NVIDIA NIM chat completion verified (reasoning content handling)
- 2026-10-16: Gemini 503 failover to NVIDIA verified
- 2026-10-16: Rate limit tracking and fallback event logging verified

## Migration Path

- v1: Initial skeleton with mock implementation
- v2: Real API calls, rate limit tracking, automatic failover, CLI integration

## FAQ & Troubleshooting

- **Q: What happens when all providers are rate-limited?**
  A: The router resets the rate limit tracker and retries once. If still failing, returns an error with details from all attempted providers.

- **Q: How do I add a new provider?**
  A: Add a new entry to `providers` config and to `fallbackChain` array. Implement the API caller function if the provider uses a non-OpenAI format.

- **Q: Can I use this in my own project?**
  A: Yes. Import `SmartAIRouter` from `vps/smart-ai-router.mjs` and call `init()` then `chat(messages, options)`.
