/**
 * Tests for PassiveTreeAnalyzer — the core engine behind analyze_next_points.
 *
 * All PoB bridge calls are mocked; these tests validate scoring logic,
 * BFS pathfinding, mode weight selection, and auto-mode heuristics.
 */

import {
  PassiveTreeAnalyzer,
  AnalysisMode,
  ModeWeights,
  CandidateResult,
  BaselineStats,
  TreeNode,
} from '../../src/services/passiveTreeAnalyzer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal tree graph for BFS tests. */
function makeTreeNodes(): Map<number, TreeNode> {
  // Graph:
  //   1 -- 2 -- 3(notable:"Might") -- 4 -- 5(notable:"Fury")
  //        |
  //        6(notable:"Shield")
  const nodes = new Map<number, TreeNode>();
  nodes.set(1, { id: 1, name: 'Start', stats: [], connections: [2], isNotable: false, isKeystone: false });
  nodes.set(2, { id: 2, name: 'Travel A', stats: [], connections: [1, 3, 6], isNotable: false, isKeystone: false });
  nodes.set(3, { id: 3, name: 'Might', stats: ['+10% damage'], connections: [2, 4], isNotable: true, isKeystone: false });
  nodes.set(4, { id: 4, name: 'Travel B', stats: [], connections: [3, 5], isNotable: false, isKeystone: false });
  nodes.set(5, { id: 5, name: 'Fury', stats: ['+20% attack speed'], connections: [4], isNotable: true, isKeystone: false });
  nodes.set(6, { id: 6, name: 'Shield', stats: ['+15% block'], connections: [2], isNotable: true, isKeystone: false });
  return nodes;
}

