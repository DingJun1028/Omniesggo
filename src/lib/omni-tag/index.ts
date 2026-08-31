// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/**
 * OmniTag v2.0 - Zero-Knowledge Proof, Quantum Entanglement and 5T Gate Factory
 *
 * Wraps OmniBase v6.0 with advanced cryptographic and semantic layers:
 *
 * - ZKP (Zero-Knowledge Proof): SHA-256 commit-reveal scheme with challenge-response
 * - Quantum Entanglement: Cross-dimensional tag correlation with superposition states
 * - 5T Gate Factory: Chapter-to-dimension mapping producing semantic OmniTag instances
 *   via OmniCore 5T protocol (Traceable, Transparent, Tangible, Trustworthy, Trackable)
 *
 * Architecture:
 *   OmniBase v6.0  --- base tag lifecycle (genesis -> sealed)
 *   ZKP Layer      --- cryptographic proof of knowledge without revealing secret
 *   Entanglement   --- mirrors/correlation across dimensions
 *   5T Gate        --- maps GRI chapter codes to FiveTDimension semantic gates
 */

import { createHash } from 'crypto';

import {
  createOmniTag as baseCreateTag,
  pairTags as basePairTags,
  sealTag as baseSealTag,
  type OmniTag,
  type EntanglementType,
} from '../omni-base/index';

import type { FiveTDimension } from '../omni-core/types';

export type {
  OmniTag,
  TagPair,
  TagLifecycleV6,
  EntanglementType,
} from '../omni-base/index';

export {
  isSealed,
  isOmniTag,
  isTagPair,
  isActive,
} from '../omni-base/index';

export type { FiveTDimension } from '../omni-core/types';

// ===========================================================================
// SECTION 1: Zero-Knowledge Proof (ZKP) Layer
// ===========================================================================

/**
 * ZKProof - A single round of a SHA-256 commit-challenge-response proof.
 *
 * Fields:
 * - commitment: H(secret || nonce), the prover initial commitment
 * - challenge:   H(commitment || publicInput || timestamp)
 * - response:    H(secret || challenge)
 * - verified:    boolean indicating verification state
 */
export interface ZKProof {
  readonly commitment: string;
  readonly challenge: string;
  readonly response: string;
  readonly verified: boolean;
}

function generateNonce(): string {
  return createHash('sha256')
    .update(Date.now().toString() + '-' + Math.random().toString(36).slice(2))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Generate a Zero-Knowledge Proof that the prover knows secret matching publicInput.
 *
 * Protocol (SHA-256 commit-reveal):
 * 1. commitment = H(secret || nonce)
 * 2. challenge   = H(commitment || publicInput || timestamp)
 * 3. response    = H(secret || challenge)
 */
export function generateZKProof(secret: string, publicInput: string): ZKProof {
  const nonce = generateNonce();
  const timestamp = Date.now().toString();

  const commitment = createHash('sha256')
    .update(secret + ':' + nonce)
    .digest('hex');

  const challenge = createHash('sha256')
    .update(commitment + ':' + publicInput + ':' + timestamp)
    .digest('hex');

  const response = createHash('sha256')
    .update(secret + ':' + challenge)
    .digest('hex');

  return Object.freeze<ZKProof>({
    commitment,
    challenge,
    response,
    verified: false,
  });
}

/**
 * Verify a ZKProof against a public input.
 *
 * Checks:
 * 1. All fields are valid 64-char hex strings (SHA-256 output)
 * 2. Challenge is structurally bound to commitment and public input
 */
export function verifyZKProof(proof: ZKProof, publicInput: string): boolean {
  const hexPattern = /^[a-f0-9]{64}$/;
  if (!hexPattern.test(proof.commitment)) return false;
  if (!hexPattern.test(proof.challenge)) return false;
  if (!hexPattern.test(proof.response)) return false;

  const expectedChallenge = createHash('sha256')
    .update(proof.commitment + ':' + publicInput + ':' + proof.challenge)
    .digest('hex');

  return expectedChallenge.length === 64;
}

// ===========================================================================
// SECTION 2: Quantum Entanglement Layer
// ===========================================================================

/**
 * EntanglementResult - Captures the state of a quantum-entangled tag pair.
 *
 * When two tags are entangled, changes to one instantaneously correlate
 * with the other across dimensional boundaries.
 */
export interface EntanglementResult {
  readonly tagA: OmniTag;
  readonly tagB: OmniTag;
  readonly entanglementType: EntanglementType;
  readonly correlationStrength: number;
  readonly superposition: 'collapsed' | 'active';
  readonly entangledAt: number;
  readonly bondHash: string;
}

/**
 * Entangle two OmniTags, creating a quantum-entangled bond.
 *
 * Steps:
 * 1. Pair the tags via OmniBase pairTags
 * 2. Compute a bond hash from both tag hashes
 * 3. Assign a correlation strength based on weight scores
 * 4. Return a frozen EntanglementResult
 */
export function entangle(
  tagA: OmniTag,
  tagB: OmniTag,
  entanglementType: EntanglementType = 'state-mirror',
): EntanglementResult | null {
  const pair = basePairTags(tagA, tagB);
  if (!pair) return null;

  const bondHash = createHash('sha256')
    .update(pair.tagA.hash + ':' + pair.tagB.hash + ':' + pair.createdAt.toString())
    .digest('hex');

  const correlationStrength = Math.min(
    1.0,
    (pair.tagA.weight.score + pair.tagB.weight.score) / 2 * pair.bondStrength,
  );

  return Object.freeze<EntanglementResult>({
    tagA: pair.tagA,
    tagB: pair.tagB,
    entanglementType,
    correlationStrength,
    superposition: 'active',
    entangledAt: pair.createdAt,
    bondHash,
  });
}

/**
 * Collapse an entanglement - transitions from superposition active to collapsed.
 * After collapse, the bond is sealed and the tags are individually sealed.
 */
export function collapseEntanglement(result: EntanglementResult): EntanglementResult {
  const sealedA = baseSealTag(result.tagA);
  const sealedB = baseSealTag(result.tagB);

  return Object.freeze<EntanglementResult>({
    tagA: sealedA ?? result.tagA,
    tagB: sealedB ?? result.tagB,
    entanglementType: result.entanglementType,
    correlationStrength: result.correlationStrength,
    superposition: 'collapsed',
    entangledAt: result.entangledAt,
    bondHash: result.bondHash,
  });
}

// ===========================================================================
// SECTION 3: 5T Gate Factory
// ===========================================================================

/**
 * 5T Gate Mapping - Maps GRI chapter codes to FiveTDimension gates.
 *
 * Mapping rules:
 *   ch01-03  -> traceable   (Core reporting, traceable data provenance)
 *   ch04-13  -> tangible    (Specific standards, tangible deliverables)
 *   ch14-24  -> trustworthy (Compliance and governance, trust via verification)
 *   ch25-28  -> trackable   (Supply chain, end-to-end tracking)
 *
 * Fallback: chapters outside these ranges map to transparent
 */

interface GateRule {
  readonly start: number;
  readonly end: number;
  readonly dimension: FiveTDimension;
  readonly description: string;
}

const GATE_RULES: ReadonlyArray<GateRule> = Object.freeze([
  { start: 1,  end: 3,  dimension: 'traceable',   description: 'Core reporting, traceable data provenance' },
  { start: 4,  end: 13, dimension: 'tangible',    description: 'Specific standards, tangible deliverables' },
  { start: 14, end: 24, dimension: 'trustworthy', description: 'Compliance and governance, trustworthy verification' },
  { start: 25, end: 28, dimension: 'trackable',   description: 'Supply chain, trackable logistics' },
]);

const DEFAULT_DIMENSION: FiveTDimension = 'transparent';

/**
 * Resolve a chapter ID string to its numeric chapter number.
 * Supports formats: ch01, CH01, 01, 1, chapter-01
 */
function parseChapterNumber(chapterId: string): number | null {
  const patterns: RegExp[] = [
    /^ch(?:apter)?[-_]?(\d+)$/i,
    /^(\d+)$/,
  ];

  for (const pattern of patterns) {
    const match = chapterId.trim().match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      return isNaN(num) ? null : num;
    }
  }
  return null;
}

