export const HOMEWORK_STAGES = ["待确认", "已领取", "已完成"];

export function createIncomingHomework(input, id = `homework-${Date.now()}`) {
  return {
    id,
    title: String(input.title || "").trim(),
    criteria: String(input.criteria || "").trim(),
    due: String(input.due || "下次课前").trim(),
    course: String(input.course || "共学课程").trim(),
    partnerId: input.partnerId || null,
    partnerName: String(input.partnerName || "学习搭子").trim(),
    sessionId: input.sessionId || null,
    status: "待确认",
    done: false,
    createdAt: new Date().toISOString()
  };
}

export function advanceHomework(homework) {
  const current = HOMEWORK_STAGES.includes(homework.status)
    ? homework.status
    : homework.done ? "已完成" : "待确认";
  const index = HOMEWORK_STAGES.indexOf(current);
  const next = HOMEWORK_STAGES[Math.min(index + 1, HOMEWORK_STAGES.length - 1)];
  return {
    ...homework,
    status: next,
    done: next === "已完成",
    acceptedAt: next === "已领取" ? new Date().toISOString() : homework.acceptedAt,
    completedAt: next === "已完成" ? new Date().toISOString() : homework.completedAt
  };
}

export function createSharedNote(input, id = `note-${Date.now()}`) {
  const body = [input.takeaway,input.question&&`待解决：${input.question}`,input.nextStep&&`下一步：${input.nextStep}`].filter(Boolean).join(" · ");
  return {
    id,
    sessionId: input.sessionId || null,
    partnerId: input.partnerId || null,
    title: String(input.title || "").trim(),
    takeaway: String(input.takeaway || "").trim(),
    question: String(input.question || "").trim(),
    nextStep: String(input.nextStep || "").trim(),
    body,
    shareStatus: "已发给搭子",
    updatedAt: "刚刚"
  };
}
