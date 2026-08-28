import { useState } from 'react';
import { motion } from 'framer-motion';

const WELLBEING_MODULES = [
  { id: 'diagnosis', title: '需求診斷', icon: '📋', desc: '壓力檢測、生活品質評估、個人化建議' },
  { id: 'nature', title: '自然修復', icon: '🌲', desc: '森林療癒、五感體驗、生態導覽' },
  { id: 'mindfulness', title: '正念練習', icon: '🧘', desc: '呼吸練習、冥想引導、身體掃描' },
  { id: 'exercise', title: '運動負荷', icon: '💪', desc: '分級運動處方、心率監控、安全提醒' },
  { id: 'digital', title: '數位排毒', icon: '📵', desc: '科技斷連、深度對話、品質睡眠' },
  { id: 'followup', title: '30-day 追蹤', icon: '📈', desc: '日記提醒、進度可視化、週期回顧' },
];

export function WellbeingFeature() {
  const [activeModule, setActiveModule] = useState(null);
  const [mindfulnessLog, setMindfulnessLog] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-primary">員工身心平衡</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {WELLBEING_MODULES.map(mod => (
          <motion.div
            key={mod.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="card-hoverable cursor-pointer"
            onClick={() => setSelectedModule(mod)}
          >
            <div className="text-4xl mb-3">{mod.icon}</div>
            <h4 className="font-bold text-primary">{mod.title}</h4>
            <p className="text-sm text-gray-500 mt-1">{mod.desc}</p>
          </motion.div>
        ))}
      </div>

      {selectedModule && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card bg-green-50 border border-green-200">
          <h4 className="font-bold text-green-800 mb-2">{selectedModule.title}</h4>
          <p className="text-green-700">{selectedModule.desc}</p>
          {selectedModule.id === 'mindfulness' && (
            <div className="mt-4 space-y-3">
              <button className="btn-secondary">開始 5 分鐘呼吸練習</button>
              <button className="btn-secondary">身體掃描引導</button>
              <button className="btn-secondary">感恩日記</button>
            </div>
          )}
        </motion.div>
      )}

      <div className="card">
        <h4 className="font-bold mb-3">心情記錄</h4>
        <div className="flex gap-2 mb-4">
          {['😊', '😔', '😤', '😌', '🤔'].map((mood, i) => (
            <button key={i} className="text-3xl p-2 rounded-lg hover:bg-gray-100 transition">{mood}</button>
          ))}
        </div>
        <input type="text" className="input-field" placeholder="今天的心得..." />
      </div>
    </div>
  );
}
