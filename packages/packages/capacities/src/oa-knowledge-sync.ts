/**
 * OA-Team 知識花園 ↔ Capacities 同步骨架
 *
 * 設計目標（對齊 oa-team-soul-canon §18 知識花園 + §19 決策樹）：
 *  - Capacities 作為外部知識源 / 雙蜂隊共享記憶備援層
 *  - 本模組定義「雙向增量同步」介面，不實際連線（需 token 由環境注入）
 *
 * 5T 對應：
 *  - Traceable: 每條同步紀錄帶 source_origin
 *  - Trackable: 同步日誌可追蹤
 *  - Transparent: 衝突公開標記，不靜默覆蓋
 *  - Trustworthy: 本地落盤前 Object.freeze()
 */

import { CapacitiesClient } from "./client";

/** OA 知識花園條目（最小結構） */
export interface OAKnowledgeEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  sourceOrigin: string; // 5T: 溯源
  updatedAt: string;
}

/** 同步方向 */
export type SyncDirection = "capacities→oa" | "oa→capacities" | "bidirectional";

export interface SyncResult {
  direction: SyncDirection;
  pulled: number;
  pushed: number;
  conflicts: string[]; // 5T: 衝突公開標記
  errors: string[];
}

/**
 * 從 Capacities 拉取條目（需 api:read scope）
 * 骨架：實際欄位對映依 Capacities object schema 調整。
 */
export async function pullFromCapacities(
  client: CapacitiesClient,
  filter?: { type?: string },
): Promise<OAKnowledgeEntry[]> {
  const raw = (await client.listObjects({ type: filter?.type })) as Array<{
    id: string;
    title?: string;
    markdown?: string;
    tags?: string[];
  }>;
  return raw.map((o) => ({
    id: o.id,
    title: o.title ?? "(untitled)",
    body: o.markdown ?? "",
    tags: o.tags ?? [],
    sourceOrigin: "capacities",
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * 推送 OA 條目到 Capacities（需 api:write scope）
 * 骨架：實際 payload 依 Capacities create API 調整。
 */
export async function pushToCapacities(
  client: CapacitiesClient,
  entries: OAKnowledgeEntry[],
): Promise<number> {
  let pushed = 0;
  for (const e of entries) {
    await client.createObject({
      title: e.title,
      markdown: e.body,
      tags: e.tags,
      source_origin: e.sourceOrigin,
    });
    pushed++;
  }
  return pushed;
}

/**
 * 雙向增量同步（骨架）
 * 實際衝突解決策略待 OA 知識花園 schema 確定後補齊。
 */
export async function syncKnowledgeGarden(
  client: CapacitiesClient,
  localEntries: OAKnowledgeEntry[],
  direction: SyncDirection = "bidirectional",
): Promise<SyncResult> {
  const result: SyncResult = {
    direction,
    pulled: 0,
    pushed: 0,
    conflicts: [],
    errors: [],
  };

  if (direction === "capacities→oa" || direction === "bidirectional") {
    try {
      const remote = await pullFromCapacities(client);
      result.pulled = remote.length;
      // 衝突檢測：同 id 不同 updatedAt → 標記，不靜默覆蓋
      for (const r of remote) {
        const local = localEntries.find((l) => l.id === r.id);
        if (local && local.updatedAt !== r.updatedAt) {
          result.conflicts.push(r.id);
        }
      }
    } catch (err) {
      result.errors.push(String(err));
    }
  }

  if (direction === "oa→capacities" || direction === "bidirectional") {
    try {
      result.pushed = await pushToCapacities(client, localEntries);
    } catch (err) {
      result.errors.push(String(err));
    }
  }

  return Object.freeze(result); // 5T: Trustworthy 凍結
}
