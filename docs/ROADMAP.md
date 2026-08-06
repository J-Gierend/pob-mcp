# Path of Building MCP Server - Development Roadmap

## Overview

Plan: basic file reading → advanced real-time PoB integration.

**Note:** Phases 1-4 superseded — see `docs/QUICK_REFERENCE.md`/`docs/PHASE4_DOCUMENTATION_UPDATE.md` (Phase 4 done, 91 tools, incl. Phase 6). Historical context only.

---

## Phase 1: File Watching (Near-term)

**Goal:** real-time updates on PoB save

### Features
Monitor builds dir, auto-reload, notify Claude, cache parsed builds.

### Technical Implementation
`fs.watch()`/`chokidar`; debounce; cache+invalidation; MCP notifications.

### New Tools/Capabilities
`watch_builds`, `get_recent_changes`, auto-notify on change.

### Success Criteria
Reflects <2s; no degradation w/ 100+ builds; handles rapid saves.

**Estimated Effort:** 2-3 days

---

## Phase 2: Enhanced Parsing (Near-term)

**Goal:** parse complex build data

### 2.1 Passive Skill Tree Parsing

**Features:** allocated nodes, jewel sockets+jewels, keystones/notables, points spent, Cluster Jewel setups.

**Data to Extract:**
```xml
<Tree>
  <Spec nodes="1234,5678,9012,...">
  <URL>https://www.pathofexile.com/passive-skill-tree/...</URL>
```

**New:** archetype from keystones (crit/RT/CI); def vs off points; common clusters (life wheel, crit multi).

### 2.2 Jewel Parsing

**Features:** regular+Cluster jewels, mods/notables, combos.

### 2.3 Flask Parsing

**Features:** types/rarities, mods/quality, uniques, synergies.

### 2.4 Configuration Parsing

**Features:** active config (Flasks up, Full Life), enemy config (Boss/Map Boss), conditional modifiers.

### Success Criteria
Full tree w/ keystones; jewels w/ mods; flasks+config captured.

**Estimated Effort:** 5-7 days

---

## Phase 3: Validation & Optimization (Near-term)

**Goal:** intelligent analysis+suggestions

### 3.1 Build Validation

**Features:** resist gaps(<75% maps), low life/ES, missing immunities, low accuracy, mana sustain; dangerous configs (no regen, missing defense, single-element).

### 3.2 Optimization Suggestions

**Features:** gem links (supports/breakpoints); gear (weak slots/uniques); tree (pathing/clusters); flasks (utility/mods).

### 3.3 Build Scoring

**Features:** completeness score, offense(DPS/clear), defense(EHP/mitigation), QoL(move speed/flask uptime).

### New Tools
`validate_build`, `suggest_improvements`, `score_build`, `compare_to_archetype`.

### Success Criteria
90%+ mistakes caught; actionable; scoring correlates w/ viability.

**Estimated Effort:** 7-10 days

---

## Phase 4: Advanced Item Parsing (Near-term)

**Goal:** deep item analysis+valuation

### 4.1 Item Mod Parsing

**Features:** mods(prefix/suffix), tiers/ranges, crafted mods, influences(Shaper/Elder), corruption implicits.

**Example Item Format:**
```xml
<Item>
Rare Helmet
Hubris Circlet
+90 to maximum Life
+45% to Fire Resistance
+38% to Cold Resistance
+12% to Chaos Resistance
</Item>
```

### 4.2 Item Valuation

**Features:** valuable combos, mirror-tier items, upgrade needs, crafting suggestions, missing key stats.

### 4.3 Unique Item Analysis

**Features:** unique special mods, build-enabling uniques, synergies, wrong-choice flags.

### 4.4 Item Set Analysis

**Features:** set bonuses, gear synergies, total-stat calc, conflicting-mod flags.

### New Tools
`analyze_item`, `suggest_upgrades`, `find_bottleneck`, `calculate_gear_value`.

### Success Criteria
Mods parsed/categorized; upgrade priorities accurate; combos detected.

**Estimated Effort:** 5-7 days

---

## Near-Term Summary

**Total Estimated Effort:** 19-27 days (4-6 weeks)

**Deliverables:** real-time monitoring, data extraction, validation+optimization, item analysis → comprehensive static-build tool.

---

## Phase 5: Lua API Integration (Long-term)

**Goal:** direct comms w/ running PoB app

### 5.1 Research & Design

