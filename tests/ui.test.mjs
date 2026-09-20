import test from "node:test";
import assert from "node:assert/strict";

import { customSelect } from "../src/ui.mjs";

test("custom select renders an accessible listbox without a native select", () => {
  const html = customSelect({
    name: "type",
    value: "作业",
    options: ["阶段成果", "作业", "笔记"]
  });

  assert.doesNotMatch(html, /<select/i);
  assert.match(html, /name="type" value="作业"/);
  assert.match(html, /aria-haspopup="listbox"/);
  assert.match(html, /role="listbox"/);
  assert.match(html, /role="option" aria-selected="true"/);
  assert.match(html, /data-select-value="作业"/);
});

test("custom select supports object options and escapes labels", () => {
  const html = customSelect({
    name: "slot",
    value: "sat-am",
    options: [{ value: "sat-am", label: "周六 <上午>" }]
  });

  assert.match(html, /value="sat-am"/);
  assert.match(html, /周六 &lt;上午&gt;/);
  assert.doesNotMatch(html, /周六 <上午>/);
});
