/**
 * Tool Routing Module
 *
 * Routes MCP tool calls to their corresponding handlers with proper context.
 * Uses a dispatch table instead of a switch statement.
 */

import type { OptimizationConstraints } from "../types/optimization.js";
import type { ToolGate } from "./toolGate.js";
import type { ContextBuilder } from "../utils/contextBuilder.js";
import type { TradeApiClient } from "../services/tradeClient.js";
import type { StatMapper } from "../services/statMapper.js";
import type { ItemRecommendationEngine } from "../services/itemRecommendationEngine.js";
import type { PoeNinjaClient } from "../services/poeNinjaClient.js";

// Import handlers
import { handleListBuilds, handleAnalyzeBuild, handleCompareBuilds, handleGetBuildStats, handleGetBuildNotes, handleSetBuildNotes } from "../handlers/buildHandlers.js";
import { handleStartWatching, handleStopWatching, handleGetRecentChanges, handleWatchStatus, handleRefreshTreeData } from "../handlers/watchHandlers.js";
import { handleCompareTrees, handleGetNearbyNodes, handleFindPath, handleGetPassiveUpgrades, handleSuggestMasteries } from "../handlers/treeHandlers.js";
import { handleGetBuildIssues, formatIssuesResponse } from "../handlers/buildGoalsHandlers.js";
import { handleLuaStart, handleLuaStop, handleLuaNewBuild, handleLuaSaveBuild, handleLuaLoadBuild, handleLuaGetStats, handleLuaGetTree, handleLuaSetTree, handleSearchTreeNodes, handleLuaGetBuildInfo, handleLuaReloadBuild, handleUpdateTreeDelta, handleCreateSpec, handleListSpecs, handleSelectSpec, handleDeleteSpec, handleRenameSpec, handleListItemSets, handleSelectItemSet } from "../handlers/luaHandlers.js";
import { handleAddItem, handleGetEquippedItems, handleToggleFlask, handleGetSkillSetup, handleSetMainSkill, handleCreateSocketGroup, handleAddGem, handleSetGemLevel, handleSetGemQuality, handleRemoveSkill, handleRemoveGem, handleSetupSkillWithGems, handleAddMultipleItems } from "../handlers/itemSkillHandlers.js";
import { handleAnalyzeDefenses, handleSuggestOptimalNodes, handleOptimizeTree } from "../handlers/optimizationHandlers.js";
import { handleAnalyzeItems, handleOptimizeSkillLinks, handleCreateBudgetBuild } from "../handlers/advancedOptimizationHandlers.js";
import { handleGetConfig, handleSetConfig, handleSetEnemyStats, handleSaveConfigPreset, handleLoadConfigPreset, handleListConfigPresets } from "../handlers/configHandlers.js";
import { handleValidateBuild } from "../handlers/validationHandlers.js";
import { handleExportBuild, handleSaveTree, handleSnapshotBuild, handleListSnapshots, handleRestoreSnapshot, handleExportBuildSummary } from "../handlers/exportHandlers.js";
import { handleAnalyzeSkillLinks, handleSuggestSupportGems, handleCompareGemSetups, handleValidateGemQuality, handleFindOptimalLinks, handleGemUpgradePath } from "../handlers/skillGemHandlers.js";
import { handleSearchTradeItems, handleGetItemPrice, handleGetLeagues, handleSearchStats, handleFindItemUpgrades, handleFindResistanceGear, handleCompareTradeItems } from "../handlers/tradeHandlers.js";
import { handleGetCurrencyRates, handleFindArbitrage, handleCalculateTradingProfit } from "../handlers/poeNinjaHandlers.js";
import { handleSearchClusterJewels, handleAnalyzeBuildClusterJewels } from "../handlers/clusterJewelHandlers.js";
import { handleGenerateShoppingList } from "../handlers/shoppingListHandlers.js";
import { handlePlanLeveling } from "../handlers/levelingHandlers.js";
import { handleCheckBossReadiness } from "../handlers/bossReadinessHandlers.js";
import { handleSuggestWatchersEye } from "../handlers/jewelAdvisorHandlers.js";

