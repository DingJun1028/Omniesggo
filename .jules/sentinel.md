## 2024-05-30 - Hash Locks and Immutable State

**Vulnerability:** Core data objects (like `IComponentCore`, `OmniNote`, `OmniTask`) were mutable, which violates the "Omni Restoration" protocol's Hash Lock requirement for snapshot rollbacks and reliable auditing.

**Learning:** When strict data traceability and immutability (like ISO-14064-1 compliance) are required, returning mutable objects from factory functions makes the state unpredictable. Also, raw string data from various sources can contain invisible characters or malformed encodings, causing hashing mismatches.

**Prevention:** Use `Object.freeze()` on returned objects to enforce Hash Locks. Use `EntropyForge.purify()` on raw string data before hashing or storing to normalize encodings and remove zero-width characters, ensuring consistent hashing.
## 2026-07-01 - [Replace Naive Regex HTML Sanitization with xss Library]
**Vulnerability:** Naive regex-based HTML sanitization functions (`sanitizeHtml`, `sanitizeTextHtml`) were discovered in `src/lib/safe-api.ts`, `app/omni-agent/page.tsx`, `app/omni-center/omni-one-chat.tsx`, and `app/omni-center/omni-note-crud.tsx`. They attempted to manually strip `<script>` tags and `on*` event handlers, leaving the application vulnerable to sophisticated Cross-Site Scripting (XSS) bypasses.
**Learning:** Hand-rolled regex sanitization is rarely comprehensive and often misses complex XSS vectors (e.g., malformed tags, nested scripts, alternative event handlers). A dedicated security library like `xss` is required for safe `dangerouslySetInnerHTML` rendering.
**Prevention:** Always use an established, well-maintained HTML sanitization library like `xss` or `DOMPurify` instead of custom regex when rendering untrusted HTML.
## 2026-07-02 - [Remove Hardcoded API Key from Gateway Config]
**Vulnerability:** A hardcoded API key fallback (`omniagent_gold_2026`) was present in the gateway server's configuration and deployment scripts. This meant that if the environment variables weren't set explicitly, anyone knowing this default fallback key could authenticate to the server.
**Learning:** Default API keys and secrets in code provide a false sense of ease-of-use while significantly compromising security. Fallbacks for authentication credentials should never exist.
**Prevention:** Always require secrets to be injected at runtime via environment variables or secret managers, and throw a clear error (or log a warning and block requests) if they are missing.
## 2026-07-02 - [Fix Command Injection in predictAndPreFetch]
**Vulnerability:** In `src/impl/core.ts`'s `predictAndPreFetch` method, a shell command (`curl`) was being constructed via string interpolation that included user-controlled input (`intent` morphed into `payload`), and was then executed using `child_process.execSync`. This is a classic command injection vulnerability where a malicious `intent` string could execute arbitrary commands on the host system.
**Learning:** Shell execution methods like `execSync` should never be used to perform HTTP requests or interact with user input when a native equivalent exists. Stringified JSON output (e.g., `JSON.stringify()`) does not escape single quotes, leaving the payload vulnerable to breaking out of the shell argument (`-d '${payload}'`).
**Prevention:** Avoid `child_process` execution for external API calls. Always use the native `fetch` API for all server-side HTTP requests instead, which completely bypasses the shell and inherently protects against command injection.
## 2026-08-10 - [Enforce Fail-Secure Pattern on Missing Gateway Key]
**Vulnerability:** The OmniAgent gateway servers (`omni-server.mjs`) had a hardcoded default API key fallback (`omniagent_gold_2026`). If the `GATEWAY_KEY` or `GATEWAY_API_KEY` environment variables were not set, the server would silently fall back to this hardcoded secret. This allowed anyone with knowledge of the codebase to authenticate with administrative privileges against unconfigured instances.
**Learning:** Hardcoded default credentials provide a false sense of ease-of-use while significantly compromising security. Fallbacks for authentication credentials should never exist. When security-critical environment variables are missing, systems should fail securely by explicitly aborting startup rather than attempting to proceed in an insecure state.
**Prevention:** Remove all hardcoded secret fallbacks. Implement a fail-secure startup check that logs a CRITICAL error message and exits the process (`process.exit(1)`) if required authentication keys (like `GATEWAY_KEY`) are undefined or empty.
## 2026-08-10 - [Keep Type Declarations Synchronized]
**Vulnerability:** Type declarations out of sync between `shared/types.ts` and `apps/learning-center/types/generated/esggo-shared.d.ts` resulted in CI failing.
**Learning:** In a codebase leveraging a "universal translator" type pattern across consumers, any updates to the master `shared/types.ts` must be propagated to consumer generated types, otherwise validation scripts like `check-types-sync.js` will fail in CI pipelines, blocking builds.
**Prevention:** Always run type export scripts (e.g. `node scripts/export-shared-types.js`) or verification checks (`node scripts/check-types-sync.js`) locally after modifying shared types to ensure they are synchronized before committing.
## 2026-08-10 - [Cloudflare Worker Build Failures in pnpm Monorepo]
**Vulnerability:** Cloudflare Worker CI builds were failing because the worker's `wrangler.toml` lacked a specific build command. In a pnpm monorepo, Cloudflare's default fallback to `npm install` fails when it encounters `workspace:*` dependencies in the lockfile or package configurations.
**Learning:** Cloudflare Workers running in a pnpm monorepo environment require explicit package manager configuration during the build phase to resolve workspace dependencies properly.
**Prevention:** Always include a `[build]` block in `wrangler.toml` with `command = "npx --yes pnpm install --frozen-lockfile"` for any Cloudflare Worker deployed from a pnpm monorepo. The `--yes` flag ensures the process does not hang on interactive prompts in CI.

## 2025-01-22 - Fail-Open Authentication in Cloudflare Worker Gateway
**Vulnerability:** The Cloudflare Worker gateway (`worker/src/index.ts`) contained a fail-open authentication vulnerability in its `bearerOk` function. If the `OMNI_GATEWAY_KEY` environment variable was missing or not configured, it would return `true` (`if (!expected) return true;`), essentially allowing unauthenticated requests to pass through as if they were valid.
**Learning:** This occurred due to an attempt to "allow local only if not configured". However, deploying such logic to production without environment safeguards essentially disables authentication by default if there's an environment configuration error or omission. This violates the fail-secure principle.
**Prevention:** Remove fail-open conditions that fallback to `true` when secrets are absent. Authentication logic must default to `false` (fail-secure) to ensure that misconfigurations result in denied access rather than unauthorized access.
## 2024-05-15 - Hardcoded Secrets in Config Files
**Vulnerability:** Found hardcoded secrets (WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN, GMAIL_APP_PASSWORD) in deployment configuration files (`ecosystem.config.cjs`, `webhook-config.json`).
**Learning:** Configuration files are often committed as artifacts to the repository, inadvertently leaking the secrets used during a specific deployment.
**Prevention:** Always use environment variable references (`process.env.VAR_NAME`) in JavaScript/Node config files and placeholder strings in JSON templates, rather than hardcoding actual credentials.
