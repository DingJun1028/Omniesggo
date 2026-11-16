#!/usr/bin/env bash
set -euo pipefail

echo "🚀 啟動完整自動化系統..."

# 1. 確保 gateway 運行（Dispatcher 需要）
echo "📡 檢查 Gateway 狀態..."
if ! hermes -p orchestrator gateway status 2>/dev/null | grep -q "running"; then
    echo "   啟動 Gateway..."
    hermes -p orchestrator gateway start
    sleep 3
else
    echo "   ✅ Gateway 已運行"
fi

# 2. 切換到 orchestrator profile
echo "🎯 切換到 orchestrator profile..."
hermes profile use orchestrator

# 3. 驗證 Kanban board 存在
echo "📋 驗證 Kanban board..."
if ! hermes -p orchestrator kanban list --board main >/dev/null 2>&1; then
    echo "   初始化 Kanban board..."
    hermes -p orchestrator kanban init
fi

# 4. 啟用所有 cron 排程
echo "⏰ 啟用所有 Cron 排程..."
hermes -p orchestrator cron list --all | grep -E "(dispatcher-tick|curator-evolution|health-check|stuck-worker-watchdog)" | while read -r line; do
    job_id=$(echo "$line" | awk '{print $1}' | sed 's/\[.*\]//' | xargs)
    if [[ -n "$job_id" ]]; then
        hermes -p orchestrator cron resume "$job_id" 2>/dev/null || true
        echo "   ✅ 已啟用: $job_id"
    fi
done

# 5. 立即跑一次 dispatcher tick（啟動立即處理積壓）
echo "🎬 立即執行一次 Dispatcher tick..."
hermes -p orchestrator cron run dispatcher-tick 2>/dev/null || hermes -p orchestrator cron run 0ad3c19d9890 2>/dev/null || true

# 6. 初始化 超能力 7 階段追蹤 (JunAikey 萬能元鑰)
echo ""
echo "🔑 初始化 超能力 7 階段追蹤 (JunAikey 萬能元鑰)..."
if [ -f "vps/junaikey.sh" ] && [ -f "C:/Users/dingj/secret-vault/ENV20230818.env" ]; then
    vps/junaikey.sh superpowers brainstorming start --source=startup --sourceOrigin=start-automation </dev/null
    echo "   ✅ 超能力 7 階段追蹤初始化完成"
elif [ -f "vps/junaikey.sh" ]; then
    echo "   ⚠️  超能力 7 階段追蹤跳過：秘密聖櫃 (ENV) 未配置"
fi

echo ""
echo "✅ 系統啟動完成！"
echo ""
echo "📊 狀態監控指令："
echo "   hermes -p orchestrator kanban list --board main"
echo "   hermes -p orchestrator cron list"
echo "   tail -f ~/.hermes/logs/gateway.log"
echo ""
echo "📝 常用操作："
echo "   新增功能: hermes -p orchestrator kanban create \"Feature: 名稱\" --body \"...\" --tenant production --priority 3 --assignee worker-backend"
echo "   緊急Bug:  hermes -p orchestrator kanban create \"Bug: 標題\" --body \"...\" --tenant production --priority 5 --assignee worker-backend --max-retries 3"
echo "   查看任務: hermes -p orchestrator kanban show <task-id>"
echo "   技能演化: hermes -p orchestrator curator status"