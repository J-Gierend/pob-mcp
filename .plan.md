# pob-mcp Phase 2: Docs, Cleanup, Refactoring

## Context
Continuation of plans/01-full-repair.md. Security hardening, test repair, and dead code removal (nodeOptimizer.ts) are done. This plan covers the remaining work: documentation sync, stale file archival, remaining dead code, and complexity refactoring.

## Phase 1: Documentation Sync

### 1.1 Fix README.md
- Fix install path: `cd pob-mcp-server` should be `cd pob-mcp`
- Update tool count to match reality: grep all tool names from `src/server/toolSchemas.ts` (look for tool name registrations), count them, update README
- Remove 4 phantom env vars that don't exist in code: `POB_API_TCP`, `POB_API_TCP_HOST`, `POB_API_TCP_PORT`, `POE_TRADE_LEAGUE` — search codebase first to confirm they're unused
- Remove 3 phantom tools that don't exist: `allocate_nodes`, `test_allocation`, `plan_tree`
- Fix misnamed tool: `analyze_cluster_jewels` should be `analyze_build_cluster_jewels` (verify actual name in toolSchemas.ts)
- Add all undocumented tools to the appropriate tables — cross-reference toolSchemas.ts registrations against README tool lists

### 1.2 Fix docs/QUICK_REFERENCE.md
- Update tool count to match reality
- Fix Ranger/Witch ascendancy IDs (they're swapped — verify correct values against treeService.ts or similar)
- Remove reference to nonexistent `get_build_xml` tool

### 1.3 Fix docs/QUICKSTART.md
- Remove reference to nonexistent `src/test.ts`
- Update project file structure to match current reality (list actual directories/files)
- Items listed as "Future Ideas" that are already implemented should be moved to a completed section or removed
- Fix placeholder GitHub URL to point to actual repo

### 1.4 Fix docs/ROADMAP.md
- Update phase statuses to reflect what's actually done

## Phase 2: Stale File Archival

### 2.1 Create archive directory
```bash
mkdir -p docs/archive
```

### 2.2 Move stale design docs from root
Move these completed design docs to `docs/archive/`:
- `PHASE_7_DESIGN.md`
- `PHASE_8_DESIGN.md`
- `PHASE_9_DESIGN.md`
- `PHASE_11_DESIGN.md`
- `PLACEHOLDERS_AUDIT.md`
- `REFACTORING_OPPORTUNITIES.md`
- `TRADE_API_IMPLEMENTATION_PLAN.md`

### 2.3 Move completed phase docs
Move from `docs/` to `docs/archive/`:
- `PHASE_CONFIGURATION_STATE_COMPLETE.md`
- `PHASE_FLASK_ANALYSIS_COMPLETE.md`
- `PHASE_JEWEL_PARSING_COMPLETE.md`

### 2.4 Move completed plan
- `docs/plans/2026-03-03-feature-additions.md` → `docs/archive/`

### 2.5 Gitignore build artifacts
Ensure `.gitignore` includes:
- `coverage/`
- `jest-output.json`
- `.plan.md`

## Phase 3: Remaining Dead Code Cleanup

### 3.1 treeOptimizer.ts cleanup
- Only `OptimizationConstraints` type is imported from this file
- Move `OptimizationConstraints` to `src/types/` (e.g. `src/types/optimization.ts`) or inline it where used
- Delete the rest of `src/treeOptimizer.ts` (383 lines of unused functions: calculateScore, isLowLifeBuild, meetsConstraints, getGoalDescription, isRequiredForPath, findRemovableNodes, formatOptimizationResult, parseOptimizationGoal)
- Update the import in whatever file uses `OptimizationConstraints`

### 3.2 Remove unused exports from partially-used modules
- `src/server/responseUtils.ts` — remove `formatTimeAgo` (duplicate exists in watchHandlers.ts)
- `src/itemAnalyzer.ts` — remove `analyzeItemSlot` and `checkResistances` (never imported)
- `src/skillLinkOptimizer.ts` — remove `detectSkillType`, `isSupportGem`, `analyzeSkillGroup` (never imported)

### 3.3 Fix duplicate ToolResponse type
- Both `src/server/responseUtils.ts` and `src/server/toolRouter.ts` define `ToolResponse`
- Keep one canonical definition, import in the other

### 3.4 Run full test suite after each removal

## Phase 4: Complexity Refactoring

### 4.1 toolRouter.ts — Replace switch with dispatch table
Current state: `routeToolCall` has a 60+ case switch statement (cyclomatic complexity ~65).

Refactor to:
```typescript
// Create a registry map
const toolRegistry = new Map<string, (args: any, context: any) => Promise<ToolResponse>>();

// Each handler file registers its tools
// In buildHandlers.ts:
export function registerBuildTools(registry: Map<...>) {
  registry.set('analyze_build', (args, ctx) => analyzeBuild(args, ctx));
  registry.set('compare_builds', (args, ctx) => compareBuilds(args, ctx));
  // ...
}

// In toolRouter.ts:
export async function routeToolCall(name: string, args: any): Promise<ToolResponse> {
  const handler = toolRegistry.get(name);
  if (!handler) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }
  return handler(args, context);
}
```

This eliminates the switch and drops cyclomatic complexity to ~3. Each handler file owns its registrations.

### 4.2 Extract tradeContext builder
The same tradeContext construction pattern is duplicated 7 times across trade tool cases in toolRouter.ts:
```typescript
const tradeContext = { tradeService, pobDirectory, ... };
```
Extract to a helper: `buildTradeContext(args)` in tradeHandlers.ts or a shared util. Replace all 7 occurrences.

### 4.3 Run full test suite after refactoring

## Completion Criteria
- README tool count matches `toolSchemas.ts` exactly
- No phantom tools or env vars in docs
- All stale design docs archived
- `treeOptimizer.ts` deleted (type moved)
- No unused exports in itemAnalyzer, skillLinkOptimizer, responseUtils
- Single canonical ToolResponse type
- toolRouter uses dispatch table (cyclomatic complexity < 10)
- tradeContext construction not duplicated
- All tests pass
- Commit and push to J-Gierend/pob-mcp
