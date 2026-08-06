# PoB MCP Server Testing Guide

Test cases for all PoB MCP server features, focus on Phase 3 (Lua bridge integration).

## Prerequisites

### For XML-Only Features
PoB Community Fork installed; 2-3 test builds in PoB directory; MCP server configured in Claude Desktop.

### For Lua Bridge Features (Phase 3)
LuaJIT installed and in PATH (`luajit` available); PoB API Fork cloned: https://github.com/Dulluhan/pob-api; env vars configured (see Configuration below).

## Configuration for Testing

### Basic Configuration (XML Features Only)
```json
{
  "mcpServers": {
    "pob": {
      "command": "node",
      "args": ["/absolute/path/to/pob-mcp-server/build/index.js"],
      "env": {
        "POB_DIRECTORY": "/path/to/your/Path of Building/Builds"
      }
    }
  }
}
```

### Full Configuration (Including Lua Bridge)
```json
{
  "mcpServers": {
    "pob": {
      "command": "node",
      "args": ["/absolute/path/to/pob-mcp-server/build/index.js"],
      "env": {
        "POB_DIRECTORY": "/path/to/your/Path of Building/Builds",
        "POB_LUA_ENABLED": "true",
        "POB_FORK_PATH": "/path/to/PathOfBuilding/src",
        "POB_CMD": "luajit",
        "POB_TIMEOUT_MS": "10000"
      }
    }
  }
}
```

### TCP Mode Configuration (For Testing with PoB GUI)
```json
{
  "mcpServers": {
    "pob": {
      "command": "node",
      "args": ["/absolute/path/to/pob-mcp-server/build/index.js"],
      "env": {
        "POB_DIRECTORY": "/path/to/your/Path of Building/Builds",
        "POB_LUA_ENABLED": "true",
        "POB_API_TCP": "true",
        "POB_API_TCP_HOST": "127.0.0.1",
        "POB_API_TCP_PORT": "31337"
      }
    }
  }
}
```

## Phase 1: XML-Based Features

### Test 1.1: List Builds
**Obj:** build listing. **Steps:** ask "List all my Path of Building builds". **Expect:** all .xml in POB_DIRECTORY listed, names+subdirs, clear format. **Variations:** "Show me my PoE builds"/"What builds do I have?"

### Test 1.2: Analyze Single Build
**Obj:** full build analysis. **Steps:** ask "Analyze my [BuildName.xml] build". **Expect:** class/ascendancy, level, key stats(Life/ES/DPS/resists), skills+supports, items per slot, notes if present. **Variations:** build types(melee/caster/bow/minion); levels; incomplete builds

### Test 1.3: Compare Two Builds
**Obj:** side-by-side comparison. **Steps:** ask "Compare [Build1.xml] and [Build2.xml]". **Expect:** both analyzed, differences highlighted, stats compared numerically, class/ascendancy noted. **Variations:** similar builds(same class); different classes

### Test 1.4: Get Build Stats
**Obj:** quick stat retrieval. **Steps:** ask "What are the stats for [BuildName.xml]?". **Expect:** all numerical stats, clear format, no parsing errors

### Test 1.5: File Watching
**Obj:** real-time change detection. **Steps:** "Start watching my PoB builds" → modify+save a build → "What changed recently?" → "Stop watching". **Expect:** monitoring confirmed, changes detected <2s, cache invalidated, timestamps shown, clean stop

## Phase 2: Passive Tree Analysis

### Test 2.1: Node Extraction
**Obj:** tree data extraction. **Steps:** ask "Show me the passive tree from [BuildName.xml]". **Expect:** allocated node IDs, jewel slots, keystones, tree metadata(class/ascendancy)

### Test 2.2: Jewel Information
**Obj:** jewel data extraction. **Steps:** ask "What jewels are in [BuildName.xml]?". **Expect:** jewel slots, names+mods, tree position

## Phase 3: Lua Bridge Features

### Setup: Initialize Lua Bridge

**Steps:** ensure `POB_LUA_ENABLED=true`; ask "Start the PoB Lua bridge"; verify connection. **Expect:** success message (stdio or TCP mode), no missing-luajit/fork-path errors.

**Common Issues:**
- `ENOENT`: luajit not found in PATH → Install LuaJIT
- `Timed out waiting for response`: Fork path incorrect → Check POB_FORK_PATH
- `Module not found`: Missing PoB modules → Ensure complete fork clone

