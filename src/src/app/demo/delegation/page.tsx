/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

/**
 * ==========================================
 * 完全自主代行 - 互動式展示頁面
 * ==========================================
 */

import React, { useState, useCallback } from 'react';

// ==========================================
// 類型定義
// ==========================================

interface Delegation {
  delegationId: string;
  agentId: string;
  principalId: string;
  permissions: string[];
  validUntil: number;
  description?: string;
  createdAt: string;
}

interface ExecutionResult {
  success: boolean;
  executionId: string;
  duration: number;
  result?: Record<string, unknown>;
  error?: string;
}

interface SystemStats {
  totalDelegations: number;
  activeDelegations: number;
  totalExecutions: number;
  cacheHitRate: number;
}

// ==========================================
// Demo 頁面組件
// ==========================================

export default function DelegationDemo() {
  // 狀態管理
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [stats, setStats] = useState<SystemStats>({
    totalDelegations: 0,
    activeDelegations: 0,
    totalExecutions: 0,
    cacheHitRate: 0,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 表單狀態
  const [principalId, setPrincipalId] = useState('user-001');
  const [permissions, setPermissions] = useState(['read', 'write', 'execute']);
  const [description, setDescription] = useState('');
  const [intent, setIntent] = useState('generate-report');
  const [context, setContext] = useState('{}');

  // ==========================================
  // 工具函數
  // ==========================================

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  const generateId = () => `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ==========================================
  // API 模擬函數
  // ==========================================

  const createDelegation = async () => {
    setIsLoading(true);
    addLog('創建授權中...');

    try {
      // 模擬 API 延遲
      await new Promise((resolve) => setTimeout(resolve, 500));

      const newDelegation: Delegation = {
        delegationId: generateId(),
        agentId: `agent-${Date.now()}`,
        principalId,
        permissions,
        validUntil: Infinity,
        description: description || undefined,
        createdAt: new Date().toISOString(),
      };

      setDelegations((prev) => [...prev, newDelegation]);
      setStats((prev) => ({
        ...prev,
        totalDelegations: prev.totalDelegations + 1,
        activeDelegations: prev.activeDelegations + 1,
      }));

      addLog(`✅ 授權已創建: ${newDelegation.delegationId}`);
      addLog(`   主體: ${newDelegation.principalId}`);
      addLog(`   權限: ${newDelegation.permissions.join(', ')}`);
    } catch (_error) {
      addLog('❌ 創建授權失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const terminateDelegation = async (delegationId: string) => {
    setIsLoading(true);
    addLog(`終止授權: ${delegationId}`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      setDelegations((prev) => prev.filter((d) => d.delegationId !== delegationId));
      setStats((prev) => ({
        ...prev,
        activeDelegations: prev.activeDelegations - 1,
      }));

      if (selectedDelegation?.delegationId === delegationId) {
        setSelectedDelegation(null);
      }

      addLog(`✅ 授權已終止: ${delegationId}`);
    } catch (_error) {
      addLog('❌ 終止授權失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const executeTask = async (_delegationId: string) => {
    setIsLoading(true);
    addLog(`執行任務: ${intent}`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result: ExecutionResult = {
        success: true,
        executionId: `exec-${Date.now()}`,
        duration: Math.floor(Math.random() * 500) + 200,
        result: {
          message: `任務 "${intent}" 已成功執行`,
          timestamp: new Date().toISOString(),
          data: JSON.parse(context),
        },
      };

      setStats((prev) => ({
        ...prev,
        totalExecutions: prev.totalExecutions + 1,
        cacheHitRate: Math.min(0.95, prev.cacheHitRate + 0.01),
      }));

      addLog(`✅ 任務執行成功`);
      addLog(`   執行 ID: ${result.executionId}`);
      addLog(`   耗時: ${result.duration}ms`);
      addLog(`   結果: ${JSON.stringify(result.result, null, 2)}`);
    } catch (_error) {
      addLog('❌ 任務執行失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // 權限切換
  // ==========================================

  const togglePermission = (perm: string) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  // ==========================================
  // 渲染
  // ==========================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            完全自主代行 Demo
          </h1>
          <p className="text-gray-400 text-lg">
            互動式展示完全自主代行系統
          </p>
        </header>

        {/* 統計卡片 */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-purple-400">{stats.totalDelegations}</div>
            <div className="text-gray-400">總授權數</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-green-400">{stats.activeDelegations}</div>
            <div className="text-gray-400">活躍授權</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-blue-400">{stats.totalExecutions}</div>
            <div className="text-gray-400">執行次數</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="text-3xl font-bold text-yellow-400">
              {(stats.cacheHitRate * 100).toFixed(1)}%
            </div>
            <div className="text-gray-400">快取命中率</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* 左側：創建授權 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-6 text-purple-400">創建授權</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">主體 ID</label>
                <input
                  type="text"
                  value={principalId}
                  onChange={(e) => setPrincipalId(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">權限</label>
                <div className="flex flex-wrap gap-2">
                  {['read', 'write', 'execute', 'decide', 'full'].map((perm) => (
                    <button
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={`px-3 py-1 rounded-lg text-sm transition ${
                        permissions.includes(perm)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-400 hover:bg-white/20'
                      }`}
                    >
                      {perm}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">描述 (選填)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如: ESG 合規代理"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-400"
                />
              </div>

              <button
                onClick={createDelegation}
                disabled={isLoading || permissions.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? '處理中...' : '創建授權'}
              </button>
            </div>
          </div>

          {/* 中間：授權列表 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-6 text-green-400">活躍授權</h2>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {delegations.length === 0 ? (
                <div className="text-gray-400 text-center py-8">暫無活躍授權</div>
              ) : (
                delegations.map((d) => (
                  <div
                    key={d.delegationId}
                    className={`bg-white/5 rounded-lg p-4 cursor-pointer transition hover:bg-white/10 ${
                      selectedDelegation?.delegationId === d.delegationId
                        ? 'ring-2 ring-purple-400'
                        : ''
                    }`}
                    onClick={() => setSelectedDelegation(d)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-mono text-purple-300">
                        {d.delegationId.substring(0, 16)}...
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          terminateDelegation(d.delegationId);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        終止
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">主體: {d.principalId}</div>
                    <div className="flex gap-1 mt-2">
                      {d.permissions.map((p) => (
                        <span
                          key={p}
                          className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右側：執行任務 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-6 text-blue-400">執行任務</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">選擇授權</label>
                <select
                  value={selectedDelegation?.delegationId || ''}
                  onChange={(e) => {
                    const d = delegations.find((del) => del.delegationId === e.target.value);
                    setSelectedDelegation(d || null);
                  }}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-400"
                >
                  <option value="">-- 選擇授權 --</option>
                  {delegations.map((d) => (
                    <option key={d.delegationId} value={d.delegationId}>
                      {d.delegationId.substring(0, 20)}... ({d.principalId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">任務意圖</label>
                <input
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">上下文 (JSON)</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-400 font-mono text-sm"
                />
              </div>

              <button
                onClick={() => selectedDelegation && executeTask(selectedDelegation.delegationId)}
                disabled={isLoading || !selectedDelegation}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {isLoading ? '執行中...' : '執行任務'}
              </button>
            </div>
          </div>
        </div>

        {/* 日誌區域 */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold mb-4 text-yellow-400">執行日誌</h2>
          <div className="bg-black/30 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">等待操作...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="py-1 border-b border-white/5">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          完全自主代行 Demo | OmniCore Platform
        </footer>
      </div>
    </div>
  );
}
