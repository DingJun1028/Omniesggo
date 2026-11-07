"""Trigger the esg-swarm execution on the cloud orchestrator and wait for result."""
import os
import sys
from pathlib import Path

import dotenv

ROOT = Path(__file__).resolve().parent
for p in (str(ROOT),):
    if p not in sys.path:
        sys.path.insert(0, p)

dotenv.load_dotenv(ROOT / ".env.local")

from mistralai.workflows.client import Mistral

client = Mistral(api_key=os.environ["MISTRAL_API_KEY"])
input_ = {
    "company": "Omniesggo Demo Co",
    "statement": (
        "In 2024 we cut Scope 1&2 emissions 40% YoY, achieved 100% renewable "
        "electricity, launched a supplier code of conduct covering 95% of "
        "spend, board independence reached 75%, and we published our first "
        "diversity report. Scope 3 reporting is planned for 2026."
    ),
}
print("[trigger] executing esg-swarm on cloud orchestrator...")
result = client.workflows.execute_workflow_and_wait("esg-swarm", input_)
print("\n===== CLOUD EXECUTION RESULT =====")
print(result)
