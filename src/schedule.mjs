export function compactSlotLabel(label = "") {
  return String(label).replace(/(上午|下午|晚上)$/, "");
}
