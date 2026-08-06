# Operations — running & debugging pob-mcp

## Build & run
`npm install && npm run build`→`build/`. `npm start`→`build/index.js` stdio. `claude_desktop_config.example.json`(`args`→`build/index.js`).

## Environment variables
`POB_DIRECTORY`(OS default):builds(`.xml`)·`POB_LUA_ENABLED`(`false`):`"true"`=bridge·`POB_FORK_PATH`(`~/Projects/PathOfBuilding/src`):`src/` w/`HeadlessWrapper.lua`·`POB_CMD`(`luajit`)·`POB_TIMEOUT_MS`(`10000`)ms

## Tests
`npm test`·`npm run test:unit`/`npm run test:integration`/`npm run test:coverage`(→`coverage/`)·`./test-watcher.sh`

## Debugging
Lua fails:`ls "$POB_FORK_PATH/HeadlessWrapper.lua"`,`POB_CMD`. No builds:`POB_DIRECTORY``.xml`. Snapshots:`POB_DIRECTORY/.pob-mcp/snapshots/`.

`README.md`.
