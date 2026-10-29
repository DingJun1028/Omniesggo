import { z } from "zod";

export interface RuneConfig<T extends z.ZodTypeAny> {
  name: string;
  description: string;
  schema: T;
  execute: (context: any, input: z.infer<T>) => Promise<string>;
}

export function defineRune<T extends z.ZodTypeAny>(config: RuneConfig<T>) {
  return config;
}

export interface AdkAgentConfig {
  name: string;
  role: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  equippedRunes: RuneConfig<any>[];
  onStepComplete?: (stepInfo: any) => Promise<void>;
}
// ts-matrix: 對外相容別名 (API 不變)
export type { AdkAgentConfig as AgentConfig };

export function createAgent(config: AdkAgentConfig) {
  return {
    ...config,
    executeTask: async (input: any, context: any) => {
      // Mock ADK execution
      if (config.onStepComplete) {
        await config.onStepComplete({ action: `Agent ${config.name} started task.` });
      }
      return { status: "success", agent: config.name, data: input };
    }
  };
}

export interface SwarmConfig {
  agents: any[];
  routingStrategy: string;
  onEventStream?: (event: any) => void;
}

export function createSwarm(config: SwarmConfig) {
  return {
    ...config,
    dispatch: async (payload: { instruction: string; context: any }) => {
      // Mock swarm dispatch
      if (config.onEventStream) {
        config.onEventStream({ agent: "總管大腦", status: "解析意圖中...", type: "thinking" });
      }
      return { status: "completed", result: "Swarm execution finished." };
    }
  };
}
