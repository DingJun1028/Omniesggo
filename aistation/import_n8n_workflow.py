import sqlite3
import json
import uuid
from datetime import datetime

conn = sqlite3.connect("/home/ubuntu/.n8n/database.sqlite")
cursor = conn.cursor()

workflow_id = str(uuid.uuid4())
version_id = str(uuid.uuid4())

nodes = [{
    "parameters": {"pollTimes": {"item": [{"hour": 9, "minute": 0}]}},
    "id": str(uuid.uuid4()),
    "name": "Daily Trigger",
    "type": "n8n-nodes-base.cron",
    "typeVersion": 1,
    "position": [250, 300],
    "disabled": False
}, {
    "parameters": {
        "httpMethod": "POST",
        "url": "http://localhost:8000/api/jobs",
        "body": {
            "script": "【場景】萬能蜂群面對每日監控。【洞察】5T Protocol + keepalive。【方法】部署 VPS Monitor。【反思】體制勝於工具。",
            "title": "Daily Ops Report"
        }
    },
    "id": str(uuid.uuid4()),
    "name": "Submit Job",
    "type": "n8n-nodes-base.httpRequest",
    "typeVersion": 4.1,
    "position": [450, 300]
}, {
    "parameters": {
        "chatId": "6387287462",
        "text": "🎬 **Daily Video Ready!**\nTask: {{$json[\"title\"]}}\n5T: Verified"
    },
    "id": str(uuid.uuid4()),
    "name": "Telegram Alert",
    "type": "n8n-nodes-base.telegram",
    "typeVersion": 2,
    "position": [650, 300],
    "credentials": {"telegramApi": "telegram_bot_api"}
}]

nodes_json = json.dumps(nodes)
connections_json = json.dumps({
    "Daily Trigger": {"main": [[{"node": "Submit Job", "type": "main", "index": 0}]]},
    "Submit Job": {"main": [[{"node": "Telegram Alert", "type": "main", "index": 0}]]}
})
now = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")
empty_json = "{}"

cursor.execute("""
    INSERT INTO workflow_entity 
    (id, name, active, nodes, connections, settings, staticData, pinData, 
     versionId, triggerCount, meta, createdAt, updatedAt, isArchived, versionCounter, nodeGroups)
    VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, 0, 1, ?)
""", (workflow_id, "OA-Team Daily Video Production", nodes_json, connections_json, 
    empty_json, empty_json, empty_json, version_id, empty_json, now, now, "[]"))

conn.commit()
conn.close()

print(f"Workflow imported: {workflow_id}")
print(f"Name: OA-Team Daily Video Production")
print(f"Nodes: 3 (Daily Trigger, Submit Job, Telegram Alert)")
print(f"Status: Imported (inactive - activate via n8n UI)")
