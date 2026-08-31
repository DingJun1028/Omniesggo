// [agent:15][squad:光之羽翼][lifecycle:active][p2][platform:esggo][best-practice:结界]
import { program } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { gatewayRequest } from './gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('oa')
  .description('OA-Team 30 萬能代理小隊命令控制介面')
  .version(pkg.version, '-v, --version', '顯示版本號')
  .hook('preAction', (thisCommand) => {
    console.log(`[5T:Traceable] source_origin=oa-cli command=${thisCommand.name()}`);
  });

program
  .command('status')
  .description('查詢 OA-Team 30 代理陣列狀態（MECE 分工/負載/健康）')
  .option('--dry-run', '預演模式：不實際查詢，僅回報將執行動作')
  .option('--live', '實查模式：發出真實 Gateway 請求')
  .action(async (opts) => {
    if (!opts.live || opts.dryRun) {
      console.log('[DRY-RUN] oa status → 將查詢：swarm_matrix, array_health, task_queue');
      console.log('[5T:Trustworthy] dry-run 無副作用，Hash Lock 預留');
      return;
    }
    try {
      const data = await gatewayRequest('/oa/status');
      console.log('[LIVE]', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 查詢失敗:', (e as Error).message);
    }
  });

const agents = program.command('agents').description('30 位代理管理');

agents
  .command('list')
  .description('列出 30 位代理（01-30）與所屬陣列')
  .option('--array <id>', '篩選陣列 1-5')
  .option('--dry-run', '預演模式')
  .option('--live', '實查模式')
  .action(async (opts) => {
    if (!opts.live || opts.dryRun) {
      console.log(`[DRY-RUN] oa agents list --array=${opts.array || 'all'} → 將回傳代理矩陣`);
      console.log('[5T:Traceable] source_origin=oa-cli agents list');
      return;
    }
    try {
      const data = await gatewayRequest(`/oa/agents?array=${opts.array || 'all'}`);
      console.log('[LIVE]', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 查詢失敗:', (e as Error).message);
    }
  });

const task = program.command('task').description('任務派發與管理');

task
  .command('dispatch <prompt>')
  .description('派發任務到指定陣列（經 Hermes 路由）')
  .option('--array <id>', '目標陣列 1-5，預設由蜂王路由')
  .option('--dry-run', '預演模式')
  .option('--live', '實查模式')
  .action(async (prompt, opts) => {
    if (!opts.live || opts.dryRun) {
      console.log(`[DRY-RUN] oa task dispatch "${prompt}" → array=${opts.array || 'auto'}`);
      console.log('[5T:Trustworthy] 派發經 Key-Ω 簽印，不可篡改');
      return;
    }
    try {
      const data = await gatewayRequest('/oa/task/dispatch', undefined, { prompt, array: opts.array });
      console.log('[LIVE]', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[BLOCKER] Gateway 派發失敗:', (e as Error).message);
    }
  });


// §23-24: Weekly swarm report (n8n cron bridge → KPI + 5T audit + entropy)
program
  .command('weekly-report')
  .description('生成 OA-Team 週報 (KPI + 5T 稽核 + 熵減) — n8n cron 與手動皆可呼叫')
  .option('--dry-run', '預演模式：僅輸出 markdown，不寄送')
  .option('--channels <list>', '逗號分隔: telegram,slack,email')
  .option('--pairing <pct>', '跨組配對率 (real measured)')
  .option('--entropy <val>', '當前熵值')
  .option('--security <n>', '安全事件數')
  .option('--satisfaction <val>', '用戶滿意度 /5')
  .action(async (opts) => {
    if (opts.dryRun) {
      console.log('[DRY-RUN] oa weekly-report → 將呼叫 aistation scripts/weekly_report.py --dry-run');
      console.log('[5T:Traceable] source_origin=oa-cli weekly-report');
      return;
    }
    try {
      const { spawnSync } = await import('node:child_process');
      const projectAistation = join(process.cwd(), 'aistation');
      const { existsSync } = await import('node:fs');
      if (!existsSync(join(projectAistation, 'src', 'kpi.py'))) {
        console.log('[BLOCKER] aistation 目錄不存在 — 請確認 aistation 專案位於 esggo 根目錄下');
        return;
      }
      const args = [join(projectAistation, 'scripts', 'weekly_report.py'), '--dry-run'];
      if (opts.channels) args.push('--channels', opts.channels);
      if (opts.pairing) args.push('--pairing', opts.pairing);
      if (opts.entropy) args.push('--entropy', opts.entropy);
      if (opts.security) args.push('--security', opts.security);
      if (opts.satisfaction) args.push('--satisfaction', opts.satisfaction);
      const result = spawnSync('python3', args, {
        encoding: 'utf-8',
        shell: process.platform === 'win32',
        cwd: projectAistation,
      });
      if (result.error) {
        console.log('[BLOCKER] python3 執行失敗:', result.error.message);
      } else {
        console.log(result.stdout);
        if (result.stderr) console.error(result.stderr);
      }
    } catch (e) {
      console.log('[BLOCKER] weekly-report 失敗:', (e as Error).message);

// ── §20 OmniTag 契約閘：產物誕生即過閘（§5 喚醒命令體系入口）──
program
  .command('tag')
  .description('§20 OmniTag 契約閘 — 產物誕生即附必備三枚 + 自動路由 + Hash Lock')
  .option('--agent <id>', '代理歸屬 agent:01~agent:30 (--init 模式免填)')
  .option('--lifecycle <state>', '生命週期 draft/active/frozen/archived (--init 模式免填)')
  .option('--p <level>', '品質分級 p0/p1/p2/p3 (--init 模式免填)')
  .option('--squad <name>', '陣列歸屬 智庫聖所/符文契約/光之羽翼/煉金熵減/5T驗算')
  .option('--security <level>', '安全分級 public/internal/confidential/restricted')
  .option('--platform <env>', '平台環境 esggo/omni/vps/firebase')
  .option('--best-practice <state>', '結界繼承 awakened/结界')
  .option('--content <json>', '待簽印內容 (JSON 字串)，用於產生 Hash Lock')
  .option('--entity <id>', '實體識別碼，預設自動生成')
  .option('--persist', '寫入即凍結：將過閘產物持久化至 OmniTag Registry (§20.6)')
  .option('--registry <path>', 'Registry 路徑，預設 .oa/omnitag-registry.jsonl')
  .option('--init', '§20.6 煉金補標：掃描目錄為無標頭 .ts 自動補 OmniTag 標籤 (預設 dry-run)')
  .option('--write', '與 --init 搭配：實際寫入標頭 (否則僅預覽)')
  .option('--dir <paths>', '與 --init 搭配：掃描目錄 (逗號分隔)，預設 src,cli')
  .option('--json', '以 JSON 格式輸出完整過閘結果')
  .action(async (opts) => {
    const { emitArtifact, OmniTagContractViolation, OmniTagRegistry } = await import('./omnitag.js');

    // 非 --init 模式：手動檢查必備三枚 (commander 已改為非 required 以支持 --init)
    if (!opts.init && (!opts.agent || !opts.lifecycle || !opts.p)) {
      console.error('[錯誤] tag 模式需 --agent / --lifecycle / --p 三枚必備 (或用 --init 補標模式)');
      process.exit(1);
    }

    // §20.6 煉金補標模式：掃描目錄為無標頭 .ts 自動補標
    if (opts.init) {
      const { findUntagged, applyHeader } = await import('./audit.js');
      const dirs = (opts.dir || 'src,cli').split(',').map((d: string) => d.trim());
      const untagged = findUntagged(dirs);
      console.log(`[§20.6 煉金補標] 待補標檔案=${untagged.length} (dry-run=${!opts.write})`);
      const written: string[] = [];
      for (const f of untagged) {
        const r = applyHeader(f, !opts.write);
        if (r.header) {
          console.log(`  ${opts.write ? '✎' : '?'} ${r.file} -> ${r.header.trim()}`);
          if (r.written) written.push(f);
        }
      }
      if (!opts.write) {
        console.log(`[提示] 加 --write 才實際寫入標頭 (§21.2 紅線防護)`);
      } else {
        console.log(`[OK] 已補標 ${written.length} 檔案`);
      }
      return;
    }

    const tag = {
      agent: opts.agent,
      lifecycle: opts.lifecycle,
      priority: opts.p,
      squad: opts.squad,
      security: opts.security,
      platform: opts.platform,
      bestPractice: opts.bestPractice,
    };
    const entityId = opts.entity || `artifact:${Date.now().toString(36)}`;
    try {
      const result = emitArtifact({
        entityId,
        tag,
        content: opts.content,
      });
      if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        const r = result.route;
        console.log(`[5T:Traceable] entity=${entityId} agent=${tag.agent}`);
        console.log(`[§20.4 路由] squad=${r.target?.squad ?? 'N/A'} → ${r.target?.action ?? 'N/A'} (${r.target?.routeKey ?? '-'})`);
        console.log(`[§20.3 結界] barrierInherited=${r.barrierInherited} consistent=${r.consistent}`);
        console.log(`[§18 HashLock] ${result.hashLock}`);
        console.log(`[OK] 產物通過 §20.5 契約閘，已凍結可溯源`);
      }

      // §20.6 寫入即凍結
      if (opts.persist) {
        const reg = new OmniTagRegistry({ path: opts.registry });
        reg.persistArtifact({ entityId, tag, content: opts.content });
        const verify = reg.verifyArtifact(entityId);
        console.log(`[§20.6 凍結] 寫入 registry=${opts.registry || '.oa/omnitag-registry.jsonl'} entity=${entityId}`);
        console.log(`[§20.6 驗證] exists=${verify.exists} tampered=${verify.tampered}`);
        if (verify.tampered) {
          console.error('[§5 Trustworthy] 寫入後 hash 校驗失敗，資料已被篡改');
          process.exit(1);
        }
      }
    } catch (e) {
      if (e instanceof OmniTagContractViolation) {
        console.error(`[§20.5 契約違規] ${e.check.violations.join('; ')}`);
        process.exit(1);
      }
      console.error('[ERROR]', (e as Error).message);
      process.exit(1);
    }
  });

// ── §20.5 規則 5 / §20.6 驗收：OmniTag 合約率稽核 ──────────
program
  .command('audit')
  .description('§20.5 稽核抽驗 — 掃描 .ts 檔 OmniTag 標頭合約率 (目標 100%)')
  .option('--dir <paths>', '掃描目錄 (逗號分隔)，預設 src,cli', 'src,cli')
  .option('--json', '以 JSON 格式輸出稽核結果')
  .action(async (opts) => {
    const { auditOmniTags } = await import('./audit.js');
    const dirs = opts.dir.split(',').map((d: string) => d.trim());
    const result = auditOmniTags(dirs);
    if (opts.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`[§20.5 稽核] 掃描檔案=${result.scanned} 帶標籤=${result.tagged} 合約=${result.compliant}`);
      console.log(`[§20.5 合約率] ${(result.rate * 100).toFixed(1)}% (目標 100%)`);
      if (result.violations.length > 0) {
        console.log(`[§20.5 違規] ${result.violations.length} 項:`);
        for (const v of result.violations) {
          console.log(`  - ${v.file}: ${v.issues.join('; ')}`);
        }
        process.exit(1);
      } else {
        console.log(`[OK] 全部帶標籤檔案通過 §20.5 契約，合約率 100%`);
      }

    }
  });

program.parseAsync(process.argv).catch((err) => {
  console.error('[ERROR]', err.message);
  process.exit(1);
});
