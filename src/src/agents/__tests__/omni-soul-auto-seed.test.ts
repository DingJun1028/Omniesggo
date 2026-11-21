import { describe, it, expect, afterEach } from "vitest";
import { OmniSoulAutoSeed } from "../omni-soul-auto-seed";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("OmniSoulAutoSeed", () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("soulPath", () => {
    it("returns correct path based on project root", () => {
      tempDir = mkdtempSync(join(tmpdir(), "soul-test-"));
      const seed = new OmniSoulAutoSeed(tempDir);
      expect(seed.soulPath).toBe(join(tempDir, "SOUL.md"));
    });
  });

  describe("exists", () => {
    it("returns false when SOUL.md does not exist", () => {
      tempDir = mkdtempSync(join(tmpdir(), "soul-test-"));
      const seed = new OmniSoulAutoSeed(tempDir);
      expect(seed.exists).toBe(false);
    });

    it("returns true when SOUL.md exists", () => {
      tempDir = mkdtempSync(join(tmpdir(), "soul-test-"));
      writeFileSync(join(tempDir, "SOUL.md"), "# SOUL", "utf-8");
      const seed = new OmniSoulAutoSeed(tempDir);
      expect(seed.exists).toBe(true);
    });
  });

  describe("initialize", () => {
    it("creates SOUL.md when it does not exist", async () => {
      tempDir = mkdtempSync(join(tmpdir(), "soul-test-"));
      const seed = new OmniSoulAutoSeed(tempDir);
      const result = await seed.initialize();

      expect(result.created).toBe(true);
      expect(result.path).toBe(join(tempDir, "SOUL.md"));
      expect(existsSync(join(tempDir, "SOUL.md"))).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config.name).toBeTruthy();
      expect(result.config.state).toBe("aligned");
      expect(result.config.missions).toBeInstanceOf(Array);
      expect(result.config.values.fiveT).toBeInstanceOf(Array);
      expect(result.config.values.esg).toBeInstanceOf(Array);
    });

    it("returns existing config when SOUL.md already exists", async () => {
      tempDir = mkdtempSync(join(tmpdir(), "soul-test-"));
      const soulContent = `# Soul
| 屬性 | 值 |
|------|-----|
| **名稱** | CustomSoul |
`;
      writeFileSync(join(tempDir, "SOUL.md"), soulContent, "utf-8");

      const seed = new OmniSoulAutoSeed(tempDir);
      const result = await seed.initialize();

      expect(result.created).toBe(false);
      expect(result.path).toBe(join(tempDir, "SOUL.md"));
      expect(result.config.name).toBe("CustomSoul");
    });

    it("creates parent directories if they do not exist", async () => {
      tempDir = mkdtempSync(join(tmpdir(), "soul-test-"));
      const nestedDir = join(tempDir, "a", "b", "c");
      const seed = new OmniSoulAutoSeed(nestedDir);
      const result = await seed.initialize();

      expect(result.created).toBe(true);
      expect(existsSync(join(nestedDir, "SOUL.md"))).toBe(true);
    });
  });
});
