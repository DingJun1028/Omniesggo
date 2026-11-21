---
name: esggo-vps-subdomain-deploy
description: Verify esggo.co subdomains via Cloudflare DNS.
version: 1.0.0
author: OA-Team 30 / 萬能蜂群
license: MIT
metadata:
  hermes:
    tags: [devops, cloudflare, dns, vps, oracle-always-free, esggo]
    related_skills: [oracle-always-free-win-cli-pitfalls, esggo-vps-deploy-rescue]
---

# esggo VPS Subdomain Deploy & Verify

## Stable facts (verify before assuming)
- Shared VPS IP: **161.118.248.180** (Oracle Always-Free ARM64, esggo-vps). ALL esggo.co subdomains (aistation/deerflow/ftg/live/oa/omniagent/esggo) resolve here. nginx `server_name` routes per subdomain.
- Cloudflare Zone ID for esggo.co: **8dda3653e490290412f7be84a84e0dc9** (stable, do not re-query unless zone moves).
- SSH into VPS: `ssh -i ~/.ssh/esggo_original ubuntu@161.118.248.180` (RSA key SHA256:YGMYtf; NOT the ed25519 vps-deployment-key — no local private for it).
- CF DNS:Edit token format: `cfut_...` (single token, scope = edit zone DNS for esggo.co). Expires ~24h after issuance — re-request from user if `tokens/verify` returns invalid.

## When to use
- User pastes AI Station / OmniAuto / any esggo subdomain deploy docs and expects it live.
- Need to set or fix an A record for `*.esggo.co`.
- Verify a service is externally reachable after deploy.

## Procedure

### 1. Verify CF token + get zone (idempotent)
```bash
TOKEN="cfut_xxx"   # from user; never hardcode
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('valid' if d.get('success') else 'INVALID', d.get('result',{}).get('expires_on'))"
# zone id is stable: 8dda3653e490290412f7be84a84e0dc9
```

### 2. Check / set A record (avoid duplicate records)
```bash
ZONE=8dda3653e490290412f7be84a84e0dc9
# list existing
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records?name=SUB.esggo.co&type=A" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print([(r['id'],r['content']) for r in d.get('result',[])])"
# if empty -> create
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"type":"A","name":"SUB.esggo.co","content":"161.118.248.180","ttl":300,"proxied":false}' \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records"
# if wrong IP -> PATCH the existing id (do NOT create duplicate)
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":"161.118.248.180"}' \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records/<RECORD_ID>"
```
Note: `proxied:false` (DNS-only) is typical for these services. If user wants orange-cloud, set `proxied:true` — but then external :80/:443 must match Cloudflare edge expectations.

### 3. External verification SOP (the real proof)
Do NOT trust CI green. Verify the live service:
```bash
# DNS resolves?
nslookup SUB.esggo.co
# HTTP should 301 -> HTTPS (certbot)
curl -s -o /dev/null -w "HTTP %{http_code}\n" --max-time 15 "http://SUB.esggo.co/PATH"
# HTTPS body is the real check
curl -s --max-time 15 "https://SUB.esggo.co/PATH" | head -c 400
```
For AI Station specifically: `GET /api/health` returns `{"status":"ok",...}`. Web UI root has `<title>AI Station — 全自動影音生產線</title>`.

### 4. On-VPS checks (if external fails)
```bash
ssh -i ~/.ssh/esggo_original ubuntu@161.118.248.180 '
docker ps --format "{{.Names}} {{.Status}}" | grep -i SERVICE
curl -fsS http://127.0.0.1:PORT/health
ls -la /etc/nginx/sites-enabled/ | grep SERVICE
'
```
If container is `healthy` but external 502/timeout → Security List (Oracle VCN) missing 80/443, or nginx conf not enabled. If container absent → deploy step did not run on this VPS.

## Pitfalls (learned the hard way)
- **IP drift**: aistation docs say VPS is `161.118.252.147`, but the live VPS is `161.118.248.180`. The `deploy.yml` workflow reads `DEPLOY_HOST` secret (likely still 147) → CI fails connecting to a dead IP, EVEN THOUGH the container is already running on 180 from an earlier manual deploy. Fix: either update `DEPLOY_HOST` secret to 180, or add a `host` workflow_dispatch input. Do not re-run CI blindly.
- **Do not restart working containers**: if `SERVICE-core` is already `healthy running` on 180, a failed CI re-deploy is cosmetic noise. Verify first, deploy only if absent/stale.
- **CF token expiry**: re-issued tokens expire in 24h. If `tokens/verify` fails, ask user for a fresh `cfut_...` — never substitute a guessed value.
- **esggo_original vs vps-deployment-key**: user may paste an ed25519 pubkey (`vps-deployment-key`) but the local private for it is absent. `esggo_original` (RSA) already opens 180 — use it, don't block on the new key.
- **nginx port collision**: each subdomain service binds `127.0.0.1:PORT` (localhost only); nginx is the public face via `server_name SUB.esggo.co`. Never map a service container to `0.0.0.0:80` — it steals DeerFlow's port.
- **Honest gap reporting**: if a dependency (e.g. oa-worker-01) is managed by another CI with a key you don't hold, mark it as a gap (29/30) rather than claiming done. Verify with a real ssh before signing off.

## Verification checklist
- [ ] CF token valid (tokens/verify)
- [ ] A record SUB.esggo.co -> 161.118.248.180 (no duplicate)
- [ ] Container healthy on 180 (docker ps)
- [ ] nginx sites-enabled has SUB.conf symlink
- [ ] `curl https://SUB.esggo.co/PATH` returns live body (200)
- [ ] HTTP :80 returns 301 to :443
