/**
 * ToolTrustGate — 工具權限三清單 × Trust Label trustGate 接線 (PR #121 後續)
 *
 * 裁決規則 (雙閘 AND, fail-closed):
 *   1. 清單閘 (tri-mode toolPermission, deny 優先): deny → deny; 未列冊 → deny;
 *      require_approval 為人工程序, 信任不可越權替代, 恒保持 require_approval。
 *   2. 信任閘 (omni-core trustGate): allow 清單之工具仍須達到當前化身模式之
 *      必要信任等級, 不足者降級為 require_approval (allow ≠ 免檢)。
 *      預設門檻: Companion/CommandGrid ≥ medium (0.85), Phantom ≥ high (0.95)
 *      (無頭後台自主執行風險較高, 門檻從嚴)。
 *
 * invokeTrusted: 裁決非 allow 即拒絕執行 OmniAPI 符文 (fail-closed),
 * 與 OAG 神聖契約、mcp-gateway default-deny 同一哲學。
 */
import { trustGate, trustScore, type TrustLevel } from '@esggo/omni-core';
import type { OmniAPI } from './api';
import type { AvatarMode, OmniAvatarCore, ToolPermissionDecision } from './tri-mode';
import { OmniArchError } from './types';

/** 各化身模式之必要信任等級 (allow 清單通過後仍須達標) */
export const REQUIRED_TRUST_BY_MODE: Readonly<Record<AvatarMode, TrustLevel>> = Object.freeze({
  Companion: 'medium',
  CommandGrid: 'medium',
  Phantom: 'high',
});

/** 信任感知之工具權限裁決: 清單閘 AND 信任閘 */
export function trustAwareToolPermission(
  avatar: OmniAvatarCore,
  tool: string,
  trustLevel: string
): ToolPermissionDecision {
  const listVerdict = avatar.toolPermission(tool);
  if (listVerdict === 'deny') return 'deny';
  if (listVerdict === 'require_approval') return 'require_approval';
  const required = REQUIRED_TRUST_BY_MODE[avatar.currentMode()];
  return trustGate(trustScore(trustLevel), required) ? 'allow' : 'require_approval';
}

/** 受控符文執行: 裁決非 allow 一律拒絕 (fail-closed), 通過才走 OmniAPI.invoke */
export async function invokeTrusted<A, R>(
  avatar: OmniAvatarCore,
  api: OmniAPI,
  options: {
    readonly tool: string;
    readonly rune: string;
    readonly trustLevel: string;
    readonly args: A;
  }
): Promise<Readonly<R>> {
  const decision = trustAwareToolPermission(avatar, options.tool, options.trustLevel);
  if (decision !== 'allow') {
    throw new OmniArchError(
      'E_TOOL_PERMISSION_DENIED',
      `工具 ${options.tool} 裁決為 ${decision}, 拒絕執行符文 ${options.rune} (fail-closed)`
    );
  }
  return await api.invoke<A, R>(options.rune, options.args);
}
