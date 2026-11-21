import { WithOmniHeart } from "../core/omni-linter";

type SentientEvent = 
  | { type: 'DATA_SEALED', payload: WithOmniHeart<any> }
  | { type: 'ANOMALY_DETECTED', payload: { id: string; msg: string } }
  | { type: 'SME_PROGRESS', payload: { task: string; progress: number } };

type Listener = (event: SentientEvent) => void;

/**
 * 【通 Transferrful】感知總線
 * 負責跨組件的非同步狀態流轉與 AI 喚醒
 */
class SentientBus {
  private listeners: Listener[] = [];

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  emit(event: SentientEvent) {
    this.listeners.forEach(fn => fn(event));
  }
}

export const sentientBus = new SentientBus();
