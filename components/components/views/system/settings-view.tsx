"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Server,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Rocket,
  ShieldCheck,
  Sparkles,
  Cpu,
  Key,
  Network,
  Zap,
  ChevronDown,
  Lock,
  CpuIcon,
  Activity,
  Database,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "@/lib/context/app-context";

import { ViewHeader } from "@/components/ui/view-header";
import { PAGE_GUIDES } from "@/lib/config/guides";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const { aiProxyMode, setAiProxyMode, lang } = useAppContext();
  
  const [smtpConfig, setSmtpConfig] = useState({
    from: "jun@esgsunshine.com",
    user: "jun@esgsunshine.com",
    password: "",
    host: "esgsunshine.com",
    port: "465",
    security: "TLS",
    testEmail: "jun@esgsunshine.com",
  });

  const [errors, setErrors] = useState<{
    from?: string;
    testEmail?: string;
    port?: string;
  }>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(
    null,
  );
  const [testErrorMessage, setTestErrorMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [llmConfig, setLlmConfig] = useState({
    provider: "Google Gemini",
    apiKey: "",
    modelId: "gemini-3.0-pro",
    temperature: "0.7"
  });

  const [nodeConfig, setNodeConfig] = useState({
    primaryUrl: "wss://node-alpha.omninfo.network",
    backupUrl: "wss://node-beta.omninfo.network",
    hashStrategy: "SHA-256-V3"
  });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePort = (port: string) => {
    const portNum = parseInt(port, 10);
    return (
      !isNaN(portNum) && portNum >= 1 && portNum <= 65535 && port.trim() !== ""
    );
  };

  const handleTestEmail = () => {
    const newErrors: { from?: string; testEmail?: string; port?: string } = {};

    if (!validateEmail(smtpConfig.from)) {
      newErrors.from = "Please enter a valid email address";
    }

    if (!validateEmail(smtpConfig.testEmail)) {
      newErrors.testEmail = "Please enter a valid email address";
    }

    if (!validatePort(smtpConfig.port)) {
      newErrors.port = "Port must be between 1 and 65535";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsTesting(true);
      setTestResult(null);
      setTestErrorMessage("");

      setTimeout(() => {
        setIsTesting(false);
        if (!smtpConfig.password) {
          setTestResult("error");
          setTestErrorMessage("Authentication failed. Please verify credentials.");
        } else {
          setTestResult("success");
          setTestErrorMessage("");
        }
      }, 1500);
    }
  };

  return (
    <div className="view-container animate-in fade-in duration-500">
      <ViewHeader
        title={lang === "zh" ? "核心設定" : "System Settings"}
        subtitle="OmniESGcell Kernel Configuration"
        description={lang === "zh" ? "配置平台的底座參數，包含代理模式、算力引擎、溯源網格及傳輸通訊協議。" : "Configure the platform's kernel parameters, including proxy modes, AI engines, and traceable grids."}
        icon={Server}
        tag="KERNEL"
        aiProxyMode={aiProxyMode}
        guideSteps={PAGE_GUIDES.settings}
      />

      <GlassCard className="p-10 border border-border bg-bg-surface/30 shadow-flat mb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-primary/10 rounded-[1px] shadow-inner">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.3em] italic">Proxy Mode Orchestration</h2>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Sacred architecture control layer</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Manual Control */}
          <div
            onClick={() => setAiProxyMode(false)}
            className={cn(
              "cursor-pointer group relative overflow-hidden p-8 rounded-[1px] border transition-all duration-300",
              !aiProxyMode
                ? "border-primary bg-primary/[0.03] shadow-flat"
                : "border-border bg-bg-base hover:border-primary/40"
            )}
          >
             {/* Status Badge */}
             <div className="absolute top-0 right-0 p-4">
                <div className={cn("w-2 h-2 rounded-full", !aiProxyMode ? "bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" : "bg-border")} />
             </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-bg-surface rounded-[1px] border border-border shadow-inner">
                <ShieldCheck className={cn("w-6 h-6 transition-colors", !aiProxyMode ? "text-primary" : "text-text-muted opacity-40")} />
              </div>
              <h3 className="text-sm font-black text-text-main uppercase italic tracking-widest">Manual Control</h3>
            </div>

            <p className="text-[11px] font-bold text-text-muted leading-relaxed mb-6 italic opacity-60">
              Direct administrative authority over 5T protocol states. All trust-level operations require distinct physical signing.
            </p>
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-[1px] border text-[9px] font-black uppercase tracking-widest italic transition-all", !aiProxyMode ? "bg-primary/10 border-primary text-primary" : "bg-bg-base border-border text-text-muted opacity-40")}>
               {!aiProxyMode ? "Active Overseer" : "Inherited Mode"}
            </div>
          </div>

          {/* Omni Proxy */}
          <div
            onClick={() => setAiProxyMode(true)}
            className={cn(
              "cursor-pointer group relative overflow-hidden p-8 rounded-[1px] border transition-all duration-300",
              aiProxyMode
                ? "border-proxy bg-proxy/[0.03] shadow-flat"
                : "border-border bg-bg-base hover:border-proxy/40"
            )}
          >
             <div className="absolute top-0 right-0 p-4">
                <div className={cn("w-2 h-2 rounded-full", aiProxyMode ? "bg-proxy animate-pulse shadow-[0_0_8px_var(--color-proxy)]" : "bg-border")} />
             </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-proxy/10 rounded-[1px] border border-proxy/20 shadow-inner">
                <Rocket className={cn("w-6 h-6 transition-colors", aiProxyMode ? "text-proxy" : "text-text-muted opacity-40")} />
              </div>
              <h3 className="text-sm font-black text-text-main uppercase italic tracking-widest">Omni Proxy</h3>
            </div>

            <p className="text-[11px] font-bold text-text-muted leading-relaxed mb-6 italic opacity-60">
              Autonomous execution guided by the 5T spiritual mandates. Automated data flow, compliance verification, and risk sealing.
            </p>
            <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-[1px] border text-[9px] font-black uppercase tracking-widest italic transition-all", aiProxyMode ? "bg-proxy/10 border-proxy text-proxy" : "bg-bg-base border-border text-text-muted opacity-40")}>
               {aiProxyMode ? "AI Orbis Sync" : "Dormant Node"}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-border/40 flex items-center justify-between">
           <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] italic opacity-40">System_Kernel_State: {aiProxyMode ? 'OMNI_AGENT' : 'ROOT_OVERRIDE'}</span>
           <div className="flex items-center gap-3">
              <Activity className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-[9px] font-black text-primary uppercase tracking-widest italic">Omni Protocol Responsive</span>
           </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Computing Engine */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-primary" />
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Computing Engine (Omni Energy)</h2>
          </div>
          <GlassCard className="p-10 border border-border shadow-flat bg-bg-surface/30">
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Provider Engine</label>
                  <div className="relative group">
                    <select
                      value={llmConfig.provider}
                      onChange={(e) => setLlmConfig({ ...llmConfig, provider: e.target.value })}
                      className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[11px] font-black uppercase tracking-widest italic text-text-main focus:outline-none focus:border-primary appearance-none cursor-pointer transition-all shadow-inner"
                    >
                      <option value="Google Gemini">Google Gemini (Optimal)</option>
                      <option value="OmniESGcell Native">Omni Native (Edge)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Specified Sequence (Model)</label>
                   <div className="relative group">
                    <select
                      value={llmConfig.modelId}
                      onChange={(e) => setLlmConfig({ ...llmConfig, modelId: e.target.value })}
                      className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[11px] font-black uppercase tracking-widest italic text-text-main focus:outline-none focus:border-primary appearance-none cursor-pointer transition-all shadow-inner"
                    >
                      <option value="gemini-3.0-pro">Gemini 3.0 Pro</option>
                      <option value="gemini-3.0-flash">Gemini 3.0 Flash</option>
                      <option value="gemini-exp">Gemini Experimental</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" /> Authentication Token
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={llmConfig.apiKey}
                      onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                      className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[10px] font-mono font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/40 flex justify-end">
                <Button 
                  variant="wireframe"
                  className="h-10 px-8 text-[9px] font-black uppercase tracking-widest italic rounded-[1px] border-border"
                  onClick={() => toast.promise(
                    new Promise((resolve) => setTimeout(resolve, 1500)),
                    {
                      loading: 'Verifying computing nodes...',
                      success: 'Node sequence validated',
                      error: 'Sequence failure',
                    }
                  )}
                >
                  <Zap className="w-4 h-4 mr-2" /> Validate Node
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* Traceable Nodes */}
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-8">
           <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-primary" />
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.2em] italic">Traceability Grid (NCBDB Node)</h2>
          </div>
          <GlassCard className="p-10 border border-border shadow-flat bg-bg-surface/30 h-full flex flex-col justify-between">
            <div className="space-y-8">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Primary Node Anchor</label>
                  <input
                    type="text"
                    value={nodeConfig.primaryUrl}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, primaryUrl: e.target.value })}
                    className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[10px] font-mono font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner"
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Redundant Backup Link</label>
                  <input
                    type="text"
                    value={nodeConfig.backupUrl}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, backupUrl: e.target.value })}
                    className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[10px] font-mono font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner"
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Hashing Logic</label>
                  <div className="px-4 py-4 bg-bg-base border border-border rounded-[1px] text-[10px] font-mono font-bold text-primary italic shadow-inner">
                    SHA-256-V3 (Omni Deterministic)
                  </div>
               </div>
            </div>
            
            <div className="mt-12 flex items-center justify-between p-4 bg-primary/[0.03] border border-primary/20 rounded-[1px]">
               <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-black text-text-main uppercase tracking-widest italic">Storage Quota: 85% Utilized</span>
               </div>
               <div className="w-32 h-1 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[85%]" />
               </div>
            </div>
          </GlassCard>
        </motion.section>
      </div>

      {/* SMTP Configuration */}
      <GlassCard className="p-10 border border-border bg-bg-surface/30 shadow-flat mb-12">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-primary/10 rounded-[1px] shadow-inner">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-[11px] font-black text-text-main uppercase tracking-[0.3em] italic">Sacred Transfer Protocol (SMTP)</h2>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.1em] mt-1 italic">Normalized verified communication grid</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-6 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">From Anchor (Address)</label>
                <input
                  type="email"
                  value={smtpConfig.from}
                  onChange={(e) => {
                    setSmtpConfig({ ...smtpConfig, from: e.target.value });
                    if (errors.from) setErrors({ ...errors, from: undefined });
                  }}
                  className={cn("w-full bg-bg-base border rounded-[1px] px-4 h-12 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner", errors.from ? "border-status-lethal" : "border-border")}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Identity Identifier (User)</label>
                <input
                  type="text"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, user: e.target.value })}
                  className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic text-primary">Sacred Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                    className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[10px] font-mono font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Host Vector</label>
                <input
                  type="text"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                  className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[10px] font-mono font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Port Index</label>
                <input
                  type="text"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                  className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[10px] font-mono font-bold text-text-main focus:outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest italic">Security Guard</label>
                <div className="relative group">
                  <select
                    value={smtpConfig.security}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, security: e.target.value })}
                    className="w-full bg-bg-base border border-border rounded-[1px] px-4 h-12 text-[11px] font-black uppercase tracking-widest italic text-text-main focus:outline-none focus:border-primary appearance-none cursor-pointer transition-all shadow-inner"
                  >
                    <option value="TLS">TLS [Locked]</option>
                    <option value="SSL">SSL [Secure]</option>
                    <option value="None">None [Hazard]</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 flex flex-col justify-end">
             <div className="p-8 bg-bg-base border border-border rounded-[1px] shadow-inner flex flex-col gap-6">
                <div className="flex items-center gap-3">
                   <Target className="w-5 h-5 text-primary" />
                   <h4 className="text-[11px] font-black text-text-main uppercase tracking-widest italic">Sandbox Validation</h4>
                </div>
                <div className="space-y-4">
                   <input
                    type="email"
                    value={smtpConfig.testEmail}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, testEmail: e.target.value })}
                    placeholder="TEST RECIPIENT..."
                    className="w-full bg-bg-surface border border-border rounded-[1px] px-4 h-12 text-[11px] font-bold text-text-main focus:outline-none focus:border-primary shadow-inner italic"
                   />
                   <Button variant="wireframe" className="w-full h-12 text-[10px] font-black uppercase tracking-widest italic border-primary/20 text-primary hover:bg-primary/5" onClick={handleTestEmail} disabled={isTesting}>
                      {isTesting ? "Validating..." : "Execute Pulse Test"}
                   </Button>
                </div>
                
                {testResult === "success" && (
                  <div className="flex items-center gap-3 text-status-optimal text-[9px] font-black uppercase tracking-widest italic bg-status-optimal/5 p-4 border border-status-optimal/20 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4" /> Grid Connection Nominal
                  </div>
                )}
                {testResult === "error" && (
                  <div className="flex items-start gap-3 text-status-lethal text-[9px] font-black uppercase tracking-widest italic bg-status-lethal/5 p-4 border border-status-lethal/20 animate-in shake">
                    <AlertCircle className="w-4 h-4 mt-0.5" /> Grid Transmission Failure
                  </div>
                )}
             </div>

             <Button variant="solid" className="w-full h-14 text-[10px] font-black uppercase tracking-[0.2em] italic rounded-[1px] shadow-2xl border-none" onClick={() => toast.success("Kernel settings successfully sealed via Hash Lock!")}>
               <Lock className="w-4 h-4 mr-3" /> Seal Settings
             </Button>
          </div>
        </div>
      </GlassCard>
      
      <div className="flex justify-center pb-24 opacity-60">
         <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.8em] italic">Omni Protocol Revision v3.0 // Unified Minimalist Kernel</p>
      </div>
    </div>
  );
}

// Helper component for re-use
function Target({ className }: { className?: string }) { return <Shield className={className} />; }
