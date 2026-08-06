# Path of Building MCP Server - Quick Start

**Analyze Path of Exile builds with Claude!**

## What You've Built

MCP server: read/compare builds, extract stats/items, optimize.

## Next Steps

### 1. Get Your Builds from PC → Mac

`TRANSFER_GUIDE.md`: PC `C:\Users\<You>\Documents\Path of Building\Builds\`→`.xml`→Mac `~/Documents/Path of Building/Builds/`.

Tip: set `POB_DIRECTORY` if undetected (default `~/Path of Building/Builds`).

### 2. Configure Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (from `claude_desktop_config.example.json`): `build/index.js`+builds dir.

### 3. Restart Claude Desktop

Quit+restart.

### 4. Test It!

"List builds" · "Analyze <build-name>.xml" · "Compare <build1>.xml/<build2>.xml" · "life/DPS on <build>?"

## Project Structure

```
pob-mcp/
├── src/
│   ├── index.ts              # Main MCP server entry point
│   ├── server/               # MCP server, tool routing, schemas
│   ├── handlers/             # Tool handler implementations
│   ├── services/             # Business logic services
│   └── types/                # TypeScript type definitions
├── tests/                    # Test suites
├── build/                    # Compiled JavaScript (after npm run build)
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
└── README.md                 # Full documentation
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode for development
npm run dev
```

## How It Works

MCP Protocol · XML Parsing · Resources=readable builds · Tools=analysis/stats.

## Example Interactions

**You**: "Show builds" → *list_builds*: "15: Lightning Arrow Deadeye.xml, RF Chieftain.xml..."

**You**: "Analyze Lightning Arrow" → *analyze_build*: "Lvl 95 Deadeye, 4.2M DPS..."

**You**: "Compare Deadeyes" → *compare_builds*: "A:3.5M vs B:2.8M DPS, better defense..."

## Troubleshooting

No builds→`POB_DIRECTORY` · won't start→`build/index.js` abs path · no server→restart · parse errors→valid XML.

## Future Ideas

Passive tree · gem-link alts · budget/expensive gear · PoE Wiki · DPS/breakpoints.
