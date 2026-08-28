import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { Card, Button, Badge } from '../components/ui';
import { motion } from 'framer-motion';

export function Dashboard() {
  const { user, token } = useAuth();
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newJourney, setNewJourney] = useState({ title: '', destination: '', service_type: 'corporate', start_date: '', end_date: '', purpose: '' });

  useEffect(() => {
    api.get('/api/journeys', token).then(setJourneys).catch(() => setJourneys([])).finally(() => setLoading(false));
  }, [token]);

  const createJourney = async () => {
    const res = await api.post('/api/journeys', newJourney, token);
    setJourneys([{ ...newJourney, id: res.id, stage: 'planning' }, ...journeys]);
    setShowCreate(false);
    setNewJourney({ title: '', destination: '', service_type: 'corporate', start_date: '', end_date: '', purpose: '' });
  };

  const stageColors = { planning: 'info', active: 'success', completed: 'default', cancelled: 'error' };
  const stageLabels = { planning: '規劃中', active: '進行中', completed: '已完成', cancelled: '已取消' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#10243f' }}>旅程儀表板</h1>
          <p style={{ color: '#6b7280', marginTop: 4 }}>歡迎回來，{user?.name || user?.email}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>+ 新增旅程</Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280' }}>載入中...</div>
      ) : journeys.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🌍</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>還沒有旅程</h3>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>建立你的第一個 ESG 旅程，開始追蹤影響力</p>
          <Button onClick={() => setShowCreate(true)}>建立第一個旅程</Button>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {journeys.map((j, i) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card hoverable style={{ cursor: 'pointer' }} onClick={() => window.location.hash = `/journey/${j.id}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#10243f' }}>{j.title}</h3>
                  <Badge variant={stageColors[j.stage]}>{stageLabels[j.stage]}</Badge>
                </div>
                <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.8 }}>
                  <div>📍 {j.destination || '未設定目的地'}</div>
                  <div>📅 {j.start_date} ~ {j.end_date}</div>
                  <div>🏷️ {j.service_type}</div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }} onClick={() => setShowCreate(false)}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#fff', borderRadius: 16, padding: 32, maxWidth: 480, width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: '#10243f' }}>新增旅程</h3>
            <div style={{ display: 'grid', gap: 12 }}>
              <input placeholder="旅程標題" value={newJourney.title} onChange={(e) => setNewJourney({ ...newJourney, title: e.target.value })} style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none' }} />
              <input placeholder="目的地" value={newJourney.destination} onChange={(e) => setNewJourney({ ...newJourney, destination: e.target.value })} style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none' }} />
              <select value={newJourney.service_type} onChange={(e) => setNewJourney({ ...newJourney, service_type: e.target.value })} style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none' }}>
                <option value="corporate">企業旅遊</option>
                <option value="esg">ESG 永續</option>
                <option value="wellbeing">戶外健康</option>
                <option value="custom">客製行程</option>
              </select>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="date" value={newJourney.start_date} onChange={(e) => setNewJourney({ ...newJourney, start_date: e.target.value })} style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none' }} />
                <input type="date" value={newJourney.end_date} onChange={(e) => setNewJourney({ ...newJourney, end_date: e.target.value })} style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none' }} />
              </div>
              <textarea placeholder="旅程目的" value={newJourney.purpose} onChange={(e) => setNewJourney({ ...newJourney, purpose: e.target.value })} rows={3} style={{ padding: '10px 14px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 15, outline: 'none', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <Button variant="ghost" onClick={() => setShowCreate(false)}>取消</Button>
              <Button onClick={createJourney} disabled={!newJourney.title}>建立</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
