#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
esggo ↔ free-claude-code 整合 Python 輔助工具

用於 esggo 專案中調用 free-claude-code 的模型生成與多代理協作能力。

使用方式：
    # 狀態檢查
    from fcc_integration import FccClient
    client = FccClient()
    client.status()

    # 模型呼叫
    response = client.model_call("gpt-4o", "寫一段 Python 程式碼")

    # 代理呼叫
    result = client.agent_call("hermes", "分析 src/ 的程式碼結構")

Requirements:
    pip install requests
"""

import os
import re
import subprocess
import requests
from typing import Optional

# ─── 配置 ───────────────────────────────────────────────────────────────────

DEFAULT_SERVER_URL = os.environ.get(
    "FCC_SERVER_URL",
    "http://127.0.0.1:8082"
)

DEFAULT_CLI = os.environ.get(
    "FCC_CLI",
    os.path.expanduser("~/Project/esggo/free-claude-code/.venv/Scripts/fcc-server.exe")
)

DEFAULT_TOKEN = os.environ.get("FCC_PROXY_TOKEN", "")

# 解析順序：FCC_PROXY_TOKEN > ~/.fcc/.env 的 ANTHROPIC_AUTH_TOKEN > 'freecc'
def _resolve_token() -> str:
    if DEFAULT_TOKEN:
        return DEFAULT_TOKEN
    env_path = os.path.join(os.path.expanduser("~"), ".fcc", ".env")
    try:
        with open(env_path, "r", encoding="utf-8") as fh:
            m = re.search(r"^ANTHROPIC_AUTH_TOKEN=(.*)$", fh.read(), re.MULTILINE)
            if m and m.group(1).strip():
                return m.group(1).strip()
    except OSError:
        pass
    return "freecc"  # FCC Settings.proxy_auth_token 預設值


# ─── 客戶端 ─────────────────────────────────────────────────────────────────

class FccClient:
    """free-claude-code 客戶端"""

    def __init__(self, server_url: str = None, token: str = None):
        self.server_url = server_url or DEFAULT_SERVER_URL
        self.base_url = f"{self.server_url.rstrip('/')}"
        self.token = token or _resolve_token()

    @property
    def headers(self) -> dict:
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
        }

    def health_check(self) -> bool:
        """檢查 free-claude-code 是否可連線"""
        try:
            resp = requests.get(f"{self.base_url}/health", timeout=5)
            return resp.status_code == 200
        except requests.RequestException:
            return False

    def list_models(self) -> list:
        """列出可用模型"""
        try:
            resp = requests.get(f"{self.base_url}/v1/models", headers=self.headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            return data.get("data", [])
        except Exception as e:
            print(f"⚠️  列出模型失敗: {e}")
            return []

    def model_call(
        self,
        model: str,
        prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.7
    ) -> str:
        """
        向模型發送請求並取得回應

        FCC 提供 Anthropic Messages 相容端點 /v1/messages（非 OpenAI /v1/chat/completions）。

        Returns:
            模型回應的內容字串
        """
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            resp = requests.post(
                f"{self.base_url}/v1/messages",
                json=payload,
                headers={**self.headers, "anthropic-version": "2023-06-01"},
                timeout=300  # 5 分鐘超時
            )
            resp.raise_for_status()
            data = resp.json()
            blocks = data.get("content") or []
            return "".join(b.get("text", "") for b in blocks if b.get("type") == "text")
        except Exception as e:
            return f"❌ 模型呼叫失敗: {e}"

    def agent_call(self, agent: str, task: str) -> str:
        """
        調用多代理協作能力（透過 FCC 的 Anthropic Messages 端點）

        agent: claude, codex, hermes, opencode, gemini-cli, kimi-cli
        """
        try:
            resp = requests.post(
                f"{self.base_url}/v1/messages",
                json={
                    "model": os.environ.get("FCC_AGENT_MODEL", "claude-sonnet-4-20250514"),
                    "max_tokens": 4096,
                    "messages": [{"role": "user", "content": task}],
                },
                headers={**self.headers, "anthropic-version": "2023-06-01"},
                timeout=600,
            )
            resp.raise_for_status()
            blocks = resp.json().get("content") or []
            return "".join(b.get("text", "") for b in blocks if b.get("type") == "text") or "無結果"
        except Exception as e:
            return f"❌ 代理呼叫失敗: {e}"


# ─── 小工具 ─────────────────────────────────────────────────────────────────

def check_status() -> None:
    """顯示 free-claude-code 連線狀態"""
    client = FccClient()
    if client.health_check():
        print("✅ free-claude-code 已連線")
        print(f"   服務位址: {client.base_url}")
        models = client.list_models()
        if models:
            print(f"   可用模型 ({len(models)} 個):")
            for m in models[:10]:
                print(f"     - {m.get('id', 'unknown')}")
            if len(models) > 10:
                print(f"     ... 還有 {len(models) - 10} 個")
    else:
        print("❌ free-claude-code 未執行")
        print("   請先啟動: cd free-claude-code && uv run fcc-server")


def generate_code(prompt: str, model: str = "claude-sonnet-4") -> str:
    """生成程式碼"""
    client = FccClient()
    if not client.health_check():
        return "❌ free-claude-code 未執行"
    return client.model_call(model, prompt)


def dispatch_agent(agent: str, task: str) -> str:
    """派遣代理執行任務"""
    client = FccClient()
    if not client.health_check():
        return "❌ free-claude-code 未執行"
    return client.agent_call(agent, task)


# ─── 入口 ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print(__doc__)
        print("\n可用命令:")
        print("  python fcc_integration.py status")
        print("  python fcc_integration.py model <模型名> '<提示詞>'")
        print("  python fcc_integration.py agent <代理名> '<任務>'")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "status":
        check_status()
    elif cmd == "model":
        if len(sys.argv) < 4:
            print("用法: python fcc_integration.py model <模型名> '<提示詞>'")
            sys.exit(1)
        model = sys.argv[2]
        prompt = sys.argv[3]
        print(generate_code(prompt, model))
    elif cmd == "agent":
        if len(sys.argv) < 4:
            print("用法: python fcc_integration.py agent <代理名> '<任務>'")
            sys.exit(1)
        agent = sys.argv[2]
        task = sys.argv[3]
        print(dispatch_agent(agent, task))
    else:
        print(f"未知命令: {cmd}")
        print("可用命令: status, model, agent")