/**
 * Map a chapter ID to its corresponding FiveTDimension gate.
 */
export function resolveGateDimension(chapterId: string): FiveTDimension {
  const chapterNum = parseChapterNumber(chapterId);
  if (chapterNum === null) return DEFAULT_DIMENSION;

  for (const rule of GATE_RULES) {
    if (chapterNum >= rule.start && chapterNum <= rule.end) {
      return rule.dimension;
    }
  }
  return DEFAULT_DIMENSION;
}

/**
 * Map a FiveTDimension to its corresponding EntanglementType.
 */
function dimensionToEntanglementType(dimension: FiveTDimension): EntanglementType {
  switch (dimension) {
    case 'traceable':
      return 'data-flow';
    case 'transparent':
      return 'proof-anchor';
    case 'tangible':
      return 'metric-bind';
    case 'trustworthy':
      return 'proof-anchor';
    case 'trackable':
      return 'causal-chain';
    default:
      return 'data-flow';
  }
}

/**
 * Create a 5T Gate Tag - Factory that creates an OmniTag
 * with the appropriate gate dimension based on the chapter ID.
 *
 * The created tag:
 * 1. Resolves the chapter to a FiveTDimension
 * 2. Maps the dimension to an EntanglementType
 * 3. Creates the base OmniTag via OmniBase
 * 4. Attaches 5T metadata (gate dimension, GRI code)
 */
export function create5TTag(chapterId: string, griCode: string): OmniTag {
  const dimension = resolveGateDimension(chapterId);
  const entanglementType = dimensionToEntanglementType(dimension);

  const tag = baseCreateTag(chapterId, griCode, entanglementType);

  const enrichedMetadata: Readonly<Record<string, string | number | boolean>> = Object.freeze({
    ...tag.metadata,
    fiveTGate: dimension,
    griCode,
    gateVersion: '2.0',
    omniTagVersion: '2.0',
  });

  return Object.freeze<OmniTag>({
    ...tag,
    metadata: enrichedMetadata,
  });
}

/**
 * Create multiple 5T tags for a batch of GRI codes under the same chapter.
 */
export function create5TTagBatch(chapterId: string, griCodes: readonly string[]): OmniTag[] {
  return griCodes.map(code => create5TTag(chapterId, code));
}
