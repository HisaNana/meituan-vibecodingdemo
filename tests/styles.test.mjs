import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("brand mark keeps its grid centering despite generic brand span styles", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.brand>div span\{display:block/);
  assert.doesNotMatch(css, /\.brand span\{display:block/);
});

test("side profile text rules do not override the avatar layout", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css, /\.side-profile>div strong,\.side-profile>div span\{display:block/);
  assert.doesNotMatch(css, /\.side-profile strong,\.side-profile span\{display:block/);
});
