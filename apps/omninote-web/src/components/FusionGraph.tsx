"use client";

import { useMemo } from "react";
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
}

interface GraphEdge {
  from: number;
  to: number;
  kind: "wikilink" | "outlink";
  resolved: boolean;
}

function noteToGraphNode(note: OmniApiNode): GraphNode {
  return {
    id: note.uuid,
    label: (note.blocks[0]?.content ?? note.uuid.slice(0, 8)).slice(0, 14),
    phase: note.matrix_phase,
    x: 0,
    y: 0,
    isNote: true,
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
      edges.push({ from: source, to: target, kind: "outlink", resolved: link.resolved });
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
    nodes.push({ id: target, label: target.slice(0, 14), phase: "LINK", x: 0, y: 0, isNote: false });
    // 未解析之鏈結標的無法連回具體節點邊；僅呈現為懸浮節點。
  }
}

function applyCircularLayout(nodes: GraphNode[]): void {
  const R = 150;
  const CX = 190;
  const CY = 170;
  const n = nodes.length;
  if (n === 0) return;
  if (n === 1) {
    nodes[0].x = CX;
    nodes[0].y = CY;
    return;
  }
  for (let i = 0; i < n; i++) {
    nodes[i].x = Math.round(CX + R * Math.cos((2 * Math.PI * i) / n));
    nodes[i].y = Math.round(CY + R * Math.sin((2 * Math.PI * i) / n));
  }
}

/** 由全部筆記之區塊內容解析 [[雙鏈]]，組裝環形佈局圖譜。 */
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
  applyCircularLayout(nodes);
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

  return (
    <div className="glass p-5">
      <h2 className="text-sm font-semibold tracking-wide text-slate-200">
        雙鏈熔合圖譜（{graph.nodes.length} 節點 · {graph.edges.length} 鏈結）
      </h2>
      <p className="mt-1 text-[10px] text-slate-500">
        實線=拓撲 outlinks（未解析虛線）· 灰線=內容 [[雙鏈]] 投影
      </p>
      {graph.nodes.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">尚無節點可繪製。</p>
      ) : (
        <svg viewBox="0 0 380 340" className="mt-3 h-72 w-full">
          {graph.edges.map((e, i) => {
            const a = graph.nodes[e.from];
            const b = graph.nodes[e.to];
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={e.kind === "outlink" ? "rgba(0,168,150,0.55)" : "rgba(148,163,184,0.35)"}
                strokeWidth={e.kind === "outlink" ? 1.8 : 1.2}
                strokeDasharray={e.resolved ? undefined : "4 3"}
              />
            );
          })}
          {graph.nodes.map((node) => (
            <g
              key={node.id}
              className={node.isNote ? "cursor-pointer" : ""}
              onClick={() => {
                if (node.isNote) onSelect(node.id);
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.isNote ? 10 : 6}
                fill={PHASE_FILL[node.phase] ?? "#64748b"}
                opacity={node.isNote ? 0.95 : 0.5}
              />
              <text
                x={node.x}
                y={node.y + 22}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(226,232,240,0.75)"
              >
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
