export const ASSIGNMENT_STAGES = ["待完成", "待搭子确认", "已确认", "已打卡"];

export function createAssignment(input, id = `assignment-${Date.now()}`) {
  return {
    id,
    title: String(input.title || "").trim(),
    criteria: String(input.criteria || "").trim(),
    due: String(input.due || "待协商").trim(),
    course: String(input.course || "共学课程").trim(),
    sessionId: input.sessionId || null,
    status: "待完成",
    done: false,
    createdAt: new Date().toISOString()
  };
}

export function advanceAssignment(assignment) {
  const current = assignment.status || (assignment.done ? "已确认" : "待完成");
  const index = ASSIGNMENT_STAGES.indexOf(current);
  if (index < 0 || index >= ASSIGNMENT_STAGES.length - 2) return { ...assignment, status: current };
  return {
    ...assignment,
    status: ASSIGNMENT_STAGES[index + 1],
    submittedAt: index === 0 ? new Date().toISOString() : assignment.submittedAt,
    confirmedAt: index === 1 ? new Date().toISOString() : assignment.confirmedAt
  };
}

export function assignmentToCheckin(assignment, profile = {}, id = `post-${Date.now()}`) {
  if (assignment.status !== "已确认") throw new Error("作业需经搭子确认后才能转为成长打卡");
  const author = profile.nickname || "我";
  return {
    assignment: { ...assignment, status: "已打卡", done: true, checkedInAt: new Date().toISOString() },
    post: {
      id,
      author,
      avatar: author.slice(0, 1),
      color: "green",
      type: "阶段成果",
      content: `完成了「${assignment.title}」：${assignment.criteria || "已通过搭子确认"}`,
      likes: 0,
      liked: false,
      comments: 0,
      time: "刚刚"
    }
  };
}
