'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Activity, Brain, Server, ShieldAlert } from 'lucide-react';
import ThoughtStreamPanel from '../../components/ThoughtStreamPanel';

interface SystemLog {
  id: string;
  type: 'L-Hub' | 'Celestial' | 'OmniCore';
  message: string;
  timestamp: string;
  status: 'Awakened' | 'Sealed' | 'Recovered' | 'Active';
}

export default function OmniAgentConsole() {
  const [logs, setLogs] = useState<SystemLog[]>([]);

  useEffect(() => {
    // 模擬真實的系統即時流轉
    const mockLogs: SystemLog[] = [
      {
        id: '1',
        type: 'OmniCore',
        message: 'OmniAgent Swarm Initialized.',
        timestamp: new Date().toISOString(),
        status: 'Awakened',
      },
      {
        id: '2',
        type: 'L-Hub',
        message: 'Delegated summary task for RAG context (>500 chars).',
        timestamp: new Date(Date.now() + 1000).toISOString(),
        status: 'Active',
      },
      {
        id: '3',
        type: 'Celestial',
        message: 'ZKP Hash Lock applied to Vote ID #v_8829',
        timestamp: new Date(Date.now() + 2500).toISOString(),
        status: 'Sealed',
      },
      {
        id: '4',
        type: 'Celestial',
        message: 'Self-Healing triggered: API Timeout downgraded to KI.',
        timestamp: new Date(Date.now() + 4000).toISOString(),
        status: 'Recovered',
      },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < mockLogs.length) {
        setLogs((prev) => [mockLogs[currentIndex], ...prev]);
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F2F5] to-[#E2E8F0] dark:from-[#1E293B] dark:to-[#0F172A] p-6 md:p-10 font-sans text-textPrimary">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#63a6b0] to-[#ffd700] flex items-center justify-center shadow-lg">
          <Activity className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-cyan-400">
            全知之眼 (Omni-Console)
          </h1>
          <p className="text-textSecondary text-sm">全通之心覺醒狀態即時監控面板</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 狀態面板 */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Brain className="text-[#63a6b0]" size={18} /> 系統核心狀態
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-borderColor pb-2">
                <span className="text-sm text-textSecondary">無作妙德 (Celestial)</span>
                <span className="text-xs font-mono bg-accentGreen/10 text-accentGreen px-2 py-1 rounded-full border border-accentGreen/20">
                  AWAKENED
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-borderColor pb-2">
                <span className="text-sm text-textSecondary">L-Hub 蜂羣 (Swarm)</span>
                <span className="text-xs font-mono bg-accentTeal/10 text-accentTeal px-2 py-1 rounded-full border border-accentTeal/20">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center border-b border-borderColor pb-2">
                <span className="text-sm text-textSecondary">自癒能力 (Self-Healing)</span>
                <span className="text-xs font-mono bg-accentGold/10 text-accentGold px-2 py-1 rounded-full border border-accentGold/20">
                  ENABLED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 系統流轉日誌 */}
        <div className="lg:col-span-2">
          <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] min-h-[400px]">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Server className="text-[#ffd700]" size={18} /> 圓通無礙事件流轉 (Event Stream)
            </h3>

            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-primary/50 border border-borderColor rounded-xl p-4 flex gap-4 items-start animate-[fadeIn_0.5s_ease-out]"
                >
                  <div className="mt-1">
                    {log.status === 'Awakened' && <Brain size={16} className="text-[#63a6b0]" />}
                    {log.status === 'Sealed' && (
                      <ShieldCheck size={16} className="text-[#ffd700]" />
                    )}
                    {log.status === 'Recovered' && (
                      <ShieldAlert size={16} className="text-accentGreen" />
                    )}
                    {log.status === 'Active' && (
                      <Activity size={16} className="text-textSecondary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-xs font-bold text-textPrimary px-2 py-0.5 rounded-md border border-borderColor bg-secondary">
                        {log.type}
                      </span>
                      <span className="text-xs font-mono text-textSecondary">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-textPrimary">{log.message}</p>
                  </div>
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center text-textSecondary py-10">
                  <div className="inline-block w-6 h-6 border-2 border-[#63a6b0] border-t-transparent rounded-full animate-spin mb-2"></div>
                  <p className="text-sm">監聽全通之脈中...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 一代理 思考 — OmniAgentBus 同步思考流 SSE 面板 */}
      <div className="mt-6">
        <ThoughtStreamPanel agentId="gemma4-local" />
      </div>

      {/* 一代理 思考 — OmniAgentBus 同步思考流 SSE 面板 */}
      <div className="mt-6">
        <ThoughtStreamPanel agentId="gemma4-local" />
      </div>
    </div>
  );
}
