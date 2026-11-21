'use client';
import { useState } from 'react';
import { Edit3, Check, Loader2, Sparkles } from 'lucide-react';

export function OmniGrammarEditor({ initialText, onSave }: { initialText: string; onSave?: (text: string) => void }) {
  const [text, setText] = useState(initialText);
  const [tone, setTone] = useState<'professional' | 'approachable' | 'academic'>('professional');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewrittenText, setRewrittenText] = useState<string | null>(null);

  const handleRewrite = async () => {
    setIsProcessing(true);
    setRewrittenText(null);
    try {
      const res = await fetch('/api/sustain-write/v5/grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, tone })
      });
      const data = await res.json();
      if (data.success) {
        setRewrittenText(data.rewrittenText);
      }
    } catch (err) {
      console.error('Error rewriting grammar:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (rewrittenText) {
      setText(rewrittenText);
      setRewrittenText(null);
      if (onSave) onSave(rewrittenText);
    }
  };

  return (
    <div className="bg-surface border border-borderColor rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-accentGold font-bold flex items-center gap-2">
          <Edit3 size={18} /> 文法編撰組與品牌調性工具 (Omni Tone Editor)
        </h3>
        <select 
          value={tone}
          onChange={(e) => setTone(e.target.value as 'professional' | 'approachable' | 'academic')}
          className="bg-primary text-textPrimary text-sm rounded-md px-3 py-1.5 border border-borderColor/50 focus:outline-none focus:border-accentTeal"
        >
          <option value="professional">專業嚴謹 (Professional)</option>
          <option value="approachable">親切易懂 (Approachable)</option>
          <option value="academic">學術合規 (Academic)</option>
        </select>
      </div>

      <textarea 
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-32 bg-primary/50 text-textPrimary text-sm p-3 rounded-lg border border-borderColor/50 focus:outline-none focus:border-accentTeal resize-none"
        placeholder="請輸入欲潤飾的報告段落..."
      />

      <div className="flex justify-end mt-3">
        <button 
          onClick={handleRewrite}
          disabled={!text || isProcessing}
          className="bg-accentTeal/20 text-accentTeal hover:bg-accentTeal/30 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          AI 智慧潤飾
        </button>
      </div>

      {rewrittenText && (
        <div className="mt-4 p-4 bg-accentTeal/5 border border-accentTeal/30 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="text-xs font-bold text-accentTeal mb-2">潤飾結果預覽:</div>
          <div className="text-textPrimary text-sm mb-4 leading-relaxed">
            {rewrittenText}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setRewrittenText(null)} className="px-3 py-1.5 text-sm text-textSecondary hover:bg-white/5 rounded-md">
              取消
            </button>
            <button onClick={handleApply} className="bg-accentTeal text-white px-3 py-1.5 text-sm rounded-md font-bold flex items-center gap-1 hover:bg-accentTeal/90">
              <Check size={14} /> 應用至文本
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
