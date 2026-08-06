*Standard: jg-v1 | type: service*
*Inherits ~/.claude/CLAUDE.md. brain_query("pob-mcp ...")*

# pob-mcp
MCP stdio server: analyze/optimize PoB builds via Lua engine. Fork `ianderse/pob-mcp`(`upstream`).

## Commands
`npm run build`(tsc→`build/`)·`npm test`(`test:unit`,`test:integration`,`test:coverage`)·`npm start`(`claude_desktop_config.example.json`)·`npm run dev`

## Map
`src/`:`index.ts`,`handlers/`,`services/`,`server/`,`pobLuaBridge.ts`
`tests/`+`tests/unit/`·`docs/operations.md`·`docs/`+`archive/`·`plans/`(`archived/`)·`agent-os/` product/spec via `.claude/commands/agent-os/`·`external/PathOfBuilding`·`README.md`

## Rules
`src/` mergeable with `ianderse/pob-mcp`.
Env only (`POB_*`) — never hardcode paths/credentials.
Lua-bridge needs local PoB checkout (`POB_FORK_PATH`); XML works without.
