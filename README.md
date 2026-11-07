# Nested `jsonSchema()` fields reach agents as `unknown`

Unofficial demo by Cheryl Aurelia: not affiliated with Executor.

**Problem** ([UsefulSoftwareCo/executor#2472](https://github.com/UsefulSoftwareCo/executor/issues/2472)):
a `jsonSchema(...)` field inside `object({...})` is listed as `{}`, so Executor's `search` and
`describe` show agents `nested: unknown`, while the call is still validated against the
document. Reproduced on 2026-11-07 against a local Executor 2.0.0-beta.37 over its MCP endpoint
(`data/captures/before.json`).

**Fix:** branch [`fix/nested-json-schema`](https://github.com/cherylaurelia/executor/tree/fix/nested-json-schema)
(also as `public/executor-nested-json-schema.patch`, apply with `git am`). The lazy decoder gets a
`toCodecJson` link to `Schema.Json` with a pass-through filter that returns the document, the way
`Schema.Date` is described as a string. Documents with `$ref`/`$defs`/identifiers stay `{}` when
nested. `data/captures/after.json` is the same app on a server built from the branch.

**Agent bench** (`data/captures/bench.json`): a small button app with a nested
`jsonSchema({ enum: ["solid", "outline", "ghost"] })`, headless Claude Code (Sonnet) with only
the Executor MCP tools, two tasks × 3 runs per build, alternating order. Released: 6/6 first calls
rejected, 2/6 never made the button. Fix branch: 6/6 made it on the first call. The button app is
a test fixture I wrote, not a real Executor app.

## Files
- `data/captures/*.json`: MCP captures (`scripts/capture.py`) and the bench summary (tool inputs and outcomes only).
- `scripts/flatten.py`: turns the captures into `data/page.json`, which the page renders.
- `lib/runs.ts`: bench tallies, tested in `lib/runs.test.ts` (`npm test`).

## Run
```sh
npm install
npm run build && npm start
```
