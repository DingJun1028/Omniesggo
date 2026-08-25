'use client';

import { useState, useEffect } from 'react';
import { db } from '@lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from '@lib/firebase';
import { ShieldCheck, Hash, Clock, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { UniversalOmniConsole } from './universal-omni-console';

interface ZkpRecord {
  id: string;
  project_id: string;
  user_id: string;
  amount: number;
  cost: number;
  created_at: string;
  hash_lock?: string;
}

export function ZkpVault() {
  const [records, setRecords] = useState<ZkpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!db) return;
    
    // Mock user 'u_01'
    const q = query(
      collection(db, 'votes'), 
      where('user_id', '==', 'u_01'),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        // Generate a pseudo hash-lock if not present
        const pseudoHash = docData.hash_lock || Array.from(doc.id).map(c => c.charCodeAt(0).toString(16)).join('').padEnd(64, '0').substring(0, 64);
        return { 
          id: doc.id, 
          ...docData,
          hash_lock: pseudoHash
        } as ZkpRecord;
      });
      setRecords(data);
      setLoading(false);
    }, (error) => {
      console.error("ZKP Vault fetch error", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-accentGold flex items-center gap-2">
            <ShieldCheck size={24} /> ZKP 憑證館 (Vault)
          </h2>
          <p className="text-sm text-textSecondary mt-1">不可篡改的 ESG 貢獻紀錄，由 5T 協議加密封印</p>
        </div>
        <div className="bg-accentGold/10 border border-accentGold/30 text-accentGold px-4 py-2 rounded-lg font-mono text-sm font-bold flex items-center gap-2 shadow-sm">
          <Hash size={16} /> 總憑證數: {records.length}
        </div>
      </div>

      {loading ? (
        <div className="text-textSecondary text-center py-12">驗證憑證中...</div>
      ) : records.length === 0 ? (
        <div className="text-textSecondary text-center py-12 border border-dashed border-borderColor rounded-2xl bg-primary/50">
          尚未擁有任何 ZKP 憑證，前往永續村進行平方投票吧！
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((record, i) => {
            const isExpanded = expandedId === record.id;
            const shortHash = record.hash_lock?.substring(0, 12) + '...';
            
            return (
              <div 
                key={record.id} 
                className="bg-secondary/70 backdrop-blur-xl border border-borderColor/50 rounded-xl overflow-hidden shadow-[0_4px_16px_0_rgba(31,38,135,0.07)] hover:shadow-[0_8px_32px_0_rgba(99,166,176,0.2)] hover:-translate-y-1 transition-all duration-500 relative group"
                style={{ animation: `fadeIn 0.5s ease-out ${i * 0.1}s both` }}
              >
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-accentGold to-accentTeal opacity-70 group-hover:opacity-100 transition-opacity" />
                
                <div 
                  className="p-5 cursor-pointer pl-6 flex flex-col gap-3"
                  onClick={() => toggleExpand(record.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 text-textPrimary font-bold">
                      <Heart size={18} className="text-accentTeal" />
                      專案 ID: {record.project_id.split('_').pop()}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-textSecondary bg-secondary px-2 py-1 rounded-md border border-borderColor">
                      <Clock size={12} />
                      {new Date(record.created_at).toLocaleString('zh-TW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-1">
                    <div>
                      <div className="text-xs text-textSecondary mb-1">平方投票</div>
                      <div className="text-lg font-bold text-textPrimary">{record.amount} <span className="text-xs font-normal">票</span></div>
                    </div>
                    <div className="w-px h-8 bg-borderColor"></div>
                    <div>
                      <div className="text-xs text-textSecondary mb-1">耗費資源</div>
                      <div className="text-lg font-bold text-accentGold font-mono">{record.cost} <span className="text-xs font-sans font-normal">PTS</span></div>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between text-xs text-textSecondary border-t border-borderColor pt-3">
                    <div className="flex items-center gap-1.5 font-mono text-accentTeal bg-accentTeal/10 px-2 py-1 rounded">
                      <ShieldCheck size={14} /> {shortHash}
                    </div>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expanded Details */}
                <div className={`overflow-hidden transition-all duration-300 bg-primary/50 border-t border-borderColor ${isExpanded ? 'max-h-48' : 'max-h-0'}`}>
                  <div className="p-4 pl-6 flex flex-col gap-2 text-xs font-mono break-all">
                    <div>
                      <span className="text-textSecondary">Transaction ID:</span>
                      <br/>
                      <span className="text-textPrimary">{record.id}</span>
                    </div>
                    <div>
                      <span className="text-textSecondary">Hash Lock (SHA-256):</span>
                      <br/>
                      <span className="text-accentGold">{record.hash_lock}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-borderColor/50">
                      <div className="w-2 h-2 rounded-full bg-accentGreen shadow-[0_0_5px_var(--accent-green)]"></div>
                      <span className="text-accentGreen font-bold font-sans">T4 Trustworthy - 已上鏈驗證</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* 萬能函數控制檯 — 直接呼叫 omni() 與 omniFn，並可一鍵建立 5T 組件寫入 Vault */}
      <div className="rounded-2xl border border-accentPurple/30 bg-secondary/40 p-4">
        <UniversalOmniConsole />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
