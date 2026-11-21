// ═══════════════════════════════════════════════════════════════
// @esggo/shared — Unified Shared Package
// Single Source of Truth for all shared utilities
// ═══════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────
export * from './types/esg-charts';
export * from './tokens/design-tokens';
export * from './memory/types';

// ── Shared Config (edge-safe, no server deps) ──────────────────
export * from './config';

// NOTE: server-only modules (auth/redis/database/health) are NOT re-exported
// here to keep the package importable from client components.
// Import them via subpath exports: @esggo/shared/auth, /redis, /database, /health.