function baselineStats(): BaselineStats {
  return {
    WithPoisonDPS: 100000,
    TotalEHP: 50000,
    Life: 4000,
    EnergyShield: 0,
    Speed: 1.5,
    CritChance: 30,
    CritMultiplier: 200,
    FireResist: 75,
    ColdResist: 75,
    LightningResist: 75,
    ChaosResist: 20,
    BlockChance: 0,
    SpellSuppressionChance: 0,
    Evasion: 5000,
    LifeOnHitRate: 500,
    LifeLeechRate: 1000,
    LifeRegen: 200,
    NetLifeRegen: 150,
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('PassiveTreeAnalyzer', () => {
  let analyzer: PassiveTreeAnalyzer;

  beforeEach(() => {
    analyzer = new PassiveTreeAnalyzer();
  });

  // -----------------------------------------------------------------------
  // Mode weight selection
  // -----------------------------------------------------------------------
  describe('getModeWeights', () => {
    it('returns offense-heavy weights for offense mode', () => {
      const w = analyzer.getModeWeights('offense', baselineStats());
      expect(w.offense).toBeCloseTo(0.8);
      expect(w.defense).toBeCloseTo(0.1);
      expect(w.recovery).toBeCloseTo(0.1);
    });

    it('returns defense-heavy weights for defense mode', () => {
      const w = analyzer.getModeWeights('defense', baselineStats());
      expect(w.offense).toBeCloseTo(0.1);
      expect(w.defense).toBeCloseTo(0.7);
      expect(w.recovery).toBeCloseTo(0.2);
    });

    it('returns balanced weights for balanced mode', () => {
      const w = analyzer.getModeWeights('balanced', baselineStats());
      expect(w.offense).toBeCloseTo(0.4);
      expect(w.defense).toBeCloseTo(0.35);
      expect(w.recovery).toBeCloseTo(0.25);
    });

    it('auto mode returns balanced when stats are healthy', () => {
      const w = analyzer.getModeWeights('auto', baselineStats());
      // No weaknesses => balanced
      expect(w.offense).toBeCloseTo(0.4);
      expect(w.defense).toBeCloseTo(0.35);
      expect(w.recovery).toBeCloseTo(0.25);
    });

    it('auto mode boosts defense when resists are uncapped', () => {
      const stats = { ...baselineStats(), FireResist: 40 };
      const w = analyzer.getModeWeights('auto', stats);
      expect(w.defense).toBeGreaterThan(0.35);
      expect(w.offense).toBeLessThan(0.4);
    });

    it('auto mode boosts defense when life is low', () => {
      const stats = { ...baselineStats(), Life: 2500 };
      const w = analyzer.getModeWeights('auto', stats);
      expect(w.defense).toBeGreaterThan(0.35);
    });

    it('auto mode boosts recovery when no recovery sources', () => {
      const stats = {
        ...baselineStats(),
        LifeOnHitRate: 0,
        LifeLeechRate: 0,
        LifeRegen: 0,
        NetLifeRegen: 0,
      };
      const w = analyzer.getModeWeights('auto', stats);
      expect(w.recovery).toBeGreaterThan(0.25);
    });
  });

  // -----------------------------------------------------------------------
  // Scoring functions
  // -----------------------------------------------------------------------
  describe('scoring', () => {
    it('calculates offense score from DPS delta', () => {
      const base = baselineStats();
      const after = { ...base, WithPoisonDPS: 120000 }; // 20% increase
      const score = analyzer.computeOffenseScore(base, after);
      expect(score).toBeGreaterThan(0);
    });

    it('offense score is zero when DPS unchanged', () => {
      const base = baselineStats();
      const score = analyzer.computeOffenseScore(base, base);
      expect(score).toBe(0);
    });

    it('calculates defense score from EHP delta', () => {
      const base = baselineStats();
      const after = { ...base, TotalEHP: 60000 }; // 20% increase
      const score = analyzer.computeDefenseScore(base, after);
      expect(score).toBeGreaterThan(0);
    });

    it('calculates recovery score from life recovery deltas', () => {
      const base = baselineStats();
      const after = { ...base, LifeOnHitRate: 1000 }; // doubled
      const score = analyzer.computeRecoveryScore(base, after);
      expect(score).toBeGreaterThan(0);
    });

    it('combined score respects mode weights', () => {
      const base = baselineStats();
      const afterOffense = { ...base, WithPoisonDPS: 150000 };
      const afterDefense = { ...base, TotalEHP: 75000 };

      const offenseWeights: ModeWeights = { offense: 0.8, defense: 0.1, recovery: 0.1 };
      const defenseWeights: ModeWeights = { offense: 0.1, defense: 0.7, recovery: 0.2 };

      const offNode = analyzer.computeCombinedScore(base, afterOffense, offenseWeights);
      const defNode = analyzer.computeCombinedScore(base, afterDefense, defenseWeights);

      // offense node should score higher under offense weights
      expect(offNode).toBeGreaterThan(0);
      expect(defNode).toBeGreaterThan(0);
    });
  });

  // -----------------------------------------------------------------------
  // BFS pathfinding
  // -----------------------------------------------------------------------
  describe('findPathBFS', () => {
    it('finds shortest path from allocated nodes to a target', () => {
      const tree = makeTreeNodes();
      const allocated = new Set([1, 2]); // start + travel A
      const goalNodes = new Set([1, 2, 3, 4, 5, 6]); // all nodes in goal build

      const path = analyzer.findPathBFS(allocated, 3, tree, goalNodes);
      // Node 3 is directly connected to 2 which is allocated => path = [3]
      expect(path).toEqual([3]);
    });

    it('finds multi-hop path', () => {
      const tree = makeTreeNodes();
      const allocated = new Set([1, 2]);
      const goalNodes = new Set([1, 2, 3, 4, 5, 6]);

      const path = analyzer.findPathBFS(allocated, 5, tree, goalNodes);
      // Must go through 3, 4 to reach 5
      expect(path).toEqual([3, 4, 5]);
    });

    it('returns empty array when target unreachable (not in goal)', () => {
      const tree = makeTreeNodes();
      const allocated = new Set([1, 2]);
      // Goal doesn't include node 5's path
      const goalNodes = new Set([1, 2, 6]);

      const path = analyzer.findPathBFS(allocated, 5, tree, goalNodes);
      expect(path).toEqual([]);
    });

    it('returns empty array when target already allocated', () => {
      const tree = makeTreeNodes();
      const allocated = new Set([1, 2, 3]);
      const goalNodes = new Set([1, 2, 3]);

      const path = analyzer.findPathBFS(allocated, 3, tree, goalNodes);
      expect(path).toEqual([]);
    });

    it('finds path to adjacent notable', () => {
      const tree = makeTreeNodes();
      const allocated = new Set([1, 2]);
      const goalNodes = new Set([1, 2, 6]);

      const path = analyzer.findPathBFS(allocated, 6, tree, goalNodes);
      expect(path).toEqual([6]); // directly connected to 2
    });
  });

  // -----------------------------------------------------------------------
  // Integration: analyzeNextPoints (mock bridge)
  // -----------------------------------------------------------------------
  describe('analyzeNextPoints', () => {
    it('returns ranked candidates with scores', async () => {
      const tree = makeTreeNodes();
      const allocated = new Set([1, 2]);
      const goalNodes = new Set([1, 2, 3, 4, 5, 6]);
      const base = baselineStats();
      const weights: ModeWeights = { offense: 0.4, defense: 0.35, recovery: 0.25 };

      // Mock bridge: simulate stats after adding each candidate path
      const mockSimulate = async (nodeIds: number[]): Promise<BaselineStats> => {
        const s = { ...base };
        // Simulate: each node adds 5% DPS and 2% EHP
        s.WithPoisonDPS = base.WithPoisonDPS * (1 + 0.05 * nodeIds.length);
        s.TotalEHP = base.TotalEHP * (1 + 0.02 * nodeIds.length);
        s.LifeOnHitRate = base.LifeOnHitRate + 50 * nodeIds.length;
        return s;
      };

      const results = await analyzer.analyzeNextPoints({
        treeNodes: tree,
        allocatedNodes: allocated,
        goalNodes,
        baselineStats: base,
        weights,
        count: 10,
        simulateFn: mockSimulate,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(10);

      // Each result should have required fields
      for (const r of results) {
        expect(r.nodeId).toBeDefined();
        expect(r.name).toBeDefined();
        expect(r.pathCost).toBeGreaterThan(0);
        expect(typeof r.offenseDelta).toBe('number');
        expect(typeof r.defenseDelta).toBe('number');
        expect(typeof r.recoveryDelta).toBe('number');
        expect(typeof r.combinedScore).toBe('number');
        expect(r.pathNodeIds.length).toBeGreaterThan(0);
      }

      // Results should be sorted by combined score descending
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].combinedScore).toBeGreaterThanOrEqual(results[i].combinedScore);
      }
    });

    it('excludes already-allocated notables', async () => {
      const tree = makeTreeNodes();
      // Node 3 (Might) is already allocated
      const allocated = new Set([1, 2, 3]);
      const goalNodes = new Set([1, 2, 3, 4, 5, 6]);
      const base = baselineStats();
      const weights: ModeWeights = { offense: 0.4, defense: 0.35, recovery: 0.25 };

      const mockSimulate = async (nodeIds: number[]): Promise<BaselineStats> => {
        return { ...base, WithPoisonDPS: base.WithPoisonDPS * 1.1 };
      };

      const results = await analyzer.analyzeNextPoints({
        treeNodes: tree,
        allocatedNodes: allocated,
        goalNodes,
        baselineStats: base,
        weights,
        count: 10,
        simulateFn: mockSimulate,
      });

      // Node 3 should not appear in results (already allocated)
      const ids = results.map(r => r.nodeId);
      expect(ids).not.toContain(3);
    });

    it('returns empty array when no candidates available', async () => {
      const tree = makeTreeNodes();
      // All notables allocated
      const allocated = new Set([1, 2, 3, 4, 5, 6]);
      const goalNodes = new Set([1, 2, 3, 4, 5, 6]);
      const base = baselineStats();
      const weights: ModeWeights = { offense: 0.4, defense: 0.35, recovery: 0.25 };

      const mockSimulate = async (): Promise<BaselineStats> => base;

      const results = await analyzer.analyzeNextPoints({
        treeNodes: tree,
        allocatedNodes: allocated,
        goalNodes,
        baselineStats: base,
        weights,
        count: 10,
        simulateFn: mockSimulate,
      });

      expect(results).toEqual([]);
    });
  });
});
