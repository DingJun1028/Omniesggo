import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

export function ImpactNotePage() {
  const { id } = useParams();
  const token = localStorage.getItem('ftg_token');
  const [journey, setJourney] = useState(null);
  const [impact, setImpact] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetch(`${API_BASE}/api/journeys/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setJourney);
    fetch(`${API_BASE}/api/journeys/${id}/impact`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setImpact);
    fetch(`${API_BASE}/api/journeys/${id}/notes`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setNotes);
  }, [id, token]);

  if (!journey) return <div className="py-12 text-center">載入中...</div>;

  const totalImpact = impact.reduce((sum, i) => sum + (i.value || 0), 0);
  const impactByMetric = impact.reduce((acc, i) => {
    acc[i.metric_id] = (acc[i.metric_id] || 0) + i.value;
    return acc;
  }, {});

  const metrics = [
    { id: 'participants', label: '參與人次', icon: '👥', unit: '人' },
    { id: 'carbon_saved', label: '碳減量', icon: '🌱', unit: 'kg' },
    { id: 'distance', label: '步行距離', icon: '🚶', unit: 'km' },
    { id: 'satisfaction', label: '滿意度', icon: '⭐', unit: '/5' },
    { id: 'volunteer_hours', label: '志工時數', icon: '⏱️', unit: '小時' },
    { id: 'trees_planted', label: '植樹數量', icon: '🌳', unit: '棵' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-extrabold text-primary mb-2">ESG Impact Note</h1>
        <p className="text-gray-500 mb-8">{journey.title} · {journey.destination}</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200 pb-2">
        {['overview', 'metrics', 'notes', 'export'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab === 'overview' ? '總覽' : tab === 'metrics' ? '數據' : tab === 'notes' ? '回饋' : '匯出'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map(m => (
              <div key={m.id} className="card text-center">
                <div className="text-3xl mb-2">{m.icon}</div>
                <div className="text-2xl font-bold text-primary">{impactByMetric[m.id] || 0}</div>
                <div className="text-sm text-gray-500">{m.label} ({m.unit})</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 className="font-bold text-lg mb-4">ESG 指標摘要</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="text-sm">環境面</span>
                <span className="font-semibold text-green-700">{impactByMetric.carbon_saved || 0} kg 碳減量</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm">社會面</span>
                <span className="font-semibold text-blue-700">{impactByMetric.participants || 0} 人次參與</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-sm">治理面</span>
                <span className="font-semibold text-yellow-700">{impactByMetric.volunteer_hours || 0} 志工時數</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">影響力數據</h3>
          {impact.length === 0 ? (
            <p className="text-gray-500 text-center py-8">尚未記錄數據</p>
          ) : (
            <div className="space-y-2">
              {impact.map(i => (
                <div key={i.id} className="flex justify-between items-center p-3 border-b border-gray-100">
                  <span className="text-sm">{i.metric_id}</span>
                  <span className="font-semibold">{i.value} {i.note && <span className="text-gray-400 font-normal">— {i.note}</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="card">
          <h3 className="font-bold text-lg mb-4">參與者回饋</h3>
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">尚無回饋記錄</p>
          ) : (
            <div className="space-y-3">
              {notes.map(n => (
                <div key={n.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500 mb-1">{n.date} · {n.mood}</div>
                  <p className="text-sm">{n.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'export' && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-xl font-bold mb-2">報告匯出</h3>
          <p className="text-gray-500 mb-6">產生 PDF / PowerPoint 格式的 Impact Note</p>
          <button className="btn-primary" onClick={() => window.print()}>🖨️ 列印 / 儲存 PDF</button>
        </div>
      )}
    </div>
  );
}
