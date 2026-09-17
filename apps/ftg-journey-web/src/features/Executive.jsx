import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://journey-api.ftgtours.esggo.co';

export function ExecutiveTools({ journeyId }) {
  const token = localStorage.getItem('ftg_token');
  const [activeTab, setActiveTab] = useState('opportunity');
  const [opportunityData, setOpportunityData] = useState({ pain: '', opportunity: '', customer: '', solution: '' });
  const [roadmapData, setRoadmapData] = useState({ year1: '', year2: '', year3: '' });
  const [consensusData, setConsensusData] = useState({ consensus: '', pending: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (journeyId) {
      loadToolData('opportunity').then(d => d && setOpportunityData(d));
      loadToolData('roadmap').then(d => d && setRoadmapData(d));
      loadToolData('consensus').then(d => d && setConsensusData(d));
    }
  }, [journeyId]);

  const loadToolData = async (toolType) => {
    try {
      const res = await fetch(`${API_BASE}/api/journeys/${journeyId}/executive/${toolType}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return data.data || null;
    } catch (e) {
      console.error('載入失敗:', e);
      return null;
    }
  };

  const saveToolData = async (toolType, data) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`${API_BASE}/api/journeys/${journeyId}/executive/${toolType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error('儲存失敗:', e);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-primary">高階主管共識營</h3>
        {saved && <span className="text-green-600 text-sm">✓ 已儲存</span>}
      </div>
      
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['opportunity', 'roadmap', 'consensus'].map(tab => (
          <button key={tab} className={activeTab === tab ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab(tab)}>
            {tab === 'opportunity' ? '機會地圖' : tab === 'roadmap' ? '策略路徑' : '共識記錄'}
          </button>
        ))}
      </div>

      {activeTab === 'opportunity' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h4 className="font-bold mb-4">Opportunity Map 畫布</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm font-bold text-red-700 mb-2">痛點 / 風險</div>
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="目前遇到的挑戰..." value={opportunityData.pain || ''} onChange={e => setOpportunityData({ ...opportunityData, pain: e.target.value })} onBlur={() => saveToolData('opportunity', opportunityData)} />
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-bold text-green-700 mb-2">機會 / 優勢</div>
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="可把握的機會..." value={opportunityData.opportunity || ''} onChange={e => setOpportunityData({ ...opportunityData, opportunity: e.target.value })} onBlur={() => saveToolData('opportunity', opportunityData)} />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-bold text-blue-700 mb-2">顧客需求</div>
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="市場/客戶需求..." value={opportunityData.customer || ''} onChange={e => setOpportunityData({ ...opportunityData, customer: e.target.value })} onBlur={() => saveToolData('opportunity', opportunityData)} />
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm font-bold text-yellow-700 mb-2">解決方案</div>
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="可能的解法..." value={opportunityData.solution || ''} onChange={e => setOpportunityData({ ...opportunityData, solution: e.target.value })} onBlur={() => saveToolData('opportunity', opportunityData)} />
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={() => saveToolData('opportunity', opportunityData)} disabled={saving}>
            {saving ? '儲存中...' : '儲存畫布'}
          </button>
        </motion.div>
      )}

      {activeTab === 'roadmap' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h4 className="font-bold mb-4">3 年策略路徑追蹤</h4>
          <div className="space-y-4">
            {[
              { key: 'year1', label: 'Year 1: 基礎建設' },
              { key: 'year2', label: 'Year 2: 擴展深化' },
              { key: 'year3', label: 'Year 3: 生態圈' },
            ].map(({ key, label }) => (
              <div key={key} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-semibold text-primary">{label}</div>
                <textarea className="w-full mt-2 p-2 border border-gray-200 rounded text-sm" placeholder="目標與關鍵結果..." value={roadmapData[key] || ''} onChange={e => setRoadmapData({ ...roadmapData, [key]: e.target.value })} onBlur={() => saveToolData('roadmap', roadmapData)} />
                <div className="flex gap-2 mt-2">
                  <span className="badge badge-success">進行中</span>
                  <span className="badge badge-info">KR1</span>
                  <span className="badge badge-info">KR2</span>
                </div>
              </div>
            ))}
          </div>
          <button className="btn-primary mt-4" onClick={() => saveToolData('roadmap', roadmapData)} disabled={saving}>
            {saving ? '儲存中...' : '儲存路徑'}
          </button>
        </motion.div>
      )}

      {activeTab === 'consensus' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h4 className="font-bold mb-4">共識記錄工具</h4>
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="font-semibold text-purple-700">今日共識</div>
              <textarea className="w-full mt-2 p-2 border border-purple-200 rounded text-sm" placeholder="記錄達成的共識..." value={consensusData.consensus || ''} onChange={e => setConsensusData({ ...consensusData, consensus: e.target.value })} onBlur={() => saveToolData('consensus', consensusData)} />
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="font-semibold text-orange-700">待決事項</div>
              <textarea className="w-full mt-2 p-2 border border-orange-200 rounded text-sm" placeholder="需要進一步討論的項目..." value={consensusData.pending || ''} onChange={e => setConsensusData({ ...consensusData, pending: e.target.value })} onBlur={() => saveToolData('consensus', consensusData)} />
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={() => saveToolData('consensus', consensusData)} disabled={saving}>
            {saving ? '儲存中...' : '儲存記錄'}
          </button>
        </motion.div>
      )}
    </div>
  );
}
