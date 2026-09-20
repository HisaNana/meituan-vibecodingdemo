import test from "node:test";
import assert from "node:assert/strict";
import { compactSlotLabel } from "../src/schedule.mjs";

test("schedule cards keep the weekday and remove the broad time period", () => {
  assert.equal(compactSlotLabel("周二晚上"), "周二");
  assert.equal(compactSlotLabel("周六上午"), "周六");
  assert.equal(compactSlotLabel("时间待协商"), "时间待协商");
});
