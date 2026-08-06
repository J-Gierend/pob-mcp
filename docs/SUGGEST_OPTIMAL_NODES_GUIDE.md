# Quick Start Guide: suggest_optimal_nodes

## What It Does

Analyzes build, recommends **best passive tree nodes** for your goal. Uses real PoB calcs to rank nodes by efficiency (stat gain/point).

## Basic Usage

```
suggest_optimal_nodes(
  build_name: "MyBuild.xml",
  goal: "maximize_life"
)
```

**Result:** top 10 life nodes ranked by efficiency, w/ paths+projections.

## Supported Goals

### Offense
`maximize_dps`, `maximize_hit_dps`, `maximize_dot_dps`, `crit_chance`, `crit_multi`, `attack_speed`, `cast_speed`

### Defense
`maximize_life`, `maximize_es`, `maximize_ehp`, `resistances`(lowest), `armour`, `evasion`, `block`, `spell_block`

### Utility
`movement_speed`, `mana_regen`, `life_regen`, `attributes`(STR/DEX/INT)

### Balanced
`balanced`(offense/defense mix), `league_start`(leveling: 60% life, 40% DPS)

## Natural Language Support

Natural language: "increase life"→`maximize_life`, "more damage"→`maximize_dps`, "get tankier"→`maximize_ehp`, "crit multi"→`crit_multi`

## Advanced Parameters

```
suggest_optimal_nodes(
  build_name: "MyBuild.xml",
  goal: "maximize_dps",
  max_points: 15,        // Max points to spend (default: 10)
  max_distance: 7,       // Max search distance (default: 5)
  min_efficiency: 100,   // Min DPS/point (default: 0)
  include_keystones: true // Include keystones (default: true)
)
```

### When to Adjust Parameters

**↑`max_points`**: many unallocated points, invest heavily · **↑`max_distance`**: explore further from tree · **↑`min_efficiency`**: filter to best nodes only · **disable `include_keystones`**: incremental only, no major changes.

## Example Workflows

### 1. Simple DPS Boost
```
User: "Suggest nodes to increase my DPS"

suggest_optimal_nodes(build_name="Deadeye.xml", goal="maximize_dps")

→ Returns: Top DPS nodes
→ Pick: #1 recommendation
→ Use: allocate_nodes(build_name="Deadeye.xml", node_ids=[...])
```

### 2. Defensive Improvements
```
User: "I'm too squishy, need more life"

suggest_optimal_nodes(build_name="GlassCannon.xml", goal="maximize_life", max_points=15)

→ Returns: Life nodes
→ Current: 3,200 life
→ Projected: 5,100 life (+59% with top 3)
```

### 3. Crit Build Optimization
```
User: "Where can I get more crit multi?"

suggest_optimal_nodes(build_name="CritBow.xml", goal="crit_multi", max_distance=7)

→ Searches further from tree
→ Returns: Crit multi nodes ranked by efficiency
→ Shows secondary benefits (DPS, accuracy, etc.)
```

### 4. League Start Character
```
User: "Best nodes for leveling a new Witch?"

suggest_optimal_nodes(build_name="Witch_L50.xml", goal="league_start")

→ Prioritizes survivability (60%) and damage (40%)
→ Suggests efficient leveling nodes
```

### 5. Resistance Fixing
```
User: "Need to cap my resistances"

suggest_optimal_nodes(build_name="MyBuild.xml", goal="resistances")

→ Targets lowest resistance
→ Shows resistance nodes ranked by efficiency
```

### 6. Balanced Growth
```
User: "Help me balance offense and defense"

suggest_optimal_nodes(build_name="MyBuild.xml", goal="balanced")

→ Scores nodes on combined DPS + Life benefit
→ Returns well-rounded recommendations
```

## Understanding the Output

### Top Recommendation Example
```
1. ⭐ Constitution [26725] (NOTABLE) - EFFICIENCY: +180 life/point
   Path: 4 nodes to allocate
   Stat Gain: +720 (+17.1% increase)
   Bonus: +30 STR
   → Use: allocate_nodes(build_name="Deadeye.xml", node_ids=["12345", "23456", "34567", "26725"])
```

`⭐`=top pick · `Constitution`=name · `[26725]`=node ID · `(NOTABLE)`=type(keystone/notable/small) · `+180 life/point`=**efficiency** · `Path: 4 nodes`=points needed · `Stat Gain: +720`=life increase · `+17.1% increase`=% improvement · `Bonus: +30 STR`=secondary · `→ Use: allocate_nodes(...)`=ready command

### Summary Section
```
**SUMMARY:**
Best Pick: Constitution (+180 life/point)
Top 3 picks would give +1,720 life for 12 points (143 life/point average)
Current: 4,200 → Projected: 5,920 (+41% increase)
```

