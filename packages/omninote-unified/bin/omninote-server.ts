/**
 * ============================================================================
 * omninote-server — OmniNote 本機 API 伺服器 CLI 入口
 * 用法：node --experimental-transform-types bin/omninote-server.ts [rootDir]
 * 環境變數：OMNINOTE_HOME（預設儲存根目錄）、OMNINOTE_PORT（預設 52710）、
 *           OMNINOTE_TOKEN（選用 Bearer Token）、OMNINOTE_EMBED=1（啟用零算力嵌入）
 * ============================================================================
 */
import { OmniNoteLocalApiServer } from "../src/api-server.js";
import { ZeroComputeEmbedder } from "../src/ollama-embedder.js";

const rootDir = process.argv[2] ?? process.env.OMNINOTE_HOME ?? ".";
const port = Number(process.env.OMNINOTE_PORT ?? "52710");
const token = process.env.OMNINOTE_TOKEN;
const embedder = process.env.OMNINOTE_EMBED === "1" ? new ZeroComputeEmbedder() : undefined;

const server = new OmniNoteLocalApiServer({ rootDir, port, host: "127.0.0.1", token, embedder });
const addr = await server.listen();
console.log("[omninote] API 就緒：http://" + addr.host + ":" + String(addr.port) + "（回環限定）root=" + rootDir);
