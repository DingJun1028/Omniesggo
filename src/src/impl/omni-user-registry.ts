import { randomUUID } from 'crypto';

export type UserPreference = {
  readonly id: string;
  readonly userId: string;
  readonly key: string;
  readonly value: unknown;
  readonly updatedAt: number;
};

export type UserHabit = {
  readonly id: string;
  readonly userId: string;
  readonly behavior: string;
  readonly frequency: number;
  readonly lastSeenAt: number;
};

export type GrowthEvent = {
  readonly id: string;
  readonly userId: string;
  readonly event: string;
  readonly metadata: Record<string, unknown>;
  readonly occurredAt: number;
};

export type UserRAGProfile = {
  readonly userId: string;
  readonly preferences: readonly UserPreference[];
  readonly habits: readonly UserHabit[];
  readonly growthEvents: readonly GrowthEvent[];
};

export class OmniUserRegistry {
  private readonly preferences = new Map<string, UserPreference[]>();
  private readonly habits = new Map<string, UserHabit[]>();
  private readonly growthEvents = new Map<string, GrowthEvent[]>();

  recordPreference(userId: string, key: string, value: unknown): UserPreference {
    const pref = Object.freeze({
      id: randomUUID(),
      userId,
      key,
      value,
      updatedAt: Date.now(),
    } as UserPreference);

    const list = this.preferences.get(userId) ?? [];
    const idx = list.findIndex(p => p.key === key);
    if (idx >= 0) list[idx] = pref;
    else list.push(pref);
    this.preferences.set(userId, list);
    return pref;
  }

  recordHabit(userId: string, behavior: string, frequency = 1): UserHabit {
    const item = Object.freeze({
      id: randomUUID(),
      userId,
      behavior,
      frequency,
      lastSeenAt: Date.now(),
    } as UserHabit);

    const list = this.habits.get(userId) ?? [];
    const existing = list.find(h => h.behavior === behavior);
    if (existing) {
      const updated = Object.freeze({
        ...existing,
        frequency: existing.frequency + frequency,
        lastSeenAt: Date.now(),
      } as UserHabit);
      this.habits.set(
        userId,
        list.map(h => (h.behavior === behavior ? updated : h)),
      );
      return updated;
    }

    this.habits.set(userId, [...list, item]);
    return item;
  }

  recordGrowthEvent(userId: string, event: string, metadata: Record<string, unknown> = {}): GrowthEvent {
    const item = Object.freeze({
      id: randomUUID(),
      userId,
      event,
      metadata: Object.freeze(metadata),
      occurredAt: Date.now(),
    } as GrowthEvent);

    const list = this.growthEvents.get(userId) ?? [];
    this.growthEvents.set(userId, [...list, item]);
    return item;
  }

  getUserProfile(userId: string): UserRAGProfile {
    return Object.freeze({
      userId,
      preferences: Object.freeze([...(this.preferences.get(userId) ?? [])]),
      habits: Object.freeze([...(this.habits.get(userId) ?? [])]),
      growthEvents: Object.freeze([...(this.growthEvents.get(userId) ?? [])]),
    } as UserRAGProfile);
  }

  recallSimilarUsers(userId: string, query: string, limit = 5): readonly UserRAGProfile[] {
    const queryTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (queryTokens.length === 0) return [];

    const scored = new Map<string, { profile: UserRAGProfile; score: number }>();

    for (const [uid, habits] of this.habits.entries()) {
      if (uid === userId) continue;
      let score = 0;
      for (const habit of habits) {
        const tokens = habit.behavior.toLowerCase().split(/\s+/).filter(Boolean);
        for (const qt of queryTokens) {
          if (tokens.some(t => t.includes(qt) || qt.includes(t))) score += 1;
        }
      }
      if (score > 0) {
        scored.set(uid, { profile: this.getUserProfile(uid), score });
      }
    }

    return Object.freeze(
      Array.from(scored.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(x => x.profile),
    );
  }
}
