// ═══════════════════════════════════════════════════════════════
// Rune Engrafting Plugin API Standard — 符文鑲嵌插件 API 標準 (F-08 / M4)
// Convention: 英標繁博 (English Standard, Traditional Chinese Broad)
// PRD: docs/OMN-PRD-001.md §2.3 F-08 (L1 基礎層) · §5.1 M4 · §4.1 FR-07
//
// The engrafting contract every third-party plugin manifest must satisfy
// before it may be sealed into the OmniBase registry.
// 第三方插件 manifest 鑲嵌進 OmniBase registry 前必須通過的契約校驗。
// ═══════════════════════════════════════════════════════════════

export const RUNE_CONTRACT_VERSION = '1.0.0';

export interface RuneManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  hooks: string[];
  permissions?: string[];
  dependencies?: string[];
  config?: Record<string, unknown>;
}

export interface RuneValidationResult {
  ok: boolean;
  /** Machine-readable failures — 機器可讀失敗碼 */
  errors: string[];
  contractVersion: string;
}

const RUNE_ID = /^[a-z0-9][a-z0-9-]{0,62}\/[a-z0-9][a-z0-9-]{0,62}$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9:._*-]{0,63}$/;
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

const MAX_NAME = 80;
const MAX_DESCRIPTION = 280;
const MAX_HOOKS = 64;
const MAX_LIST = 64;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkText(
  errors: string[],
  field: string,
  value: unknown,
  min: number,
  max: number
): void {
  if (typeof value !== 'string') {
    errors.push(`${field}: must be a string`);
    return;
  }
  if (value.trim().length < min) errors.push(`${field}: must be at least ${min} character(s)`);
  if (value.length > max) errors.push(`${field}: exceeds ${max} characters`);
  if (CONTROL_CHARS.test(value)) errors.push(`${field}: contains control characters`);
}

function checkStringArray(
  errors: string[],
  field: string,
  value: unknown,
  pattern: RegExp,
  maxItems: number,
  allowEmpty: boolean
): void {
  if (!Array.isArray(value)) {
    errors.push(`${field}: must be an array`);
    return;
  }
  if (!allowEmpty && value.length === 0) errors.push(`${field}: must not be empty`);
  if (value.length > maxItems) errors.push(`${field}: exceeds ${maxItems} items`);
  value.forEach((item, index) => {
    if (typeof item !== 'string') {
      errors.push(`${field}[${index}]: must be a string`);
      return;
    }
    if (!pattern.test(item)) errors.push(`${field}[${index}]: invalid token "${item}"`);
  });
}

/**
 * Validate a plugin manifest against the Rune Engrafting contract.
 * 依符文鑲嵌標準校驗插件 manifest。
 */
export function validateRuneManifest(manifest: unknown): RuneValidationResult {
  const errors: string[] = [];

  if (!isPlainObject(manifest)) {
    return { ok: false, errors: ['manifest: must be an object'], contractVersion: RUNE_CONTRACT_VERSION };
  }

  const m = manifest as Partial<RuneManifest>;

  if (typeof m.id !== 'string' || !RUNE_ID.test(m.id)) {
    errors.push(`id: must be a lowercase "author/name" slug, got ${JSON.stringify(m.id)}`);
  }
  checkText(errors, 'name', m.name, 1, MAX_NAME);
  checkText(errors, 'description', m.description, 1, MAX_DESCRIPTION);

  if (typeof m.version !== 'string' || !SEMVER.test(m.version)) {
    errors.push(`version: must be semver (x.y.z), got ${JSON.stringify(m.version)}`);
  }

  if (m.author !== undefined) checkText(errors, 'author', m.author, 1, MAX_NAME);

  if (m.hooks === undefined) {
    errors.push('hooks: required (may be an empty array)');
  } else {
    checkStringArray(errors, 'hooks', m.hooks, TOKEN, MAX_HOOKS, true);
  }

  if (m.permissions !== undefined) {
    checkStringArray(errors, 'permissions', m.permissions, TOKEN, MAX_LIST, true);
  }
  if (m.dependencies !== undefined) {
    checkStringArray(errors, 'dependencies', m.dependencies, RUNE_ID, MAX_LIST, true);
  }

  if (m.config !== undefined && !isPlainObject(m.config)) {
    errors.push('config: must be a plain object');
  }

  return { ok: errors.length === 0, errors, contractVersion: RUNE_CONTRACT_VERSION };
}

/** Short human-readable contract summary for API responses — API 用契約摘要 */
export function describeRuneContract(): {
  contractVersion: string;
  idFormat: string;
  versionFormat: string;
  limits: Record<string, number>;
} {
  return {
    contractVersion: RUNE_CONTRACT_VERSION,
    idFormat: 'author/name (lowercase slug)',
    versionFormat: 'semver x.y.z',
    limits: { name: MAX_NAME, description: MAX_DESCRIPTION, hooks: MAX_HOOKS, list: MAX_LIST },
  };
}

export type { RuneManifest as PluginManifestContract };
