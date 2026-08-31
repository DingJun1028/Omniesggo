# 5T Dashboard Automation

## Daily 5T Report Cron
- Schedule: `0 8 * * *`
- Script: `scripts/5t-daily-report.sh`
- Output: `/var/www/esggo/logs/5t-daily-report.log`
- Delivery: Telegram + Email via n8n webhook

## n8n Workflow
1. Trigger: Cron `0 8 * * *`
2. HTTP Request: `POST https://esggo.co/api/health?detail=true`
3. Filter: Only send if status != healthy
4. Action: Post to Telegram `@esggo-alerts`
