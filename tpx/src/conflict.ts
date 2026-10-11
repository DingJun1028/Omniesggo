import { Conflict } from './types.js';

export class ConflictResolver {
  resolve(a: unknown, b: unknown, meta: { sourceOrigin: string; timestamp: number }): unknown {
    // default: last-write-wins
    return meta.timestamp >= (0 as unknown as number) ? b : a;
  }
}

export function detectConflict(
  local: unknown,
  remote: unknown,
  meta: { timestamp: number; sourceOrigin: string }
): Conflict | null {
  // Placeholder: always treat as conflict for demo
  return {
    id: crypto.randomUUID(),
    key: 'placeholder-key',
    local,
    remote,
    sourceOrigin: meta.sourceOrigin,
    timestamp: meta.timestamp,
  };
}
