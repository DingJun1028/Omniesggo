/**
 * Auto Swarm 狀態控制器
 * 
 * 負責管理母代理、子代理、任務隊列
 * 呈現 AUTO SWARM 狀態
 */

import { SwarmController } from './swarm_controller';

// 範例用法
async function main() {
  const swarm = new SwarmController();
  await swarm.init();

  // 加入任務
  swarm.addTask({
    id: 'task-001',
    priority: 'critical',
    payload: { action: 'analyze', data: 'test-data' },
    status: 'pending',
    createdAt: Date.now()
  });

  swarm.addTask({
    id: 'task-002',
    priority: 'normal',
    payload: { action: 'process', data: 'test-data-2' },
    status: 'pending',
    createdAt: Date.now()
  });

  // 啟動自動群體狀態
  swarm.start();
}

// 執行
main().catch(console.error);
