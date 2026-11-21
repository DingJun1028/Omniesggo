"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  Database,
  FileOutput,
  LayoutDashboard,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Zap,
  Trash2
} from "lucide-react";

import { useAppContext } from "@/lib/context/app-context";
import { ViewHeader } from "@/components/ui/view-header";
import { TrustVault } from "@/lib/services/trust-vault";
import { sentientBus } from "@/lib/services/sentient-bus";
import { LiquidGlassCard } from "@/components/ui/liquid-glass-card";
import { IComponentCore } from "@/lib/types/esg-core";
import { SoulNavigatorLog } from "@/components/ui/soul-navigator-log";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const SME_MODULES = [
  {
    id: "input-center",
    title: "數據採集 (Data Input)",
    desc: "簡易的數據上傳與填報介面，支援水電單據 OCR 辨識與 Excel 批次匯入。",
    icon: UploadCloud,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    status: "Active",
    stats: "本月已上傳 12 份單據"
  },
  {
    id: "record-center",
    title: "數據後台 (Data Records)",
    desc: "安全儲存所有 ESG 數據與文件，自動建立不可篡改的稽核紀錄。",
    icon: Database,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    status: "Active",
    stats: "已儲存 1,245 筆紀錄"
  },
  {
    id: "output-studio",
    title: "鍛造工坊 (Output Studio)",
    desc: "一鍵生成符合供應鏈要求的溫室氣體盤查清冊與簡易版永續報告。",
    icon: FileOutput,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    status: "Ready",
    stats: "可生成 3 種標準報表"
  },
  {
    id: "reporting-dashboard",
    title: "全景觀測台 (Vision Dashboard)",
    desc: "視覺化呈現碳排放趨勢、能源使用效率等關鍵 ESG 指標。",
    icon: LayoutDashboard,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    status: "Active",
    stats: "即時更新中"
  },
  {
    id: "5t-badge-center",
    title: "認證獎章 (Certifications)",
    desc: "展示企業獲得的 ESG 認證徽章，可直接分享給客戶或供應鏈夥伴。",
    icon: ShieldCheck,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    status: "New",
    stats: "已獲得 2 枚徽章"
  }
];

