import type { IComponentCore } from '../../types/core-contract';
// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
 
/**
 * 萬能元件心核 - 觀因循果修復版
 * 確保數據從因到果的完整性與不可篡改性
 */
// ts-matrix: 收斂至規範型別 (canonical: src/types/core-contract)
export type { IComponentCore };

export interface IWuZuoMiaoDe extends IComponentCore {
  // 核心狀態機
  state: "Awakened" | "Repairing" | "Calibrating" | "Stable";
  
  // 圓通無礙：流轉控制
  stream: <T>(data: T) => void;
  
  // 無作妙德：自發治理
  governance: {
    seal: <T>(data: T) => Readonly<T>;
    purify: (entropyLevel: number) => void;
  };
}

export interface InputData {
  payload: unknown;
  origin: string;
}
