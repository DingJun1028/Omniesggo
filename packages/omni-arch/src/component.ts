/**
 * OmniComponent — UI 載體 (維度二: 邊界實體語義)
 *
 * 液態玻璃視覺的元件描述契約: UI 無關 (不綁定 React), 以描述子 +
 * 視覺狀態 + 特效表達, 交由任何前端框架渲染。描述子經 deepFreeze 不可篡改。
 */
import { createComponentCore, deepFreeze, sealComponentCore, type IComponentCore } from '@esggo/omni-core';
import type { ThemeState } from './types';

export type ComponentEffect = 'ripple' | 'freeze' | 'glow';

export interface ComponentDescriptor extends IComponentCore {
  readonly kind: string;
  readonly props: Record<string, unknown>;
  readonly theme: ThemeState;
  readonly effect: ComponentEffect;
}

export class OmniComponent {
  async describe(
    kind: string,
    props: Record<string, unknown>,
    options: Partial<Pick<ComponentDescriptor, 'theme' | 'effect'>> = {}
  ): Promise<Readonly<ComponentDescriptor>> {
    const core = createComponentCore('omni-arch://omni-component');
    const descriptor: ComponentDescriptor = {
      ...core,
      kind,
      props: deepFreeze({ ...props }),
      theme: options.theme ?? 'LiquidGlass',
      effect: options.effect ?? 'ripple',
    };
    return (await sealComponentCore(descriptor)) as Readonly<ComponentDescriptor>;
  }
}