**Tasks:** Lua API/plugin architecture, file structure (`/lua`, `/src`, `/runtime`), extension points, IPC design, JSON plan. **Deliverables:** design doc, PoC, IPC spec.

**Estimated Effort:** 5-7 days

### 5.2 PoB Plugin Development

**Goal:** plugin exposing live data

**Features:** live build load, calc API, on-demand trigger, change events, export.

**Plugin Capabilities:**
```lua
-- Example plugin API
PoBMCP.getCurrentBuild()
PoBMCP.getCalculatedStats()
PoBMCP.getSkillDPS(skillIndex)
PoBMCP.onBuildChanged(callback)
PoBMCP.modifyBuild(changes)
```

**Comms:** A)HTTP B)WebSocket C)named pipes. **Recommended:** HTTP(easiest).

**Plugin Structure:**
```
pob-mcp-plugin/
├── manifest.xml         # Plugin metadata
├── init.lua            # Plugin initialization
├── server.lua          # HTTP server (using LuaSocket)
├── api.lua             # API endpoints
└── utils.lua           # Helper functions
```

**Estimated Effort:** 10-14 days

### 5.3 MCP Server Integration

**Goal:** consume live PoB data

**Features:** connect to plugin HTTP, poll/webhook, connection state, file fallback, multi-instance.

**New Architecture:**
```
MCP Server
├── File Reader (existing)
├── PoB Client (new)
│   ├── HTTP client
│   ├── Connection manager
│   └── Data transformer
└── Unified Build Provider
    └── Returns build data from either source
```

**New:** real-time DPS calcs, instant modifications, live previews, "what-if" testing.

**Tools:** `pob_status`, `get_live_build`, `calculate_dps`, `modify_build`, `test_item_swap`.

**Estimated Effort:** 7-10 days

### 5.4 Advanced Live Features

**Goal:** leverage live PoB connection

**Features:**

1.**Interactive Editing**(tree/item edits, live impact) 2.**Optimization Engine**(tree/gem, upgrade sim, defense testing) 3.**Scenario Testing**(boss/clear DPS, levels, budgets, map mods) 4.**Import/Export**(PoB URLs, share, guides)

**Tools:** `optimize_tree`, `test_scenario`, `find_best_gems`, `import_build_url`(pobb.in/PoB URL), `generate_guide`.

**Estimated Effort:** 14-21 days

### 5.5 Testing & Documentation

**Tasks:** e2e w/ real PoB, perf(response/CPU), error handling, cross-platform, docs+guides.

**Estimated Effort:** 5-7 days

---

## Phase 5 Summary

**Total Estimated Effort:** 41-59 days (8-12 weeks)

**Deliverables:** PoB Lua plugin, real-time MCP integration, interactive editing, advanced optimization/testing, docs.

---

## Complete Roadmap Timeline

1 File Watching 2-3d(cum 2-3d) · 2 Enhanced Parsing 5-7d(cum 7-10d) · 3 Validation&Optimization 7-10d(cum 14-20 d) · 4 Advanced Item Parsing 5-7d(cum 19-27d) · 5 Lua API Integration 41-59d(cum 60-86d)

**Total Project Timeline:** 60-86 days (3-4 months)

---

## Implementation Order Rationale

1.File Watching(quick win) 2.Enhanced Parsing(validation foundation) 3.Validation&Optimization(value w/existing data) 4.Item Parsing(completes static analysis) 5.Lua Integration(major undertaking, transformative)

---

## Success Metrics

### Near-term (Phases 1-4)
Updates <2s; 100% data extracted+parsed; 90%+ validation accuracy; suggestions for 95% of builds; "This is useful!"

### Long-term (Phase 5)
Connection <1s; instant modifications; measurable optimization gains; zero crashes; "This is game-changing!"

---

## Risk Mitigation

### Technical Risks
PoB updates break plugin→version/compat checks. Lua API limits→research phase. Performance→caching/debouncing/async. Cross-platform→test early.

### Product Risks
Feature creep→stick to roadmap. Scope too large→standalone-value phases. User-needs mismatch→feedback each phase.

---

## Future Considerations (Beyond Phase 5)

poe.ninja pricing, PoE Wiki item/skill info, cloud build sharing, AI build generation, meta build DB, economy tracking, build analytics.

---

## Getting Started

**Status:** Phase 0 complete. **Next:** Phase 1 - File Watching.

**To start development:**
```bash
# Create feature branch
git checkout -b feature/file-watching

# Install additional dependencies (if needed)
npm install chokidar --save

# Begin implementation in src/index.ts
```
