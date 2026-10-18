#!/usr/bin/env python3
"""
OA-Team 30 萬能蜂群 — CrewAI JSON-first + Flow 入口
對應 soul.md 的「30 Souls Matrix」與「萬有引力協作協定」。

模式 (依 CrewAI Quickstart 推薦):
  - crew.jsonc + agents/*.jsonc (JSON-first)
  - load_crew() 載入 (無需手寫 Agent/Task class)
  - Flow 擁有 state + execution order，crew 在 step 內執行

用法:
  python main.py "為 ESG-GO 產出一個 5T 合規的元件骨架"
"""
import os
import sys
from pathlib import Path

from crewai import Crew, Process
from crewai.project import load_crew
from pydantic import BaseModel


class SwarmState(BaseModel):
    task: str = ""
    result: str = ""


def kickoff():
    # 載入 crew 定義
    crew, default_inputs = load_crew(Path(__file__).with_name("crew.jsonc"))

    # 取得任務
    task_desc = sys.argv[1] if len(sys.argv) > 1 else "為 ESG-GO 產出一個 5T 合規的元件骨架"
    SwarmState(task=task_desc, result="")

    print("🐝 OA-Team 30 萬能蜂群啟動")
    print(f"   任務: {task_desc}")
    print(f"   靈魂核心: Hermes Agent / Celestial Command")
    print(f"   狀態機: 可自理 / 可協作 / 可演化 / 可溯源 / 不可篡改")

    inputs = {**default_inputs, "task": task_desc}
    print(f"   任務輸入: {inputs}")

    result = crew.kickoff(inputs=inputs)
    SwarmState(result=result.raw)

    print("\n" + "=" * 60)
    print("✅ 萬能蜂群執行完成")
    print(f"📄 結果: {result.raw[:200]}..." if len(result.raw) > 200 else f"📄 結果: {result.raw}")
    print("=" * 60)

    return result


if __name__ == "__main__":
    kickoff()
