import { describe, it, expect, beforeEach } from "vitest";
import { OmniSoul, createOmniSoul, getOmniSoul } from "../omni-soul";

describe("OmniSoul", () => {
  beforeEach(() => {
    // Reset singleton by creating a fresh instance (module-level _instance persists)
    // We work around this by testing createOmniSoul behavior and direct construction
  });

  describe("createOmniSoul", () => {
    it("creates instance with default config", () => {
      // Use new directly to avoid singleton pollution from other tests
      const soul = new OmniSoul({ name: "TestSoul" });
      expect(soul).toBeInstanceOf(OmniSoul);
      expect(soul.name).toBe("TestSoul");
      expect(soul.state).toBe("dormant");
      expect(soul.soulVersion).toBe("1.0.0");
      expect(soul.signature).toBeDefined();
      expect(soul.signature.uuid).toBeTruthy();
      expect(soul.signature.hash).toBeTruthy();
    });

    it("returns same instance (singleton)", () => {
      const soul1 = createOmniSoul({ name: "First" });
      const soul2 = createOmniSoul({ name: "Second" });
      expect(soul1).toBe(soul2);
    });
  });

  describe("parseIntent", () => {
    it("returns SemanticVector for ESG keywords", async () => {
      const soul = new OmniSoul({ name: "ParseTest" });
      const result = await soul.parseIntent("carbon emission report");

      expect(result.dimensions).toBe(5);
      expect(result.values).toHaveLength(5);
      expect(result.tags).toContain("carbon");
      expect(result.tags).toContain("emission");
      expect(result.tags).toContain("report");
      // Vector should have non-zero values for environmental (index 0) and reporting (index 4)
      expect(result.values[0]).toBeGreaterThan(0);
      expect(result.values[4]).toBeGreaterThan(0);
    });

    it("returns zero vector for unmatched intent", async () => {
      const soul = new OmniSoul({ name: "ParseTest" });
      const result = await soul.parseIntent("xyzzy foobar");

      expect(result.dimensions).toBe(5);
      expect(result.values).toHaveLength(5);
      expect(result.tags).toHaveLength(0);
      expect(result.values.every((v) => v === 0)).toBe(true);
    });

    it("deduplicates tags", async () => {
      const soul = new OmniSoul({ name: "ParseTest" });
      const result = await soul.parseIntent("carbon carbon carbon");

      expect(result.tags).toEqual(["carbon"]);
    });
  });

  describe("checkAlignment", () => {
    it("returns GovernanceAlignment with all fields", async () => {
      const soul = new OmniSoul({ name: "AlignTest" });
      const alignment = await soul.checkAlignment({
        type: "deploy",
        params: { source: "verified", hash: "0xabc" },
      });

      expect(alignment).toHaveProperty("fiveT");
      expect(alignment.fiveT).toHaveProperty("truth");
      expect(alignment.fiveT).toHaveProperty("goodness");
      expect(alignment.fiveT).toHaveProperty("beauty");
      expect(alignment.fiveT).toHaveProperty("trust");
      expect(alignment.fiveT).toHaveProperty("transferful");
      expect(alignment).toHaveProperty("constitution");
      expect(alignment).toHaveProperty("esgValues");

      // All values should be numbers between 0 and 1
      expect(alignment.fiveT.truth).toBeGreaterThanOrEqual(0);
      expect(alignment.fiveT.truth).toBeLessThanOrEqual(1);
      expect(alignment.constitution).toBeGreaterThanOrEqual(0);
      expect(alignment.constitution).toBeLessThanOrEqual(1);
      expect(alignment.esgValues).toBeGreaterThanOrEqual(0);
      expect(alignment.esgValues).toBeLessThanOrEqual(1);
    });

    it("gives higher truth score when source param is provided", async () => {
      const soul = new OmniSoul({ name: "AlignTest" });
      const withSource = await soul.checkAlignment({
        type: "deploy",
        params: { source: "verified" },
      });
      const withoutSource = await soul.checkAlignment({
        type: "deploy",
        params: {},
      });

      expect(withSource.fiveT.truth).toBeGreaterThan(withoutSource.fiveT.truth);
    });

    it("gives higher trust score when hash param is provided", async () => {
      const soul = new OmniSoul({ name: "AlignTest" });
      const withHash = await soul.checkAlignment({
        type: "deploy",
        params: { hash: "0xabc" },
      });
      const withoutHash = await soul.checkAlignment({
        type: "deploy",
        params: {},
      });

      expect(withHash.fiveT.trust).toBeGreaterThan(withoutHash.fiveT.trust);
    });
  });

  describe("decide", () => {
    it("selects best matching option", async () => {
      const soul = new OmniSoul({ name: "DecideTest" });
      const decision = await soul.decide({
        intent: "carbon emission monitoring",
        options: [
          { id: "opt-a", description: "deploy database backup" },
          { id: "opt-b", description: "monitor carbon emission levels" },
          { id: "opt-c", description: "governance compliance audit" },
        ],
      });

      expect(decision).toHaveProperty("uuid");
      expect(decision).toHaveProperty("timestamp");
      expect(decision).toHaveProperty("rationale");
      expect(decision).toHaveProperty("alignment");
      expect(decision).toHaveProperty("intent");
      expect(decision).toHaveProperty("confidence");
      expect(decision.confidence).toBeGreaterThanOrEqual(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      // "opt-b" description shares carbon/emission keywords with intent
      expect(decision.rationale).toContain("monitor carbon emission levels");
    });

    it("records decision in recentDecisions", async () => {
      const soul = new OmniSoul({ name: "DecideTest" });
      await soul.decide({
        intent: "safety check",
        options: [{ id: "a", description: "employee safety inspection" }],
      });

      expect(soul.recentDecisions).toHaveLength(1);
      expect(soul.recentDecisions[0].uuid).toBeTruthy();
    });
  });

  describe("awaken", () => {
    it("transitions state forward correctly", async () => {
      const soul = new OmniSoul({ name: "AwakenTest", initialState: "dormant" });
      expect(soul.state).toBe("dormant");

      await soul.awaken("aligned");
      expect(soul.state).toBe("aligned");
    });

    it("transitions through intermediate states", async () => {
      const soul = new OmniSoul({ name: "AwakenTest", initialState: "dormant" });
      await soul.awaken("flowing");
      // Should pass through aware and aligned
      expect(soul.state).toBe("flowing");
    });

    it("does not transition backwards", async () => {
      const soul = new OmniSoul({ name: "AwakenTest", initialState: "aligned" });
      await soul.awaken("dormant");
      // State should remain unchanged (no backward transition)
      expect(soul.state).toBe("aligned");
    });

    it("reaches transcendent state", async () => {
      const soul = new OmniSoul({ name: "AwakenTest", initialState: "dormant" });
      await soul.awaken("transcendent");
      expect(soul.state).toBe("transcendent");
    });
  });

  describe("reflect", () => {
    it("returns insights, improvements, and nextActions", async () => {
      const soul = new OmniSoul({ name: "ReflectTest" });
      const result = await soul.reflect();

      expect(result).toHaveProperty("insights");
      expect(result).toHaveProperty("improvements");
      expect(result).toHaveProperty("nextActions");
      expect(result.insights).toBeInstanceOf(Array);
      expect(result.improvements).toBeInstanceOf(Array);
      expect(result.nextActions).toBeInstanceOf(Array);
    });

    it("includes alignment insight", async () => {
      const soul = new OmniSoul({ name: "ReflectTest" });
      const result = await soul.reflect();

      const alignmentInsight = result.insights.find((i) =>
        i.includes("治理對齊度")
      );
      expect(alignmentInsight).toBeTruthy();
    });

    it("provides improvement suggestions when confidence is low", async () => {
      const soul = new OmniSoul({ name: "ReflectTest" });
      // Make some decisions to generate reflection data
      await soul.decide({
        intent: "hello world",
        options: [{ id: "a", description: "something unrelated" }],
      });
      const result = await soul.reflect();

      // Should return arrays (content depends on confidence scores)
      expect(Array.isArray(result.insights)).toBe(true);
      expect(Array.isArray(result.improvements)).toBe(true);
    });
  });

  describe("alignment getter", () => {
    it("returns a copy of alignment (not a reference)", () => {
      const soul = new OmniSoul({ name: "CopyTest" });
      const a1 = soul.alignment;
      const a2 = soul.alignment;
      expect(a1).not.toBe(a2);
      expect(a1).toEqual(a2);
    });
  });

  describe("signature", () => {
    it("has valid IComponentCore structure", () => {
      const soul = new OmniSoul({ name: "SigTest" });
      expect(soul.signature.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
      expect(soul.signature.version).toBe("1.0.0");
      expect(soul.signature.timestamp).toBeGreaterThan(0);
      expect(soul.signature.hash).toMatch(/^0x[0-9a-f]+$/);
      expect(soul.signature.evidence).toHaveProperty("type", "omni-soul");
    });
  });
});
