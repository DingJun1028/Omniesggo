import ollama from 'ollama';

/** generateContent 的推論參數 (對應 Gemini 的 config, 轉換為 Ollama options)。 */
export interface GenerateContentConfig {
  temperature?: number;
  maxOutputTokens?: number;
  [key: string]: unknown;
}

export class GoogleGenAI {
  constructor(options: Record<string, unknown>) {}

  [key: string]: unknown; // Allow arbitrary extensions like interactions

  models = {
    generateContent: async ({
      model,
      contents,
      config,
    }: {
      model: string;
      contents: unknown;
      config?: GenerateContentConfig;
    }) => {
      let text = '';
      if (typeof contents === 'string') {
        text = contents;
      } else if (Array.isArray(contents)) {
        text = contents.map(c => typeof c === 'string' ? c : (c.text || JSON.stringify(c))).join('\n');
      } else {
        text = JSON.stringify(contents);
      }
      
      try {
        const response = await ollama.generate({
          model: model || 'qwen2.5:14b', // Using Ollama default for esggo local inference
          prompt: text,
          options: {
            ...(config?.temperature !== undefined ? { temperature: config.temperature } : {}),
            ...(config?.maxOutputTokens !== undefined ? { num_predict: config.maxOutputTokens } : {}),
          },
        });
        return { text: response.response };
      } catch (e) {
        console.error('Ollama generateContent failed:', e);
        return { text: 'Ollama local inference failed' };
      }
    },
    embedContent: async ({ model, contents }: { model: string; contents: unknown }) => {
      try {
        const text = Array.isArray(contents) ? contents.join('\n') : String(contents);
        const response = await ollama.embeddings({
          model: 'nomic-embed-text', // Or another embedding model you have pulled
          prompt: text
        });
        return { embeddings: [{ values: response.embedding }] };
      } catch (e) {
        console.error('Ollama embedContent failed:', e);
        return { embeddings: [{ values: new Array(768).fill(0) }] };
      }
    }
  };

  // Interactions API support (used by village/trends route when USE_INTERACTIONS_API=true)
  // Default implementation throws — override with real Gemini Interactions API when needed.
  interactions = {
    create: async (_params: Record<string, unknown>): Promise<{ steps?: Array<{ type?: string; content?: Array<{ parts?: Array<{ text?: string }> }> }> }> => {
      throw new Error('Interactions API not implemented. Use models.generateContent instead.');
    }
  };
}
