/**
 * src/lib/omnitag-registry-file.ts — §20.6 檔案持久化後端（Node 環境）
 *
 * 對齊 cli/oa-cli/src/omnitag.ts OmniTagRegistry 同構，但採 ArtifactStore 介面，
 * 供 FiveTOmniTagGate.setStore() 在 Node 環境注入。
 *
 * 本模組為 Node-only：靜態 import node:fs / node:path。
 * 禁止被瀏覽器套件（five-t-protocol.ts 等）靜態匯入，使用者需自行在 Node 端
 * 動態或顯式匯入本檔後呼叫 FiveTOmniTagGate.setStore(new FileArtifactStore())。
 *
 * [agent:25][squad:5T驗算][lifecycle:active][p2][platform:esggo][best-practice:结界]
 */

import { mkdirSync, existsSync, readFileSync, appendFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { ArtifactStore, PersistedArtifact } from './five-t-protocol';

export interface FileStoreOptions {
  /** 持久化路徑；預設專案本地 .oa/omnitag-registry.jsonl */
  path?: string;
}

/**
 * 檔案持久化後端：append-only JSONL（同步 API，對齊 ArtifactStore 介面）。
 */
export class FileArtifactStore implements ArtifactStore {
  private _path: string;

  constructor(opts: FileStoreOptions = {}) {
    this._path = opts.path ?? '.oa/omnitag-registry.jsonl';
    mkdirSync(dirname(this._path), { recursive: true });
  }

  private _readLines(): string[] {
    if (!existsSync(this._path)) return [];
    return readFileSync(this._path, 'utf8')
      .split('\n')
      .filter((l: string) => l.trim().length > 0);
  }

  write(record: PersistedArtifact): void {
    appendFileSync(this._path, JSON.stringify(record) + '\n', 'utf8');
  }

  read(entityId: string): PersistedArtifact | null {
    for (const line of this._readLines()) {
      try {
        const rec = JSON.parse(line) as PersistedArtifact;
        if (rec.entityId === entityId) return rec;
      } catch {
        // 跳過毀損行
      }
    }
    return null;
  }

  list(): PersistedArtifact[] {
    const out: PersistedArtifact[] = [];
    for (const line of this._readLines()) {
      try {
        out.push(JSON.parse(line) as PersistedArtifact);
      } catch {
        // 跳過毀損行
      }
    }
    return out;
  }
}
