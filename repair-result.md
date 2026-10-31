## vps-ssh-repair 2026-10-31T15:52:18Z
- SSH_PRIVATE_KEY matches 2026-04 PDF root key: NO
### authorized_keys repair
- ubuntu:ADDED
- root:ADDED
### verify SSH_PRIVATE_KEY
- dep key as ubuntu: SSH OK
- dep key as root: SSH FAIL
### server state
- nginx:active
- ftg_files:14
- esggo_app_dir:NO
- fail2ban_banned:0
- pm2_procs:0
### FTG deploy (canonical pipeline, SSH_PRIVATE_KEY)
- pnpm install: OK
- FTG build: OK
- rsync to /var/www/ftgtours: FAIL
