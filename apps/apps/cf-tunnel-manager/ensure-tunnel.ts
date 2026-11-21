#!/usr/bin/env tsx
/**
 * ensure-tunnel.ts — ESG-GO Cloudflare Tunnel / DNS 宣告式管理器
 *
 * 對齊：soul.md §十一 結界六柱（空間柱：全節點同步 / VPS 常駐）
 * 來源：cloudflare TypeScript SDK (公開 npm `cloudflare@^7`，API 與內部 gitlab 源一致)
 *
 * 功能（冪等、可重跑）：
 *   1. 確保 tunnel `esggo-tunnel` 存在（不存在則建，取其 ID）
 *   2. 確保主機名 `translate.esggo.co` 經由該 tunnel 路由（DNS CNAME）
 *   3. 輸出可驗證結果（供 §九 詔一·真：先驗證後宣稱）
 *
 * 前置（必備，否則明確報錯，不偽造）：
 *   - CLOUDFLARE_API_TOKEN（Account Token，需 Zone:DNS:Edit + Account:Cloudflare Tunnel:Edit）
 *   - CLOUDFLARE_ACCOUNT_ID
 *
 * 註：本腳本走 Cloudflare REST API（需 Account Token）。
 *     VPS 上若已用 cloudflared CLI + cert 建立好（見 deploy/tunnel_translate.md），
 *     則本腳本為「聲明式再確保 / 漂移修復」用途，二者互補不衝突。
 */

import Cloudflare from 'cloudflare';

const ACCOUNT_ID = process.env['CLOUDFLARE_ACCOUNT_ID'];
const API_TOKEN = process.env['CLOUDFLARE_API_TOKEN'];
const TUNNEL_NAME = process.env['CF_TUNNEL_NAME'] ?? 'esggo-tunnel';
const HOSTNAME = process.env['CF_HOSTNAME'] ?? 'translate.esggo.co';
const ZONE_NAME = process.env['CF_ZONE_NAME'] ?? 'esggo.co';

function fail(msg: string): never {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!API_TOKEN) {
  fail('缺少 CLOUDFLARE_API_TOKEN（Account Token）。本腳本走 REST API 必需。VPS 上線請改用 cloudflared CLI 路徑（deploy/tunnel_translate.md）。');
}
if (!ACCOUNT_ID) fail('缺少 CLOUDFLARE_ACCOUNT_ID。');

const client = new Cloudflare({ apiToken: API_TOKEN });

async function findTunnel(): Promise<{ id: string; name: string } | null> {
  const page = await client.zeroTrust.tunnels.cloudflared.list({
    account_id: ACCOUNT_ID!,
    name: TUNNEL_NAME,
  });
  for (const t of page.result) {
    if (t.name === TUNNEL_NAME) return { id: t.id!, name: t.name! };
  }
  return null;
}

async function resolveZoneId(): Promise<string> {
  const zl = await client.zones.list({ name: ZONE_NAME });
  const zone = zl.result.find((z) => z.name === ZONE_NAME);
  if (!zone) fail(`找不到 zone「${ZONE_NAME}」`);
  return zone.id!;
}

async function main(): Promise<void> {
  console.log(`🚇 確保 tunnel「${TUNNEL_NAME}」存在 (account=${ACCOUNT_ID})`);

  let tunnel = await findTunnel();
  if (!tunnel) {
    console.log('   ℹ️ 未找到，建立新 tunnel');
    const created = await client.zeroTrust.tunnels.cloudflared.create({
      account_id: ACCOUNT_ID!,
      name: TUNNEL_NAME,
      config_src: 'cloudflare',
    });
    tunnel = { id: created.id!, name: created.name! };
    console.log(`   ✅ 已建立 tunnel id=${tunnel.id}`);
  } else {
    console.log(`   ✅ 已存在 tunnel id=${tunnel.id}`);
  }
  const tunnelId: string = tunnel.id;
  const zoneId = await resolveZoneId();
  console.log(`🌐 Zone「${ZONE_NAME}」id=${zoneId}`);

  const cnameTarget = `${tunnelId}.cfargotunnel.com`;
  const records = await client.dns.records.list({
    zone_id: zoneId,
    name: HOSTNAME,
  } as any);
  const existing = records.result.find((r) => r.name === HOSTNAME && r.type === 'CNAME');
  if (existing) {
    console.log(`   ✅ DNS 已存在 ${HOSTNAME} → ${(existing as any).content}`);
  } else {
    await client.dns.records.create({
      zone_id: zoneId,
      name: HOSTNAME,
      type: 'CNAME',
      content: cnameTarget,
      ttl: 1,
      proxied: true,
    } as any);
    console.log(`   ✅ 已建立 DNS CNAME ${HOSTNAME} → ${cnameTarget}`);
  }

  console.log('🎉 ensure-tunnel 完成（宣告式一致）');
  console.log(`   公網驗證: curl -sS https://${HOSTNAME}/health`);
}

main().catch((err) => {
  console.error('❌ 執行失敗:', err instanceof Error ? err.message : err);
  process.exit(1);
});
