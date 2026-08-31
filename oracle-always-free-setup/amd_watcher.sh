#!/usr/bin/env bash
# OA-Team 30 萬能蜂群 — AMD Always-Free 容量觀察器 (Soul 20 Ops-bee 收尾)
# 接續前次 poll 21/200：以指數退避重試 oci compute instance launch (VM.Standard.E2.1.Micro)
# 真實 oci 調用，成功即寫 OCID 並退出；達上限則標記 exhausted。
set -uo pipefail
export SUPPRESS_LABEL_WARNING=True

T=ocid1.tenancy.oc1..aaaaaaaadof5rgb76zexk24q6fnhopqjnrqaxwmeuxunoynw46g3lj3lfnlq
AD=xzUx:AP-SINGAPORE-1-AD-1
SUB=ocid1.subnet.oc1.ap-singapore-1.aaaaaaaar7nxu5zfltazqv4yf3ulzulnmrbheqzdsymeentzjans5uk2ytwa
# x86_64 image required for AMD E2.1.Micro (ARM Ubuntu image is NOT compatible)
IMG=ocid1.image.oc1.ap-singapore-1.aaaaaaaaodsxlk5wajl5ewrnxjrlfdcujz3hp4jaf2rg4uys5uunojupdb4a
# oci.exe is a native Windows binary -> needs native (C:\...) paths, not MSYS (/c/...)
case "$HOME" in
  /??*) KEY="$(cygpath -w "$HOME/.ssh/esggo_original.pub" 2>/dev/null || echo "C:/Users/dingj/.ssh/esggo_original.pub")" ;;
  *)    KEY="$HOME/.ssh/esggo_original.pub" ;;
esac
[ -f "$KEY" ] || KEY="C:/Users/dingj/.ssh/esggo_original.pub"
LOG="$(dirname "$0")/amd_retry.log"
MAX="${AMD_MAX:-40}"
START="${AMD_START:-21}"
mkdir -p "$(dirname "$LOG")"

echo "[$(date -u +%FT%TZ)] AMD watcher start (attempt $START/$MAX)" >> "$LOG"

i=$START
while (( i <= MAX )); do
  echo "[$(date -u +%FT%TZ)] attempt $i: launching AMD E2.1.Micro" >> "$LOG"
  OUT=$(oci compute instance launch \
    --compartment-id "$T" --region ap-singapore-1 \
    --availability-domain "$AD" --shape VM.Standard.E2.1.Micro \
    --subnet-id "$SUB" --image-id "$IMG" \
    --ssh-authorized-keys-file "$KEY" \
    --assign-public-ip true --display-name esggo-af-amd-01 \
    --output json 2>&1) || true

  if echo "$OUT" | grep -q '"id"'; then
    ID=$(echo "$OUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['id'])" 2>/dev/null || true)
    echo "[$(date -u +%FT%TZ)] SUCCESS AMD launched: $ID" >> "$LOG"
    echo "AMD_OK $ID" >> "$LOG"
    exit 0
  fi

  if echo "$OUT" | grep -qi "Out of host capacity"; then
    echo "[$(date -u +%FT%TZ)] attempt $i: Out of host capacity -> backoff 60s" >> "$LOG"
  elif echo "$OUT" | grep -qi "LimitError\|already have\|monthly"; then
    echo "[$(date -u +%FT%TZ)] attempt $i: hard limit/exists -> stop. $OUT" >> "$LOG"
    echo "AMD_HARD_LIMIT" >> "$LOG"
    exit 2
  else
    echo "[$(date -u +%FT%TZ)] attempt $i: other error -> $OUT" >> "$LOG"
  fi

  sleep 60
  i=$((i+1))
done
echo "[$(date -u +%FT%TZ)] AMD watcher exhausted $MAX attempts" >> "$LOG"
echo "AMD_EXHAUSTED" >> "$LOG"
exit 1
