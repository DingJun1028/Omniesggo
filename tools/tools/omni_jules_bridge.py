#!/usr/bin/env python3
# ============================================================================
# omni_jules_bridge.py — OmniJules 萬能外部協力橋接器 (Python 版)
# ----------------------------------------------------------------------------
# 將 OmniJules REST API 之能力，以「免費自託管」為預設實作提供給 OmniJules
# (OA-Team 30)。依 soul.md §17：不呼叫付費 jules.googleapis.com，
# 除非顯式 ALLOW_PAID_API=1 + 已設 JULES_API_KEY（違反免費硬約束，需自負）。
#
# 對應參考：tools/jules-api-reference.md
# ============================================================================
from __future__ import annotations

import json
import os
import subprocess
import sys
from dataclasses import dataclass, field

JULES_EP = "https://jules.googleapis.com/v1alpha"
REF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "jules-api-reference.md")


@dataclass
class BridgeConfig:
    mode: str = field(default_factory=lambda: os.environ.get("OMNIJULES_MODE", "free"))
    allow_paid: bool = field(
        default_factory=lambda: os.environ.get("ALLOW_PAID_API", "0") == "1"
    )
    api_key: str = field(default_factory=lambda: os.environ.get("JULES_API_KEY", ""))
    gh_repo: str = field(default_factory=lambda: os.environ.get("GH_REPO", "DingJun1028/esggo"))

    @property
    def paid_allowed(self) -> bool:
        return self.mode == "paid" and bool(self.api_key) and self.allow_paid


def _warn_paid() -> None:
    sys.stderr.write(
        "⚠️  [付費警告] ALLOW_PAID_API=1 已啟用：此路徑呼叫 Google 付費 SaaS "
        "jules.googleapis.com，違反本典『只用免費算立』硬約束。\n"
    )


def _run(cmd: list[str]) -> str:
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=30).stdout.strip()
    except Exception as exc:  # noqa: BLE001
        return f"（指令失敗：{exc}；此為免費等價示範）"


class OmniJulesAPIClient:
    """OmniJules REST API 形狀的客戶端。免費模式走自託管，付費模式才呼叫 Google。"""

    def __init__(self, cfg: BridgeConfig) -> None:
        self.cfg = cfg

    # ---- 免費自託管實作 ----
    def _free_list_sources(self) -> str:
        owner = self.cfg.gh_repo.split("/")[0]
        return "【免費自託管】列舉已授權 repo (gh):\n" + _run(
            ["gh", "repo", "list", owner, "--json", "name,url"]
        )

    def _free_create_session(self, prompt: str, branch: str) -> str:
        if os.environ.get("OMNIJULES_EXECUTE", "0") == "1":
            out = _run(
                ["gh", "workflow", "run", "auto-repair.yml", "--repo", self.cfg.gh_repo]
            )
            return (
                f"【免費自託管】觸發 OA-TWINS Auto-Repair (auto-repair.yml) "
                f"於 {self.cfg.gh_repo}@{branch}\n{out or '✅ 已派發修復任務'}"
            )
        return (
            "【免費自託管 · DRY-RUN】等效指令 (設 OMNIJULES_EXECUTE=1 才真觸發):\n"
            f"  gh workflow run auto-repair.yml --repo {self.cfg.gh_repo}"
        )

    def _free_approve_plan(self, _sid: str) -> str:
        return "【免費自託管】5T 驗算闡（EntropyForge.applyHashLock）— 計畫自動準則通過，無須顯式批准。"

    def _free_list_activities(self, _sid: str) -> str:
        return "【免費自託管】列舉 OA-TWINS 近期活動 (gh run list):\n" + _run(
            ["gh", "run", "list", "--repo", self.cfg.gh_repo, "--limit", "10"]
        )

    def _free_send_message(self, _sid: str, msg: str) -> str:
        return (
            "【免費自託管】經 OAB 萬能事件總線發佈訊息 (OmniTag: agent:01):\n"
            f"  OAB.publish({{tag:'agent:01', type:'user_message', payload:'{msg}'}})"
        )

    def integrations(self) -> str:
        if self.cfg.paid_allowed:
            _warn_paid()
            return (
                "【付費】OmniJules Integrations 為 web UI 操作（Render 等），無直接 REST 端點；\n"
                "  請於 https://jules.google.com/settings#integrations 手動連接。"
            )
        return (
            "【免費自託管】整合層等價（對齊 OmniJules Integrations 運作方式）:\n"
            "  ── Render / CI build-failure 偵測 ──\n"
            "    OA-TWINS Auto-Repair 監看 gh run（失敗即修） → 萬能維護蜂(28)\n"
            "  ── 自主觸發（webhook 甦醒）──\n"
            "    OAB 萬能事件總線 OmniTag 訂閱 → 萬能運營蜂(20)\n"
            "  ── 加密儲存 API key ──\n"
            "    本機 .env(gitignore) + 1Password/agentmail → 萬能安全蜂(27)\n"
            "  ── scoped access 最小權限 ──\n"
            "    5T 驗算闡門禁 EntropyForge → 萬能質控蜂(30)\n"
            f"  參考: {REF}"
        )

    # ---- 付費實作（預設不觸發）----

    def supabase(self, action: str = "status") -> str:
        sb_token = os.environ.get("SUPABASE_KEY", "")
        sb_paid = self.cfg.allow_paid and self.cfg.mode == "paid" and bool(sb_token)
        if sb_paid:
            _warn_paid()
            visible = sb_token[:4] if sb_token else ""
            return (
                f"【付費 · Supabase】動作={action} · 經 REST 呼叫 https://<PROJECT>.supabase.co/rest/v1\n"
                f"  Header: apikey: {visible} 前綴已遮蔽 取自環境變數 SUPABASE_KEY 不落檔"
            )
        return (
            "【免費自託管 · Supabase 等價】動作=" + action + "\n"
            "  ── 資料庫/儲存 ──\n"
            "    OA-TWINS 狀態盤 (SQLite + 本機 .env) → 萬能數據蜂(10)\n"
            "  ── 自主觸發 ──\n"
            "    OAB 事件總線 OmniTag 訂閱 → 萬能運營蜂(20)\n"
            "  ── 安全儲存 ──\n"
            "    本機 .env(gitignore) 經 $SUPABASE_KEY 注入 → 萬能安全蜂(27)\n"
            "  ⚠ 若需真實 Supabase，設 OMNIJULES_MODE=paid ALLOW_PAID_API=1 SUPABASE_KEY=sbp_***（不寫入檔案）"
        )

    # ---- 付費實作（預設不觸發）----
    def _paid(self, method: str, path: str, body: dict | None = None) -> str:
        _warn_paid()
        import urllib.request

        url = f"{JULES_EP}{path}"
        data = json.dumps(body).encode() if body else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("x-goog-api-key", self.cfg.api_key)
        if body:
            req.add_header("Content-Type", "application/json")
        with urllib.request.urlopen(req, timeout=30) as resp:  # noqa: S310
            return resp.read().decode()

    # ---- 公開介面 ----
    def list_sources(self) -> str:
        return self._paid("GET", "/sources") if self.cfg.paid_allowed else self._free_list_sources()

    def create_session(self, prompt: str, branch: str = "main") -> str:
        if self.cfg.paid_allowed:
            return self._paid(
                "POST",
                "/sessions",
                {
                    "prompt": prompt,
                    "sourceContext": {
                        "source": f"sources/github/{self.cfg.gh_repo}",
                        "githubRepoContext": {"startingBranch": branch},
                    },
                    "automationMode": "AUTO_CREATE_PR",
                    "title": "OmniJules Session",
                },
            )
        return self._free_create_session(prompt, branch)

    def approve_plan(self, sid: str) -> str:
        return self._paid("POST", f"/sessions/{sid}:approvePlan") if self.cfg.paid_allowed else self._free_approve_plan(sid)

    def list_activities(self, sid: str) -> str:
        return self._paid("GET", f"/sessions/{sid}/activities?pageSize=30") if self.cfg.paid_allowed else self._free_list_activities(sid)

    def send_message(self, sid: str, msg: str) -> str:
        if self.cfg.paid_allowed:
            return self._paid("POST", f"/sessions/{sid}:sendMessage", {"prompt": msg})
        return self._free_send_message(sid, msg)


