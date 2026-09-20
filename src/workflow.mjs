export const EXCHANGE_STAGES = ["待回应", "已配对", "已排课", "进行中", "待复盘", "已完成"];

export function accountGate(session, onboarded) {
  if (!session) return "register";
  if (!onboarded) return "onboard";
  return "ready";
}

export function validateRegistration({ nickname = "", email = "", password = "" } = {}) {
  const errors = {};
  if (!nickname.trim()) errors.nickname = "请填写昵称";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = "请填写有效邮箱";
  if (password.length < 6) errors.password = "密码至少需要 6 位";
  return { valid: Object.keys(errors).length === 0, errors };
}

export function createExchange(input, id = `exchange-${Date.now()}`) {
  const createdAt = new Date().toISOString();
  return {
    id,
    partnerId: input.partnerId,
    skillPair: input.skillPair || {},
    slot: input.slot || "待协商",
    lessonType: input.lessonType || "试学",
    status: "待回应",
    createdAt,
    messages: [
      {
        id: `${id}-system-1`,
        sender: "system",
        type: "system",
        text: `交换申请已发出：${input.lessonType || "试学"} · ${input.slot || "时间待协商"}`,
        createdAt
      }
    ]
  };
}

export function advanceExchange(exchange) {
  const index = EXCHANGE_STAGES.indexOf(exchange.status);
  const nextStatus = EXCHANGE_STAGES[Math.min(Math.max(index, 0) + 1, EXCHANGE_STAGES.length - 1)];
  return { ...exchange, status: nextStatus, updatedAt: new Date().toISOString() };
}
