import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function FamilyDayFeature() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [observations, setObservations] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddObs, setShowAddObs] = useState(false);

  // 預設親子任務模板
  const taskTemplates = [
    { id: 'nature_bingo', title: '自然賓果', icon: '🔍', desc: '找到並記錄 5 種不同的植物或昆蟲' },
    { id: 'photo_challenge', title: '拍照挑戰', icon: '📸', desc: '與家人一起拍 3 張創意合照' },
    { id: 'scavenger_hunt', title: '尋寶遊戲', icon: '🗺️', desc: '按照地圖找到隱藏的寶物' },
    { id: 'craft_workshop', title: '手作體驗', icon: '🎨', desc: '用自然素材製作藝術品' },
    { id: 'local_food', title: '在地美食', icon: '🍜', desc: '品嘗當地特色小吃' },
    { id: 'team_games', title: '團隊遊戲', icon: '🤝', desc: '全家一起參與的趣味競賽' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-primary">親子任務卡</h3>
        <button className="btn-primary" onClick={() => setShowAddTask(true)}>+ 新增任務</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {taskTemplates.map(task => (
          <div key={task.id} className="card-hoverable">
            <div className="text-4xl mb-3">{task.icon}</div>
            <h4 className="font-bold text-primary">{task.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{task.desc}</p>
            <label className="flex items-center gap-2 mt-3">
              <input type="checkbox" className="w-4 h-4" />
              <span className="text-sm">已完成</span>
            </label>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-primary">自然觀察記錄</h3>
          <button className="btn-outline" onClick={() => setShowAddObs(true)}>+ 新增觀察</button>
        </div>
        <div className="space-y-2">
          {observations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">尚未記錄觀察</p>
          ) : (
            observations.map(obs => (
              <div key={obs.id} className="card">
                <div className="text-sm text-gray-500">{obs.date}</div>
                <div className="mt-1">{obs.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
