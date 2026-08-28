import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

const SAFETY_CHECKLIST = [
  { id: 'gear', category: '裝備檢查', items: ['登山鞋/運動鞋', '雨具（雨衣/雨傘）', '防曬用品（帽子、防曬乳）', '個人藥品', '足夠飲用水' ]},
  { id: 'health', category: '健康評估', items: ['確認參與者無重大疾病', '準備急救包', '確認最近醫療站位置', '準備緊急連絡卡' ]},
  { id: 'weather', category: '天氣確認', items: ['出發前確認天氣預報', '準備備案路線', '確認撤退點位置' ]},
  { id: 'safety', category: '安全須知', items: ['行前安全簡報', '確認通訊設備', '指定安全官', '建立緊急聯絡群組' ]},
];

const ESG_TASKS = [
  { id: 'cleanup', title: 'Clean-up Walk', icon: '🗑️', desc: '沿途撿拾垃圾，記錄數量與類型' },
  { id: 'carbon', title: '碳足跡記錄', icon: '🌱', desc: '記錄交通方式，估算碳排放' },
  { id: 'biodiversity', title: '生態觀察', icon: '🦋', desc: '記錄觀察到的動植物物種' },
  { id: 'local', title: '地方支持', icon: '🏪', desc: '在地商家消費紀錄' },
  { id: 'water', title: '水資源', icon: '💧', desc: '紀錄用水量，實踐節約' },
  { id: 'waste', title: '廢棄物減量', icon: '♻️', desc: '自備餐具、減少一次性廢棄物' },
];

export function JourneyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('ftg_token');
  const [journey, setJourney] = useState(null);
  const [prep, setPrep] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState('safety');
  const [safetyChecked, setSafetyChecked] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/api/journeys/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setJourney);
    fetch(`${API_BASE}/api/journeys/${id}/prep`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setPrep);
    fetch(`${API_BASE}/api/journeys/${id}/schedule`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setSchedule);
    fetch(`${API_BASE}/api/journeys/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setNotes);
  }, [id, token]);

  if (!journey) return <div className="py-12 text-center">載入中...</div>;

  const toggleSafety = (item) => {
    setSafetyChecked(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const completedSafety = Object.values(safetyChecked).filter(Boolean).length;
  const totalSafety = SAFETY_CHECKLIST.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button className="btn-outline" onClick={() => navigate('/')}>← 返回</button>
        <button className="btn-primary" onClick={() => navigate(`/journey/${id}/impact-note`)}>
          📊 Impact Note
        </button>
      </div>

      <div className="card mb-6">
        <h1 className="text-2xl font-extrabold text-primary">{journey.title}</h1>
        <p className="text-gray-500 mt-2">{journey.destination} · {journey.start_date} ~ {journey.end_date}</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['safety', 'prep', 'esg', 'schedule', 'notes'].map(t => (
          <button key={t} className={tab === t ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(t)}>
            {t === 'safety' ? '⚠️ 安全' : t === 'prep' ? '✅ 準備' : t === 'esg' ? '🌱 ESG' : t === 'schedule' ? '📅 行程' : '📝 筆記'}
          </button>
        ))}
      </div>

      {tab === 'safety' && (
        <div className="space-y-4">
          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">安全檢查進度</span>
              <span className="text-yellow-700 font-bold">{completedSafety}/{totalSafety}</span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${(completedSafety/totalSafety)*100}%` }} />
            </div>
          </div>

          {SAFETY_CHECKLIST.map(cat => (
            <div key={cat.id} className="card">
              <h3 className="font-bold text-primary mb-3">{cat.category}</h3>
              <div className="space-y-2">
                {cat.items.map(item => (
                  <label key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input type="checkbox" checked={!!safetyChecked[item]} onChange={() => toggleSafety(item)} className="w-5 h-5 rounded" />
                    <span className={safetyChecked[item] ? 'line-through text-gray-400' : ''}>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'prep' && (
        <div className="space-y-2">
          {prep.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
              <input type="checkbox" checked={!!p.done} readOnly className="w-5 h-5" />
              <span className={p.done ? 'line-through text-gray-400' : ''}>{p.text}</span>
              <span className="badge badge-info ml-auto">{p.category}</span>
            </div>
          ))}
          {prep.length === 0 && <p className="text-gray-500 text-center py-8">尚未新增準備事項</p>}
        </div>
      )}

      {tab === 'esg' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ESG_TASKS.map(task => (
            <motion.div key={task.id} whileHover={{ scale: 1.02 }} className="card-hoverable">
              <div className="text-3xl mb-3">{task.icon}</div>
              <h4 className="font-bold text-primary">{task.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{task.desc}</p>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="space-y-2">
          {schedule.map(s => (
            <div key={s.id} className="card">
              <div className="font-semibold">{s.title}</div>
              <div className="text-sm text-gray-500">{s.date} {s.time} · {s.location}</div>
            </div>
          ))}
          {schedule.length === 0 && <p className="text-gray-500 text-center py-8">尚未新增行程</p>}
        </div>
      )}

      {tab === 'notes' && (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="card">
              <div className="text-xs text-gray-500">{n.date} · {n.mood}</div>
              <div className="mt-1">{n.text}</div>
            </div>
          ))}
          {notes.length === 0 && <p className="text-gray-500 text-center py-8">尚未新增筆記</p>}
        </div>
      )}
    </div>
  );
}
