"""SwarmState — 穿越每個 agent 的 shared blackboard。

等同 soul.md swarm 在 agent 間傳遞的 shared bus / blackboard,但序列進 workflow
的 durable event history:swarm 跑到一半崩潰,可帶著先前每個 agent 的輸出續跑。
"""

from pydantic import BaseModel, Field


class SwarmState(BaseModel):
    task: str
    company: str = ""
    findings: dict[str, str] = Field(default_factory=dict)  # role_name -> 該 agent 輸出
    trace: list[str] = Field(default_factory=list)          # 編排累積的稽核軌跡
    verdict: str = ""
