---
source_origin: 万能分身超觉醒 session (2026-09-28) / OmniAgentBus + Gateway WS auth CI 閉環
created: 2026-09-28
modified: 2026-09-28
co_authors: [agent:01, agent:07, agent:11, agent:30]
lifecycle: active
access: public-research
---

# 通用工作流腳本產出標準

> 用途：當用戶要求「先生成 X 腳本」「寫一個 Y 工具」，依本標準產出可直接執行的交付物。
> 5T-Traceable: 本文件源於 2026-09-28 「萬能分身超覺醒」session 的實測閉環。

---

## 1. 交付物必備 frontmatter

`.md` 產物一律帶 frontmatter（repo `.githooks/pre-commit` 校驗，缺 `---` 開頭 delimiter 直接 exit 1）：

```yaml
---
source_origin: <來源：session 名 / 需求原句 / issue 編號>
created: YYYY-MM-DD
modified: YYYY-MM-DD
co_authors: [agent:NN, ...]
lifecycle: active | frozen
access: public-research | restricted
---
```

**位元層陷阱**：`read_file` 顯示的 L2 是 `source_origin:` 不代表 L1 有 `---`。
被 hook 拒絕時用 `head -c 20 file.md` 或 `xxd file.md | head -3` 確認第一行是 `2d2d2d 0a`。

---

## 2. 執行腳本三硬規則（覺一：先驗證後宣稱）

### 2.1 「已完成」的唯一證明是 exit code

- 非零 exit = 失敗。不論 stdout 印了多少 `✅`。
- **不可用管線的 exit 掩蓋前段失敗**：`cmd | tail -5` 的 exit 是 `tail` 的。
  要驗就單獨跑，或 `set -o pipefail`。
- 已驗證步驟：報告中附「指令 → exit code → 關鍵輸出」三件套。

### 2.2 驗證「CI 會跑的那條命令」，不是「我手打的命令」

CI 步驟的 `run:` 必須**從 YAML 解析後逐字執行**，不可手打複寫：

```python
import yaml, subprocess, os, sys
d = yaml.safe_load(open('.github/workflows/ci.yml', encoding='utf-8'))
step = [s for s in d['jobs']['ut-tests']['steps'] if s.get('name') == '<step name>'][0]
env = dict(os.environ); env.update(step.get('env', {}))
r = subprocess.run(step['run'], shell=True, env=env, capture_output=True, text=True)
print('exit', r.returncode)
sys.exit(r.returncode)
```

這消除「驗證的不是同一條命令」風險。手打複寫會在 `working-directory`、
`env`、`pnpm -F` filter 等處悄悄漂移。

### 2.3 排除 ≠ 遺棄（測試治理）

把腳本式測試從 vitest 抓取中排除**只是第一步**，必須同時補上真實執行路徑，
否則覆蓋率從「有但型別錯」變成「完全沒有」——更糟。

| 情況 | 處置 |
|------|------|
| `No test suite found in file` | vitest.config.ts `exclude` **＋** CI 加 `node <script>` 步驟 |
| node:test 套件被 vitest 抓 | `exclude` ＋ 該 package 自己的 `pnpm test` |
| Playwright 獨立套件 | `exclude` ＋ Playwright 自身執行 |

同類先例可直接照抄 repo 內既有排除項（`vitest.config.ts` 的 exclude 陣列本身
就是一份「哪些套件不是 vitest 格式」的索引）。

---

## 3. 驗證器自身必須被驗證

寫了檢查腳本（schema validator、lint wrapper）之後，**必須跑負向測試**：

1. 注入已知缺陷 → 確認能抓到
2. 確認不會在邊界輸入崩潰

實例：`verify-workflows-schema.py` 首輪負向測試以 `on: [push]`（sequence 形式）
餵入，拋出 `TypeError: unhashable type: 'list'` — 這是**驗證器的 bug**，
不是 workflow 的 bug。若沒跑負向測試，這個崩潰會讓驗證器對 sequence 形式的
workflow 完全失效，而回報看起來像「通過」。

**同時修兩個白名單類缺陷**：`workflow_run` 漏在合法觸發條件清單外。

---

## 4. 無工具時的誠實替代

| 缺失工具 | 誠實標示 | 替代路徑 |
|----------|---------|---------|
| `actionlint` | `command -v actionlint` 回空 = 未安裝，**不可假稱已用它驗證** | 寫 schema 必要鍵檢查（缺 runs-on/uses、uses+run 併存、with 非 mapping、觸發條件白名單）+ 負向測試 |
| `act` | 同上 | 從 YAML 抽出 `run:` 逐字本地執行（§2.2） |
| `pytest` | 確認 interpreter 與套件實際可用 | 記錄真實版本與 skip 理由 |

**「替代驗證通過」不等於「原工具驗證通過」** — 報告中分開寫。

---

## 5. 檔案搬移/改名（rename）驗證

repo 內改名常是「rename + 擴充」，容易留下孤兒引用：

```bash
# 1. 內容差異摘要（確認不是純 rename 就走完）
diff <(git show HEAD:<old_name>) <new_name> | grep -E "^[<>].*(def |class |export )"

# 2. 孤兒引用掃描（用 ripgrep，不用 grep -r：快一個數量級）
#    search_files(pattern='<old_name>', target='content')  # 排除 gitignored

# 3. 語法驗證
python -m py_compile <new_name>
```

**坑**：`grep -rn` 掃全 repo（含 node_modules）可能跑 400+ 秒仍未完。
優先用 ripgrep 工具（預設排除 gitignored 目錄）。背景 job 若被 ripgrep 的結果
取代，應主動 kill，不要放著佔資源。

---

## 6. served-surface 驗證（產物面）

只測原始碼會漏掉**只在編譯產物顯現**的缺陷：tsc 設定錯誤、匯出遺漏、
`package.json` 的 `main`/`types` 指錯。

| 面 | 執行方式 | 驗證對象 |
|----|---------|---------|
| src 面 | `tsx test/*.smoke.ts` | 原始碼行為 |
| dist 面 | `tsc && node test/dist-smoke.mjs` | 消費者真正 import 的產物 |

`dist/` 通常 gitignored → dist 煙霧需先 build，獨立為 `test:dist`，
再由 `test:all = test && test:dist` 聚合供 CI 呼叫。

---

## 7. 交付前自檢清單

- [ ] 「已完成」每一項都附真實 exit code
- [ ] CI 步驟的 `run:` 由 YAML 解析後逐字執行過
- [ ] 排除的測試有補上真實執行路徑（覆蓋率未減）
- [ ] 驗證器跑過負向測試（能擋 + 不崩潰）
- [ ] 缺工具已誠實標示，替代路徑與原工具結果分開陳述
- [ ] 改名/搬移已掃孤兒引用 + 語法驗證
- [ ] `.md` 產物 frontmatter 齊備且第一行是 `---`
- [ ] 架構規格書章節齊備、數字複驗過

---

*5T 狀態：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅*
