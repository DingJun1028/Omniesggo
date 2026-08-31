# Ch.02 VPS 部署與 pm2 管理

> 來源：2026-08-15 Oracle VPS 實戰。最小改動原則 + 快速恢復。

## 系統資訊

| 項目 | 值 |
|---|---|
| VPS | Ubuntu @ 161.118.248.180 |
| SSH | `~/.ssh/ci_deploy_key` |
| 服務 | pm2 `esggo-core` port 3000 |
| nginx | HTTPS + static cache |

## 快速恢復 SOP

```bash
ssh -i ~/.ssh/ci_deploy_key ubuntu@161.118.248.180
cd /var/www/esggo
git pull --rebase origin main
rm -rf .next
node_modules/.bin/next build
pm2 restart esggo-core --update-env
```

## 防 port 重複佔用

`ecosystem.config.js` 若有 Windows 風格的 `cwd: 'C:\\var\\www\\esggo'`，pm2 會跑不出來。

修法：刪除壞程序，直接用 node 啟動。

```bash
pm2 delete esggo-core
pm2 start node --name esggo-core --cwd /var/www/esggo -- ./node_modules/.bin/next start -p 3000 -H 127.0.0.1
pm2 save
```

## 驗證

- [ ] `ss -tlnp | grep 3000` 有監聽
- [ ] `pm2 list` 狀態 online
- [ ] `curl http://127.0.0.1:3000/api/health` 200
