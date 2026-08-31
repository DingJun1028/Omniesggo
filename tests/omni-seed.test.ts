import { describe, it, expect } from 'vitest';
import { plantOmniSeed, IOmniSeed } from '../src/core/sonnar/omni-seed';

describe('OmniSeed Core Contract & Hook', () => {
  const mockSeed: IOmniSeed = {
    uuid: 'omni-subject-uuid-001',
    version: '1.0.0-alpha',
    timestamp: Date.now(),
    evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', source_origin: 'Celestial Registry', scope_verification: 'ISO-14064-1 Approved' },
    hashLock: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    entropyControl: 0.1,
    status: 'dormant'
  };

  it('should successfully awaken when placed at #同心圓中心', () => {
    const awakened = plantOmniSeed(mockSeed, '#同心圓中心');
    
    expect(awakened.status).toBe('infinite_evolving');

    
    // Verify the object is fully frozen (immutability rule)
    expect(Object.isFrozen(awakened)).toBe(true);
  });

  it('should successfully awaken when placed at #記憶聖所', () => {
    const awakened = plantOmniSeed(mockSeed, '#記憶聖所');
    
    expect(awakened.status).toBe('infinite_evolving');
    expect(Object.isFrozen(awakened)).toBe(true);
  });

  it('should throw an error with 混沌警告 when placed in an incorrect coordinate', () => {
    expect(() => {
      plantOmniSeed(mockSeed, '#混沌邊界');
    }).toThrow('[混沌警告] 萬能種子未放置於正確坐標');
  });

  it('should prevent modifications to any fields after hyper-eternal awakening', () => {
    const awakened = plantOmniSeed(mockSeed, '#同心圓中心');
    
    expect(() => {
      (awakened as unknown as { entropyControl: number }).entropyControl = 0.5;
    }).toThrow();

    expect(() => {
      (awakened as unknown as { status: string }).status = 'dormant';
    }).toThrow();
  });
});
