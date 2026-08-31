// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// ESG 訂閱式商情偵測系統 - 核心引擎
// 資料位置: src/lib/engines/subscription-engine.ts

import { ALL_SOURCES } from '../../data/esg-sources';

// ============================================================
// 訂閱者檔案
// ============================================================
export interface Subscriber {
  id: string;
  name: string;
  email?: string;
  telegramId?: string;
  subscriptions: Subscription[];
  deliveryPrefs: DeliveryPreference;
  createdAt: string;
}

export interface Subscription {
  id: string;
  type: SubscriptionType;
  target: string;         // 公司名/關鍵字/地區/指標
  sourceGroups?: string[]; // 限定搜尋的來源羣組 A~N
  alertOn: AlertCondition[];
  active: boolean;
}

export type SubscriptionType =
  | 'company'      // 公司/供應商
  | 'keyword'      // 關鍵字
  | 'indicator'    // ESG 指標
  | 'region'       // 地區
  | 'industry'     // 產業
  | 'source';      // 特定資訊來源

export interface AlertCondition {
  event: 'new_content' | 'price_change' | 'policy_update' | 'penalty' | 'filing';
  threshold?: number;       // 變動?值 (如價格波動 > 5%)
  frequency: 'realtime' | 'daily_digest' | 'weekly_digest';
}

export interface DeliveryPreference {
  channel: 'email' | 'telegram' | 'webhook' | 'in_app';
  format: 'summary' | 'full' | 'digest';
  quietHours?: { start: string; end: string }; // 勿擾時段
  language: 'zh-TW' | 'zh-CN' | 'en';
}

// ============================================================
// 偵測到的變動事件
// ============================================================
export interface ChangeEvent {
  id: string;
  sourceId: string;
  sourceName: string;
  eventType: string;
  title: string;
  summary: string;
  url: string;
  relatedTopics: string[];
  relatedCompanies: string[];
  relatedRegions: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  snapshot: string;         // 變動前的快照hash
}

// ============================================================
// 訂閱匹配引擎
// ============================================================
export class SubscriptionEngine {
  private subscribers: Map<string, Subscriber> = new Map();

  // 註冊訂閱者
  addSubscriber(subscriber: Subscriber): void {
    this.subscribers.set(subscriber.id, subscriber);
  }

  // 移除訂閱者
  removeSubscriber(id: string): void {
    this.subscribers.delete(id);
  }

  // 為訂閱者新增訂閱
  addSubscription(subscriberId: string, subscription: Subscription): void {
    const sub = this.subscribers.get(subscriberId);
    if (sub) {
      sub.subscriptions.push(subscription);
    }
  }

