/* eslint-disable @typescript-eslint/no-unused-vars */
import { randomUUID } from 'crypto';
import { secureForward } from '../../core/services/omni-gateway';
import { DelegationEventNames, DelegationTopics } from '../../types/complete-delegation';
import { getDefaultJournal } from './journal';

export async function publishDelegationEvent(
  type: string,
  topic: string,
  payload: Record<string, unknown>,
  source: string
): Promise<{ status: string; hashLock: string }> {
  const now = Date.now();
  const event = {
    event: type,
    payload: {
      type,
      topic,
      source_origin: source,
      timestamp: now,
      ...payload,
    },
    ts: now,
    uuid: randomUUID(),
  };

  try {
    const { hashLock } = await secureForward(event);
    try {
      getDefaultJournal().append({
        kind: 'event',
        type,
        delegationId: (payload.delegationId as string) ?? '',
        topic,
        hashLock,
        ts: now,
        source,
        payload: { type, topic, source_origin: source, timestamp: now, ...payload },
      });
    } catch {
      /* best-effort */
    }
    return { status: 'ok', hashLock };
  } catch (err) {
    console.error('[delegation-events] publish failed:', err);
    return { status: 'error', hashLock: '' };
  }
}
