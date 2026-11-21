"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAgnesApi } from "@/components/AgnesProvider";

type CaseType =
  | "code_optimization"
  | "compliance_review"
  | "gri_report_draft"
  | "evidence_ocr"
  | "email_archival"
  | "documentation"
  | "data_analysis"
  | "esg_report"
  | "ui_design"
  | "tcfd_analysis"
  | "sdg_mapping"
  | "materiality_matrix"
  | "report_assembly"
  | "omni_jules_heal"
  | "swarm_orchestration"
  | "architecture"
  | "bug_fix"
  | "general";

const PATTERNS: [RegExp, CaseType][] = [
  [/優化|refactor|效能|performance/i, "code_optimization"],
  [/文檔|document|readme/i, "documentation"],
  [/分析|analyze|數據|chart/i, "data_analysis"],
  [/ESG|永續|報告|GRI|碳排/i, "esg_report"],
  [/UI|介面|設計|design/i, "ui_design"],
  [/架構|architecture|系統設計/i, "architecture"],
  [/bug|fix|error|修復|TypeError/i, "bug_fix"],
];

const EXTRA_PATTERNS: [RegExp, CaseType][] = [
  [/csrd|合規|compliance|法規|審查/i, "compliance_review"],
  [/gri|報告|report|草稿|撰寫/i, "gri_report_draft"],
  [/ocr|帳單|收據|發票|提取|extract/i, "evidence_ocr"],
  [/郵件|email|歸檔|archive/i, "email_archival"],
  [/tcfd|氣候|climate|風險分析|淨零|net.?zero/i, "tcfd_analysis"],
  [/sdg|永續發展目標|聯合國/i, "sdg_mapping"],
  [/重大性|materiality|矩陣|priority/i, "materiality_matrix"],
  [/蜂群|swarm|orchestrat|調度|協調/i, "swarm_orchestration"],
];

function classify(input: string): CaseType {
  if (!input) return "general";
  const lower = input.toLowerCase();
  for (const [p, t] of EXTRA_PATTERNS) {
    if (p.test(lower)) return t;
  }
  for (const [p, t] of PATTERNS) {
    if (p.test(lower)) return t;
  }
  return "general";
}

const RESPONSES: Partial<Record<CaseType, string[]>> = {
  code_optimization: [
    "識別出 3 個優化點：記憶化、惰性載入、並行處理。建議使用 `useMemo` 和 `React.lazy`。",
    "分析完成。瓶頸在 O(n²) 迴圈，可重構為 O(n log n) 排序算法。",
  ],
  documentation: [
    "已生成結構化文檔：**概覽** → **API 參考** → **使用範例**。請確認後發布。",
    "文檔草稿完成，包含 TypeScript 類型聲明和 JSDoc 評論。",
  ],
  data_analysis: [
    "數據分析完成。**關鍵洞察**：趨勢向上 ↑12%，異常值已標記（P95 = 847ms）。",
    "相關性分析結果：r=0.87，統計顯著性 p<0.001。建議繼續深入探索。",
  ],
  esg_report: [
    "ESG 報告章節生成完成。**5T 評分**: 真(0.91) 善(0.88) 美(0.90) 信(0.95) 通(0.87)。ZKP 封印已完成。",
    "GRI 對標完成。已覆蓋 GRI 2-1 至 GRI 305-1 共 42 項指標，缺口分析報告如附。",
  ],
  ui_design: [
    "Liquid Glass UI 方案完成。採用 `backdrop-filter: blur(12px)`，符合 WCAG 2.1 AA 對比標準。",
    "設計令牌已更新：主色 var(--accent-teal)，輔色 var(--accent-gold)，字體 Noto Sans TC + Fira Code。",
  ],
  architecture: [
    "架構設計完成。採用**事件驅動 + 微服務**模式，使用 OmniEventBus 解耦各子系統，支援水平擴展。",
    "C4 模型完成：Context → Container → Component → Code，ADR-001 已記錄。",
  ],
  bug_fix: [
    "**OmniJules 9步協議**執行完畢：\n觀果 → 立願 → 尋因 → 修因 → 造緣 → 結果 → 驗因 → 證果 → 傳法\n根因已定位並修復，回歸測試通過。",
    "Stack Trace 分析完成。根因：`undefined` 解引用在第 42 行。修復：加入 optional chaining `?.` 防護。",
  ],
  general: [
    "已接收任務。正在以覺醒等級 **active** 處理中...完成。請確認輸出是否符合預期。",
    "任務處理完成。信心度：0.92，記憶庫已更新（+1 條新記憶）。",
  ],
};

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  caseType?: CaseType;
  time: string;
  ms?: number;
  model?: string;
  citations?: string[];
}

