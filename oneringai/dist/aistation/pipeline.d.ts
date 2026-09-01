export type IdeaStage = 'Input' | 'Design' | 'Execution' | 'Automation';
export interface ModuleSpec {
    id: string;
    name: string;
    stage: IdeaStage;
    agentId: string;
    description: string;
    freeTier: CapabilitySpec;
    paidTier?: CapabilitySpec;
    fallbackChain: string[];
    verification: VerificationSpec;
}
export interface CapabilitySpec {
    model?: string;
    provider?: string;
    features: string[];
}
export interface VerificationSpec {
    tPrinciples: string[];
    hashRequired: boolean;
    evidenceRequired: boolean;
    testCases: number;
}
export declare const AI_STATION_MODULES: ModuleSpec[];
export declare const BRAND_PRESETS: {
    'ftg-tours': {
        name: string;
        colors: {
            primary: string;
            gold: string;
            background: string;
            accent: string;
        };
        forbiddenElements: string[];
        hostPhrase: string;
        scriptDNA: string[];
    };
    esggo: {
        name: string;
        colors: {
            primary: string;
            gold: string;
            background: string;
            accent: string;
        };
        forbiddenElements: never[];
        hostPhrase: string;
        scriptDNA: string[];
    };
    oneringai: {
        name: string;
        colors: {
            primary: string;
            gold: string;
            background: string;
            accent: string;
        };
        forbiddenElements: never[];
        hostPhrase: string;
        scriptDNA: string[];
    };
};
export declare class AistationPipeline {
    private modules;
    private events;
    private executionHistory;
    private currentRun;
    constructor(brand?: keyof typeof BRAND_PRESETS);
    loadBrand(brand: keyof typeof BRAND_PRESETS): void;
    getBrand(): {
        name: string;
        colors: {
            primary: string;
            gold: string;
            background: string;
            accent: string;
        };
        forbiddenElements: never[];
        hostPhrase: string;
        scriptDNA: string[];
    };
    getModules(): ModuleSpec[];
    getModule(id: string): ModuleSpec | undefined;
    /**
     * Execute the full IDEA pipeline
     */
    executePipeline(input: PipelineInput): Promise<PipelineResult>;
    /**
     * Execute a single module
     */
    private _executeModule;
    /**
     * Execute module with graceful fallback to free tier
     */
    private _executeWithFallback;
    private _tryDriver;
    private _computeHash;
    /**
     * Verify output against 5T principles
     */
    verifyOutput(output: unknown, moduleId: string): Promise<VerificationResult>;
    private _verifyT;
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    /**
     * Get execution history
     */
    getHistory(): ExecutionRecord[];
    /**
     * Get metrics
     */
    getMetrics(): PipelineMetrics;
}
export interface PipelineInput {
    host: string;
    hostName: string;
    script: string;
    topic: string;
    brand: string;
    settings?: Record<string, unknown>;
}
export interface PipelineResult {
    runId: string;
    status: 'completed' | 'failed';
    outputs: Record<string, unknown>;
    artifacts?: Array<{
        id: string;
        type: string;
        url: string;
    }>;
    duration: number;
    errors?: Error[];
}
export interface ExecutionRecord {
    runId: string;
    input: PipelineInput;
    result: PipelineResult;
    startTime: number;
    endTime: number;
}
export interface RunContext {
    runId: string;
    input: PipelineInput;
    startTime: number;
}
export interface VerificationResult {
    module: string;
    checks: TDimensionCheck[];
    passed: boolean;
    hash: string;
}
export interface TDimensionCheck {
    principle: string;
    passed: boolean;
    details?: Record<string, unknown>;
}
export interface PipelineMetrics {
    totalRuns: number;
    successRate: number;
    avgDuration: number;
}
export declare function createAistationPipeline(brand?: keyof typeof BRAND_PRESETS): AistationPipeline;
//# sourceMappingURL=pipeline.d.ts.map