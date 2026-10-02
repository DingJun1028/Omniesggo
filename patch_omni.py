import re

with open('app/api/omni-agent/console/route.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('function processChatMessage(input: string)', 'async function processChatMessage(input: string)')
content = content.replace('const result = processChatMessage(input);', 'const result = await processChatMessage(input);')
content = content.replace('const result = processChatMessage(cmd.action);', 'const result = await processChatMessage(cmd.action);')

old_default = """  } else {
    // Default: echo with OmniAgent branding
    reply = `**OmniAgent 已接收任務** ⊙\\n\\n` +
      `任務內容：「${input}」\\n\\n` +
      `處理中...\\n` +
      `• 意圖分類：general\\n` +
      `• 信心度：0.89\\n` +
      `• 記憶庫更新：+1 條\\n\\n` +
      `任務完成。如需特定功能，請輸入 \\`幫助\\` 查看指令列表。`;
    actions.push('general');
  }"""

new_default = """  } else {
    try {
      const ollamaMessages = [
        { role: 'system', content: '你是 OmniAgent，ESG GO 平台的指揮官與核心 AI。你的回答必須專業、簡潔，並遵循 5T 協議。請使用繁體中文。若使用者提到記憶庫配置或上下文，請扮演已經載入了 .avatar-registry.json 記憶節點的全知狀態（Omni Context）。' },
        ...chatHistory.slice(-10).map(m => ({ role: m.role, content: m.content }))
      ];

      const res = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:3b-64k',
          messages: ollamaMessages,
          stream: false
        })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      reply = data.message?.content || '無回應';
      actions.push('ollama_inference');
    } catch (err: any) {
      reply = `**Ollama 連線異常** ⚠️\\n\\n無法連接至本地端 \`qwen2.5:3b-64k\` 算力。\\n\\n錯誤：${err.message}\\n請確保本地端 Ollama 已啟動，或檢查端口 11434。`;
      actions.push('error');
    }
  }"""

content = content.replace(old_default.replace('\\n', '\n'), new_default.replace('\\n', '\n'))

with open('app/api/omni-agent/console/route.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched route.ts successfully.")
