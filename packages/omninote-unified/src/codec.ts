/**
 * ============================================================================
 * LocalMarkdownHomomorphicCodec — Markdown + YAML Frontmatter 雙向無損映射
 * ============================================================================
 */
import { Value } from "@sinclair/typebox/value";
import { UnifiedNodeSchema, type GraphTopologyLink, type UnifiedNode } from "./core-types.js";
import { computeNodeLockHash, sha256 } from "./matrix-engine.js";

const FM_DELIM = "---";
const WIKILINK_REGEX = /\[\[([^\][]+)\]\]/g;
const EMBED_SKETCH_REGEX = /!\[\[attachments\/sketch_[a-zA-Z0-9_-]+\.svg\]\]/g;

export interface FileSystemArtifact {
  readonly relativePath: string;
  readonly markdownFileContent: string;
  readonly attachmentSvgs: Array<{ filename: string; svgContent: string }>;
}

export class LocalMarkdownHomomorphicCodec {
  /** 序列化：UnifiedNode → .md（JSON-YAML Frontmatter）+ .svg 附件 */
  static serialize(node: Readonly<UnifiedNode>): FileSystemArtifact {
    if (!Value.Check(UnifiedNodeSchema, node)) {
      throw new Error("[HomomorphicCodec] 節點未通過 TypeBox 契約校驗，禁止磁碟序列化");
    }
    const frontmatterMeta = {
      omni_uuid: node.uuid,
      version: node.version,
      timestamp: node.timestamp,
      phase: node.matrix_phase,
      entity_type: node.entity_type,
      tags: node.topology.tags,
      // 拓撲權威清單：引擎維護之 outlinks 隨節點落地；反序列化時以此為權威，正文 [[雙鏈]] 僅為顯示投影。
      outlinks: node.topology.outlinks,
      properties: node.properties,
      evidence: node.evidence,
      lock_hash: node.lock_hash,
      blocks_meta: node.blocks.map((b) => ({
        block_id: b.block_id,
        type: b.type,
        content: b.content,
        lamport_ts: b.lamport_ts,
        peer_id: b.peer_id,
        deleted: b.deleted,
      })),
    };
    const frontmatterBlock = [FM_DELIM, JSON.stringify(frontmatterMeta, null, 2), FM_DELIM].join("\n");

    const attachmentSvgs: FileSystemArtifact["attachmentSvgs"] = [];
    let processedMarkdown = node.blocks
      .map((b) => (b.type === "sketch_vector" ? `![[attachments/sketch_${b.block_id}.svg]]` : b.content))
      .join("\n\n");

    for (const b of node.blocks) {
      if (b.type === "sketch_vector") {
        const filename = `attachments/sketch_${b.block_id}.svg`;
        attachmentSvgs.push({
          filename,
          svgContent: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" stroke="#00A896" stroke-width="2" fill="none"><path d="${b.content}" /></svg>`,
        });
      }
    }
    if (attachmentSvgs.length > 0 && !processedMarkdown.includes("attachments/sketch_")) {
      processedMarkdown += `\n\n### 視覺筆記手繪存證\n` + attachmentSvgs.map((s) => `![[${s.filename}]]`).join("\n");
    }

    const safeFilename = `${node.entity_type.replace(/[^a-zA-Z0-9_-]/g, "_")}_${node.uuid.slice(0, 8)}.md`;
    return { relativePath: safeFilename, markdownFileContent: `${frontmatterBlock}\n\n${processedMarkdown}\n`, attachmentSvgs };
  }

