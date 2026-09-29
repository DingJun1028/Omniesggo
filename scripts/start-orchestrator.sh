#!/usr/bin/env bash
set -euo pipefail

# 1. 切換至 orchestrator profile
hermes profile use orchestrator

# 2. 啟動 Gateway（Telegram/Discord 等即時平台）
if ! hermes -p orchestrator gateway status | grep -q "running"; then
  echo "▶️ 啟動 gateway..."
  hermes -p orchestrator gateway start
fi

# 3. 初始化 Kanban 看板（如果尚未建立）
if ! hermes -p orchestrator kanban list --board main >/dev/null 2>&1; then
  echo "▶️ 初始化 Kanban 看板..."
  hermes -p orchestrator kanban init
fi

# 4. 恢復所有已暫停的 Cron 工作
echo "▶️ 恢復已暫停的 Cron 工作..."
hermes -p orchestrator cron list --all | awk '/paused/ {print $1}' | while read -r job_id; do
  hermes -p orchestrator cron resume "$job_id" || true
done

# 5. 顯示完成訊息
echo "✅ Orchestrator 已完成啟動與復原，現在可使用 /kanban、/cron、/delegate_task 等指令。"
# Start OmniAgentBus in background
# 指向正典實作 .js：先前台為 .ts（型別重導出薄層）時，require.main 會是該 .ts，
# .js 內的 `require.main === module` 守衛不會觸發，autonomy 心跳不會啟動。
node lib/agents/omni-agent-bus.js &
