# OmniAgent Secrets Management Architecture
# All credentials are encrypted and managed internally by OmniAgent

## Tiered Secret Management

### Tier 1: Infrastructure (Local/OCI/AWS)
- OCI Config: ~/.oci/config
- AWS Config: ~/.aws/credentials  
- rclone config: ~/.config/rclone/rclone.conf
- Tailscale: 安全連網層（裝置互聯/網段管理）
  - Auth Key (`TAILSCALE_AUTH_KEY`): 免互動將裝置加入 Tailscale 網段
  - API Token (`TAILSCALE_API_TOKEN`): 呼叫 Tailscale API（裝置/策略/網段）
  - 實際儲存: 本倉 `.env`（gitignore，不入版控）；用後建議至 Tailscale 後台撤銷重發
  - 對應靈魂: 萬能安全蜂(27) + 萬能外交蜂(23)
  - 用途: VPS(161.118.248.180) 經 auth key 加入 Tailscale，實現 OA-Team 跨節點安全通道

### Tier 2: Application Credentials
- Telegram: Bot Token + Chat ID
- Supabase: API Keys (auto-rotated)
- Redis: Connection string

### Tier 3: Deployment Credentials
- GitHub PAT: CI/CD deployment
- SSH Private Key: VPS deployment
- certbot email: SSL renewal

## OmniAgent Secret Rotation Policy

| Secret Type | Rotation | Backup Location |
|-------------|----------|-----------------|
| SSH Keys | 90 days | TPM/Vault |
| API Keys | 30 days | Encrypted backup |
| SSL Certs | 60 days before expiry | Vault |
| Database | Never (manual) | /backup/encrypted |

## Authorization Flow

```
OmniAgent -> Vault API -> Get encrypted secret
OmniAgent -> Decrypt with master key (env VGS-AGENT-KEY)
OmniAgent -> Apply to target service
```

## Security Controls

1. All secrets encrypted at rest (AES-256)
2. Master key rotated weekly via cron
3. Audit log: /var/log/omniagent-secrets.log
4. Emergency revocation: kill -USR1 omniagent-pid
