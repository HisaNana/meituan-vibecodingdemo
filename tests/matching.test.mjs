import test from "node:test";
import assert from "node:assert/strict";

import { calculateMatch, rankMatches } from "../src/matching.mjs";

const me = {
  teaches: [
    { skill: "手机摄影", level: 3 },
    { skill: "英语口语", level: 2 }
  ],
  learns: [
    { skill: "Python 自动化", priority: 3, targetLevel: 2 },
    { skill: "视频剪辑", priority: 1, targetLevel: 1 }
  ],
  availability: ["sat-am", "sat-pm", "wed-pm"],
  mode: "线上",
  city: "上海",
  proofs: [],
  reliability: null
};

const directPartner = {
  id: "direct",
  teaches: [{ skill: "Python 自动化", level: 3 }],
  learns: [{ skill: "手机摄影", priority: 3, targetLevel: 2 }],
  availability: ["sat-am", "sat-pm", "sun-am"],
  mode: "线上",
  city: "上海",
  proofs: [{ type: "video" }],
  reliability: 96
};

test("scores all seven components to a 100 point maximum", () => {
  const result = calculateMatch(me, directPartner);
  assert.deepEqual(Object.keys(result.breakdown), [
    "learning",
    "reciprocity",
    "availability",
    "level",
    "preference",
    "proof",
    "reliability"
  ]);
  assert.equal(result.score, Object.values(result.breakdown).reduce((sum, value) => sum + value, 0));
  assert.ok(result.score <= 100);
});

test("labels a strongly reciprocal candidate as a direct exchange", () => {
  const result = calculateMatch(me, directPartner);
  assert.equal(result.type, "直接互换");
  assert.equal(result.skillPair.learn, "Python 自动化");
  assert.equal(result.skillPair.teach, "手机摄影");
});

test("uses the specified availability point bands", () => {
  const one = calculateMatch(me, { ...directPartner, availability: ["sat-am"] });
  const two = calculateMatch(me, { ...directPartner, availability: ["sat-am", "sat-pm"] });
  const three = calculateMatch(me, { ...directPartner, availability: me.availability });
  assert.equal(one.breakdown.availability, 6);
  assert.equal(two.breakdown.availability, 10);
  assert.equal(three.breakdown.availability, 15);
});

test("ranks equal scores deterministically by id", () => {
  const results = rankMatches(me, [
    { ...directPartner, id: "zeta" },
    { ...directPartner, id: "alpha" }
  ]);
  assert.deepEqual(results.map((item) => item.partner.id), ["alpha", "zeta"]);
});