**Shows:** best node, top-3 combined value, point cost, projected stat.

### Tip
```
**TIP:** Allocate the top pick first, then re-run this tool to find the next best options.
```

**Why?** Allocating changes the tree — re-run to find the new best options.

## Iterative Optimization

**Best Practice:** `suggest_optimal_nodes` → pick top → `allocate_nodes` test → keep if good → re-run → repeat until satisfied. Ensures each allocation is optimal for the current tree.

## Common Questions

### Q: How does it rank nodes?
**A:** By **efficiency** (stat/point). +720 life/4pts(180/pt) ranks above +100 life/1pt(100/pt).

### Q: Are these actual PoB calculations?
**A:** Yes — loads build into PoB's Lua engine, allocates each path, measures real stat changes.

### Q: Why do some nodes show "Bonus" stats?
**A:** Secondary benefits — e.g. a life node may also give +30 STR, helping melee scaling.

### Q: What if I get "No recommendations found"?
**A:** raise `max_distance`(default 5), lower `min_efficiency`(default 0), enable keystones, or try a different goal.

### Q: Can I use this for keystones?
**A:** Yes, included by default; `include_keystones: false` excludes them.

### Q: How long does it take?
**A:** ~20-30 s for ~20 candidates (~1s each: pathfinding+Lua calc).

### Q: Does it consider travel nodes?
**A:** Yes — "Path" includes travel+target nodes; efficiency accounts for total point cost.

### Q: Can it suggest multiple nodes at once?
**A:** Individual nodes only; use top-3 summary as guidance for combining.

## Tips & Tricks

### 1. Start Broad, Then Narrow
```
# First pass: See all options
suggest_optimal_nodes(build="MyBuild.xml", goal="maximize_dps")

# Second pass: Only the best
suggest_optimal_nodes(build="MyBuild.xml", goal="maximize_dps", min_efficiency=200)
```

### 2. Compare Goals
```
# What gives more DPS?
suggest_optimal_nodes(build="MyBuild.xml", goal="crit_chance")
suggest_optimal_nodes(build="MyBuild.xml", goal="crit_multi")

# Compare top recommendations
```

### 3. Budget Planning
```
# I have 20 points total, plan in chunks
suggest_optimal_nodes(build="MyBuild.xml", goal="maximize_life", max_points=7)
# Allocate top 2-3
suggest_optimal_nodes(build="MyBuild.xml", goal="maximize_dps", max_points=7)
# Allocate top 2-3
# etc.
```

### 4. Distant Exploration
```
# See what's 8-10 nodes away
suggest_optimal_nodes(build="MyBuild.xml", goal="maximize_dps", max_distance=10)
# Might find very efficient clusters further out
```

### 5. League Start Optimization
```
# Level 30-50: Focus survivability
suggest_optimal_nodes(build="MyBuild.xml", goal="league_start")

# Level 50-70: Shift to damage
suggest_optimal_nodes(build="MyBuild.xml", goal="balanced")

# Level 70+: Pure damage
suggest_optimal_nodes(build="MyBuild.xml", goal="maximize_dps")
```

## Troubleshooting

### "Lua bridge required"
**Fix:** enable `POB_LUA_ENABLED=true` — this tool needs the Lua bridge for accurate stats.

### "No candidate nodes found"
**Fix:** raise `max_distance`(7-10), enable keystones, or check build has room to expand.

### "No nodes met minimum efficiency threshold"
**Fix:** lower `min_efficiency` to 0, raise `max_distance`, or try a different goal.

### Recommendations seem wrong
**Check:** correct goal ("maximize_dps" vs "maximize_hit_dps"); build loaded correctly (verify `lua_get_stats`); efficiency vs absolute gain (efficiency is key).

## Performance Notes

**Fast**: 20-30 s typical · **Scalable**: `max_distance` grows search space exponentially · **Memory**: PoB Lua bridge ~100MB RAM · **Optimal**: `max_distance=5`,`max_points=10` balances thoroughness/speed.

## Related Tools

**Discovery:** 1.`suggest_optimal_nodes`(start here!) 2.`get_nearby_nodes`(manual discovery) 3.`find_path_to_node`(manual pathfinding) 4.`allocate_nodes`(test impact)

**Analysis:** 1.`analyze_defenses`(find weaknesses) 2.`suggest_optimal_nodes(goal="maximize_life")`(fix life) 3.`suggest_optimal_nodes(goal="resistances")`(fix resists) 4.`analyze_defenses`(verify)

---

**Ready to optimize your build?**

Start with: `suggest_optimal_nodes(build_name="YourBuild.xml", goal="maximize_dps")`
