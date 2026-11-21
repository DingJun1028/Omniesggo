import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

const WELLBEING_MODULES = [
  { id: 'diagnosis', title: '需求診斷', icon: '📋', desc: '壓力檢測、生活品質評估、個人化建議' },
  { id: 'nature', title: '自然修復', icon: '🌲', desc: '森林療癒、五感體驗、生態導覽' },
  { id: 'mindfulness', title: '正念練習', icon: '🧘', desc: '呼吸練習、冥想引導、身體掃描' },
  { id: 'exercise', title: '運動負荷', icon: '💪', desc: '分級運動處方、心率監控、安全提醒' },
  { id: 'digital', title: '數位排毒', icon: '📵', desc: '科技斷連、深度對話、品質睡眠' },
  { id: 'followup', title: '30-day 追蹤', icon: '📈', desc: '日記提醒、進度可視化、週期回顧' },
];

const DIAGNOSIS_QUESTIONS = [
  { id: 'stress_level', label: '目前壓力程度', type: 'scale', min: 1, max: 10, desc: '1=極低, 10=極高' },
  { id: 'sleep_quality', label: '睡眠品質', type: 'scale', min: 1, max: 10, desc: '1=極差, 10=極佳' },
  { id: 'energy_level', label: '活力程度', type: 'scale', min: 1, max: 10, desc: '1=極低, 10=極高' },
  { id: 'work_life_balance', label: '工作生活平衡', type: 'scale', min: 1, max: 10, desc: '1=嚴重失衡, 10=完美平衡' },
  { id: 'exercise_frequency', label: '每周運動次數', type: 'number', placeholder: '每周運動幾次？' },
  { id: 'nature_connection', label: '與自然連結感', type: 'scale', min: 1, max: 10, desc: '1=完全脫節, 10=深度連結' },
  { id: 'digital_overload', label: '數位過載感', type: 'scale', min: 1, max: 10, desc: '1=無, 10=非常嚴重' },
  { id: 'main_concern', label: '最想改善的問題', type: 'textarea', placeholder: '你最希望透過這趟旅程改善什麼？' },
  { id: 'expectation', label: '對這趟旅程的期待', type: 'textarea', placeholder: '你希望旅程結束後，你能獲得什麼？' },
];

