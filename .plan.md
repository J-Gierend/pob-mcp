# pob-mcp Full Repair Plan

## Context
Forked from ianderse/pob-mcp to J-Gierend/pob-mcp. This is a Path of Building MCP server (TypeScript, 22k LOC, 91 tools, Lua bridge). Verified via 10 parallel verifiers — 8 failures found. This plan repairs everything.

## Phase 1: Security Hardening (CRITICAL — do first)

### 1.1 Create path sanitization utility
- Create `src/utils/pathSanitizer.ts`
- Implement `sanitizeBuildName(name: string, baseDir: string): string` that:
  - Rejects `..` path components
  - Rejects absolute paths
  - Rejects null bytes
  - Normalizes separators
  - Resolves the final path and asserts it's within `baseDir`
  - Throws a clear error on violation
- Write tests FIRST (TDD): `tests/unit/pathSanitizer.test.ts`
  - Test: normal build name passes
  - Test: `../../etc/passwd` rejected
  - Test: `/absolute/path` rejected
  - Test: `foo\0bar` rejected
  - Test: `subdir/build.xml` passes (allow subdirs within builds dir)
  - Test: Windows-style `..\\..\\` rejected

### 1.2 Apply sanitization across all handlers
Every `path.join(pobDirectory, buildName)` or similar must go through `sanitizeBuildName()`. Files to patch (15+ locations):
- `src/services/buildService.ts:64` — getBuild
- `src/handlers/luaHandlers.ts:82,113,498` — loadBuild, saveBuild
- `src/handlers/configHandlers.ts:22` — getConfig
- `src/handlers/optimizationHandlers.ts:35,82,247` — all optimization handlers
- `src/handlers/validationHandlers.ts:54` — validateBuild
- `src/handlers/buildHandlers.ts:55,268` — analyzeBuild, compareBuild
- `src/services/buildExportService.ts:93,155,168,279,303,384` — export/snapshot operations
- `src/handlers/advancedOptimizationHandlers.ts:43,164` — advanced opts
- After patching, run full test suite to confirm nothing breaks

## Phase 2: Test Repair

### 2.1 Fix compile errors in stale tests
- `tests/contextBuilder.test.ts` — update imports/types to match refactored src
- `tests/unit/buildHandlers.test.ts` — update to match current handler signatures
- `tests/unit/pobLuaBridge.simple.test.ts` — update to match current bridge API

### 2.2 Fix assertion failures
- `tests/unit/validationService.test.ts` — 4 failures on immunity/score checks. Read the current validationService logic, update assertions to match actual behavior (or fix the service if tests were correct)
- `tests/unit/pobLuaBridge.test.ts` — 6 failures on undefined results. Likely mock responses outdated.
- `tests/treeService.test.ts` — minor assertion failures

### 2.3 Verify all 173 tests pass
- Run `npm test` — all green required before proceeding

## Phase 3: Dead Code Removal

### 3.1 Remove entirely unused modules
- `src/nodeOptimizer.ts` (414 lines) — never imported anywhere. Delete.
- Check if `nodeOptimizer` was supposed to be wired into `optimizationHandlers.ts` — if so, it's dead code from an incomplete integration. Either wire it in or delete it.

### 3.2 Remove unused exports from partially-used modules
- `src/treeOptimizer.ts` — only `OptimizationConstraints` type is imported. Move the type to `src/types/` and delete the rest (383 lines of unused functions)
- `src/server/responseUtils.ts:61` — `formatTimeAgo` is unused (duplicate in watchHandlers.ts). Remove.
- `src/itemAnalyzer.ts:87,223` — `analyzeItemSlot` and `checkResistances` never imported. Remove.
- `src/skillLinkOptimizer.ts:216,283,290` — `detectSkillType`, `isSupportGem`, `analyzeSkillGroup` never imported. Remove.

### 3.3 Run tests after each removal to confirm nothing breaks

## Phase 4: Documentation Sync

