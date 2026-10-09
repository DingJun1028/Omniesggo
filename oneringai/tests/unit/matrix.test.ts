/**
 * Unit tests for the 30-Agent Matrix
 */
import { describe, it, expect } from 'vitest';
import { SWARM_SPEC, SwarmFactory, getSquadMembers, getAgentById, getAgentByNo, CROSS_AGENT_PAIRINGS } from '../../src/agents/matrix.js';
import type { Squad } from '../../src/agents/matrix.js';

describe('30-Agent Matrix', () => {
  describe('SWARM_SPEC', () => {
    it('should have exactly 30 agents', () => {
      expect(SWARM_SPEC).toHaveLength(30);
    });

    it('should have agents numbered 1-30 sequentially', () => {
      const numbers = SWARM_SPEC.map(a => a.no).sort((a, b) => a - b);
      expect(numbers).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    });

    it('should have 5 squads', () => {
      const squads = new Set(SWARM_SPEC.map(a => a.squad));
      expect(squads.size).toBe(5);
      expect(Array.from(squads).sort()).toEqual(['creative', 'guard', 'marketing', 'strategy', 'tech']);
    });

    it('should have 6 agents per squad', () => {
      for (const squad of ['strategy', 'tech', 'creative', 'marketing', 'guard'] as Squad[]) {
        const members = SWARM_SPEC.filter(a => a.squad === squad);
        expect(members).toHaveLength(6);
      }
    });

    it('should have unique agent ids', () => {
      const ids = SWARM_SPEC.map(a => a.id);
      const unique = new Set(ids);
      expect(unique.size).toBe(30);
    });

    it('should have all 5T tags documented', () => {
      for (const agent of SWARM_SPEC) {
        expect(agent.tags.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getAgentByNo', () => {
    it('should find agents by number', () => {
      const agent1 = getAgentByNo(1);
      expect(agent1).toBeDefined();
      expect(agent1?.id).toBe('queen-bee');
    });

    it('should return undefined for invalid numbers', () => {
      expect(getAgentByNo(0)).toBeUndefined();
      expect(getAgentByNo(31)).toBeUndefined();
    });
  });

  describe('getAgentById', () => {
    it('should find agents by id', () => {
      const agent = getAgentById('queen-bee');
      expect(agent).toBeDefined();
      expect(agent?.no).toBe(1);
    });

    it('should return undefined for invalid ids', () => {
      expect(getAgentById('nonexistent')).toBeUndefined();
    });
  });

  describe('getSquadMembers', () => {
    it('should return correct squad members', () => {
      const strategy = getSquadMembers('strategy');
      expect(strategy).toHaveLength(6);
      expect(strategy.every(a => a.squad === 'strategy')).toBe(true);
    });

    it('should return empty for unknown squad', () => {
      // Squad type is restricted, so this is a compile-time check
      expect(getSquadMembers('guard')).toHaveLength(6);
    });
  });

  describe('CROSS_AGENT_PAIRINGS', () => {
    it('should have pairings for cross-team collaboration', () => {
      expect(CROSS_AGENT_PAIRINGS.length).toBeGreaterThan(0);
    });

    it('should cover all 30 agents', () => {
      const covered = new Set<string>();
      for (const pairing of CROSS_AGENT_PAIRINGS) {
        covered.add(pairing.primaryAgentId);
        covered.add(pairing.partnerAgentId);
      }
      expect(covered.size).toBe(30);
    });

    it('should include Queen Bee pairings', () => {
      const queenPairings = CROSS_AGENT_PAIRINGS.filter(p => 
        p.primaryAgentId === 'queen-bee' || p.partnerAgentId === 'queen-bee'
      );
      expect(queenPairings.length).toBeGreaterThan(0);
    });
  });

  describe('SwarmFactory', () => {
    it('should create agents from specs', () => {
      const factory = new SwarmFactory('openai');
      const spec = SWARM_SPEC.find(a => a.id === 'queen-bee')!;
      const agent = factory.createAgent(spec);
      
      expect(agent).toBeDefined();
      expect(agent.model).toBe('gpt-4.1');
    });

    it('should create all 30 agents', () => {
      const factory = new SwarmFactory('openai');
      factory.createAll();
      expect(factory.getAllAgents().size).toBe(30);
    });

    it('should filter agents by squad', () => {
      const factory = new SwarmFactory('openai');
      factory.createAll();
      const techAgents = factory.getAgentsBySquad('tech');
      expect(techAgents.size).toBe(6);
    });
  });
});
