#!/usr/bin/env node
/**
 * SonarCloud Quality Gate checker (Automatic Analysis companion).
 *
 * Polls the SonarCloud Web API for the quality-gate status of a project /
 * pull request and, on failure, prints the failing conditions plus the
 * relevant issue details so the root cause is visible directly in CI logs.
 *
 * Zero runtime dependencies (Node >= 22, global fetch). Fail-fast: the token
 * is read exclusively from the SONAR_TOKEN environment variable and is never
 * printed, logged, or persisted.
 *
 * Usage:
 *   SONAR_TOKEN=... node scripts/sonar-quality-gate.mjs \
 *     --organization dingjun1028 \
 *     --project DingJun1028_Omniesggo \
 *     [--pull-request 123 | --branch main] \
 *     [--timeout 600] [--interval 20] [--verbose]
 *
 * Exit codes: 0 = gate PASSED, 1 = gate FAILED, 2 = timeout / API error.
 */

const DEFAULT_TIMEOUT_SECONDS = 600;
const DEFAULT_INTERVAL_SECONDS = 20;
const MAX_ISSUES = 50;

function parseArgs(argv) {
  const args = {
    organization: "dingjun1028",
    project: "DingJun1028_Omniesggo",
    pullRequest: null,
    branch: null,
    timeout: DEFAULT_TIMEOUT_SECONDS,
    interval: DEFAULT_INTERVAL_SECONDS,
    verbose: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) fail(`missing value for ${a}`);
      return argv[++i];
    };
    switch (a) {
      case "--organization": args.organization = next(); break;
      case "--project": args.project = next(); break;
      case "--pull-request": args.pullRequest = Number(next()); break;
      case "--branch": args.branch = next(); break;
      case "--timeout": args.timeout = Number(next()); break;
      case "--interval": args.interval = Number(next()); break;
      case "--verbose": args.verbose = true; break;
      case "--help": case "-h":
        console.log("See header comment for usage."); process.exit(0); break;
      default: fail(`unknown argument: ${a}`);
    }
  }
  if (!Number.isFinite(args.pullRequest) && !args.branch) args.branch = "main";
  if (args.pullRequest != null && args.branch && argv.includes("--pull-request")) {
    args.branch = null; // PR context takes precedence over an explicit branch.
  }
  if (args.interval < 5) fail("--interval must be >= 5 seconds");
  if (args.timeout < args.interval) fail("--timeout must be >= --interval");
  return args;
}

function fail(message, code = 2) {
  console.error(`Error: ${message}`);
  process.exit(code);
}

async function api(path, params, token) {
  const url = new URL(`https://sonarcloud.io/api/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  const body = await res.text();
  if (res.status === 404) return { status: 404, data: null };
  if (!res.ok) {
    throw new Error(`SonarCloud API ${res.status} on ${path}: ${body.slice(0, 400)}`);
  }
  return { status: res.status, data: JSON.parse(body) };
}

function contextParams(args) {
  return args.pullRequest != null
    ? { projectKey: args.project, pullRequest: args.pullRequest }
    : { projectKey: args.project, branch: args.branch };
}

function formatConditions(status) {
  const rows = (status.conditions ?? []).map((c) => {
    const metric = c.metricKey ?? "";
    const value = `${c.value ?? "?"}${c.errorThreshold ? ` (threshold ${c.comparator} ${c.errorThreshold})` : ""}`;
    return `  [${c.status}] ${metric}: ${value}`;
  });
  return rows.length ? rows.join("\n") : "  (no conditions reported)";
}

async function fetchIssues(args, token, qualities) {
  const issues = [];
  for (const q of qualities) {
    const { data } = await api("issues/search", {
      organization: args.organization,
      componentKeys: args.project,
      ...(args.pullRequest != null ? { pullRequest: args.pullRequest } : { branch: args.branch }),
      impactSoftwareQualities: q,
      ps: MAX_ISSUES,
      s: "ISSUE_KEY",
    }, token);
    for (const it of data?.issues ?? []) {
      issues.push({
        rule: it.rule,
        severity: it.severity,
        component: (it.component ?? "").split(":").pop(),
        line: it.line ?? "-",
        message: (it.message ?? "").split("\n")[0],
      });
    }
    if (issues.length >= MAX_ISSUES) break;
  }
  return issues.slice(0, MAX_ISSUES);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const token = process.env.SONAR_TOKEN;
  if (!token || !token.trim()) {
    fail("SONAR_TOKEN is not set. Provide it via environment; never hardcode it. (fail-fast policy)");
  }

  // 1. Validate the token once, up front.
  const { data: auth } = await api("authentication/validate", {}, token);
  if (!auth?.valid) fail("SONAR_TOKEN was rejected by SonarCloud (authentication/validate).");

  const where = args.pullRequest != null ? `PR #${args.pullRequest}` : `branch "${args.branch}"`;
  console.log(`SonarCloud quality gate: ${args.project} @ ${where} — polling up to ${args.timeout}s.`);

  // 2. Poll the gate until the Automatic Analysis has finished computing it.
  const deadline = Date.now() + args.timeout * 1000;
  let lastStatus = null;
  while (Date.now() < deadline) {
    const t0 = Date.now();
    const { status, data } = await api("qualitygates/project_status", contextParams(args), token);
    if (status === 200 && data?.projectStatus?.status) {
      lastStatus = data.projectStatus;
      if (lastStatus.status !== "UNKNOWN") break;
    }
    if (args.verbose) console.log(`  ...gate not ready (HTTP ${status}); retrying.`);
    const elapsed = Date.now() - t0;
    await new Promise((r) => setTimeout(r, Math.max(0, args.interval * 1000 - elapsed)));
  }
  if (!lastStatus || lastStatus.status === "UNKNOWN") {
    fail(`quality gate not computed within ${args.timeout}s for ${where}.`);
  }

  console.log(`Quality gate status: ${lastStatus.status}`);
  console.log(formatConditions(lastStatus));

  // 3. On failure, surface the concrete issues so the fix is evidence-driven.
  if (lastStatus.status === "ERROR" || lastStatus.status === "WARN") {
    const failed = (lastStatus.conditions ?? []).filter((c) => c.status !== "OK");
    const qualities = [...new Set(failed.map((c) => {
      const key = c.metricKey ?? "";
      if (key.startsWith("new_")) return key.replace(/^new_/, "").replace(/_rating$/, "").toUpperCase();
      return null;
    }).filter(Boolean))];
    const issues = await fetchIssues(args, token, qualities.length ? qualities : ["SECURITY", "RELIABILITY", "MAINTAINABILITY"]);
    if (issues.length) {
      console.log(`\nTop ${issues.length} issue(s) on ${where}:`);
      for (const it of issues) {
        console.log(`  - [${it.severity}] ${it.rule} ${it.component}:${it.line} — ${it.message}`);
      }
    } else {
      console.log(`\nNo issues returned for the failing qualities on ${where}; check the SonarCloud UI for detail.`);
    }
  }

  if (lastStatus.status === "ERROR") {
    console.error("Quality gate: FAILED");
    process.exit(1);
  }
  console.log("Quality gate: PASSED");
  process.exit(0);
}

main().catch((err) => fail(err?.message ?? String(err)));
