"use client";

import { useMemo, useState } from "react";
import type { OmniApiNode } from "@/lib/api";

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g;
const PHASE_FILL: Record<string, string> = {
  ALPHA_ORIGIN_CAPTURE: "#00A896",
  SIGMA_GRAPH_SYNTHESIS: "#0056B3",
  OMEGA_OBJECT_CRYSTAL: "#EEB21B",
};

interface GraphNode {
  id: string;
  label: string;
  phase: string;
  x: number;
  y: number;
  isNote: boolean;
  degree: number;
}

interface GraphEdge {
  from: number;
  to: number;
  kind: "wikilink" | "outlink";
  resolved: boolean;
  alias?: string;
}

function noteToGraphNode(note: OmniApiNode): GraphNode {
  return {
    id: note.uuid,
    label: (note.blocks[0]?.content ?? note.uuid.slice(0, 8)).slice(0, 14),
    phase: note.matrix_phase,
    x: 0,
    y: 0,
    isNote: true,
    degree: 0,
  };
}

/** 拓撲權威：topology.outlinks（引擎維護之雙鏈圖）投影為邊。 */
function collectOutlinkEdges(
  note: OmniApiNode,
  index: Map<string, number>,
  edges: GraphEdge[]
): void {
  const source = index.get(note.uuid);
  if (source === undefined) return;
  for (const link of note.topology.outlinks) {
    const target = index.get(link.target_uuid);
    if (target !== undefined) {
      edges.push({
        from: source,
        to: target,
        kind: "outlink",
        resolved: link.resolved,
        alias: link.wikilink_alias.trim(),
      });
    }
  }
}

/** 內容投影：區塊正文之 [[雙鏈]]（未解析標的收集為懸浮節點）。 */
function collectWikilinkEdges(
  note: OmniApiNode,
  index: Map<string, number>,
  edges: GraphEdge[],
  unresolvedTargets: string[]
): void {
  const source = index.get(note.uuid);
  if (source === undefined) return;
  for (const block of note.blocks) {
    for (const match of block.content.matchAll(WIKILINK_RE)) {
      const target = match[1].trim();
      if (target.length === 0) continue;
      const to = index.get(target);
      if (to !== undefined) {
        edges.push({ from: source, to, kind: "wikilink", resolved: true });
      } else {
        unresolvedTargets.push(target);
      }
    }
  }
}

function appendUnresolvedNodes(
  uniqueTargets: string[],
  nodes: GraphNode[],
  index: Map<string, number>
): void {
  for (const target of uniqueTargets) {
    index.set(target, nodes.length);
    nodes.push({ id: target, label: target.slice(0, 14), phase: "LINK", x: 0, y: 0, isNote: false, degree: 0 });
    // 未解析之鏈結標的無法連回具體節點邊；僅呈現為懸浮節點。
  }
}

/**
 * 確定性力導向佈局（十五期）：環形初始化後迭代彈簧引力（沿邊）、
 * 全對斥力與中心重力收斂；全程無隨機源，同一輸入恆得同一佈局。
 */
function applyForceLayout(nodes: GraphNode[], edges: GraphEdge[]): void {
  const CX = 190;
  const CY = 170;
  const n = nodes.length;
  if (n === 0) return;
  if (n === 1) {
    nodes[0].x = CX;
    nodes[0].y = CY;
    return;
  }

  // 環形初始化
  const R0 = 120;
  for (let i = 0; i < n; i++) {
    nodes[i].x = CX + R0 * Math.cos((2 * Math.PI * i) / n);
    nodes[i].y = CY + R0 * Math.sin((2 * Math.PI * i) / n);
  }

  // 連結度（佈局後半徑分級依據）
  for (const e of edges) {
    nodes[e.from].degree += 1;
    nodes[e.to].degree += 1;
  }

  const REPULSION = 5200;
  const SPRING = 0.04;
  const IDEAL_DIST = 95;
  const GRAVITY = 0.012;
  const MAX_STEP = 14;
  const ITERATIONS = 160;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    xs[i] = nodes[i].x;
    ys[i] = nodes[i].y;
  }
  const fx = new Float64Array(n);
  const fy = new Float64Array(n);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    fx.fill(0);
    fy.fill(0);
    // 全對斥力（庫倫）
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = xs[i] - xs[j];
        const dy = ys[i] - ys[j];
        const d2 = Math.max(dx * dx + dy * dy, 16);
        const f = REPULSION / d2;
        const d = Math.sqrt(d2);
        const ux = dx / d;
        const uy = dy / d;
        fx[i] += ux * f;
        fy[i] += uy * f;
        fx[j] -= ux * f;
        fy[j] -= uy * f;
      }
    }
    // 沿邊彈簧引力（掛鉤定律，理想距離 IDEAL_DIST）
    for (const e of edges) {
      const dx = xs[e.to] - xs[e.from];
      const dy = ys[e.to] - ys[e.from];
      const d = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const f = SPRING * (d - IDEAL_DIST);
      const ux = dx / d;
      const uy = dy / d;
      fx[e.from] += ux * f;
      fy[e.from] += uy * f;
      fx[e.to] -= ux * f;
      fy[e.to] -= uy * f;
    }
    // 中心重力（防止發散逸出畫布）
    for (let i = 0; i < n; i++) {
      fx[i] += (CX - xs[i]) * GRAVITY;
      fy[i] += (CY - ys[i]) * GRAVITY;
    }
    // 阻尼積分（步幅截斷避免震盪發散）
    for (let i = 0; i < n; i++) {
      xs[i] += Math.max(-MAX_STEP, Math.min(MAX_STEP, fx[i] * 0.05));
      ys[i] += Math.max(-MAX_STEP, Math.min(MAX_STEP, fy[i] * 0.05));
    }
  }

  // 邊界調適：按最終包絡等比縮放並平移回 viewBox（380×340，留 30 邊距）
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < n; i++) {
    minX = Math.min(minX, xs[i]);
    maxX = Math.max(maxX, xs[i]);
    minY = Math.min(minY, ys[i]);
    maxY = Math.max(maxY, ys[i]);
  }
  const spanX = Math.max(maxX - minX, 1);
  const spanY = Math.max(maxY - minY, 1);
  const scale = Math.min(320 / spanX, 280 / spanY);
  for (let i = 0; i < n; i++) {
    nodes[i].x = Math.round(30 + (xs[i] - minX) * scale + (320 - spanX * scale) / 2);
    nodes[i].y = Math.round(30 + (ys[i] - minY) * scale + (280 - spanY * scale) / 2);
  }
}

