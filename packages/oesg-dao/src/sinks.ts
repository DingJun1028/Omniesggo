/**
 * OESG-DAO 寫出埠
 * - createMemoryDaoSink: 記憶體留痕 (測試/單機場景)
 * - createNcbDaoSink: NCB (Next-Cloud-Bridge) 轉發
 */
import type { DaoAction, DaoSink } from './types';

/** 記憶體寫出埠: 供測試與單機結晶場景 */
export function createMemoryDaoSink(): DaoSink & {
  actions(): readonly Readonly<DaoAction>[];
} {
  const stored: DaoAction[] = [];
  return {
    id: 'memory-dao-sink',
    async write(action: Readonly<DaoAction>) {
      stored.push({ ...action });
    },
    actions() {
      return stored.map((a) => Object.freeze({ ...a }));
    },
  };
}

/** NCB 轉發寫出埠: 治理動作推送至 NCB 通道 (與前三站對稱) */
export function createNcbDaoSink(publish: (action: Readonly<DaoAction>) => Promise<void>): DaoSink {
  return {
    id: 'ncb-dao-sink',
    async write(action: Readonly<DaoAction>) {
      await publish(action);
    },
  };
}
