/**
 * A08 Phase 3: OmniDreams — Dreams & Forgetting Engine
 * scripts/omni-dreams.mjs
 *
 * Schedule via PM2 Cron:
 *   pm2 start scripts/omni-dreams.mjs --cron "0 3 * * *" --no-autorestart
 *
 * Logic:
 *   1. Forgetting: decay confidence for old/unused memories; archive below threshold
 *   2. Dreams:     extract rules/preferences from recent transcript.jsonl
 *   3. Synthesis:  write OMNI_ALIGNMENT.md with current memory snapshot
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, "..");

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const USER_ID       = "junai-key";
const AGENT_ID      = "omni-agent";
const FORGET_THRESH = 0.35;   // confidence below this → archived
const DECAY_RATE    = 0.05;   // per-day decay for untouched memories
const TRANSCRIPT_PATH = path.join(
  process.env.APPDATA ?? "",
  "..",
  ".gemini",
  "antigravity-ide",
  "brain"
);

// ── Supabase REST helper ─────────────────────────────────────────────────────
function supabaseReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(SUPABASE_URL + path);
    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method,
      headers: {
        "apikey":         SUPABASE_KEY,
        "Authorization":  `Bearer ${SUPABASE_KEY}`,
        "Content-Type":   "application/json",
        "Prefer":         "return=representation",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(raw); }
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── 1. Forgetting ────────────────────────────────────────────────────────────
async function runForgetting() {
  console.log("[Dreams] Phase 1: Forgetting — fetching memories...");

  const all = await supabaseReq(
    "GET",
    `/rest/v1/OmniMemory?user_id=eq.${USER_ID}&select=*`,
    null
  );

  if (!Array.isArray(all)) {
    console.warn("[Dreams] Could not fetch memories:", all);
    return { archived: 0, decayed: 0 };
  }

  const now   = Date.now();
  let archived = 0;
  let decayed  = 0;

  for (const mem of all) {
    const ageDays = (now - new Date(mem.last_accessed ?? mem.created_at).getTime()) / 86_400_000;
    const newConf  = Math.max(0, mem.confidence - DECAY_RATE * ageDays);

    if (newConf < FORGET_THRESH) {
      // Archive (set confidence = 0, type → archived)
      await supabaseReq("PATCH", `/rest/v1/OmniMemory?id=eq.${mem.id}`, {
        confidence: 0,
        type: "archived",
        last_accessed: new Date().toISOString(),
      });
      archived++;
      console.log(`  [Forget] Archived: ${mem.id} (was ${mem.confidence.toFixed(2)})`);
    } else if (newConf < mem.confidence) {
      await supabaseReq("PATCH", `/rest/v1/OmniMemory?id=eq.${mem.id}`, {
        confidence: parseFloat(newConf.toFixed(4)),
        last_accessed: new Date().toISOString(),
      });
      decayed++;
    }
  }

  console.log(`[Dreams] Forgetting done — archived: ${archived}, decayed: ${decayed}`);
  return { archived, decayed };
}

// ── 2. Dreams (extract from transcript) ──────────────────────────────────────
async function runDreams() {
  console.log("[Dreams] Phase 2: Dreams — scanning transcripts...");

  // Find most recent transcript
  let transcriptFile = null;
  try {
    const dirs = fs.readdirSync(TRANSCRIPT_PATH).filter((d) => {
      try { return fs.statSync(path.join(TRANSCRIPT_PATH, d)).isDirectory(); }
      catch { return false; }
    });
    const logFiles = dirs.flatMap((d) => {
      const lp = path.join(TRANSCRIPT_PATH, d, ".system_generated", "logs", "transcript.jsonl");
      return fs.existsSync(lp) ? [{ f: lp, t: fs.statSync(lp).mtimeMs }] : [];
    });
    logFiles.sort((a, b) => b.t - a.t);
    if (logFiles.length > 0) transcriptFile = logFiles[0].f;
  } catch (e) {
    console.warn("[Dreams] Could not locate transcript:", e.message);
  }

  if (!transcriptFile) {
    console.log("[Dreams] No transcript found — skipping Dreams phase.");
    return [];
  }

  // Extract user preferences / rules from last 200 lines
  const lines = fs
    .readFileSync(transcriptFile, "utf8")
    .split("\n")
    .filter(Boolean)
    .slice(-200);

  const extracted = [];
  const userPrefPatterns = [
    /(?:偏好|prefer|always use|一律使用|必須|禁止|prohibited|要求|required)[^。.!！\n]{5,}/gi,
    /(?:規則|rule|protocol|協議|convention)[：:][^。.!！\n]{5,}/gi,
  ];

  for (const line of lines) {
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    const text = JSON.stringify(obj.content ?? obj.tool_calls ?? "");
    for (const pattern of userPrefPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (const m of matches) {
        const snippet = m[0].replace(/["\\\n]/g, " ").trim().slice(0, 200);
        if (snippet.length > 20) extracted.push(snippet);
      }
    }
  }

  console.log(`[Dreams] Extracted ${extracted.length} potential memories from transcript.`);

  // Write new low-confidence "thought" memories for review
  const inserted = [];
  for (const snippet of extracted.slice(0, 5)) {
    const payload = {
      id:            crypto.randomUUID(),
      user_id:       USER_ID,
      agent_id:      AGENT_ID,
      type:          "thought",
      content:       snippet,
      keywords:      JSON.stringify(["auto-extracted", "dream"]),
      confidence:    0.55,
      source_origin: "DREAMS_ENGINE",
      created_at:    new Date().toISOString(),
      last_accessed: new Date().toISOString(),
    };
    const result = await supabaseReq("POST", "/rest/v1/OmniMemory", payload);
    if (!result?.message?.includes("error")) inserted.push(payload.id);
  }

  console.log(`[Dreams] Inserted ${inserted.length} new dream memories.`);
  return inserted;
}

// ── 3. Alignment Synthesis ───────────────────────────────────────────────────
async function runSynthesis(stats) {
  console.log("[Dreams] Phase 3: Writing OMNI_ALIGNMENT.md...");

  const all = await supabaseReq(
    "GET",
    `/rest/v1/OmniMemory?user_id=eq.${USER_ID}&confidence=gte.0.5&order=confidence.desc&limit=30`,
    null
  );

  const memLines = Array.isArray(all)
    ? all.map((m) => `- [${m.type?.toUpperCase()}] (${(m.confidence * 100).toFixed(0)}%) ${m.content}`)
    : ["- Could not fetch memories"];

  const content = `# OMNI_ALIGNMENT.md
> Auto-generated by OmniDreams Engine — ${new Date().toISOString()}
> Soul: JunAiKey | Commander: OmniAgent | Platform: ESGGO

## Active Memory Matrix (Confidence ≥ 50%)

${memLines.join("\n")}

## Session Stats (Dreams & Forgetting)
- Archived (forgotten):  ${stats.archived ?? 0}
- Decayed (confidence↓): ${stats.decayed ?? 0}
- New dreams extracted:  ${stats.dreamed ?? 0}

## 5T Protocol Status
- Trackable:    All memory mutations logged via OmniSync
- Transparent:  Confidence scores visible and auditable
- Tangible:     Memory dashboard available at /omni-memory
- Trustworthy:  Rules archived via Dreams Engine on schedule
- Transferful:  OMNI_ALIGNMENT.md synced to Obsidian vault
`;

  const outputPath = path.join(ROOT, "docs", "OMNI_ALIGNMENT.md");
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, content, "utf8");

  // Mirror to Obsidian vault if accessible
  const obsidianPath = "C:\\Users\\dingj\\iCloudDrive\\obsidian-vault\\Antigravity\\OMNI_ALIGNMENT.md";
  try {
    fs.mkdirSync(path.dirname(obsidianPath), { recursive: true });
    fs.writeFileSync(obsidianPath, content, "utf8");
    console.log("[Dreams] Mirrored to Obsidian vault.");
  } catch {
    console.log("[Dreams] Obsidian vault not accessible — skipping mirror.");
  }

  console.log(`[Dreams] OMNI_ALIGNMENT.md written to ${outputPath}`);
}

// ── Main ─────────────────────────────────────────────────────────────────────
import { createHash } from "crypto";
const crypto = { randomUUID: () => createHash("sha256").update(Date.now() + Math.random().toString()).digest("hex").slice(0, 36) };

(async () => {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  OmniDreams Engine  — Dreams & Forgetting Run   ║");
  console.log(`║  ${new Date().toISOString()}         ║`);
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("[Dreams] NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set. Aborting.");
    process.exit(1);
  }

  const forgotStats = await runForgetting();
  const dreamIds    = await runDreams();
  await runSynthesis({ ...forgotStats, dreamed: dreamIds.length });

  console.log("\n[Dreams] All phases complete. System alignment updated.");
})();
