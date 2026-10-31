## vps-ssh-repair3 2026-10-31T15:55:26Z
- rsync_remote:PRESENT
- ftg_owner:UNKNOWN
- ftg_owner_after:ubuntu
- ftg_writable:YES
- permitrootlogin:permitrootlogin without-password
### FTG deploy retry (canonical pipeline)
- pnpm install: rc=0
- FTG build: rc=0
- dist entries: 12
- rsync rc=0
- rsync to /var/www/ftgtours: OK
- nginx reload rc=0
- ftgtours.esggo.co: 200
- esggo.co: 200
- hermex.esggo.co: 200
- ftg_html_tags: 3