export interface ToolRouterDependencies {
  toolGate: ToolGate;
  contextBuilder: ContextBuilder;
  tradeClient: TradeApiClient | null;
  statMapper: StatMapper | null;
  recommendationEngine: ItemRecommendationEngine | null;
  ninjaClient: PoeNinjaClient;
  getLuaClient: () => import("../pobLuaBridge.js").PoBLuaApiClient | null;
  ensureLuaClient: () => Promise<void>;
}

type ToolHandler = (args: Record<string, unknown> | undefined, deps: ToolRouterDependencies) => Promise<{
  content: Array<{ type: string; text: string }>;
}>;

function requireArgs(args: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!args) throw new Error("Missing arguments");
  return args;
}

function requireTradeClient(deps: ToolRouterDependencies): TradeApiClient {
  if (!deps.tradeClient) {
    throw new Error("Trade API is not enabled. Set POE_TRADE_ENABLED=true to enable.");
  }
  return deps.tradeClient;
}

function buildTradeContext(deps: ToolRouterDependencies) {
  return {
    tradeClient: requireTradeClient(deps),
    statMapper: deps.statMapper || undefined,
    ninjaClient: deps.ninjaClient,
  };
}

function luaBridgeContext(deps: ToolRouterDependencies) {
  return {
    getLuaClient: deps.getLuaClient,
    ensureLuaClient: deps.ensureLuaClient,
  };
}

