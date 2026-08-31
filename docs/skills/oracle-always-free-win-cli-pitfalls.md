---
name: oracle-always-free-win-cli-pitfalls
category: devops
description: Provision Oracle Always-Free via Windows oci.exe pitfalls.
version: 1.0.0
author: OA-Team 30 / 萬能蜂群
license: MIT
metadata:
  hermes:
    tags: [oci, oracle, always-free, windows, msys, amd, cli]
    related_skills: [esggo-vps-subdomain-deploy, oracle-always-free-ops]
---
# Oracle Always-Free on Windows (oci.exe) — Live Pitfalls & Fixes

Provisioning Oracle Cloud Always-Free resources from a **Windows git-bash/MSYS host** where
`oci` resolves to the **native `oci.exe`** (not a Linux python oci). Built from a real
provisioning run (ap-singapore-1, esggo tenancy).

## When to use
- User asks to install / provision "free" Oracle Cloud, Always-Free, or stop ARM reclaim.
- Working from Windows with git-bash and `oci` on PATH (resolves to `oci.exe`).
- Verifying an Always-Free setup stays inside free quotas.

## CRITICAL traps (hit live — copy the fixes)

### 1. oci.exe needs NATIVE Windows paths, not MSYS paths
`--ssh-authorized-keys-file /c/Users/dingj/.ssh/esggo_original.pub` →
`Error: Invalid value ... No such file or directory` (oci.exe can't read MSYS paths).
**Fix:** convert with cygpath, or hardcode `C:/Users/dingj/.ssh/esggo_original.pub`:
```bash
case "$HOME" in
  /??*) KEY="$(cygpath -w "$HOME/.ssh/esggo_original.pub" 2>/dev/null || echo "C:/Users/dingj/.ssh/esggo_original.pub")" ;;
  *)    KEY="$HOME/.ssh/esggo_original.pub" ;;
esac
[ -f "$KEY" ] || KEY="C:/Users/dingj/.ssh/esggo_original.pub"
```
Same applies to any `--file` / `--config-file` argument passed to oci.exe.

### 2. ~/.oci/config has NO `compartment` key
`grep '^compartment' ~/.oci/config` returns empty. The compartment OCID == the `tenancy=` value.
**Fix:** `COMPARTMENT_OCID="$(grep '^tenancy=' ~/.oci/config | cut -d= -f2)"` and pass `--compartment-id "$COMPARTMENT_OCID"`.
`oci compute instance list` FAILS with "Missing option(s) --compartment-id" otherwise.

### 3. AMD E2.1.Micro needs an x86_64 image, NOT the ARM aarch64 image
Reusing the ARM instance's `image-id` (Ubuntu 24.04 aarch64) for AMD launch →
`InvalidParameter: Shape VM.Standard.E2.1.Micro is not valid for image <arm-image>`.
**Fix:** list AMD-compatible images explicitly:
`oci compute image list --shape VM.Standard.E2.1.Micro --region <rg> --compartment-id <comp> --output json`
Pick `Canonical Ubuntu 24.04` (x86_64). The returned `architecture` field is often `None`
in listings — trust the `--shape` filter, not the arch field.
Free-tier AMD quota is **2× E2.1.Micro** and is SEPARATE from the 24GB ARM quota.

### 4. AMD "Out of host capacity" is NORMAL — wrap in a retry loop
AMD free-tier capacity rotates; expect `ServiceError ... code: InternalError, Out of host capacity`
(status 500) transiently. **Fix:** `until oci ... launch ... 2>/dev/null; do sleep 60; done` capped
(~30–200 tries). Do NOT treat as script error. ARM A1.Flex does NOT hit this (it's allocated by RAM).

### 5. Keep-alive to prevent ARM reclaim (the real "永久不過期")
Oracle reclaims idle ARM. On EVERY ARM instance:
- `/usr/local/bin/keepalive.sh`: tiny CPU blip (`awk 'BEGIN{for(i=0;i<50000;i++){s+=sqrt(i)*sin(i)}}'`),
  append rotating `/var/log/keepalive-heartbeat.log` (cap 200 lines), `curl -m5 http://169.254.169.254/opc/v2/instance/`.
- crontab: `*/9 * * * * /usr/local/bin/keepalive.sh >> /var/log/keepalive.log 2>&1`
- Also add a monitoring alarm backstop: `CpuUtilization[1m].mean() < 1` → Notification Topic.
Verify with `oci compute instance get --instance-id <ocid>` (lifecycle-state RUNNING) + SSH in to check cron.

### 6. Background watcher hygiene on Windows
- `taskkill //F //IM bash.exe` does NOT reliably kill detached MSYS bash workers → stale watchers
  keep writing to the shared log and race with the new one (you'll see two attempt-counters in the log).
- **Fix:** track the Hermes `terminal(background=true)` session_id and `process(action='kill', session_id=...)`.
  Enumerate alive watchers via the process list tool, not `ps aux` (MSYS ps is unreliable).
- Prefer a single tracked background process; if you must relaunch, kill the old session_id FIRST.

## Quota reality (per tenancy, ap-singapore-1 observed)
| Resource | Free limit | Notes |
|---|---|---|
| ARM A1.Flex | 24 GB RAM total (e.g. 1×24 or 4×6) | reclaimed if idle → keep-alive |
| AMD E2.1.Micro | 2 (some regions 1) | often Out-of-host-capacity |
| Autonomous DB | 2 × 20 GB, `is-free-tier=true` | `--data-storage-size-in-tbs 1` (integer TB only) |
| Block Volume | min 50 GB | `--size-in-gbs 50` |
| Load Balancer | 1 × 10 Mbps | needs subnet-ids |
| Reserved IP | 2 | |
| Vault | free | |

## Verify before claiming success (honest evidence)
- `oci compute instance list --compartment-id <comp> --region <rg>` → real OCIDs + RUNNING state.
- `oci iam tenancy get --tenancy-id <t> --query 'data."is-trial"'` → confirm Always-Free not Trial.
- Cloudflare DNS token: `curl -s https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer <token>"`
  → `{"success":true,"result":{"status":"active"}}`.
- NEVER say "provisioned" until real `oci` returns ids. Mock-runs (stub oci) only prove control flow.

## Verification pattern (no live target / API locked)
```bash
SF=oracle_always_free_setup.sh
bash -n "$SF" && echo SYNTAX_OK
TMP=$(mktemp -d)
cat > "$TMP/oci" <<'STUB'   # stub: out-of-capacity once then success; lists return []
#!/usr/bin/env bash
a="$*"
[[ "$a" == *"instance launch"* ]] && { [ -f /tmp/ff ] || { touch /tmp/ff; echo 'ServiceError: Out of host capacity.' >&2; exit 1; }; echo '{"data":{"id":"x"}}'; exit 0; }
[[ "$a" == *"list"* ]] && { echo '{"data":[]}'; exit 0; }
echo '{"data":{"id":"x"}}'; exit 0
STUB
chmod +x "$TMP/oci"; rm -f /tmp/ff
export PATH="$TMP:$PATH" SUPPRESS_LABEL_WARNING=True TENANCY_OCID=ocid1.t COMPARTMENT_OCID=ocid1.c REGION=ap-singapore-1 AD=xzUx:AD-1 PREFIX=esggo-af INVENTORY="$TMP/inv.json" ADB_ADMIN_PWD='Test123!' SUBNET_ID=ocid1.s AMD_IMAGE=ocid1.ai ARM_IMAGE=ocid1.ri VCN_ID=ocid1.v ALARM_TOPIC_OCID=ocid1.tp
bash "$SF" > "$TMP/r.log" 2>&1; echo "exit=$?"
grep -q "佈建完成" "$TMP/r.log" && echo END:YES; grep -q "Out of host capacity" "$TMP/r.log" && echo RETRY:YES
grep -q "AMD 佈建成功" "$TMP/r.log" && echo AMD_OK:YES; test -f "$TMP/inv.json" && echo INV:YES
rm -rf "$TMP" /tmp/ff
```

## 7. OCI Serial Console & GitHub Actions runner traps (hit live, 6 CI iterations)

### 7.1 OCI Instance Console Connection rejects ed25519
`oci compute instance-console-connection create --ssh-public-key-file <ed25519.pub>` →
`ServiceError: InvalidParameter "Invalid ssh public key type \"ssh-ed25519\""`.
**Fix:** generate an **RSA** temp key for the console connection: `ssh-keygen -t rsa -b 4096 -N "" -f ~/.ssh/worker_tmp`.
(OCI only accepts RSA for console connections — confirmed 2026-08-21, ap-singapore-1.)

### 7.2 Serial-console SSH target is NOT ubuntu@<worker-ocid>
Wrong: `ssh -i key ubuntu@$OA_WORKER_OCID` → instant failure / no output.
Right: the connection OCID is BOTH user and host:
```bash
CONSOLE_HOST="$CONN@instance-console.$OCI_REGION.oci.oraclecloud.com"
PROXY="ssh -W %h:%p -p 443 $CONSOLE_HOST"
ssh -i ~/.ssh/worker_tmp -o ProxyCommand="$PROXY" "$CONSOLE_HOST" bash -s <<'VPS'
  # commands run ON the worker via the serial console proxy
VPS
```

### 7.3 Serial console is UNRELIABLE in non-interactive CI (and even local)
Even with a *correctly registered* RSA key whose private key you actually hold, the OCI
serial-console proxy auth layer returns `Permission denied (publickey)`. Proven locally:
created a console connection with `esggo_original.pub`, waited until `ACTIVE`, then
`ssh -i ~/.ssh/esggo_original -o ProxyCommand='ssh -W %h:%p -p 443 CONN@instance-console...' CONN@instance-console...`
still got `Permission denied (publickey)`. The proxy auth path is independent of the
registered key and rejects automated key logins. After 8+ iterations (CI + local), this
path was abandoned. **Prefer one of:**
- Manual paste of the target pubkey into the worker's `~/.ssh/authorized_keys` via the
  **OCI web console interactive terminal** (console.oracle.com → instance → Console
  Connection → opens an interactive web terminal that does NOT go through the SSH proxy
  auth layer). This is the only reliable entry.
- OCI **Bastion** tunnel (needs worker private IP + `OCI_BASTION_ID`/`OCI_TARGET_RESOURCE_ID`
  secrets) — Oracle's official no-public-IP entry, more reliable than serial console.
- Have the CI that already manages the instance (`managed_by=github-actions`) inject the
  pubkey in its deploy step.

### 7.4 `oci` CLI is NOT on GitHub runners
`oci: command not found` in CI. `pip install oci` installs the **SDK** (no `oci` binary).
**Fix:** `python3 -m pip install --quiet --user oci-cli`, then add its bin to PATH:
```bash
export PATH="$(python3 -m site --user-base)/bin:$HOME/.local/bin:/usr/local/bin:$PATH"
```
Each workflow step is a fresh shell → set PATH in **every** step that calls `oci`.

### 7.5 Write ~/.oci/config explicitly (avoid YAML [DEFAULT] misparse)
Inside a `run: |` block, a heredoc `cat > ~/.oci/config <<CFG ... [DEFAULT] ... CFG` gets
misparsed by YAML as a mapping. **Fix:** write config via python:
```python
cfg = pathlib.Path("~/.ssh/../.oci/config").expanduser()
cfg.parent.mkdir(parents=True, exist_ok=True)
cfg.write_text("[DEFAULT]\nuser=%s\ntenancy=%s\nregion=%s\nfingerprint=%s\nkey_file=%s\n" % (...))
```
Then verify auth with `oci iam user get --user-id "$OCI_USER_OCID"` (prints JSON if OK).

### 7.6 Instance Run Command unavailable when isManagementDisabled
`oci compute instance run-command` may not exist as a subcommand, and the instance
metadata shows `isManagementDisabled: true` → cannot push commands this way. Don't rely on it.

## 8. Honest verification before claiming a worker is "reachable"
A worker shown RUNNING by `oci compute instance get` is NOT proven SSH-reachable.
Always do a real `ssh -i <priv> -o BatchMode=yes <user>@<ip> 'echo OK'` from a host
that holds the matching private key. If `Permission denied (publickey)`, the key was
never injected — do NOT claim the step succeeded.
