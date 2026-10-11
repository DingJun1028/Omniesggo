/**
 * Main entry point for @everworker/oneringai
 * 
 * A unified AI agent library with multi-provider support for text generation,
 * image/video generation, audio (TTS/STT), and agentic workflows.
 */

// ============================================================================
// Core Exports
// ============================================================================

// Types
export type {
  AgentCreateOptions,
  AgentResponse,
  RunOptions,
  ToolFunction,
  ContentBlock,
  Message,
  ResponseFormat,
  ProviderCapabilities,
  AdvancedCapabilities,
  PermissionPolicy,
  PermissionContext,
  PermissionDecision,
  ApprovalContext,
  ApprovalResult,
  PromptCacheOptions,
  DataHandlingOptions,
  ContextStorage,
  AuthConfig,
  ConnectorConfig,
  ConnectorAccessContext,
  AgentIdentity,
  UsageInfo,
} from './types/index.js';

// Enums
export { Vendor, Services } from './types/index.js';

// Core Classes
export { Agent, ToolManager, ToolExecutionPipeline, LoggingPlugin } from './core/agent.js';
export type { ToolExecutionPlugin } from './core/agent.js';

// Connector
export {
  Connector,
  ConnectorRegistry,
  ScopedConnectorRegistry,
  type IConnector,
  type IConnectorAccessPolicy,
  type IScopedRegistry,
} from './core/connector.js';
export { scopedRegistry } from './core/connector.js';

// Vendor Templates
export {
  type VendorTemplate,
  getVendorTemplate,
  listVendors,
  createConnectorFromTemplate,
} from './core/connector.js';

// 5T Gate
export { FiveTGate, fiveTGate, apply5TToResponse } from './core/fiveT-gate.js';
export type { VerificationArtifact, DimensionResult, GateResult } from './core/fiveT-gate.js';

// Storage
export { StorageRegistry, FileContextStorage, createFileContextStorage } from './core/agent.js';

// Agent Context
export { AgentContextNextGen } from './core/agent.js';

// ============================================================================
// Model Registry
// ============================================================================

export {
  MODEL_REGISTRY_SCHEMA_VERSION,
  getModelInfo,
  getModelsByVendor,
  getModelsByLifecycle,
  getAllTextModels,
  getAllImageModels,
  getAllVideoModels,
  getAllVoiceModels,
  getAllSTTModels,
  getAllEmbeddingModels,
  getAllModels,
  calculateCost,
  getProviderCapabilities,
  getAdvancedCapabilities,
} from './registry/models.js';
export type {
  ModelInfo,
  ModelLifecycle,
  ModelFeatures,
  ModelPricing,
  ProcessingMode,
} from './registry/models.js';

// ============================================================================
// Agent Matrix (OA-Team 30)
// ============================================================================

export { SWARM_SPEC, SwarmFactory, SwarmOrchestrator } from './agents/matrix.js';
export type {
  Squad,
  SoulAgentSpec,
  CrossAgentPairing,
  CrossAgentPairing as PairingRule,
} from './agents/matrix.js';

export {
  CROSS_AGENT_PAIRINGS,
  getSquadMembers,
  getAgentById,
  getAgentByNo,
  getCrossPairingsForAgent,
} from './agents/matrix.js';

// Agent Registry
export { AgentRegistry } from './agents/registry.js';
export type {
  AgentRecord,
  AgentStats,
  AgentInspection,
} from './agents/registry.js';

// Agent Orchestrator
export { AgentOrchestrator, createOrchestrator, SharedWorkspace } from './agents/orchestrator.js';
export type {
  WorkspaceEntry,
  AgentTypeDefinition,
  OrchestrationContext,
  RoutingDecision,
} from './agents/orchestrator.js';

// ============================================================================
// Agent Runtime (v1.1.0 Preview)
// ============================================================================

export {
  AgentRuntime,
  LocalExecutionBackend,
  OneRingAIDriver,
  createAgentRuntime,
} from './agent-runtime/index.js';
export type {
  AgentSpec,
  AgentCapability,
  AgentSession,
  AgentRun,
  AgentEvent,
  AgentEventType,
  EventSubscription,
  AgentDriver,
  RunOptions as RuntimeRunOptions,
  AgentRuntimePolicy,
  ExecutionBackend,
  RegisteredAgent,
} from './agent-runtime/index.js';

// ============================================================================
// Audio
// ============================================================================

// ============================================================================
// Image Generation
// ============================================================================

// ============================================================================
// Video Generation
// ============================================================================

// ============================================================================
// Search
// ============================================================================

// ============================================================================
// Tools
// ============================================================================

// ============================================================================
// MCP
// ============================================================================

// Re-export key utilities
export { EventEmitter } from 'events';
