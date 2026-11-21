# ADK Boundary & Autorepair Skill

## Overview
This skill implements the **ADK Boundary** feature for OmniAgent – a reactive auto‐heal system that detects any runtime error and automatically triggers the dedicated ADK squad to resolve the issue without manual intervention.

## Key Components
- **Error Event Bus** – All agents emit `ERROR_OCCURRED` events whenever a task fails.
- **Error Handler Agent** – Listens for `ERROR_OCCURRED` events and dispatches appropriate recovery actions via the ADK swarm.
- **Automatic Retry & Fallback** – Built‑in logic to retry operations and switch to mock modes when external services fail.

## Usage
```bash
# Trigger an automatic error recovery if a failure is detected
node cli/omni.mjs adk boundary <task-or-id>
```

## Implementation Notes
1. **Event Publication** – In `adk-core.ts`, each `catch` block includes:
   ```ts
   omniAgentBus.publish('ERROR_OCCURRED', {agent, task, error, context});
   ```
2. **Event Subscription** – The `ErrorHandlerAgent` (instantiated in the swarm) subscribes to this event and calls relevant smalle‑task agents (`ESG_Auditor`, `ESG_Consultant`, etc.) for cleanup, data restoration, or notification.
3. **Health‑check Loop** – A background watchdog (via `process.on('unhandledRejection')` and `setInterval`) periodically invokes `checkSystemHealth()` to pre‑emptively detect silent failures.

## Extending the Skill
- Add new recovery handlers in `adk-boundary/handlers/` and import them in the swarm.
- Update `adk-core.ts` to launch multi‑step recovery pipelines.
- Publish metrics to the telemetry service for audit trails.

> **Tip:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured for DB‑backed recoveries.
