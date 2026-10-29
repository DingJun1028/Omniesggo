// @google/adk removed from build - using stubs

type AnyObject = Record<string, unknown>;

class InMemorySessionService {
  private sessions = new Map<string, AnyObject>();

  async createSession(sessionId: string): Promise<AnyObject> {
    const session = { id: sessionId, events: [] } as AnyObject;
    this.sessions.set(sessionId, session);
    return session;
  }

  async getSession(sessionId: string): Promise<AnyObject | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async appendEvent(request: AnyObject): Promise<AnyObject> {
    return request;
  }
}

export class AdkSquadFactory {
  private static sessionService = new InMemorySessionService();

  static createAgent(config: {
    name: string;
    description: string;
    model?: string;
    instruction: string;
    tools?: any[];
  }) {
    return {
      name: config.name,
      description: config.description,
      model: config.model || 'gemini-2.5-flash',
      instruction: config.instruction,
      tools: config.tools || [],
    };
  }

  // TypeBox schema: TSchema object with `properties` / `required` (JSON-Schema-shaped)
  static registerRuneAsTool(rune: any) {
    const schema = ((rune.schema as AnyObject) ?? {}) as Record<string, any>;
    const properties = (schema.properties ?? {}) as Record<string, any>;
    return {
      definition: {
        name: rune.name,
        description: rune.description,
        parameters: {
          type: 'object',
          properties: Object.entries(properties).reduce((acc: Record<string, any>, [key, value]) => {
            acc[key] = {
              type: value?.type ?? 'string',
              description: value?.description ?? key,
            };
            return acc;
          }, {}),
          required: (schema.required as string[]) ?? Object.keys(properties),
        },
      },
      execute: async (args: any) => rune.execute({}, args),
    };
  }

  static createRunner(rootAgent: any, sessionService?: any) {
    return {
      agent: rootAgent,
      sessionService: sessionService ?? this.sessionService,
      appName: 'InfoOne-ESG-Swarm',
    };
  }

  static getSessionService() {
    return this.sessionService;
  }
}