/** 由全部筆記之區塊內容解析 [[雙鏈]]，組裝確定性力導向圖譜。 */
export function buildFusionGraph(notes: OmniApiNode[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const index = new Map<string, number>();
  const unresolvedTargets: string[] = [];

  for (const note of notes) {
    index.set(note.uuid, nodes.length);
    nodes.push(noteToGraphNode(note));
  }
  for (const note of notes) {
    collectOutlinkEdges(note, index, edges);
    collectWikilinkEdges(note, index, edges, unresolvedTargets);
  }
  appendUnresolvedNodes([...new Set(unresolvedTargets)], nodes, index);
  applyForceLayout(nodes, edges);
  return { nodes, edges };
}

export function FusionGraph({
  notes,
  onSelect,
}: {
  notes: OmniApiNode[];
  onSelect: (uuid: string) => void;
}) {
  const graph = useMemo(() => buildFusionGraph(notes), [notes]);
  const [hovered, setHovered] = useState<number | null>(null);

  /** 鄰接表：節點索引 → 相鄰節點索引集合（十八期懸停聚焦依據）。 */
  const neighbors = useMemo(() => {
    const adj: Set<number>[] = graph.nodes.map(() => new Set<number>());
    for (const e of graph.edges) {
      adj[e.from]?.add(e.to);
      adj[e.to]?.add(e.from);
    }
    return adj;
  }, [graph]);

  const isEdgeActive = (i: number): boolean => {
    if (hovered === null) return true;
    const e = graph.edges[i];
    if (e === undefined) return false;
    return e.from === hovered || e.to === hovered;
  };

  const isNodeActive = (i: number): boolean => {
    if (hovered === null) return true;
    return i === hovered || (neighbors[hovered]?.has(i) ?? false);
  };

  return (
    <div className="glass p-5">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200">
        雙鏈熔合圖譜（{graph.nodes.length} 節點 · {graph.edges.length} 鏈結）
      </h2>
      <p className="mt-1 text-[10px] text-slate-500">
        實線=拓撲 outlinks（未解析虛線，邊中點標示 wikilink 別名）· 灰線=內容 [[雙鏈]] 投影 · 力導向佈局（連結越多半徑越大）
      </p>
      {graph.nodes.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">尚無節點可繪製。</p>
      ) : (
        <svg viewBox="0 0 380 340" className="mt-3 h-72 w-full">
          {graph.edges.map((e, i) => {
            const a = graph.nodes[e.from];
            const b = graph.nodes[e.to];
            const alias = e.alias ?? "";
            const mx = Math.round((a.x + b.x) / 2);
            const my = Math.round((a.y + b.y) / 2);
            const active = isEdgeActive(i);
            return (
              <g key={i} className="transition-opacity" opacity={active ? 1 : 0.12}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={e.kind === "outlink" ? "rgba(0,168,150,0.55)" : "rgba(148,163,184,0.35)"}
                  strokeWidth={e.kind === "outlink" ? 1.8 : 1.2}
                  strokeDasharray={e.resolved ? undefined : "4 3"}
                >
                  <title>
                    {e.kind === "outlink" && alias.length > 0
                      ? `雙鏈別名：${alias}（${a.label} → ${b.label}）`
                      : `${a.label} → ${b.label}`}
                  </title>
                </line>
                {e.kind === "outlink" && alias.length > 0 && (
                  <text
                    x={mx}
                    y={my - 3}
                    textAnchor="middle"
                    fontSize={7}
                    fill="rgba(0,168,150,0.85)"
                  >
                    {alias.length > 12 ? `${alias.slice(0, 12)}…` : alias}
                  </text>
                )}
              </g>
            );
          })}
          {graph.nodes.map((node, i) => {
            const active = isNodeActive(i);
            return (
            <g
              key={node.id}
              className={`transition-opacity${node.isNote ? " cursor-pointer" : ""}`}
              opacity={active ? 1 : 0.18}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(i)}
              onBlur={() => setHovered(null)}
              tabIndex={node.isNote ? 0 : -1}
              aria-label={`${node.label}，${node.degree} 鏈結${node.isNote ? "" : "（未解析懸浮鏈結）"}`}
              onClick={() => {
                if (node.isNote) onSelect(node.id);
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.isNote ? 9 + Math.min(6, node.degree) : 6}
                fill={PHASE_FILL[node.phase] ?? "#64748b"}
                opacity={node.isNote ? 0.95 : 0.5}
                stroke={active && hovered === i ? "rgba(226,232,240,0.9)" : undefined}
                strokeWidth={active && hovered === i ? 1.5 : undefined}
              >
                <title>
                  {`${node.label}（${node.degree} 鏈結）`}
                </title>
              </circle>
              <text
                x={node.x}
                y={node.y + (node.isNote ? 9 + Math.min(6, node.degree) : 6) + 10}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(226,232,240,0.75)"
              >
                {node.label}
              </text>
            </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
