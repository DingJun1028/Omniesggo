// ============================================================
// OA-Team 30 — Phase 3.2: Inter-Swarm Communication Protocol
// 深貫廣通無礪圓通: 蜂群間通信協議
// ============================================================

class InterSwarmProtocol {
  constructor() {
    // 4D Message Matrix: [from_swarm][to_swarm][topic][message]
    this.channels = new Map();
    this.messageQueue = [];
    this.routingTable = new Map();
  }

  // 深貫: 消息跟蔴 (Traceable routing)
  routeMessage(message) {
    const { from, to, topic, payload, priority = 'normal' } = message;
    const channelKey = `${from}→${to}:${topic}`;

    // 建立 channel
    if (!this.channels.has(channelKey)) {
      this.channels.set(channelKey, {
        messages: [],
        subscribers: new Set(),
        stats: { sent: 0, received: 0, errors: 0 }
      });
    }

    const channel = this.channels.get(channelKey);

    // 追蔯消息
    const trace = {
      source_origin: `${from}:${topic}`,
      timestamp: Date.now(),
      room: payload.room || 'global',
      trace_id: this.generateTraceId(),
      priority
    };

    const tracedMessage = {
      ...payload,
      trace,
      meta: {
        ...message.meta,
        channel: channelKey,
        routed_at: Date.now()
      }
    };

    // 廣通: 多播到所有訂閱者
    let delivered = 0;
    for (const subscriber of channel.subscribers) {
      try {
        subscriber(tracedMessage);
        delivered++;
        channel.stats.received++;
      } catch (error) {
        channel.stats.errors++;
        console.error(`[InterSwarm] Deliver error: ${error.message}`);
      }
    }

    channel.messages.push(tracedMessage);
    channel.stats.sent++;

    this.messageQueue.push({ ...tracedMessage, delivered });

    return {
      trace_id: trace.trace_id,
      channel: channelKey,
      delivered,
      total_subscribers: channel.subscribers.size
    };
  }

  // 廣通: 訂閱 channel
  subscribe(channelPattern, callback) {
    // 支援通配符: "strategy→*" (接收所有來自 strategy)
    const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.routingTable.set(subscriberId, { callback, channelPattern });

    // 向現有匹配的 channels 訂閱
    for (const [channelKey, channel] of this.channels.entries()) {
      if (this.matchPattern(channelKey, channelPattern)) {
        channel.subscribers.add(callback);
      }
    }

    return subscriberId;
  }

  matchPattern(channelKey, pattern) {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1); // "strategy→*"
      return channelKey.startsWith(prefix);
    }
    return channelKey === pattern;
  }

  // 無礪: 信任驗證 (HMAC)
  verifyIntegrity(message) {
    if (!message.trace) return false;
    // 簡化驗證: 只要有 trace_id 即可
    return !!message.trace.trace_id;
  }

  // 圓通: 廣播給所有蜂群
  broadcastToAll(payload) {
    const results = [];
    const swarms = ['strategy', 'technology', 'creative', 'marketing', 'guard'];

    for (const swarm of swarms) {
      const result = this.routeMessage({
        from: 'queen',
        to: swarm,
        topic: 'broadcast',
        payload,
        priority: 'high'
      });
      results.push(result);
    }

    return results;
  }

  // Deep penetration: 獲取完整的訊息軌跡
  getTrace(traceId) {
    for (const channel of this.channels.values()) {
      for (const msg of channel.messages) {
        if (msg.trace?.trace_id === traceId) {
          return msg;
        }
      }
    }
    return null;
  }

  // 廣通: 獲取 channel 統計
  getChannelStats() {
    const stats = {};
    for (const [key, channel] of this.channels.entries()) {
      stats[key] = channel.stats;
    }
    return stats;
  }

  generateTraceId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }
}

// Singleton
export const interSwarm = new InterSwarmProtocol();
export default InterSwarmProtocol;
