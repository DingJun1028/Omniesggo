'use client';

import { useState, useEffect } from 'react';
import { OmniBaseCard } from '@/components/omni-base-card';

interface CronJobInfo {
  name: string;
  interval: string;
  agentId?: number;
  description: string;
}

export function HermesCronStatus() {
  const [jobs, setJobs] = useState<CronJobInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [lastLogs, setLastLogs] = useState<{ job: string; time: string; result: string }[]>([]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.jobs) {
          setJobs(json.data.jobs);
        }
      }
    } catch (e) {
      console.error('[HermesCronStatus] Failed to fetch jobs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const triggerJob = async (jobName: string) => {
    setRunningJob(jobName);
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job: jobName }),
      });
      const data = await res.json();
      const timestamp = new Date().toLocaleTimeString();
      setLastLogs((prev) => [
        {
          job: jobName,
          time: timestamp,
          result: data.success ? '成功 (OK)' : `失敗: ${data.error ?? '未知錯誤'}`,
        },
        ...prev.slice(0, 9),
      ]);
    } catch (err: unknown) {
      const timestamp = new Date().toLocaleTimeString();
      setLastLogs((prev) => [
        {
          job: jobName,
          time: timestamp,
          result: `異常: ${err instanceof Error ? err.message : String(err)}`,
        },
        ...prev.slice(0, 9),
      ]);
    } finally {
      setRunningJob(null);
    }
  };

  return (
    <OmniBaseCard className="!p-6 my-4" statusIndicator="trackable">
      <div className="flex items-center justify-between mb-4 border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl">
            🐝
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-cyan-300 tracking-wide">
              Hermes 30 萬能蜂群全自動巡檢 Cron 排程控制台
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5T 認證代理蜂群 · 全自動定時巡檢與監控中樞
            </p>
          </div>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
        >
          {loading ? '更新中...' : '重新整理'}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-400">載入 Hermes 蜂群排程中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {jobs.map((j) => (
            <div
              key={j.name}
              className="p-4 rounded-xl bg-slate-950/40 border border-cyan-500/20 hover:border-cyan-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm font-bold text-cyan-400">
                    {j.name}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    頻率: {j.interval}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mb-3">{j.description}</p>
                {j.agentId && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-950 text-cyan-300 border border-cyan-800 mb-3">
                    Agent ID: #{j.agentId}
                  </span>
                )}
              </div>

              <button
                onClick={() => triggerJob(j.name)}
                disabled={runningJob === j.name}
                className="w-full py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-slate-950 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {runningJob === j.name ? '執行中...' : '手動觸發巡檢'}
              </button>
            </div>
          ))}
        </div>
      )}

      {lastLogs.length > 0 && (
        <div className="mt-4 pt-4 border-t border-cyan-500/20">
          <h3 className="text-xs font-bold text-cyan-400 mb-2 tracking-wider uppercase">
            最近手動觸發執行紀錄
          </h3>
          <div className="space-y-1 font-mono text-xs max-h-40 overflow-y-auto pr-2 scrollbar-thin">
            {lastLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-300"
              >
                <span className="text-cyan-400">[{log.time}] {log.job}</span>
                <span
                  className={
                    log.result.includes('成功')
                      ? 'text-emerald-400 font-bold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {log.result}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </OmniBaseCard>
  );
}
