import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';
import { Card, Button, Badge } from '../components/ui';
import { motion } from 'framer-motion';

export function JourneyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [journey, setJourney] = useState(null);
  const [prep, setPrep] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [notes, setNotes] = useState([]);
  const [tab, setTab] = useState('prep');

  useEffect(() => {
    api.get(`/api/journeys/${id}`, token).then(setJourney);
    api.get(`/api/journeys/${id}/prep`, token).then(setPrep);
    api.get(`/api/journeys/${id}/schedule`, token).then(setSchedule);
    api.get(`/api/journeys/${id}/notes`, token).then(setNotes);
  }, [id, token]);

  if (!journey) return <div style={{ padding: 48, textAlign: 'center' }}>載入中...</div>;

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>← 返回</Button>
      <Card style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#10243f' }}>{journey.title}</h1>
        <p style={{ color: '#6b7280', marginTop: 8 }}>{journey.destination} · {journey.start_date} ~ {journey.end_date}</p>
      </Card>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['prep', 'schedule', 'notes', 'impact'].map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'ghost'} onClick={() => setTab(t)}>
            {t === 'prep' ? '準備事項' : t === 'schedule' ? '行程' : t === 'notes' ? '筆記' : '影響力'}
          </Button>
        ))}
      </div>

      {tab === 'prep' && (
        <div>
          {prep.map((p) => (
            <Card key={p.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <input type="checkbox" checked={!!p.done} readOnly />
              <span style={{ textDecoration: p.done ? 'line-through' : 'none' }}>{p.text}</span>
            </Card>
          ))}
        </div>
      )}

      {tab === 'schedule' && (
        <div>
          {schedule.map((s) => (
            <Card key={s.id} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: '#6b7280' }}>{s.date} {s.time} · {s.location}</div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'notes' && (
        <div>
          {notes.map((n) => (
            <Card key={n.id} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{n.date} · {n.mood}</div>
              <div style={{ marginTop: 4 }}>{n.text}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
