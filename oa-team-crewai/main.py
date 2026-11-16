#!/usr/bin/env python3
"""
OA-Team 30 萬能蜂群 — CrewAI JSON-first + Flow 入口
對應 soul.md 的「30 Souls Matrix」與「萬有引力協作協定」。

模式 (依 CrewAI Quickstart 推薦):
  - crew.jsonc + agents/*.jsonc (JSON-first)
  - load_crew() 載入 (無需手寫 Agent/Task class)
  - Flow 擁有 state + execution order，crew 在 step 內執行

協作流程 (三步極簡工作流):
  1. 本質提純 (Extract)  → 智庫聖所 (01-06)
  2. 蜂群協同 (Dispatch) → 符文契約(07-12) + 光之羽翼(13-18) + 煉金熵減(19-24)
  3. 5T 驗算 (Verify)    → 5T 驗算小隊 (25-30)

用法:
  python main.py "為 ESG-GO 產出一個 5T 合規的元件骨架"
  python main.py --check  # 載入設定，不執行 kickoff
"""
import os
import sys
from pathlib import Path

from crewai.flow import Flow, listen, start
from crewai.project import load_crew
from pydantic import BaseModel


class SwarmState(BaseModel):
    task: str = ""
    result: str = ""


class OATeamFlow(Flow[SwarmState]):
    @start()
    def prepare_task(self, crewai_trigger_payload: dict | None = None):
        if crewai_trigger_payload:
            self.state.task = crewai_trigger_payload.get("task", "ESG-GO 5T 元件骨架")
        else:
            self.state.task = sys.argv[1] if len(sys.argv) > 1 else "為 ESG-GO 產出一個 5T 合規的元件骨架"
        print("🐝 OA-Team 30 萬能蜂群啟動")
        print(f"   任務: {self.state.task}")
        print(f"   靈魂核心: Hermes Agent / Celestial Command")
        print(f"   狀態機: 可自理 / 可協作 / 可演化 / 可溯源 / 不可篡改")

    @listen(prepare_task)
    def run_swarm(self):
        crew, default_inputs = load_crew(Path(__file__).with_name("crew.jsonc"))
        result = crew.kickoff(inputs={**default_inputs, "task": self.state.task})
        self.state.result = result.raw
        return result


def check_config():
    """Construct the configured crew without calling any LLM or starting the Flow."""
    crew, default_inputs = load_crew(Path(__file__).with_name("crew.jsonc"))
    if len(crew.agents) != 30 or len(crew.tasks) != 5:
        raise ValueError("Expected the configured 30 agents and 5 tasks")
    if not isinstance(default_inputs, dict):
        raise TypeError("load_crew must return default inputs as a dictionary")
    print(f"Config smoke passed: {len(crew.agents)} agents, {len(crew.tasks)} tasks; no kickoff")


def kickoff():
    OATeamFlow().kickoff()


def plot():
    OATeamFlow().plot()


if __name__ == "__main__":
    if sys.argv[1:] == ["--check"]:
        check_config()
    else:
        kickoff()
