// esggo-deepseek-v4-pro — Cloudflare Workers AI 封裝
// 對應用戶原始程式碼: env.AI.run('deepseek/deepseek-v4-pro', messages)
// 部署: wrangler deploy (需有效 Cloudflare 憑證)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 健康檢查
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", model: env.MODEL }), {
        headers: { "content-type": "application/json" },
      });
    }

    // POST /chat  { messages: [...] }
    if (url.pathname === "/chat" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
      }
      const messages = body.messages ?? [
        { role: "user", content: "What is the capital of France?" },
      ];

      try {
        const response = await env.AI.run(env.MODEL, {
          messages,
          model: env.MODEL,
        });
        return new Response(JSON.stringify(response), {
          headers: { "content-type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
      }
    }

    return new Response(
      JSON.stringify({
        usage: "POST /chat {messages:[{role,content}]} | GET /health",
      }),
      { headers: { "content-type": "application/json" } }
    );
  },
};
