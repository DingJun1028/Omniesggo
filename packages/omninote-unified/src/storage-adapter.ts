/**
 * ============================================================================
 * OmniStorageAdapter — IStorageDriver 抽象 × 雙軌驅動
 * 瀏覽器：File System Access API + IndexedDB；Node/CLI：NodeFileSystemDriver（node:fs）
 * ============================================================================
 */
import type { UnifiedNode } from "./core-types.js";
import { LocalMarkdownHomomorphicCodec, type FileSystemArtifact } from "./codec.js";

export interface IStorageDriver {
  read(nodeUuid: string): Promise<UnifiedNode | null>;
  write(node: Readonly<UnifiedNode>): Promise<void>;
  delete(nodeUuid: string): Promise<void>;
  listUuids(): Promise<string[]>;
}

/** Node 環境驅動：以 node:fs 落地「檔案系統即資料庫」 */
export class NodeFileSystemDriver implements IStorageDriver {
  constructor(private readonly rootDir: string) {}

  private artifactPath(artifact: FileSystemArtifact): string {
    return `${this.rootDir}/${artifact.relativePath}`;
  }

  async write(node: Readonly<UnifiedNode>): Promise<void> {
    const { mkdir, writeFile, readdir, readFile, rm } = await import("node:fs/promises");
    await mkdir(this.rootDir + "/attachments", { recursive: true });
    const artifact = await LocalMarkdownHomomorphicCodec.serialize(node);
    await writeFile(this.artifactPath(artifact), artifact.markdownFileContent, "utf-8");
    for (const svg of artifact.attachmentSvgs) {
      await writeFile(`${this.rootDir}/${svg.filename}`, svg.svgContent, "utf-8");
    }
    // 同一節點因 matrix_phase／entity_type 變化可能殘留舊檔名：寫入後清理同 uuid 之過時檔案，
    // 否則 read() 將依目錄順序誤讀舊版本（檔案系統即資料庫之單調不變量）。
    const short = node.uuid.slice(0, 8);
    for (const f of await readdir(this.rootDir)) {
      if (!f.endsWith(".md") || !f.includes(short) || f === artifact.relativePath) continue;
      try {
        const content = await readFile(`${this.rootDir}/${f}`, "utf-8");
        const { extractFrontmatterAndBody } = LocalMarkdownHomomorphicCodec;
        const { frontmatterRaw } = extractFrontmatterAndBody(content);
        const meta = JSON.parse(frontmatterRaw || "{}");
        if (meta.omni_uuid === node.uuid) await rm(`${this.rootDir}/${f}`);
      } catch { /* 略過無法解析之檔案 */ }
    }
  }

  async read(nodeUuid: string): Promise<UnifiedNode | null> {
    const { readdir, readFile } = await import("node:fs/promises");
    try {
      const short = nodeUuid.slice(0, 8);
      const files = await readdir(this.rootDir);
      const target = files.find((f) => f.includes(short) && f.endsWith(".md"));
      if (!target) return null;
      const content = await readFile(`${this.rootDir}/${target}`, "utf-8");
      const resolver = async (rel: string) => {
        try { return await readFile(`${this.rootDir}/${rel}`, "utf-8"); } catch { return null; }
      };
      const { node } = await LocalMarkdownHomomorphicCodec.deserialize(content, resolver);
      return node as UnifiedNode;
    } catch {
      return null;
    }
  }

  async delete(nodeUuid: string): Promise<void> {
    const { readdir, rm } = await import("node:fs/promises");
    const short = nodeUuid.slice(0, 8);
    for (const f of await readdir(this.rootDir)) {
      if (f.includes(short) && f.endsWith(".md")) { await rm(`${this.rootDir}/${f}`); return; }
    }
  }

  async listUuids(): Promise<string[]> {
    const { readdir, readFile } = await import("node:fs/promises");
    const uuids: string[] = [];
    for (const f of await readdir(this.rootDir)) {
      if (!f.endsWith(".md")) continue;
      try {
        const content = await readFile(`${this.rootDir}/${f}`, "utf-8");
        const { extractFrontmatterAndBody } = LocalMarkdownHomomorphicCodec;
        const { frontmatterRaw } = extractFrontmatterAndBody(content);
        const meta = JSON.parse(frontmatterRaw || "{}");
        if (typeof meta.omni_uuid === "string") uuids.push(meta.omni_uuid);
      } catch { /* 略過無法解析之檔案 */ }
    }
    return uuids;
  }
}

/** 瀏覽器驅動：IndexedDB 以 canonical JSON 快取整節點（離線即用） */
export class IndexedDBDriver implements IStorageDriver {
  constructor(
    private readonly dbName = "omninote-unified",
    private readonly storeName = "nodes"
  ) {}

  private async openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") { reject(new Error("[IndexedDBDriver] 瀏覽器環境限定")); return; }
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(this.storeName)) req.result.createObjectStore(this.storeName, { keyPath: "uuid" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.openDb();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(this.storeName, mode);
      const req = run(tx.objectStore(this.storeName));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  async write(node: Readonly<UnifiedNode>): Promise<void> {
    await this.tx("readwrite", (store) => store.put(JSON.parse(JSON.stringify(node))));
  }

  async read(nodeUuid: string): Promise<UnifiedNode | null> {
    const found = await this.tx("readonly", (store) => store.get(nodeUuid));
    return (found as UnifiedNode | undefined) ?? null;
  }

  async delete(nodeUuid: string): Promise<void> {
    await this.tx("readwrite", (store) => store.delete(nodeUuid));
  }

  async listUuids(): Promise<string[]> {
    const keys = await this.tx("readonly", (store) => store.getAllKeys() as unknown as IDBRequest<IDBValidKey[]>);
    return keys.map((k) => String(k));
  }
}

/** 統一轉接器：依執行環境自動擇軌（Node → 檔案系統；瀏覽器 → IndexedDB） */
export class OmniStorageAdapter {
  private constructor(public readonly driver: IStorageDriver) {}

  static async selectDriver(rootDir?: string): Promise<OmniStorageAdapter> {
    const isNode = typeof process !== "undefined" && Boolean(process.versions?.node) && typeof indexedDB === "undefined";
    if (isNode && rootDir) return new OmniStorageAdapter(new NodeFileSystemDriver(rootDir));
    return new OmniStorageAdapter(new IndexedDBDriver());
  }

  read(nodeUuid: string): Promise<UnifiedNode | null> { return this.driver.read(nodeUuid); }
  write(node: Readonly<UnifiedNode>): Promise<void> { return this.driver.write(node); }
  delete(nodeUuid: string): Promise<void> { return this.driver.delete(nodeUuid); }
  listUuids(): Promise<string[]> { return this.driver.listUuids(); }
}
