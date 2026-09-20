import test from "node:test";
import assert from "node:assert/strict";

import { shouldCommitSearch } from "../src/search.mjs";

test("search does not rerender while a Chinese IME composition is active", () => {
  assert.equal(shouldCommitSearch({ type: "input", isComposing: true }, true), false);
  assert.equal(shouldCommitSearch({ type: "input", isComposing: false }, true), false);
});

test("search commits after composition ends and for ordinary input", () => {
  assert.equal(shouldCommitSearch({ type: "compositionend", isComposing: false }, false), true);
  assert.equal(shouldCommitSearch({ type: "input", isComposing: false }, false), true);
});
