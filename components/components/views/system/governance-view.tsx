"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "motion/react";
import { 
  Vote, 
  Landmark, 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  Plus,
  ArrowRight,
  Shield,
  Coins,
  Clock,
  FileText,
  Loader2,
  Filter
} from "lucide-react";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

const TREASURY_DATA = [
  { month: "Jan", income: 120000, expense: 80000 },
  { month: "Feb", income: 150000, expense: 90000 },
  { month: "Mar", income: 180000, expense: 110000 },
  { month: "Apr", income: 210000, expense: 150000 },
  { month: "May", income: 250000, expense: 180000 },
  { month: "Jun", income: 340000, expense: 200000 },
];

const PROPOSALS = [
  {
    id: "ESG-2026-001",
    title: "投資 500,000 永續幣於太陽能微電網專案",
    proposer: "綠色能源委員會",
    status: "active",
    votesFor: 45000,
    votesAgainst: 12000,
    votesAbstain: 3000,
    endTime: "2 天後",
    tags: ["環境", "能源", "資金分配"],
    description: "為提升社區能源自主性，提議從永續金庫撥款 50 萬永續幣，用於建置社區太陽能微電網系統，預計每年可減少 150 噸碳排放。"
  },
  {
    id: "ESG-2026-002",
    title: "修訂供應商行為準則：強制要求 Scope 3 碳盤查",
    proposer: "供應鏈管理部",
    status: "passed",
    votesFor: 82000,
    votesAgainst: 5000,
    votesAbstain: 1000,
    endTime: "已結束",
    tags: ["治理", "供應鏈", "政策修訂"],
    description: "為達成 2030 淨零目標，提議修訂供應商行為準則，要求所有一階供應商必須在年底前完成 Scope 3 碳盤查，否則將影響次年採購配額。"
  },
  {
    id: "ESG-2026-003",
    title: "成立『生物多樣性保育』專項基金",
    proposer: "生態保育聯盟",
    status: "active",
    votesFor: 28000,
    votesAgainst: 25000,
    votesAbstain: 8000,
    endTime: "5 小時後",
    tags: ["環境", "生態", "新設基金"],
    description: "提議從年度盈餘中提撥 2% 成立生物多樣性保育專項基金，專門用於支持當地特有種保育及棲地復育計畫。"
  }
];

