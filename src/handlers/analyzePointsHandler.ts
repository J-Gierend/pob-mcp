/**
 * Handler for the analyze_next_points MCP tool.
 *
 * Orchestrates the PoB Lua bridge to:
 * 1. Load a build and select the correct spec
 * 2. Read the goal build's full tree and current live nodes
 * 3. Run the PassiveTreeAnalyzer to find + score candidate paths
 * 4. Return a ranked recommendation list
 */

import type { PoBLuaApiClient } from '../pobLuaBridge.js';
import {
  PassiveTreeAnalyzer,
  AnalysisMode,
  BaselineStats,
  TreeNode,
  CandidateResult,
} from '../services/passiveTreeAnalyzer.js';
import fs from 'fs/promises';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyzePointsContext {
  getLuaClient: () => PoBLuaApiClient | null;
  ensureLuaClient: () => Promise<void>;
}

export interface AnalyzePointsArgs {
  build_path: string;
  spec_index?: number;
  live_nodes: number[];
  mode?: AnalysisMode;
  count?: number;
  main_socket_group?: number;
}

// Class start node IDs for each class
const CLASS_START_NODES: Record<string, number> = {
  Scion: 47389,
  Marauder: 50904,
  Ranger: 45035,
  Witch: 31628,
  Duelist: 62596,
  Templar: 1,
  Shadow: 47062,
};

