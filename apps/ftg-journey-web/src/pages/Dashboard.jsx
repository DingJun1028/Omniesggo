import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

const STAGE_CONFIG = {
  planning: { label: '規劃中', color: 'bg-blue-100 text-blue-700', icon: '📋' },
  active: { label: '進行中', color: 'bg-green-100 text-green-700', icon: '🚀' },
  completed: { label: '已完成', color: 'bg-gray-100 text-gray-700', icon: '✅' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700', icon: '❌' },
};

const SERVICE_TYPES = [
  { value: 'all', label: '全部類型', icon: '🌐' },
  { value: 'corporate', label: '企業旅遊', icon: '🏢' },
  { value: 'family', label: '家庭日', icon: '👨‍👩‍👧' },
  { value: 'esg', label: 'ESG 永續', icon: '🌱' },
  { value: 'wellbeing', label: '身心健康', icon: '🧘' },
  { value: 'executive', label: '共識營', icon: '🤝' },
];

const SERVICE_ROUTES = {
  corporate: '/journey/',
  family: '/journey/',
  esg: '/journey/',
  wellbeing: '/journey/',
  executive: '/journey/',
};

export function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [newJourney, setNewJourney] = useState({
    title: '', destination: '', service_type: 'corporate',
    start_date: '', end_date: '', purpose: ''
  });

  const loadJourneys = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/journeys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('載入失敗');
      const data = await res.json();
      setJourneys(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadJourneys(); }, [token]);

  const filteredJourneys = useMemo(() => {
    return journeys.filter((j) => {
      const matchSearch = !searchQuery ||
        j.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.destination?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = filterStage === 'all' || j.stage === filterStage;
      const matchType = filterType === 'all' || j.service_type === filterType;
      return matchSearch && matchStage && matchType;
    });
  }, [journeys, searchQuery, filterStage, filterType]);

  const stats = useMemo(() => ({
    total: journeys.length,
    planning: journeys.filter((j) => j.stage === 'planning').length,
    active: journeys.filter((j) => j.stage === 'active').length,
    completed: journeys.filter((j) => j.stage === 'completed').length,
  }), [journeys]);

  const createJourney = async () => {
    if (!newJourney.title) return;
    const res = await fetch(`${API_BASE}/api/journeys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(newJourney),
    });
    const data = await res.json();
    const created = { ...newJourney, id: data.id, stage: 'planning' };
    setJourneys([created, ...journeys]);
    setShowCreate(false);
    setNewJourney({ title: '', destination: '', service_type: 'corporate', start_date: '', end_date: '', purpose: '' });
    // Navigate to the new journey
    navigate(`/journey/${data.id}`);
  };

  const handleJourneyClick = (j) => {
    if (j.service_type === 'wellbeing') {
      navigate(`/journey/${j.id}/wellbeing`);
    } else if (j.service_type === 'executive') {
      navigate(`/journey/${j.id}/executive`);
    } else if (j.service_type === 'family') {
      navigate(`/journey/${j.id}/family-day`);
    } else {
      navigate(`/journey/${j.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">旅程儀表板</h1>
          <p className="text-gray-500 mt-1 text-sm">歡迎回來，{user?.name || user?.email}</p>
        </div>
        <button className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors shadow-sm" onClick={() => setShowCreate(true)}>
          + 新增旅程
        </button>
      </div>

      {/* Quick Actions - Six Streams */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {SERVICE_TYPES.filter(t => t.value !== 'all').map((type) => (
          <button
            key={type.value}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all"
            onClick={() => setFilterType(type.value)}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="text-xs font-medium text-gray-700">{type.label}</span>
            <span className="text-xs text-gray-400">{journeys.filter(j => j.service_type === type.value).length} 個</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '全部', value: stats.total, color: 'bg-gray-50 text-gray-700' },
          { label: '規劃中', value: stats.planning, color: 'bg-blue-50 text-blue-700' },
          { label: '進行中', value: stats.active, color: 'bg-green-50 text-green-700' },
          { label: '已完成', value: stats.completed, color: 'bg-purple-50 text-purple-700' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1 opacity-75">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="🔍 搜尋旅程..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
          <option value="all">所有狀態</option>
          <option value="planning">規劃中</option>
          <option value="active">進行中</option>
          <option value="completed">已完成</option>
        </select>
        <select className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          {SERVICE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          ⚠️ {error}
          <button className="ml-3 underline" onClick={loadJourneys}>重試</button>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 rounded-2xl h-32" />
          ))}
        </div>
      ) : filteredJourneys.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <div className="text-5xl mb-4">🌍</div>
          <h3 className="text-lg font-semibold mb-2">{searchQuery || filterStage !== 'all' ? '沒有符合條件的旅程' : '還沒有旅程'}</h3>
          <p className="text-gray-500 mb-6 text-sm">{searchQuery || filterStage !== 'all' ? '試試其他搜尋條件' : '建立你的第一個 ESG 旅程，開始追蹤影響力'}</p>
          {!searchQuery && filterStage === 'all' && (
            <button className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors" onClick={() => setShowCreate(true)}>建立第一个旅程</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredJourneys.map((j, i) => (
              <motion.div
                key={j.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.03 }}
              >
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer h-full" onClick={() => handleJourneyClick(j)}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-base font-bold text-gray-900 line-clamp-1">{j.title}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_CONFIG[j.stage]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {STAGE_CONFIG[j.stage]?.icon} {STAGE_CONFIG[j.stage]?.label || j.stage}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1.5">
                    <div className="flex items-center gap-1.5">📍 {j.destination || '未設定目的地'}</div>
                    <div className="flex items-center gap-1.5">📅 {j.start_date} ~ {j.end_date}</div>
                    <div className="flex items-center gap-1.5">{SERVICE_TYPES.find((t) => t.value === j.service_type)?.icon} {SERVICE_TYPES.find((t) => t.value === j.service_type)?.label || j.service_type}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-gray-900 mb-6">新增旅程</h3>
              <div className="space-y-4">
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="旅程標題 *" value={newJourney.title} onChange={(e) => setNewJourney({ ...newJourney, title: e.target.value })} />
                <input className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="目的地" value={newJourney.destination} onChange={(e) => setNewJourney({ ...newJourney, destination: e.target.value })} />
                <select className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-white" value={newJourney.service_type} onChange={(e) => setNewJourney({ ...newJourney, service_type: e.target.value })}>
                  <option value="corporate">企業旅遊</option>
                  <option value="family">家庭日</option>
                  <option value="esg">ESG 永續</option>
                  <option value="wellbeing">身心健康</option>
                  <option value="executive">共識營</option>
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" value={newJourney.start_date} onChange={(e) => setNewJourney({ ...newJourney, start_date: e.target.value })} />
                  <input type="date" className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" value={newJourney.end_date} onChange={(e) => setNewJourney({ ...newJourney, end_date: e.target.value })} />
                </div>
                <textarea className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" placeholder="旅程目的" rows={3} value={newJourney.purpose} onChange={(e) => setNewJourney({ ...newJourney, purpose: e.target.value })} />
              </div>
              <div className="flex gap-3 mt-6 justify-end">
                <button className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors" onClick={() => setShowCreate(false)}>取消</button>
                <button className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50" onClick={createJourney} disabled={!newJourney.title}>建立</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
