# PoB Headless Bridge Plan

Forked PoB headless API: high‑fidelity calc + live tree edits.

## Overview
- Loads builds/computes stats/edits trees from MCP tools.
- Fork `~/Projects/PathOfBuilding` (server `~/Projects/PathOfBuilding/src`).
- stdio JSON lines (1 per request/response), long‑lived. Optional TCP on 127.0.0.1:POB_API_TCP_PORT.
- `src/pobLuaBridge.ts` spawns/talks to PoB API.
- Feature‑flagged, falls back to XML‑only.

## Architecture
- One PoB Lua process/instance (stdio) or in GUI (TCP); starts on "lua_*"/`lua_start`, stops on shutdown/`lua_stop`.
- `src/pobLuaBridge.ts` spawns `luajit HeadlessWrapper.lua` in `~/Projects/PathOfBuilding/src` w/`POB_API_STDIO=1`; methods `start()`,`stop()`,`ping()`,`loadBuildXml()`,`getStats()`,`getTree()`,`setTree()`.
- Fork API `load_build_xml`,`get_stats`,`get_tree`,`set_tree`,`quit`.

TCP (GUI) mode
- `POB_API_TCP=1` (+`POB_API_TCP_PORT`, default 31337) at PoB GUI launch.
- `src/API/TcpServer.lua`, pumped from `Modules/Main.lua` per frame.
- Same actions as stdio: ping,load_build_xml,get_stats,get_tree,set_tree,update_tree_delta,calc_with,export_build_xml,get_build_info,set_level,get_config,set_config.

### Enabling TCP mode (Windows GUI)
- Start PoB w/env set:
  ```powershell
  # Optional: pick a custom port
  $env:POB_API_TCP_PORT = 31337
  # Required to enable the embedded TCP server
  $env:POB_API_TCP = 1
  & "C:\\Path\\To\\Path of Building\\Path of Building.exe"
  ```
- Binds `127.0.0.1` only (loopback), no LAN.
- Default `31337`, override w/`POB_API_TCP_PORT`.
- First line on connect = banner JSON:
  ```json
  { "ok": true, "ready": true, "version": { "number": "x.y.z", "branch": "...", "platform": "..." } }
  ```

### Functional smoke tests (same Windows PC)
PoB GUI open (build loaded), TCP mode on.

1) PowerShell using TcpClient
```powershell
$c = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 31337)
$s = $c.GetStream()
$r = New-Object IO.StreamReader($s)
$w = New-Object IO.StreamWriter($s); $w.AutoFlush = $true

$banner = $r.ReadLine(); Write-Host "Banner: $banner"

$w.WriteLine('{"action":"ping"}')
$resp1 = $r.ReadLine(); Write-Host "Ping:   $resp1"

$w.WriteLine('{"action":"get_build_info"}')
$resp2 = $r.ReadLine(); Write-Host "Info:   $resp2"

$w.WriteLine('{"action":"get_stats","params":{"fields":["Life","EnergyShield","TotalDPS"]}}')
$resp3 = $r.ReadLine(); Write-Host "Stats:  $resp3"

$c.Close()
```

2) Node.js test (no extra deps)
```js
// save as tcp_test.js and run: node tcp_test.js
import net from 'node:net';

const host = '127.0.0.1', port = 31337;
const sock = net.createConnection({ host, port });
sock.setEncoding('utf8');

let buf = '';
sock.on('data', c => buf += c);

const readLine = () => new Promise((res, rej) => {
  const deadline = Date.now() + 5000;
  const tick = () => {
    const i = buf.indexOf('\n');
    if (i >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); res(line); return; }
    if (Date.now() > deadline) return rej(new Error('timeout'));
    setTimeout(tick, 10);
  };
  tick();
});

const send = obj => sock.write(JSON.stringify(obj) + '\n');

(async () => {
  const banner = await readLine(); console.log('Banner:', banner);
  send({ action: 'ping' });           console.log('Ping:', await readLine());
  send({ action: 'get_build_info' }); console.log('Info:', await readLine());
  send({ action: 'get_stats', params: { fields: ['Life','EnergyShield','TotalDPS'] } });
  console.log('Stats:', await readLine());
  sock.end();
})().catch(e => { console.error(e); try { sock.destroy(); } catch {} });
```

3) Optional mutation tests
- Level: `{"action":"set_level","params":{"level":90}}`
- Export: `{"action":"export_build_xml"}`
- Tree diff: `{"action":"update_tree_delta","params":{"addNodes":[12345]}}` then `get_tree` to verify.

Notes
- `load_build_xml` may be unavailable in GUI TCP.
- TCP actions: `ping`,`version`,`get_build_info`,`get_stats`,`get_tree`,`update_tree_delta`,`calc_with`,`export_build_xml`,`set_level`,`get_config`,`set_config`.

### Diagnostics
- Port: `Test-NetConnection localhost -Port 31337`
- Listener: `netstat -ano | findstr :31337` → `Get-Process -Id <PID>`
- Test fails but PoB runs → check env vars in launching shell.

