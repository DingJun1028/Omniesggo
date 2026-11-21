# Architecture Decision Records (ADR)

## ADR-001: Event Sourcing for AI Model Routing
**Status**: Accepted
**Date**: 2025-07-05
**Context**: Need audit trail for AI model routing decisions in ESG compliance scenarios
**Decision**: Use Time-Rift Protocol (Event Sourcing) with SHA-256 hash locking
**Consequences**: Full traceability, time-travel debugging, shadow testing capability

## ADR-002: Zero-Trust Security Model
**Status**: Accepted
**Date**: 2025-07-05
**Context**: ESG data requires strict access control and tamper-proof audit trails
**Decision**: OAG (OmniAgentGateway) with Hash Lock + Object.freeze() + zero-hallucination verification
**Consequences**: Immutable evidence chains, compliance with ISO-14064-1/GRI standards

## ADR-003: Multi-Provider Model Discovery
**Status**: Accepted
**Date**: 2025-07-05
**Context**: Avoid vendor lock-in, ensure cost-effective model access
**Decision**: Dynamic discovery from OpenRouter, Groq, Hugging Face, NVIDIA with 30-min cache TTL
**Consequences**: Automatic failover, cost optimization, vendor diversity

## ADR-004: Shadow Testing Framework
**Status**: Accepted
**Date**: 2025-07-05
**Context**: Safe deployment of new models without production risk
**Decision**: Traffic splitting (5-15%) with automated metric comparison
**Consequences**: Zero-downtime model upgrades, automated promotion criteria

## ADR-005: Model Conversion Pipeline
**Status**: Accepted
**Date**: 2025-07-05
**Context**: Support multiple deployment targets (PyTorch, ONNX, TensorFlow.js)
**Decision**: PyTorch → ONNX → TensorFlow.js conversion with quantization support
**Consequences**: Cross-platform deployment, 3-5x inference speedup via quantization

## ADR-006: Complete Autonomous Delegation (完全代主自行)
**Status**: Accepted
**Date**: 2026-07-06
**Context**: ESG GO 平臺需要一套完整的代理機制，允許代理者在完全授權範圍內自主執行任務，無需隨時請示主體。這對於 ESG 合規報告、智慧合約執行、AI 模型路由等場景至關重要。
**Decision**: 實作「完全代主自行」(Complete Autonomous Delegation) 架構，包含：
  1. **授權管理器** (CompleteDelegationManager) - 管理授權的創建、驗證、終止
  2. **自主決策引擎** (AutonomousDecisionEngine) - 實現自主決策邏輯
  3. **代理者實現** (CompleteDelegationAgent) - 整合授權、決策、執行
  4. **零信任安全模型** - Hash Lock 簽章、授權驗證、監控回報
**Consequences**:
  - 代理者可在授權範圍內完全自主執行任務
  - 主體可隨時終止授權
  - 所有決策過程可追溯、可審計
  - 符合 ESG 合規要求的嚴格訪問控制
  - 與現有 OmniCore 架構無縫整合