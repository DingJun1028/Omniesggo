# API Key Rotation SOP

## Rotation Schedule
- Weekly: CRON_SECRET, MEMORY_API_KEY
- Monthly: WEBHOOK_SECRET, MINIO credentials
- Quarterly: Firebase service account, OCI keys

## Procedure
1. Generate new secret: `python3 -c "import secrets; print(secrets.token_urlsafe(32))"`
2. Update VPS `.env` with new value
3. Run `pm2 restart esggo-core --update-env`
4. Verify old key fails: test endpoint with old key
5. Verify new key works: test endpoint with new key
6. Revoke old key from provider (if applicable)
7. Record rotation in audit log

## Emergency Rotation
If a key is exposed:
1. Immediately rotate the compromised key
2. Review access logs for abuse
3. Notify team via security channel
4. Document incident in security audit log
