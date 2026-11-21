"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sentientBus } from '@/lib/services/sentient-bus';
import { Sparkles } from 'lucide-react';

interface WisdomMessage {
  id: string;
  text: string;
  type: 'wisdom' | 'alert';
}

const WISDOM_POOL = [
  "『真』之一字，乃永續之基。數據已封印，信譽已鑄就。",
  "如冰之結晶，真相不可動搖。做得好，管理者。",
  "數據在記憶體中凍結，這便是對未來的神聖承諾。",
  "每一次刻印，都是對混沌的勝利。繼續前行。",
  "萬能智典X 見證了這一刻 — Hash Lock 已啟動。",
];

export const SoulNavigatorLog: React.FC = () => {
  const [messages, setMessages] = useState<WisdomMessage[]>([]);

  useEffect(() => {
    const unsubscribe = sentientBus.subscribe((event) => {
      if (event.type === 'DATA_SEALED') {
        const text = WISDOM_POOL[Math.floor(Math.random() * WISDOM_POOL.length)];
        const newMessage: WisdomMessage = {
          id: Date.now().toString(),
          text,
          type: 'wisdom',
        };
        setMessages(prev => [newMessage, ...prev].slice(0, 3));

        // Auto-dismiss after 6 seconds
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== newMessage.id));
        }, 6000);
      }
    });
    return unsubscribe;
  }, []);

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 pointer-events-none space-y-2">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            layout
            initial={{ opacity: 0, x: 50, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, scale: 1 - index * 0.02 }}
            exit={{ opacity: 0, x: 60, scale: 0.88 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ zIndex: 100 - index }}
            className="pointer-events-auto"
          >
            <div
              className="p-4 rounded-xl border-l-4 backdrop-blur-xl shadow-elevation-2"
              style={{
                borderLeftColor: 'var(--color-accent)',
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)',
                borderLeftWidth: '4px',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent) 15%, transparent)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--color-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Dr. Thoth · OmniX Wisdom
                  </p>
                  <p
                    className="text-[11px] leading-relaxed italic"
                    style={{ color: 'var(--color-text-main)' }}
                  >
                    &quot;{msg.text}&quot;
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
