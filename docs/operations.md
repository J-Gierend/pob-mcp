# Operations — running & debugging pob-mcp

## Build & run
- `npm install && npm run build` — compiles TypeScript to `build/`
- `npm start` — runs `build/index.js` as a stdio MCP server; it is launched by an MCP client, not standalone
- Client registration example: `claude_desktop_config.example.json` (point `args` at `build/index.js`, set env below)

## Environment variables
| Var | Default | Purpose |
|---|---|---|
| `POB_DIRECTORY` | OS-default Builds dir | Path to the PoB builds directory (`.xml` builds) |
| `POB_LUA_ENABLED` | `false` | `"true"` enables the Lua bridge (live PoB-engine calculations) |
| `POB_FORK_PATH` | `~/Projects/PathOfBuilding/src` | PathOfBuilding `src/` dir containing `HeadlessWrapper.lua` |
| `POB_CMD` | `luajit` | LuaJIT binary (full path if not on PATH) |
| `POB_TIMEOUT_MS` | `10000` | Lua request timeout (ms) |

## Tests
- `npm test` — full Jest suite
- `npm run test:unit` / `npm run test:integration` / `npm run test:coverage` (writes `coverage/`, gitignored)
- File-watcher manual test setup: `./test-watcher.sh`

## Debugging
- Lua bridge fails: verify `ls "$POB_FORK_PATH/HeadlessWrapper.lua"` exists and `POB_CMD` resolves
- Builds not found: check `POB_DIRECTORY` contains `.xml` files
- Snapshots are stored in `POB_DIRECTORY/.pob-mcp/snapshots/`

Full setup walkthrough and per-tool reference: `README.md`.
