"""
CrewAI 真實環境驗證 (對齊 crewAIInc/crewAI README Crews 模型)
- VERIFIED REAL: 2026-08-07 在 uv py3.13.14 venv (.venv-crewai, PYTHONPATH 清空避免 hermes 污染)
  實際執行成功 → import crewai 1.15.12 + Agent/Task/Crew 物件建構 OK
- 驗證: import crewai, Agent/Task/Crew 物件建構, Process.sequential
- 不跑 kickoff (需 LLM key, 本環境無 OPENAI_API_KEY) — 誠實標註
- 執行: env PYTHONPATH= .venv-crewai/Scripts/python.exe verify_crewai.py
"""
from crewai import Agent, Crew, Process, Task

# 對齊 README agents.yaml / tasks.yaml 的最小 Crews
researcher = Agent(
    role="ESG Data Researcher",
    goal="Uncover ESG compliance developments",
    backstory="Seasoned researcher for sustainable finance.",
    verbose=False,
)
analyst = Agent(
    role="ESG Reporting Analyst",
    goal="Create detailed ESG reports",
    backstory="Meticulous analyst turning data into clear reports.",
    verbose=False,
)

research_task = Task(
    description="Research latest ESG regulations in 2026",
    expected_output="10 bullet points of relevant ESG info",
    agent=researcher,
)
report_task = Task(
    description="Expand research into a full ESG report section",
    expected_output="Markdown report section",
    agent=analyst,
)

crew = Crew(
    agents=[researcher, analyst],
    tasks=[research_task, report_task],
    process=Process.sequential,
    verbose=False,
)

print("CREWAI_OBJECTS_OK")
print(f"  agents={len(crew.agents)} tasks={len(crew.tasks)} process={crew.process}")
# 注意: crew.kickoff() 需 LLM key, 此環境未注入 → 不執行 (誠實)
print("KICKOFF_SKIPPED: 需 OPENAI_API_KEY / 其他 LLM key")
