/* eslint-disable @typescript-eslint/no-var-requires */
const { quickSummon } = require('../src/agents/oa-summon');

// 解析 CLI 參數（run-summon.ts 同時被 npm script 與直接呼叫使用）
const argv = process.argv.slice(2);
function hasFlag(flag: string): boolean {
  return argv.includes(flag);
}
function getArg(name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : undefined;
}

const cfg: any = {};
if (getArg('--soul')) cfg.soulName = getArg('--soul');
if (getArg('--key')) cfg.keyName = getArg('--key');
if (getArg('--host')) cfg.vpsHost = getArg('--host');
if (getArg('--port')) cfg.vpsPort = Number(getArg('--port'));
if (getArg('--gateway')) cfg.gatewayUrl = getArg('--gateway');
if (getArg('--token')) cfg.gatewayToken = getArg('--token');
if (hasFlag('--no-verify')) cfg.verifyConnection = false;
if (hasFlag('--core')) cfg.initCore = true;

// 環境變數覆寫（來自 esggo summon 子命令 delegate）
if (process.env.OA_SOUL) cfg.soulName = process.env.OA_SOUL;
if (process.env.OA_KEY) cfg.keyName = process.env.OA_KEY;
if (process.env.OA_HOST) cfg.vpsHost = process.env.OA_HOST;
if (process.env.OA_PORT) cfg.vpsPort = Number(process.env.OA_PORT);
if (process.env.OA_GATEWAY) cfg.gatewayUrl = process.env.OA_GATEWAY;
if (process.env.OA_GATEWAY_TOKEN) cfg.gatewayToken = process.env.OA_GATEWAY_TOKEN;
if (process.env.OA_NO_VERIFY) cfg.verifyConnection = false;
if (process.env.OA_CORE) cfg.initCore = true;

(async () => {
  const result = await quickSummon({
    soulName: 'JunAiKey',
    keyName: '萬能元鑰',
    vpsHost: '161.118.248.180',
    vpsPort: 8042,
    ...cfg,
  });
  console.log('\n=== OA-Summon result ===');
  console.log(JSON.stringify({
    success: result.success,
    stage: result.stage,
    durationMs: result.durationMs,
    entanglementId: result.entanglementId,
    gatewayUrl: result.gatewayUrl,
    gatewayVersion: result.gatewayVersion,
    gatewayStatus: result.gatewayStatus,
    coreInitialized: result.coreInitialized,
    coreStatus: result.coreStatus,
    coreError: result.coreError,
    warnings: result.warnings,
    errors: result.errors,
  }, null, 2));
  // 不可用 process.exit()：Node 24 + undici keep-alive socket 在 Windows 上會觸發
  // libuv assert（handle->flags & UV_HANDLE_CLOSING）導致 exit 127。改讓事件迴圈自然收尾。
  process.exitCode = result.success ? 0 : 1;
})();