### Test 3.1: Load Build into Lua Engine
**Obj:** load XML build. **Steps:** ask "Load my [BuildName.xml] into the Lua bridge". **Expect:** loads, engine initializes, no parsing errors. **Variations:** item configs; cluster jewels; unique items

### Test 3.2: Get Calculated Stats
**Obj:** high-fidelity stats. **Steps:** ask "Get the calculated stats from the Lua bridge". **Expect:** full stat list, matches PoB GUI, defensive/offensive/utility. **Variations:** specific stats; all stats; vs XML-parsed (more accurate)

### Test 3.3: Get Passive Tree
**Obj:** extract tree data. **Steps:** ask "Get the passive tree from the Lua bridge". **Expect:** tree version, classId+ascendClassId, allocated node IDs, mastery effects, matches `get_tree` API

### Test 3.4: Modify Passive Tree
**Obj:** update tree+recalc. **Steps:** ask "Add nodes [65834, 65824] to the tree"; get stats. **Expect:** tree updates, stats recalc, XML file NOT modified. **Variations:** defensive nodes(life/ES↑); damage nodes(DPS↑); keystones(major changes)

### Test 3.5: Compare Trees (Phase 3 Feature)
**Obj:** compare tree allocations. **Steps:** ask "Compare my current tree with adding nodes [list] and removing nodes [list]". **Expect:** both calculated, before→after diff shown, gains/losses clear, readable format.

**Test Scenarios**:

#### Scenario A: Defensive Upgrade
```
Prompt: "Compare what happens if I add Constitution node (26725) and remove a 10 STR node"
Expected: +Life increase shown, minimal other changes
```

#### Scenario B: Offensive Upgrade
```
Prompt: "Compare adding these damage nodes [list] vs current tree"
Expected: DPS increase shown, possible defensive losses
```

#### Scenario C: Keystone Test
```
Prompt: "Compare adding Resolute Technique (59859) to my tree"
Expected: Accuracy changes, crit chance zeroed, hit chance 100%
```

### Test 3.6: What-If Allocation Testing
**Obj:** preview w/o persisting. **Steps:** ask "Preview allocating nodes [65834, 65824, 65826] without changing my build"; then "Get current stats" (verify unchanged). **Expect:** preview shows modified stats, build unchanged, multiple sequential previews OK, no side effects.

**Test Scenarios**:

#### Scenario A: Life vs DPS Trade-off
```
Prompt: "Preview removing these damage nodes [list] and adding these life nodes [list]"
Expected: Shows life gain and DPS loss clearly
```

#### Scenario B: Resistance Capping
```
Prompt: "Preview adding these resistance nodes to cap my resists"
Expected: Shows before/after resistance values
```

#### Scenario C: Chain Multiple Previews
```
1. "Preview adding nodes [set A]"
2. "Preview adding nodes [set B]"
3. "Which preview gives more DPS?"
Expected: Can compare multiple what-if scenarios
```

### Test 3.7: Build Planning from Scratch
**Obj:** node recs for new builds. **Steps:** ask "Help me plan a Berserker build focusing on two-handed axes and rage". **Expect:** class+ascendancy ID'd(Marauder/Berserker), starting nodes, notable clusters, path suggestions, relevant keystones.

**Test Scenarios**:

#### Scenario A: Spell Caster
```
Prompt: "Plan a Cold DoT Occultist build"
Expected:
- Witch/Occultist
- Cold damage clusters
- DoT multiplier nodes
- ES/life nodes
- Cursed nodes
```

#### Scenario B: Attack Build
```
Prompt: "Plan a Crit Bow Deadeye build"
Expected:
- Ranger/Deadeye
- Bow damage nodes
- Crit multiplier
- Attack speed
- Projectile nodes
```

#### Scenario C: Tanky Build
```
Prompt: "Plan a max block Gladiator"
Expected:
- Duelist/Gladiator
- Block chance nodes
- Life nodes
- Armor clusters
- Notable block nodes highlighted
```

### Test 3.8: End-to-End Integration Test
**Obj:** complete load-to-optimize workflow.

