# esg-swarm — Omniesggo ESG-GO agent swarm on Mistral Workflows

每個 swarm agent 只是一個 durable `@activity`(一次 LLM turn);30-agent swarm 由
`@workflow.define` 編排,以 `SwarmState` 黑板在 agent 間傳遞 — soul.md 記憶體式
agent hand-off 的 durable、可續跑版本。

**概念對照 soul.md**(實際定義以 soul.md 為準):

- **萬能十二大架構** → 頂層 workflow 編排圖 (`esg_swarm/workflow.py`)
- **5T protocol** → 每個 agent 的契約:Task in / Tool call / Trace / Result out (`agent_turn`)
- **結界六柱** → 綜合前的治理審查關卡 (`EsgSwarmWorkflow` 的 review gate)

## 結構

```
apps/esg-swarm/
├── pyproject.toml        # deps: mistralai-workflows, pydantic, python-dotenv
├── worker.py             # run_worker([EsgSwarmWorkflow]) — 連 orchestrator
├── run_local.py          # 本機端到端 (activities 進程內執行)
└── esg_swarm/
    ├── state.py          # SwarmState 黑板
    ├── agent.py          # agent_turn + build_agent(role, system)
    └── workflow.py       # EsgSwarmWorkflow:平行 pillar + 主審綜合
```

## 跑起來

本機端到端(需 `MISTRAL_API_KEY`,放 `.env.local`):

```bash
cd apps/esg-swarm
python run_local.py
```

Cloud worker(hybrid 模式):

```bash
cd apps/esg-swarm
python worker.py          # 啟動 worker (Ctrl+C 停)
# 再從 Studio 或 SDK 觸發 `esg-swarm`
```

## 擴展到 30 個 agent

在 `esg_swarm/workflow.py` 加更多 `build_agent(role, system)` role,並在
`EsgSwarmWorkflow.run` 串接 / 平行展開。durable 機制(state hand-off / retry /
crash-resume)不變。

## 部署

- Secrets 一律 `.env.local`(gitignored);worker 環境需有 `MISTRAL_API_KEY`。
- 本 app 自帶 venv(`uv venv` + `uv pip install -e .`),或依 repo overrides 慣例釘制。
