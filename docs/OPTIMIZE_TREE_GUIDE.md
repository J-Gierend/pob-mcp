# Tree Optimizer Guide

## Overview

`optimize_tree`: **add**+**remove** nodes, finds best overall allocation for your goal.

## Basic Usage

```
optimize_tree(
  build_name: "MyBuild.xml",
  goal: "maximize_dps"
)
```

## Optimization Goals

### Offense
- **`maximize_dps`**: max DPS — prioritizes damage, crit, attack/cast speed nodes

### Defense
- **`maximize_life`**: max life · **`maximize_es`**: max ES · **`maximize_ehp`**: max Life+ES — prioritizes Life%/ES%/hybrid nodes

### Balanced
- **`balanced`**: offense/defense balance via geometric mean (punishes extremes), good all-around
- **`league_start`**: survivability (60/40 split), defense-weighted early game

## Constraints

### Defensive Minimums

Minimum thresholds:

```typescript
constraints: {
  minLife: 4000,              // Minimum life pool
  minES: 0,                   // Minimum energy shield
  minEHP: 4000,               // Minimum total EHP (Life + ES)
  minFireResist: 75,          // Fire resistance
  minColdResist: 75,          // Cold resistance
  minLightningResist: 75,     // Lightning resistance
  minChaosResist: 0           // Chaos resistance
}
```

### Protected Nodes

Prevent nodes from being removed:

```typescript
constraints: {
  protectedNodes: ["26725", "48768", "61834"]  // Node IDs to keep
}
```

Protect: critical keystones (Point Blank, Avatar of Fire), ascendancy nodes, valuable jewel sockets, needed travel nodes.

## Build Type Considerations

### Life-Based Builds

Use `minLife`:

```typescript
optimize_tree(
  build_name: "MyLifeBuild.xml",
  goal: "maximize_dps",
  constraints: {
    minLife: 4500,
    minFireResist: 75,
    minColdResist: 75,
    minLightningResist: 75
  }
)
```

### Energy Shield Builds

Use `minES` for CI/ES-based builds:

```typescript
optimize_tree(
  build_name: "MyESBuild.xml",
  goal: "maximize_dps",
  constraints: {
    minES: 6000,
    minFireResist: 75,
    minColdResist: 75,
    minLightningResist: 75
  }
)
```

### Low-Life Builds ⚠️

**IMPORTANT**: low-life (Pain Attunement, Prism Guardian) runs ~35% life by design — **use `minEHP` not `minLife`**:

```typescript
// ❌ Wrong for low-life:
constraints: {
  minLife: 4000  // Impossible! Low-life is ~1500 life
}

// ✅ Correct for low-life:
constraints: {
  minEHP: 7000,   // Total EHP (1500 life + 5500 ES)
  minES: 5000     // Ensure adequate ES pool
}
```

Auto-detects low-life: skips `minLife`, logs `"⚠️ Low-life build detected! minLife constraint will be ignored"`, warns `"Low-life build detected: minLife constraint was ignored. Use minEHP for low-life builds."`

### Hybrid Life/ES Builds

Use `minEHP` for combined pool:

```typescript
optimize_tree(
  build_name: "MyHybridBuild.xml",
  goal: "maximize_ehp",
  constraints: {
    minLife: 3000,  // Some life
    minES: 2000,    // Some ES
    minEHP: 5500    // Combined minimum
  }
)
```

## Advanced Options

### Point Budget

Max passive points:

```typescript
optimize_tree(
  build_name: "MyBuild.xml",
  goal: "maximize_dps",
  max_points: 95  // Optimize up to 95 points (level 88)
)
```

**Default**: current allocation + 5 points

**Use when**: planning a level, respeccing budget, comparing level efficiency

### Max Iterations

How long optimization runs:

```typescript
optimize_tree(
  build_name: "MyBuild.xml",
  goal: "maximize_dps",
  max_iterations: 30  // More iterations = more thorough
)
```

**Default**: 20 iterations

**Guidelines**: 10-15 quick (~30-60 s), 20-25 standard (~60-90 s), 30+ thorough (~90-150 s)

**Note**: optimization stops early if no improvements found.

## Example Workflows

### 1. Max DPS with Safe Defenses

```typescript
optimize_tree(
  build_name: "Elementalist_Wander.xml",
  goal: "maximize_dps",
  max_points: 95,
  constraints: {
    minLife: 4000,
    minFireResist: 75,
    minColdResist: 75,
    minLightningResist: 75,
    protectedNodes: ["26725"]  // Keep Point Blank
  }
)
```

### 2. Respec to Tankier Tree

```typescript
optimize_tree(
  build_name: "GlassCannon.xml",
  goal: "maximize_ehp",
  max_points: 92,
  constraints: {
    minLife: 5000
  }
)
```

### 3. League Start Optimization

```typescript
optimize_tree(
  build_name: "LeagueStarter.xml",
  goal: "league_start",
  max_points: 70,
  constraints: {
    minLife: 3000,
    minFireResist: 75,
    minColdResist: 75,
    minLightningResist: 75
  }
)
```

### 4. Low-Life Build (Correct)

