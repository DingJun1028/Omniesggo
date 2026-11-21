/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { createContext, useContext, useState, type ReactNode } from 'react';

export interface AgnesApiContextType {
  isReady: boolean;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  connect: () => Promise<void>;
  disconnect: () => void;
  processMessage: (message: string) => Promise<string | null>;
  // AI Provider 狀態
  provider: string | null;
  modelName: string | null;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null;
  lastResponseMs: number | null;
}

const AgnesApiContext = createContext<AgnesApiContextType>({
  isReady: false,
  apiKey: null,
  setApiKey: () => {},
  status: 'disconnected',
  connect: async () => {},
  disconnect: () => {},
  processMessage: async () => null,
  provider: null,
  modelName: null,
  usage: null,
  lastResponseMs: null,
});

export function AgnesProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_AGNES_API_KEY || null;
    }
    return null;
  });
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_AGNES_API_KEY) {
      return 'connected';
    }
    return 'disconnected';
  });
  const [isReady, setIsReady] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!process.env.NEXT_PUBLIC_AGNES_API_KEY;
    }
    return false;
  });
  // AI Provider 狀態追蹤
  const [provider, setProvider] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ prompt_tokens: number; completion_tokens: number; total_tokens: number } | null>(null);
  const [lastResponseMs, setLastResponseMs] = useState<number | null>(null);

  const connect = async () => {
    setStatus('connecting');
    try {
      // Simulate connection check
      await new Promise(resolve => setTimeout(resolve, 500));
      setStatus('connected');
      setIsReady(true);
    } catch (_e) {
      setStatus('error');
      setIsReady(false);
    }
  };

  const disconnect = () => {
    setStatus('disconnected');
    setIsReady(false);
  };

  // Delegate processing to the backend route to avoid exposing secrets
  const processMessage = async (message: string): Promise<string | null> => {
    if (!isReady) return null;
    const startMs = Date.now();
    try {
      const res = await fetch('/api/agnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: message }),
      });
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      // 從 metadata 中提取 Provider/Model 資訊
      if (data.metadata) {
        setProvider(data.metadata.provider || null);
        setModelName(data.metadata.model || null);
        setUsage(data.metadata.usage || null);
      }
      setLastResponseMs(Date.now() - startMs);
      return data.data?.output || null;
    } catch (e) {
      console.error('[AGNES_API] Process Error:', e);
      setProvider('error');
      setLastResponseMs(Date.now() - startMs);
      return null;
    }
  };

  const value: AgnesApiContextType = {
    isReady,
    apiKey,
    setApiKey,
    status,
    connect,
    disconnect,
    processMessage,
    provider,
    modelName,
    usage,
    lastResponseMs,
  };

  return (
    <AgnesApiContext.Provider value={value}>
      {children}
    </AgnesApiContext.Provider>
  );
}

export function useAgnesApi(): AgnesApiContextType {
  return useContext(AgnesApiContext);
}