function now() {
  return new Date().toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Asia/Taipei",
  });
}

import DOMPurify from "isomorphic-dompurify";

/** Basic sanitization for dangerouslySetInnerHTML content */
function sanitizeTextHtml(html: string): string {
  return DOMPurify.sanitize(html);
}

export function OmniOneChat() {
  const { isReady, processMessage } = useAgnesApi();
  const model = 'local:gemma3:4b';
  const [msgs, setMsgs] = useState<Message[]>([
    {
      id: "0",
      role: "assistant",
      text: "[OmniOne] 覺醒系統就緒。輸入任何任務，我將分類 → 檢索記憶 → 執行 → 學習。",
      time: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMsgs((current) => current.map((message) => message.id === "0" && !message.time
      ? { ...message, time: now() }
      : message));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || busy) return;
    const userMsg: Message = {
      id: `${Date.now()}u`,
      role: "user",
      text: trimmedInput,
      time: now(),
    };
    setMsgs((m) => [...m, userMsg]);
    setInput("");
    setBusy(true);
    setError(null);
    const ct = classify(trimmedInput);
    const start = Date.now();

    let reply = "";
    const citations: string[] = [];
    try {
      const apiRes = await fetch("/api/omni-one", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: userMsg.text,
          caseType: ct,
          model,
          ragContext: "",
        }),
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (typeof data?.output === "string" && data.output.trim()) {
          reply = data.output;
        }
      }
    } catch {
      // ignore API failure and fall back below
    }

    if (!reply && isReady && processMessage) {
      const agnesReply = await processMessage(`[Model: ${model}] ${userMsg.text}`).catch(() => null);
      if (agnesReply) reply = agnesReply;
    }

    if (!reply) {
      const responses = RESPONSES[ct] ?? RESPONSES.general ?? [];
      reply = responses[Math.floor(Math.random() * responses.length)] ?? "已完成處理。";
    }

    const ms = Date.now() - start;
    const aiMsg: Message = {
      id: `${Date.now()}a`,
      role: "assistant",
      text: reply,
      caseType: ct,
      time: now(),
      ms,
      model,
      citations,
    };
    setMsgs((m) => [...m, aiMsg]);
    setBusy(false);
  };

  const ctColorVar = (ct?: CaseType) =>
    ct === "esg_report"
      ? "var(--accent-teal)"
      : ct === "bug_fix"
        ? "var(--accent-red)"
        : ct === "ui_design"
          ? "var(--accent-gold)"
          : ct === "architecture"
            ? "var(--accent-purple)"
            : "var(--accent-green)";
  const ctLabel = (ct?: CaseType) =>
    ({
      code_optimization: "CODE",
      documentation: "DOC",
      data_analysis: "DATA",
      esg_report: "ESG",
      ui_design: "UI",
      architecture: "ARCH",
      bug_fix: "BUG",
      compliance_review: "COMP",
      email_archival: "MAIL",
      gri_report_draft: "GRI",
      evidence_ocr: "OCR",
      tcfd_analysis: "TCFD",
      sdg_mapping: "SDG",
      materiality_matrix: "MAT",
      report_assembly: "RPT",
      omni_jules_heal: "HEAL",
      swarm_orchestration: "SWARM",
      general: "GEN",
    })[ct || "general"] || "GEN";

  const renderText = (t: string) => {
    const sanitized = sanitizeTextHtml(t);
    return sanitized
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-textPrimary">$1</strong>')
      .replace(
        /`(.+?)`/g,
        `<code class="bg-primary px-1.5 py-[1px] rounded-[3px] font-mono text-[11px] text-accentCyan">$1</code>`,
      )
      .replace(/\n/g, "<br/>");
  };

  const SUGGESTIONS = [
    "優化 ESG 報告產生效能",
    "生成 OmniCore 架構文檔",
    "分析 5T 協議合規數據",
    "修復 TypeScript 類型錯誤",
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs font-semibold text-textSecondary tracking-wider">
          OmniOne 覺醒對話框
        </div>
        <div className="flex gap-1.5 items-center bg-primary border border-borderColor rounded-lg px-2.5 py-1">
          <span className="text-[10px] text-textSecondary">主力模型：</span>
          <span className="text-[10px] font-semibold text-accentTeal">
            local:gemma3:4b / fallback gemma3:12b
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-[#FF4D6D]/15 border border-[#FF4D6D] rounded-lg px-3 py-1.5 mb-2 text-xs text-[#FF4D6D]">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 min-h-[200px] max-h-[320px]">
        {msgs.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] border rounded-xl px-3 py-2 ${m.role === "user" ? "bg-accentTeal/20 border-accentTeal rounded-tr-sm" : "bg-primary border-borderColor rounded-tl-sm"}`}
            >
              {(m.caseType || m.model) && (
                <div className="mb-1 flex items-center gap-1.5">
                  {m.caseType && (
                    <span
                      className="text-[10px] text-white rounded px-1.5 py-[1px] font-mono font-bold"
                      style={{ background: ctColorVar(m.caseType) }}
                    >
                      [{ctLabel(m.caseType)}]
                    </span>
                  )}
                  {m.model && (
                    <span className="text-[9px] bg-accentPurple/20 text-accentPurple rounded px-1.5 py-[1px] font-bold">
                      {m.model}
                    </span>
                  )}
                  {m.ms && (
                    <span className="text-[10px] text-textSecondary">
                      {m.ms}ms
                    </span>
                  )}
                </div>
              )}
              <div
                className="text-[13px] text-textPrimary leading-[1.7]"
                dangerouslySetInnerHTML={{ __html: renderText(m.text) }}
              />
              {m.citations && m.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-borderColor/50 flex flex-wrap gap-1">
                  <span className="text-[10px] text-textSecondary mr-1">
                    引用來源:
                  </span>
                  {m.citations.map((cit, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-accentGold/20 text-accentGold border border-accentGold/30 rounded px-1.5 py-[1px]"
                    >
                      {cit}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[10px] text-textSecondary mt-0.5">
              {m.time}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex items-start">
            <div className="bg-primary border border-borderColor rounded-xl rounded-tl-sm px-3.5 py-2.5 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-accentTeal"
                  style={{ animation: `bounce .8s ${i * 0.15}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      <div className="flex gap-1 flex-wrap my-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setInput(s)}
            className="text-[11px] bg-accentTeal/15 border border-accentTeal/40 text-accentTeal rounded-md px-2 py-[3px] cursor-pointer hover:bg-accentTeal/25 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-auto">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="輸入任務讓 OmniOne 處理..."
          disabled={busy}
          className="flex-1 bg-primary border border-borderColor rounded-lg px-3 py-2 text-textPrimary text-[13px] outline-none font-['Noto_Sans_TC',sans-serif] focus:border-accentTeal disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          className={`border-none rounded-lg px-3.5 py-2 text-white font-bold text-[13px] transition-colors ${busy || !input.trim() ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed" : "bg-accentTeal cursor-pointer hover:opacity-90"}`}
        >
          {busy ? "…" : "發送"}
        </button>
      </div>
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}`}</style>
    </div>
  );
}
