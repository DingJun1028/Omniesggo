# OneRingAI - Unified AI Agent Library

> **A unified AI agent library** with multi-provider support for text generation, image/video generation, audio (TTS/STT), and agentic workflows.

## Overview

OneRingAI is a vendor-neutral abstraction layer that unifies **text, image, video, audio, and agentic workflows** under a single interface. It sits on top of the existing OA-Team 30 swarm infrastructure (5T protocol, 30-agent matrix, CrewAI patterns) and provides:

- **Connector-First Authentication**: All vendor connections flow through a single `Connector` abstraction
- **30-Agent Matrix**: Built-in OA-Team swarm with 5 squads (Strategy, Tech, Creative, Marketing, Guard)
- **5T Verification Gate**: Traceable → Trackable → Testable → Tunable → Time-bound
- **Memory System**: Entity/fact store with graph + vector search
- **Agent Runtime**: Vendor-neutral layer for running pre-built agent systems
- **AI Station Pipeline**: 7-module production pipeline for video/content generation

## Quick Start

```bash
# Install
npm install @everworker/oneringai

# Or build from source
cd oneringai
npm install
npm run build
```

## Core Concepts

### 5T Protocol

Every operation passes through the 5T Verification Gate:

1. **Traceable** - Every action is logged with source_origin
2. **Trackable** - Lifecycle hooks record execution paths
3. **Testable** - Zero hallucination verification
4. **Tunable** - Parameters can be adjusted and optimized
5. **Time-bound** - Expiration and TTL management

### 30-Agent Matrix

The library includes the complete OA-Team 30-agent matrix:

| Squad | Agents | Focus |
|-------|--------|-------|
| Strategy (1-6) | plan-bee, analyst-bee, tactician-bee, risk-bee, optimizer-bee | Long-term planning, analysis |
| Tech (7-12) | coder-bee, algorithm-bee, architect-bee, data-bee, test-bee, design-bee | Full-stack development |
| Creative (13-18) | graphics-bee, animation-bee, copywriter-bee, audio-bee | Content creation |
| Marketing (19-24) | growth-bee, operations-bee, biz-analyst-bee, explorer-bee, diplomat-bee, researcher-bee | User growth and research |
| Guard (25-30) | field-test-bee, tracker-bee, security-bee, maintenance-bee, support-bee, quality-bee | Safety, security, quality |

## License

MIT
