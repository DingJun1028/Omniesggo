'use client';

/**
 * ==========================================
 * 完全代主自行 - 授權管理儀錶板
 * ==========================================
 * 
 * React 元件 for 管理完全代主自行授權
 */

import React, { useState, useEffect } from 'react';

// ==========================================
// 類型定義
// ==========================================

interface Delegation {
  delegationId: string;
  agentId: string;
  principalId: string;
  permissions: string[];
  validFrom: number;
  validUntil: number;
  description?: string;
}

interface DelegationFormData {
  principalId: string;
  agentId?: string;
  permissions: string[];
  validUntil?: number;
  description?: string;
}

// ==========================================
// 主元件
// ==========================================

export function DelegationDashboard() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<DelegationFormData>({
    principalId: '',
    permissions: ['read'],
    description: '',
  });

  // 獲取授權列表
  const fetchDelegations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/delegation');
      const data = await response.json();

      if (data.success) {
        setDelegations(data.delegations);
      } else {
        setError(data.error || 'Failed to fetch delegations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchDelegations();
  }, []);

  // 創建授權
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/delegation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setFormData({ principalId: '', permissions: ['read'], description: '' });
        fetchDelegations();
      } else {
        setError(data.error || 'Failed to create delegation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  };

  // 終止授權
  const handleTerminate = async (delegationId: string) => {
    if (!confirm('確定要終止此授權嗎？')) return;

    try {
      const response = await fetch(`/api/delegation/${delegationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'User terminated' }),
      });

      const data = await response.json();

      if (data.success) {
        fetchDelegations();
      } else {
        setError(data.error || 'Failed to terminate delegation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    }
  };

  // 格式化時間
  const formatTime = (timestamp: number) => {
    if (timestamp === Infinity) return '永久';
    return new Date(timestamp).toLocaleString('zh-TW');
  };

  // ==========================================
  // 渲染
  // ==========================================

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">完全代主自行 - 授權管理</h1>
        <p className="text-gray-600">
          管理代理者的完全授權，實現自主執行任務
        </p>
      </div>

      {/* 錯誤訊息 */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
            aria-label="關閉錯誤訊息"
            title="關閉"
          >
            ×
          </button>
        </div>
      )}

      {/* 操作列 */}
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={fetchDelegations}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          重新整理
        </button>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          創建新授權
        </button>
      </div>

      {/* 創建表單 */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
          <h2 className="text-lg font-semibold mb-4">創建新授權</h2>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="principalId" className="block text-sm font-medium mb-1">
                  主體 ID *
                </label>
                <input
                  id="principalId"
                  type="text"
                  value={formData.principalId}
                  onChange={(e) =>
                    setFormData({ ...formData, principalId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label htmlFor="agentId" className="block text-sm font-medium mb-1">
                  代理者 ID (選填)
                </label>
                <input
                  id="agentId"
                  type="text"
                  value={formData.agentId ?? ''}
                  onChange={(e) =>
                    setFormData({ ...formData, agentId: e.target.value || undefined })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">
                  權限 *
                </label>
                <div className="flex flex-wrap gap-2">
                  {['read', 'write', 'execute', 'decide', 'full'].map((perm) => (
                    <label key={perm} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.permissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permissions: [...formData.permissions, perm],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permissions: formData.permissions.filter(
                                (p) => p !== perm
                              ),
                            });
                          }
                        }}
                        className="mr-1"
                      />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  描述 (選填)
                </label>
                <input
                  id="description"
                  type="text"
                  value={formData.description ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                創建
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 授權列表 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                授權 ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                主體
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                代理者
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                權限
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                有效期
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  載入中...
                </td>
              </tr>
            ) : delegations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  暫無授權資料
                </td>
              </tr>
            ) : (
              delegations.map((d) => (
                <tr key={d.delegationId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {d.delegationId.substring(0, 20)}...
                  </td>
                  <td className="px-4 py-3 text-sm">{d.principalId}</td>
                  <td className="px-4 py-3 text-sm">{d.agentId}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {d.permissions.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatTime(d.validFrom)} - {formatTime(d.validUntil)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleTerminate(d.delegationId)}
                      className="text-red-600 hover:text-red-800"
                    >
                      終止
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 統計資訊 */}
      <div className="mt-4 text-sm text-gray-500">
        共 {delegations.length} 筆活躍授權
      </div>
    </div>
  );
}

export default DelegationDashboard;
