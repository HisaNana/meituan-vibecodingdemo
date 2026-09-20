import test from "node:test";
import assert from "node:assert/strict";

import { advanceAssignment, assignmentToCheckin, createAssignment } from "../src/learning.mjs";

test("a classroom assignment moves through submission and partner confirmation", () => {
  let assignment = createAssignment({ title: "完成一支 30 秒短片", criteria: "包含转场和字幕", due: "周日前", course: "视频剪辑" }, "assignment-demo");
  assert.equal(assignment.status, "待完成");
  assignment = advanceAssignment(assignment);
  assert.equal(assignment.status, "待搭子确认");
  assignment = advanceAssignment(assignment);
  assert.equal(assignment.status, "已确认");
});

test("only a confirmed assignment can become a growth check-in", () => {
  const pending = createAssignment({ title: "完成一支 30 秒短片", criteria: "包含转场和字幕", due: "周日前", course: "视频剪辑" }, "assignment-demo");
  assert.throws(() => assignmentToCheckin(pending, { nickname: "林一" }, "post-demo"), /确认/);

  const confirmed = advanceAssignment(advanceAssignment(pending));
  const result = assignmentToCheckin(confirmed, { nickname: "林一" }, "post-demo");
  assert.equal(result.assignment.status, "已打卡");
  assert.equal(result.assignment.done, true);
  assert.equal(result.post.type, "阶段成果");
  assert.match(result.post.content, /完成一支 30 秒短片/);
});
