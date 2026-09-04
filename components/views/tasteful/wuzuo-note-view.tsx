"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Calendar as CalendarIcon, 
  Tag, 
  Plus, 
  Search, 
  CheckCircle2, 
  Circle,
  FileText,
  AlignLeft,
  Trash2,
  Save,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAppContext } from "@/lib/context/app-context";
import { ViewHeader } from "@/components/ui/view-header";

type OmniEntry = {
  id: string;
  title: string;
  content: string;
  date: string | null;
  tags: string[];
  isTask: boolean;
  completed: boolean;
};

const INITIAL_ENTRIES: OmniEntry[] = [
  {
    id: "1",
    title: "GRI 2026 報告書初稿撰寫",
    content: "需要整合各部門的數據，特別是環境面的碳排放數據。參考去年的框架進行更新。",
    date: "2026-03-15",
    tags: ["ESG報告", "GRI", "環境"],
    isTask: true,
    completed: false,
  },
  {
    id: "2",
    title: "CBAM 碳足跡數據盤點會議",
    content: "與供應商確認 Q1 的碳足跡數據，確保符合歐盟 CBAM 過渡期申報要求。",
    date: "2026-03-10",
    tags: ["CBAM", "碳足跡", "供應鏈"],
    isTask: true,
    completed: true,
  },
  {
    id: "3",
    title: "利害關係人議合策略",
    content: "今年重點關注社區發展與員工福祉。預計發放 500 份線上問卷。",
    date: null,
    tags: ["利害關係人", "社會", "策略"],
    isTask: false,
    completed: false,
  },
  {
    id: "4",
    title: "Q1 永續委員會簡報準備",
    content: "總結 Q1 的減碳成效與社會參與專案進度。需要產出 15 頁的簡報。",
    date: "2026-03-25",
    tags: ["委員會", "里程碑", "治理"],
    isTask: true,
    completed: false,
  },
];

const AVAILABLE_TAGS = ["ESG報告", "GRI", "環境", "CBAM", "碳足跡", "供應鏈", "利害關係人", "社會", "策略", "委員會", "里程碑", "治理", "FSC97"];

