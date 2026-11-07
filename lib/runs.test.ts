import assert from "node:assert/strict";
import { test } from "node:test";
import page from "../data/page.json" with { type: "json" };
import { fixed, released, tally } from "./runs.ts";

const run = (firstOutcome: string, created: boolean, build = "fix branch") => ({
  build,
  prompt: "save",
  firstStyle: '"outline"',
  firstOutcome,
  calls: 1,
  created,
});

test("counts a rejected first call that later succeeded once in each column", () => {
  assert.deepEqual(tally([run("422 InputInvalid", true), run("422 InputInvalid", false)]), {
    runs: 2,
    firstCallRejected: 2,
    neverCreated: 1,
    firstCallCreated: 0,
  });
});

test("splits runs by build", () => {
  const runs = [run("created", true), run("422 InputInvalid", true, "released 2.0.0-beta.37")];
  assert.equal(released(runs).length, 1);
  assert.equal(fixed(runs).length, 1);
});

test("the recorded bench matches what the page claims", () => {
  assert.deepEqual(tally(released(page.bench)), {
    runs: 6,
    firstCallRejected: 6,
    neverCreated: 2,
    firstCallCreated: 0,
  });
  assert.equal(tally(fixed(page.bench)).firstCallCreated, 6);
  assert.match(page.before.signature, /nested: unknown/);
  assert.match(page.after.signature, /nested: "red" \| "blue"/);
});
