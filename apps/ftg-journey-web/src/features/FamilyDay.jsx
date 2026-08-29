import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

const TASK_TEMPLATES = [
  { id: 'nature_bingo', title: '自然賓果', icon: '🔍', desc: '找到並記錄 5 種不同的植物或昆蟲' },
  { id: 'photo_challenge', title: '拍照挑戰', icon: '📸', desc: '與家人一起拍 3 張創意合照' },
  { id: 'scavenger_hunt', title: '尋寶遊戲', icon: '🗺️', desc: '按照地圖找到隱藏的寶物' },
  { id: 'craft_workshop', title: '手作體驗', icon: '🎨', desc: '用自然素材製作藝術品' },
  { id: 'local_food', title: '在地美食', icon: '🍜', desc: '品嘗當地特色小吃' },
  { id: 'team_games', title: '團隊遊戲', icon: '🤝', desc: '全家一起參與的趣味競賽' },
];

export function FamilyDayFeature({ journeyId }) {
  const token = localStorage.getItem('ftg_token');
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [observations, setObservations] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [obsText, setObsText] = useState('');
  const [obsType, setObsType] = useState('plant');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareImage, setShareImage] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (journeyId) {
      fetch(`${API_BASE}/api/journeys/${journeyId}/family-tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => {
        if (data.data && Array.isArray(data.data)) setTasks(data.data);
        else if (data.data && data.data.tasks) setTasks(data.data.tasks);
      });
      fetch(`${API_BASE}/api/journeys/${journeyId}/family-observations`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => {
        if (data.data && Array.isArray(data.data)) setObservations(data.data);
        else if (data.data && data.data.observations) setObservations(data.data.observations);
      });
      fetch(`${API_BASE}/api/journeys/${journeyId}/photos`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => setPhotos(data.photos || []));
    }
  }, [journeyId, token]);

  const toggleTask = async (taskId) => {
    const currentTasks = tasks.length > 0 ? tasks : TASK_TEMPLATES.map(t => ({ ...t, completed: false }));
    const updated = currentTasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasks(updated);
    setSaving(true);
    await fetch(`${API_BASE}/api/journeys/${journeyId}/family-tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: updated }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addObservation = async () => {
    if (!obsText.trim()) return;
    const newObs = { text: obsText, type: obsType, date: new Date().toISOString() };
    const updated = [...observations, newObs];
    setObservations(updated);
    setSaving(true);
    await fetch(`${API_BASE}/api/journeys/${journeyId}/family-observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: updated }),
    });
    setObsText('');
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result;
        await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image: base64, journey_id: journeyId }),
        });
        const updated = await fetch(`${API_BASE}/api/journeys/${journeyId}/photos`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json());
        setPhotos(updated.photos || []);
      };
      reader.readAsDataURL(file);
    }
    setUploading(false);
  };

  const generateShareImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 背景漸層
    const gradient = ctx.createLinearGradient(0, 0, 600, 400);
    gradient.addColorStop(0, '#10243f');
    gradient.addColorStop(1, '#c9a24b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 400);

    // 品牌區
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('FTG 墾趣旅遊', 30, 50);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#f3ede1';
    ctx.fillText('家庭日 · 親子自然體驗', 30, 75);

    // 統計數據
    const completedCount = tasks.filter(t => t.completed).length;
    const photoCount = photos.length;
    const obsCount = observations.length;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`${completedCount}/${tasks.length}`, 30, 160);
    ctx.font = '18px sans-serif';
    ctx.fillText('任務完成', 30, 185);

    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`${photoCount}`, 230, 160);
    ctx.font = '18px sans-serif';
    ctx.fillText('張照片', 230, 185);

    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(`${obsCount}`, 430, 160);
    ctx.font = '18px sans-serif';
    ctx.fillText('個觀察', 430, 185);

    // 任務列表
    ctx.font = '16px sans-serif';
    let y = 230;
    tasks.filter(t => t.completed).forEach(t => {
      ctx.fillText(`${t.icon} ${t.title}`, 30, y);
      y += 25;
    });

    // 底部品牌語
    ctx.font = 'italic 14px sans-serif';
    ctx.fillStyle = '#f3ede1';
    ctx.fillText('走進自然，創造更有意義的旅程', 30, 370);

    // 下載
    const dataUrl = canvas.toDataURL('image/png');
    setShareImage(dataUrl);
  };

  const downloadShareImage = () => {
    if (!shareImage) return;
    const link = document.createElement('a');
    link.download = `FTG-FamilyDay-${Date.now()}.png`;
    link.href = shareImage;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-primary">企業家庭日</h3>
        {saving && <span className="text-sm text-gray-400">儲存中...</span>}
        {saved && <span className="text-sm text-green-500">✓ 已儲存</span>}
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['tasks', 'observations', 'photos', 'share'].map(tab => (
          <button key={tab} className={activeTab === tab ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab(tab)}>
            {tab === 'tasks' ? '🎯 任務' : tab === 'observations' ? '🔍 觀察' : tab === 'photos' ? '📸 相簿' : '🖼️ 分享圖'}
          </button>
        ))}
      </div>

      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="card bg-orange-50 border border-orange-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">🎯 親子任務進度</span>
              <span className="text-orange-700 font-bold">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TASK_TEMPLATES.map(task => (
              <motion.div
                key={task.id}
                whileHover={{ scale: 1.02 }}
                className={`card-hoverable cursor-pointer ${tasks.find(t => t.id === task.id)?.completed ? 'ring-2 ring-green-400 bg-green-50' : ''}`}
                onClick={() => toggleTask(task.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{task.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-primary">{task.title}</h4>
                    <p className="text-sm text-gray-500">{task.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={tasks.find(t => t.id === task.id)?.completed || false}
                    onChange={() => toggleTask(task.id)}
                    className="w-6 h-6 rounded"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'observations' && (
        <div className="space-y-4">
          <div className="card bg-green-50 border border-green-200">
            <h4 className="font-bold text-green-800 mb-2">🔍 自然觀察記錄</h4>
            <p className="text-green-700 text-sm">引導親子一起觀察自然，建立連結</p>
          </div>

          <div className="card">
            <div className="flex gap-2 mb-3">
              {['plant', 'insect', 'bird', 'mammal', 'other'].map(type => (
                <button
                  key={type}
                  className={`px-3 py-1 rounded-full text-sm ${obsType === type ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                  onClick={() => setObsType(type)}
                >
                  {type === 'plant' ? '🌿 植物' : type === 'insect' ? '🐛 昆蟲' : type === 'bird' ? '🐦 鳥類' : type === 'mammal' ? '🦊 哺乳類' : '🔮 其他'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 rounded-lg"
                placeholder="觀察到了什麼？"
                value={obsText}
                onChange={e => setObsText(e.target.value)}
              />
              <button className="btn-primary" onClick={addObservation}>記錄</button>
            </div>
          </div>

          {observations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-primary">觀察紀錄</h4>
              {observations.map((obs, i) => (
                <div key={i} className="card">
                  <div className="text-sm text-gray-500">{new Date(obs.date).toLocaleString('zh-TW')}</div>
                  <div className="mt-1">{obs.text}</div>
                  <span className="badge badge-info mt-1">{obs.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="card bg-purple-50 border border-purple-200">
            <h4 className="font-bold text-purple-800 mb-2">📸 家庭相簿</h4>
            <p className="text-purple-700 text-sm">記錄家庭日的每一刻美好</p>
          </div>

          <div className="card">
            <label className="btn-primary cursor-pointer">
              {uploading ? '上傳中...' : '📷 上傳照片'}
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img src={photo.url} alt="" className="w-full h-40 object-cover rounded-lg" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <a href={photo.url} target="_blank" rel="noreferrer" className="text-white text-sm">查看原圖</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'share' && (
        <div className="space-y-4">
          <div className="card bg-yellow-50 border border-yellow-200">
            <h4 className="font-bold text-yellow-800 mb-2">🖼️ 分享圖自動生成</h4>
            <p className="text-yellow-700 text-sm">一鍵生成家庭日成果分享圖，適合發 LINE / Facebook</p>
          </div>

          <button className="btn-primary w-full" onClick={generateShareImage}>
            🎨 產生分享圖
          </button>

          <canvas ref={canvasRef} width={600} height={400} className="hidden" />

          {shareImage && (
            <div className="space-y-3">
              <img src={shareImage} alt="分享圖" className="w-full rounded-lg shadow-lg" />
              <button className="btn-primary w-full" onClick={downloadShareImage}>
                ⬇️ 下載分享圖
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
