/**
 * OmniTheme — 萬能主題 (橫向頂層)
 *
 * 三視覺狀態: LiquidGlass（液態玻璃）/ MartialLock（戒嚴防護色）/
 * CelestialGlow（輝煌）。戒嚴期間全域 UI 強制切換 MartialLock,
 * 解鎖前任何 set 皆被防護色覆寫 (安全感回饋)。
 */
import { OmniArchError } from './types';
import type { ThemeState } from './types';

const THEME_STATES: readonly ThemeState[] = ['LiquidGlass', 'MartialLock', 'CelestialGlow'];

export class OmniTheme {
  private state: ThemeState = 'LiquidGlass';
  private readonly lockProvider: () => boolean;

  constructor(lockProvider: () => boolean) {
    this.lockProvider = lockProvider;
  }

  set(next: ThemeState): ThemeState {
    if (!THEME_STATES.includes(next)) {
      throw new OmniArchError('E_THEME_UNKNOWN', `未知主題狀態 ${next}`);
    }
    this.state = this.lockProvider() ? 'MartialLock' : next;
    return this.state;
  }

  current(): ThemeState {
    return this.lockProvider() ? 'MartialLock' : this.state;
  }
}