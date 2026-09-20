export const SKILL_GROUPS = {
  "Python 自动化": "编程",
  "前端开发": "编程",
  "数据分析": "编程",
  "Excel 数据分析": "效率",
  "手机摄影": "摄影",
  "人像摄影": "摄影",
  "旅行摄影": "摄影",
  "视频剪辑": "影像",
  "短视频运营": "影像",
  "英语口语": "语言",
  "日语入门": "语言",
  "吉他弹唱": "音乐",
  "尤克里里": "音乐",
  "咖啡拉花": "生活",
  "健身入门": "生活",
  "平面设计": "设计",
  "PPT 设计": "设计"
};

const RELATED_GROUPS = new Set([
  "摄影:影像",
  "影像:摄影",
  "设计:影像",
  "影像:设计",
  "编程:效率",
  "效率:编程"
]);

function relationScore(wanted, offered) {
  if (!wanted || !offered) return 0;
  if (wanted === offered) return 1;
  const wantedGroup = SKILL_GROUPS[wanted];
  const offeredGroup = SKILL_GROUPS[offered];
  if (wantedGroup && wantedGroup === offeredGroup) return 0.65;
  if (RELATED_GROUPS.has(`${wantedGroup}:${offeredGroup}`)) return 0.35;
  return 0;
}

function bestDirectionalFit(learns = [], teaches = [], maximum) {
  if (!learns.length || !teaches.length) {
    return { points: 0, pair: null, raw: 0 };
  }

  let totalWeight = 0;
  let weightedFit = 0;
  let bestPair = null;
  let bestPairValue = -1;

  for (const wanted of learns) {
    const weight = Math.max(1, Number(wanted.priority) || 1);
    totalWeight += weight;
    let best = { relation: 0, offered: null };
    for (const offered of teaches) {
      const relation = relationScore(wanted.skill, offered.skill);
      if (relation > best.relation) best = { relation, offered };
    }
    weightedFit += best.relation * weight;
    const pairValue = best.relation * weight;
    if (pairValue > bestPairValue && best.offered) {
      bestPairValue = pairValue;
      bestPair = { learn: wanted, teach: best.offered, relation: best.relation };
    }
  }

  const raw = totalWeight ? weightedFit / totalWeight : 0;
  return { points: Math.round(raw * maximum), pair: bestPair, raw };
}

function sharedAvailability(left = [], right = []) {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((slot) => rightSet.has(slot)).sort();
}

function availabilityPoints(sharedCount) {
  if (sharedCount >= 3) return 15;
  if (sharedCount === 2) return 10;
  if (sharedCount === 1) return 6;
  return 0;
}

function levelPoints(pair) {
  if (!pair) return 2;
  const providerLevel = Number(pair.teach.level) || 1;
  const targetLevel = Number(pair.learn.targetLevel) || 1;
  if (providerLevel >= targetLevel) return 10;
  if (providerLevel === targetLevel - 1) return 6;
  return 2;
}

function preferencePoints(person, candidate) {
  const modeMatch = person.mode === candidate.mode || person.mode === "均可" || candidate.mode === "均可";
  if (!modeMatch) return 0;
  if (person.mode === "线上" || candidate.mode === "线上") return 5;
  return person.city && person.city === candidate.city ? 5 : 2;
}

function proofPoints(proofs = []) {
  if (!proofs.length) return 0;
  if (proofs.length >= 2 || proofs.some((proof) => proof.type === "video" || proof.type?.startsWith("video/"))) return 5;
  return 3;
}

function reliabilityPoints(reliability) {
  if (reliability == null) return 3;
  if (reliability >= 95) return 5;
  if (reliability >= 85) return 4;
  if (reliability >= 70) return 3;
  if (reliability >= 50) return 2;
  return 1;
}

export function calculateMatch(person, candidate) {
  const learning = bestDirectionalFit(person.learns, candidate.teaches, 35);
  const reciprocity = bestDirectionalFit(candidate.learns, person.teaches, 25);
  const sharedSlots = sharedAvailability(person.availability, candidate.availability);
  const breakdown = {
    learning: learning.points,
    reciprocity: reciprocity.points,
    availability: availabilityPoints(sharedSlots.length),
    level: levelPoints(learning.pair),
    preference: preferencePoints(person, candidate),
    proof: proofPoints(candidate.proofs),
    reliability: reliabilityPoints(candidate.reliability)
  };
  const score = Object.values(breakdown).reduce((sum, points) => sum + points, 0);
  const type = breakdown.reciprocity >= 15
    ? "直接互换"
    : breakdown.learning >= 21
      ? "技能时数交换"
      : "灵感匹配";

  const reasons = [
    breakdown.learning >= 28 && "想学技能高度命中",
    breakdown.reciprocity >= 15 && "双方技能互补",
    sharedSlots.length > 0 && `${sharedSlots.length} 个共同时间段`,
    breakdown.level === 10 && "教学水平适配",
    breakdown.proof >= 3 && "有能力证明",
    breakdown.reliability >= 4 && "履约表现稳定"
  ].filter(Boolean).slice(0, 3);

  return {
    score,
    type,
    breakdown,
    sharedSlots,
    reasons: reasons.length ? reasons : ["可以先聊聊学习目标"],
    skillPair: {
      learn: learning.pair?.learn.skill || person.learns?.[0]?.skill || "待完善",
      partnerTeaches: learning.pair?.teach.skill || candidate.teaches?.[0]?.skill || "待完善",
      teach: reciprocity.pair?.teach.skill || person.teaches?.[0]?.skill || "技能时数",
      partnerLearns: reciprocity.pair?.learn.skill || candidate.learns?.[0]?.skill || "技能时数"
    }
  };
}

export function rankMatches(person, candidates = []) {
  return candidates
    .map((partner) => ({ partner, ...calculateMatch(person, partner) }))
    .sort((left, right) => right.score - left.score || String(left.partner.id).localeCompare(String(right.partner.id)));
}