### Remote testing from macOS (SSH tunnel)
Binds `127.0.0.1` on Windows PC, unreachable across network — use SSH port forwarding:
1) Tunnel macOS→Windows (replace IP/user):
```bash
ssh -L 31337:127.0.0.1:31337 iande@192.168.x.x
```
2) Point client to `127.0.0.1:31337`.

Tip: bundled Node client (`PoBLuaTcpClient` in `build/pobLuaBridge.js`):
```js
import { PoBLuaTcpClient } from './build/pobLuaBridge.js';
const api = new PoBLuaTcpClient({ host: '127.0.0.1', port: 31337 });
await api.start();
console.log('ping:', await api.ping());
console.log('info:', await api.getBuildInfo());
console.log('stats:', await api.getStats(['Life','EnergyShield','TotalDPS']));
await api.stop();
```

### Common issues
- `ssh iande@IanPC` may fail if `IanPC` isn’t in DNS — use Windows IP or `/etc/hosts` entry.
- `TcpTestSucceeded: false`: nothing listening. Ensure `POB_API_TCP=1` set, test `localhost:31337` on Windows (or SSH tunnel).
- Remote access: binding `TcpServer.lua` to `0.0.0.0` exposes the port — not recommended; prefer tunneling.

## MCP Tools (to add)
Atomic tools mapping to PoB API, prefixed `lua_`.

- `lua_start` — start (no‑op if running); `{}`→status text.
- `lua_load_build` — load from raw XML; `{ build_xml: string, name?: string }`→status text.
- `lua_get_stats` — stats; `{ fields?: string[] } // optional field whitelist`→`{ stats: Record<string, number|string> }`
- `lua_get_tree` — `{}`→`{ treeVersion, classId, ascendClassId, secondaryAscendClassId, nodes: number[], masteryEffects: Record<number,number> }`
- `lua_set_tree` — sets class/ascendancy+nodes/masteries, recalcs; `{ classId: number, ascendClassId: number, secondaryAscendClassId?: number, nodes: number[], masteryEffects?: Record<number,number>, treeVersion?: string }`→`{ tree: ... } // same shape as get_tree`
- `lua_stop` — `{}`→status text.

Notes
- Later: `lua_calc_with` via `GetMiscCalculator()`.

## Integration Steps
1. **Flag** — `POB_LUA_ENABLED=true` gates `lua_*` tools, default off.
2. **Lifecycle** — singleton `PoBLuaApiClient`. `lua_start`→`client.start()`, `lua_stop`→`client.stop()`, others auto‑start.
3. **`src/index.ts`** — register in `ListToolsRequestSchema`(`POB_LUA_ENABLED`); `CallToolRequestSchema` validates/calls bridge/wraps errors.
4. **Config**: `POB_LUA_ENABLED`(false),`POB_FORK_PATH`(`~/Projects/PathOfBuilding/src`),`POB_CMD`(`luajit`),`POB_ARGS`(`HeadlessWrapper.lua`),`POB_TIMEOUT_MS`(`10000`)
5. **Docs** — README "Headless PoB Integration" + link `~/Projects/PathOfBuilding/src/API/`.

## Error Handling & Fallbacks
- **Startup**: error, suggest `brew install luajit`/verify `POB_FORK_PATH`; keep XML tools, no crash.
- **Timeouts**: default 10s; on timeout kill process+retry.
- **Invalid inputs**: validate schema first, explicit field errors.
- **Mid‑request exit**: error+exit code, auto‑restart.

## Security & Performance
- Local only, no external network calls.
- Single hot process, teardown on exit.
- Truncate/hash large XML in logs.

## Testing Plan
- **Unit**: bridge pings, banner parsing, timeouts, restart behavior
- **Integration**: `lua_start`→`lua_load_build`(sample XML)→`lua_get_stats`; `lua_get_tree`→`lua_set_tree`→`lua_get_stats`(values change); `lua_stop` idempotency
- **Manual**: macOS w/ `luajit`; fallback when `POB_LUA_ENABLED` false

## Rollout
- Phase 1: tools behind `POB_LUA_ENABLED`, off.
- Phase 2: default-on for validated `luajit`+fork path.
- Phase 3: what‑if diffs (`lua_calc_with`) + gem/item edits.

## Future Enhancements
- What‑if APIs: temp allocation testing, no persist.
- Items/skills ops: structured import+calc.
- Stats contract: curated stable schema for MCP consumers.
- PoB fork collab: upstream an official headless API mode.

## Prerequisites
- `luajit` in PATH (`brew install luajit`)
- PathOfBuilding at `~/Projects/PathOfBuilding` (`src/API/` scaffold)
- Set `POB_LUA_ENABLED=true` to expose new tools.

Node TCP client
- `PoBLuaTcpClient` (`src/pobLuaBridge.ts`)→live GUI: `const api = new PoBLuaTcpClient({ host: '127.0.0.1', port: 31337 });`→`await api.start();`→`loadBuildXml`,`getStats`,`getTree`,`setTree`→`await api.stop();`
