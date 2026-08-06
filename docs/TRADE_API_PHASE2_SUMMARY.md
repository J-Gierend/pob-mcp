# Trade API - Phase 2 Complete! 🎉

## Overview

Phase 2 adds stat mapping — search items by stat w/o exact Trade API IDs.

## What's New in Phase 2

### 1. **Comprehensive Stat Mapping System** ✨

`src/services/statMapper.ts`: 100+ mapped stats; categories pseudo/explicit/implicit/enchant/crafted/fractured; aliases; fuzzy search.

#### Example Mappings:
`Life`→`pseudo.pseudo_total_life` · `FireResist`→`pseudo.pseudo_total_fire_resistance` · `CritChance`→`pseudo.pseudo_increased_critical_strike_chance` · `MovementSpeed`→`pseudo.pseudo_increased_movement_speed`

### 2. **New Tool: `search_stats`** 🔍

**Parameters:** `query`(required), `limit`(optional, default 10)

**Example Queries:**
```
Search for "life" stat
Search for "fire resistance"
Search for "crit"
Search for "movement"
```

**Response:** name, Trade ID, category, description, aliases.

**Sample:**
```
=== Stat Search Results for "crit" ===

Found 4 matching stats:

1. CritChance
   Trade ID: pseudo.pseudo_increased_critical_strike_chance
   Category: pseudo
   Description: Increased critical strike chance
   Aliases: increased critical strike chance, crit chance, ...

2. CritMultiplier
   Trade ID: pseudo.pseudo_total_critical_strike_multiplier
   Category: pseudo
   Description: Critical strike multiplier
   Aliases: critical strike multiplier, crit multi, ...
```

### 3. **StatMapper Service**

#### Methods:
**`getTradeId(pobStatName)`**
```typescript
const tradeId = statMapper.getTradeId('Life');
// Returns: 'pseudo.pseudo_total_life'
```

`getPobName(tradeId)`
```typescript
const pobName = statMapper.getPobName('pseudo.pseudo_total_life');
// Returns: 'Life'
```

`fuzzySearch(query, limit)`
```typescript
const results = statMapper.fuzzySearch('fire res', 5);
// Returns top 5 matches for "fire res"
```

`pobStatToTradeFilter(name, min, max)`
```typescript
const filter = statMapper.pobStatToTradeFilter('Life', 80);
// Returns: { id: 'pseudo.pseudo_total_life', min: 80 }
```

`pobStatsToTradeFilters(stats[])`
```typescript
const filters = statMapper.pobStatsToTradeFilters([
  { name: 'Life', min: 80 },
  { name: 'FireResist', min: 40 }
]);
// Returns array of trade filters
```

## Stat Categories Covered

### ✅ Defenses
Life, ES, Mana, Armour, Evasion, all resistances.

### ✅ Attributes
Str/Dex/Int, All Attributes.

### ✅ Damage
Physical/Fire/Cold/Lightning/Chaos/Elemental, increased-by-type, Spell/Attack.

### ✅ Attack & Cast Speed
Attack/Cast speed.

### ✅ Critical Strike
Crit chance+multiplier (local/global).

### ✅ Movement & Utility
Move speed, item rarity/quantity, accuracy.

### ✅ Regeneration & Leech
Life/Mana regen+leech.

### ✅ Flask Stats
Charges, duration, effect.

### ✅ Gem Levels
All skill+spell gems.

### ✅ Minion Stats
Minion life/damage.

## Usage Examples

### Example 1: Finding the Right Stat ID

**User:** "high life, unknown stat ID"

**Claude:** `search_stats`:
```
search_stats query="life"
```

**Result:**
```
1. Life
   Trade ID: pseudo.pseudo_total_life
   Description: Total maximum life from all sources
```

### Example 2: Using Discovered Stat in Search

**User:** "rings 80+life Standard <50c"

**Claude:** `search_trade_items`:
```json
{
  "league": "Standard",
  "item_type": "Ring",
  "max_price": 50,
  "stats": [
    {
      "id": "pseudo.pseudo_total_life",
      "min": 80
    }
  ]
}
```

### Example 3: Complex Multi-Stat Search

**User:** "boots, 80+ life, 30% move speed, 40+ fire res"

**Claude:** `search_stats` finds Life→`pseudo.pseudo_total_life`, Movement speed→`pseudo.pseudo_increased_movement_speed`, Fire resistance→`pseudo.pseudo_total_fire_resistance`, then searches:
```json
{
  "stats": [
    { "id": "pseudo.pseudo_total_life", "min": 80 },
    { "id": "pseudo.pseudo_increased_movement_speed", "min": 30 },
    { "id": "pseudo.pseudo_total_fire_resistance", "min": 40 }
  ]
}
```

## Fuzzy Matching Examples

"life"→Life,MinionLife,LifeRegen · "fire"→FireResist,FireDamage · "crit"→CritChance,CritMultiplier · "res"→all resistances · "movement"→MovementSpeed · "es"→EnergyShield.

## Technical Implementation

### Architecture

```
src/services/
  ├── statMapper.ts         # Stat mapping service
  ├── tradeClient.ts        # API client (Phase 1)
  └── tradeQueryBuilder.ts  # Query builder (Phase 1)

src/handlers/
  └── tradeHandlers.ts      # Added handleSearchStats

src/types/
  └── tradeTypes.ts         # Type definitions (Phase 1)
```

### Stat Mapping Data Structure

```typescript
interface StatMapping {
  pobName: string;          // PoB stat name
  tradeId: string;          // Trade API stat ID
  category: 'pseudo' | 'explicit' | 'implicit' | 'enchant' | 'crafted' | 'fractured';
  aliases: string[];        // Alternative names
  description?: string;     // Human-readable description
}
```

### Fuzzy Search Algorithm

100pts exact PoB, 95 alias, 90 Trade ID, 80/75/70 contains, ≤60 partial; sorted.

## Benefits

### For Users 👥
No memorizing IDs · natural queries · related-stat discovery.

### For Developers 🛠️
Extensible, type-safe, error-handled, documented.

## What's Next: Phase 3 Preview

Phase 3: **Recommendation Engine**.

### Planned Features:
`find_item_upgrades`, `find_resistance_gear`, cost/benefit analysis, `analyze_items` integration, budget-aware recs.

### Example Use Case:
```
User: "My build is missing fire resistance, what items should I buy?"

Claude:
1. Analyzes build (validates resistances)
2. Identifies resistance gaps (e.g., -25% fire res)
3. Uses trade API to find items filling the gap
4. Ranks by cost/benefit ratio
5. Suggests best upgrade path
```

## Migration & Compatibility

### Breaking Changes
None.

### New Environment Variables
None.

### New Dependencies
None.

## Performance

Lookup O(1) · fuzzy O(n),n~100 · <1MB · init once at startup.

## Future Enhancements

**Dynamic fetching** (`/data/stats`), **200+ mappings**, **implicit/explicit split**, **weighted items**, **tier info**.

## Summary

Phase 2: stat mapping — search naturally, no obscure IDs.

**Status** Complete · **Build** Passing · **Tools** +1(`search_stats`) · **Services** +1(`StatMapper`) · **Mappings** 100+
