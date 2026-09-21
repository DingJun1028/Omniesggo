import { describe, it, expect } from 'vitest';
import { OmniBridge, omniBridge } from '../src/index.js';

describe('OmniBridge v1.0 (Trackable lifecycle)', () => {
  it('publishEvent returns BridgeEvent with IComponentCore', async () => {
    const event = await omniBridge.publishEvent(
      'memory.recall',
      { q: 'test' },
      'OmniMemory',
      'OmniAgent'
    );
    expect(event.uuid).toBeTruthy();
    expect(event.version).toBe('1.0.0');
    expect(event.source_origin).toContain('omni-bridge://');
    expect(event.event_type).toBe('memory.recall');
    expect(event.source_layer).toBe('OmniMemory');
    expect(event.target_layer).toBe('OmniAgent');
  });

  it('publishEvent seals component (Trustworthy)', async () => {
    const event = await omniBridge.publishEvent(
      'tag.route',
      { tag: 'team:tech:x' },
      'OmniTag',
      'OmniAgent'
    );
    // 5T-PROOF evidence should be appended
    expect(event.evidence.length).toBeGreaterThan(0);
    expect(event.evidence[0].standard).toBe('5T-PROOF');
  });

  it('subscribe receives published events', async () => {
    const bridge = new OmniBridge();
    const received: string[] = [];
    const unsub = bridge.subscribe((event) => {
      received.push(event.event_type);
    });

    await bridge.publishEvent('db.reason', {}, 'OmniDB', 'OmniAgent');
    await bridge.publishEvent('ui.render', {}, 'OmniUI', 'OmniBridge');

    expect(received).toEqual(['db.reason', 'ui.render']);

    unsub();
    await bridge.publishEvent('forge.iterate', {}, 'OmniForge', 'OmniBridge');
    expect(received).toEqual(['db.reason', 'ui.render']); // unsub 後不收到
  });

  it('getEventLog returns tracked history', async () => {
    const bridge = new OmniBridge();
    await bridge.publishEvent('memory.store', { k: 'a' }, 'OmniAgent', 'OmniMemory');
    await bridge.publishEvent('agent.dispatch', { task: 'x' }, 'OmniDB', 'OmniAgent');

    const log = bridge.getEventLog();
    expect(log).toHaveLength(2);
    expect(log[0].event_type).toBe('memory.store');
    expect(log[1].event_type).toBe('agent.dispatch');
  });

  it('registerRune + listRunes', () => {
    const bridge = new OmniBridge();
    bridge.registerRune({
      rune_id: 'rune-001-mcp',
      protocol: 'stdio',
      endpoint: 'localhost:8788',
      adapter: 'mcp',
    });
    expect(bridge.listRunes()).toHaveLength(1);
  });

  it('invokeRune throws for unregistered rune', async () => {
    const bridge = new OmniBridge();
    await expect(bridge.invokeRune('rune-unknown', 'GET', '/x')).rejects.toThrow(
      'Rune rune-unknown not registered'
    );
  });

  it('invokeRune records event in log', async () => {
    const bridge = new OmniBridge();
    bridge.registerRune({
      rune_id: 'rune-test',
      protocol: 'http',
      endpoint: 'https://example.com',
      adapter: 'rest',
    });

    await bridge.invokeRune('rune-test', 'POST', '/api/data', { hello: 'world' });

    const log = bridge.getEventLog();
    expect(log).toHaveLength(1);
    expect(log[0].event_type).toBe('bridge.publish');
  });
});
