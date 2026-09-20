import test from "node:test";
import assert from "node:assert/strict";

import { normalizeState } from "../src/store.mjs";

test("legacy learner-created assignment data is replaced with incoming partner homework", () => {
  const initial = { version: 2, assignments: [{ id: "new", status: "待确认", partnerName: "陈野" }] };
  const saved = { version: 2, assignments: [{ id: "old", status: "待搭子确认", title: "旧流程作业" }] };
  const restored = normalizeState(saved, initial);
  assert.deepEqual(restored.assignments, initial.assignments);
});

test("current incoming homework survives refresh", () => {
  const initial = { version: 2, assignments: [] };
  const saved = { version: 2, assignments: [{ id: "homework", status: "已领取", partnerName: "陈野" }] };
  const restored = normalizeState(saved, initial);
  assert.deepEqual(restored.assignments, saved.assignments);
});