const toolRegistry = new Map<string, ToolHandler>([
  // Build tools
  ["list_builds", (args, deps) =>
    handleListBuilds(deps.contextBuilder.buildHandlerContext())],
  ["analyze_build", (args, deps) => {
    const a = requireArgs(args);
    return handleAnalyzeBuild(deps.contextBuilder.buildHandlerContext(), a.build_name as string);
  }],
  ["compare_builds", (args, deps) => {
    const a = requireArgs(args);
    return handleCompareBuilds(deps.contextBuilder.buildHandlerContext(), a.build1 as string, a.build2 as string);
  }],
  ["get_build_stats", (args, deps) => {
    const a = requireArgs(args);
    return handleGetBuildStats(deps.contextBuilder.buildHandlerContext(), a.build_name as string);
  }],
  ["get_build_notes", (args, deps) => {
    if (!args?.build_name) throw new Error("Missing build_name");
    return handleGetBuildNotes(deps.contextBuilder.buildHandlerContext(), args.build_name as string);
  }],
  ["set_build_notes", (args, deps) => {
    if (!args?.build_name) throw new Error("Missing build_name");
    if (args?.notes == null) throw new Error("Missing notes");
    return handleSetBuildNotes(deps.contextBuilder.buildHandlerContext(), args.build_name as string, args.notes as string);
  }],

  // Watch tools
  ["start_watching", (args, deps) =>
    Promise.resolve(handleStartWatching(deps.contextBuilder.buildWatchContext()))],
  ["stop_watching", (args, deps) =>
    handleStopWatching(deps.contextBuilder.buildWatchContext())],
  ["get_recent_changes", (args, deps) =>
    Promise.resolve(handleGetRecentChanges(deps.contextBuilder.buildWatchContext(), args?.limit as number | undefined))],
  ["watch_status", (args, deps) =>
    Promise.resolve(handleWatchStatus(deps.contextBuilder.buildWatchContext()))],
  ["refresh_tree_data", (args, deps) =>
    handleRefreshTreeData(deps.contextBuilder.buildWatchContext(), args?.version as string | undefined)],

  // Tree tools
  ["compare_trees", (args, deps) => {
    const a = requireArgs(args);
    return handleCompareTrees(deps.contextBuilder.buildTreeContext(), a.build1 as string, a.build2 as string);
  }],
  ["get_nearby_nodes", (args, deps) =>
    handleGetNearbyNodes(
      deps.contextBuilder.buildTreeContext(),
      args?.build_name as string | undefined,
      args?.max_distance as number | undefined,
      args?.filter as string | undefined,
    )],
  ["find_path_to_node", (args, deps) => {
    const a = requireArgs(args);
    return handleFindPath(deps.contextBuilder.buildTreeContext(), a.build_name as string, a.target_node_id as string, a.show_alternatives as boolean | undefined);
  }],

  // Lua bridge tools
  ["lua_start", (args, deps) =>
    handleLuaStart(deps.contextBuilder.buildLuaContext())],
  ["lua_stop", (args, deps) =>
    handleLuaStop(deps.contextBuilder.buildLuaContext())],
  ["lua_new_build", (args, deps) =>
    handleLuaNewBuild(deps.contextBuilder.buildLuaContext(), args?.class_name as string | undefined, args?.ascendancy as string | undefined)],
  ["lua_save_build", (args, deps) => {
    const a = requireArgs(args);
    return handleLuaSaveBuild(deps.contextBuilder.buildLuaContext(), a.build_name as string);
  }],
  ["lua_load_build", (args, deps) => {
    const a = requireArgs(args);
    return handleLuaLoadBuild(deps.contextBuilder.buildLuaContext(), a.build_name as string | undefined, a.build_xml as string | undefined, a.name as string | undefined);
  }],
  ["set_character_level", async (args, deps) => {
    const a = requireArgs(args);
    const level = a.level as number;
    if (!level || level < 1 || level > 100) throw new Error("level must be between 1 and 100");
    await deps.ensureLuaClient();
    const luaClient = deps.getLuaClient();
    if (!luaClient) throw new Error("Lua bridge not active. Use lua_start first.");
    await luaClient.setLevel(level);
    const stats = await luaClient.getStats(['Life', 'EnergyShield', 'Mana', 'ManaUnreserved']);
    return {
      content: [{
        type: "text" as const,
        text: `✅ Character level set to ${level}.\n\nUpdated stats:\n  Life: ${stats.Life ?? '-'}  |  ES: ${stats.EnergyShield ?? '-'}  |  Mana: ${stats.Mana ?? '-'}  |  Mana Unreserved: ${stats.ManaUnreserved ?? '-'}`,
      }],
    };
  }],
  ["lua_get_stats", (args, deps) =>
    handleLuaGetStats(deps.contextBuilder.buildLuaContext(), args?.category as string | undefined)],
  ["lua_get_tree", (args, deps) =>
    handleLuaGetTree(deps.contextBuilder.buildLuaContext(), args?.include_node_ids as boolean | undefined)],
  ["lua_get_build_info", (args, deps) =>
    handleLuaGetBuildInfo(deps.contextBuilder.buildLuaContext())],
  ["lua_reload_build", (args, deps) =>
    handleLuaReloadBuild(deps.contextBuilder.buildLuaContext(), args?.build_name as string | undefined)],
  ["update_tree_delta", (args, deps) => {
    const a = requireArgs(args);
    return handleUpdateTreeDelta(deps.contextBuilder.buildLuaContext(), a.add_nodes as string[] | undefined, a.remove_nodes as string[] | undefined);
  }],
  ["create_spec", (args, deps) =>
    handleCreateSpec(deps.contextBuilder.buildLuaContext(), args?.title as string | undefined, args?.copyFrom as number | undefined, args?.activate as boolean | undefined)],
  ["list_specs", (args, deps) =>
    handleListSpecs(deps.contextBuilder.buildLuaContext())],
  ["select_spec", (args, deps) => {
    if (args?.index == null) throw new Error("Missing index");
    return handleSelectSpec(deps.contextBuilder.buildLuaContext(), args.index as number);
  }],
  ["delete_spec", (args, deps) => {
    if (args?.index == null) throw new Error("Missing index");
    return handleDeleteSpec(deps.contextBuilder.buildLuaContext(), args.index as number);
  }],
  ["rename_spec", (args, deps) => {
    if (!args?.index || !args?.title) throw new Error("Missing index or title");
    return handleRenameSpec(deps.contextBuilder.buildLuaContext(), args.index as number, args.title as string);
  }],
  ["list_item_sets", (args, deps) =>
    handleListItemSets(deps.contextBuilder.buildLuaContext())],
  ["select_item_set", (args, deps) => {
    if (args?.id == null) throw new Error("Missing id");
    return handleSelectItemSet(deps.contextBuilder.buildLuaContext(), args.id as number);
  }],

  // Configuration tools
  ["get_config", (args, deps) =>
    handleGetConfig(luaBridgeContext(deps))],
  ["set_config", (args, deps) => {
    const a = requireArgs(args);
    return handleSetConfig(luaBridgeContext(deps), {
      config_name: a.config_name as string,
      value: a.value as boolean | number | string,
    });
  }],
  ["set_enemy_stats", (args, deps) =>
    handleSetEnemyStats(luaBridgeContext(deps), {
      level: args?.level as number | undefined,
      fire_resist: args?.fire_resist as number | undefined,
      cold_resist: args?.cold_resist as number | undefined,
      lightning_resist: args?.lightning_resist as number | undefined,
      chaos_resist: args?.chaos_resist as number | undefined,
      armor: args?.armor as number | undefined,
      evasion: args?.evasion as number | undefined,
    })],
  ["save_config_preset", (args, deps) => {
    if (!args?.name) throw new Error("Missing preset name");
    return handleSaveConfigPreset(deps.contextBuilder.buildConfigPresetContext(), args.name as string);
  }],
  ["load_config_preset", (args, deps) => {
    if (!args?.name) throw new Error("Missing preset name");
    return handleLoadConfigPreset(deps.contextBuilder.buildConfigPresetContext(), args.name as string);
  }],
  ["list_config_presets", (args, deps) =>
    handleListConfigPresets(deps.contextBuilder.buildConfigPresetContext())],
  ["lua_set_tree", (args, deps) => {
    const a = requireArgs(args);
    return handleLuaSetTree(deps.contextBuilder.buildLuaContext(), a);
  }],
  ["search_tree_nodes", (args, deps) => {
    const a = requireArgs(args);
    const searchQuery = (a.query ?? a.keyword ?? a.q) as string | undefined;
    if (!searchQuery || String(searchQuery).trim().length === 0) {
      throw new Error(`search_tree_nodes requires a 'query' parameter (received args: ${JSON.stringify(Object.keys(a))})`);
    }
    return handleSearchTreeNodes(
      deps.contextBuilder.buildLuaContext(),
      String(searchQuery).trim(),
      a.node_type as string | undefined,
      (a.limit || a.max_results) as number | undefined,
      a.include_allocated as boolean | undefined,
    );
  }],

  // Item & Skill tools
  ["add_item", (args, deps) => {
    const a = requireArgs(args);
    return handleAddItem(deps.contextBuilder.buildItemSkillContext(), a.item_text as string, a.slot_name as string | undefined, a.no_auto_equip as boolean | undefined);
  }],
  ["get_equipped_items", (args, deps) =>
    handleGetEquippedItems(deps.contextBuilder.buildItemSkillContext())],
  ["toggle_flask", (args, deps) => {
    const a = requireArgs(args);
    return handleToggleFlask(deps.contextBuilder.buildItemSkillContext(), a.flask_number as number, a.active as boolean);
  }],
  ["get_skill_setup", (args, deps) =>
    handleGetSkillSetup(deps.contextBuilder.buildItemSkillContext(), args?.main_only !== false)],
  ["set_main_skill", (args, deps) => {
    const a = requireArgs(args);
    return handleSetMainSkill(deps.contextBuilder.buildItemSkillContext(), a.group_index as number, (a.active_skill_index ?? a.gem_index) as number | undefined, a.skill_part as number | undefined);
  }],
  ["create_socket_group", (args, deps) =>
    handleCreateSocketGroup(deps.contextBuilder.buildItemSkillContext(), args?.label as string | undefined, args?.slot as string | undefined, args?.enabled as boolean | undefined, args?.include_in_full_dps as boolean | undefined)],
  ["add_gem", (args, deps) => {
    const a = requireArgs(args);
    return handleAddGem(deps.contextBuilder.buildItemSkillContext(), a.group_index as number, a.gem_name as string, a.level as number | undefined, a.quality as number | undefined, (a.quality_type ?? a.quality_id) as string | undefined, a.enabled as boolean | undefined);
  }],
  ["set_gem_level", (args, deps) => {
    const a = requireArgs(args);
    return handleSetGemLevel(deps.contextBuilder.buildItemSkillContext(), a.group_index as number, a.gem_index as number, a.level as number);
  }],
  ["set_gem_quality", (args, deps) => {
    const a = requireArgs(args);
    return handleSetGemQuality(deps.contextBuilder.buildItemSkillContext(), a.group_index as number, a.gem_index as number, a.quality as number, (a.quality_type ?? a.quality_id) as string | undefined);
  }],
  ["remove_skill", (args, deps) => {
    const a = requireArgs(args);
    return handleRemoveSkill(deps.contextBuilder.buildItemSkillContext(), a.group_index as number);
  }],
  ["remove_gem", (args, deps) => {
    const a = requireArgs(args);
    return handleRemoveGem(deps.contextBuilder.buildItemSkillContext(), a.group_index as number, a.gem_index as number);
  }],
  ["setup_skill_with_gems", (args, deps) => {
    const a = requireArgs(args);
    const activeGemName = a.active_gem as string | undefined;
    const supportGemNames = a.support_gems as string[] | undefined;
    if (!activeGemName) throw new Error("active_gem is required");
    const gemsArray: Array<{name: string}> = [
      { name: activeGemName },
      ...(supportGemNames || []).map((n: string) => ({ name: n })),
    ];
    return handleSetupSkillWithGems(
      deps.contextBuilder.buildItemSkillContext(),
      gemsArray,
      a.label as string | undefined,
      a.slot as string | undefined,
      a.enabled as boolean | undefined,
      a.include_in_full_dps as boolean | undefined,
    );
  }],
  ["add_multiple_items", (args, deps) => {
    const a = requireArgs(args);
    return handleAddMultipleItems(deps.contextBuilder.buildItemSkillContext(), a.items as Array<{item_text: string; slot_name?: string}>);
  }],

  // Build Optimization tools
  ["analyze_defenses", (args, deps) =>
    handleAnalyzeDefenses(deps.contextBuilder.buildOptimizationContext(), args?.build_name as string | undefined)],
  ["suggest_optimal_nodes", (args, deps) => {
    const a = requireArgs(args);
    return handleSuggestOptimalNodes(deps.contextBuilder.buildOptimizationContext(), a.build_name as string, a.goal as string, (a.points_available || a.max_points) as number | undefined);
  }],
  ["optimize_tree", (args, deps) => {
    const a = requireArgs(args);
    return handleOptimizeTree(deps.contextBuilder.buildOptimizationContext(), a.build_name as string, a.goal as string, a.max_points as number | undefined, a.max_iterations as number | undefined, a.constraints as OptimizationConstraints | undefined);
  }],
  ["analyze_items", (args, deps) =>
    handleAnalyzeItems(deps.contextBuilder.buildAdvancedOptimizationContext(), args?.build_name as string | undefined)],
  ["optimize_skill_links", (args, deps) =>
    handleOptimizeSkillLinks(deps.contextBuilder.buildAdvancedOptimizationContext(), args?.build_name as string | undefined)],
  ["create_budget_build", (args, deps) => {
    const a = requireArgs(args);
    return handleCreateBudgetBuild(deps.contextBuilder.buildAdvancedOptimizationContext(), a.build_name as string, (a.budget_tier || 'league-start') as string);
  }],

  // Build Validation
  ["validate_build", (args, deps) =>
    handleValidateBuild(deps.contextBuilder.buildValidationContext(), { build_name: args?.build_name as string | undefined })],

  // Export and Persistence tools
  ["export_build", (args, deps) => {
    const a = requireArgs(args);
    return handleExportBuild(deps.contextBuilder.buildExportContext(), {
      build_name: a.build_name as string,
      output_name: a.output_name as string,
      output_directory: a.output_directory as string | undefined,
      overwrite: a.overwrite as boolean | undefined,
      notes: a.notes as string | undefined,
    });
  }],
  ["save_tree", (args, deps) => {
    const a = requireArgs(args);
    return handleSaveTree(deps.contextBuilder.buildExportContext(), {
      build_name: a.build_name as string,
      nodes: a.nodes as string[],
      mastery_effects: a.mastery_effects as Record<string, number> | undefined,
      backup: a.backup as boolean | undefined,
    });
  }],
  ["snapshot_build", (args, deps) => {
    const a = requireArgs(args);
    return handleSnapshotBuild(deps.contextBuilder.buildExportContext(), {
      build_name: a.build_name as string,
      description: a.description as string | undefined,
      tag: a.tag as string | undefined,
    });
  }],
  ["list_snapshots", (args, deps) => {
    const a = requireArgs(args);
    return handleListSnapshots(deps.contextBuilder.buildExportContext(), {
      build_name: a.build_name as string,
      limit: a.limit as number | undefined,
      tag_filter: a.tag_filter as string | undefined,
    });
  }],
  ["restore_snapshot", (args, deps) => {
    const a = requireArgs(args);
    return handleRestoreSnapshot(deps.contextBuilder.buildExportContext(), {
      build_name: a.build_name as string,
      snapshot_id: a.snapshot_id as string,
      backup_current: a.backup_current as boolean | undefined,
    });
  }],
  ["export_build_summary", (args, deps) =>
    handleExportBuildSummary(deps.contextBuilder.buildExportContext())],

  // Skill Gem Analysis tools
  ["analyze_skill_links", (args, deps) =>
    handleAnalyzeSkillLinks(deps.contextBuilder.buildSkillGemContext(), args)],
  ["suggest_support_gems", (args, deps) =>
    handleSuggestSupportGems(deps.contextBuilder.buildSkillGemContext(), args)],
  ["compare_gem_setups", (args, deps) => {
    const a = requireArgs(args);
    return handleCompareGemSetups(deps.contextBuilder.buildSkillGemContext(), {
      build_name: a.build_name as string,
      skill_index: a.skill_index as number | undefined,
      setups: a.setups as Array<{ name: string; gems: string[] }>,
    });
  }],
  ["validate_gem_quality", (args, deps) =>
    handleValidateGemQuality(deps.contextBuilder.buildSkillGemContext(), args)],
  ["find_optimal_links", (args, deps) => {
    const a = requireArgs(args);
    return handleFindOptimalLinks(deps.contextBuilder.buildSkillGemContext(), {
      build_name: a.build_name as string,
      skill_index: a.skill_index as number | undefined,
      link_count: a.link_count as number,
      budget: a.budget as "league_start" | "mid_league" | "endgame" | undefined,
      optimize_for: a.optimize_for as "dps" | "clear_speed" | "bossing" | "defense" | undefined,
    });
  }],
  ["gem_upgrade_path", (args, deps) =>
    handleGemUpgradePath(deps.contextBuilder.buildSkillGemContext(), args || {})],

  // Trade API tools
  ["search_trade_items", (args, deps) => {
    const a = requireArgs(args);
    if (!a.league) throw new Error("Missing required argument: league");
    return handleSearchTradeItems(buildTradeContext(deps), a as any);
  }],
  ["get_item_price", (args, deps) => {
    const a = requireArgs(args);
    return handleGetItemPrice(buildTradeContext(deps), {
      item_name: a.item_name as string,
      league: a.league as string | undefined,
      item_type: a.item_type as string | undefined,
      rarity: a.rarity as "unique" | "rare" | "magic" | "normal" | undefined,
    });
  }],
  ["get_leagues", (args, deps) => {
    requireTradeClient(deps);
    return handleGetLeagues(buildTradeContext(deps));
  }],
  ["search_stats", (args, deps) => {
    if (!deps.tradeClient || !deps.statMapper) {
      throw new Error("Trade API is not enabled. Set POE_TRADE_ENABLED=true to enable.");
    }
    const a = requireArgs(args);
    return handleSearchStats({
      tradeClient: deps.tradeClient,
      statMapper: deps.statMapper,
      ninjaClient: deps.ninjaClient,
    }, {
      query: a.query as string,
      limit: a.limit as number | undefined,
    });
  }],
  ["find_item_upgrades", (args, deps) => {
    if (!deps.tradeClient || !deps.recommendationEngine) {
      throw new Error("Trade API is not enabled. Set POE_TRADE_ENABLED=true to enable.");
    }
    const a = requireArgs(args);
    return handleFindItemUpgrades({
      ...buildTradeContext(deps),
      recommendationEngine: deps.recommendationEngine,
    }, a as any);
  }],
  ["find_resistance_gear", (args, deps) => {
    if (!deps.tradeClient || !deps.recommendationEngine) {
      throw new Error("Trade API is not enabled. Set POE_TRADE_ENABLED=true to enable.");
    }
    const a = requireArgs(args);
    return handleFindResistanceGear({
      ...buildTradeContext(deps),
      recommendationEngine: deps.recommendationEngine,
    }, a as any);
  }],
  ["compare_trade_items", (args, deps) => {
    const a = requireArgs(args);
    return handleCompareTradeItems({
      ...buildTradeContext(deps),
      recommendationEngine: deps.recommendationEngine || undefined,
    }, a as any);
  }],
  ["search_cluster_jewels", (args, deps) => {
    const a = requireArgs(args);
    return handleSearchClusterJewels(buildTradeContext(deps), a as any);
  }],
  ["generate_shopping_list", (args, deps) => {
    const a = requireArgs(args);
    const tc = buildTradeContext(deps);
    return handleGenerateShoppingList({
      buildService: deps.contextBuilder.buildHandlerContext().buildService,
      tradeClient: tc.tradeClient,
      statMapper: tc.statMapper,
      ninjaClient: tc.ninjaClient,
    }, {
      build_name: a.build_name as string,
      league: a.league as string,
      budget: a.budget as 'budget' | 'medium' | 'endgame' | undefined,
    });
  }],

  // poe.ninja API tools
  ["get_currency_rates", (args, deps) => {
    const a = requireArgs(args);
    return handleGetCurrencyRates({ ninjaClient: deps.ninjaClient }, a as any);
  }],
  ["find_arbitrage", (args, deps) => {
    const a = requireArgs(args);
    return handleFindArbitrage({ ninjaClient: deps.ninjaClient }, a as any);
  }],
  ["calculate_trading_profit", (args, deps) => {
    const a = requireArgs(args);
    return handleCalculateTradingProfit({ ninjaClient: deps.ninjaClient }, a as any);
  }],

  // Build Goals tools
  ["get_build_issues", async (args, deps) => {
    const { issues, stats } = await handleGetBuildIssues(luaBridgeContext(deps));
    return formatIssuesResponse(issues, stats);
  }],
  ["get_passive_upgrades", (args, deps) => {
    const focus = (args?.focus as 'dps' | 'defence' | 'both') || 'both';
    const maxResults = (args?.max_results as number) || 10;
    return handleGetPassiveUpgrades(luaBridgeContext(deps), focus, maxResults);
  }],
  ["analyze_build_cluster_jewels", (args, deps) =>
    handleAnalyzeBuildClusterJewels(luaBridgeContext(deps))],
  ["suggest_watchers_eye", (args, deps) =>
    handleSuggestWatchersEye(luaBridgeContext(deps))],
  ["check_boss_readiness", (args, deps) => {
    if (!args?.boss) throw new Error("Missing boss name");
    return handleCheckBossReadiness(luaBridgeContext(deps), args.boss as string);
  }],
  ["plan_leveling", (args, deps) =>
    handlePlanLeveling(luaBridgeContext(deps), args || {})],
  ["suggest_masteries", (args, deps) =>
    handleSuggestMasteries(luaBridgeContext(deps))],
]);

/**
 * Routes a tool call to its handler with appropriate context
 */
export async function routeToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
  deps: ToolRouterDependencies
): Promise<{ content: Array<{ type: string; text: string }> }> {
  deps.toolGate.checkGate(name);

  const handler = toolRegistry.get(name);
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return handler(args, deps);
}
