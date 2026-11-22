"""Worker entrypoint — 註冊 swarm workflow 並連上 orchestrator。

    python worker.py
    # 再從 Studio 或 SDK 觸發 esg-swarm

依 repo 慣例 (見 apps/vibe-ci-monitor/worker.py):run_worker([...]) 用環境/配置
內的憑證,不在此硬塞 api_key。啟動 worker 的環境需有 MISTRAL_API_KEY。
"""

import asyncio
import os
import sys
from pathlib import Path

import dotenv

ROOT = Path(__file__).resolve().parent
for p in (str(ROOT),):
    if p not in sys.path:
        sys.path.insert(0, p)

# Secrets (MISTRAL_API_KEY) from .env.local; stable deployment identifier.
dotenv.load_dotenv(ROOT / ".env.local")
os.environ.setdefault("DEPLOYMENT_NAME", "esg-swarm")

import mistralai.workflows as workflows

from esg_swarm.workflow import EsgSwarmWorkflow


async def main() -> None:
    print(f"[worker] registering ['esg-swarm'] (deployment={os.environ['DEPLOYMENT_NAME']})")
    await workflows.run_worker([EsgSwarmWorkflow])


if __name__ == "__main__":
    asyncio.run(main())
