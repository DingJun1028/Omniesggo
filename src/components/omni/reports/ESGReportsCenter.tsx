'use client';

import React, { useState } from 'react';
import { LayoutGrid, List, KanbanSquare } from 'lucide-react';
import FloatingFunctionKey428 from './FloatingFunctionKey428';
import OmniGlassChart from './OmniGlassChart';

type LayoutType = 'grid' | 'list' | 'board';

const REPORTS = [
  { id: 'mod-env-carbon-0001', title: '2026 ISO-14064 溫室氣體盤查', status: 'Draft', progress: 45, tag: 'ENV' },
  { id: 'mod-gov-board-0001', title: 'Q1 董事會效能與風險評估', status: 'Review', progress: 80, tag: 'GOV' },
  { id: 'mod-soc-dei-0001', title: '供應鏈人權與 DEI 報告', status: 'Published', progress: 100, tag: 'SOC' },
];

function ReportCard({
  report,
  layout,
}: {
  report: (typeof REPORTS)[number];
  layout: LayoutType;
}) {
  const isList = layout === 'list';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 hover:border-cyan-400/50 hover:shadow-[0_0_30px_rgba(34,211,238,0.2)] transition-all duration-300 group cursor-pointer ${
        isList ? 'flex items-center justify-between p-4' : 'p-6 flex flex-col'
      }`}
    >
      <div className={`${isList ? 'flex items-center gap-6' : 'mb-6'}`}>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-cyan-200">
          {report.tag}
        </span>
        <h2 className={`font-bold text-gray-100 group-hover:text-cyan-300 transition-colors ${isList ? 'text-xl' : 'text-2xl mt-4'}`}>
          {report.title}
        </h2>
        {!isList && <p className="text-xs text-gray-500 mt-2 font-mono">{report.id}</p>}
      </div>
      <div className={`${isList ? 'flex items-center gap-8 w-1/3' : 'mt-auto'}`}>
        <div className={`text-sm font-medium ${report.status === 'Published' ? 'text-emerald-400' : report.status === 'Review' ? 'text-amber-400' : 'text-gray-400'}`}>
          {report.status}
        </div>
        <div className={`w-full bg-black/50 rounded-full h-2 ${isList ? '' : 'mt-3'}`}>
          <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: `${report.progress}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function ESGReportsCenter() {
  const [layout, setLayout] = useState<LayoutType>('grid');

  return (
    <div className="min-h-screen p-8 relative">
      <FloatingFunctionKey428 />

      <div className="flex justify-between items-end mb-10 border-b border-white/10 pb-6 sticky top-0 z-50 backdrop-blur-md bg-[#060b14]/80">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
            ESG Reports Center
          </h1>
          <p className="text-cyan-500/60 font-mono mt-2 tracking-widest">
            mod-src-hub-0001 | UNIVERSE
          </p>
        </div>
        <div
          className="flex gap-2 p-1.5 rounded-2xl liquid-glass-container"
          role="group"
          aria-label="版面切換"
        >
          {[
            { id: 'grid', icon: <LayoutGrid />, label: '網格檢視' },
            { id: 'list', icon: <List />, label: '列表檢視' },
            { id: 'board', icon: <KanbanSquare />, label: '看板檢視' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setLayout(btn.id as LayoutType)}
              aria-label={btn.label}
              title={btn.label}
              aria-pressed={layout === btn.id}
              className={`p-2 rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                layout === btn.id
                  ? 'bg-cyan-500/30 text-cyan-300 shadow-neon-cyan'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      </div>

      {layout === 'board' ? (
        <div className="space-y-8 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <OmniGlassChart title="ENV: 範疇二碳排放" value={4950} max={10000} unit="kg CO₂e" colorType="cyan" trend="up" />
            <OmniGlassChart title="SOC: 薪酬平等指數" value={95} max={100} unit="分" colorType="emerald" trend="up" />
            <OmniGlassChart title="GOV: 董事會出席率" value={82} max={100} unit="%" colorType="amber" trend="down" />
          </div>
          <div className="grid grid-cols-3 gap-6 h-[60vh]">
            {['Draft', 'Review', 'Published'].map((status) => (
              <div key={status} className="rounded-3xl backdrop-blur-md bg-white/5 border border-white/5 p-6 flex flex-col gap-4">
                <h3 className="text-xl font-bold text-gray-300 border-b border-white/10 pb-2">{status}</h3>
                {REPORTS.filter((r) => r.status === status).map((report) => (
                  <ReportCard key={report.id} report={report} layout="list" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={`gap-6 ${layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'}`}>
          {REPORTS.map((report) => (
            <ReportCard key={report.id} report={report} layout={layout} />
          ))}
        </div>
      )}
    </div>
  );
}