// All stat fields we need from get_stats
const STAT_FIELDS = [
  'WithPoisonDPS', 'TotalDPS', 'CombinedDPS',
  'TotalEHP', 'Life', 'EnergyShield',
  'Speed', 'CritChance', 'CritMultiplier',
  'FireResist', 'ColdResist', 'LightningResist', 'ChaosResist',
  'BlockChance', 'SpellSuppressionChance', 'Evasion',
  'LifeOnHitRate', 'LifeLeechRate', 'LifeRegen', 'NetLifeRegen',
];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleAnalyzeNextPoints(
  context: AnalyzePointsContext,
  args: AnalyzePointsArgs,
): Promise<{ content: Array<{ type: string; text: string }> }> {
  await context.ensureLuaClient();
  const lua = context.getLuaClient();
  if (!lua) {
    throw new Error('Lua bridge not active. Use lua_start first.');
  }

  const {
    build_path,
    spec_index,
    live_nodes,
    mode = 'auto',
    count = 10,
    main_socket_group,
  } = args;

  // 1. Load the build XML
  const xml = await fs.readFile(build_path, 'utf-8');
  await lua.loadBuildXml(xml, 'analyze_next_points');

  // 2. Select spec if provided
  if (spec_index != null) {
    await lua.selectSpec(spec_index);
  }

  // 3. Set main socket group if provided
  if (main_socket_group != null) {
    await lua.setMainSelection({ mainSocketGroup: main_socket_group });
  }

  // 4. Get the goal build's full tree (all allocated nodes in the PoB build)
  const goalTree = await lua.getTree();
  const goalNodeIds: number[] = (goalTree.nodes || []).map(Number);
  const goalNodeSet = new Set(goalNodeIds);
  const classId: number = goalTree.classId ?? 0;
  const ascendClassId: number = goalTree.ascendClassId ?? 0;
  const secondaryAscendClassId: number | undefined = goalTree.secondaryAscendClassId;
  const treeVersion: string | undefined = goalTree.treeVersion;

  // 5. Build tree node map from PoB search (scan all goal nodes)
  const treeNodes = new Map<number, TreeNode>();
  // We need connection data. Use searchNodes with broad queries or
  // the tree data already available. For now, we'll get node info
  // by searching for allocated nodes.
  // Actually, the get_tree response should include node details.
  // Let's use the nodes from get_tree which includes connections.
  if (goalTree.nodeData) {
    for (const nd of goalTree.nodeData) {
      treeNodes.set(nd.id, {
        id: nd.id,
        name: nd.name || `Node ${nd.id}`,
        stats: nd.stats || [],
        connections: nd.connections || [],
        isNotable: !!nd.isNotable,
        isKeystone: !!nd.isKeystone,
      });
    }
  }

  // If nodeData wasn't available, try to get node info via search
  // for the notable nodes we care about
  if (treeNodes.size === 0) {
    // Fallback: search for all notable/keystone nodes
    try {
      const searchResult = await lua.searchNodes({
        keyword: '',
        nodeType: 'any',
        maxResults: 5000,
        includeAllocated: true,
      });
      if (searchResult?.nodes) {
        for (const nd of searchResult.nodes) {
          treeNodes.set(nd.id, {
            id: nd.id,
            name: nd.name || `Node ${nd.id}`,
            stats: nd.stats || [],
            connections: nd.out || nd.connections || [],
            isNotable: !!nd.isNotable || !!nd.not,
            isKeystone: !!nd.isKeystone || !!nd.ks,
          });
        }
      }
    } catch {
      // If search fails, we can't do pathfinding
    }
  }

  // 6. Set up baseline: apply live_nodes to the build tree
  const liveNodeSet = new Set(live_nodes);

  await lua.setTree({
    classId,
    ascendClassId,
    secondaryAscendClassId,
    nodes: live_nodes,
    treeVersion,
  });

  // 7. Get baseline stats
  const rawBaseline = await lua.getStats(STAT_FIELDS);
  const baseline = statsToBaseline(rawBaseline);

  // 8. Create analyzer and compute weights
  const analyzer = new PassiveTreeAnalyzer();
  const weights = analyzer.getModeWeights(mode, baseline);

  // 9. Simulate function: sets tree to live_nodes + path, gets stats
  const simulateFn = async (pathNodeIds: number[]): Promise<BaselineStats> => {
    const combined = [...live_nodes, ...pathNodeIds];
    await lua.setTree({
      classId,
      ascendClassId,
      secondaryAscendClassId,
      nodes: combined,
      treeVersion,
    });
    const raw = await lua.getStats(STAT_FIELDS);
    return statsToBaseline(raw);
  };

  // 10. Run analysis
  const results = await analyzer.analyzeNextPoints({
    treeNodes,
    allocatedNodes: liveNodeSet,
    goalNodes: goalNodeSet,
    baselineStats: baseline,
    weights,
    count,
    simulateFn,
  });

  // 11. Restore baseline tree
  await lua.setTree({
    classId,
    ascendClassId,
    secondaryAscendClassId,
    nodes: live_nodes,
    treeVersion,
  });

  // 12. Format response
  return formatResponse(baseline, results, mode, weights);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statsToBaseline(raw: Record<string, unknown>): BaselineStats {
  return {
    WithPoisonDPS: toNum(raw.WithPoisonDPS ?? raw.CombinedDPS ?? raw.TotalDPS),
    TotalEHP: toNum(raw.TotalEHP),
    Life: toNum(raw.Life),
    EnergyShield: toNum(raw.EnergyShield),
    Speed: toNum(raw.Speed),
    CritChance: toNum(raw.CritChance),
    CritMultiplier: toNum(raw.CritMultiplier),
    FireResist: toNum(raw.FireResist),
    ColdResist: toNum(raw.ColdResist),
    LightningResist: toNum(raw.LightningResist),
    ChaosResist: toNum(raw.ChaosResist),
    BlockChance: toNum(raw.BlockChance),
    SpellSuppressionChance: toNum(raw.SpellSuppressionChance),
    Evasion: toNum(raw.Evasion),
    LifeOnHitRate: toNum(raw.LifeOnHitRate),
    LifeLeechRate: toNum(raw.LifeLeechRate),
    LifeRegen: toNum(raw.LifeRegen),
    NetLifeRegen: toNum(raw.NetLifeRegen),
  };
}

function toNum(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseFloat(v) || 0;
  return 0;
}

function formatResponse(
  baseline: BaselineStats,
  results: CandidateResult[],
  mode: AnalysisMode,
  weights: { offense: number; defense: number; recovery: number },
): { content: Array<{ type: string; text: string }> } {
  const lines: string[] = [];

  lines.push('=== Passive Tree Next Points Analysis ===');
  lines.push('');
  lines.push(`Mode: ${mode} (offense: ${(weights.offense * 100).toFixed(0)}%, defense: ${(weights.defense * 100).toFixed(0)}%, recovery: ${(weights.recovery * 100).toFixed(0)}%)`);
  lines.push('');
  lines.push('--- Baseline Stats ---');
  lines.push(`DPS: ${Math.round(baseline.WithPoisonDPS).toLocaleString()}`);
  lines.push(`EHP: ${Math.round(baseline.TotalEHP).toLocaleString()}`);
  lines.push(`Life: ${Math.round(baseline.Life).toLocaleString()} | ES: ${Math.round(baseline.EnergyShield).toLocaleString()}`);
  lines.push(`Resists: Fire ${baseline.FireResist}% | Cold ${baseline.ColdResist}% | Lightning ${baseline.LightningResist}% | Chaos ${baseline.ChaosResist}%`);
  lines.push(`Recovery: LoH ${Math.round(baseline.LifeOnHitRate)}/s | Leech ${Math.round(baseline.LifeLeechRate)}/s | Regen ${Math.round(baseline.LifeRegen)}/s`);
  lines.push('');

  if (results.length === 0) {
    lines.push('No candidate nodes found. All notables in the goal build may already be allocated.');
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  lines.push(`--- Top ${results.length} Recommendations ---`);
  lines.push('');

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    lines.push(`${i + 1}. **${r.name}** (Node ${r.nodeId})`);
    lines.push(`   Path Cost: ${r.pathCost} point${r.pathCost > 1 ? 's' : ''}`);
    lines.push(`   Combined Score: ${r.combinedScore.toFixed(4)}`);
    lines.push(`   Offense: ${formatDelta(r.offenseDelta)} | Defense: ${formatDelta(r.defenseDelta)} | Recovery: ${formatDelta(r.recoveryDelta)}`);
    lines.push(`   Path: ${r.pathDescription}`);
    lines.push('');
  }

  // Strategic recommendation
  const topResult = results[0];
  lines.push('--- Strategic Recommendation ---');
  if (topResult.pathCost <= 2) {
    lines.push(`Allocate **${topResult.name}** next - only ${topResult.pathCost} point${topResult.pathCost > 1 ? 's' : ''} away with the highest combined score.`);
  } else {
    // Check if any cheaper option has a decent score
    const cheapAlternative = results.find(r => r.pathCost <= 2 && r !== topResult);
    if (cheapAlternative) {
      lines.push(`**${topResult.name}** has the best overall score but costs ${topResult.pathCost} points.`);
      lines.push(`Consider **${cheapAlternative.name}** first (${cheapAlternative.pathCost} points) for quicker value.`);
    } else {
      lines.push(`Allocate **${topResult.name}** next - ${topResult.pathCost} points for the highest combined benefit.`);
    }
  }

  return { content: [{ type: 'text', text: lines.join('\n') }] };
}

function formatDelta(d: number): string {
  if (d === 0) return '0';
  const sign = d > 0 ? '+' : '';
  return `${sign}${(d * 100).toFixed(2)}%`;
}
