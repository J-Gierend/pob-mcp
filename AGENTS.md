*Standard: jg-v1 | type: service*
*Inherits global rules from ~/.claude/CLAUDE.md. Project knowledge: brain_query("pob-mcp ...")*

# pob-mcp

MCP server (stdio) that lets Claude analyze, modify, and optimize Path of Building builds using PoB's own Lua calculation engine. Fork of `ianderse/pob-mcp` (kept as `upstream` remote).

## Commands
- Build: `npm run build` (tsc → `build/`)
- Test: `npm test` (`test:unit`, `test:integration`, `test:coverage` variants)
- Run: `npm start` — stdio MCP server, registered in a client config (see `claude_desktop_config.example.json`)
- Dev watch: `npm run dev`

## Map
- `src/` — TypeScript server: `index.ts` entry, `handlers/`, `services/`, `server/` (tool schemas), `pobLuaBridge.ts`
- `tests/` + `tests/unit/` — Jest suites and repro scripts
- `docs/operations.md` — how to run, env vars, debugging
- `docs/` — guides, phase docs, `archive/` for superseded docs
- `plans/` — active plans (`archived/` when done)
- `agent-os/` — Agent OS product/spec docs (legacy planning tooling, driven by `.claude/commands/agent-os/`)
- `external/PathOfBuilding` — PoB checkout as git submodule (Lua engine for the bridge)
- `README.md` — full user-facing setup + tool reference (upstream-style)

## Rules
- Upstream fork: keep `src/` changes mergeable with `ianderse/pob-mcp` where practical.
- All runtime config via env vars (`POB_*`) — never hardcode paths or credentials in tracked files.
- Lua-bridge features require a local PathOfBuilding checkout (`POB_FORK_PATH`); plain XML analysis works without it.
