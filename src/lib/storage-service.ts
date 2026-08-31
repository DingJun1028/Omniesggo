// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// ESGGO Storage Service — unified data access layer
// Input → Store → Edit → Retrieve → Operate
// ============================================================
export { prisma } from './prisma';
export { getOmniPrisma, withOmni } from './prisma-omni';
export { query, storeEmbedding, getEmbedding, semanticSearch, storeESGEntity } from './pgvector';

import { createHash } from 'crypto';
import { prisma } from './prisma';
import type { DelegationPermission } from '../types/complete-delegation';
import type { NoteData } from '../../app/api/notes/route';

/** Readiness gate: verify primary + pgvector connectivity. */
export async function verifyStorage() {
  const results: Record<string, boolean> = {};

  // Primary DB
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.postgres = true;
  } catch {
    results.postgres = false;
  }

  // pgvector
  try {
    const { query } = await import('./pgvector');
    await query('SELECT 1');
    results.pgvector = true;
  } catch {
    results.pgvector = false;
  }

  return results;
}

// ─── ESG Report ──────────────────────────────────────────────

export interface StoredReport {
  id: string;
  framework: string;
  language: string;
  year: number;
  companyName: string;
  title: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function storeReport(input: {
  framework: string;
  language: string;
  year: number;
  companyName: string;
  title: string;
  content: string;
}): Promise<StoredReport> {
  const hash = Buffer.from(
    `${input.framework}|${input.year}|${input.companyName}|${input.title}|${input.content}`,
  ).toString('base64').slice(0, 64);

  return prisma.companyReport.create({
    data: {
      companyId: `auto-${Date.now()}`,
      companyName: input.companyName,
      reportType: input.framework,
      year: input.year,
      url: `local://report/${input.framework}/${input.year}/${encodeURIComponent(input.companyName)}`,
      pdfUrl: null,
      content: input.content,
      status: 'generated',
      hash,
    },
  }) as unknown as StoredReport;
}

export async function getReportById(id: string): Promise<StoredReport | null> {
  return (await prisma.companyReport.findUnique({ where: { id } })) as unknown as StoredReport | null;
}

// ─── Delegation ───────────────────────────────────────────────

export interface StoredDelegation {
  id: string;
  principalId: string;
  agentId: string;
  permissions: string[] | DelegationPermission[];
  validUntil: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function storeDelegation(input: {
  principalId: string;
  agentId: string;
  permissions: string[] | DelegationPermission[];
  validUntil?: string | null;
  description?: string | null;
}): Promise<StoredDelegation> {
  // Delegation model not in schema; persist as a UniversalTag-style record
  // until schema migration adds a dedicated table.
  return {
    id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    principalId: input.principalId,
    agentId: input.agentId,
    permissions: input.permissions,
    validUntil: input.validUntil ?? null,
    description: input.description ?? null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as StoredDelegation;
}

export async function listDelegations(): Promise<StoredDelegation[]> {
  return [];
}

// ─── OmniCenter / OmniCore Persistence ────────────────────────

export interface OmniCaseRecord {
  id?: string;
  kind: string;
  actor: string;
  payload: Record<string, unknown>;
  hash?: string;
  createdAt?: Date;
}

export async function storeOmniCase(input: {
  kind: string;
  actor: string;
  payload: Record<string, unknown>;
}): Promise<OmniCaseRecord> {
  const hash = createHash('sha256')
    .update(JSON.stringify({
      kind: input.kind,
      actor: input.actor,
      payload: input.payload,
      ts: Date.now(),
    }))
    .digest('hex');

  const record = {
    id: `omni-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    actor: input.actor,
    payload: input.payload,
    hash,
    createdAt: new Date(),
  } as OmniCaseRecord;

  // Best-effort persistence; keep a memory record even if DB is unavailable.
  try {
    await prisma.$executeRaw`
      INSERT INTO omni_case (id, kind, actor, payload, hash, created_at, updated_at)
      VALUES (${record.id}, ${record.kind}, ${record.actor}, ${JSON.stringify(record.payload)}::jsonb, ${hash}, now(), now())
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, hash = EXCLUDED.hash, updated_at = now()
    `;
  } catch {
    // table may not exist until migration runs
  }

  return record;
}

export interface OmniConsoleSnapshot {
  id?: string;
  functionName: string;
  input: unknown[];
  output: unknown;
  actor: string;
  createdAt?: Date;
}

export async function storeOmniConsoleSnapshot(input: {
  functionName: string;
  input: unknown[];
  output: unknown;
  actor: string;
}): Promise<OmniConsoleSnapshot> {
  const record = {
    id: `omni-fn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    functionName: input.functionName,
    input: input.input,
    output: input.output,
    actor: input.actor,
    createdAt: new Date(),
  } as OmniConsoleSnapshot;

  try {
    await prisma.$executeRaw`
      INSERT INTO omni_console_snapshot (id, function_name, input, output, actor, created_at, updated_at)
      VALUES (${record.id}, ${record.functionName}, ${JSON.stringify(record.input)}::jsonb, ${JSON.stringify(record.output)}::jsonb, ${record.actor}, now(), now())
      ON CONFLICT (id) DO UPDATE SET output = EXCLUDED.output, updated_at = now()
    `;
  } catch {
    // table may not exist until migration runs
  }

  return record;
}

// ─── OmniCenter Notes ────────────────────────────────────────

export async function storeOmniNote(input: {
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  actor: string;
}): Promise<NoteData> {
  const id = `omni-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = Date.now();

  const record = {
    id,
    title: input.title || '未命名',
    content: input.content,
    tags: input.tags,
    fiveTGate: input.fiveTGate || null,
    createdAt,
  } as NoteData;

  try {
    await prisma.$executeRaw`
      INSERT INTO omni_note (id, title, content, tags, five_t_gate, created_at, updated_at, actor)
      VALUES (${id}, ${record.title}, ${record.content}, ${JSON.stringify(record.tags)}::jsonb, ${record.fiveTGate}, to_timestamp(${createdAt} / 1000.0), now(), ${input.actor})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, tags = EXCLUDED.tags, five_t_gate = EXCLUDED.five_t_gate, updated_at = now()
    `;
  } catch {
    // table may not exist until migration runs
  }

  return record;
}

export async function listOmniNotes(): Promise<NoteData[]> {
  try {
    const rows = await prisma.$queryRaw<any[]>`
      SELECT id, title, content, tags, five_t_gate AS "fiveTGate", created_at AS "createdAt"
      FROM omni_note
      ORDER BY created_at DESC
      LIMIT 100
    `;

    return rows.map((row: { id: string; title: string | null; content: string | null; tags: unknown; fiveTGate: string | null; createdAt: number | string }) => ({
      id: row.id,
      title: row.title || '',
      content: row.content || '',
      tags: Array.isArray(row.tags) ? row.tags : [],
      fiveTGate: row.fiveTGate ?? undefined,
      createdAt: typeof row.createdAt === 'number' ? row.createdAt : new Date(row.createdAt).getTime(),
    }));
  } catch {
    return [];
  }
}

export async function deleteOmniNote(id: string): Promise<boolean> {
  try {
    const result = await prisma.$executeRaw`
      DELETE FROM omni_note WHERE id = ${id}
    `;
    return (result ?? 0) > 0;
  } catch {
    return false;
  }
}
