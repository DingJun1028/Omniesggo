"""Agent primitive — 一個 durable LLM turn。

soul.md 裡 agent 是自治迴圈;在 Workflows 上就是一個 durable @activity。
agent_turn 即 5T 契約的程式化:

    Task in   -> (role_system, user_message)
    Tool call -> Mistral chat completion (side effect,隔離在此)
    Trace     -> 不更動外界,只回傳值
    Result    -> assistant 文本,記錄在 execution history

build_agent 綁定某 role 的 system prompt,讓 swarm 能以
`await environmental_analyst(state.task)` 呼叫具名 agent。
"""

import os

import mistralai.workflows as workflows
from mistralai.client.models import SystemMessage, UserMessage
from mistralai.workflows.client import Mistral


def _chat_client() -> Mistral:
    """以 workspace key 認證的 chat client。

    直接以 API key 認證 (等同 run_as=DEPLOYMENT),讓 activity 在本機與 cloud
    worker 都能跑,不需額外的 context 設定步。worker 啟動時需有 MISTRAL_API_KEY。
    """
    return Mistral(api_key=os.environ["MISTRAL_API_KEY"])


def _pick_model(client: Mistral) -> str:
    try:
        available = [m.id for m in client.models.list().data]
        if available:
            return available[0]
    except Exception:
        pass
    return "mistral-small-latest"


@workflows.activity()
async def agent_turn(role_system: str, user_message: str) -> str:
    """一個 agent turn:system+user -> assistant 文本。通用的 swarm cell。"""
    client = _chat_client()
    resp = await client.chat.complete_async(
        model=_pick_model(client),
        messages=[
            SystemMessage(content=role_system),
            UserMessage(content=user_message),
        ],
        temperature=0.3,
    )
    return resp.choices[0].message.content


def build_agent(role_name: str, role_system: str):
    """回傳綁定具名 role 的 durable @activity。

    必頇在模組 import 期呼叫 (不要在 workflow entrypoint 內),讓 activity 在任何
    execution 跑之前先註冊到 worker:

        environmental_analyst = build_agent("Environmental", ENV_SYSTEM)
        # ... 之後在 entrypoint 內:
        finding = await environmental_analyst(state.task)
    """

    @workflows.activity(name=f"swarm_{role_name}_turn")
    async def _role(user_message: str) -> str:
        return await agent_turn(role_system, user_message)

    _role.__name__ = f"{role_name}_agent"
    return _role