export function SmeDashboardView() {
  const { aiProxyMode, lang } = useAppContext();
  const [activeModule, setActiveModule] = useState<string | null>(null);
  
  // 【善 & 真】任務證據化狀態
  const [tasks, setTasks] = useState(() => [
    { 
      id: 1, 
      text: "補齊 2023 年 Q4 廢棄物清運單據", 
      isSealed: false,
      coreData: {
        uuid: "SME-TSK-001",
        version: 'v1.0.0-immutable',
        timestamp: 1710580800000, // Fixed genesis timestamp
        source_origin: "MANUAL_UPLOAD",
        payload: { value: "3.2", unit: "Tons", label: "廢棄物總量" },
        evidence: [],
        traceability_chain: [{ action: 'GENESIS', timestamp: 1710580800000, actor: 'USER_SME', source_origin: 'MANUAL_UPLOAD' }]
      } as IComponentCore
    },
    { id: 2, text: "確認供應商 A 的碳排聲明書", isSealed: false },
    { id: 3, text: "更新公司基本資料與聯絡人", isSealed: false },
  ]);

  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [isComputing, setIsComputing] = useState<number | null>(null);

  const handleSealTask = (taskId: number) => {
    setIsComputing(taskId);
    setTimeout(() => {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId && t.coreData) {
          const sealed = TrustVault.seal(t.coreData, 'USER_SME');
          sentientBus.emit({ type: 'DATA_SEALED', payload: sealed });
          return { ...t, isSealed: true, coreData: sealed };
        }
        return t;
      }));
      setIsComputing(null);
    }, 1200);
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
    setTaskToDelete(null);
  };

  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能實作代理" : "Omni SME Agent",
      subtitle: "Omni AI Agent",
      description: lang === "zh" ? "萬能代理：AI 自主執行模式。自動從各個數據源提取實作數據，並鍛造為合規報表。" : "AI agent auto-extracting SME data and manufacturing compliance reports.",
      accent: "from-[#8B5CF6] to-[#7C3AED]",
      tag: "[自動]",
      icon: Zap
  } : {
      title: lang === "zh" ? "萬能實作中心" : "Omni SME Center",
      subtitle: "Omni Manual Control",
      description: lang === "zh" ? "萬能核實：專為企業打造的 ESG 實作路徑。從單據採集到成果展示，輕鬆應對供應鏈要求。" : "ESG implementation pathway for SMEs. From collection to legacy exhibition.",
      accent: "from-[#009E9D] to-[#219EBC]",
      tag: "[手動]",
      icon: LayoutDashboard
  };

  const getSmeLabels = () => {
    if (aiProxyMode) {
      return {
        "input-center": "自動採集 (Harvest)",
        "record-center": "安全封存 (Archive)",
        "output-studio": "智能鍛造 (Manufacture)",
        "reporting-dashboard": "自主監測 (Monitor)",
        "5t-badge-center": "協議證章 (Protocol)"
      };
    }
    return {
      "input-center": "數據採集 (Collect)",
      "record-center": "數據管理 (Secure)",
      "output-studio": "報告產出 (Forge)",
      "reporting-dashboard": "全景監測 (Vision)",
      "5t-badge-center": "成果展示 (Legacy)"
    };
  };

  const labels = getSmeLabels();

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-300">系統狀態</p>
              <p className="font-bold text-emerald-400">運作正常</p>
            </div>
          </div>
        }
      />

      <SoulNavigatorLog />

      {/* Main Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SME_MODULES.map((mod, idx) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <GlassCard
              className={`h-full p-6 cursor-pointer group hover:-translate-y-1 transition-all duration-300 border ${mod.border} ${activeModule === mod.id ? 'ring-2 ring-offset-2 ring-[#009E9D]' : ''}`}
              onClick={() => setActiveModule(mod.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${mod.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <Badge variant={mod.status === 'Active' ? 'optimal' : mod.status === 'New' ? 'critical' : 'lethal'} styleType="soft">
                  {mod.status}
                </Badge>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-[#009E9D] transition-colors">
                {labels[mod.id as keyof typeof labels]}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 min-h-[60px]">
                {mod.desc}
              </p>
              
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  {mod.stats}
                </span>
                <ArrowRight className={`w-4 h-4 ${mod.color} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`} />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <GlassCard className="p-5 md:p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#009E9D]" />
            近期活動紀錄
          </h3>
          <div className="space-y-4">
            {[
              { title: "上傳 2024 年 2 月份電費單", time: "2 小時前", status: "success", type: "Input" },
              { title: "生成 Q1 溫室氣體盤查初稿", time: "昨天", status: "success", type: "Output" },
              { title: "系統自動比對異常用水量", time: "3 天前", status: "warning", type: "Alert" },
              { title: "獲得「數據可溯源」5T 徽章", time: "上週", status: "success", type: "Badge" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={`w-2 h-2 rounded-full ${activity.status === 'success' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">{activity.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{activity.time}</p>
                </div>
                <Badge variant="optimal" styleType="soft" className="text-[10px]">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5 md:p-6 bg-gradient-to-br from-[#009E9D]/5 to-transparent border-[#009E9D]/20">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            待辦任務建議
          </h3>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="group transition-all">
                {task.coreData ? (
                  <div className="space-y-3">
                    <LiquidGlassCard 
                      data={task.coreData} 
                      isSealed={(task as any).isSealed}
                      isComputing={isComputing === task.id}
                    />
                    {!(task as any).isSealed && (
                      <Button 
                        onClick={() => handleSealTask(task.id)}
                        className="w-full bg-[#009E9D] hover:bg-[#008E8D] text-white font-bold text-xs tracking-widest py-2 rounded-lg"
                      >
                        確認並進行 5T 封印
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm group relative">
                    <div className="w-5 h-5 rounded border border-slate-300 flex-shrink-0 mt-0.5 cursor-pointer hover:border-[#009E9D] transition-colors" />
                    <p className="text-sm text-slate-600 leading-relaxed pr-6">{task.text}</p>
                    <button
                      onClick={() => setTaskToDelete(task.id)}
                      className="absolute right-3 top-3 p-1 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="刪除任務"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-10 !bg-transparent">
                <CheckCircle2 className="w-10 h-10 text-emerald-100 mx-auto mb-2" />
                <p className="text-sm text-slate-400">所有任務皆已完成</p>
              </div>
            )}
          </div>
          <Button variant="wireframe" className="w-full mt-6 bg-white border-black/5 hover:border-[#009E9D]/30 transition-colors shadow-sm">
            <Plus className="w-4 h-4 mr-1" /> 新增任務
          </Button>
        </GlassCard>
      </div>

      {/* Confirmation Dialog for Task Deletion */}
      {taskToDelete !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-rose-100 text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                確認刪除任務？
              </h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              此操作將永久刪除該任務，無法復原。您確定要繼續嗎？
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteTask(taskToDelete)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-500 hover:bg-rose-600 transition-colors"
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