**Complete Workflow:** 1."Start the PoB Lua bridge" 2."Load my [BuildName.xml]" 3."Get the current stats" 4."Show me the passive tree" 5."Compare adding these defensive nodes [list]" 6."Preview those changes" 7."Compare that with adding offensive nodes [list] instead" 8."Which option gives better EHP?" 9."Stop the Lua bridge"

**Expect:** all steps succeed, stats consistent across calls, comparisons accurate, clean shutdown

### Test 3.9: Error Handling
**Obj:** graceful error handling.

**Test Cases**:

#### Test 3.9a: Invalid Node IDs
```
Prompt: "Add node 999999999 to the tree"
Expected: Clear error message about invalid node
```

#### Test 3.9b: Lua Bridge Not Started
```
1. Ensure bridge is stopped
2. Ask: "Get stats from Lua bridge"
Expected: Error message prompting to start bridge first
```

#### Test 3.9c: Build Not Loaded
```
1. Start bridge
2. Don't load a build
3. Ask: "Get stats"
Expected: Error indicating no build loaded
```

#### Test 3.9d: Timeout Recovery
```
1. Cause a timeout (e.g., very large tree operation)
Expected:
- Timeout error message
- Process killed
- Can restart bridge with lua_start
```

### Test 3.10: TCP Mode Testing
**Obj:** connection to PoB GUI.

**Prerequisites**:
- Windows machine with PoB GUI installed
- Environment variable `POB_API_TCP=1` set before launching PoB
- TCP server running in PoB (status bar shows "API: Listening on port 31337")

**Steps:** configure TCP settings; ask "Start the PoB Lua bridge"; verify TCP connection; run operations (load build, get stats). **Expect:** connects to GUI, ops work same as stdio mode, can interact with build already open

## Phase 4: Item & Skill Management Tests

### Test 4.1: Add Item
**Obj:** item addition from PoE text. **Steps:** get current DPS ("Get stats"); ask "Add this weapon: [paste item text]"; get new DPS.

**Item Text Example**:
```
Rarity: Rare
Death Spiral
Thicket Bow
--------
Quality: +20%
Physical Damage: 78-145
Critical Strike Chance: 6.5%
Attacks per Second: 1.98
--------
+98 to Dexterity
Adds 15 to 28 Physical Damage
+35% to Global Critical Strike Multiplier
+18% to Attack Speed
```

**Expect:** item added, ID+name returned, slot ID'd(e.g. "Weapon 1"), stats recalc, DPS reflects change. **Variations:** no slot(auto-equip); specific slot("Add to Weapon 2"); `no_auto_equip`; invalid text(graceful error)

### Test 4.2: Get Equipped Items
**Obj:** view equipped items. **Steps:** ask "What items do I have equipped?". **Expect:** all slots listed, empty as "(empty)", names, base types, rarity, flask activation shown. **Variations:** full/no/partial equipment; flask activation check

### Test 4.3: Toggle Flask
**Obj:** activate/deactivate flask toggle+stat verify. **Steps:** get crit chance; ask "Activate flask 1"(Diamond Flask); get new crit chance; "Deactivate flask 1"; verify reverts. **Expect:** toggles work, clear confirmation, stats recalc match flask effect, multi-flask toggle OK. **Variations:** all 5 flasks; repeated toggles; invalid number(0, 6, -1)→error; flask types(life/mana/utility)

### Test 4.4: Get Skill Setup
**Obj:** view skill config. **Steps:** ask "Show me my skill setup". **Expect:** socket groups, main group, skills per group, labels if present, slot locations(e.g. "Body Armour"), enabled status, "Contributes to Full DPS" flag, proper names. **Variations:** 1 group; multiple groups; labeled; disabled

### Test 4.5: Set Main Skill
**Obj:** main skill change+DPS recalc. **Steps:** get skill setup, current DPS; "Set main skill to socket group 2"; new DPS; switch back("...group 1"). **Expect:** switches successfully, confirms selection, recalcs DPS, free switching. **Variations:** 3+ skills; specific skill index; invalid group→error; multi-part skills(skill_part param)

### Test 4.6: Item + Flask Workflow
**Obj:** combined item+flask operations.

**Complete Workflow:** 1."Start bridge and load build" 2."What items do I have equipped?" 3."Get current stats" 4."Add this weapon: [item text]" 5."Activate diamond flask" 6."Activate quicksilver flask" 7."Get stats" 8."What's the DPS increase?"

**Expect:** all ops succeed in sequence, stats update per change, final stats reflect all mods, DPS delta calculable

