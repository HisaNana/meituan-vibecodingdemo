function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);
}

function dataAttributes(data = {}) {
  return Object.entries(data)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`)
    .join("");
}

export function customSelect({ name = "", value, options, label = "请选择", data = {}, className = "" }) {
  const normalized = options.map((option) => typeof option === "object"
    ? { value: String(option.value), label: String(option.label) }
    : { value: String(option), label: String(option) });
  const selected = normalized.find((option) => option.value === String(value)) || normalized[0];
  const input = name ? `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(selected?.value || "")}" data-select-input>` : "";
  const attrs = dataAttributes(data);

  return `<div class="select-shell ${escapeHtml(className)}"${attrs}>${input}<button type="button" class="select-trigger" aria-haspopup="listbox" aria-expanded="false"><span>${escapeHtml(selected?.label || label)}</span><i aria-hidden="true"></i></button><div class="select-menu" role="listbox" aria-label="${escapeHtml(label)}" hidden>${normalized.map((option) => `<button type="button" class="select-option${option.value === selected?.value ? " selected" : ""}" role="option" aria-selected="${option.value === selected?.value}" data-select-value="${escapeHtml(option.value)}"><span>${escapeHtml(option.label)}</span><b aria-hidden="true">✓</b></button>`).join("")}</div></div>`;
}
