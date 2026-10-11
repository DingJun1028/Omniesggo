# Agent Runtime Preview

## Overview

OneRingAI's Agent Runtime is a vendor-neutral layer for running complete, pre-built agent systems. It provides a single observable workflow API with automatic tool discovery, memory management, and safety gating.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   App Code  │────▶│  Runtime API  │────▶│  Native Agent   │
│             │     │              │     │ (OneRingAI)     │
└─────────────┘     └──────────────┘     └─────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │ OpenAI Codex SDK Driver │
                    └─────────────────────────┘
```

## Key Features

- Generic agent specifications with capability inspection
- Sessions, runs, cancellation, and results tracking
- Policy enforcement (fail-closed capability checks)
- Observable autonomy (live messages, reasoning, tool calls)
- Safe resource management (workspace leases, bounded cleanup)

## Usage

```typescript
import { AgentRuntime } from '@everworker/oneringai/agent-runtime';

const runtime = new AgentRuntime({
  model: 'o1-pro',
  provider: 'openai',
});

const session = await runtime.createSession({
  instructions: "You are a coding assistant",
});

const run = await session.startRun({
  messages: [{ role: 'user', content: 'Write a hello world function' }],
});
```

## Drivers

### LocalExecutionBackend
Native OneRingAI agent sources — runs agents directly within the library.

### CodexDriver
Optional driver using the OpenAI Codex TypeScript SDK.

> **Note**: The Codex SDK is an optional peer dependency and will be gracefully degraded if not installed.
