import { AdkSquadFactory } from '../services/adk/adk-squad-factory';
import { ARVO_WINGS_APOSTLES } from './arvo-wings';
import { APOSTLE_RUNE_MAP } from './rune-registry';

/**
 * 初始化 ARVO 左翼使徒代理小組
 */
export function initArvoApostleAgents() {
  ARVO_WINGS_APOSTLES.forEach(apostle => {
    const rune = APOSTLE_RUNE_MAP[apostle.id];
    const tools = rune ? [AdkSquadFactory.registerRuneAsTool(rune)] : [];

    apostle.agent = AdkSquadFactory.createAgent({
      name: `Apostle_${apostle.id.replace('-', '_')}`,
      description: apostle.description,
      instruction: `你代表 ARVO 左翼使徒中的「${apostle.name}」(${apostle.nameEn})。
      你的職責是：${apostle.role}
      你的使命宣言(Mandate)：${apostle.mandate}
      你屬於「${apostle.cluster}」集群，掌握奧義：「${apostle.arcane}」。
      執行任務時必須嚴格遵守 5T 協議中的：${apostle.pillars.join('、')}。
      ${rune ? `你配備了專屬符文工具：${rune.name}，請在合適時機調用它來完成任務。` : ''}`,
      tools: tools,
    });
  });
}