```typescript
optimize_tree(
  build_name: "LowLife_SpellCaster.xml",
  goal: "maximize_dps",
  constraints: {
    minEHP: 7000,   // Use EHP, not minLife!
    minES: 5500,    // Adequate ES
    minFireResist: 75,
    minColdResist: 75,
    minLightningResist: 75,
    protectedNodes: ["48768"]  // Pain Attunement
  }
)
```

### 5. Protect Jewel Sockets

```typescript
optimize_tree(
  build_name: "JewelStackBuild.xml",
  goal: "maximize_dps",
  constraints: {
    minLife: 4200,
    protectedNodes: [
      "26725",   // Jewel socket 1
      "36634",   // Jewel socket 2
      "61834",   // Jewel socket 3
      "2491"     // Jewel socket 4
    ]
  }
)
```

## Understanding Results

### Output Format

```
=== Tree Optimization Result ===

Goal: Maximize Total DPS
Build: Elementalist Wander.xml
Iterations: 12

**Starting Stats:**
- Target Value: 450000
- Life: 4200
- ES: 0
- DPS: 450000
- Points: 85

**Final Stats:**
- Target Value: 523000
- Life: 3950
- ES: 0
- DPS: 523000
- Points: 87

**Improvements:**
- Target: +73000 (+16.2%)
- Life: -250
- ES: +0
- DPS: +73000
- Points: +2

**Tree Changes:**
Removed 3 nodes: 12345, 67890, 23456
Added 5 nodes: 78901, 34567, 89012, 45678, 90123
```

### Applying Results

Apply via `lua_set_tree`:

```typescript
lua_set_tree(
  classId: 3,
  ascendClassId: 1,
  nodes: [optimized node array]
)
```

**IMPORTANT**: save your build first — hard to undo.

## Algorithm Details

### How It Works

Two phases/iteration: **A Add** — nearby unallocated nodes (dist 3), test top 30, apply best. **B Remove** — removable nodes (not needed for pathing), test top 20, accept if score within 1%. Stops when no improvement or max iterations hit.

### Performance

**Per iteration**: 2-5 s · **Full run**: 30-120 s · **Candidates**: ≤50/iteration (30 add+20 remove).

### Search Distance

Fixed at 3 nodes for performance: efficient local improvements, won't find distant optimal branches.

Long-range planning: use `suggest_optimal_nodes` with higher `max_distance`.

## Tips & Best Practices

### 1. Start Conservative
```typescript
// First run: Safe constraints
optimize_tree(
  build_name: "MyBuild.xml",
  goal: "maximize_dps",
  constraints: { minLife: 4500 }  // Higher than needed
)

// If good: Relax constraints
optimize_tree(
  build_name: "MyBuild.xml",
  goal: "maximize_dps",
  constraints: { minLife: 4000 }  // Lower
)
```

### 2. Protect Critical Nodes

Always protect: build-defining keystones, ascendancy nodes (auto), expensive jewel sockets, unique pathing nodes

### 3. Multiple Runs

Run multiple times: goal A (e.g. DPS)→apply→goal B (e.g. EHP)→compare→choose

### 4. Verify Before Applying

Check removed nodes aren't critical, added nodes make sense, review stat changes, save before applying

### 5. Iteration Count

Quick: 10. Normal: 20(default). Thorough: 30+. Diminishing returns beyond that.

## Troubleshooting

### "Tree is already optimal"
**Cause**: no improvement within search distance. **Fix**: raise `max_iterations`, relax constraints, different goal, or `suggest_optimal_nodes` for longer range.

### "Reached maximum iterations"
**Cause**: hit iteration limit before converging. **Fix**: raise `max_iterations` (30-40); current result still valid, just not fully optimized.

### "Final tree does not meet all constraints"
**Cause**: bug or impossible constraints. **Fix**: check achievability, check conflicts (minLife+minES+minDPS), report bug if constraints seem reasonable.

### Low-Life Warning

**Message**: `"Low-life build detected: minLife constraint was ignored"`

**Cause**: low-life detected (life <50% max). **Fix**: use `minEHP` not `minLife`:
```typescript
constraints: {
  minEHP: 7000,  // Instead of minLife
  minES: 5500
}
```

## Limitations

1. **Local Optimum**: greedy, may miss global best; multiple runs vary
2. **Search Distance**: fixed at 3, won't find distant branches — use `suggest_optimal_nodes`
3. **Sequential Testing**: one change/time, 30-120s, needed for accurate stats
4. **Pathing**: simplified, may be overly conservative

## Comparison with suggest_optimal_nodes

optimize_tree: add✅ remove✅ reallocate✅ full-optimization✅ search-distance fixed(3) constraints full-system protected-nodes✅ runtime 30-120s, best for complete optimization.
suggest_optimal_nodes: add✅ remove❌ reallocate❌ full-optimization❌ search-distance configurable constraints limited protected-nodes❌ runtime 10-30s, best for quick suggestions.

## Future Enhancements

[ ] Configurable search distance · [ ] Multi-start (escape local optima) · [ ] Branch swapping · [ ] Cluster jewel optimization · [ ] Parallel candidate testing · [ ] Better path analysis (full graph traversal)

## See Also

`suggest_optimal_nodes`(quick recs), `get_nearby_nodes`(reachable nodes), `allocate_nodes`(test allocations), `test_allocation`(what-if), `analyze_defenses`(weaknesses)