  // 核心：將變動事件與所有訂閱者匹配
  matchEvent(event: ChangeEvent): MatchResult[] {
    const results: MatchResult[] = [];

    this.subscribers.forEach((subscriber, _subId) => {
      subscriber.subscriptions.forEach(subscription => {
        if (!subscription.active) return;

        if (this.isMatch(event, subscription, subscriber)) {
          results.push({
            subscriber,
            subscription,
            event,
            relevanceScore: this.calcRelevance(event, subscription),
          });
        }
      });
    });

    // 按相關性分數排序
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  // 判斷事件是否符合訂閱條件
  private isMatch(event: ChangeEvent, sub: Subscription, _subscriber: Subscriber): boolean {
    const target = sub.target.toLowerCase();

    switch (sub.type) {
      case 'company':
        // 事件相關公司名稱符合訂閱目標
        return event.relatedCompanies.some(c => c.toLowerCase().includes(target));

      case 'keyword':
        // 事件標題/摘要/主題包含關鍵字
        return (
          event.title.toLowerCase().includes(target) ||
          event.summary.toLowerCase().includes(target) ||
          event.relatedTopics.some(t => t.toLowerCase().includes(target))
        );

      case 'indicator':
        // 事件類型或主題與 ESG 指標相關
        return event.relatedTopics.some(t => t.toLowerCase().includes(target)) ||
               event.eventType.toLowerCase().includes(target);

      case 'region':
        // 事件相關地區符合
        return event.relatedRegions.some(r => r.toLowerCase().includes(target));

      case 'industry':
        // 該訂閱者的產業相關來源是否包含此事件來源
        return sub.sourceGroups
          ? sub.sourceGroups.some(g => g === this.getSourceGroup(event.sourceId))
          : true;

      case 'source':
        // 事件來自特定來源
        return event.sourceName.toLowerCase().includes(target);

      default:
        return false;
    }
  }

  // 計算相關性分數 (0-100)
  private calcRelevance(event: ChangeEvent, sub: Subscription): number {
    let score = 50; // 基本分

    // 嚴重度加分
    if (event.severity === 'critical') score += 30;
    else if (event.severity === 'high') score += 20;
    else if (event.severity === 'medium') score += 10;

    // 精確匹配加分
    const target = sub.target.toLowerCase();
    if (event.title.toLowerCase().includes(target)) score += 15;
    if (event.relatedTopics.some(t => t.toLowerCase() === target)) score += 10;

    return Math.min(score, 100);
  }

  // 取得來源羣組
  private getSourceGroup(sourceId: string): string {
    const source = ALL_SOURCES.find(s => s.id === sourceId);
    return source?.group || 'Z';
  }

  // 取得訂閱者列表
  getSubscribers(): Subscriber[] {
    return Array.from(this.subscribers.values());
  }
}

export interface MatchResult {
  subscriber: Subscriber;
  subscription: Subscription;
  event: ChangeEvent;
  relevanceScore: number;
}

// ============================================================
// 預設訂閱模板（快速上手）
// ============================================================
export const SUBSCRIPTION_TEMPLATES = {
  semiconductor_watch: {
    name: '半導體產業監測',
    subscriptions: [
      { type: 'industry' as const, target: '半導體', alertOn: [{ event: 'new_content' as const, frequency: 'daily_digest' as const }] },
      { type: 'keyword' as const, target: '晶片', alertOn: [{ event: 'new_content' as const, frequency: 'daily_digest' as const }] },
      { type: 'keyword' as const, target: 'RE100', alertOn: [{ event: 'policy_update' as const, frequency: 'realtime' as const }] },
    ],
    sources: ['A', 'B', 'D'], // UN + 智庫 + 政策執行
  },
  carbon_price: {
    name: '碳價監測',
    subscriptions: [
      { type: 'keyword' as const, target: '碳價', alertOn: [{ event: 'price_change' as const, threshold: 5, frequency: 'realtime' as const }] },
      { type: 'keyword' as const, target: 'CBAM', alertOn: [{ event: 'policy_update' as const, frequency: 'realtime' as const }] },
      { type: 'keyword' as const, target: 'EUA', alertOn: [{ event: 'price_change' as const, threshold: 3, frequency: 'daily_digest' as const }] },
    ],
    sources: ['D', 'E'], // 政策 + 市場價格
  },
  supply_chain_risk: {
    name: '供應鏈風險',
    subscriptions: [
      { type: 'keyword' as const, target: '制裁', alertOn: [{ event: 'policy_update' as const, frequency: 'realtime' as const }] },
      { type: 'keyword' as const, target: 'OFAC', alertOn: [{ event: 'policy_update' as const, frequency: 'realtime' as const }] },
      { type: 'keyword' as const, target: '供應商', alertOn: [{ event: 'penalty' as const, frequency: 'realtime' as const }] },
    ],
    sources: ['F', 'G', 'H'], // 產業治理 + 風險事件 + 地緣供應鏈
  },
  social_enterprise: {
    name: '社創/社企動態',
    subscriptions: [
      { type: 'keyword' as const, target: '社會企業', alertOn: [{ event: 'new_content' as const, frequency: 'weekly_digest' as const }] },
      { type: 'keyword' as const, target: '影響力投資', alertOn: [{ event: 'new_content' as const, frequency: 'weekly_digest' as const }] },
      { type: 'keyword' as const, target: 'B Corp', alertOn: [{ event: 'new_content' as const, frequency: 'weekly_digest' as const }] },
    ],
    sources: ['I', 'J', 'K', 'L', 'M', 'N'],
  },
};

// 匯出單例引擎
export const subscriptionEngine = new SubscriptionEngine();
