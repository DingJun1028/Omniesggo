#!/usr/bin/env node
/**
 * SonarCloud gate poller: stale-verdict guard behavioral tests.
 *
 * scripts/sonar-quality-gate.mjs pollGate() carries two guards against the
 * SonarCloud stale-verdict race (the API keeps serving the previous analysis
 * for a while after a push): a settle window and a fresh-verdict stability
 * window. These tests drive the real pollGate on a virtual clock with
 * scripted verdict timelines, so the exact race observed while merging
 * PR #292 (stale ERROR accepted 134s in; fresh verdict indexed at ~154s)
 * can never regress silently. No SONAR_TOKEN and no network access needed:
 * pollOnce is injected as a stub through pollGate's pollOnceImpl seam.
 *
 * Run: node tests/sonar-gate-poller.test.mjs  (exit 0 = all passed)
 */

import { readFileSync } from "node:fs";
import { strict as assert } from "node:assert";
import { pollGate } from "../scripts/sonar-quality-gate.mjs";

const scriptSource = readFileSync(
  new URL("../scripts/sonar-quality-gate.mjs", import.meta.url),
  "utf8",
);

let passed = 0;
let failed = 0;
async function t(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log("ok - " + name);
  } catch (err) {
    failed += 1;
    console.log("FAIL - " + name + "\n    " + (err?.message ?? err));
  }
}

/** Timeline: [[msFrom, verdict], ...] verdict served once the clock passes msFrom. */
async function runScenario(timeline, args) {
  const realNow = Date.now;
  const realSetTimeout = globalThis.setTimeout;
  let clock = 0;
  const startedAt = clock;
  try {
    Date.now = () => clock;
    globalThis.setTimeout = (resolve, ms) => {
      clock += ms;
      resolve();
    };
    const pollOnceStub = () => {
      let verdict = null;
      for (const [from, value] of timeline) {
        if (clock >= from) verdict = value;
      }
      if (verdict === null) return null;
      return { status: verdict, conditions: [] };
    };
    const result = await pollGate(args, "stub-token", pollOnceStub);
    return { result, elapsed: (clock - startedAt) / 1000 };
  } finally {
    Date.now = realNow;
    globalThis.setTimeout = realSetTimeout;
  }
}

const baseArgs = { settle: 120, stability: 60, interval: 20, timeout: 600, verbose: false };

const scenarios = [
  [
    "stale ERROR then fresh OK resolves OK after stability (PR #292 race replay)",
    [[0, "ERROR"], [154000, "OK"]],
    "OK",
    [214, 230],
  ],
  [
    "ERROR held from the start resolves ERROR after settle plus stability",
    [[0, "ERROR"]],
    "ERROR",
    [180, 200],
  ],
  [
    "UNKNOWN then late OK at 300s resolves OK after stability",
    [[0, "UNKNOWN"], [300000, "OK"]],
    "OK",
    [360, 380],
  ],
  [
    "stale OK then fresh ERROR resolves ERROR (no false green)",
    [[0, "OK"], [154000, "ERROR"]],
    "ERROR",
    [214, 230],
  ],
];

for (const [name, timeline, expected, [lo, hi]] of scenarios) {
  await t(name, async () => {
    const { result, elapsed } = await runScenario(timeline, baseArgs);
    assert.equal(
      result?.status,
      expected,
      "verdict " + result?.status + " != " + expected,
    );
    assert.ok(
      elapsed >= lo && elapsed <= hi,
      "accepted at " + elapsed + "s, expected within [" + lo + "s, " + hi + "s]",
    );
  });
}

await t("UNKNOWN alone is never accepted and polls to timeout", async () => {
  const { result, elapsed } = await runScenario([[0, "UNKNOWN"]], {
    ...baseArgs,
    timeout: 300,
  });
  assert.equal(result?.status, "UNKNOWN");
  assert.ok(elapsed >= 300, "clock stopped at " + elapsed + "s before timeout");
});

await t("guards off (--settle 0 --stability 0) accepts the first verdict at once", async () => {
  const { result, elapsed } = await runScenario([[0, "OK"]], {
    ...baseArgs,
    settle: 0,
    stability: 0,
  });
  assert.equal(result?.status, "OK");
  assert.ok(elapsed <= 2, "accepted at " + elapsed + "s, expected immediate");
});

await t("script keeps the direct-run guard around main()", async () => {
  assert.ok(
    scriptSource.includes("pathToFileURL(process.argv[1]"),
    "direct-run guard missing: main() would fire on import",
  );
  assert.ok(scriptSource.includes("main().catch"), "main() invocation missing");
});

await t("script keeps the --stability guard flag and its budget check", async () => {
  assert.ok(scriptSource.includes('"--stability"'), "--stability flag missing from parseArgs");
  assert.ok(
    scriptSource.includes("args.settle + args.stability"),
    "poll budget validation missing",
  );
});

console.log(failed === 0 ? "\n" + passed + " passed" : "\n" + passed + " passed, " + failed + " FAILED");
process.exit(failed === 0 ? 0 : 1);
