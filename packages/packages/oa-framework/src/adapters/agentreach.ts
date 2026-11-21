/**
 * Agent Reach Adapter — Panniantong/agent-reach (Python 套件, pip install agent-reach)
 * 定位: AI Agent 的本地端「聯網能力層」(Capability Layer), 零 API 費用/金鑰
 * 本質: 路由器 + 體檢器 — 實際執行委派給上游開源 CLI
 *   網頁搜尋→mcporter(exa) / 網頁閱讀→curl+jina / GitHub→gh / YouTube→yt-dlp /
 *   B站→bili / Twitter→twitter / Reddit→opencli reddit|rdt /
 *   小紅書→opencli xiaohongshu / Facebook→opencli facebook / Instagram→opencli instagram /
 *   V2EX→curl / 小宇宙→(video.md) / 雪球→(finance.md)
 * 自診: agent-reach doctor --json (顯示每平台當前 active_backend)
 * 安裝: pip install agent-reach && agent-reach install --env=auto
 *
 * 精確命令來源: 官方 agent_reach/skill/SKILL.md (llms.txt 路由表)
 * 設計哲學對齊 ESG GO: 去中心化模組化(MECE) + 高透明度可追溯 + 5T 合規
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { ISubFrameAdapter, OAFrameConfig, OATask, SubFrameId } from '../core/types.js';

const execFileP = promisify(execFile);

/** Agent-Reach 支援的觸達渠道 (官方 15 平台) */
export type AgentReachChannel =
  | 'youtube'      // 字幕 (yt-dlp)
  | 'github'       // (gh)
  | 'bilibili'     // (bili)
  | 'twitter'      // (twitter-cli, 需 TWITTER_AUTH_TOKEN/CT0)
  | 'reddit'       // (opencli reddit | rdt)
  | 'xiaohongshu'  // (opencli xiaohongshu)
  | 'facebook'     // (opencli facebook)
  | 'instagram'    // (opencli instagram)
  | 'linkedin'     // (career.md)
  | 'v2ex'         // (curl api)
  | 'xiaoyuzhou'   // 小宇宙播客 (video.md)
  | 'xueqiu'       // 雪球 (finance.md)
  | 'exa'          // Exa 語意搜尋 (mcporter)
  | 'jina'         // Jina Reader 網頁閱讀 (curl)
  | 'rss';         // RSS (web.md)

export class AgentReachAdapter implements ISubFrameAdapter {
  readonly id: SubFrameId = 'agentreach';
  readonly label = 'Agent Reach (Panniantong/agent-reach)';
  readonly runtime = 'ts' as const;
  private cli = 'agent-reach';

  constructor(private config: OAFrameConfig) {}

  /** 啟動: 探測 agent-reach CLI 是否可用 (真實: doctor 回 No channels installed 即 CLI 在) */
  async bootstrap(): Promise<{ ok: boolean; endpoint?: string; error?: string }> {
    try {
      await execFileP(this.cli, ['doctor'], { timeout: 8000 });
      return { ok: true, endpoint: 'local-cli' };
    } catch {
      try {
        await execFileP('python3', ['-m', 'agent_reach', 'doctor'], { timeout: 8000 });
        return { ok: true, endpoint: 'python-module' };
      } catch {
        return {
          ok: false,
          endpoint: 'local-cli',
          error: 'agent-reach 未安裝 (pip install agent-reach) — scaffold 模式',
        };
      }
    }
  }

  /** 自我診斷: agent-reach doctor --json (顯示每平台 active_backend) */
  async doctor(): Promise<{ ok: boolean; report?: string }> {
    try {
      const { stdout } = await execFileP(this.cli, ['doctor', '--json'], { timeout: 20000, encoding: 'utf8' });
      return { ok: true, report: String(stdout) };
    } catch (e: any) {
      return { ok: false, report: e?.message ?? 'doctor failed' };
    }
  }

