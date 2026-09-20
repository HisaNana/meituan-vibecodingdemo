import test from "node:test";
import assert from "node:assert/strict";

import {
  EXCHANGE_STAGES,
  accountGate,
  advanceExchange,
  createExchange,
  validateRegistration
} from "../src/workflow.mjs";

test("registered users resume onboarding instead of seeing registration again", () => {
  assert.equal(accountGate(null, false), "register");
  assert.equal(accountGate({ email: "demo@example.com" }, false), "onboard");
  assert.equal(accountGate({ email: "demo@example.com" }, true), "ready");
});

test("experience registration requires a valid email and six character password", () => {
  assert.deepEqual(validateRegistration({ nickname: "", email: "bad", password: "123" }), {
    valid: false,
    errors: {
      nickname: "请填写昵称",
      email: "请填写有效邮箱",
      password: "密码至少需要 6 位"
    }
  });
  assert.equal(validateRegistration({ nickname: "小林", email: "lin@example.com", password: "123456" }).valid, true);
});

test("new exchange starts pending with a system message", () => {
  const exchange = createExchange({
    partnerId: "chenye",
    skillPair: { learn: "Python 自动化", teach: "手机摄影" },
    slot: "sat-am",
    lessonType: "试学"
  }, "exchange-1");
  assert.equal(exchange.id, "exchange-1");
  assert.equal(exchange.status, "待回应");
  assert.match(exchange.messages[0].text, /试学/);
});

test("exchange advances through the declared stages and stops at completed", () => {
  let exchange = createExchange({ partnerId: "chenye", skillPair: {}, slot: "sat-am", lessonType: "试学" }, "exchange-2");
  for (const expected of EXCHANGE_STAGES.slice(1)) {
    exchange = advanceExchange(exchange);
    assert.equal(exchange.status, expected);
  }
  assert.equal(advanceExchange(exchange).status, "已完成");
});
