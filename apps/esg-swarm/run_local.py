"""Run the ESG-GO swarm end-to-end locally (activities in-process).

    python run_local.py

需要環境變數 MISTRAL_API_KEY (worker/活動都以它認證)。
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

dotenv.load_dotenv(ROOT / ".env.local")
dotenv.load_dotenv(ROOT / ".env")

import mistralai.workflows as workflows  # noqa: E402
from esg_swarm.workflow import EsgReportInput, EsgSwarmWorkflow  # noqa: E402


async def main() -> None:
    if not os.environ.get("MISTRAL_API_KEY"):
        raise SystemExit("MISTRAL_API_KEY not set (put it in .env.local)")
    with workflows.run_activities_locally():
        state = await workflows.execute_workflow(
            EsgSwarmWorkflow, EsgReportInput(), wait=True
        )
    print("\n===== SWARM RESULT =====")
    print("Company:", state.company)
    for role, text in state.findings.items():
        print(f"\n[{role}]\n{text}")
    print("\n--- Final report (lead auditor) ---")
    print(state.verdict)


if __name__ == "__main__":
    asyncio.run(main())
