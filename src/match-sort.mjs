const value = (result, key) => Number(result.breakdown?.[key]) || 0;

export function sortMatchResults(results = [], mode = "overall") {
  const items = mode === "hours"
    ? results.filter((result) => result.type === "技能时数交换")
    : [...results];

  return items.sort((left, right) => {
    if (mode === "availability") {
      return value(right, "availability") - value(left, "availability")
        || right.score - left.score
        || String(left.partner.id).localeCompare(String(right.partner.id));
    }
    if (mode === "reciprocity") {
      return value(right, "reciprocity") - value(left, "reciprocity")
        || right.score - left.score
        || String(left.partner.id).localeCompare(String(right.partner.id));
    }
    return right.score - left.score || String(left.partner.id).localeCompare(String(right.partner.id));
  });
}