export function GovernanceView() {
  const [activeTab, setActiveTab] = useState<"proposals" | "treasury" | "delegates">("proposals");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votedProposals, setVotedProposals] = useState<Record<string, string>>({});
  const [txFilter, setTxFilter] = useState<"all" | "income" | "expense">("all");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTxLoading, setIsTxLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "treasury") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsTxLoading(true);
      // Simulate API call
      const timer = setTimeout(() => {
        const allTransactions = [
          { id: "tx-1", title: "偏鄉教育數位化專案", amount: -50000, date: "2026-03-10", type: "expense" },
          { id: "tx-2", title: "綠色供應鏈輔導基金", amount: -120000, date: "2026-03-05", type: "expense" },
          { id: "tx-3", title: "碳權交易收益", amount: 340000, date: "2026-03-01", type: "income" },
          { id: "tx-4", title: "社區太陽能微電網", amount: -200000, date: "2026-02-28", type: "expense" },
          { id: "tx-5", title: "永續幣質押獎勵", amount: 15000, date: "2026-02-25", type: "income" },
          { id: "tx-6", title: "環保包裝研發補助", amount: -80000, date: "2026-02-20", type: "expense" },
          { id: "tx-7", title: "綠色債券利息", amount: 45000, date: "2026-02-15", type: "income" },
        ];
        if (txFilter === "all") {
          setTransactions(allTransactions);
        } else {
          setTransactions(allTransactions.filter(tx => tx.type === txFilter));
        }
        setIsTxLoading(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [activeTab, txFilter]);

  const handleVote = (proposalId: string, voteType: string) => {
    setVotedProposals(prev => ({ ...prev, [proposalId]: voteType }));
    // In a real app, this would call an API
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-indigo-600" />
            永續自治治理平台
          </h1>
          <p className="text-slate-500 mt-2">
            Sustainable Autonomous Governance Platform - 透過去中心化決策，共同塑造企業與社會的永續未來。
          </p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
        >
          <Plus className="w-4 h-4" /> 建立新提案
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Vote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">活躍提案</p>
            <h3 className="text-2xl font-bold text-slate-800">12</h3>
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">金庫餘額 (永續幣)</p>
            <h3 className="text-2xl font-bold text-slate-800">2,450,000</h3>
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">參與治理人數</p>
            <h3 className="text-2xl font-bold text-slate-800">8,245</h3>
          </div>
        </GlassCard>
        <GlassCard className="p-5 flex items-center gap-4">
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">已執行決議</p>
            <h3 className="text-2xl font-bold text-slate-800">156</h3>
          </div>
        </GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        {[
          { id: "proposals", label: "治理提案", icon: FileText },
          { id: "treasury", label: "永續金庫", icon: Landmark },
          { id: "delegates", label: "委託代表", icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "proposals" && (
            <div className="space-y-4">
              {PROPOSALS.map((proposal) => {
                const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
                const forPercent = (proposal.votesFor / totalVotes) * 100;
                const againstPercent = (proposal.votesAgainst / totalVotes) * 100;
                const abstainPercent = (proposal.votesAbstain / totalVotes) * 100;

                return (
                  <GlassCard key={proposal.id} className="p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <Badge variant="optimal" styleType="soft" className="text-slate-500 border-slate-200">
                            {proposal.id}
                          </Badge>
                          {proposal.status === "active" ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> 進行中 ({proposal.endTime})
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> 已通過
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{proposal.title}</h3>
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{proposal.description}</p>
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" /> 提案人: {proposal.proposer}
                          </span>
                          <div className="flex gap-2">
                            {proposal.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 bg-slate-100 rounded-md text-xs">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-72 flex flex-col justify-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> 贊成</span>
                            <span className="font-bold">{forPercent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${forPercent}%` }} />
                          </div>
                        </div>
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-rose-600 font-medium flex items-center gap-1"><XCircle className="w-4 h-4"/> 反對</span>
                            <span className="font-bold">{againstPercent.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${againstPercent}%` }} />
                          </div>
                        </div>
                        
                        {proposal.status === "active" && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <button 
                              onClick={() => handleVote(proposal.id, 'for')}
                              disabled={!!votedProposals[proposal.id]}
                              className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                                votedProposals[proposal.id] === 'for' 
                                  ? 'bg-emerald-600 text-white' 
                                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:opacity-50'
                              }`}
                            >
                              贊成
                            </button>
                            <button 
                              onClick={() => handleVote(proposal.id, 'against')}
                              disabled={!!votedProposals[proposal.id]}
                              className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                                votedProposals[proposal.id] === 'against' 
                                  ? 'bg-rose-600 text-white' 
                                  : 'bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-50'
                              }`}
                            >
                              反對
                            </button>
                            <button 
                              onClick={() => handleVote(proposal.id, 'abstain')}
                              disabled={!!votedProposals[proposal.id]}
                              className={`py-2 rounded-lg text-sm font-bold transition-colors ${
                                votedProposals[proposal.id] === 'abstain' 
                                  ? 'bg-slate-600 text-white' 
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50'
                              }`}
                            >
                              棄權
                            </button>
                          </div>
                        )}
                        {votedProposals[proposal.id] && (
                          <p className="text-xs text-center text-slate-500 mt-2">
                            您已投票：{
                              votedProposals[proposal.id] === 'for' ? '贊成' : 
                              votedProposals[proposal.id] === 'against' ? '反對' : '棄權'
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {activeTab === "treasury" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <GlassCard className="p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800">資金流向分析</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-slate-600">收入 (Income)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500" />
                      <span className="text-slate-600">支出 (Expense)</span>
                    </div>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TREASURY_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => new Intl.NumberFormat('en-US').format(value)}
                      />
                      <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
              <GlassCard className="p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800">近期交易紀錄</h3>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                      value={txFilter}
                      onChange={(e) => setTxFilter(e.target.value as any)}
                      className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="all">全部 (All)</option>
                      <option value="income">收入 (Income)</option>
                      <option value="expense">支出 (Expense)</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                  {isTxLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                      <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                  ) : null}
                  
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-100 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-slate-800">{tx.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{tx.date}</p>
                      </div>
                      <span className={`font-black ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {tx.type === 'income' ? '+' : ''}{new Intl.NumberFormat('en-US').format(tx.amount)}
                      </span>
                    </div>
                  ))}
                  
                  {!isTxLoading && transactions.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      沒有符合的交易紀錄
                    </div>
                  )}
                </div>
                <button className="w-full mt-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                  查看完整帳本
                </button>
              </GlassCard>
            </div>
          )}

          {activeTab === "delegates" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Dr. Sarah Chen", role: "氣候變遷專家", votingPower: "12.5%", delegatedVotes: "1,250,000" },
                { name: "GreenTech Alliance", role: "環保科技聯盟", votingPower: "8.2%", delegatedVotes: "820,000" },
                { name: "Social Impact DAO", role: "社會影響力組織", votingPower: "5.4%", delegatedVotes: "540,000" },
              ].map((delegate, i) => (
                <GlassCard key={i} className="p-6 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{delegate.name}</h3>
                  <p className="text-sm text-slate-500 mb-4">{delegate.role}</p>
                  <div className="w-full bg-slate-50 rounded-xl p-3 mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">投票權重</span>
                      <span className="font-bold text-indigo-600">{delegate.votingPower}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">受託票數</span>
                      <span className="font-bold text-slate-800">{delegate.delegatedVotes}</span>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-white border-2 border-indigo-100 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                    委託投票權
                  </button>
                </GlassCard>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Create Proposal Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  建立新提案
                </h2>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">提案標題</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="例如：投資 500,000 永續幣於太陽能微電網專案"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">提案標籤 (以逗號分隔)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="例如：環境, 能源, 資金分配"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">提案內容與影響</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    placeholder="詳細說明提案的目的、執行方式、預期效益以及需要的資金..."
                  />
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-indigo-800">
                    建立提案需要消耗 <strong>1,000 永續幣</strong> 作為保證金。若提案獲得超過 10% 的贊成票，保證金將全額退還。
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm shadow-indigo-200"
                >
                  提交提案
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
