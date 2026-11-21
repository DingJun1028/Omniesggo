#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ============================================================================
// Ollama MCP Server
// Enables zero-cost local AI inference via Model Context Protocol
// ============================================================================

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";

const server = new Server(
  {
    name: "ollama-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_ollama",
        description: "Sends a prompt to a local Ollama model for zero-cost generation. Useful for summarizing, code generation, or data extraction.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The prompt or question to send to Ollama",
            },
            model: {
              type: "string",
              description: "The Ollama model to use (e.g., 'qwen2.5:8b', 'llama3.1', 'mistral'). Defaults to 'qwen2.5:8b'.",
            },
            system: {
              type: "string",
              description: "Optional system prompt to guide the model's behavior.",
            }
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

// 2. Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "ask_ollama") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }

  const { prompt, model = "qwen2.5:8b", system } = request.params.arguments as any;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        system,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      content: [
        {
          type: "text",
          text: data.response,
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to connect to Ollama. Ensure Ollama is running at ${OLLAMA_HOST}. Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// 3. Start the server
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[Ollama MCP] Server running on stdio");
}

run().catch((error) => {
  console.error("[Ollama MCP] Fatal error:", error);
  process.exit(1);
});
