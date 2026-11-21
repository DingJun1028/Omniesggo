"""ESG-GO swarm workflow — 30-agent 模式,以 4 個 role 驗證。

編排圖 (萬能十二大架構):
    1. Fan-out   : Environmental / Social / Governance 分析師「平行」執行 —
                   各為一個 durable @activity (一次 LLM turn)。
    2. Hand-off  : 各 findings 收進 shared SwarmState 黑板 (序列進 execution history)。
    3. Review    : 結界六柱關卡 — 三個 pillar finding 齊全前,主審不得綜合。
    4. Synthesis : 主審產出最終 ESG 報告。

擴展到 30 個 agent:在下方加更多 build_agent(...) role 並串接/平行展開即可,
durable 機制不變。
"""

import asyncio
import json

import mistralai.workflows as workflows
from pydantic import BaseModel

from .agent import build_agent
from .state import SwarmState


class EsgReportInput(BaseModel):
    company: str = "Acme Corp"
    statement: str = (
        "In 2024 we cut Scope 1&2 emissions 35% YoY, launched a supplier "
        "code of conduct covering 90% of spend, and board independence rose "
        "to 70%. We did not report Scope 3 emissions."
    )


# ---- role 定義 (swarm 的 agents) -------------------------------------------
ENV_SYSTEM = (
    "You are Acme Corp's Environmental ESG analyst. Assess the statement for "
    "emissions, energy, waste and climate risk. Return a tight paragraph with "
    "a 0-100 environmental score at the end, prefixed 'ENV_SCORE: <n>'."
)
SOC_SYSTEM = (
    "You are Acme Corp's Social ESG analyst. Assess labour, community, "
    "diversity and supply-chain human rights. Return a tight paragraph with a "
    "0-100 social score at the end, prefixed 'SOC_SCORE: <n>'."
)
GOV_SYSTEM = (
    "You are Acme Corp's Governance ESG analyst. Assess board independence, "
    "ethics, transparency and executive pay. Return a tight paragraph with a "
    "0-100 governance score at the end, prefixed 'GOV_SCORE: <n>'."
)
AUDIT_SYSTEM = (
    "You are the Lead ESG Auditor. Given the three pillar findings, produce "
    "the final board-ready ESG report for the company: an overall score "
    "(average of the three pillars), key strengths, key risks, and a one-line "
    "verdict. Format with clear headings."
)

# Roles 在 import 期註冊為 durable activities (build_agent 必頇在 module load
# 時呼叫 — 這裡正是)。
environmental_analyst = build_agent("Environmental", ENV_SYSTEM)
social_analyst = build_agent("Social", SOC_SYSTEM)
governance_analyst = build_agent("Governance", GOV_SYSTEM)
lead_auditor = build_agent("LeadAuditor", AUDIT_SYSTEM)


@workflows.workflow.define(
    name="esg-swarm",
    workflow_display_name="ESG-GO Swarm",
    workflow_description="Parallel pillar analysis + lead-auditor synthesis for ESG-GO.",
)
class EsgSwarmWorkflow:
    @workflows.workflow.entrypoint
    async def run(self, input: EsgReportInput) -> SwarmState:
        state = SwarmState(task="ESG assessment", company=input.company)

        # 1. Fan-out:三個 pillar 分析師平行 (durable 並發)。
        env, soc, gov = await asyncio.gather(
            environmental_analyst(input.statement),
            social_analyst(input.statement),
            governance_analyst(input.statement),
        )

        # 2. Hand-off:收進 shared blackboard。
        findings = {"Environmental": env, "Social": soc, "Governance": gov}
        state.findings.update(findings)
        state.trace.append("pillar analysis complete")

        # 3. 結界六柱 review gate:三 pillar 齊全才綜合。
        assert set(findings) == {"Environmental", "Social", "Governance"}

        # 4. Synthesis:主審寫最終報告。
        report = await lead_auditor(
            f"Company: {input.company}\n\nPillar findings:\n"
            + json.dumps(findings, ensure_ascii=False, indent=2)
        )
        state.verdict = report
        state.trace.append("synthesis complete")
        return state
