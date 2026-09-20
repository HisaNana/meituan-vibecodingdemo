export function shouldCommitSearch(event, compositionActive = false) {
  if (event.type === "compositionend") return true;
  return event.type === "input" && !compositionActive && !event.isComposing;
}
