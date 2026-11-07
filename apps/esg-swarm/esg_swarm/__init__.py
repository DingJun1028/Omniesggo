"""Omniesggo ESG-GO swarm on Mistral Workflows.

每個 swarm agent 只是一個 durable @activity（一次 LLM/tool turn）。30-agent
swarm 由 @workflow.define 編排,以 SwarmState 黑板在 agent 間傳遞 — soul.md
中記憶體式 agent hand-off 的 durable、可續跑版本。

概念對照 soul.md:
    萬能十二大架構  -> 頂層 workflow 編排圖 (见 esg_swarm.workflow)
    5T protocol    -> 每個 agent 的契約: Task in / Tool call / Trace / Result out
    結界六柱       -> 綜合前的治理審查關卡 (EsgSwarmWorkflow 的 review gate)

擴展到 30 個 agent:在 workflow.py 加更多 build_agent(...) role 並串接/平行展開,
durable 機制 (state hand-off / retry / crash-resume) 不變。
"""

from .state import SwarmState
from .agent import agent_turn, build_agent

__all__ = ["SwarmState", "agent_turn", "build_agent"]