export function OmniNoteView() {
  const [entries, setEntries] = useState<OmniEntry[]>(INITIAL_ENTRIES);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(INITIAL_ENTRIES[0].id);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "notes" | "calendar" | "tasks">("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { aiProxyMode, lang } = useAppContext();

  const branding = aiProxyMode ? {
      title: lang === "zh" ? "萬能自動採集" : "Omni Harvest",
      subtitle: "Omni AI Agent",
      description: lang === "zh" ? "萬能代理：自主代理採集中心。自動從各個數據源提取關鍵資訊。" : "Autonomous harvesting hub via AI agent. Auto-extracts critical data.",
      accent: "from-[#8B5CF6] to-[#7C3AED]",
      tag: "[自動]",
      icon: TrendingUp
  } : {
      title: lang === "zh" ? "萬能數據採集" : "Omni Data Source",
      subtitle: "Omni Manual Control",
      description: lang === "zh" ? "萬能核實：手動採集與紀錄永續數據，建立企業意志的核心庫。" : "Manually collecting and recording sustainability data.",
      accent: "from-[#009E9D] to-[#219EBC]",
      tag: "[手動]",
      icon: Book
  };

  const selectedEntry = entries.find(e => e.id === selectedEntryId) || null;

  const handleCreateEntry = () => {
    const newEntry: OmniEntry = {
      id: Date.now().toString(),
      title: "新筆記",
      content: "",
      date: null,
      tags: [],
      isTask: false,
      completed: false,
    };
    setEntries([newEntry, ...entries]);
    setSelectedEntryId(newEntry.id);
  };

  const handleUpdateEntry = (id: string, updates: Partial<OmniEntry>) => {
    setEntries(entries.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
    }
  };

  const toggleTaskCompletion = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const entry = entries.find(e => e.id === id);
    if (entry) {
      handleUpdateEntry(id, { completed: !entry.completed });
    }
  };

  const toggleTag = (tag: string) => {
    if (!selectedEntry) return;
    const newTags = selectedEntry.tags.includes(tag)
      ? selectedEntry.tags.filter(t => t !== tag)
      : [...selectedEntry.tags, tag];
    handleUpdateEntry(selectedEntry.id, { tags: newTags });
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          entry.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag ? entry.tags.includes(selectedTag) : true;
    
    let matchesType = true;
    if (activeFilter === "notes") matchesType = !entry.isTask && !entry.date;
    if (activeFilter === "calendar") matchesType = !!entry.date;
    if (activeFilter === "tasks") matchesType = entry.isTask;

    return matchesSearch && matchesTag && matchesType;
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <ViewHeader
        {...branding}
        aiProxyMode={aiProxyMode}
        rightElement={
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-slate-100 text-slate-600 border-none px-4 py-2 flex items-center gap-2">
              <Book className="w-4 h-4" /> [可透]：知識萃取
            </Badge>
            <Badge className="bg-slate-100 text-slate-600 border-none px-4 py-2 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> [可感]：時間節點
            </Badge>
          </div>
        }
      />

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px] md:min-h-[600px] overflow-hidden">
        
        {/* Left Panel: List & Filters */}
        <GlassCard className={`w-full lg:w-1/3 flex flex-col overflow-hidden border-t-4 ${aiProxyMode ? 'border-t-purple-500' : 'border-t-[#219EBC]'} ${selectedEntryId && "hidden lg:flex"}`}>
          <div className="p-5 border-b border-slate-100 space-y-4 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">所有項目</h2>
              <button 
                onClick={handleCreateEntry}
                className="p-2 bg-[#219EBC] text-white rounded-lg hover:bg-[#1A829C] transition-colors focus-visible:ring-2 focus-visible:ring-[#219EBC] focus:outline-none"
                title="新增筆記"
                aria-label="新增筆記"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="搜尋筆記、任務或日程..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#219EBC]/50"
              />
            </div>

            {/* View Filters */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
              {[
                { id: "all", label: "全部", icon: AlignLeft },
                { id: "notes", label: "筆記", icon: Book },
                { id: "calendar", label: "日程", icon: CalendarIcon },
                { id: "tasks", label: "任務", icon: CheckCircle2 },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all ${
                    activeFilter === f.id ? "bg-white text-[#219EBC] shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <f.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{f.label}</span>
                </button>
              ))}
            </div>

            {/* Tag Filter */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge 
                className={`cursor-pointer transition-colors ${selectedTag === null ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                onClick={() => setSelectedTag(null)}
              >
                全部標籤
              </Badge>
              {AVAILABLE_TAGS.slice(0, 5).map(tag => (
                <Badge 
                  key={tag}
                  className={`cursor-pointer transition-colors ${selectedTag === tag ? 'bg-[#009E9D] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Entry List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {filteredEntries.map(entry => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={entry.id}
                  onClick={() => setSelectedEntryId(entry.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    selectedEntryId === entry.id 
                      ? 'bg-[#219EBC]/5 border-[#219EBC]/30 shadow-sm' 
                      : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {entry.isTask && (
                      <button 
                        onClick={(e) => toggleTaskCompletion(entry.id, e)}
                        className="mt-0.5 shrink-0 rounded focus-visible:ring-2 focus-visible:ring-[#219EBC] focus:outline-none"
                        aria-label={entry.completed ? "標記為未完成" : "標記為完成"}
                      >
                        {entry.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-slate-300 hover:text-[#219EBC]" />
                        )}
                      </button>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold truncate ${entry.isTask && entry.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {entry.title || "無標題"}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                        {entry.date && (
                          <span className="flex items-center gap-1 text-xs font-medium text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                            <CalendarIcon className="w-3 h-3" />
                            {entry.date}
                          </span>
                        )}
                        {entry.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-xs font-medium text-[#009E9D] bg-[#009E9D]/10 px-1.5 py-0.5 rounded">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 2 && (
                          <span className="text-xs text-slate-400">+{entry.tags.length - 2}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredEntries.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>沒有找到符合的項目</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </GlassCard>

        {/* Right Panel: Editor */}
        <GlassCard className={`w-full lg:w-2/3 flex flex-col overflow-hidden border-t-4 ${aiProxyMode ? 'border-t-purple-600' : 'border-t-[#009E9D]'} ${!selectedEntryId && "hidden lg:flex"}`}>
          {selectedEntry ? (
            <>
              <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 bg-white">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setSelectedEntryId(null)}
                    className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-[#219EBC] hover:bg-slate-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#219EBC] focus:outline-none"
                    aria-label="返回列表"
                  >
                    <AlignLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={selectedEntry.title}
                      onChange={(e) => handleUpdateEntry(selectedEntry.id, { title: e.target.value })}
                      placeholder="輸入標題..."
                      className="w-full text-xl md:text-2xl font-bold text-slate-800 bg-transparent border-none outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => handleDeleteEntry(selectedEntry.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none"
                    title="刪除"
                    aria-label="刪除筆記"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    儲存
                  </button>
                </div>
              </div>

              {/* Omni Properties Bar */}
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center gap-6 shrink-0">
                {/* Task Toggle */}
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={selectedEntry.isTask}
                    onChange={(e) => handleUpdateEntry(selectedEntry.id, { isTask: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-[#219EBC] focus:ring-[#219EBC]"
                  />
                  <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">設為任務</span>
                </label>

                {/* Date Picker (Omni-Calendar) */}
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    value={selectedEntry.date || ""}
                    onChange={(e) => handleUpdateEntry(selectedEntry.id, { date: e.target.value || null })}
                    className="text-sm bg-transparent border-none outline-none text-slate-600 font-medium cursor-pointer"
                  />
                </div>
              </div>

              {/* Tags Area (Omni-Tags) */}
              <div className="px-6 py-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">萬能標籤 (Omni-Tags)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => {
                    const isActive = selectedEntry.tags.includes(tag);
                    return (
                      <Badge 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`cursor-pointer transition-all ${
                          isActive 
                            ? 'bg-[#009E9D] text-white shadow-sm' 
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-[#009E9D]/50 hover:text-[#009E9D]'
                        }`}
                      >
                        {isActive && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                        #{tag}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              {/* Content Editor (Omni-Note) */}
              <div className="flex-1 p-6 overflow-y-auto bg-white">
                <textarea
                  value={selectedEntry.content}
                  onChange={(e) => handleUpdateEntry(selectedEntry.id, { content: e.target.value })}
                  placeholder="在此輸入筆記內容、策略構思或治理邏輯..."
                  className="w-full h-full min-h-[300px] resize-none border-none outline-none text-slate-700 leading-relaxed text-lg placeholder:text-slate-300"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <Book className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-500">選擇一個項目或建立新筆記</p>
              <p className="text-sm mt-2">萬能筆記 = 筆記 + 日曆 + 任務 + 標籤</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
