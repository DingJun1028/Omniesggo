'use server';

import { storeOmniCase, storeOmniConsoleSnapshot } from '@/lib/storage-service';
import type { OmniRequest, OmniResult } from '@lib/esggo';

function getFnName(req: OmniRequest, fallback: string): string {
  if (req.kind === 'fn') return req.name;
  return fallback;
}

function getFnArgs(req: OmniRequest, fallback: readonly unknown[]): unknown[] {
  if (req.kind === 'fn') return req.args ? [...req.args] : [...fallback];
  return [...fallback];
}

export async function persistOmniCase(result: OmniResult) {
  if (!result.ok || result.kind !== 'case' || !result.data) return;
  const data = result.data as Record<string, unknown>;
  if (!('id' in data)) return;
  await storeOmniCase({
    kind: result.kind,
    actor: 'omni-console',
    payload: data,
  });
}

export async function persistConsoleSnapshot(
  result: OmniResult,
  req: OmniRequest,
  fallbackFnName: string,
) {
  if (!result.ok || req.kind !== 'fn') return;
  await storeOmniConsoleSnapshot({
    functionName: getFnName(req, fallbackFnName),
    input: getFnArgs(req, []),
    output: result.data ?? result,
    actor: 'omni-console',
  });
}