### Test 4.7: Complete Build Modification
**Obj:** e2e build modification test.

**Complete Workflow:** 1."Start bridge" 2."Load template build" 3."Set tree to [node list]" 4."Add weapon: [item]" 5."Add body armour: [item]" 6."Add helmet: [item]" 7."Get skill setup" 8."Set main skill to group 1" 9."Activate flasks 1, 2, 3" 10."Get final stats"

**Expect:** all mods succeed, stats update progressively, final build reflects all changes, no corruption, full stats retrievable

### Test 4.8: Error Handling - Items
**Obj:** graceful error handling for items.

**Test Cases**:

#### Test 4.8a: Invalid Item Text
```
Prompt: "Add this item: not valid item text"
Expected: Clear error message about invalid format
```

#### Test 4.8b: Bridge Not Started
```
1. Don't start bridge
2. Ask: "Add this item: [text]"
Expected: Error prompting to start bridge first
```

#### Test 4.8c: No Build Loaded
```
1. Start bridge
2. Don't load build
3. Ask: "Get equipped items"
Expected: Error indicating no build loaded
```

#### Test 4.8d: Invalid Slot Name
```
Prompt: "Add item to InvalidSlot: [text]"
Expected: Error or warning about invalid slot
```

### Test 4.9: Error Handling - Skills & Flasks
**Obj:** verify error handling for skill/flask operations.

**Test Cases**:

#### Test 4.9a: Invalid Flask Number
```
Prompt: "Activate flask 6"
Expected: Error that flask_number must be 1-5
```

#### Test 4.9b: Invalid Socket Group
```
Prompt: "Set main skill to socket group 99"
Expected: Error about invalid socket group
```

#### Test 4.9c: Bridge Not Started
```
1. Don't start bridge
2. Ask: "Get skill setup"
Expected: Error prompting to start bridge
```

### Test 4.10: Integration with Phase 3
**Obj:** Phase 4 tools work w/ Phase 3.

**Complete Workflow**:
1. Start bridge, load build
2. Get baseline stats
3. Modify passive tree (Phase 3)
4. Add items (Phase 4)
5. Toggle flasks (Phase 4)
6. Preview additional tree changes (Phase 3)
7. Compare with/without flask activation
8. Set different main skill (Phase 4)
9. Compare DPS across all variations

**Expect:** Phase 3+4 tools work seamlessly together, stats consistent, no tree/item conflicts, all features combinable in one session

## Phase 6: Optimization Tests

### Test 6.1: Defensive Analysis
**Obj:** ID defensive gaps+fixes. **Steps:** load low-resist/life build; ask "Analyze defenses for [BuildName.xml]". **Expect:** resistances/life/ES/mitigation/sustain summary; prioritized actionable recs

### Test 6.2: Suggest Optimal Nodes
**Obj:** ranked node recs. **Steps:** ask "Suggest nodes to maximize life for [BuildName.xml]". **Expect:** top recs ranked by efficiency(gain/point), path+target ID, projected improvements

### Test 6.3: Full Tree Optimization
**Obj:** optimize under constraints. **Steps:** ask "Optimize tree for balanced goals on [BuildName.xml] with minLife 4000". **Expect:** optimized allocation, constraints respected (e.g., min life/resists), clear change description

## Performance Testing

### Test P.1: Build Load Time
**Obj:** measure load time. **Steps:** small(<10 items)/medium(full gear)/large(cluster jewels) builds; note timestamps. **Expect:** small<500ms, medium<1s, large<2s

### Test P.2: Stat Calculation Time
**Obj:** measure calc overhead. **Steps:** request stats 5x; note timestamps. **Expect:** first=calc time, rest cached(<100ms)

### Test P.3: What-If Scenarios
**Obj:** measure preview calc time. **Steps:** test 10 what-if node additions; measure each. **Expect:** each <500ms, no leaks, consistent

## Integration Testing

### Test I.1: Multi-Tool Workflow
**Obj:** test tools working together.

**Workflow**:
1. List builds (XML)
2. Analyze build (XML)
3. Start Lua bridge
4. Load same build into Lua
5. Compare XML stats vs Lua stats
6. Stop bridge

**Expect:** both modes work, stats comparable(Lua more accurate), no conflicts

### Test I.2: Build Comparison with What-If
**Obj:** compare two builds with modifications.

