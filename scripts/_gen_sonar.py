import re

raw = r'''<page><content>
### SonarQube MCP Server
Interact with SonarQube Cloud, Server and Community build over the web API. Analyze code to identify quality and security issues.
[What is an MCP Server?](https://www.anthropic.com/news/model-context-protocol)
### MCP Info
| Attribute | Details |
| --- | --- |
| **Docker Image** | mcp/sonarqube |
| **Author** | SonarSource |
| **Repository** | https://github.com/SonarSource/sonarqube-mcp-server |
### Image Building Info
| Attribute | Details |
| --- | --- |
| **Dockerfile** | https://github.com/SonarSource/sonarqube-mcp-server/blob/9721d0408bfe72709e28fa0b303b7b5b4ca8446f/Dockerfile |
| **Commit** | `9721d0408bfe72709e28fa0b303b7b5b4ca8446f` |
| **Docker Image built by** | Docker Inc. |
| **Verify Signature** | `COSIGN_REPOSITORY=mcp/signatures cosign verify mcp/sonarqube --key https://raw.githubusercontent.com/docker/keyring/refs/heads/main/public/mcp/latest.pub` |
| **Licence** | Other |
### Available Tools (25)
| Tool | Short Description |
| --- | --- |
| `analyze_code_snippet` | Analyze a file or code snippet with SonarQube analyzers |
| `analyze_file_list` | Analyze files in the current working directory using SonarQube for IDE |
| `toggle_automatic_analysis` | Enable or disable SonarQube for IDE automatic analysis |
| `search_sonar_issues_in_projects` | Search for SonarQube issues in my organization's projects |
| `change_sonar_issue_status` | Change the status of a SonarQube issue |
| `search_my_sonarqube_projects` | Find SonarQube projects |
| `list_quality_gates` | List all quality gates in my SonarQube |
| `get_project_quality_gate_status` | Get the quality gate status for a project |
| `show_rule` | Shows detailed information about a SonarQube rule |
| `list_rule_repositories` | List rule repositories available in SonarQube |
| `list_languages` | List all programming languages supported |
| `get_component_measures` | Get SonarQube measures for a project |
| `search_metrics` | Search for SonarQube metrics |
| `get_raw_source` | Get source code as raw text from SonarQube |
| `get_scm_info` | Get SCM information of SonarQube source files |
| `get_system_health` | Get the health status (GREEN/YELLOW/RED) |
| `get_system_status` | Get state information about SonarQube Server |
| `get_system_logs` | Get system logs in plain-text format |
| `ping_system` | Ping the system, returns 'pong' |
| `get_system_info` | Get detailed system configuration |
| `create_webhook` | Create a new webhook |
| `list_webhooks` | List all webhooks |
| `list_portfolios` | List portfolios with filtering and pagination |
| `list_enterprises` | List enterprises available in SonarQube Cloud |
| `search_dependency_risks` | Search for SCA issues (dependency risks) |
### Use this MCP Server
```json
{
  "mcpServers": {
    "sonarqube": {
      "command": "docker",
      "args": ["run","-i","--rm","-e","SONARQUBE_URL","-e","SONARQUBE_ORG","-e","SONARQUBE_TOKEN","mcp/sonarqube"],
      "env": {
        "SONARQUBE_URL": "https://my-sonarqube.com",
        "SONARQUBE_ORG": "my-org",
        "SONARQUBE_TOKEN": "YOUR_SONARQUBE_USER_TOKEN"
      }
    }
  }
}
```
來源: https://hub.docker.com/mcp/server/sonarqube/overview
</content></page>'''

m = re.search(r'<content>(.*?)</content>', raw, re.S)
content = m.group(1)
content = re.sub(r'<[^>]+>', '', content)
content = content.replace('\\n','\n').replace('\\"','"').strip()
content = re.sub(r'\n{3,}','\n\n',content)

md = f"""---
title: SonarQube MCP Server | Docker MCP Catalog
source: Notion
notion_id: 1e2f6a7c-f61d-4f56-adf0-29fba5bf3b53
tags: [SonarQube, MCP, Docker, 程式碼品質]
---

# SonarQube MCP Server | Docker MCP Catalog

{content}
"""
open(r"C:/Users/dingj/iCloudDrive/iCloud~md~obsidian/DingJun/Notion_Import/SonarQube MCP Server.md","w",encoding="utf-8").write(md)
print("WRITTEN", len(md))