### 4.1 Fix README.md
- Fix install path: `cd pob-mcp-server` → `cd pob-mcp` (or just remove the cd)
- Update tool count: 71 → actual count (grep registered tools from toolSchemas.ts)
- Remove phantom env vars: `POB_API_TCP`, `POB_API_TCP_HOST`, `POB_API_TCP_PORT`, `POE_TRADE_LEAGUE` (or add them to code if intended)
- Remove phantom tools: `allocate_nodes`, `test_allocation`, `plan_tree`
- Fix misnamed tool: `analyze_cluster_jewels` → `analyze_build_cluster_jewels`
- Add the 24 undocumented tools to the appropriate tables

### 4.2 Fix docs/QUICK_REFERENCE.md
- Fix tool count
- Fix Ranger/Witch ascendancy IDs (currently swapped)
- Remove references to `get_build_xml` (doesn't exist)

### 4.3 Fix docs/QUICKSTART.md
- Remove reference to nonexistent `src/test.ts`
- Update project structure to match reality
- Move "Future Ideas" items that are now implemented to a "Done" section or remove them
- Fix placeholder GitHub URL

### 4.4 Fix docs/ROADMAP.md
- Update phase statuses to reflect current state

## Phase 5: Cleanup

### 5.1 Remove coverage/ from git tracking
- The cleanup verifier already removed it from the index and added to .gitignore
- Verify `.gitignore` includes `coverage/`
- Verify `jest-output.json` is also gitignored (build artifact)

### 5.2 Archive stale design docs
- Move to `docs/archive/`: `PHASE_7_DESIGN.md`, `PHASE_8_DESIGN.md`, `PHASE_9_DESIGN.md`, `PHASE_11_DESIGN.md`
- Move completed phase docs: `docs/PHASE_CONFIGURATION_STATE_COMPLETE.md`, `docs/PHASE_FLASK_ANALYSIS_COMPLETE.md`, `docs/PHASE_JEWEL_PARSING_COMPLETE.md`
- Move `docs/plans/2026-03-03-feature-additions.md` (all 10 tasks done)
- Also archive from root: `PLACEHOLDERS_AUDIT.md`, `REFACTORING_OPPORTUNITIES.md`, `TRADE_API_IMPLEMENTATION_PLAN.md`

### 5.3 Remove duplicate ToolResponse type
- `src/server/responseUtils.ts` and `src/server/toolRouter.ts` both define `ToolResponse`
- Keep one, import in the other

## Phase 6: Complexity Refactoring (Surgical)

### 6.1 toolRouter.ts — Replace switch with dispatch table
- Create a `Map<string, (args: any) => Promise<ToolResponse>>` registry
- Each handler registers its tool names at import time
- `routeToolCall` becomes: `const handler = registry.get(toolName); if (!handler) throw; return handler(args);`
- This eliminates the 60+ case switch and drops cyclomatic complexity to ~3

### 6.2 Extract tradeContext builder
- The same tradeContext construction pattern appears 7 times in trade tool cases
- Extract `buildTradeContext(args)` helper in tradeHandlers or a shared util
- Replace all 7 occurrences

### 6.3 skillGemService.ts — Externalize data
- Move `initializeGemDatabase` data (270 lines) to `src/data/gem-database.json`
- Move `initializeArchetypes` data (150 lines) to `src/data/archetypes.json`
- Load at init time with `JSON.parse(readFileSync(...))`
- This is optional/nice-to-have — deprioritize if time constrained

### 6.4 buildService.ts split (optional, lowest priority)
- Only if time permits — this is the riskiest refactor
- Extract flask logic to `src/services/flaskService.ts`
- Extract jewel logic to `src/services/jewelService.ts`
- Keep caching/core build parsing in buildService

## Completion Criteria
- All tests pass (0 failures)
- No path traversal vulnerabilities (sanitization on all file operations)
- No dead code modules (nodeOptimizer.ts deleted, treeOptimizer.ts trimmed)
- README tool count matches reality, no phantom tools/env vars
- No stale design docs in project root
- coverage/ not tracked in git
- toolRouter uses dispatch table instead of switch
- Commit and push to J-Gierend/pob-mcp

## PR-Worthy Changes (submit back to upstream after fork is clean)
1. Security: path sanitization (Phase 1) — standalone PR
2. Dead code removal (Phase 3) — standalone PR
3. Doc fixes (Phase 4) — standalone PR