export function WellbeingFeature({ journeyId }) {
  const token = localStorage.getItem('ftg_token');
  const [activeTab, setActiveTab] = useState('modules');
  const [diagnosis, setDiagnosis] = useState({});
  const [followUps, setFollowUps] = useState([]);
  const [currentMood, setCurrentMood] = useState('');
  const [currentNote, setCurrentNote] = useState('');
  const [currentEnergy, setCurrentEnergy] = useState(5);
  const [followDay, setFollowDay] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (journeyId) {
      fetch(`${API_BASE}/api/journeys/${journeyId}/wellbeing/diagnosis`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(data => { if (data.data) setDiagnosis(data.data); });
      fetch(`${API_BASE}/api/journeys/${journeyId}/wellbeing/followup`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(setFollowUps);
    }
  }, [journeyId, token]);

  const saveDiagnosis = async (field, value) => {
    const updated = { ...diagnosis, [field]: value };
    setDiagnosis(updated);
    setSaving(true);
    await fetch(`${API_BASE}/api/journeys/${journeyId}/wellbeing/diagnosis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ data: updated }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const submitFollowUp = async () => {
    if (!currentMood) return;
    setSaving(true);
    await fetch(`${API_BASE}/api/journeys/${journeyId}/wellbeing/followup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ day: followDay, mood: currentMood, energy: currentEnergy, note: currentNote }),
    });
    const updated = await fetch(`${API_BASE}/api/journeys/${journeyId}/wellbeing/followup`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json());
    setFollowUps(updated);
    setSaving(false);
    setFollowDay(prev => prev + 1);
    setCurrentMood('');
    setCurrentNote('');
    setCurrentEnergy(5);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getAverageEnergy = () => {
    if (followUps.length === 0) return 0;
    return (followUps.reduce((sum, e) => sum + (e.energy || 0), 0) / followUps.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-primary">員工身心平衡</h3>
        {saving && <span className="text-sm text-gray-400">儲存中...</span>}
        {saved && <span className="text-sm text-green-500">✓ 已儲存</span>}
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['modules', 'diagnosis', 'followup'].map(tab => (
          <button key={tab} className={activeTab === tab ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab(tab)}>
            {tab === 'modules' ? '模組總覽' : tab === 'diagnosis' ? '📋 需求診斷' : '📈 30-day 追蹤'}
          </button>
        ))}
      </div>

      {activeTab === 'modules' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {WELLBEING_MODULES.map(mod => (
            <motion.div
              key={mod.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="card-hoverable cursor-pointer"
              onClick={() => {
                if (mod.id === 'diagnosis') setActiveTab('diagnosis');
                if (mod.id === 'followup') setActiveTab('followup');
              }}
            >
              <div className="text-4xl mb-3">{mod.icon}</div>
              <h4 className="font-bold text-primary">{mod.title}</h4>
              <p className="text-sm text-gray-500 mt-1">{mod.desc}</p>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'diagnosis' && (
        <div className="space-y-4">
          <div className="card bg-green-50 border border-green-200">
            <h4 className="font-bold text-green-800 mb-2">需求診斷</h4>
            <p className="text-green-700 text-sm">完成以下問卷，幫助我們為你設計最適合的復元旅程</p>
          </div>

          {DIAGNOSIS_QUESTIONS.map(q => (
            <div key={q.id} className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">{q.label}</label>
              {q.type === 'scale' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{q.min}</span>
                    <input
                      type="range"
                      min={q.min}
                      max={q.max}
                      value={diagnosis[q.id] || q.min}
                      onChange={e => saveDiagnosis(q.id, Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-400">{q.max}</span>
                    <span className="text-lg font-bold text-green-700 w-8 text-center">{diagnosis[q.id] || '-'}</span>
                  </div>
                  {q.desc && <p className="text-xs text-gray-400">{q.desc}</p>}
                </div>
              )}
              {q.type === 'number' && (
                <input
                  type="number"
                  placeholder={q.placeholder}
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={diagnosis[q.id] || ''}
                  onChange={e => saveDiagnosis(q.id, e.target.value)}
                />
              )}
              {q.type === 'textarea' && (
                <textarea
                  placeholder={q.placeholder}
                  className="w-full h-20 p-2 border border-gray-200 rounded-lg resize-none"
                  value={diagnosis[q.id] || ''}
                  onChange={e => saveDiagnosis(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'followup' && (
        <div className="space-y-4">
          <div className="card bg-blue-50 border border-blue-200">
            <h4 className="font-bold text-blue-800 mb-2">30-day 追蹤</h4>
            <p className="text-blue-700 text-sm">每天記錄你的心情與能量，追蹤復元進度</p>
            <div className="flex gap-4 mt-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{followUps.length}</div>
                <div className="text-xs text-blue-600">已記錄天數</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{getAverageEnergy()}</div>
                <div className="text-xs text-blue-600">平均能量</div>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 className="font-bold mb-3">Day {followDay} 日記</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">今天的心情</label>
                <div className="flex gap-2">
                  {['😊', '😔', '😤', '😌', '🤔', '😴', '🥳', '😰'].map(mood => (
                    <button
                      key={mood}
                      className={`text-3xl p-2 rounded-lg transition ${currentMood === mood ? 'bg-yellow-100 ring-2 ring-yellow-400' : 'hover:bg-gray-100'}`}
                      onClick={() => setCurrentMood(mood)}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">能量程度: {currentEnergy}/10</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={currentEnergy}
                  onChange={e => setCurrentEnergy(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">今天的心得</label>
                <textarea
                  className="w-full h-20 p-2 border border-gray-200 rounded-lg resize-none"
                  placeholder="今天感覺如何？有什麼想法？"
                  value={currentNote}
                  onChange={e => setCurrentNote(e.target.value)}
                />
              </div>
              <button className="btn-primary w-full" onClick={submitFollowUp} disabled={!currentMood || saving}>
                {saving ? '記錄中...' : `記錄 Day ${followDay}`}
              </button>
            </div>
          </div>

          {followUps.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-bold text-primary">追蹤紀錄</h4>
              {followUps.map(entry => (
                <div key={entry.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{entry.mood}</span>
                      <span className="font-semibold">Day {entry.day}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      能量: {entry.energy}/10
                    </div>
                  </div>
                  {entry.note && <p className="mt-1 text-sm text-gray-600">{entry.note}</p>}
                  <div className="text-xs text-gray-400 mt-1">{new Date(entry.created_at).toLocaleDateString('zh-TW')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
