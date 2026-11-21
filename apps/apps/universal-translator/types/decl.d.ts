// 雙向 TS 終始矩陣 — 本地模組宣告 (補齊第三方 .d.ts 缺口)
// ws 在 pnpm 隔離 node_modules 下 tsc 找不到型別，此處最小宣告以通過 strict 檢查
declare module 'ws' {
  import { EventEmitter } from 'node:events';
  import { Server as HttpServer } from 'node:http';
  export class WebSocketServer extends EventEmitter {
    constructor(options: { server?: HttpServer; path?: string });
    on(event: 'connection', listener: (ws: any, req?: any) => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    close(cb?: (err?: Error) => void): void;
  }
}
