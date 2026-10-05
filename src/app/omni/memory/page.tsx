import React from 'react';
import OmniMemoryDashboard from '@/components/omni/memory/OmniMemoryDashboard';

export const metadata = {
  title: 'OmniMemory | 萬能記憶與對齊引擎',
  description: 'ESG GO 零算力全通記憶與對齊引擎儀表板',
};

export default function OmniMemoryPage() {
  return (
    <main className="w-full h-full bg-slate-950">
      <OmniMemoryDashboard />
    </main>
  );
}
