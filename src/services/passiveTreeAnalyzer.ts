/**
 * Passive Tree Analyzer
 *
 * Core analysis engine for the analyze_next_points tool.
 * Evaluates unallocated notable nodes in a goal build's passive tree
 * by simulating each candidate path through the PoB bridge and scoring
 * on three axes: offense, defense, and recovery.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalysisMode = 'offense' | 'defense' | 'balanced' | 'auto';

export interface ModeWeights {
  offense: number;
  defense: number;
  recovery: number;
}

export interface TreeNode {
  id: number;
  name: string;
  stats: string[];
  connections: number[];
  isNotable: boolean;
  isKeystone: boolean;
}

export interface BaselineStats {
  WithPoisonDPS: number;
  TotalEHP: number;
  Life: number;
  EnergyShield: number;
  Speed: number;
  CritChance: number;
  CritMultiplier: number;
  FireResist: number;
  ColdResist: number;
  LightningResist: number;
  ChaosResist: number;
  BlockChance: number;
  SpellSuppressionChance: number;
  Evasion: number;
  LifeOnHitRate: number;
  LifeLeechRate: number;
  LifeRegen: number;
  NetLifeRegen: number;
}

export interface CandidateResult {
  nodeId: number;
  name: string;
  pathCost: number;
  pathNodeIds: number[];
  pathDescription: string;
  offenseDelta: number;
  defenseDelta: number;
  recoveryDelta: number;
  combinedScore: number;
}

export interface AnalyzeNextPointsParams {
  treeNodes: Map<number, TreeNode>;
  allocatedNodes: Set<number>;
  goalNodes: Set<number>;
  baselineStats: BaselineStats;
  weights: ModeWeights;
  count: number;
  simulateFn: (pathNodeIds: number[]) => Promise<BaselineStats>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RESIST_CAP = 75;
const LOW_LIFE_THRESHOLD = 3000;

const PRESET_WEIGHTS: Record<Exclude<AnalysisMode, 'auto'>, ModeWeights> = {
  offense:  { offense: 0.8, defense: 0.1, recovery: 0.1 },
  defense:  { offense: 0.1, defense: 0.7, recovery: 0.2 },
  balanced: { offense: 0.4, defense: 0.35, recovery: 0.25 },
};

// ---------------------------------------------------------------------------
// Analyzer
// ---------------------------------------------------------------------------

export class PassiveTreeAnalyzer {

  /**
   * Determine mode weights. For 'auto', inspect baseline stats for weaknesses
   * and shift weights accordingly.
   */
  getModeWeights(mode: AnalysisMode, stats: BaselineStats): ModeWeights {
    if (mode !== 'auto') {
      return { ...PRESET_WEIGHTS[mode] };
    }

    // Start from balanced
    const w: ModeWeights = { ...PRESET_WEIGHTS.balanced };

    // Detect weaknesses and adjust
    const uncappedResists =
      (stats.FireResist < RESIST_CAP ? 1 : 0) +
      (stats.ColdResist < RESIST_CAP ? 1 : 0) +
      (stats.LightningResist < RESIST_CAP ? 1 : 0);

    const lowLife = stats.Life < LOW_LIFE_THRESHOLD;

    const noRecovery =
      stats.LifeOnHitRate <= 0 &&
      stats.LifeLeechRate <= 0 &&
      stats.LifeRegen <= 0 &&
      stats.NetLifeRegen <= 0;

    // Shift weight toward weaknesses, pulling from offense
    if (uncappedResists > 0) {
      const shift = 0.1 * uncappedResists;
      w.defense += shift;
      w.offense -= shift;
    }

    if (lowLife) {
      w.defense += 0.1;
      w.offense -= 0.1;
    }

    if (noRecovery) {
      w.recovery += 0.15;
      w.offense -= 0.1;
      w.defense -= 0.05;
    }

    // Clamp to non-negative
    w.offense = Math.max(0, w.offense);
    w.defense = Math.max(0, w.defense);
    w.recovery = Math.max(0, w.recovery);

    // Normalize to sum to 1
    const total = w.offense + w.defense + w.recovery;
    if (total > 0) {
      w.offense /= total;
      w.defense /= total;
      w.recovery /= total;
    }

    return w;
  }

  // -----------------------------------------------------------------------
  // Scoring
  // -----------------------------------------------------------------------

  /** Offense score: primarily WithPoisonDPS delta %, with secondary contributions. */
  computeOffenseScore(base: BaselineStats, after: BaselineStats): number {
    const baseDPS = base.WithPoisonDPS || 1;
    const primary = (after.WithPoisonDPS - base.WithPoisonDPS) / baseDPS;

    const speedDelta = (after.Speed - base.Speed) / (base.Speed || 1) * 0.1;
    const critDelta = (after.CritChance - base.CritChance) / (base.CritChance || 1) * 0.05;
    const critMultDelta = (after.CritMultiplier - base.CritMultiplier) / (base.CritMultiplier || 1) * 0.05;

    return primary + speedDelta + critDelta + critMultDelta;
  }

  /** Defense score: primarily TotalEHP delta %, with secondary contributions. */
  computeDefenseScore(base: BaselineStats, after: BaselineStats): number {
    const baseEHP = base.TotalEHP || 1;
    const primary = (after.TotalEHP - base.TotalEHP) / baseEHP;

    const lifeDelta = (after.Life - base.Life) / (base.Life || 1) * 0.1;

    // Resist improvements (only valuable if going toward cap)
    const resistDelta =
      (Math.min(RESIST_CAP, after.FireResist) - Math.min(RESIST_CAP, base.FireResist)) / RESIST_CAP * 0.05 +
      (Math.min(RESIST_CAP, after.ColdResist) - Math.min(RESIST_CAP, base.ColdResist)) / RESIST_CAP * 0.05 +
      (Math.min(RESIST_CAP, after.LightningResist) - Math.min(RESIST_CAP, base.LightningResist)) / RESIST_CAP * 0.05;

    const blockDelta = (after.BlockChance - base.BlockChance) / 100 * 0.05;
    const suppressDelta = (after.SpellSuppressionChance - base.SpellSuppressionChance) / 100 * 0.05;
    const evasionDelta = (after.Evasion - base.Evasion) / (base.Evasion || 1) * 0.05;

    return primary + lifeDelta + resistDelta + blockDelta + suppressDelta + evasionDelta;
  }

  /** Recovery score: LifeOnHitRate delta as primary, plus leech and regen. */
  computeRecoveryScore(base: BaselineStats, after: BaselineStats): number {
    const lohBase = base.LifeOnHitRate || 1;
    const primary = (after.LifeOnHitRate - base.LifeOnHitRate) / lohBase;

    const leechDelta = (after.LifeLeechRate - base.LifeLeechRate) / (base.LifeLeechRate || 1) * 0.3;
    const regenDelta = (after.LifeRegen - base.LifeRegen) / (base.LifeRegen || 1) * 0.2;
    const netRegenDelta = (after.NetLifeRegen - base.NetLifeRegen) / (base.NetLifeRegen || 1) * 0.2;

    return primary + leechDelta + regenDelta + netRegenDelta;
  }

  /** Weighted combination of the three axes. */
  computeCombinedScore(base: BaselineStats, after: BaselineStats, weights: ModeWeights): number {
    const off = this.computeOffenseScore(base, after);
    const def = this.computeDefenseScore(base, after);
    const rec = this.computeRecoveryScore(base, after);
    return off * weights.offense + def * weights.defense + rec * weights.recovery;
  }

  // -----------------------------------------------------------------------
  // BFS pathfinding
  // -----------------------------------------------------------------------

  /**
   * BFS from allocated nodes to target, only traversing nodes in goalNodes.
   * Returns the path (excluding already-allocated nodes) or [] if unreachable.
   */
  findPathBFS(
    allocated: Set<number>,
    target: number,
    treeNodes: Map<number, TreeNode>,
    goalNodes: Set<number>,
  ): number[] {
    if (allocated.has(target)) return [];

    // BFS queue: [nodeId, path-from-frontier]
    const visited = new Set<number>(allocated);
    const queue: Array<{ nodeId: number; path: number[] }> = [];

    // Seed from all allocated nodes
    for (const allocId of allocated) {
      const node = treeNodes.get(allocId);
      if (!node) continue;
      for (const neighbor of node.connections) {
        if (!visited.has(neighbor) && goalNodes.has(neighbor)) {
          visited.add(neighbor);
          const newPath = [neighbor];
          if (neighbor === target) return newPath;
          queue.push({ nodeId: neighbor, path: newPath });
        }
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const node = treeNodes.get(current.nodeId);
      if (!node) continue;

      for (const neighbor of node.connections) {
        if (!visited.has(neighbor) && goalNodes.has(neighbor)) {
          visited.add(neighbor);
          const newPath = [...current.path, neighbor];
          if (neighbor === target) return newPath;
          queue.push({ nodeId: neighbor, path: newPath });
        }
      }
    }

    return []; // unreachable
  }

  // -----------------------------------------------------------------------
  // Main analysis
  // -----------------------------------------------------------------------

  /**
   * Analyze the best next notable nodes to allocate.
   * For each unallocated notable in the goal tree, BFS to find the path,
   * then simulate via the provided function to compute stat deltas.
   */
  async analyzeNextPoints(params: AnalyzeNextPointsParams): Promise<CandidateResult[]> {
    const { treeNodes, allocatedNodes, goalNodes, baselineStats: base, weights, count, simulateFn } = params;

    // Find all unallocated notables/keystones in the goal tree
    const candidates: Array<{ nodeId: number; node: TreeNode; path: number[] }> = [];

    for (const nodeId of goalNodes) {
      if (allocatedNodes.has(nodeId)) continue;
      const node = treeNodes.get(nodeId);
      if (!node) continue;
      if (!node.isNotable && !node.isKeystone) continue;

      const path = this.findPathBFS(allocatedNodes, nodeId, treeNodes, goalNodes);
      if (path.length === 0) continue;

      candidates.push({ nodeId, node, path });
    }

    if (candidates.length === 0) return [];

    // Simulate each candidate
    const results: CandidateResult[] = [];

    for (const { nodeId, node, path } of candidates) {
      try {
        const afterStats = await simulateFn(path);

        const offenseDelta = this.computeOffenseScore(base, afterStats);
        const defenseDelta = this.computeDefenseScore(base, afterStats);
        const recoveryDelta = this.computeRecoveryScore(base, afterStats);
        const combinedScore = offenseDelta * weights.offense + defenseDelta * weights.defense + recoveryDelta * weights.recovery;

        const treeNodeNames = path.map(id => treeNodes.get(id)?.name || `Node ${id}`);
        const pathDescription = treeNodeNames.join(' -> ');

        results.push({
          nodeId,
          name: node.name,
          pathCost: path.length,
          pathNodeIds: path,
          pathDescription,
          offenseDelta,
          defenseDelta,
          recoveryDelta,
          combinedScore,
        });
      } catch {
        // Skip candidates that fail simulation
        continue;
      }
    }

    // Sort by combined score descending, take top N
    results.sort((a, b) => b.combinedScore - a.combinedScore);
    return results.slice(0, count);
  }
}
