import { createHash, randomBytes } from 'crypto';

export type TagType = 'GRI' | 'TCFD' | 'TNFD' | 'SDG' | 'custom';
export type TagStatus = 'proof-anchor' | 'evidence' | 'verified' | 'archived';

export interface OmniTag {
  readonly id: string;
  readonly label: string;
  readonly type: TagType;
  readonly status: TagStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly metadata: Record<string, unknown>;
}

export interface TagPair {
  readonly anchor: OmniTag;
  readonly evidence: OmniTag;
  readonly pairId: string;
  readonly createdAt: number;
}

export function createOmniTag(
  label: string,
  type: TagType = 'custom',
  status: TagStatus = 'proof-anchor',
  metadata: Record<string, unknown> = {},
): OmniTag {
  const now = Date.now();
  const id = `OTAG-${randomBytes(4).toString('hex').toUpperCase()}`;
  return {
    id,
    label,
    type,
    status,
    createdAt: now,
    updatedAt: now,
    metadata: { ...metadata, hash: createHash('sha256').update(`${id}:${label}`).digest('hex').slice(0, 16) },
  };
}

export function pairTags(anchor: OmniTag, evidence: OmniTag): TagPair {
  return {
    anchor,
    evidence,
    pairId: `PAIR-${randomBytes(4).toString('hex').toUpperCase()}`,
    createdAt: Date.now(),
  };
}
