#!/usr/bin/env bash
# ============================================================
# [5T-Traceable] omnitranslation.esggo.co 佈署腳本
# 來源: esggo / OmniLiveTranslation（萬能即時擷取翻譯）
# 原則: 預設 dry-run；必須顯式 --apply 才會真正變更
# ============================================================
set -euo pipefail

APPLY=0
[[ "${1:-}" == "--apply" ]] && APPLY=1

VPS_IP="161.118.248.180"
ZONE="esggo.co"
HOSTNAME="omnitranslation.esggo.co"
BACKEND="127.0.0.1:8788"   # universal-translator v1.7.0（萬能即時翻譯）

# 金鑰來源：本機秘密聖櫃（只讀，不外傳）
VAULT="C:/Users/dingj/secret-vault/ENV20230818.env"

run() { if [[ $APPLY -eq 1 ]]; then eval "$@"; else echo "  [DRY-RUN] $*"; fi }

echo "=============================================="
echo " OmniLiveTranslation 網域佈署"
echo " host : https://${HOSTNAME}"
echo " backend: http://${BACKEND}"
echo " mode : $([[ $APPLY -eq 1 ]] && echo APPLY || echo 'DRY-RUN（加 --apply 生效）')"
echo "=============================================="

# ---------- 0. 前置檢查 ----------
echo ""
echo "[0/4] 前置檢查"
if [[ $APPLY -eq 1 ]]; then
  [[ -f "$VAULT" ]] || { echo "  ✗ 找不到金鑰檔: $VAULT"; exit 1; }
  set -a; source <(grep -E '^(CF_DNS_EDIT_TOKEN|CF_API_TOKEN|CF_ZONE_ID)=' "$VAULT"); set +a
  TOKEN="${CF_DNS_EDIT_TOKEN:-$CF_API_TOKEN}"
  ZONE_ID="${CF_ZONE_ID}"
  [[ -n "$TOKEN" && -n "$ZONE_ID" ]] || { echo "  ✗ 金鑰缺 CF token 或 zone id"; exit 1; }
  echo "  ✓ 金鑰就緒（token 長度 ${#TOKEN}，不顯示內容）"
else
  echo "  [DRY-RUN] 將讀取 $VAULT 取得 CF token"
fi

# ---------- 1. Cloudflare DNS ----------
echo ""
echo "[1/4] Cloudflare DNS A 記錄 → ${VPS_IP} (proxied)"
if [[ $APPLY -eq 1 ]]; then
  EXIST=$(curl -s -m 30 -H "Authorization: Bearer $TOKEN" \
    "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=A&name=${HOSTNAME}" \
    | python -c "import sys,json; d=json.load(sys.stdin); print(d['result'][0]['id'] if d.get('result') else '')")
  if [[ -n "$EXIST" ]]; then
    echo "  • 記錄已存在，執行更新 (id=${EXIST})"
    RESP=$(curl -s -m 30 -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${EXIST}" \
      -d "{\"type\":\"A\",\"name\":\"${HOSTNAME}\",\"content\":\"${VPS_IP}\",\"proxied\":true,\"ttl\":1}")
  else
    echo "  • 建立新記錄"
    RESP=$(curl -s -m 30 -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
      "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
      -d "{\"type\":\"A\",\"name\":\"${HOSTNAME}\",\"content\":\"${VPS_IP}\",\"proxied\":true,\"ttl\":1}")
  fi
  echo "$RESP" | python -c "import sys,json; d=json.load(sys.stdin); print('  ✓ DNS 成功' if d.get('success') else '  ✗ DNS 失敗: '+json.dumps(d.get('errors'),ensure_ascii=False))"
else
  run "curl -X POST .../zones/\$ZONE_ID/dns_records -d '{\"type\":\"A\",\"name\":\"${HOSTNAME}\",\"content\":\"${VPS_IP}\",\"proxied\":true,\"ttl\":1}'"
fi

# ---------- 2. VPS cloudflared ingress ----------
echo ""
echo "[2/4] VPS cloudflared ingress 綁定 ${HOSTNAME} → ${BACKEND}"
run "ssh esggo-vps \"sudo -n python3 -c \\\"
import re,io
p='/etc/cloudflared/config.yml'
s=open(p).read()
# 注意: cloudflared ingress 為頂層清單，縮排必須是 0/2 空格（- 與 service）
# 誤用 2/4 會讓 YAML 解析失敗，整個 tunnel 開不起來（19 個網域全掛）
entry='- hostname: ${HOSTNAME}\\n  service: http://${BACKEND}\\n'
if 'hostname: ${HOSTNAME}' in s:
    print('  • ingress 已存在，略過')
else:
    lines=s.splitlines(True)
    out=[];done=False
    for i,l in enumerate(lines):
        if not done and re.match(r'^\s*-\s*service:\s*http_status:404', l):
            out.append(entry); done=True
        out.append(l)
    open(p,'w').write(''.join(out))
    print('  ✓ ingress 已插入（置於 catch-all 404 之前）')
\\\"\""

# ---------- 3. cloudflared 生效（先驗 YAML，失敗即回滾）----------
echo ""
echo "[3/4] 校驗 YAML → 重載 cloudflared"
if [[ $APPLY -eq 1 ]]; then
  ssh esggo-vps "sudo -n cp /etc/cloudflared/config.yml /etc/cloudflared/config.yml.bak && sudo -n python3 -c \"
import yaml,sys
try:
    d=yaml.safe_load(open('/etc/cloudflared/config.yml'))
    r=d['ingress']
    assert any(x.get('hostname')=='${HOSTNAME}' for x in r), 'target rule missing'
    print('  ✓ YAML 合法, ingress rules =', len(r))
except Exception as e:
    print('  ✗ YAML 驗證失敗:', e); sys.exit(1)
\"" || { echo "  ✗ YAML 無效 → 自動回滾"; ssh esggo-vps "sudo -n cp /etc/cloudflared/config.yml.bak /etc/cloudflared/config.yml && sudo -n systemctl restart cloudflared"; exit 1; }
  ssh esggo-vps "sudo -n systemctl restart cloudflared; sleep 6; echo \"  cloudflared=\$(systemctl is-active cloudflared)\""
  ACT=$(ssh esggo-vps "systemctl is-active cloudflared")
  if [[ "$ACT" != "active" ]]; then
    echo "  ✗ cloudflared 未啟動 → 自動回滾"
    ssh esggo-vps "sudo -n cp /etc/cloudflared/config.yml.bak /etc/cloudflared/config.yml && sudo -n systemctl restart cloudflared && systemctl is-active cloudflared"
    exit 1
  fi
else
  run "ssh esggo-vps 'sudo -n systemctl restart cloudflared && systemctl is-active cloudflared'"
fi

# ---------- 4. 驗證 ----------
echo ""
echo "[4/4] 實測驗證"
if [[ $APPLY -eq 1 ]]; then
  sleep 12
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 20 "https://${HOSTNAME}")
  echo "  https://${HOSTNAME} → HTTP ${CODE}"
  echo "  標題: $(curl -s -m 20 "https://${HOSTNAME}" | grep -io '<title>[^<]*</title>' | head -1)"
  echo "  /health: $(curl -s -m 20 "https://${HOSTNAME}/health" | head -c 200)"
  echo ""
  if [[ "$CODE" == "200" ]]; then echo "  ✓ 佈署成功"; else echo "  ✗ 未達 200，需查 cloudflared 與後端"; fi
else
  run "curl -s -o /dev/null -w '%{http_code}' https://${HOSTNAME}"
fi
echo ""