  /**
   * 提交聯網任務 — 依官方路由表委派對應上游 CLI 真實命令。
   * 命令模板來自 agent_reach/skill/SKILL.md, 不自行發明。
   */
  async dispatch(task: OATask): Promise<{ output: string }> {
    const diag = await this.doctor().catch(() => ({ ok: false }));
    const channel = this.route(task.prompt);
    const q = task.prompt.replace(/["`$\\]/g, ' ').trim();
    try {
      const { cmd, args, shell } = this.buildCommand(channel, q, task.prompt);
      const opts: any = { timeout: 60000, encoding: 'utf8' };
      const { stdout, stderr } = shell
        ? await execFileP('bash', ['-lc', `${cmd} ${args}`], opts)
        : await execFileP(cmd, args.split(' ').filter(Boolean), opts);
      const body = (String(stdout) || String(stderr) || '').trim();
      return {
        output: `[AgentReach:${channel}] ${body || '(no output)'} | doctor=${diag.ok ? 'ok' : 'degraded'}`,
      };
    } catch (e: any) {
      return {
        output: `[AgentReach:${channel}] (scaffold: ${e?.message ?? 'cli unreachable'})`,
      };
    }
  }

  /** 依官方路由表建構真實上游 CLI 命令 */
  private buildCommand(
    ch: AgentReachChannel,
    q: string,
    rawPrompt: string
  ): { cmd: string; args: string; shell?: boolean } {
    const urlMatch = rawPrompt.match(/https?:\/\/[^\s"'<>]+/);
    const url = urlMatch ? urlMatch[0] : '';
    switch (ch) {
      case 'exa':
        return { cmd: 'mcporter', args: `call exa.web_search_exa query="${q}" numResults=5`, shell: true };
      case 'jina':
        return { cmd: 'curl', args: `-s "https://r.jina.ai/${url || q}"`, shell: true };
      case 'github':
        return { cmd: 'gh', args: `search repos "${q}" --sort stars --limit 10` };
      case 'youtube':
        return { cmd: 'yt-dlp', args: `--write-sub --write-auto-sub --skip-download -o "/tmp/%(id)s" "${url || q}"`, shell: true };
      case 'bilibili':
        return { cmd: 'bili', args: `search "${q}" --type video -n 5` };
      case 'twitter':
        return { cmd: 'twitter', args: `search "${q}" -n 10` };
      case 'reddit':
        return { cmd: 'opencli', args: `reddit search "${q}" -f yaml` };
      case 'xiaohongshu':
        return { cmd: 'opencli', args: `xiaohongshu search "${q}" -f yaml` };
      case 'facebook':
        return { cmd: 'opencli', args: `facebook search "${q}" -f yaml` };
      case 'instagram':
        return { cmd: 'opencli', args: `instagram search "${q}" -f yaml` };
      case 'v2ex':
        return { cmd: 'curl', args: `-s "https://www.v2ex.com/api/topics/hot.json" -H "User-Agent: agent-reach/1.0"`, shell: true };
      case 'linkedin':
      case 'xiaoyuzhou':
      case 'xueqiu':
      case 'rss':
        // 複雜場景見官方 references/*.md; 先以 Exa 語意搜尋兜底
        return { cmd: 'mcporter', args: `call exa.web_search_exa query="${q}" numResults=5`, shell: true };
    }
  }

  /** 依 prompt 關鍵字路由渠道 (MECE 模組化路由, 對齊官方路由表) */
  private route(prompt: string): AgentReachChannel {
    const p = prompt.toLowerCase();
    if (p.includes('youtube') || p.includes('影片') || /youtu\.be|youtube\.com/.test(prompt)) return 'youtube';
    if (p.includes('github') || p.includes('repo') || p.includes('代碼搜尋')) return 'github';
    if (p.includes('bilibili') || p.includes('b站')) return 'bilibili';
    if (p.includes('twitter') || p.includes('x ')) return 'twitter';
    if (p.includes('reddit')) return 'reddit';
    if (p.includes('小紅書') || p.includes('xiaohongshu') || p.includes('xhs')) return 'xiaohongshu';
    if (p.includes('facebook')) return 'facebook';
    if (p.includes('instagram')) return 'instagram';
    if (p.includes('linkedin') || p.includes('領英') || p.includes('招聘') || p.includes('職位')) return 'linkedin';
    if (p.includes('v2ex')) return 'v2ex';
    if (p.includes('小宇宙') || p.includes('podcast') || p.includes('播客')) return 'xiaoyuzhou';
    if (p.includes('雪球') || p.includes('股票')) return 'xueqiu';
    if (p.includes('rss')) return 'rss';
    if (p.includes('jina') || (p.includes('http') && p.includes('讀'))) return 'jina';
    return 'exa'; // 預設語意搜尋
  }

  async health() {
    try {
      await execFileP(this.cli, ['doctor'], { timeout: 8000 });
      return { status: 'ok' as const, detail: 'local-cli ready (doctor ok)' };
    } catch {
      try {
        await execFileP('python3', ['-m', 'agent_reach', 'doctor'], { timeout: 8000 });
        return { status: 'ok' as const, detail: 'python-module ready' };
      } catch {
        return { status: 'down' as const, detail: 'scaffold (pip install agent-reach)' };
      }
    }
  }
}
