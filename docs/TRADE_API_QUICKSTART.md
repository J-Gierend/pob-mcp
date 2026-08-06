# Trade API Quick Start Guide

## Overview

Claude searches the PoE trade site: items, prices, upgrade recommendations.

## Setup

### 1. Enable Trade API

Add env var to Claude Desktop config:

```json
{
  "mcpServers": {
    "pob": {
      "command": "node",
      "args": ["/path/to/pob-mcp-server/build/index.js"],
      "env": {
        "POB_DIRECTORY": "/path/to/Path of Building/Builds",
        "POE_TRADE_ENABLED": "true"
      }
    }
  }
}
```

### 2. Optional Configuration

```json
{
  "env": {
    "POE_TRADE_ENABLED": "true",
    "POE_RATE_LIMIT_PER_SECOND": "4",
    "POE_CACHE_TTL": "300"
  }
}
```

`POE_TRADE_ENABLED`: "true"=enable (required) · `POE_RATE_LIMIT_PER_SECOND`: req/s (default 4) · `POE_CACHE_TTL`: cache TTL s (default 300)

### 3. Restart Claude Desktop

## Available Tools

### 1. `get_leagues`

Active leagues for trade searches.

**Example:**
```
What leagues are available for trading?
```

**Response:** leagues (Standard, Hardcore, challenge...), realm (PC, Console).

---

### 2. `search_trade_items`

Search items by criteria:

**Parameters:**
`league`(required, e.g."Standard"),`item_name`,`item_type`,`min_price`/`max_price`,`price_currency`(chaos),`online_only`(true),`rarity`,`min_links`(e.g.6),`stats`,`sort`,`limit`(10, max 10/request).

**Examples:**

```
Search for 6-link body armour in Standard league under 20 chaos
```
```
Search for Headhunter in Standard league
```
```
Search for rare helmets in Standard with at least 80 life and 40% fire resistance
```

**Response:** items+prices, stats/mods, seller, whisper commands.

---

### 3. `get_item_price`

Price stats for an item:

**Parameters:**
`item_name`(required),`league`(Standard),`item_type`,`rarity`.

**Examples:**

```
What's the current price of Headhunter in Standard?
```
```
How much do Astral Plates cost in Standard?
```

**Response:** low/median/avg/high, sample size, currencies, listing count.

---

## Example Use Cases

### 1. Capping Resistances

```
I need to cap fire and cold resistance on my build.
Search for rings in Standard with at least +40% total fire resistance
and +40% total cold resistance under 50 chaos.
```

### 2. Finding Weapon Upgrades

```
Find rare bows in Standard with at least 300 physical DPS under 2 divine orbs.
```

### 3. Budget 6-Link Setup

```
Find the cheapest 6-link Astral Plate in Standard.
```

### 4. Price Checking Crafted Item

```
What's the price of rare Stygian Vise belts with 90+ life
and triple resistance in Standard?
```

### 5. Unique Item Shopping

```
Search for Taste of Hate flask in Standard, show me the 5 cheapest ones.
```

## Trade API Features

### Rate Limiting
4/s default, token bucket, respects rate-limit headers, exponential-backoff retry.

### Caching
Results 5min, stat defs 1hr, leagues 1hr — cuts redundant calls.

### Error Handling
Graceful rate-limits, clear errors, param validation, missing-data fallback.

## Troubleshooting

### "Trade API is not enabled"
**Solution:** set `POE_TRADE_ENABLED=true`, restart.

### "Rate limited. Retry after Xms"
**Solution:** wait, retry; reduce `POE_RATE_LIMIT_PER_SECOND` if frequent.

### "No items found"
**Causes:** typo; league doesn't exist (`get_leagues`); filters too strict; item unavailable.

### "Failed to fetch items"
**Causes:** network issue, site down, invalid params.

## Advanced Usage

### Using Stat IDs

Common stat IDs:
- `pseudo.pseudo_total_life`
- `pseudo.pseudo_total_energy_shield`
- `pseudo.pseudo_total_fire_resistance`
- `pseudo.pseudo_total_cold_resistance`
- `pseudo.pseudo_total_lightning_resistance`
- `pseudo.pseudo_total_chaos_resistance`

**Example:**
```json
{
  "stats": [
    { "id": "pseudo.pseudo_total_life", "min": 80 },
    { "id": "pseudo.pseudo_total_fire_resistance", "min": 40 }
  ]
}
```

### Currency Conversion

Prices in seller's currency: `chaos` (standard), `divine` (high-value), `exalted` (legacy high-value), `mirror` (extremely rare).

## Limitations

1. **No Auth**: public only
2. **Rate Limits**: ~4 requests/second
3. **Results**: max 10/request
4. **Staleness**: up to 5min old
5. **Stat Mapping**: some mods lack direct IDs

## Future Enhancements

**item upgrade recommendations**, **resistance gap solver**, **budget build planner**, **price history tracking**, **bulk search**.

## Support

Check: Trade API enabled, Desktop restarted, console logs, network to pathofexile.com; report: https://github.com/ianderse/pob-mcp-server/issues

## References

- [Path of Exile Trade API Documentation](https://www.pathofexile.com/developer/docs)
- [pob-mcp-server README](../README.md)
- [Trade API Implementation Plan](../TRADE_API_IMPLEMENTATION_PLAN.md)
