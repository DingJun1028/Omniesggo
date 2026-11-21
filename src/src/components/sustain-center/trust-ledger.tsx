'use client';

import React from 'react';
import { ShieldCheck, Clock } from 'lucide-react';

export interface LedgerItem {
  id: string;
  title: string;
  hashLock: string;
  timestamp: number;
  status: string;
}

interface TrustLedgerProps {
  ledgers: LedgerItem[];
}

export function TrustLedger({ ledgers }: TrustLedgerProps) {
  if (!ledgers || ledgers.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-accentGold font-bold text-lg flex items-center gap-2">
          <ShieldCheck size={20} /> 5T 信任帳本 (Trust Ledger)
        </h3>
        <span className="text-xs text-textSecondary bg-primary px-2 py-1 rounded-full border border-borderColor/50">
          ZKP Secured
        </span>
      </div>
      
      <div className="bg-surface border border-borderColor rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-3 bg-primary/50 border-b border-borderColor text-xs font-bold text-textSecondary uppercase tracking-wider">
          <div className="col-span-5">資料資產名稱 (Asset)</div>
          <div className="col-span-4">零知識封印 (ZKP HashLock)</div>
          <div className="col-span-3 text-right">時間戳記 (Timestamp)</div>
        </div>
        
        <div className="flex flex-col">
          {ledgers.map((ledger, idx) => (
            <div 
              key={ledger.id} 
              className={`grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors ${idx !== ledgers.length - 1 ? 'border-b border-borderColor/30' : ''}`}
            >
              <div className="col-span-5 font-medium text-textPrimary flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accentGreen shadow-[0_0_8px_rgba(82,196,26,0.6)]" />
                {ledger.title}
              </div>
              <div className="col-span-4 font-mono text-xs text-accentTeal/80">
                {ledger.hashLock.substring(0, 24)}...
              </div>
              <div className="col-span-3 text-right text-textSecondary text-xs flex items-center justify-end gap-1">
                <Clock size={12} />
                {new Date(ledger.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
