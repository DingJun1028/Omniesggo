import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { gatewayRequest, loadGatewayConfig } from './gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('omni')
  .description('OmniGateway / Omni 生態系統命令控制介面')
  .version(pkg.version, '-v, --version', '顯示版本號')
  .hook('preAction', (thisCommand) => {
    console.log(`[5T:Traceable] source_origin=omnicli command=${thisCommand.name()}`);
  });

const gateway = program.command('gateway').description('Gateway 管理');

gateway
  .command('status')
  .description('查詢 OmniGateway 狀態（埠號/延遲/健康）')
  .option('--dry-run', '預演模式：不實際查詢，僅回報將執行動作')
  .option('--live', '實查模式')
  .action(async (opts) => {
    if (!opts.live || opts.dryRun) {
      console.log('[DRY-RUN] omni gateway status → 將查詢：8420, latency, health');
      console.log('[5T:Trustworthy] dry-run 無副作用，Hash Lock 預留');
      return;
    }
    try {
      const data = await gatewayRequest('/gateway/status');
      console.log('[LIVE]', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 查詢失敗:', (e as Error).message);
    }
  });

const route = program.command('route').description('路由管理');

route
  .command('list')
  .description('列出 Gateway 路由規則')
  .option('--dry-run', '預演模式')
  .option('--live', '實查模式')
  .action(async (opts) => {
    if (!opts.live || opts.dryRun) {
      console.log('[DRY-RUN] omni route list → 將回傳路由表');
      console.log('[5T:Trackable] 路由變化可追蹤');
      return;
    }
    try {
      const data = await gatewayRequest('/routes');
      console.log('[LIVE]', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 查詢失敗:', (e as Error).message);
    }
  });

const auth = program.command('auth').description('鑑權管理');

auth
  .command('check')
  .description('驗證 TDAI Bearer 鑑權有效性')
  .option('--dry-run', '預演模式')
  .option('--live', '實查模式')
  .action(async (opts) => {
    if (!opts.live || opts.dryRun) {
      console.log('[DRY-RUN] omni auth check → 將呼叫 TDAI /v2/conversation/query 驗證 Bearer');
      console.log('[5T:Trustworthy] Bearer token 不落地日誌');
      return;
    }
    const cfg = loadGatewayConfig();
    if (!cfg.token) {
      console.log('[BLOCKER] 未配置 token — 請於 gateway.json 或 TDAI_GATEWAY_API_KEY 提供');
      return;
    }
    try {
      // 真實 TDAI 授權驗證: 帶 Bearer + x-tdai-service-id 查詢, 200=有效, 401=無效
      const data = await gatewayRequest(
        '/v2/conversation/query',
        cfg.token,
        { query: 'auth-check', team_id: 'oa-team-30', agent_id: 'universal-bee' },
      );
      console.log('[LIVE] 授權有效 ✓', JSON.stringify(data).slice(0, 200));
      console.log('[5T:Trustworthy] Bearer + x-tdai-service-id 閘通過');
    } catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('401')) {
        console.log('[BLOCKER] Bearer 無效 (401) — 檢查 TDAI_GATEWAY_API_KEY');
      } else if (msg.includes('timeout') || msg.includes('ECONNREFUSED')) {
        console.log('[BLOCKER] Gateway 不可達 — 檢查 url (預設 localhost:8420, 可經 gateway.json 覆寫)');
      } else {
        console.log('[BLOCKER] Gateway 鑑權失敗:', msg);
      }
    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
