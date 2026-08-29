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
  { id: 'cleanup', title: 'Clean-up Walk', icon: '🗑️', desc: '沿途撿拾垃圾，記錄數量與類型', unit: '件', color: 'green', fields: [
    { name: 'count', label: '垃圾數量', type: 'number', placeholder: '撿了幾件垃圾？' },
    { name: 'weight', label: '預估重量 (kg)', type: 'number', placeholder: '有多重？' },
    { name: 'types', label: '垃圾類型', type: 'text', placeholder: '塑膠、玻璃、金屬...' },
  ]},
  { id: 'carbon', title: '碳足跡記錄', icon: '🌱', desc: '記錄交通方式，估算碳排放', unit: 'kg', color: 'teal', fields: [
    { name: 'distance', label: '距離 (km)', type: 'number', placeholder: '移動距離' },
    { name: 'mode', label: '交通方式', type: 'select', options: ['步行', '腳踏車', '公車/捷運', '火車', '汽車', '飛機'] },
    { name: 'passengers', label: '同行人數', type: 'number', placeholder: '共乘人數' },
  ]},
  { id: 'biodiversity', title: '生態觀察', icon: '🦋', desc: '記錄觀察到的動植物物種', unit: '種', color: 'purple', fields: [
    { name: 'species', label: '物種名稱', type: 'text', placeholder: '觀察到什麼？' },
    { name: 'count', label: '數量', type: 'number', placeholder: '幾隻/棵？' },
    { name: 'habitat', label: '棲息環境', type: 'select', options: ['森林', '水域', '草地', '濕地', '農田', '居家周遭'] },
  ]},
  { id: 'local', title: '地方支持', icon: '🏪', desc: '在地商家消費紀錄', unit: '元', color: 'orange', fields: [
    { name: 'business', label: '商家名稱', type: 'text', placeholder: '在哪裡消費？' },
    { name: 'amount', label: '消費金額', type: 'number', placeholder: '花了多少錢？' },
    { name: 'category', label: '消費類型', type: 'select', options: ['餐飲', '住宿', '伴手禮', '體驗活動', '交通', '其他'] },
  ]},
  { id: 'water', title: '水資源', icon: '💧', desc: '紀錄用水量，實踐節約', unit: 'L', color: 'blue', fields: [
    { name: 'amount', label: '用水量 (公升)', type: 'number', placeholder: '用了多少水？' },
    { name: 'purpose', label: '用途', type: 'select', options: ['飲用', '清洗', '淋浴', '烹飪', '其他'] },
    { name: 'saved', label: '節約量 (公升)', type: 'number', placeholder: '節省了多少？' },
  ]},
  { id: 'waste', title: '廢棄物減量', icon: '♻️', desc: '自備餐具、減少一次性廢棄物', unit: '件', color: 'emerald', fields: [
    { name: 'items', label: '減少的一次性用品', type: 'text', placeholder: '自備了什麼？' },
    { name: 'count', label: '數量', type: 'number', placeholder: '減少了幾件？' },
    { name: 'reusable', label: '替代方案', type: 'select', options: ['自備餐具', '自備水壺', '自備購物袋', '自備容器', '其他'] },
  ]},
];

