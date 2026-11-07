"""Omniesggo CI monitor — Mistral AI Studio workflow.

收錄 PR #142 main push 覆核所涵蓋的 12 個 CI workflow：查詢 GitHub Actions API，
回報每個 tracked workflow 之最新 run 狀態與整體全綠判定。

唯讀、零外部依賴（stdlib urllib）。可選 GITHUB_TOKEN 環境變數（部署 secret 綁定）
提高 API 額度；無 token 時走匿名額度。
"""

from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from typing import Any, Optional

from pydantic import BaseModel, Field

import mistralai.workflows as workflows

OWNER = "DingJun1028"
REPO = "Omniesggo"

# PR #142 main push（85a4ff0）覆核確認的 12 個 workflow。
MAIN_PUSH_WORKFLOWS = [
    "ESG-GO CI/CD Pipeline",
    "🌌 ESG GO Sacred Pipeline (CI/CD)",
    "5T OmniCore Hyper-Awakened CI/CD Gatekeeper",
    "TS Matrix 雙向驗證閘 (esggo)",
    "test",
    "SonarCloud Quality Gate",
    "Schema Traceability",
    "learning-center-ci",
    "deploy-ghcr",
    "Build & publish AI Station image",
    "Deploy to Cloudflare",
    "Deploy to Oracle VPS",
]

GREEN_CONCLUSIONS = ("success", "skipped")


class CiMonitorInput(BaseModel):
    branch: str = "main"
    sha: Optional[str] = None
    owner: str = OWNER
    repo: str = REPO
    workflows: "list[str]" = Field(default_factory=lambda: list(MAIN_PUSH_WORKFLOWS))


class WorkflowStatus(BaseModel):
    name: str
    status: Optional[str] = None
    conclusion: Optional[str] = None
    run_number: Optional[int] = None
    run_url: Optional[str] = None
    head_sha: Optional[str] = None
    created_at: Optional[str] = None


class CiMonitorResult(BaseModel):
    branch: str
    sha: Optional[str] = None
    all_green: bool
    checked: int
    statuses: "list[WorkflowStatus]"


def _github_get(url: str) -> Any:
    token = os.environ.get("GITHUB_TOKEN")
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "omniesggo-ci-monitor",
    }
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


@workflows.activity()
async def fetch_workflow_statuses(
    owner: str, repo: str, branch: str, sha: Optional[str], workflow_names: "list[str]"
) -> "list[dict]":
    """Fetch the latest run of each tracked workflow from the GitHub Actions API."""
    wanted = list(dict.fromkeys(workflow_names))
    latest: "dict[str, dict]" = {}
    page = 1
    while page <= 5 and len(latest) < len(wanted):
        params: "dict[str, str]" = {"per_page": "100", "page": str(page)}
        if sha:
            params["head_sha"] = sha
        else:
            params["branch"] = branch
        url = (
            "https://api.github.com/repos/" + owner + "/" + repo + "/actions/runs?"
            + urllib.parse.urlencode(params)
        )
        data = _github_get(url)
        runs = data.get("workflow_runs", [])
        if not runs:
            break
        for run in runs:
            name = run.get("name", "")
            if name in wanted and name not in latest:
                latest[name] = {
                    "name": name,
                    "status": run.get("status"),
                    "conclusion": run.get("conclusion"),
                    "run_number": run.get("run_number"),
                    "run_url": run.get("html_url"),
                    "head_sha": run.get("head_sha"),
                    "created_at": run.get("created_at"),
                }
        page += 1
    return [latest.get(name, {"name": name}) for name in wanted]


@workflows.workflow.define(
    name="omniesggo-ci-monitor",
    workflow_display_name="Omniesggo CI Monitor",
    workflow_description=(
        "Tracks the 12 main-push CI workflows of DingJun1028/Omniesggo "
        "(ESG-GO Pipeline, Sacred Pipeline, 5T Gatekeeper, TS Matrix, test, "
        "SonarCloud Quality Gate, Schema Traceability, learning-center-ci, "
        "deploy-ghcr, AI Station image, Cloudflare, Oracle VPS) and reports "
        "whether their latest runs are green."
    ),
)
class OmniesggoCiMonitorWorkflow:
    @workflows.workflow.entrypoint
    async def run(self, input: CiMonitorInput) -> CiMonitorResult:
        raw = await fetch_workflow_statuses(
            input.owner, input.repo, input.branch, input.sha, input.workflows
        )
        statuses = [WorkflowStatus(**item) for item in raw]
        completed = [s for s in statuses if s.status == "completed"]
        all_green = len(completed) == len(statuses) and all(
            s.conclusion in GREEN_CONCLUSIONS for s in completed
        )
        return CiMonitorResult(
            branch=input.branch,
            sha=input.sha,
            all_green=all_green,
            checked=len(statuses),
            statuses=statuses,
        )