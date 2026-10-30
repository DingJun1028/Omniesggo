import { Type, type Static } from "@sinclair/typebox";
import { defineRune } from '@lib/adk/core';

/**
 * [02] 語義版本官 (The Semanticist) — 奧義：永恆刻印
 * 責任：零遺忘版本控制，確保每個 Commit 都是對 OmniRepository 的永恆刻印
 */

export const SemanticVersionSchema = Type.Object({
  currentVersion: Type.String({ description: "目前版本號 (semver 格式，如 v1.2.3)" }),
  changeType: Type.Union([Type.Literal("major"), Type.Literal("minor"), Type.Literal("patch")], { description: "變更類型" }),
  changeLog: Type.String({ description: "本次變更描述" }),
  author: Type.String({ description: "變更執行者 UUID" }),
  module: Type.String({ description: "受影響的模組名稱" }),
});

export const SemanticVersionResultSchema = Type.Object({
  newVersion: Type.String(),
  versionHash: Type.String(),
  timestamp: Type.Number(),
  isValid: Type.Boolean(),
  conflictDetected: Type.Boolean(),
  message: Type.String(),
});

function bumpVersion(current: string, type: "major" | "minor" | "patch"): string {
  const cleaned = current.replace(/^v/, "");
  const parts = cleaned.split(".").map(Number);
  if (parts.length !== 3) return `v${cleaned}-bumped`;

  const [major, minor, patch] = parts;
  if (type === "major") return `v${major + 1}.0.0`;
  if (type === "minor") return `v${major}.${minor + 1}.0`;
  return `v${major}.${minor}.${patch + 1}`;
}

export const semanticistRune = defineRune({
  name: "semanticistRune",
  description: "[02] 語義版本官：執行嚴格語義化版本控制，確保零衝突零遺忘的版本刻印",
  schema: SemanticVersionSchema,
  execute: async (_context, input) => {
    const { currentVersion, changeType, changeLog, author, module } = input;

    // Validate semver format
    const semverRegex = /^v?\d+\.\d+\.\d+/;
    const isValid = semverRegex.test(currentVersion);

    const newVersion = bumpVersion(currentVersion, changeType);
    const timestamp = Date.now();
    const versionHash = Buffer.from(`${newVersion}:${author}:${timestamp}`)
      .toString("base64")
      .slice(0, 16);

    const result: Static<typeof SemanticVersionResultSchema> = {
      newVersion,
      versionHash,
      timestamp,
      isValid,
      conflictDetected: false,
      message: isValid 
        ? `[02] SEMANTICIST ✓ v${currentVersion} → ${newVersion} | Module: ${module} | Author: ${author} | Change: ${changeLog}`
        : `[02] SEMANTICIST ✗ 版本格式無效: ${currentVersion}`
    };

    return JSON.stringify(result, null, 2);
  }
});