export function JourneyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('ftg_token');
  const [journey, setJourney] = useState(null);
  const [prep, setPrep] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState('safety');
  const [safetyChecked, setSafetyChecked] = useState({});
  const [checkinCount, setCheckinCount] = useState(0);
  const [checkinRate, setCheckinRate] = useState(0);
  const [esgTasks, setEsgTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [taskForm, setTaskForm] = useState({});
  const [taskLog, setTaskLog] = useState([]);
  const [totalImpact, setTotalImpact] = useState({});
  const [userBadges, setUserBadges] = useState([]);
  const [badgeNotification, setBadgeNotification] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/journeys/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setJourney);
    fetch(`${API_BASE}/api/journeys/${id}/prep`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setPrep);
    fetch(`${API_BASE}/api/journeys/${id}/schedule`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setSchedule);
    fetch(`${API_BASE}/api/journeys/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setNotes);
    fetch(`${API_BASE}/api/journeys/${id}/checkins`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => {
      setCheckins(data);
      setCheckinCount(data.length);
    });
    fetch(`${API_BASE}/api/journeys/${id}/summary`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => {
      setSummary(data);
      if (data?.stats) setCheckinRate(data.stats.checkin_rate);
    });
    fetch(`${API_BASE}/api/journeys/${id}/esg-tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(data => {
      setEsgTasks(data.tasks || []);
      setTaskLog(data.logs || []);
      setTotalImpact(data.totals || {});
    });
    fetch(`${API_BASE}/api/me/badges`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setUserBadges);
  }, [id, token]);

  const showBadgeNotification = (badges) => {
    if (badges && badges.length > 0) {
      setBadgeNotification(badges[0]);
      setTimeout(() => setBadgeNotification(null), 4000);
    }
  };

  const openTask = (task) => {
    setActiveTask(task);
    const initialForm = {};
    task.fields.forEach(f => { initialForm[f.name] = ''; });
    setTaskForm(initialForm);
  };

  const updateFormField = (name, value) => {
    setTaskForm(prev => ({ ...prev, [name]: value }));
  };

  const submitTask = async () => {
    if (!activeTask) return;
    try {
      const res = await fetch(`${API_BASE}/api/journeys/${id}/esg-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ task_id: activeTask.id, data: taskForm }),
      });
      const data = await res.json();
      if (data.id) {
        showBadgeNotification(data.newBadges);
        // Refresh task data
        const updated = await fetch(`${API_BASE}/api/journeys/${id}/esg-tasks`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setEsgTasks(updated.tasks || []);
        setTaskLog(updated.logs || []);
        setTotalImpact(updated.totals || {});
        setActiveTask(null);
        setTaskForm({});
        // Refresh badges
        const badges = await fetch(`${API_BASE}/api/me/badges`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setUserBadges(badges);
      }
    } catch (e) {
      console.error('任務提交失敗:', e);
    }
  };

  const handleCheckin = async () => {
    let latitude = null, longitude = null;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
          await doCheckin(latitude, longitude);
        },
        async () => {
          await doCheckin(null, null);
        }
      );
    } else {
      await doCheckin(null, null);
    }
  };

  const doCheckin = async (latitude, longitude) => {
    try {
      const res = await fetch(`${API_BASE}/api/journeys/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ latitude, longitude, note: '' }),
      });
      const data = await res.json();
      if (data.id) {
        showBadgeNotification(data.newBadges);
        // Refresh checkins and summary
        const updated = await fetch(`${API_BASE}/api/journeys/${id}/checkins`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setCheckins(updated);
        setCheckinCount(updated.length);
        const sumRes = await fetch(`${API_BASE}/api/journeys/${id}/summary`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setSummary(sumRes);
        if (sumRes?.stats) setCheckinRate(sumRes.stats.checkin_rate);
        // Refresh badges
        const badges = await fetch(`${API_BASE}/api/me/badges`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setUserBadges(badges);
      }
    } catch (e) {
      console.error('簽到失敗:', e);
    }
  };

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
        {['safety', 'prep', 'esg', 'schedule', 'notes', 'checkin', 'summary', 'badges'].map(t => (
          <button key={t} className={tab === t ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(t)}>
            {t === 'safety' ? '⚠️ 安全' : t === 'prep' ? '✅ 準備' : t === 'esg' ? '🌱 ESG' : t === 'schedule' ? '📅 行程' : t === 'notes' ? '📝 筆記' : t === 'checkin' ? '📍 簽到' : t === 'summary' ? '📊 摘要' : '🏆 勳章'}
          </button>
        ))}
      </div>

      {badgeNotification && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 text-yellow-900 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="text-4xl">{badgeNotification.icon}</div>
          <div>
            <div className="text-sm font-bold">🎉 獲得勳章！</div>
            <div className="text-lg font-extrabold">{badgeNotification.name}</div>
            <div className="text-xs">{badgeNotification.description}</div>
          </div>
        </motion.div>
      )}

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
        <div className="space-y-4">
          <div className="card bg-green-50 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">ESG 任務影響力</span>
              <span className="text-green-700 font-bold">{taskLog.length} 筆記錄</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{totalImpact.cleanup || 0}</div>
                <div className="text-xs text-green-600">件垃圾</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{totalImpact.carbon || 0}</div>
                <div className="text-xs text-green-600">kg CO₂</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{totalImpact.biodiversity || 0}</div>
                <div className="text-xs text-green-600">種觀察</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ESG_TASKS.map(task => (
              <motion.div key={task.id} whileHover={{ scale: 1.02 }} className="card-hoverable" onClick={() => openTask(task)}>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{task.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-primary">{task.title}</h4>
                    <p className="text-sm text-gray-500">{task.desc}</p>
                  </div>
                  {totalImpact[task.id] && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-700">{totalImpact[task.id]}</div>
                      <div className="text-xs text-gray-400">{task.unit}</div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {taskLog.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-primary">任務紀錄</h4>
              {taskLog.map(log => (
                <div key={log.id} className="card">
                  <div className="flex items-center gap-2">
                    <span>{ESG_TASKS.find(t => t.id === log.task_id)?.icon}</span>
                    <span className="font-semibold">{ESG_TASKS.find(t => t.id === log.task_id)?.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(log.created_at).toLocaleString('zh-TW')}</span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {Object.entries(log.data).map(([k, v]) => (
                      <span key={k} className="mr-3"><span className="text-gray-400">{k}:</span> {v}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-4xl">{activeTask.icon}</div>
              <div>
                <h3 className="text-xl font-bold text-primary">{activeTask.title}</h3>
                <p className="text-sm text-gray-500">{activeTask.desc}</p>
              </div>
            </div>

            <div className="space-y-3">
              {activeTask.fields.map(field => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                  {field.type === 'select' ? (
                    <select className="w-full p-2 border border-gray-200 rounded-lg" value={taskForm[field.name] || ''} onChange={e => updateFormField(field.name, e.target.value)}>
                      <option value="">請選擇...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full p-2 border border-gray-200 rounded-lg"
                      value={taskForm[field.name] || ''}
                      onChange={e => updateFormField(field.name, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-6">
              <button className="btn-primary flex-1" onClick={submitTask}>提交記錄</button>
              <button className="btn-outline" onClick={() => setActiveTask(null)}>取消</button>
            </div>
          </motion.div>
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

      {tab === 'checkin' && (
        <div className="space-y-4">
          <div className="card bg-green-50 border border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">現場簽到</span>
              <span className="text-green-700 font-bold">{checkinCount} 人</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${checkinRate}%` }} />
            </div>
            <p className="text-sm text-green-600 mt-2">簽到率 {checkinRate}%</p>
          </div>

          <button className="btn-primary w-full" onClick={handleCheckin}>
            📍 立即簽到
          </button>

          <div className="space-y-2">
            <h4 className="font-bold text-primary">簽到記錄</h4>
            {checkins.length === 0 ? (
              <p className="text-gray-500 text-center py-8">尚無簽到紀錄</p>
            ) : (
              checkins.map(c => (
                <div key={c.id} className="card">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(c.created_at).toLocaleString('zh-TW')}
                    {c.latitude && ` · 📍 ${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`}
                  </div>
                  {c.note && <div className="mt-1 text-sm">{c.note}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="space-y-4">
          {summary ? (
            <>
              <div className="card bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2">旅程摘要</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.member_count}</div>
                    <div className="text-xs text-blue-600">成員數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.checkin_count}</div>
                    <div className="text-xs text-blue-600">簽到數</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.prep_rate}%</div>
                    <div className="text-xs text-blue-600">準備完成率</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{summary.stats.note_count}</div>
                    <div className="text-xs text-blue-600">筆記數</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-bold text-primary mb-3">數據統計</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>行程數</span>
                    <span className="font-semibold">{summary.stats.schedule_count}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>準備完成率</span>
                    <span className="font-semibold">{summary.stats.prep_done}/{summary.stats.prep_total}</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>簽到率</span>
                    <span className="font-semibold">{summary.stats.checkin_rate}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>影響力指標</span>
                    <span className="font-semibold">{summary.stats.impact_count}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h4 className="font-bold text-primary mb-3">心情分佈</h4>
                {Object.keys(summary.stats.mood_distribution).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">暫無心情記錄</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(summary.stats.mood_distribution).map(([mood, count]) => (
                      <div key={mood} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{mood}</span>
                        <span className="font-semibold">{count} 次</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 text-center">
                摘要生成於 {new Date(summary.generated_at).toLocaleString('zh-TW')}
              </div>
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">載入中...</p>
          )}
        </div>
      )}

      {tab === 'badges' && (
        <div className="space-y-4">
          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold">🏆 我的永續勳章</span>
              <span className="text-yellow-700 font-bold">{userBadges.length} 枚</span>
            </div>
            <p className="text-sm text-yellow-600 mt-2">每完成一項任務，即可獲得對應的永續標誌，記錄你的每一份努力！</p>
          </div>

          {userBadges.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {userBadges.map(ub => (
                <motion.div key={ub.id} whileHover={{ scale: 1.05 }} className="card text-center bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200">
                  <div className="text-5xl mb-3">{ub.icon}</div>
                  <div className="font-bold text-primary">{ub.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{ub.description}</div>
                  <div className="text-xs text-yellow-600 mt-2">✦ {ub.requirement}</div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-gray-500">尚未獲得任何勳章</p>
              <p className="text-sm text-gray-400 mt-2">完成 ESG 任務、簽到、寫筆記即可獲得勳章！</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
