import ollama from 'ollama';

export class GoogleGenAI {
  constructor(options: any) {}

  [key: string]: any; // Allow arbitrary extensions like interactions

  models = {
    generateContent: async ({ model, contents }: any) => {
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
          model: 'qwen2.5:14b', // Using Ollama default for esggo local inference
          prompt: text
        });
        return { text: response.response };
      } catch (e) {
        console.error('Ollama generateContent failed:', e);
        return { text: 'Ollama local inference failed' };
      }
    },
    embedContent: async ({ model, contents }: any) => {
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
}