**Workflow**:
1. Load Build A into Lua
2. Get Build A stats
3. Compare Build A with modified tree
4. Load Build B into Lua
5. Get Build B stats
6. Compare stats between builds

**Expect:** switches between builds, stats update correctly, comparisons stay accurate

## Regression Testing

After any code changes, verify:

### XML Features Still Work
[ ] list_builds · [ ] analyze_build · [ ] compare_builds · [ ] get_build_stats · [ ] File watching

### Lua Features Still Work
[ ] lua_start · [ ] lua_load_build · [ ] lua_get_stats · [ ] lua_get_tree · [ ] lua_set_tree · [ ] lua_stop

### Phase 3 Features Still Work
[ ] compare_trees · [ ] test_allocation · [ ] plan_tree · [ ] get_nearby_nodes · [ ] find_path_to_node · [ ] allocate_nodes · [ ] get_build_xml · [ ] refresh_tree_data

### Phase 4 Features Still Work
[ ] add_item · [ ] get_equipped_items · [ ] toggle_flask · [ ] get_skill_setup · [ ] set_main_skill

### Phase 6 Features Still Work
[ ] analyze_defenses · [ ] suggest_optimal_nodes · [ ] optimize_tree

### Build Process
[ ] `npm run build` completes without errors · [ ] No TypeScript errors · [ ] No linting errors

## Troubleshooting Guide

### Issue: "luajit command not found"
**Fix**: install LuaJIT, ensure in PATH
```bash
# macOS
brew install luajit

# Ubuntu
sudo apt-get install luajit

# Windows
# Download from luajit.org and add to PATH
```

### Issue: "Failed to find valid ready banner"
**Fix**: check POB_FORK_PATH is correct — must contain HeadlessWrapper.lua + Modules/ dir

### Issue: "Timed out waiting for response"
**Fix**: raise POB_TIMEOUT_MS(default 10000ms); verify fork install complete; check HeadlessWrapper.lua syntax

### Issue: Stats don't match PoB GUI
**Fix**: verify game version; check config (bandit/pantheon/enemy level); update PoB fork

### Issue: TCP connection fails
**Fix**: verify POB_API_TCP=1 at launch; check firewall; verify port 31337 free; test `telnet 127.0.0.1 31337`

## Test Result Template

Use this template to document test results:

```markdown
## Test Run: [Date]

**Configuration**:
- POB_LUA_ENABLED: [true/false]
- Node Version: [version]
- OS: [platform]

**Phase 1 Tests**: [Pass/Fail]
- 1.1 List Builds: [result]
- 1.2 Analyze Build: [result]
- 1.3 Compare Builds: [result]
- 1.4 Get Stats: [result]
- 1.5 File Watching: [result]

**Phase 2 Tests**: [Pass/Fail]
- 2.1 Node Extraction: [result]
- 2.2 Jewel Info: [result]

**Phase 3 Tests**: [Pass/Fail]
- 3.1 Load Build: [result]
- 3.2 Get Calculated Stats: [result]
- 3.3 Get Tree: [result]
- 3.4 Modify Tree: [result]
- 3.5 Compare Trees: [result]
- 3.6 What-If Testing: [result]
- 3.7 Build Planning: [result]
- 3.8 Integration: [result]
- 3.9 Error Handling: [result]

**Phase 4 Tests**: [Pass/Fail]
- 4.1 Add Item: [result]
- 4.2 Get Equipped Items: [result]
- 4.3 Toggle Flask: [result]
- 4.4 Get Skill Setup: [result]
- 4.5 Set Main Skill: [result]
- 4.6 Item + Flask Workflow: [result]
- 4.7 Complete Build Modification: [result]
- 4.8 Error Handling (Items): [result]
- 4.9 Error Handling (Skills/Flasks): [result]
- 4.10 Integration with Phase 3: [result]

**Issues Found**:
- [List any issues]

**Notes**:
- [Additional observations]
```

## Automated Testing (Future)

Currently all manual. Future: 1.Unit tests for XML parsing 2.Mock PoB process for Lua bridge 3.Snapshot testing for stat outputs 4.Perf benchmark suite 5.CI/CD integration

## Contributing Test Cases

When adding features: 1.add test cases here 2.document expected behavior 3.include error scenarios
4. Provide test data if needed
