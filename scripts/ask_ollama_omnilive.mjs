import fs from 'fs';
import http from 'http';

async function getOllamaModel() {
  return new Promise((resolve, reject) => {
    const req = http.request('http://127.0.0.1:11434/api/tags', { method: 'GET' }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const models = json.models.map(m => m.name);
          resolve(models[0] || 'llama3.1'); // fallback
        } catch (e) {
          resolve('llama3.1');
        }
      });
    });
    req.on('error', () => resolve('llama3.1'));
    req.end();
  });
}

async function run() {
  console.log("Checking available Ollama models...");
  const modelName = await getOllamaModel();
  console.log(`Using model: ${modelName}`);

  const html = fs.readFileSync('apps/omnilive/public/index.html', 'utf-8');
  
  const prompt = `You are a web developer. I have an HTML file with corrupted garbled text (like "?祈?"). 
This is the OmniLive app (a mobile-connected subtitle/overlay system).
Please fix ALL the garbled text into proper Traditional Chinese (e.g., OmniLive 全通即時翻譯字幕, 掃描 QR Code 連接, 麥克風等).
Also, ensure the QR Code connection logic and WebSocket setup are robust for mobile phones.

Here is the source HTML:
\`\`\`html
${html}
\`\`\`

ONLY output the fixed HTML code inside a markdown code block. Do not add any explanation.`;

  console.log("Sending prompt to Ollama (zero-compute for Gemini)...");

  const postData = JSON.stringify({
    model: modelName,
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.1
    }
  });

  const req = http.request('http://127.0.0.1:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
      process.stdout.write('.');
    });
    res.on('end', () => {
      console.log('\nGeneration complete.');
      try {
        const json = JSON.parse(data);
        const responseText = json.response;
        
        // Extract HTML from markdown
        const match = responseText.match(/```html\n([\s\S]*?)```/);
        const fixedHtml = match ? match[1] : responseText;
        
        fs.writeFileSync('apps/omnilive/public/index.html', fixedHtml, 'utf-8');
        console.log("apps/omnilive/public/index.html successfully updated via Ollama!");
      } catch (e) {
        console.error("Failed to parse Ollama response:", e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
    console.log("Ollama might not be running locally. Please ensure Ollama is started on port 11434.");
  });

  req.write(postData);
  req.end();
}

run();