  /** 反序列化：磁碟 .md + 附件解析器 → UnifiedNode（含竄改偵測） */
  static async deserialize(
    markdownContent: string,
    sketchResolver?: (relativePath: string) => Promise<string | null>
  ): Promise<{ node: Readonly<UnifiedNode>; tampered: boolean; lockFromDisk: string }> {
    const { frontmatterRaw, bodyRaw } = this.extractFrontmatterAndBody(markdownContent);
    const meta = JSON.parse(frontmatterRaw || "{}");

    const outlinks: GraphTopologyLink[] = [];
    let m: RegExpExecArray | null;
    WIKILINK_REGEX.lastIndex = 0;
    const matches: RegExpExecArray[] = [];
    while ((m = WIKILINK_REGEX.exec(bodyRaw)) !== null) matches.push(m);
    // 內層管式語法 [[目標|別名]]：以第一個 | 切分，別名不容許出現 ]；無回溯風險。
    const targets = await Promise.all(matches.map((mm) => this.resolveTargetUuid(mm[1]!.split("|")[0]!.trim())));
    matches.forEach((mm, i) => {
      const parts = mm[1]!.split("|");
      outlinks.push({
        target_uuid: targets[i]!,
        wikilink_alias: (parts.length > 1 ? parts.slice(1).join("|") : parts[0])!.trim(),
        resolved: true,
      });
    });
    // 拓撲權威：manifest 有 outlinks 清單時以其為準（引擎維護之拓撲跨磁碟往返零損失）；
    // 無 manifest（外部匯入 .md）時降級為正文 [[雙鏈]] 確定性 UUID 推導（既有行為）。
    const manifestOutlinks: unknown = meta.outlinks;
    const authoritativeOutlinks: GraphTopologyLink[] =
      Array.isArray(manifestOutlinks) && manifestOutlinks.every((l) => this.isValidTopologyLink(l))
        ? (manifestOutlinks as GraphTopologyLink[])
        : outlinks;

    const metaBlocks: Array<{ block_id: string; type: string; content?: string; lamport_ts: number; peer_id: string; deleted: boolean }> =
      Array.isArray(meta.blocks_meta) ? meta.blocks_meta : [];
    const segments = bodyRaw.split(/\n\n+/).filter((s) => s.trim());
    // 區塊權威來源：blocks_meta（零資訊損失）；body 為 Obsidian 可讀投影。
    // 無 manifest（外部匯入 .md）時降級為正文切段推斷。
    const blocks: UnifiedNode["blocks"] =
      metaBlocks.length > 0
        ? metaBlocks.map((prev, i) => ({
            block_id: prev.block_id,
            type: prev.type as UnifiedNode["blocks"][number]["type"],
            content: prev.content ?? segments[i] ?? "",
            lamport_ts: prev.lamport_ts,
            peer_id: prev.peer_id,
            deleted: prev.deleted,
          }))
        : segments.map((seg) => {
            const sk = /^!\[\[attachments\/sketch_([a-zA-Z0-9-]+)\.svg\]\]$/.exec(seg);
            return {
              block_id: sk ? sk[1]! : crypto.randomUUID(),
              type: (sk ? "sketch_vector" : "paragraph") as UnifiedNode["blocks"][number]["type"],
              content: sk ? "M4 28" : seg,
              lamport_ts: 1,
              peer_id: "disk",
              deleted: false,
            };
          });
    // 還原向量圖層
    if (sketchResolver) {
      let em: RegExpExecArray | null;
      EMBED_SKETCH_REGEX.lastIndex = 0;
      const embeds: RegExpExecArray[] = [];
      while ((em = EMBED_SKETCH_REGEX.exec(bodyRaw)) !== null) embeds.push(em);
      const svgs = await Promise.all(embeds.map((e) => sketchResolver(e[0].slice(3, -3))));
      embeds.forEach((e, i) => {
        const svg = svgs[i];
        const p = svg && /<path d="([^"]+)"/.exec(svg);
        const id = e[0].split("_")[1]?.replace(".svg", "");
        const target = blocks.find((b) => b.block_id === id);
        if (target && p) target.content = p[1]!;
      });
    }

    const reconstructed: UnifiedNode = {
      uuid: meta.omni_uuid,
      version: meta.version || "1.0.0",
      timestamp: meta.timestamp || Date.now(),
      matrix_phase: meta.phase || "SIGMA_GRAPH_SYNTHESIS",
      entity_type: meta.entity_type || "note.raw",
      blocks,
      topology: { outlinks: authoritativeOutlinks, tags: Array.isArray(meta.tags) ? meta.tags : [] },
      properties: meta.properties || {},
      evidence: Array.isArray(meta.evidence) ? meta.evidence : [],
      lock_hash: "0".repeat(64),
    };

    const computedHash = await computeNodeLockHash(reconstructed);
    reconstructed.lock_hash = computedHash;
    const lockFromDisk: string = meta.lock_hash || "";
    const tampered = lockFromDisk !== "" && lockFromDisk !== computedHash;

    if (!Value.Check(UnifiedNodeSchema, reconstructed)) {
      throw new Error("[HomomorphicCodec] 反序列化數據校驗失敗: " + JSON.stringify([...Value.Errors(UnifiedNodeSchema, reconstructed)]));
    }
    return { node: Object.freeze(reconstructed), tampered, lockFromDisk };
  }

  static extractFrontmatterAndBody(content: string): { frontmatterRaw: string; bodyRaw: string } {
    const trimmed = content.trim();
    if (!trimmed.startsWith(FM_DELIM)) return { frontmatterRaw: "", bodyRaw: trimmed };
    const next = trimmed.indexOf(FM_DELIM, FM_DELIM.length);
    if (next === -1) return { frontmatterRaw: "", bodyRaw: trimmed };
    return { frontmatterRaw: trimmed.slice(FM_DELIM.length, next).trim(), bodyRaw: trimmed.slice(next + FM_DELIM.length).trim() };
  }

  /** Wikilink → 確定性 UUID（SHA-256 衍生，跨端一致） */
  static async resolveTargetUuid(identifier: string): Promise<string> {
    const h = await sha256(identifier);
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
  }

  /** 拓撲權威清單項之最小形狀驗證（完整契約由 UnifiedNodeSchema Value.Check 把關） */
  private static isValidTopologyLink(value: unknown): value is GraphTopologyLink {
    if (typeof value !== "object" || value === null) return false;
    const link = value as Record<string, unknown>;
    return (
      typeof link.target_uuid === "string" &&
      typeof link.wikilink_alias === "string" &&
      typeof link.resolved === "boolean"
    );
  }
}
