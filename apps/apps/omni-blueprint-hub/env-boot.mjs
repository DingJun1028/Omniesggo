// 副作用模組：在任何其他模組讀取 process.env 之前載入 .env
// ESM import 為 hoisted，故必須以獨立模組置於 import 串首行
import { loadEnv } from './env.mjs';
export const ENV_INFO = loadEnv();
