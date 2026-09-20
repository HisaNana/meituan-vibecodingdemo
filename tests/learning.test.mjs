import test from "node:test";
import assert from "node:assert/strict";

import { advanceHomework, createIncomingHomework, createSharedNote } from "../src/learning.mjs";

test("homework sent by a partner is accepted and completed by the learner", () => {
  let homework = createIncomingHomework({ title: "完成一支 30 秒短片", criteria: "包含转场和字幕", due: "下次课前", course: "视频剪辑", partnerName: "阿洛" }, "homework-demo");
  assert.equal(homework.status, "待确认");
  assert.equal(homework.partnerName, "阿洛");
  homework = advanceHomework(homework);
  assert.equal(homework.status, "已领取");
  homework = advanceHomework(homework);
  assert.equal(homework.status, "已完成");
});

test("a structured lesson note can be shared with the teaching partner", () => {
  const note = createSharedNote({
    title: "循环与条件判断",
    takeaway: "能用循环批量处理任务",
    question: "异常处理怎么写",
    nextStep: "完成文件整理脚本",
    partnerId: "chenye"
  }, "note-demo");
  assert.equal(note.shareStatus, "已发给搭子");
  assert.equal(note.partnerId, "chenye");
  assert.match(note.body, /下一步：完成文件整理脚本/);
});
