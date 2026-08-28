import { useState } from 'react';
import { motion } from 'framer-motion';

export function ExecutiveTools() {
  const [activeTab, setActiveTab] = useState('opportunity');

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-primary">高階主管共識營</h3>
      
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
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="目前遇到的挑戰..." />
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm font-bold text-green-700 mb-2">機會 / 優勢</div>
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="可把握的機會..." />
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-bold text-blue-700 mb-2">顧客需求</div>
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="市場/客戶需求..." />
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm font-bold text-yellow-700 mb-2">解決方案</div>
              <textarea className="w-full h-20 bg-transparent border-none outline-none text-sm" placeholder="可能的解法..." />
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'roadmap' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h4 className="font-bold mb-4">3 年策略路徑追蹤</h4>
          <div className="space-y-4">
            {['Year 1: 基礎建設', 'Year 2: 擴展深化', 'Year 3: 生態圈'].map((year, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <div className="font-semibold text-primary">{year}</div>
                <textarea className="w-full mt-2 p-2 border border-gray-200 rounded text-sm" placeholder="目標與關鍵結果..." />
                <div className="flex gap-2 mt-2">
                  <span className="badge badge-success">進行中</span>
                  <span className="badge badge-info">KR1</span>
                  <span className="badge badge-info">KR2</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'consensus' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
          <h4 className="font-bold mb-4">共識記錄工具</h4>
          <div className="space-y-3">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="font-semibold text-purple-700">今日共識</div>
              <textarea className="w-full mt-2 p-2 border border-purple-200 rounded text-sm" placeholder="記錄達成的共識..." />
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="font-semibold text-orange-700">待決事項</div>
              <textarea className="w-full mt-2 p-2 border border-orange-200 rounded text-sm" placeholder="需要進一步討論的項目..." />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
