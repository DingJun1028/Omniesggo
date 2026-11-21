# Monitoring & Alerting

## Health endpoints
- ESGGO app: `GET /api/health`
- Gateway: `GET http://127.0.0.1:8642/status`

## Transport
Set `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, or `DISCORD_ALERT_WEBHOOK_ID` + `DISCORD_ALERT_WEBHOOK_TOKEN`.

## Hook into systemd
```bash
sudo cp vps/scripts/alert-on-failure.sh /usr/local/bin/
sudo systemctl edit esggo-app.service
# add: [Service] OnFailure=alert-on-failure@%n.service
```

## Acknowledge
Create `/var/run/esggo-alert/<unit>.ack` to silence for 30m.
