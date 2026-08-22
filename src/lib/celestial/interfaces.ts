// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
 
export interface IComponentCore {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
  };
}

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
