# PoB MCP Server Quick Reference

## Environment Variables Cheat Sheet

### Required
```bash
POB_DIRECTORY="/path/to/Path of Building/Builds"
```

### Lua Bridge (Optional)
```bash
POB_LUA_ENABLED="true"                              # Enable Lua bridge
POB_FORK_PATH="/path/to/PathOfBuilding/src"        # Path of Building src location
POB_CMD="luajit"                                    # LuaJIT command
POB_TIMEOUT_MS="10000"                              # Request timeout (10s)
```

### Trade API (Optional)
```bash
POE_TRADE_ENABLED="true"                           # Enable Trade API tools
```

## Tool Quick Reference

### XML Tools (Always Available)
`list_builds`(list builds) · `analyze_build`(full analysis) · `compare_builds`(compare two) · `get_build_stats`(stats only) · `start_watching`/`stop_watching`/`watch_status`(monitor changes) · `get_recent_changes`(recent changes) · `refresh_tree_data`(refresh cached tree)

### Lua Bridge Tools (When Enabled)
`lua_start`/`lua_stop`(init/stop bridge) · `lua_load_build`(load build XML) · `lua_get_stats`(calculated stats) · `lua_get_tree`(tree data) · `lua_set_tree`(update tree)

### Phase 3 Tools (Require Lua Bridge)
`compare_trees`(compare builds' trees) · `test_allocation`(what-if) · `plan_tree`(plan from goals) · `get_nearby_nodes`(nearby notables) · `find_path_to_node`(shortest path) · `allocate_nodes`(apply node IDs e.g. [12345,23456]+diff stats)

### Phase 4 Tools (Require Lua Bridge)
`add_item`(add from text) · `get_equipped_items`(view equipped) · `toggle_flask`(activate/deactivate) · `get_skill_setup`(view skill config) · `set_main_skill`(change main skill)

### Phase 6 Tools (Require Lua Bridge)
`analyze_defenses`(defensive gaps) · `suggest_optimal_nodes`(rank best nodes) · `optimize_tree`(full reallocation optimizer)

## Common Workflows

### Workflow 1: Quick Build Check
```
1. "Show me my builds"
2. "Analyze CritBow.xml"
```

### Workflow 2: High-Fidelity Stats
```
1. "Start Lua bridge"
2. "Load MyBuild.xml into Lua"
3. "Get stats from Lua"
4. "Stop Lua bridge"
```

### Workflow 3: Tree Optimization
```
1. "Start Lua bridge"
2. "Load MyBuild.xml"
3. "Nearby life notables within 5"
4. "Path to node 26725"
5. "Allocate [<path node ids>] on MyBuild.xml"
6. "Test allocating Point Blank" (what-if)
7. "Stop bridge"
```

### Workflow 4: Build Planning
```
1. "Help me plan a [archetype] [class/ascendancy]"
2. [Review recommendations]
3. "Start Lua bridge"
4. "Load a template build"
5. "Set tree to recommended nodes"
6. "Get stats to verify"
```

### Workflow 5: Build Comparison with Modifications
```
1. "Start Lua bridge"
2. "Load BuildA.xml"
3. "Get stats"
4. "Compare BuildA.xml and BuildB.xml"
5. "Test allocating [list] on BuildA.xml"
6. "Stop bridge"
```

### Workflow 6: Test Gear Upgrade (Phase 4)
```
1. "Start bridge and load build"
2. "What items do I have equipped?"
3. "Get current DPS"
4. "Add this weapon: [item text from trade]"
5. "Activate diamond flask"
6. "Get new DPS"
7. "Calculate upgrade value"
```

### Workflow 7: Complete Build Creation (Phase 4)
```
1. "Start bridge, load template"
2. "Set tree to [optimized nodes]"
3. "Add items: [paste all gear]"
4. "Set main skill to group 1"
5. "Activate damage flasks"
6. "Get final stats"
7. "Export as [BuildName.xml]"
```

## Class and Ascendancy IDs

### Class IDs
0:Scion, 1:Marauder, 2:Ranger, 3:Witch, 4:Duelist, 5:Templar, 6:Shadow

### Ascendancy IDs (by Class)

#### Scion (0)
0:None, 1:Ascendant

#### Marauder (1)
0:None, 1:Juggernaut, 2:Berserker, 3:Chieftain

#### Ranger (2)
0:None, 1:Raider, 2:Deadeye, 3:Pathfinder

#### Witch (3)
0:None, 1:Occultist, 2:Elementalist, 3:Necromancer

#### Duelist (4)
0:None, 1:Slayer, 2:Gladiator, 3:Champion

#### Templar (5)
0:None, 1:Inquisitor, 2:Hierophant, 3:Guardian

#### Shadow (6)
0:None, 1:Assassin, 2:Trickster, 3:Saboteur

## Notable Keystone Node IDs

Common keystones:

Acrobatics(29017) +30% Spell Dodge,-30% Armour/ES · Ancestral Bond(26725) +1 Totem,no player dmg · Avatar of Fire(58833) 50% phys→fire,no non-fire · Blood Magic(61259) life not mana · Chaos Inoculation(61834) 1 max life,immune chaos · Conduit(43988) share charges w/party · Crimson Dance(60783) +100% bleed DPS,8 stacks,no move multi · Eldritch Battery(36949) ES→mana not life · Elemental Equilibrium(54307) -50% hit-type res,+25% others · Elemental Overload(24970) +40% ele dmg,no crits · Ghost Reaver(48410) leech→ES not life · Glancing Blows(59585) double block,65% dmg on block · Iron Grip(6910) STR→proj attack dmg · Iron Reflexes(23852) Evasion→armour · Mind Over Matter(41536) 30% dmg from mana · Minion Instability(43688) minions explode low life · Pain Attunement(37984) 30% more spell dmg low life · Perfect Agony(42148) crits no ailment multi,+50% as DoT multi · Phase Acrobatics(31703) +30% spell dodge · Point Blank(33753) more proj dmg close,less far · Resolute Technique(59859) never crit,always hit · Runebinder(55503) +1 Brand,attaches rare/unique · Unwavering Stance(20551) no evade/stun · Vaal Pact(28127) instant leech,no regen · Zealot's Oath(3655) regen→ES not life

## Equipment Slot Names (Phase 4)

Use these exact slot names with `add_item`:

### Weapons & Shields
`"Weapon 1"`, `"Weapon 2"` (main/off hand); `"Weapon 1 Swap"`, `"Weapon 2 Swap"` (swap set)

### Armour
`"Helmet"`, `"Body Armour"`, `"Gloves"`, `"Boots"`

### Accessories
`"Amulet"`, `"Ring 1"`, `"Ring 2"`, `"Belt"`

### Flasks
`"Flask 1"` through `"Flask 5"`

### Jewels
`"Jewel 1"`, `"Jewel 2"`, etc. (based on tree allocation); Abyssal sockets in items

### Example Usage
```
"Add this ring to Ring 2: [item text]"
"Add this flask to Flask 1: [item text]"
```

## Common Node Clusters

### Life/Defense Clusters
Constitution(26725) major life wheel(Marauder) · Devotion(2491) life wheel(Templar) · Heart of Oak(36858) life/regen(Ranger) · Quick Recovery(12613) life/regen(Scion) · Sanctity(6230) life/ES(Templar) · Thick Skin(18865) life/Evasion(Shadow)

### Damage Clusters
Assassination(43988) crit multi(Shadow) · Berserking(32325) attack speed(Duelist) · Devastating Devices(44169) trap/mine dmg · Essence Surge(11186) ES/ES regen(Witch) · Force Shaper(19968) weapon ele dmg(Shadow) · Lava Lash(58370) fire weapon dmg(Marauder) · Twin Terrors(56370) dual wield dmg(Shadow)

## Common Stat Field Names

Use with `lua_get_stats` to request specific stats:

### Offense
`TotalDPS`, `CombinedDPS`, `CritChance`, `CritMultiplier`, `HitChance`, `Speed`(attack/cast), `ManaCost`

### Defense
`Life`, `EnergyShield`, `Mana`, `Armour`, `Evasion`, `Ward`, `LifeRegen`, `ManaRegen`, `ESRegen`(per second)

### Resistances
`FireResist`, `ColdResist`, `LightningResist`, `ChaosResist`, `FireResistOverCap`, `ColdResistOverCap`, `LightningResistOverCap`

### Block/Dodge
`BlockChance`, `SpellBlockChance`, `DodgeChance`(if available), `SpellDodgeChance`(if available)

### Misc
`Str`, `Dex`, `Int`, `EffectiveMovementSpeedMod`(move speed mod)

## Error Messages Quick Guide

"luajit command not found"→LuaJIT missing→`brew install luajit` · "Failed to find valid ready banner"→bad fork path→check POB_FORK_PATH · "Timed out waiting for response"→process hung/slow→raise POB_TIMEOUT_MS · "build not initialized"→no build loaded→run lua_load_build first · "Process not started"→bridge not running→run lua_start first · "Concurrent request not supported"→two requests at once→wait for first to finish

## Tips and Best Practices

### Performance
Bridge stays running between requests (faster); first calc slower (init); later calcs use cached data; stop bridge if idle long.

### Accuracy
Lua stats > XML stats always; Lua uses real PoB calc engine, XML is approximate/incomplete; use Lua for optimization decisions.

### Workflow
XML tools for quick checks; Lua bridge for detailed work; preview before committing tree changes; stop bridge to free resources.

### Debugging
Check Claude Desktop logs; test luajit: `luajit -v`; verify fork path: `ls $POB_FORK_PATH/HeadlessWrapper.lua`; test fork: `cd $POB_FORK_PATH && luajit HeadlessWrapper.lua`

## Build Archetype Keywords

Use when asking for build planning help:

### Damage Types
Physical, Fire, Cold, Lightning, Chaos, Elemental, Poison, Bleed, Ignite, DoT.

### Attack Types
Melee, Ranged, Bow, Wand, Spell, Totem, Trap, Mine, Brand, Minion, Summoner.

### Defense Styles
Life, ES, Hybrid(Life+ES), Armour, Evasion, Block, Dodge, Leech, Regen, Gain on Hit.

### Build Focuses
Crit, Non-crit/Resolute Technique, Elemental, Physical, Attack Speed, slow hard-hitting, Tankiness, Glass Cannon, League Start, Budget, Endgame.

### Example Queries
"Cold DoT Occultist with ES and high cold res" · "Physical bow crit Deadeye with evasion" · "RF Chieftain with life and armour" · "Max block spell suppression Gladiator" · "CI ES recharge Trickster" · "Minion necromancer with aura stacking"

## Quick Start Checklist

### First Time Setup
[ ] Install Node.js · [ ] Clone/download pob-mcp-server · [ ] `npm install` · [ ] `npm run build` · [ ] Configure Claude Desktop w/ POB_DIRECTORY · [ ] Restart Claude Desktop · [ ] Test: "Show me my builds"

### Enable Lua Bridge (Optional)
[ ] Install LuaJIT · [ ] Clone PathOfBuilding (api-stdio branch) · [ ] Add POB_LUA_ENABLED=true · [ ] Add POB_FORK_PATH · [ ] Restart Claude Desktop · [ ] Test: "Start the Lua bridge"

## Support and Resources

**GitHub**: https://github.com/yourusername/pob-mcp-server · **Testing Guide**: TESTING_GUIDE.md · **Full Docs**: README.md · **PoB API Fork**: https://github.com/Dulluhan/pob-api · **MCP Protocol**: https://modelcontextprotocol.io

## Version Information

**Version**: Phase 4 Complete · **Tools**: 91 · **MCP SDK**: @modelcontextprotocol/sdk · **Node.js**: 14+ · **LuaJIT**: 2.0+(for bridge) · **PoB Fork**: LocalIdentity-compatible

### What's New in Phase 4
Item management (add items from PoE text), equipment viewing, flask activation, skill config, main skill selection, complete build modification workflows.