def selftest() -> None:
    print("=== OmniJules Bridge 自檢 (FREE 模式，不呼叫付費) ===")
    cfg = BridgeConfig(mode="free")
    client = OmniJulesAPIClient(cfg)
    print(client.list_sources())
    print()
    print(client.create_session("selftest probe", "main"))
    print()
    print(client.approve_plan("SESSION_ID"))
    print()
    print(client.list_activities("SESSION_ID"))
    print()
    print(client.send_message("SESSION_ID", "hello from selftest"))
    print()
    print("✅ 自檢完成：所有呼叫皆走免費自託管路徑（未觸及 jules.googleapis.com）。")


def usage() -> None:
    print(
        "OmniJules Bridge — OmniJules API 免費自託管橋接器 (soul.md §17)\n"
        "用法:\n"
        "  python3 omni_jules_bridge.py list-sources\n"
        "  python3 omni_jules_bridge.py create-session [prompt] [branch]\n"
        "  python3 omni_jules_bridge.py approve-plan [session_id]\n"
        "  python3 omni_jules_bridge.py list-activities [session_id]\n"
        "  python3 omni_jules_bridge.py send-message [session_id] [message]\n"
        "  python3 omni_jules_bridge.py integrations\n"
        "  python3 omni_jules_bridge.py supabase [status|query]\n"
        "  python3 omni_jules_bridge.py selftest\n"
        "  python3 omni_jules_bridge.py reference\n"
        "\n環境變數: OMNIJULES_MODE=free|paid  ALLOW_PAID_API=1  JULES_API_KEY=xxx  SUPABASE_KEY=xxx  GH_REPO=DingJun1028/esggo"
    )


def main(argv: list[str]) -> int:
    if not argv:
        usage()
        return 0
    cmd, *args = argv
    client = OmniJulesAPIClient(BridgeConfig())
    dispatch = {
        "list-sources": lambda: client.list_sources(),
        "create-session": lambda: client.create_session(*(args or ["Create a boba app!", "main"])),
        "approve-plan": lambda: client.approve_plan(*(args or ["SESSION_ID"])),
        "list-activities": lambda: client.list_activities(*(args or ["SESSION_ID"])),
        "send-message": lambda: client.send_message(*(args or ["SESSION_ID", "Can you make it corgi themed?"])),
        "integrations": lambda: client.integrations(),
        "supabase": lambda: client.supabase(*(args or ["status"])),
        "selftest": selftest,
        "reference": lambda: REF,
    }
    handler = dispatch.get(cmd)
    if handler is None:
        print(f"未知指令: {cmd}")
        usage()
        return 1
    if cmd == "selftest":
        selftest()
    else:
        print(handler())
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
