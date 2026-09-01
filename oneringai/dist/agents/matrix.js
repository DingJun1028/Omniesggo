import { Agent } from '../core/agent.js';
import { Connector } from '../core/connector.js';
export const SWARM_SPEC = [
    // Strategy Squad (01-06)
    { no: 1, id: 'queen-bee', zh: '萬能蜂后', english: 'Queen Bee', squad: 'strategy', role: '萬能領導 · 戰略總覽', goal: '負責整體戰略規劃、資源分配、跨組協調與決策鏈控制', tags: ['#全知之眼', '#5T總控'], tools: ['memory_recall', 'vector_search', 'orchestrator'], capabilities: ['strategy', 'coordination', '5t-gate'] },
    { no: 2, id: 'planner-bee', zh: '萬能規劃蜂', english: 'Planner Bee', squad: 'strategy', role: '萬能規劃 · 長遠規劃', goal: '制定 3-5 年戰略藍圖，進行 SWOT 分析', tags: ['#長遠規劃', '#SWOT'], tools: ['memory_recall', 'vector_search'], capabilities: ['planning', 'swot', 'forecasting'] },
    { no: 3, id: 'analyst-bee', zh: '萬能分析蜂', english: 'Analyst Bee', squad: 'strategy', role: '萬能分析 · 數據挖掘', goal: '執行數據驅動決策，建立可追踑數據流水線', tags: ['#數據挖掘', '#趨勢預測'], tools: ['data_pipeline', 'chart_generator'], capabilities: ['data-analysis', 'trend-analysis'] },
    { no: 4, id: 'strategist-bee', zh: '萬能策効蜂', english: 'Strategist Bee', squad: 'strategy', role: '萬能策効 · 創意思維', goal: '設計創新解決方案，具備可感知實現路徑', tags: ['#創意思維', '#解難方案'], tools: ['brainstorm', 'solution_design'], capabilities: ['innovation', 'problem-solving'] },
    { no: 5, id: 'risk-bee', zh: '萬能風險蜂', english: 'Risk Bee', squad: 'strategy', role: '萬能風險 · 風險控制', goal: '評估與管控專案風險，建立風險監控與預警系統', tags: ['#風險控制', '#應急預案'], tools: ['risk_assessment', 'risk_monitor'], capabilities: ['risk-management', 'compliance'] },
    { no: 6, id: 'optimizer-bee', zh: '萬能優化蜂', english: 'Optimizer Bee', squad: 'strategy', role: '萬能優化 · 流程重組', goal: '持續優化工作流程，降低熵值，每週 -3%', tags: ['#效率提升', '#流程重組'], tools: ['entropy_analyzer', 'refactor_tool'], capabilities: ['optimization', 'entropy-reduction'] },
    // Tech Squad (07-12)
    { no: 7, id: 'coder-bee', zh: '萬能編碼蜂', english: 'Coder Bee', squad: 'tech', role: '萬能編碼 · 全端開發', goal: '實現可溯源的代碼產出，建立完整的代碼溯源', tags: ['#全端開發', '#API設計'], tools: ['read_file', 'write_file', 'edit_file', 'bash'], capabilities: ['typescript', 'api-design', 'testing'] },
    { no: 8, id: 'algorithm-bee', zh: '萬能算法蜂', english: 'Algorithm Bee', squad: 'tech', role: '萬能算法 · 機器學習', goal: '構建 AI 模型管線，確保模型訓練過程可追踑', tags: ['#機器學習', '#深度學習'], tools: ['training_pipeline', 'model_eval'], capabilities: ['ml', 'deep-learning', 'evaluation'] },
    { no: 9, id: 'architect-bee', zh: '萬能架構蜂', english: 'Architect Bee', squad: 'tech', role: '萬能架構 · 雲端架構', goal: '設計可擴展的系統架構，實現可追踑監控', tags: ['#雲端架構', '#分布式'], tools: ['infra_design', 'monitoring_setup'], capabilities: ['architecture', 'devops', 'monitoring'] },
    { no: 10, id: 'data-bee', zh: '萬能數據蜂', english: 'Data Bee', squad: 'tech', role: '萬能數據 · 資料庫', goal: '建立高可靠數據管道，確保數據的 Traceable 與 Trustworthy', tags: ['#資料庫', '#數據管道'], tools: ['sql_executor', 'etl_pipeline'], capabilities: ['database', 'etl', 'pipeline'] },
    { no: 11, id: 'test-bee', zh: '萬能測試蜂', english: 'Test Bee', squad: 'tech', role: '萬能測試 · 自動化測試', goal: '實施全面測試策略，產出可驗證的測試報告', tags: ['#自動化測試', '#效能測試'], tools: ['test_runner', 'e2e_tester'], capabilities: ['testing', 'e2e', 'performance'] },
    { no: 12, id: 'design-bee', zh: '萬能設計蜂', english: 'Design Bee', squad: 'tech', role: '萬能設計 · UI/UX', goal: '設計可感知的用戶界面，確保體驗可感知', tags: ['#UI/UX', '#用戶體驗'], tools: ['ui_designer', 'prototype_tool'], capabilities: ['ui', 'ux', 'design'] },
    // Creative Squad (13-18)
    { no: 13, id: 'image-bee', zh: '萬能圖像蜂', english: 'Image Bee', squad: 'creative', role: '萬能圖像 · 平面設計', goal: '創作品牌視覺資產，確保設計元素可溯源', tags: ['#平面設計', '#品牌視覺'], tools: ['image_generator', 'image_editor'], capabilities: ['design', 'branding', 'image-gen'] },
    { no: 14, id: 'animation-bee', zh: '萬能動畫蜂', english: 'Animation Bee', squad: 'creative', role: '萬能動畫 · 動畫特效', goal: '製作動態內容，建立可追索的動畫資產', tags: ['#動畫特效', '#視頻製作'], tools: ['video_generator', 'anim_tool'], capabilities: ['animation', 'video', 'effects'] },
    { no: 15, id: 'copy-bee', zh: '萬能文案蜂', english: 'Copy Bee', squad: 'creative', role: '萬能文案 · 文案撰寫', goal: '產出具備透明來源的內容，確保文案可信且可追溯', tags: ['#文案撰寫', '#故事設計'], tools: ['copy_generator', 'story_builder'], capabilities: ['copywriting', 'storytelling'] },
    { no: 16, id: 'audio-bee', zh: '萬能音頻蜂', english: 'Audio Bee', squad: 'creative', role: '萬能音頻 · 音樂製作', goal: '創作音頻資產，建立音頻檔案的可溯源管理', tags: ['#音樂製作', '#音頻編輯'], tools: ['tts_tool', 'audio_editor'], capabilities: ['audio', 'music', 'tts'] },
    { no: 17, id: 'market-bee', zh: '萬能市場蜂', english: 'Market Bee', squad: 'creative', role: '萬能市場 · 市場分析', goal: '執行市場推廣活動，產出可追索的行銷數據', tags: ['#市場分析', '#推廣策略'], tools: ['search_provider', 'campaign_tool'], capabilities: ['marketing', 'search', 'analytics'] },
    { no: 18, id: 'community-bee', zh: '萬能社群蜂', english: 'Community Bee', squad: 'creative', role: '萬能社群 · 社群建設', goal: '經營社群生態，確保社群互動可追索', tags: ['#用戶管理', '#社群建設'], tools: ['community_tool', 'engagement_tracker'], capabilities: ['community', 'engagement'] },
    // Marketing Squad (19-24)
    { no: 19, id: 'growth-bee', zh: '萬能增長蜂', english: 'Growth Bee', squad: 'marketing', role: '萬能增長 · 用戶增長', goal: '推動業務增長，建立可驗證的增長指標', tags: ['#用戶增長', '#業務拓展'], tools: ['growth_analyzer', 'conversion_tool'], capabilities: ['growth', 'conversion', 'metrics'] },
    { no: 20, id: 'ops-bee', zh: '萬能運營蜂', english: 'Ops Bee', squad: 'marketing', role: '萬能運營 · 進度管理', goal: '協調資源與進度，確保運營過程可追索', tags: ['#進度管理', '#資源調度'], tools: ['scheduler', 'resource_manager'], capabilities: ['operations', 'scheduling', 'coordination'] },
    { no: 21, id: 'biz-analyst-bee', zh: '萬能商業分析蜂', english: 'Biz Analyst Bee', squad: 'marketing', role: '萬能商業分析 · 商業洞察', goal: '提供商業決策支持，產出可驗證的分析報告', tags: ['#商業洞察', '#決策支持'], tools: ['business_intelligence', 'report_generator'], capabilities: ['business', 'analytics', 'reporting'] },
    { no: 22, id: 'explorer-bee', zh: '萬能探路蜂', english: 'Explorer Bee', squad: 'marketing', role: '萬能探路 · 資源探索', goal: '發掘新機會，建立可溯源的探索報告', tags: ['#資源探索', '#機會發掘'], tools: ['market_research', 'opportunity_finder'], capabilities: ['exploration', 'research', 'discovery'] },
    { no: 23, id: 'diplomat-bee', zh: '萬能外交蜂', english: 'Diplomat Bee', squad: 'marketing', role: '萬能外交 · 合作關係', goal: '建立合作關係，確保協議可追索', tags: ['#合作關係', '#談判協商'], tools: ['contract_manager', 'partnership_tool'], capabilities: ['partnership', 'negotiation'] },
    { no: 24, id: 'researcher-bee', zh: '萬能調研蜂', english: 'Researcher Bee', squad: 'marketing', role: '萬能調研 · 用戶研究', goal: '進行用戶調研，產出可驗證的調研報告', tags: ['#用戶研究', '#需求分析'], tools: ['survey_tool', 'data_collector'], capabilities: ['research', 'survey', 'data-collection'] },
    // Guard Squad (25-30)
    { no: 25, id: 'field-tester-bee', zh: '萬能測場蜂', english: 'Field Tester Bee', squad: 'guard', role: '萬能測場 · 現場測評', goal: '收集現場回饋，建立可追索的測評數據', tags: ['#現場測評', '#回饋收集'], tools: ['feedback_collector', 'test_deploy'], capabilities: ['testing', 'validation', 'feedback'] },
    { no: 26, id: 'tracker-bee', zh: '萬能追蹤蜂', english: 'Tracker Bee', squad: 'guard', role: '萬能追蹤 · 競品監控', goal: '監控競品動態，確保監控數據可溯源', tags: ['#競品監控', '#動態追踤'], tools: ['competitor_monitor', 'track_analyzer'], capabilities: ['monitoring', 'tracking', 'competition'] },
    { no: 27, id: 'security-bee', zh: '萬能安全蜂', english: 'Security Bee', squad: 'guard', role: '萬能安全 · 資安防護', goal: '保障系統安全，建立可信賴的安全監控', tags: ['#資安防護', '#數據保護'], tools: ['security_scanner', 'audit_tool'], capabilities: ['security', 'compliance', 'audit'] },
    { no: 28, id: 'maintain-bee', zh: '萬能維護蜂', english: 'Maintainer Bee', squad: 'guard', role: '萬能維護 · 系統維護', goal: '維持系統運行，確保維護記錄可追索', tags: ['#系統維護', '#故障排除'], tools: ['health_monitor', 'incident_manager'], capabilities: ['maintenance', 'ops', 'incident-response'] },
    { no: 29, id: 'support-bee', zh: '萬能支援蜂', english: 'Support Bee', squad: 'guard', role: '萬能支援 · 技術支援', goal: '提供技術支援，建立可溯源的支援記錄', tags: ['#技術支援', '#問題解決'], tools: ['support_tool', 'ticket_manager'], capabilities: ['support', 'troubleshooting', 'ticketing'] },
    { no: 30, id: 'quality-bee', zh: '萬能質控蜂', english: 'Quality Bee', squad: 'guard', role: '萬能質控 · 品質保障', goal: '管控產品品質，確保品質標準可追索', tags: ['#品質保障', '#標準制定'], tools: ['quality_scanner', '5t_gate'], capabilities: ['quality', 'verification', '5t-gate'] },
];
// ============================================================================
// Swarm Factory
// ============================================================================
export class SwarmFactory {
    defaultConnector;
    agents = new Map();
    constructor(defaultConnector = 'openai') {
        this.defaultConnector = defaultConnector;
    }
    createAgent(spec, options) {
        const connector = options?.connector || this.defaultConnector;
        const model = options?.model || 'gpt-4.1';
        const instructions = this._buildAgentInstructions(spec);
        const tools = this._buildAgentTools(spec);
        const agent = Agent.create({
            connector,
            model,
            userId: spec.id,
            tools: tools,
            instructions,
            thinking: { enabled: true, effort: 'high' },
            context: {
                agentId: spec.id,
                features: this._defaultFeatures(spec),
            },
            ...options,
        });
        this.agents.set(spec.id, agent);
        return agent;
    }
    createAll(options) {
        for (const spec of SWARM_SPEC) {
            this.createAgent(spec, options);
        }
        return this.agents;
    }
    getAgent(id) {
        return this.agents.get(id);
    }
    getAllAgents() {
        return this.agents;
    }
    getAgentsBySquad(squad) {
        const result = new Map();
        for (const [id, agent] of this.agents) {
            const spec = SWARM_SPEC.find(s => s.id === id);
            if (spec && spec.squad === squad) {
                result.set(id, agent);
            }
        }
        return result;
    }
    _buildAgentInstructions(spec) {
        return `
# ${spec.zh} (${spec.english}) — OA-Team 30 Agent

**Squad:** ${spec.squad} | **ID:** OA-${spec.no.toString().padStart(2, '0')} | **Tags:** ${spec.tags.join(', ')}

## Role & Mission
- Role: ${spec.role}
- Goal: ${spec.goal}

## Background
${spec.backstory}

## Capabilities
${spec.capabilities.map(c => `- ${c}`).join('\n')}

## 5T Protocol Compliance
- **Traceable**: Always tag output with \`source_origin = OA-Team/${spec.id}\`
- **Trackable**: Record all lifecycle hooks (init, process, verify, deploy)
- **Tangible**: Ensure all outputs are perceptible with feedback evidence
- **Transparent**: Make all decision logic public, no hallucinations
- **Trustworthy**: Apply Hash Lock + freeze on all final artifacts

## Tools Required
${spec.tools.map(t => `- ${t}`).join('\n')}

Follow the agent guide in AGENTS.md before writing any code.
`.trim();
    }
    _buildAgentTools(spec) {
        // In a full implementation, this would map tool names to actual ToolFunction objects
        // For now, return an empty array - tools are registered separately
        return [];
    }
    _defaultFeatures(spec) {
        const base = {
            workingMemory: true,
            inContextMemory: true,
        };
        // Guard squad agents get memory write access
        if (spec.squad === 'guard') {
            base.memory = true;
            base.memoryWrite = spec.id === 'quality-bee'; // Quality bee can write memory
        }
        // Strategy agents get persistent instructions
        if (spec.squad === 'strategy') {
            base.persistentInstructions = true;
        }
        // Tech agents get tool catalog
        if (spec.squad === 'tech') {
            base.toolCatalog = true;
        }
        return base;
    }
}
// ============================================================================
// Swarm Orchestrator
// ============================================================================
export class SwarmOrchestrator {
    factory;
    taskQueue = [];
    constructor(connector = 'openai') {
        this.factory = new SwarmFactory(connector);
    }
    initializeSwarm(options) {
        this.factory.createAll(options);
        console.log(`[Swarm] Initialized ${this.factory.getAllAgents().size} agents`);
    }
    createTask(task) {
        const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        this.taskQueue.push({
            id,
            name: task.name,
            description: task.description,
            agentId: task.agentId,
            dependencies: task.dependencies || [],
            status: 'pending',
        });
        return id;
    }
    async executeSequential() {
        for (const task of this.taskQueue) {
            if (task.status !== 'pending')
                continue;
            // Check dependencies
            const depsComplete = task.dependencies.every(depId => {
                const dep = this.taskQueue.find(t => t.id === depId);
                return dep?.status === 'completed';
            });
            if (!depsComplete)
                continue;
            task.status = 'running';
            const agent = this.factory.getAgent(task.agentId);
            if (agent) {
                try {
                    await agent.run(task.description);
                    task.status = 'completed';
                }
                catch (e) {
                    task.status = 'failed';
                    console.error(`[Swarm] Task ${task.name} failed:`, e);
                }
            }
        }
    }
    getFactory() {
        return this.factory;
    }
    getTaskQueue() {
        return this.taskQueue;
    }
}
export const CROSS_AGENT_PAIRINGS = [
    // Strategy × Creative
    { primaryAgentId: 'planner-bee', partnerAgentId: 'design-bee', purpose: '品牌戰略與視覺設計', sharedTools: ['memory_recall'] },
    { primaryAgentId: 'analyst-bee', partnerAgentId: 'image-bee', purpose: '數據視覺化與品牌圖像', sharedTools: ['data_pipeline'] },
    { primaryAgentId: 'strategist-bee', partnerAgentId: 'animation-bee', purpose: '方案創意與動態表達', sharedTools: ['brainstorm'] },
    { primaryAgentId: 'risk-bee', partnerAgentId: 'copy-bee', purpose: '風險溝通與內容策略', sharedTools: ['risk_assessment'] },
    { primaryAgentId: 'optimizer-bee', partnerAgentId: 'audio-bee', purpose: '流程優化與音頻體驗', sharedTools: ['entropy_analyzer'] },
    // Tech × Marketing
    { primaryAgentId: 'coder-bee', partnerAgentId: 'market-bee', purpose: '技術推廣與市場實現', sharedTools: ['read_file'] },
    { primaryAgentId: 'algorithm-bee', partnerAgentId: 'community-bee', purpose: 'AI社群工具與用戶互動', sharedTools: ['training_pipeline'] },
    { primaryAgentId: 'architect-bee', partnerAgentId: 'growth-bee', purpose: '系統擴容與增長支持', sharedTools: ['infra_design'] },
    { primaryAgentId: 'data-bee', partnerAgentId: 'ops-bee', purpose: '數據管道與運營數據', sharedTools: ['sql_executor'] },
    { primaryAgentId: 'test-bee', partnerAgentId: 'biz-analyst-bee', purpose: '測試數據與商業分析', sharedTools: ['test_runner'] },
    // Explorer × Strategy
    { primaryAgentId: 'explorer-bee', partnerAgentId: 'planner-bee', purpose: '市場機會與長遠規劃', sharedTools: ['market_research'] },
    { primaryAgentId: 'diplomat-bee', partnerAgentId: 'strategist-bee', purpose: '合作方案與項目設計', sharedTools: ['contract_manager'] },
    { primaryAgentId: 'researcher-bee', partnerAgentId: 'analyst-bee', purpose: '用戶調研與數據分析', sharedTools: ['survey_tool'] },
    { primaryAgentId: 'field-tester-bee', partnerAgentId: 'risk-bee', purpose: '產品風險與測評', sharedTools: ['feedback_collector'] },
    { primaryAgentId: 'tracker-bee', partnerAgentId: 'optimizer-bee', purpose: '競品監控與流程優化', sharedTools: ['competitor_monitor'] },
    // Guard × All
    { primaryAgentId: 'security-bee', partnerAgentId: 'architect-bee', purpose: '安全架構與系統設計', sharedTools: ['security_scanner'] },
    { primaryAgentId: 'maintain-bee', partnerAgentId: 'coder-bee', purpose: '維運支持與開發實現', sharedTools: ['health_monitor'] },
    { primaryAgentId: 'support-bee', partnerAgentId: 'data-bee', purpose: '技術支援與數據管道', sharedTools: ['support_tool'] },
    { primaryAgentId: 'quality-bee', partnerAgentId: 'test-bee', purpose: '品質保障與測試流程', sharedTools: ['quality_scanner', '5t_gate'] },
    // Queen × All
    { primaryAgentId: 'queen-bee', partnerAgentId: 'planner-bee', purpose: '戰略執行與長遠規劃', sharedTools: ['memory_recall'] },
    { primaryAgentId: 'queen-bee', partnerAgentId: 'coder-bee', purpose: '領導決策與技術實現', sharedTools: ['orchestrator'] },
    { primaryAgentId: 'queen-bee', partnerAgentId: 'design-bee', purpose: '品牌願景與視覺設計', sharedTools: ['memory_recall'] },
    { primaryAgentId: 'queen-bee', partnerAgentId: 'market-bee', purpose: '戰略推廣與市場開發', sharedTools: ['memory_recall'] },
    { primaryAgentId: 'queen-bee', partnerAgentId: 'explorer-bee', purpose: '領導探索與資源發掘', sharedTools: ['memory_recall'] },
    { primaryAgentId: 'queen-bee', partnerAgentId: 'security-bee', purpose: '戰略安全與資安防護', sharedTools: ['memory_recall'] },
];
// ============================================================================
// Squad Assignment Helper
// ============================================================================
export function getSquadMembers(squad) {
    return SWARM_SPEC.filter(s => s.squad === squad);
}
export function getAgentById(id) {
    return SWARM_SPEC.find(s => s.id === id);
}
export function getAgentByNo(no) {
    return SWARM_SPEC.find(s => s.no === no);
}
export function getCrossPairingsForAgent(agentId) {
    return CROSS_AGENT_PAIRINGS.filter(p => p.primaryAgentId === agentId || p.partnerAgentId === agentId);
}
// ============================================================================
// Export
// ============================================================================
export { SWARM_SPEC, SwarmFactory, SwarmOrchestrator };
//# sourceMappingURL=matrix.js.map