import { describe, it, expect } from 'vitest';
import { OmniMemory, InMemoryStorage, omniMemory, type MemoryLayer } from '../src/index.js';
import type { OmniTag } from '@esggo/omni-tag';

describe('OmniMemory v1.0 (L0-L3 + 3-axis persistence)', () => {
  const layerTag: OmniTag = { namespace: 'team', key: 'tech', value: 'audit' };

  it('store creates Memory with IComponentCore + 5T-PROOF seal', async () => {
    const mem = await omniMemory.store('hello world', 'L1', [layerTag]);
    expect(mem.uuid).toBeTruthy();
    expect(mem.content).toBe('hello world');
    expect(mem.layer).toBe('L1');
    expect(mem.tags).toHaveLength(1);
    expect(mem.evidence.length).toBeGreaterThan(0);
    expect(mem.evidence[0].standard).toBe('5T-PROOF');
  });

  it('recall filters by query string', async () => {
    await omniMemory.store('apple banana', 'L0');
    await omniMemory.store('cherry date', 'L0');

    const results = await omniMemory.recall({ query: 'apple' });
    expect(results).toHaveLength(1);
    expect(results[0].content).toBe('apple banana');
  });

  it('recall filters by layer', async () => {
    const mem = new OmniMemory();
    await mem.store('L0 fact', 'L0');
    await mem.store('L1 atom', 'L1');
    await mem.store('L2 pattern', 'L2');

    const l1Results = await mem.recall({ query: '', layers: ['L1'] });
    expect(l1Results).toHaveLength(1);
    expect(l1Results[0].content).toBe('L1 atom');
  });

  it('recall filters by tags', async () => {
    const mem = new OmniMemory();
    const teamTech: OmniTag = { namespace: 'team', key: 'tech', value: 'x' };
    const teamGuard: OmniTag = { namespace: 'team', key: 'guard', value: 'y' };

    await mem.store('tech stuff', 'L0', [teamTech]);
    await mem.store('guard stuff', 'L0', [teamGuard]);

    const techResults = await mem.recall({ query: '', tags: [teamTech] });
    expect(techResults).toHaveLength(1);
    expect(techResults[0].content).toBe('tech stuff');
  });

  it('link adds memory link', async () => {
    const mem = new OmniMemory();
    const a = await mem.store('A', 'L0');
    const b = await mem.store('B', 'L0');
    await mem.link(a.uuid, b.uuid);

    const recalled = await mem.recall({ query: 'A' });
    expect(recalled[0].links).toContain(b.uuid);
  });

  it('replay filters by timestamp range', async () => {
    const mem = new OmniMemory();
    await mem.store('old', 'L0');
    const before = Date.now();
    await new Promise((r) => setTimeout(r, 50));
    await mem.store('new', 'L0');

    // replay 只取 >= before, 排除 'old'
    const replayed = await mem.replay(new Date(before), new Date(Date.now() + 1000));
    expect(replayed.find((m) => m.content === 'new')).toBeTruthy();
    expect(replayed.find((m) => m.content === 'old')).toBeFalsy();
  });

  it('InMemoryStorage is swappable', async () => {
    const custom = new InMemoryStorage();
    const mem = new OmniMemory(custom);
    await mem.store('test', 'L0');
    const all = await mem.recall({ query: '' });
    expect(all).toHaveLength(1);
  });

  it('4 layers supported', async () => {
    const mem = new OmniMemory();
    const layers: MemoryLayer[] = ['L0', 'L1', 'L2', 'L3'];
    for (const layer of layers) {
      const m = await mem.store(`${layer} content`, layer);
      expect(m.layer).toBe(layer);
    }
    const all = await mem.recall({ query: '' });
    expect(all).toHaveLength(4);
  });
});
