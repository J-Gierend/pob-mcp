# Getting Your Path of Building Files from PC

## Where to Find Your Builds on Windows

Path of Building builds stored in:

```
C:\Users\<YourUsername>\Documents\Path of Building\Builds
```

Or alternatively:
```
C:\Users\<YourUsername>\AppData\Roaming\Path of Building\Builds
```

## Steps to Transfer

### Option 1: Direct Copy (Recommended)

1. Navigate to builds folder on PC
2. Copy `.xml` files
3. Transfer via USB/cloud/email
4. On Mac, place in:
   ```
   ~/Documents/Path of Building/Builds/
   ```

   Create the directory if missing:
   ```bash
   mkdir -p ~/Documents/Path\ of\ Building/Builds
   ```

### Option 2: Cloud Sync (Ongoing)

1. Move builds folder to a synced location
2. Change PoB's builds dir (or symlink)
3. Point `POB_DIRECTORY` to synced folder

## Configuring the MCP Server

Update the Claude Desktop config:

**Mac Configuration File**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pob": {
      "command": "node",
      "args": ["/absolute/path/to/pob-mcp-server/build/index.js"],
      "env": {
        "POB_DIRECTORY": "/Users/yourusername/Documents/Path of Building/Builds"
      }
    }
  }
}
```

Replace `/absolute/path/to/pob-mcp-server` with your cloned/built path.

## Testing the Setup

1. Copy builds
2. Verify:
   ```bash
   ls -la ~/Documents/Path\ of\ Building/Builds/
   ```

3. Update config
4. Restart Claude
5. Ask: "List my PoB builds"

## File Format

Builds are `.xml`: class, tree, gems, equipment, config, stats. Readable; easier via MCP.

## Quick Test

- "Show all my PoB builds"
- "Analyze [BuildName].xml"
- "Compare [Build1].xml and [Build2].xml"
- "DPS on [BuildName]?"
