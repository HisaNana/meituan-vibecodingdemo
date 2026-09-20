import test from "node:test";
import assert from "node:assert/strict";

import { filterHallMatches, recommendUnselectedSkills } from "../src/discovery.mjs";

const profile = {
  city: "上海",
  learns: [{ skill: "Python 自动化" }],
  teaches: [{ skill: "手机摄影" }]
};

const results = [
  { partner: { id: "a", city: "上海", mode: "线上", availability: ["tue-pm"], teaches: [{ skill: "数据分析" }] } },
  { partner: { id: "b", city: "杭州", mode: "均可", availability: ["sat-am"], teaches: [{ skill: "英语口语" }] } },
  { partner: { id: "c", city: "上海", mode: "线下", availability: ["sun-night"], teaches: [{ skill: "数据分析" }] } }
];

test("hall filters combine evening, online, local and teaching skill", () => {
  assert.deepEqual(filterHallMatches(results, { evening: true }, profile).map(x => x.partner.id), ["a", "c"]);
  assert.deepEqual(filterHallMatches(results, { online: true }, profile).map(x => x.partner.id), ["a", "b"]);
  assert.deepEqual(filterHallMatches(results, { local: true, skill: "数据分析" }, profile).map(x => x.partner.id), ["a", "c"]);
  assert.deepEqual(filterHallMatches(results, { evening: true, online: true, local: true }, profile).map(x => x.partner.id), ["a"]);
});

test("skill recommendations exclude skills already in the profile and aggregate mentors", () => {
  const recommendations = recommendUnselectedSkills(profile, results.map(x => x.partner));
  assert.deepEqual(recommendations.map(x => x.skill), ["数据分析", "英语口语"]);
  assert.deepEqual(recommendations[0], { skill: "数据分析", mentors: 2, eveningMentors: 2 });
  assert.ok(recommendations.every(x => !["Python 自动化", "手机摄影"].includes(x.skill)));
});
