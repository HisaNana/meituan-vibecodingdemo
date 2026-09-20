const EVENING_SLOTS = new Set([
  "mon-pm", "tue-pm", "wed-pm", "thu-pm", "fri-pm", "sat-night", "sun-night"
]);

function isEveningAvailable(person) {
  return person.availability.some((slot) => EVENING_SLOTS.has(slot));
}

export function filterHallMatches(results, filters, profile) {
  return results.filter(({ partner }) => {
    if (filters.evening && !isEveningAvailable(partner)) return false;
    if (filters.online && !["线上", "均可"].includes(partner.mode)) return false;
    if (filters.local && partner.city !== profile.city) return false;
    if (filters.skill && !partner.teaches.some(({ skill }) => skill === filters.skill)) return false;
    return true;
  });
}

export function recommendUnselectedSkills(profile, people, limit = 4) {
  const selected = new Set([
    ...profile.learns.map(({ skill }) => skill),
    ...profile.teaches.map(({ skill }) => skill)
  ]);
  const counts = new Map();

  for (const person of people) {
    for (const { skill } of person.teaches) {
      if (selected.has(skill)) continue;
      const item = counts.get(skill) || { skill, mentors: 0, eveningMentors: 0 };
      item.mentors += 1;
      if (isEveningAvailable(person)) item.eveningMentors += 1;
      counts.set(skill, item);
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.mentors - a.mentors || b.eveningMentors - a.eveningMentors || a.skill.localeCompare(b.skill, "zh-CN"))
    .slice(0, limit);
}
