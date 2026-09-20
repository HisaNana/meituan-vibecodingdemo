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

test("legacy assignment check-in posts are removed during migration", () => {
  const initial = { version: 2, assignments: [], posts: [{ id: "demo", content: "正常动态" }] };
  const saved = { version: 2, assignments: [], posts: [
    { id: "legacy", content: "完成了作业：已通过搭子确认" },
    { id: "mine", content: "今天学会了循环" }
  ] };
  const restored = normalizeState(saved, initial);
  assert.deepEqual(restored.posts.map(post => post.id), ["mine"]);
});
