import test from "node:test";
import assert from "node:assert/strict";

import { sortMatchResults } from "../src/match-sort.mjs";

const results = [
  { partner: { id: "a" }, score: 82, type: "直接互换", breakdown: { availability: 6, reciprocity: 25 } },
  { partner: { id: "b" }, score: 67, type: "技能时数交换", breakdown: { availability: 15, reciprocity: 4 } },
  { partner: { id: "c" }, score: 74, type: "灵感匹配", breakdown: { availability: 10, reciprocity: 12 } }
];

test("match radar sorts by overall score, time overlap, and reciprocity", () => {
  assert.deepEqual(sortMatchResults(results, "overall").map(x => x.partner.id), ["a", "c", "b"]);
  assert.deepEqual(sortMatchResults(results, "availability").map(x => x.partner.id), ["b", "c", "a"]);
  assert.deepEqual(sortMatchResults(results, "reciprocity").map(x => x.partner.id), ["a", "c", "b"]);
});

test("skill hour mode only keeps skill-hour exchange candidates", () => {
  assert.deepEqual(sortMatchResults(results, "hours").map(x => x.partner.id), ["b"]);
});
