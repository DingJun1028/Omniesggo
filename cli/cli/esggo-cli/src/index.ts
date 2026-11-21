import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { gatewayRequest, loadGatewayConfig } from './gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('esggo')
  .description('ESG-GO 萬能蜂群核心數據命令控制介面')
  .version(pkg.version, '-v, --version', '顯示版本號')
  .hook('preAction', (thisCommand) => {
    console.log(`[5T:Traceable] source_origin=esggo-cli command=${thisCommand.name()}`);
  });

program
  .command('status')
  .description('查詢蜂群核心狀態（熵值、記憶召回率、5T 稽核）')
  .option('--dry-run', '預演模式：不實際查詢，僅回報將執行動作')
  .option('--live', '實查模式：發出真實 Gateway 請求')
  .action(async (opts) => {
    if (!opts.live || opts.dryRun) {
      console.log('[DRY-RUN] esggo status → 將查詢：entropy, memory_recall, 5t_audit');
      console.log('[5T:Trustworthy] dry-run 無副作用，Hash Lock 預留');
      return;
    }
    try {
      const data = await gatewayRequest('/status');
      console.log('[LIVE]', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 查詢失敗:', (e as Error).message);
    }
  });

const data = program.command('data').description('核心數據讀寫（含 Hash Lock）');

data
  .command('get <key>')
  .description('調動核心數據讀取')
  .option('--dry-run', '預演模式')
  .option('--live', '實查模式')
  .action(async (key, opts) => {
    if (!opts.live || opts.dryRun) {
      console.log(`[DRY-RUN] esggo data get ${key} → 將經 Gateway 8420 讀取`);
      console.log('[5T:Traceable] source_origin=esggo-cli data get');
      return;
    }
    try {
      const result = await gatewayRequest(`/data/${encodeURIComponent(key)}`);
      console.log('[LIVE]', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 查詢失敗:', (e as Error).message);
    }
  });

data
  .command('set <key> <value>')
  .description('調控核心數據寫入（含 Hash Lock）')
  .option('--dry-run', '預演模式（強烈建議先跑）')
  .option('--live', '實查模式')
  .action(async (key, value, opts) => {
    if (!opts.live || opts.dryRun) {
      console.log(`[DRY-RUN] esggo data set ${key}=${value} → 將寫入並 Hash Lock`);
      console.log('[5T:Trustworthy] 寫入即凍結，不可篡改');
      return;
    }
    try {
      const result = await gatewayRequest(`/data/${encodeURIComponent(key)}`, undefined, value);
      console.log('[LIVE]', JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 寫入失敗:', (e as Error).message);
    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
