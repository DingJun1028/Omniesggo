// vps/junaikey-optimize.mjs
// ============================================================
// VPS 優化排程 (一鍵安裝到新 VPS)
// 安裝項目:
//   1. Docker log rotation: 10MB × 3 (新 container 自動套用)
//   2. 每日 4am: docker system prune
//   3. 每週日 3am: /tmp 清理、journalctl 7d、docker weekly prune
//   4. swap 8GB (避免 OOM)
//   5. logrotate: nginx, syslog 7 天保留
// 用法: ssh ubuntu@host "curl ... | sudo node -"  或本地 sudo node
// ============================================================
import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';

const sh = (cmd) => execSync(cmd, { stdio: 'inherit', shell: '/bin/bash' });
const sudo = (cmd) => sh('sudo ' + cmd);

async function setup() {
  console.log('=== 1. Docker log rotation ===');
  await fs.mkdir('/etc/docker', { recursive: true });
  await fs.writeFile('/etc/docker/daemon.json', JSON.stringify({
    'log-driver': 'json-file',
    'log-opts': { 'max-size': '10m', 'max-file': '3' },
  }, null, 2));
  sh('sudo systemctl reload docker 2>&1 || sudo systemctl restart docker');
  console.log('  ✓ /etc/docker/daemon.json 設定完成');

  console.log('\n=== 2. Cron jobs ===');
  const cronLines = [
    '0 4 * * * /usr/bin/docker system prune -a -f --volumes >/var/log/docker-prune.log 2>&1',
    '0 3 * * 0 find /tmp -type f -atime +7 -delete 2>/dev/null; journalctl --vacuum-time=7d 2>/dev/null; /usr/bin/docker system prune -a -f --volumes --filter "until=168h" >/var/log/docker-prune-weekly.log 2>&1',
    '*/30 * * * * /usr/bin/find /var/log -type f -name "*.gz" -mtime +14 -delete 2>/dev/null',
  ];
  const existing = sh('sudo crontab -l 2>/dev/null').toString();
  const newCron = [...new Set([...existing.split('\n').filter(Boolean), ...cronLines])].join('\n') + '\n';
  sh(`echo "${newCron}" | sudo crontab -`);
  console.log('  ✓ 3 個 cron jobs 已安裝');

  console.log('\n=== 3. swap 8GB (若無) ===');
  try {
    const swapInfo = sh('swapon --show').toString();
    if (!swapInfo.includes('/swapfile')) {
      sh('sudo fallocate -l 8G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile');
      // persist in fstab
      const fstab = sh('cat /etc/fstab').toString();
      if (!fstab.includes('/swapfile')) sh('echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab');
      console.log('  ✓ swap 8GB 建立完成');
    } else {
      console.log('  ✓ swap 已存在,跳過');
    }
  } catch (e) { console.log('  ⚠ swap 設定失敗:', e.message); }

  console.log('\n=== 4. sysctl 網路優化 ===');
  const sysctlConf = `
# JunAikey VPS optimization
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 15
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
`.trim();
  await fs.writeFile('/etc/sysctl.d/99-junaikey.conf', sysctlConf);
  sh('sudo sysctl --system 2>&1 | tail -3');
  console.log('  ✓ /etc/sysctl.d/99-junaikey.conf');

  console.log('\n=== 5. logrotate: 7 天保留 ===');
  const logrotateConf = `
/var/log/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 0644 root root
  sharedscripts
  postrotate
    systemctl reload rsyslog 2>/dev/null || true
  endscript
}
`.trim();
  await fs.writeFile('/etc/logrotate.d/junaikey', logrotateConf);
  console.log('  ✓ /etc/logrotate.d/junaikey');

  console.log('\n=== 完成 ===');
  sh('df -h / | tail -1');
  sh('free -g | head -2');
}

if (process.getuid && process.getuid() !== 0) {
  console.error('請用 sudo 執行');
  process.exit(1);
}

setup().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
