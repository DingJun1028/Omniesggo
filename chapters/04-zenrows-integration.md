# Ch.04 Zenrows 資料擷取整合

> 目標：用單一免費金鑰把「寫一段腳本」到「出可分發內容」的資料擷取工序自動化。

## 安裝與登入

```bash
npx -y @zenrows/cli init
pnpm exec zenrows login --api-key <key>
pnpm exec zenrows fetch https://example.com --output markdown
```

## 服務端 client

```ts
const res = await fetch(`${BASE}?${params.toString()}`, {
  headers: { Authorization: `Bearer ${API_KEY}` },
  signal: AbortSignal.timeout(30000),
});
if (!res.ok) throw new Error(`Zenrows fetch failed: ${res.status}`);
return res.text();
```

## API 路由

`POST /api/zenrows/fetch` 已內建 HMAC 守門（`X-Signature-256`），允許 `js_render`、`premium_proxy`、`wait`、`css`。

## 驗證

- [ ] `pnpm exec zenrows fetch https://example.com --output markdown` 200
- [ ] `pnpm vitest run src/lib/__tests__/zenrows-client.test.ts`
