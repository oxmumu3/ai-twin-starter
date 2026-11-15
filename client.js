window.__ModuleLoader__.load({id:"@oxmumu3/dsh-agent-twin",factory:require=>{const module={exports:{}};const exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src-client/index.js
var index_exports = {};
__export(index_exports, {
  TwinWorkbenchRoot: () => TwinWorkbenchRoot,
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react4 = __toESM(require("react"), 1);

// src-client/styles.js
var TWIN_STYLE_ID = "dsh-agent-twin-v4-styles";
var CLIENT_CSS = `
.tw-root,
.tw-dialog {
  color-scheme: light dark;
  --tw-bg: var(--dsw-alias-bg-base, #faf9f6);
  --tw-surface: var(--dsw-alias-bg-layer-1, #ffffff);
  --tw-sunken: var(--dsw-alias-bg-layer-2, #f3f1ec);
  --tw-border: var(--dsw-alias-border-l4, #e4e1da);
  --tw-border-strong: var(--dsw-alias-border-l3, #c9c4b9);
  --tw-ink: var(--dsw-alias-label-primary, #1c1917);
  --tw-muted: var(--dsw-alias-label-secondary, #57534e);
  --tw-subtle: var(--dsw-alias-label-tertiary, #78716c);
  --tw-accent: var(--dsw-alias-state-business-primary, #1d4ed8);
  --tw-accent-soft: color-mix(in srgb, var(--tw-accent) 10%, transparent);
  --tw-ok: var(--dsw-alias-state-success-primary, #15803d);
  --tw-ok-soft: rgba(21, 128, 61, 0.1);
  --tw-warn: var(--dsw-alias-state-warning-primary, #b45309);
  --tw-warn-soft: rgba(217, 119, 6, 0.11);
  --tw-danger: var(--dsw-alias-state-error-primary, #b91c1c);
  --tw-danger-soft: rgba(185, 28, 28, 0.1);
  --tw-radius: 0.75rem;
  --tw-font: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", sans-serif);
  font-family: var(--tw-font);
  color: var(--tw-ink);
  box-sizing: border-box;
}

.tw-root *,
.tw-dialog * {
  box-sizing: border-box;
}

:is(.dark, [data-theme="dark"], [data-color-scheme="dark"]) .tw-root,
:is(.dark, [data-theme="dark"], [data-color-scheme="dark"]) .tw-dialog {
  --tw-bg: var(--dsw-alias-bg-base, #111317);
  --tw-surface: var(--dsw-alias-bg-layer-1, #181b20);
  --tw-sunken: var(--dsw-alias-bg-layer-2, #1f232b);
  --tw-border: var(--dsw-alias-border-l4, #2a2f3a);
  --tw-border-strong: var(--dsw-alias-border-l3, #3e4554);
  --tw-ink: var(--dsw-alias-label-primary, #f5f5f4);
  --tw-muted: var(--dsw-alias-label-secondary, #a8a29e);
  --tw-subtle: var(--dsw-alias-label-tertiary, #78716c);
  --tw-accent: var(--dsw-alias-state-business-primary, #60a5fa);
  --tw-ok: var(--dsw-alias-state-success-primary, #4ade80);
  --tw-ok-soft: rgba(74, 222, 128, 0.14);
  --tw-warn: var(--dsw-alias-state-warning-primary, #fbbf24);
  --tw-warn-soft: rgba(251, 191, 36, 0.14);
  --tw-danger: var(--dsw-alias-state-error-primary, #f87171);
  --tw-danger-soft: rgba(248, 113, 113, 0.14);
}

.tw-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  container-type: inline-size;
  background: var(--tw-bg);
  font-size: clamp(0.875rem, 0.85rem + 0.12cqi, 0.96rem);
  line-height: 1.5;
}

.tw-topbar {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  padding: 0.875rem 1.35rem;
  background: var(--tw-surface);
  border-bottom: 1px solid var(--tw-border);
}

.tw-brand {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-width: 0;
}

.tw-brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
  background: var(--tw-accent-soft);
  color: var(--tw-accent);
  flex-shrink: 0;
}

.tw-brand-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.01em;
}

.tw-brand-sub {
  margin: 0;
  font-size: 0.78rem;
  color: var(--tw-muted);
}

.tw-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.tw-root .tw-tab {
  appearance: none;
  border: 1px solid transparent;
  background: transparent;
  color: var(--tw-muted);
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 550;
  padding: 0.42rem 0.82rem;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.tw-root .tw-tab:hover {
  background: var(--tw-sunken);
  color: var(--tw-ink);
}

.tw-root .tw-tab.is-active {
  background: var(--tw-accent-soft);
  border-color: color-mix(in srgb, var(--tw-accent) 28%, transparent);
  color: var(--tw-accent);
  font-weight: 600;
}

.tw-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.15rem 1.35rem 2.75rem;
}

.tw-container {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.tw-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  padding: 0.8rem 1rem;
  border-radius: var(--tw-radius);
  border: 1px solid color-mix(in srgb, var(--tw-accent) 30%, var(--tw-border));
  background: var(--tw-accent-soft);
  font-size: 0.88rem;
}

.tw-banner.is-warn {
  border-color: color-mix(in srgb, var(--tw-warn) 35%, var(--tw-border));
  background: var(--tw-warn-soft);
}

.tw-banner.is-danger {
  border-color: color-mix(in srgb, var(--tw-danger) 35%, var(--tw-border));
  background: var(--tw-danger-soft);
}

.tw-card {
  background: var(--tw-surface);
  border: 1px solid var(--tw-border);
  border-radius: var(--tw-radius);
  padding: 1.05rem 1.15rem;
}

.tw-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem 1rem;
  margin-bottom: 0.75rem;
}

.tw-h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
}

.tw-h3 {
  margin: 0;
  font-size: 0.93rem;
  font-weight: 600;
}

.tw-muted {
  color: var(--tw-muted);
  font-size: 0.85rem;
  margin: 0;
}

.tw-status-strip {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem 1rem;
  padding: 0.95rem 1.1rem;
  background: var(--tw-surface);
  border: 1px solid var(--tw-border);
  border-radius: var(--tw-radius);
}

.tw-seg {
  display: inline-flex;
  padding: 0.2rem;
  border-radius: 0.6rem;
  background: var(--tw-sunken);
  border: 1px solid var(--tw-border);
  gap: 0.15rem;
}

.tw-root .tw-seg-btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--tw-muted);
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 550;
  padding: 0.34rem 0.68rem;
  border-radius: 0.45rem;
  cursor: pointer;
}

.tw-root .tw-seg-btn.is-active {
  background: var(--tw-surface);
  color: var(--tw-ink);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  font-weight: 600;
}

.tw-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.tw-metric {
  background: var(--tw-surface);
  border: 1px solid var(--tw-border);
  border-radius: var(--tw-radius);
  padding: 0.9rem 1.05rem;
}

.tw-metric-num {
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 0.25rem;
  font-variant-numeric: tabular-nums;
}

.tw-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.tw-grid-split {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.tw-approval {
  background: var(--tw-surface);
  border: 1px solid var(--tw-border);
  border-left: 3px solid var(--tw-warn);
  border-radius: var(--tw-radius);
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.tw-approval.is-danger {
  border-left-color: var(--tw-danger);
}

.tw-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0.14rem 0.52rem;
  border-radius: 999px;
  border: 1px solid var(--tw-border);
  background: var(--tw-sunken);
  color: var(--tw-muted);
}

.tw-badge.is-ok {
  background: var(--tw-ok-soft);
  color: var(--tw-ok);
  border-color: color-mix(in srgb, var(--tw-ok) 30%, transparent);
}

.tw-badge.is-amber {
  background: var(--tw-warn-soft);
  color: var(--tw-warn);
  border-color: color-mix(in srgb, var(--tw-warn) 30%, transparent);
}

.tw-badge.is-danger {
  background: var(--tw-danger-soft);
  color: var(--tw-danger);
  border-color: color-mix(in srgb, var(--tw-danger) 30%, transparent);
}

.tw-draft-box {
  background: var(--tw-sunken);
  border: 1px solid var(--tw-border);
  border-radius: 0.55rem;
  padding: 0.68rem 0.82rem;
  font-size: 0.88rem;
  white-space: pre-wrap;
}

.tw-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
}

.tw-root .tw-btn,
.tw-dialog .tw-btn {
  appearance: none;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 560;
  line-height: 1.25;
  padding: 0.45rem 0.82rem;
  border-radius: 0.55rem;
  border: 1px solid var(--tw-border-strong);
  background: var(--tw-surface);
  color: var(--tw-ink);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.tw-root .tw-btn:hover:not(:disabled),
.tw-dialog .tw-btn:hover:not(:disabled) {
  background: var(--tw-sunken);
}

.tw-root .tw-btn-primary,
.tw-dialog .tw-btn-primary {
  background: var(--tw-accent);
  border-color: var(--tw-accent);
  color: #ffffff;
}

.tw-root .tw-btn-primary:hover:not(:disabled),
.tw-dialog .tw-btn-primary:hover:not(:disabled) {
  filter: brightness(0.95);
  background: var(--tw-accent);
}

.tw-root .tw-btn-danger,
.tw-dialog .tw-btn-danger {
  color: var(--tw-danger);
  border-color: color-mix(in srgb, var(--tw-danger) 40%, var(--tw-border));
}

.tw-root .tw-btn:disabled,
.tw-dialog .tw-btn:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.tw-root .tw-input,
.tw-dialog .tw-input,
.tw-root .tw-select,
.tw-dialog .tw-select,
.tw-root .tw-textarea,
.tw-dialog .tw-textarea {
  width: 100%;
  font-family: inherit;
  font-size: 0.88rem;
  color: var(--tw-ink);
  background: var(--tw-surface);
  border: 1px solid var(--tw-border-strong);
  border-radius: 0.55rem;
  padding: 0.48rem 0.7rem;
}

.tw-root .tw-textarea,
.tw-dialog .tw-textarea {
  min-height: 4.5rem;
  resize: vertical;
  line-height: 1.45;
}

.tw-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 0;
  border-bottom: 1px solid var(--tw-border);
}

.tw-row:last-child {
  border-bottom: 0;
}

.tw-trace {
  margin-top: 0.45rem;
  border-top: 1px dashed var(--tw-border);
  padding-top: 0.45rem;
  font-size: 0.83rem;
}

.tw-trace summary {
  cursor: pointer;
  color: var(--tw-accent);
  font-weight: 550;
  user-select: none;
}

.tw-step-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
}

.tw-step {
  border: 1px solid var(--tw-border);
  background: var(--tw-sunken);
  border-radius: 0.6rem;
  padding: 0.7rem 0.8rem;
  font-size: 0.82rem;
}

.tw-step.is-done {
  border-color: color-mix(in srgb, var(--tw-ok) 35%, var(--tw-border));
  background: var(--tw-ok-soft);
}

.tw-step.is-active {
  border-color: color-mix(in srgb, var(--tw-accent) 45%, var(--tw-border));
  background: var(--tw-accent-soft);
}

.tw-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.tw-table th,
.tw-table td {
  text-align: left;
  padding: 0.62rem 0.65rem;
  border-bottom: 1px solid var(--tw-border);
  vertical-align: middle;
}

.tw-table th {
  font-size: 0.76rem;
  font-weight: 600;
  color: var(--tw-muted);
}

.tw-table tr.is-row-clickable:hover td {
  background: var(--tw-sunken);
}

.tw-switch {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.83rem;
  cursor: pointer;
  user-select: none;
}

.tw-undo-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-radius: 0.6rem;
  background: var(--tw-sunken);
  border: 1px solid var(--tw-border);
  font-size: 0.84rem;
}

.tw-copy-status {
  font-size: 0.78rem;
  color: var(--tw-ok);
  min-height: 1.1em;
}

dialog.tw-dialog {
  border: 1px solid var(--tw-border);
  border-radius: 0.9rem;
  background: var(--tw-surface);
  color: var(--tw-ink);
  padding: 0;
  width: min(580px, 92vw);
  max-height: 86vh;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.22);
}

dialog.tw-dialog.tw-drawer {
  margin-left: auto;
  margin-right: 0;
  margin-top: 0;
  margin-bottom: 0;
  height: 100vh;
  max-height: 100vh;
  width: min(520px, 94vw);
  border-radius: 0.9rem 0 0 0.9rem;
}

dialog.tw-dialog[open] {
  display: flex;
  flex-direction: column;
}

dialog.tw-dialog::backdrop {
  background: rgba(15, 23, 42, 0.46);
  overflow: hidden;
  overscroll-behavior: contain;
}

.tw-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.95rem 1.15rem;
  border-bottom: 1px solid var(--tw-border);
  flex-shrink: 0;
}

.tw-dialog-body {
  padding: 1rem 1.15rem 1.35rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  flex: 1 1 0;
  min-height: 0;
}

.tw-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.tw-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--tw-ink);
}

@media (prefers-reduced-motion: no-preference) {
  dialog.tw-dialog[open] {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.16s ease, transform 0.16s ease;
  }
  @starting-style {
    dialog.tw-dialog[open] {
      opacity: 0;
      transform: translateY(0.5rem);
    }
  }
  dialog.tw-dialog.is-closing {
    opacity: 0;
    transform: translateY(0.4rem);
  }
}

@container (max-width: 720px) {
  .tw-topbar {
    padding: 0.75rem 0.95rem;
  }
  .tw-scroll {
    padding: 0.9rem 0.95rem 2.25rem;
  }
  .tw-metrics,
  .tw-grid-2,
  .tw-grid-split,
  .tw-step-list {
    grid-template-columns: 1fr;
  }
  .tw-table thead {
    display: none;
  }
  .tw-table,
  .tw-table tbody,
  .tw-table tr,
  .tw-table td {
    display: block;
    width: 100%;
  }
  .tw-table tr {
    padding: 0.78rem 0;
    border-bottom: 1px solid var(--tw-border);
  }
  .tw-table tr:last-child {
    border-bottom: 0;
  }
  .tw-table td {
    padding: 0.2rem 0;
    border-bottom: 0;
  }
  .tw-table td[data-label]::before {
    content: attr(data-label) "\uFF1A";
    color: var(--tw-muted);
    font-size: 0.78rem;
    margin-right: 0.35rem;
  }
}
`;
function ensureTwinStyles(doc = globalThis.document) {
  if (!doc || !doc.head) return;
  let el = doc.getElementById(TWIN_STYLE_ID);
  if (!el) {
    el = doc.createElement("style");
    el.id = TWIN_STYLE_ID;
    el.textContent = CLIENT_CSS;
    doc.head.appendChild(el);
  }
}

// src-client/api.js
var import_react = __toESM(require("react"), 1);
var h = import_react.default.createElement;
function canTransitionDisplay() {
  try {
    return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("transition-behavior", "allow-discrete");
  } catch {
    return false;
  }
}
function optService(ctx, name) {
  try {
    return ctx?.[name] || ctx?.get?.(name, false) || ctx?.root?.get?.(name, false) || ctx?.root?.[name] || null;
  } catch {
    return null;
  }
}
async function fetchTwinView() {
  const res = await fetch("/api/agent_twin/view", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store"
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json?.error || "\u8BFB\u53D6 AI \u5206\u8EAB\u72B6\u6001\u5931\u8D25");
  }
  return json;
}
async function runTwinAction(action, payload = {}) {
  const res = await fetch("/api/agent_twin/action", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json?.error || `\u64CD\u4F5C\u5931\u8D25\uFF08${action}\uFF09`);
  }
  return json;
}
async function copyToClipboard(text, setNotice) {
  const val = String(text || "");
  if (!val) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(val);
    } else {
      const ta = document.createElement("textarea");
      ta.value = val;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setNotice?.("\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F");
    return true;
  } catch {
    setNotice?.("\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u9009\u4E2D\u590D\u5236");
    return false;
  }
}
function useDialogController(open, onClose) {
  const ref = (0, import_react.useRef)(null);
  (0, import_react.useEffect)(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open && typeof el.showModal === "function") {
        el.classList.remove("is-closing");
        el.showModal();
      }
      return;
    }
    if (el.open && typeof el.close === "function") {
      const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (reduced || !canTransitionDisplay()) {
        el.close();
      } else {
        el.classList.add("is-closing");
        const timer = setTimeout(() => {
          el.classList.remove("is-closing");
          if (el.open) el.close();
        }, 140);
        return () => clearTimeout(timer);
      }
    }
  }, [open]);
  (0, import_react.useEffect)(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (ev) => {
      ev.preventDefault();
      onClose?.();
    };
    const handleClick = (ev) => {
      if (!("closedBy" in HTMLDialogElement.prototype) && ev.target === el) {
        onClose?.();
      }
    };
    el.addEventListener("cancel", handleCancel);
    el.addEventListener("click", handleClick);
    return () => {
      el.removeEventListener("cancel", handleCancel);
      el.removeEventListener("click", handleClick);
    };
  }, [onClose]);
  return ref;
}
function TwinNavIcon() {
  return h(
    "svg",
    {
      width: 18,
      height: 18,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.75,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    h("circle", { cx: 9, cy: 8, r: 3.25 }),
    h("path", { d: "M3.5 19a5.5 5.5 0 0 1 11 0" }),
    h("circle", { cx: 17, cy: 9.5, r: 2.5 }),
    h("path", { d: "M16.5 14.5a4.25 4.25 0 0 1 4 4.5" })
  );
}
function CloseIcon() {
  return h(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.9,
      strokeLinecap: "round",
      "aria-hidden": "true"
    },
    h("path", { d: "M6 6l12 12" }),
    h("path", { d: "M18 6l-12 12" })
  );
}

// src-client/modals.js
var import_react2 = __toESM(require("react"), 1);

// shared/schema.js
var PRESENCE_YIELD_MS = 15 * 60 * 1e3;
var WECHAT_QR_TTL_MS = 5 * 60 * 1e3;
var DUTY_MODES = Object.freeze(["shadow", "live", "off"]);
var PERSON_MODES = Object.freeze(["direct", "confirm", "summary"]);
var RULE_KINDS = Object.freeze(["\u89C4\u77E9", "\u7EA2\u7EBF"]);
var TWIN_PERSONA_PRESETS = Object.freeze([
  {
    id: "advisor",
    title: "\u53E3\u5F84\u4E0E\u5F52\u56E0\u987E\u95EE",
    defaultName: "\u5DE5\u4F5C\u5206\u8EAB",
    intro: "\u4F9D\u636E\u9879\u76EE\u6587\u6863\u4E0E\u590D\u76D8\u53E3\u5F84\u63D0\u4F9B\u53EA\u8BFB\u89E3\u7B54\u4E0E\u6CE2\u52A8\u5F52\u56E0\uFF0C\u6D89\u654F\u660E\u7EC6\u8F6C\u8D1F\u8D23\u4EBA\u786E\u8BA4",
    recommendedDuty: "shadow",
    defaultMode: "confirm",
    brief: "\u5148\u7528\u4E00\u53E5\u8BDD\u590D\u8FF0\u5BF9\u65B9\u95EE\u9898\uFF0C\u524D 3 \u884C\u76F4\u63A5\u7ED9\u7ED3\u8BBA\uFF1B\u62A5\u5F02\u5E38\u524D\u5148\u5254\u9664\u6D4B\u8BD5\u5355\u4E0E\u5468\u671F\u8109\u51B2\uFF1B\u62FF\u4E0D\u51C6\u7684\u6570\u5B57\u6807\u6210\u300C\u5F85\u786E\u8BA4\u300D\uFF0C\u7EDD\u4E0D\u778E\u731C\u3002"
  },
  {
    id: "trial",
    title: "\u5408\u4F5C\u65B9\u8BD5\u8DD1\u5206\u8EAB",
    defaultName: "\u9879\u76EE\u8BD5\u8DD1\u5206\u8EAB",
    intro: "\u4F9B\u5916\u90E8\u5408\u4F5C\u65B9\u8BD5\u8DD1\u4F53\u9A8C\u6388\u6743\u8303\u56F4\u5185\u7684\u53E3\u5F84\u8BF4\u660E\u4E0E\u6307\u6807\u5206\u6790\uFF0C\u56DE\u590D\u7ECF\u672C\u4EBA\u628A\u5173",
    recommendedDuty: "shadow",
    defaultMode: "summary",
    brief: "\u5BF9\u5916\u4FDD\u6301\u4E13\u4E1A\u514B\u5236\uFF0C\u53EA\u8F93\u51FA\u6C47\u603B\u6BD4\u4F8B\u4E0E\u540C\u6BD4\u8D8B\u52BF\uFF0C\u4EFB\u4F55\u5355\u5BA2\u660E\u7EC6\u6216\u6392\u671F\u62A5\u4EF7\u627F\u8BFA\u4E00\u5F8B\u8F6C\u6211\u672C\u4EBA\u786E\u8BA4\u3002"
  },
  {
    id: "team",
    title: "\u56E2\u961F\u5185\u90E8\u503C\u73ED\u642D\u6863",
    defaultName: "\u56E2\u961F\u503C\u73ED\u5206\u8EAB",
    intro: "\u5728\u56E2\u961F\u9891\u9053\u5373\u65F6\u89E3\u7B54\u5E38\u89C4\u53E3\u5F84\u4E0E\u6587\u6863\u89C4\u8303\uFF0C\u672C\u4EBA\u5728\u573A 15 \u5206\u949F\u5185\u81EA\u52A8\u6536\u58F0",
    recommendedDuty: "live",
    defaultMode: "direct",
    brief: "\u767D\u540D\u5355\u5185\u5E38\u89C4\u53E3\u5F84\u76F4\u63A5\u9644\u4E0A\u8BA1\u7B97\u8FB9\u754C\u4E0E\u7ED3\u8BBA\uFF1B\u53D1\u73B0\u6211\u5728 15 \u5206\u949F\u5185\u521A\u53D1\u8FC7\u8A00\u5219\u81EA\u52A8\u4FDD\u6301\u5B89\u9759\u3002"
  }
]);
var CHANNEL_GUIDE_MAP = Object.freeze({
  "ch-feishu": {
    title: "\u63A5\u5165\u98DE\u4E66 / Lark \u673A\u5668\u4EBA\uFF08\u672C\u673A\u76F4\u8FDE\uFF09",
    appIdLabel: "\u5E94\u7528\u51ED\u8BC1\uFF08App ID\uFF09",
    appIdPh: "cli_a7xxxxxxxxxx",
    secretLabel: "\u5E94\u7528\u5BC6\u94A5\uFF08App Secret\uFF09",
    secretPh: "\u586B\u5165\u98DE\u4E66\u5F00\u653E\u5E73\u53F0 App Secret",
    steps: [
      "\u6253\u5F00\u98DE\u4E66\u5F00\u653E\u5E73\u53F0\u521B\u5EFA\u4F01\u4E1A\u81EA\u5EFA\u5E94\u7528\u5E76\u5F00\u542F\u300C\u673A\u5668\u4EBA\u300D\u80FD\u529B",
      "\u4E8B\u4EF6\u8BA2\u9605\u9009\u62E9\u300C\u4F7F\u7528\u957F\u8FDE\u63A5\u63A5\u6536\u4E8B\u4EF6\u300D\uFF08\u65E0\u9700\u516C\u7F51\u57DF\u540D\u6216\u5907\u6848\uFF09",
      "\u5728\u672C\u673A\u4FDD\u5B58 App ID \u4E0E App Secret\uFF0C\u4FDD\u5B58\u65F6\u4EC5\u5B58\u4E8E\u672C\u673A 0600 \u51ED\u636E\u5E93"
    ]
  },
  "ch-wecom": {
    title: "\u63A5\u5165\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA\uFF08\u667A\u80FD\u673A\u5668\u4EBA\u957F\u8FDE\u63A5 / \u81EA\u5EFA\u5E94\u7528\uFF09",
    modes: {
      aibot: {
        appIdLabel: "\u667A\u80FD\u673A\u5668\u4EBA Bot ID",
        appIdPh: "wb_xxxxxxxxxxxx",
        secretLabel: "\u673A\u5668\u4EBA\u8FDE\u63A5\u5BC6\u94A5\uFF08Secret\uFF09",
        secretPh: "\u586B\u5165\u4F01\u5FAE\u667A\u80FD\u673A\u5668\u4EBA\u957F\u8FDE\u63A5 Secret",
        steps: [
          "\u767B\u5F55\u4F01\u4E1A\u5FAE\u4FE1\u7BA1\u7406\u540E\u53F0 -> \u5B89\u5168\u4E0E\u7BA1\u7406 -> \u7BA1\u7406\u5DE5\u5177 -> \u521B\u5EFA\u667A\u80FD\u673A\u5668\u4EBA",
          "\u6536\u53D1\u6D88\u606F\u65B9\u5F0F\u9009\u62E9\u300C\u957F\u8FDE\u63A5\u6A21\u5F0F\u300D\uFF08\u514D\u516C\u7F51\u56DE\u8C03\u4E0E\u57DF\u540D\u5907\u6848\uFF09",
          "\u590D\u5236 Bot ID \u4E0E Secret \u586B\u5165\u672C\u7A97\u53E3\u540E\u7ACB\u5373\u5728\u672C\u673A\u63E1\u624B\u6D4B\u8BD5"
        ]
      },
      corpapp: {
        appIdLabel: "\u4F01\u4E1A ID\uFF08CorpID\uFF09",
        appIdPh: "wwxxxxxxxxxxxxxxxx",
        secretLabel: "\u5E94\u7528\u5BC6\u94A5\uFF08Secret\uFF09",
        secretPh: "\u586B\u5165\u81EA\u5EFA\u5E94\u7528 Secret",
        steps: [
          "\u9002\u7528\u4E8E\u5DF2\u642D\u5EFA\u8FC7\u4F01\u4E1A\u81EA\u5EFA\u5E94\u7528\u3001\u9700\u8981\u6309\u7EC4\u7EC7\u67B6\u6784\u53D1\u6D88\u606F\u7684\u56E2\u961F",
          "\u586B\u5199 CorpID\u3001AgentId \u4E0E Secret\uFF0C\u7528\u4E8E\u83B7\u53D6\u8BBF\u95EE\u4EE4\u724C\u4E0E\u63A8\u9001\u6D88\u606F",
          "\u51ED\u8BC1\u4EC5\u4FDD\u5B58\u5728\u672C\u673A 0600 \u51ED\u636E\u5E93\uFF0C\u4ECE\u4E0D\u4E0A\u884C\u6216\u5199\u5165\u9879\u76EE\u6587\u6863"
        ]
      }
    }
  },
  "ch-slack": {
    title: "\u63A5\u5165 Slack \u56E2\u961F\u4E0E\u5408\u4F5C\u9891\u9053\uFF08Socket Mode\uFF09",
    appIdLabel: "\u5E94\u7528\u7EA7\u8FDE\u63A5\u4EE4\u724C\uFF08App-Level Token\uFF09",
    appIdPh: "xapp-1-A0...",
    secretLabel: "\u673A\u5668\u4EBA\u8BBF\u95EE\u4EE4\u724C\uFF08Bot User OAuth Token\uFF09",
    secretPh: "xoxb-...",
    steps: [
      "\u5728 Slack App \u63A7\u5236\u53F0\u542F\u7528\u300CSocket Mode\u300D\u5E76\u7B7E\u53D1\u5E26 connections:write \u6743\u9650\u7684 xapp- \u4EE4\u724C",
      "\u5F00\u542F app_mention \u4E0E message.im \u8BA2\u9605\uFF08\u65E0\u9700\u516C\u7F51 Request URL\uFF09",
      "\u5728\u4E0B\u65B9\u586B\u5165 xapp- \u4E0E xoxb- \u4EE4\u724C\u540E\u76F4\u8FDE Slack \u7F51\u5173"
    ]
  }
});
var CHANNEL_PREFIX_MAP = Object.freeze({
  "ch-feishu": "FS",
  "ch-wecom": "WC",
  "ch-slack": "SL"
});
function channelIdFromSelection(labelOrId) {
  const s = String(labelOrId || "").trim();
  if (s === "ch-wechat" || s.includes("\u4E2A\u4EBA\u5FAE\u4FE1") || s === "\u5FAE\u4FE1") return "ch-wechat";
  if (s === "ch-feishu" || s.includes("\u98DE\u4E66") || s.includes("Lark")) return "ch-feishu";
  if (s === "ch-wecom" || s.includes("\u4F01\u5FAE") || s.includes("\u4F01\u4E1A\u5FAE\u4FE1")) return "ch-wecom";
  if (s === "ch-slack" || s.includes("Slack")) return "ch-slack";
  return "ch-web";
}
function formatModeLabel(mode) {
  if (mode === "direct") return "\u767D\u540D\u5355\u76F4\u63A5\u7B54";
  if (mode === "summary") return "\u53EA\u7ED9\u6C47\u603B\uFF08\u7981\u4E2A\u4EBA\u660E\u7EC6\uFF09";
  return "\u6BCF\u6761\u5148\u8349\u7A3F\u7ED9\u6211\u770B";
}
function formatBindingText(person) {
  const chId = channelIdFromSelection(person?.channel);
  if (chId === "ch-web") return "\u72EC\u7ACB\u7F51\u9875\u94FE\u63A5 \xB7 \u4F1A\u8BDD\u9694\u79BB";
  if (chId === "ch-wechat") {
    return person?.wechatBound ? "\u5DF2\u626B\u7801\u7ED1\u5B9A\u4E00\u5BF9\u4E00\u5FAE\u4FE1" : "\u5F85\u626B 5 \u5206\u949F\u4E13\u5C5E\u4E8C\u7EF4\u7801\u9501\u5B9A";
  }
  if (person?.bindMode === "group_allow" || !person?.pairCode && person?.channelHandle) {
    return `\u7FA4\u767D\u540D\u5355\uFF1A${person.channelHandle || "\u5DF2\u6307\u5B9A\u7FA4\u804A"}\uFF08\u9700 @\u673A\u5668\u4EBA\uFF09`;
  }
  return `\u4E00\u5BA2\u4E00\u7801\u79C1\u804A\u914D\u5BF9\uFF08${person?.pairCode || "\u5DF2\u7B7E\u53D1"}\uFF09`;
}
var REDLINE_PATTERNS = Object.freeze({
  pii: /(手机号|电话号码|联系方式|身份证|邮箱列表|逐笔订单|原始流水|客户名单|导出明细|明细列表|phone\s*number|export\s+csv|customer\s+list|email\s+list)/i,
  writeAction: /(改代码|修改代码|写库|写入数据库|删库|执行脚本|跑个脚本|改配置|run\s+migration|drop\s+table|write\s+to\s+db)/i,
  commitment: /(承诺排期|确认报价|签合同|底价折扣|违约条款|官方承诺|pricing\s+quote|guarantee\s+delivery)/i
});

// src-client/modals.js
var h2 = import_react2.default.createElement;
function TwinDialog({ id, open, title, isDrawer = false, onClose, children }) {
  const ref = useDialogController(open, onClose);
  return h2(
    "dialog",
    {
      id,
      ref,
      closedby: "any",
      className: isDrawer ? "tw-dialog tw-drawer" : "tw-dialog",
      "aria-label": title
    },
    h2(
      "div",
      { className: "tw-dialog-head" },
      h2("h3", { className: "tw-h2" }, title),
      h2("button", {
        type: "button",
        className: "tw-btn",
        "aria-label": "\u5173\u95ED\u5F39\u7A97",
        onClick: onClose
      }, h2(CloseIcon))
    ),
    h2("div", { className: "tw-dialog-body" }, open ? children : null)
  );
}
function EditDraftModal({ approval, busy, onClose, onSubmit, onSaveAsRule }) {
  const [text, setText] = (0, import_react2.useState)("");
  const [ruleText, setRuleText] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    setText(approval?.draft || "");
    setRuleText("");
  }, [approval]);
  return h2(
    TwinDialog,
    {
      id: "editDraftDialog",
      open: Boolean(approval),
      title: approval?.tone === "danger" ? "\u8C03\u6574\u66FF\u4EE3\u5B89\u5168\u56DE\u590D\uFF08\u7EA2\u7EBF\u62E6\u622A\uFF09" : "\u8C03\u6574\u8349\u7A3F\u5E76\u56DE\u590D\u5BF9\u65B9",
      onClose
    },
    approval && h2(
      import_react2.default.Fragment,
      null,
      h2("div", { className: "tw-muted" }, `\u5BF9\u8C61\uFF1A${approval.personName} \xB7 \u6765\u6E90\uFF1A${approval.channel}`),
      h2("div", { className: "tw-draft-box" }, `\u5BF9\u65B9\u95EE\u9898\uFF1A${approval.question}`),
      h2(
        "label",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u7531\u4F60\u5BA1\u6821\u540E\u7684\u6700\u7EC8\u56DE\u590D"),
        h2("textarea", {
          className: "tw-textarea",
          value: text,
          onChange: (e) => setText(e.target.value),
          rows: 4
        })
      ),
      approval.allowRuleExtract && h2(
        "label",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u987A\u624B\u6C89\u6DC0\u4E3A\u957F\u671F\u89C4\u77E9\uFF08\u53EF\u9009\uFF09"),
        h2("input", {
          className: "tw-input",
          type: "text",
          placeholder: "\u4F8B\u5982\uFF1A\u5BF9\u5916\u7EDF\u4E00\u5B9A\u4E3A T+1 \u5BF9\u8D26\u5B8C\u6210\u540E\u7684\u53E3\u5F84",
          value: ruleText,
          onChange: (e) => setRuleText(e.target.value)
        })
      ),
      h2(
        "div",
        { className: "tw-actions" },
        h2("button", {
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: busy || !text.trim(),
          onClick: () => onSubmit(approval.id, text)
        }, "\u6279\u51C6\u5E76\u7ACB\u5373\u53D1\u51FA"),
        approval.allowRuleExtract && h2("button", {
          type: "button",
          className: "tw-btn",
          disabled: busy || !(ruleText.trim() || text.trim()),
          onClick: () => onSaveAsRule(approval.id, text, ruleText.trim() || text.trim())
        }, "\u53D1\u9001\u5E76\u8BB0\u6210\u957F\u671F\u89C4\u77E9")
      )
    )
  );
}
function InvitePersonModal({ open, view, busy, onClose, onCreated }) {
  const [name, setName] = (0, import_react2.useState)("");
  const [role, setRole] = (0, import_react2.useState)("");
  const [channel, setChannel] = (0, import_react2.useState)("\u514D\u88C5\u8BD5\u7528\u7F51\u9875");
  const [bindMode, setBindMode] = (0, import_react2.useState)("dm_pair");
  const [channelHandle, setChannelHandle] = (0, import_react2.useState)("");
  const [mode, setMode] = (0, import_react2.useState)("confirm");
  const [expiry, setExpiry] = (0, import_react2.useState)("7 \u5929\u8BD5\u7528");
  const [note, setNote] = (0, import_react2.useState)("");
  const [selectedCaps, setSelectedCaps] = (0, import_react2.useState)([]);
  const [createdResult, setCreatedResult] = (0, import_react2.useState)(null);
  const [copyStatus, setCopyStatus] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (open) {
      setName("");
      setRole("");
      setChannel("\u514D\u88C5\u8BD5\u7528\u7F51\u9875");
      setBindMode("dm_pair");
      setChannelHandle("");
      setMode("confirm");
      setExpiry("7 \u5929\u8BD5\u7528");
      setNote("");
      setCreatedResult(null);
      setCopyStatus("");
      const enabledCaps = (view?.capabilities || []).filter((c) => c.enabled).map((c) => c.id);
      setSelectedCaps(enabledCaps.slice(0, 3));
    }
  }, [open]);
  const chId = channelIdFromSelection(channel);
  const supportsGroup = chId === "ch-feishu" || chId === "ch-wecom" || chId === "ch-slack";
  async function submitCreate() {
    const res = await onCreated({
      name,
      role,
      channel,
      bindMode: supportsGroup ? bindMode : "dm_pair",
      channelHandle: supportsGroup && bindMode === "group_allow" ? channelHandle : "",
      mode,
      expiry,
      note,
      caps: selectedCaps
    });
    if (res?.result?.person) {
      const createdPerson = res.view?.people?.find((p) => p.id === res.result.person.id) || res.result.person;
      setCreatedResult({ person: createdPerson, qr: res.result.qr });
    }
  }
  return h2(
    TwinDialog,
    {
      id: "invitePersonDialog",
      open,
      title: createdResult ? "\u9080\u8BF7\u51ED\u8BC1\u5DF2\u751F\u6210" : "\u5F00\u901A\u670D\u52A1\u5BF9\u8C61\u4E0E\u53D1\u9080\u8BF7",
      onClose
    },
    createdResult ? h2(
      "div",
      { className: "tw-field" },
      h2("p", { className: "tw-muted" }, `\u5DF2\u4E3A\u300C${createdResult.person.name}\u300D\u751F\u6210\u4E13\u5C5E\u9694\u79BB\u901A\u9053\u4E0E\u767D\u540D\u5355\u6743\u9650\uFF1A`),
      createdResult.person.guestUrl && h2(
        "div",
        { className: "tw-draft-box" },
        h2("div", null, "\u514D\u88C5\u8BD5\u7528\u94FE\u63A5\uFF1A"),
        h2("strong", null, createdResult.person.guestUrl)
      ),
      createdResult.person.pairCode && h2(
        "div",
        { className: "tw-draft-box" },
        h2("div", null, "\u4E00\u5BA2\u4E00\u7801\u79C1\u804A\u914D\u5BF9\u53E3\u4EE4\uFF1A"),
        h2("strong", null, createdResult.person.pairCode)
      ),
      createdResult.qr?.qrUrl && h2(
        "div",
        { className: "tw-draft-box" },
        h2("div", null, "\u5FAE\u4FE1 5 \u5206\u949F\u4E13\u5C5E\u626B\u7801\u51ED\u8BC1\uFF08\u5BF9\u65B9\u626B\u4E00\u626B\u5373\u9501\u5B9A\uFF09\uFF1A"),
        h2("div", { style: { wordBreak: "break-all" } }, createdResult.qr.qrUrl)
      ),
      h2(
        "div",
        { className: "tw-actions" },
        (createdResult.person.guestUrl || createdResult.person.pairCode || createdResult.qr?.qrUrl) && h2("button", {
          type: "button",
          className: "tw-btn tw-btn-primary",
          onClick: () => copyToClipboard(createdResult.person.guestUrl || createdResult.person.pairCode || createdResult.qr?.qrUrl, setCopyStatus)
        }, "\u590D\u5236\u53D1\u7ED9\u5BF9\u65B9"),
        h2("button", {
          type: "button",
          className: "tw-btn",
          onClick: onClose
        }, "\u5B8C\u6210\u5173\u95ED")
      ),
      h2("span", { className: "tw-copy-status", role: "status", "aria-live": "polite" }, copyStatus)
    ) : h2(
      import_react2.default.Fragment,
      null,
      h2(
        "div",
        { className: "tw-grid-2" },
        h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u5BF9\u8C61\u79F0\u547C"),
          h2("input", {
            id: "inviteNameInput",
            className: "tw-input",
            placeholder: "\u5982\uFF1A\u9648\u603B / \u534E\u4E1C\u8FD0\u8425\u5C0F\u5468",
            value: name,
            onChange: (e) => setName(e.target.value)
          })
        ),
        h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u8EAB\u4EFD\u6216\u534F\u4F5C\u5173\u7CFB"),
          h2("input", {
            className: "tw-input",
            placeholder: "\u5982\uFF1A\u5916\u90E8\u8BD5\u8DD1\u5408\u4F5C\u65B9",
            value: role,
            onChange: (e) => setRole(e.target.value)
          })
        )
      ),
      h2(
        "div",
        { className: "tw-grid-2" },
        h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u5F00\u901A\u901A\u9053"),
          h2(
            "select",
            {
              id: "inviteChannelSelect",
              className: "tw-select",
              value: channel,
              onChange: (e) => setChannel(e.target.value)
            },
            h2("option", { value: "\u514D\u88C5\u8BD5\u7528\u7F51\u9875" }, "\u514D\u88C5\u8BD5\u7528\u7F51\u9875\uFF08\u96F6\u914D\u7F6E\u751F\u6210\u9694\u79BB\u94FE\u63A5\uFF09"),
            h2("option", { value: "\u4E2A\u4EBA\u5FAE\u4FE1" }, "\u4E2A\u4EBA\u5FAE\u4FE1\uFF085 \u5206\u949F\u4E00\u5BA2\u4E00\u7801\u626B\u4E00\u626B\uFF09"),
            h2("option", { value: "\u98DE\u4E66" }, "\u98DE\u4E66 / Lark \u673A\u5668\u4EBA"),
            h2("option", { value: "\u4F01\u4E1A\u5FAE\u4FE1" }, "\u4F01\u4E1A\u5FAE\u4FE1\u673A\u5668\u4EBA"),
            h2("option", { value: "\u5408\u4F5C\u65B9 Slack" }, "Slack \u56E2\u961F / \u5408\u4F5C\u9891\u9053")
          )
        ),
        h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u7B54\u590D\u8FB9\u754C"),
          h2(
            "select",
            {
              className: "tw-select",
              value: mode,
              onChange: (e) => setMode(e.target.value)
            },
            h2("option", { value: "confirm" }, "\u6BCF\u6761\u5148\u8349\u7A3F\u7ED9\u6211\u770B"),
            h2("option", { value: "direct" }, "\u767D\u540D\u5355\u76F4\u63A5\u7B54"),
            h2("option", { value: "summary" }, "\u53EA\u7ED9\u6C47\u603B\uFF08\u7981\u4E2A\u4EBA\u660E\u7EC6\uFF09")
          )
        )
      ),
      supportsGroup && h2(
        "div",
        { className: "tw-grid-2" },
        h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u63A5\u5165\u5F62\u5F0F"),
          h2(
            "select",
            {
              className: "tw-select",
              value: bindMode,
              onChange: (e) => setBindMode(e.target.value)
            },
            h2("option", { value: "dm_pair" }, "\u4E00\u5BA2\u4E00\u7801\u79C1\u804A\u914D\u5BF9"),
            h2("option", { value: "group_allow" }, "\u6307\u5B9A\u7FA4\u767D\u540D\u5355\uFF08\u4EC5\u54CD\u5E94 @\u673A\u5668\u4EBA\uFF09")
          )
        ),
        bindMode === "group_allow" && h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u767D\u540D\u5355\u7FA4\u540D\u6216\u7FA4\u804A ID"),
          h2("input", {
            className: "tw-input",
            placeholder: "\u5982\uFF1A\u534E\u4E1C\u9879\u76EE\u5BF9\u9F50\u7FA4 \u6216 oc_xxx",
            value: channelHandle,
            onChange: (e) => setChannelHandle(e.target.value)
          })
        )
      ),
      h2(
        "div",
        { className: "tw-grid-2" },
        h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u6709\u6548\u671F\uFF08\u7EAF\u5DE5\u5177\u5185\u7F6E\u9650\u671F\uFF09"),
          h2(
            "select",
            {
              className: "tw-select",
              value: expiry,
              onChange: (e) => setExpiry(e.target.value)
            },
            h2("option", { value: "7 \u5929\u8BD5\u7528" }, "7 \u5929\u8BD5\u7528"),
            h2("option", { value: "30 \u5929\u8BD5\u7528" }, "30 \u5929\u8BD5\u7528"),
            h2("option", { value: "\u957F\u671F\u6709\u6548" }, "\u957F\u671F\u6709\u6548")
          )
        ),
        h2(
          "label",
          { className: "tw-field" },
          h2("span", { className: "tw-label" }, "\u7279\u522B\u7EA6\u5B9A\u5907\u6CE8\uFF08\u53EF\u9009\uFF09"),
          h2("input", {
            className: "tw-input",
            placeholder: "\u5982\uFF1A\u53EA\u770B\u534E\u4E1C\u6C47\u603B\uFF0C\u4E0D\u900F\u5E95\u4EF7",
            value: note,
            onChange: (e) => setNote(e.target.value)
          })
        )
      ),
      h2(
        "div",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u6388\u6743\u5F00\u653E\u7684\u80FD\u529B\u5305"),
        h2(
          "div",
          { className: "tw-actions" },
          (view?.capabilities || []).filter((c) => c.enabled).map((cap) => {
            const checked = selectedCaps.includes(cap.id);
            return h2(
              "label",
              { key: cap.id, className: "tw-switch" },
              h2("input", {
                type: "checkbox",
                checked,
                onChange: () => setSelectedCaps((prev) => checked ? prev.filter((x) => x !== cap.id) : [...prev, cap.id])
              }),
              cap.name
            );
          })
        )
      ),
      h2(
        "div",
        { className: "tw-actions" },
        h2("button", {
          id: "btnSubmitInvitePerson",
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: busy || !name.trim(),
          onClick: submitCreate
        }, "\u751F\u6210\u4E13\u5C5E\u9694\u79BB\u5165\u53E3")
      )
    )
  );
}
function CallerPreviewModal({ open, view, initialPersonId, onClose }) {
  const people = view?.people || [];
  const [personId, setPersonId] = (0, import_react2.useState)("");
  const [question, setQuestion] = (0, import_react2.useState)("\u6838\u5FC3\u53E3\u5F84\u5305\u542B\u54EA\u4E9B\u8FB9\u754C\uFF1F");
  const [previewTurn, setPreviewTurn] = (0, import_react2.useState)(null);
  const [loading, setLoading] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    if (open) {
      setPersonId(initialPersonId || people[0]?.id || "");
      setPreviewTurn(null);
    }
  }, [open, initialPersonId, people.length]);
  const person = people.find((p) => p.id === personId) || people[0] || null;
  const isPaused = view?.dutyMode === "off" || person && !person.enabled;
  const authorizedCaps = (view?.capabilities || []).filter(
    (c) => c.enabled && (!person || !Array.isArray(person.caps) || person.caps.includes(c.id))
  );
  async function askSandbox() {
    if (!question.trim()) return;
    setLoading(true);
    try {
      const res = await runTwinAction("caller_preview_ask", {
        personId: person?.id || "",
        question: question.trim()
      });
      setPreviewTurn(res.result);
    } finally {
      setLoading(false);
    }
  }
  return h2(
    TwinDialog,
    {
      id: "callerPreviewDialog",
      open,
      title: "\u5BA2\u6237\u89C6\u89D2\u771F\u673A\u9884\u89C8\uFF08\u7EAF\u6C99\u7BB1\uFF0C\u4E0D\u5199\u5165\u5916\u90E8\u53F0\u8D26\uFF09",
      onClose
    },
    h2(
      "label",
      { className: "tw-field" },
      h2("span", { className: "tw-label" }, "\u6A21\u62DF\u6765\u8BBF\u5BF9\u8C61"),
      h2(
        "select",
        {
          className: "tw-select",
          value: person?.id || "",
          onChange: (e) => {
            setPersonId(e.target.value);
            setPreviewTurn(null);
          }
        },
        people.length ? people.map((p) => h2("option", { key: p.id, value: p.id }, `${p.name}\uFF08${p.channel} \xB7 ${formatModeLabel(p.mode)}\uFF09`)) : h2("option", { value: "" }, "\u9ED8\u8BA4\u8BBF\u5BA2\u6C99\u7BB1")
      )
    ),
    h2(
      "div",
      { className: "tw-card" },
      h2("div", { className: "tw-h3" }, view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB"),
      h2("p", { className: "tw-muted", style: { marginTop: "0.2rem" } }, view?.twinProfile?.intro || "\u4F9D\u636E\u5DF2\u6388\u6743\u9879\u76EE\u6587\u6863\u63D0\u4F9B\u53EA\u8BFB\u7B54\u7591"),
      h2(
        "div",
        { className: "tw-actions", style: { marginTop: "0.55rem" } },
        authorizedCaps.length ? authorizedCaps.map((c) => h2("span", { key: c.id, className: "tw-badge" }, c.name)) : h2("span", { className: "tw-badge" }, "\u6682\u672A\u5F00\u653E\u53EF\u89C1\u80FD\u529B\u9879")
      )
    ),
    isPaused && h2(
      "div",
      { className: "tw-banner is-warn" },
      "\u8BBF\u5BA2\u6B64\u65F6\u4F1A\u770B\u5230\u300C\u5F53\u524D\u6682\u505C\u503C\u73ED / \u6743\u9650\u5DF2\u6682\u505C\u300D\u793C\u8C8C\u63D0\u793A\uFF08\u4E0D\u6536\u4EFB\u4F55\u8D39\u7528\uFF0C\u65E0\u5151\u6362\u7801\u5899\uFF09\u3002"
    ),
    h2(
      "div",
      { className: "tw-field" },
      h2("span", { className: "tw-label" }, "\u4EE5\u5BF9\u65B9\u8EAB\u4EFD\u8BD5\u53D1\u4E00\u53E5\u95EE\u9898"),
      h2(
        "div",
        { className: "tw-actions" },
        h2("input", {
          id: "callerPreviewInput",
          className: "tw-input",
          style: { flex: 1 },
          value: question,
          onChange: (e) => setQuestion(e.target.value)
        }),
        h2("button", {
          id: "btnRunCallerPreview",
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: loading || !question.trim(),
          onClick: askSandbox
        }, loading ? "\u63A8\u6F14\u4E2D..." : "\u8BD5\u53D1\u68C0\u9A8C")
      )
    ),
    previewTurn && h2(
      "div",
      { className: "tw-draft-box" },
      h2("div", { className: "tw-badge is-ok", style: { marginBottom: "0.35rem" } }, previewTurn.statusLabel || "\u6C99\u7BB1\u8BD5\u7B54"),
      h2("div", null, previewTurn.reply || previewTurn.reason || "\u5DF2\u6A21\u62DF\u5904\u7406")
    )
  );
}
function ProfileEditModal({ open, view, presets, busy, onClose, onSave }) {
  const [personaId, setPersonaId] = (0, import_react2.useState)("advisor");
  const [name, setName] = (0, import_react2.useState)("");
  const [intro, setIntro] = (0, import_react2.useState)("");
  const [dutyMode, setDutyMode] = (0, import_react2.useState)("shadow");
  (0, import_react2.useEffect)(() => {
    if (open) {
      setPersonaId(view?.twinProfile?.personaId || "advisor");
      setName(view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB");
      setIntro(view?.twinProfile?.intro || "");
      setDutyMode(view?.dutyMode || "shadow");
    }
  }, [open]);
  function applyPreset(preset) {
    setPersonaId(preset.id);
    setName(preset.defaultName);
    setIntro(preset.intro);
    setDutyMode(preset.recommendedDuty);
  }
  return h2(
    TwinDialog,
    {
      id: "profileEditDialog",
      open,
      title: "\u7F16\u8F91\u5206\u8EAB\u5B9A\u4F4D\u4E0E\u5BF9\u5916\u540D\u7247",
      onClose
    },
    h2(
      "div",
      { className: "tw-field" },
      h2("span", { className: "tw-label" }, "\u5FEB\u901F\u5957\u7528\u63A8\u8350\u4EBA\u8BBE"),
      h2(
        "div",
        { className: "tw-actions" },
        (presets || []).map((p) => h2("button", {
          key: p.id,
          type: "button",
          className: personaId === p.id ? "tw-btn tw-btn-primary" : "tw-btn",
          onClick: () => applyPreset(p)
        }, p.title))
      )
    ),
    h2(
      "label",
      { className: "tw-field" },
      h2("span", { className: "tw-label" }, "\u5206\u8EAB\u5BF9\u5916\u540D\u79F0"),
      h2("input", {
        id: "profileNameInput",
        className: "tw-input",
        value: name,
        onChange: (e) => setName(e.target.value)
      })
    ),
    h2(
      "label",
      { className: "tw-field" },
      h2("span", { className: "tw-label" }, "\u4E00\u53E5\u8BDD\u5BF9\u5916\u4ECB\u7ECD\uFF08\u663E\u793A\u5728\u8BBF\u5BA2\u7F51\u9875\u4E0E\u540D\u7247\u9996\u884C\uFF09"),
      h2("textarea", {
        id: "profileIntroInput",
        className: "tw-textarea",
        value: intro,
        onChange: (e) => setIntro(e.target.value)
      })
    ),
    h2(
      "label",
      { className: "tw-field" },
      h2("span", { className: "tw-label" }, "\u9ED8\u8BA4\u5BF9\u5916\u503C\u73ED\u65B9\u5F0F"),
      h2(
        "select",
        {
          className: "tw-select",
          value: dutyMode,
          onChange: (e) => setDutyMode(e.target.value)
        },
        h2("option", { value: "shadow" }, "\u53EA\u51FA\u8349\u7A3F\u6211\u6765\u6279\uFF08\u63A8\u8350\u8D77\u6B65\uFF09"),
        h2("option", { value: "live" }, "\u5F00\u542F\u81EA\u52A8\u6258\u7BA1\uFF08\u6309\u5BF9\u8C61\u767D\u540D\u5355\uFF09"),
        h2("option", { value: "off" }, "\u6682\u505C\u5BF9\u5916\u503C\u73ED")
      )
    ),
    h2(
      "div",
      { className: "tw-actions" },
      h2("button", {
        id: "btnSaveProfileModal",
        type: "button",
        className: "tw-btn tw-btn-primary",
        disabled: busy || !name.trim(),
        onClick: async () => {
          await onSave({ personaId, name: name.trim(), intro: intro.trim(), dutyMode });
          onClose();
        }
      }, "\u4FDD\u5B58\u540D\u7247\u8BBE\u7F6E")
    )
  );
}
function PersonDrawer({ person, view, busy, onClose, onAction, onOpenPreview, onConfirm }) {
  const [copyStatus, setCopyStatus] = (0, import_react2.useState)("");
  const [selectedCaps, setSelectedCaps] = (0, import_react2.useState)([]);
  (0, import_react2.useEffect)(() => {
    setSelectedCaps(person?.caps || []);
  }, [person?.id, (person?.caps || []).join(",")]);
  (0, import_react2.useEffect)(() => {
    setCopyStatus("");
  }, [person?.id]);
  const chId = channelIdFromSelection(person?.channel);
  const inviteCredential = chId === "ch-web" ? person?.guestUrl : person?.pairCode || person?.channelHandle || "";
  return h2(
    TwinDialog,
    {
      id: "personDetailDrawer",
      open: Boolean(person),
      isDrawer: true,
      title: person ? `${person.name} \xB7 \u8BBF\u95EE\u8FB9\u754C\u4E0E\u9694\u79BB\u4F1A\u8BDD` : "\u670D\u52A1\u5BF9\u8C61\u8BE6\u60C5",
      onClose
    },
    person && h2(
      import_react2.default.Fragment,
      null,
      h2(
        "div",
        { className: "tw-card" },
        h2("div", { className: "tw-h3" }, `${person.role} \xB7 ${person.channel}`),
        h2(
          "p",
          { className: "tw-muted", style: { marginTop: "0.2rem" } },
          `${formatBindingText(person)} \xB7 \u4ECA\u65E5\u5DF2\u95EE ${person.todayCount || 0} / ${view?.dailyTurnCap || 30} \u8F6E \xB7 ${person.expiry}`
        ),
        inviteCredential && h2(
          "div",
          { className: "tw-draft-box", style: { marginTop: "0.6rem" } },
          chId === "ch-web" ? "\u4E13\u5C5E\u514D\u88C5\u7F51\u9875\uFF1A" : "\u5F53\u524D\u9080\u8BF7 / \u7ED1\u5B9A\u6807\u8BC6\uFF1A",
          h2("strong", { style: { wordBreak: "break-all" } }, inviteCredential)
        ),
        h2(
          "div",
          { className: "tw-actions", style: { marginTop: "0.6rem" } },
          inviteCredential && h2("button", {
            type: "button",
            className: "tw-btn tw-btn-primary",
            onClick: () => copyToClipboard(inviteCredential, setCopyStatus)
          }, "\u590D\u5236\u51ED\u8BC1\u7ED9\u5BF9\u65B9"),
          h2("button", {
            type: "button",
            className: "tw-btn",
            onClick: () => onOpenPreview(person.id)
          }, "\u5BA2\u6237\u89C6\u89D2\u9884\u89C8"),
          h2("button", {
            type: "button",
            className: "tw-btn",
            disabled: busy,
            onClick: () => onConfirm({
              title: "\u91CD\u7B7E\u9080\u8BF7\u51ED\u8BC1\uFF1F",
              message: `\u91CD\u7B7E\u540E\uFF0C\u300C${person.name}\u300D\u539F\u6709\u7684\u94FE\u63A5\u6216\u914D\u5BF9\u7801\u7ACB\u5373\u5931\u6548\uFF0C\u5E76\u89E3\u9664\u6B64\u524D\u5DF2\u7ED1\u5B9A\u7684\u5916\u90E8\u804A\u5929\u8D26\u53F7\u3002`,
              onAccept: () => onAction("regenerate_invite", { personId: person.id })
            })
          }, "\u91CD\u7B7E\u9080\u8BF7\u51ED\u8BC1")
        ),
        h2("span", { className: "tw-copy-status", role: "status", "aria-live": "polite" }, copyStatus)
      ),
      h2(
        "div",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u7B54\u590D\u8FB9\u754C\u6A21\u5F0F"),
        h2(
          "select",
          {
            className: "tw-select",
            value: person.mode,
            disabled: busy,
            onChange: (e) => onAction("update_person_mode", { personId: person.id, mode: e.target.value })
          },
          h2("option", { value: "confirm" }, "\u6BCF\u6761\u5148\u8349\u7A3F\u7ED9\u6211\u770B"),
          h2("option", { value: "direct" }, "\u767D\u540D\u5355\u76F4\u63A5\u7B54"),
          h2("option", { value: "summary" }, "\u53EA\u7ED9\u6C47\u603B\uFF08\u7981\u4E2A\u4EBA\u660E\u7EC6\uFF09")
        )
      ),
      h2(
        "div",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u5141\u8BB8\u8BFB\u53D6\u7684\u9879\u76EE\u80FD\u529B\u9879"),
        h2(
          "div",
          { className: "tw-actions" },
          (view?.capabilities || []).map((cap) => {
            const has = selectedCaps.includes(cap.id);
            return h2(
              "label",
              { key: cap.id, className: "tw-switch" },
              h2("input", {
                type: "checkbox",
                checked: has,
                onChange: () => {
                  const next = has ? selectedCaps.filter((x) => x !== cap.id) : [...selectedCaps, cap.id];
                  setSelectedCaps(next);
                  onAction("update_person_caps", { personId: person.id, caps: next });
                }
              }),
              cap.name
            );
          })
        )
      ),
      h2(
        "div",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u5355\u4EBA\u7269\u7406\u9694\u79BB\u5386\u53F2\u5BF9\u8BDD"),
        (person.threads || []).length ? (person.threads || []).map((t) => h2(
          "div",
          { key: t.id, className: "tw-card" },
          h2("div", { className: "tw-muted" }, `${t.time || ""} \xB7 ${t.capLabel || ""} \xB7 ${t.statusLabel || ""}`),
          h2("div", { style: { fontWeight: 600, marginTop: "0.25rem" } }, `\u95EE\uFF1A${t.question}`),
          h2("div", { style: { marginTop: "0.25rem" } }, `\u7B54\uFF1A${t.reply}`)
        )) : h2("p", { className: "tw-muted" }, "\u8BE5\u5BF9\u8C61\u4E13\u5C5E\u6587\u4EF6\u5939\u5185\u6682\u65E0\u5916\u90E8\u95EE\u7B54\u8BB0\u5F55\u3002")
      )
    )
  );
}
function ChannelConfigModal({ channel, guide, busy, onClose, onAction, onConfirm }) {
  const [wecomMode, setWecomMode] = (0, import_react2.useState)("aibot");
  const [botName, setBotName] = (0, import_react2.useState)("\u5DE5\u4F5C\u5206\u8EAB");
  const [appId, setAppId] = (0, import_react2.useState)("");
  const [agentId, setAgentId] = (0, import_react2.useState)("");
  const [appSecret, setAppSecret] = (0, import_react2.useState)("");
  const [qrResult, setQrResult] = (0, import_react2.useState)(null);
  const [copyStatus, setCopyStatus] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (channel) {
      setWecomMode(channel.wecomMode || "aibot");
      setBotName(channel.botName || "\u5DE5\u4F5C\u5206\u8EAB");
      setAppId("");
      setAgentId("");
      setAppSecret("");
      setQrResult(channel.qrUrl ? { qrUrl: channel.qrUrl } : null);
      setCopyStatus("");
    }
  }, [channel]);
  const activeGuide = channel?.id === "ch-wecom" ? guide?.modes?.[wecomMode] || guide?.modes?.aibot : guide;
  return h2(
    TwinDialog,
    {
      id: "channelConfigDialog",
      open: Boolean(channel),
      title: channel?.id === "ch-wechat" ? "\u4E2A\u4EBA\u5FAE\u4FE1 \xB7 \u672C\u673A 5 \u5206\u949F\u626B\u7801\u6FC0\u6D3B" : guide?.title || `\u914D\u7F6E ${channel?.name || ""}`,
      onClose
    },
    channel && (channel.id === "ch-wechat" ? h2(
      "div",
      { className: "tw-field" },
      h2("p", { className: "tw-muted" }, "\u65E0\u9700\u6CE8\u518C\u516C\u4F17\u53F7\u6216\u5907\u6848\u57DF\u540D\u3002\u70B9\u51FB\u4E0B\u65B9\u7B7E\u53D1 5 \u5206\u949F\u4E13\u5C5E\u626B\u7801\u51ED\u8BC1\uFF0C\u4EC5\u7ED1\u5B9A\u626B\u7801\u901A\u8FC7\u7684\u6307\u5B9A\u5BF9\u8C61\uFF0C\u964C\u751F\u4EBA\u96F6\u54CD\u5E94\u3002"),
      qrResult?.qrUrl && h2(
        "div",
        { className: "tw-draft-box" },
        h2("div", null, "\u5F53\u524D\u6709\u6548 5 \u5206\u949F\u5FAE\u4FE1\u626B\u7801\u51ED\u8BC1\uFF1A"),
        h2("strong", { style: { wordBreak: "break-all" } }, qrResult.qrUrl)
      ),
      h2(
        "div",
        { className: "tw-actions" },
        h2("button", {
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: busy,
          onClick: async () => {
            const res = await onAction("issue_wechat_qr", {});
            if (res?.result) setQrResult(res.result);
          }
        }, qrResult?.qrUrl ? "\u91CD\u65B0\u751F\u6210 5 \u5206\u949F\u7801" : "\u751F\u6210 5 \u5206\u949F\u626B\u7801\u51ED\u8BC1"),
        qrResult?.qrUrl && h2("button", {
          type: "button",
          className: "tw-btn",
          onClick: () => copyToClipboard(qrResult.qrUrl, setCopyStatus)
        }, "\u590D\u5236\u626B\u7801\u53E3\u4EE4"),
        qrResult?.qrUrl && h2("button", {
          type: "button",
          className: "tw-btn",
          disabled: busy,
          onClick: async () => {
            await onAction("confirm_wechat_scan", { qrToken: qrResult.qrToken });
            onClose();
          }
        }, "\u786E\u8BA4\u6211\u5DF2\u672C\u673A\u626B\u7801"),
        channel.configured && h2("button", {
          type: "button",
          className: "tw-btn tw-btn-danger",
          disabled: busy,
          onClick: () => onConfirm({
            title: "\u65AD\u5F00\u4E2A\u4EBA\u5FAE\u4FE1\u901A\u9053\uFF1F",
            message: "\u65AD\u5F00\u540E\u7ACB\u5373\u5173\u95ED\u5FAE\u4FE1\u8FDE\u63A5\u5E76\u4ECE\u672C\u673A 0600 \u51ED\u636E\u5E93\u62B9\u9664\u767B\u5F55\u51ED\u8BC1\u3002",
            onAccept: async () => {
              await onAction("disconnect_channel", { channelId: "ch-wechat" });
              onClose();
            }
          })
        }, "\u65AD\u5F00\u5E76\u6E05\u9664\u51ED\u636E")
      ),
      h2("span", { className: "tw-copy-status", role: "status", "aria-live": "polite" }, copyStatus)
    ) : h2(
      import_react2.default.Fragment,
      null,
      channel.id === "ch-wecom" && h2(
        "div",
        { className: "tw-seg" },
        h2("button", {
          type: "button",
          className: wecomMode === "aibot" ? "tw-seg-btn is-active" : "tw-seg-btn",
          onClick: () => setWecomMode("aibot")
        }, "\u667A\u80FD\u673A\u5668\u4EBA\u957F\u8FDE\u63A5\uFF08\u63A8\u8350\u514D\u5907\u6848\uFF09"),
        h2("button", {
          type: "button",
          className: wecomMode === "corpapp" ? "tw-seg-btn is-active" : "tw-seg-btn",
          onClick: () => setWecomMode("corpapp")
        }, "\u4F01\u4E1A\u81EA\u5EFA\u5E94\u7528")
      ),
      activeGuide?.steps && h2(
        "ol",
        { className: "tw-card", style: { margin: 0, paddingLeft: "1.6rem", fontSize: "0.84rem" } },
        activeGuide.steps.map((s, idx) => h2("li", { key: idx, style: { marginBottom: "0.3rem" } }, s))
      ),
      h2(
        "label",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u673A\u5668\u4EBA\u663E\u793A\u540D\u79F0"),
        h2("input", {
          className: "tw-input",
          value: botName,
          onChange: (e) => setBotName(e.target.value)
        })
      ),
      h2(
        "label",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, activeGuide?.appIdLabel || "App ID"),
        h2("input", {
          className: "tw-input",
          placeholder: channel.appIdHint ? `\u5F53\u524D\u5DF2\u4FDD\u5B58\uFF1A${channel.appIdHint}` : activeGuide?.appIdPh || "",
          value: appId,
          onChange: (e) => setAppId(e.target.value)
        })
      ),
      channel.id === "ch-wecom" && wecomMode === "corpapp" && h2(
        "label",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, "\u81EA\u5EFA\u5E94\u7528 AgentId"),
        h2("input", {
          className: "tw-input",
          placeholder: "\u5982\uFF1A1000002",
          value: agentId,
          onChange: (e) => setAgentId(e.target.value)
        })
      ),
      h2(
        "label",
        { className: "tw-field" },
        h2("span", { className: "tw-label" }, activeGuide?.secretLabel || "Secret / Bot Token"),
        h2("input", {
          className: "tw-input",
          type: "password",
          placeholder: channel.hasSecret ? "\u5DF2\u5B58\u5728\u672C\u673A\u52A0\u5BC6\u5BC6\u94A5\uFF0C\u7559\u65B0\u503C\u8986\u76D6" : activeGuide?.secretPh || "",
          value: appSecret,
          onChange: (e) => setAppSecret(e.target.value)
        })
      ),
      h2(
        "div",
        { className: "tw-actions" },
        h2("button", {
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: busy || !appId.trim() || !appSecret.trim(),
          onClick: async () => {
            await onAction("configure_channel", {
              channelId: channel.id,
              botName,
              appId: appId.trim(),
              agentId: agentId.trim(),
              appSecret: appSecret.trim(),
              wecomMode
            });
            onClose();
          }
        }, "\u6821\u9A8C\u5E76\u4FDD\u5B58\u672C\u673A\u76F4\u8FDE"),
        channel.configured && h2("button", {
          type: "button",
          className: "tw-btn tw-btn-danger",
          disabled: busy,
          onClick: () => onConfirm({
            title: `\u65AD\u5F00 ${channel.shortLabel}\uFF1F`,
            message: "\u65AD\u5F00\u540E\u7ACB\u5373\u505C\u6B62\u672C\u673A\u957F\u8FDE\u63A5\uFF0C\u5E76\u6E05\u9664 0600 \u51ED\u636E\u5E93\u4E2D\u4FDD\u5B58\u7684\u5E94\u7528\u5BC6\u94A5\u3002",
            onAccept: async () => {
              await onAction("disconnect_channel", { channelId: channel.id });
              onClose();
            }
          })
        }, "\u65AD\u5F00\u5E76\u6E05\u9664\u51ED\u636E")
      )
    ))
  );
}
function ConfirmActionModal({ confirmSpec, busy, onClose }) {
  return h2(
    TwinDialog,
    {
      id: "confirmActionDialog",
      open: Boolean(confirmSpec),
      title: confirmSpec?.title || "\u786E\u8BA4\u64CD\u4F5C",
      onClose
    },
    confirmSpec && h2(
      import_react2.default.Fragment,
      null,
      h2("p", { className: "tw-muted", style: { fontSize: "0.9rem", color: "var(--tw-ink)" } }, confirmSpec.message),
      h2(
        "div",
        { className: "tw-actions" },
        h2("button", { type: "button", className: "tw-btn", onClick: onClose }, "\u5148\u4E0D\u6539"),
        h2("button", {
          type: "button",
          className: "tw-btn tw-btn-danger",
          disabled: busy,
          onClick: async () => {
            await confirmSpec.onAccept?.();
            onClose();
          }
        }, "\u786E\u8BA4\u7EE7\u7EED")
      )
    )
  );
}

// src-client/scenes.js
var import_react3 = __toESM(require("react"), 1);
var h3 = import_react3.default.createElement;
var STEP_LABELS = [
  { step: 1, title: "1. \u8BFB\u53D6\u6388\u6743\u9879\u76EE", detail: "\u904D\u5386\u6587\u6863\u4E0E\u7ED3\u6784\u8BF4\u660E" },
  { step: 2, title: "2. \u63D0\u70BC\u53EA\u8BFB\u80FD\u529B\u5305", detail: "\u805A\u5408\u53E3\u5F84\u4E0E\u4E3B\u9898\u7247\u6BB5" },
  { step: 3, title: "3. \u5265\u79BB\u5BC6\u94A5\u4E0E\u5199\u811A\u672C", detail: "\u62E6\u622A\u9690\u79C1\u5B57\u6BB5\u4E0E\u53D8\u66F4\u811A\u624B\u67B6" },
  { step: 4, title: "4. \u751F\u6210\u5B9A\u4F4D\u4E0E\u540D\u7247", detail: "\u8349\u62DF\u4EBA\u8BBE\u3001\u4ECB\u7ECD\u4E0E\u521D\u59CB\u6863\u4F4D" }
];
function OnboardScene({ view, projects, presets, busy, onAction, onOpenInvite }) {
  const job = view?.extractionJob || null;
  const isMount = view?.onboardMode === "mount";
  const [selectedCandidateId, setSelectedCandidateId] = (0, import_react3.useState)("");
  const [manualRootPath, setManualRootPath] = (0, import_react3.useState)("");
  const [projectName, setProjectName] = (0, import_react3.useState)("");
  const [ownerName, setOwnerName] = (0, import_react3.useState)("");
  const [brief, setBrief] = (0, import_react3.useState)("");
  const [optimisticStep, setOptimisticStep] = (0, import_react3.useState)(0);
  const [draftName, setDraftName] = (0, import_react3.useState)("");
  const [draftIntro, setDraftIntro] = (0, import_react3.useState)("");
  const [draftPersonaId, setDraftPersonaId] = (0, import_react3.useState)("advisor");
  const [draftDuty, setDraftDuty] = (0, import_react3.useState)("shadow");
  const [selfTestQ, setSelfTestQ] = (0, import_react3.useState)("");
  (0, import_react3.useEffect)(() => {
    if (projects?.length && !selectedCandidateId) {
      setSelectedCandidateId(projects[0].id);
      setProjectName(projects[0].name || "");
    }
  }, [projects, selectedCandidateId]);
  (0, import_react3.useEffect)(() => {
    if (job?.status === "ready") {
      setDraftName(view?.twinProfile?.name || job?.draftProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB");
      setDraftIntro(view?.twinProfile?.intro || job?.draftProfile?.intro || "\u4F9D\u636E\u5DF2\u6388\u6743\u9879\u76EE\u6587\u6863\u63D0\u4F9B\u53EA\u8BFB\u7B54\u7591");
      setDraftPersonaId(view?.twinProfile?.personaId || "advisor");
      setDraftDuty(view?.dutyMode || job?.draftProfile?.recommendedDuty || "shadow");
      setOptimisticStep(4);
    }
  }, [job?.status, job?.id]);
  const activeStep = job?.status === "ready" ? 4 : Math.max(optimisticStep, job?.step || 0);
  async function beginExtraction() {
    setOptimisticStep(1);
    const t1 = setTimeout(() => setOptimisticStep((s) => s < 2 ? 2 : s), 160);
    const t2 = setTimeout(() => setOptimisticStep((s) => s < 3 ? 3 : s), 320);
    try {
      await onAction("start_extraction", {
        candidateId: manualRootPath.trim() ? "" : selectedCandidateId,
        rootPath: manualRootPath.trim(),
        projectName: projectName.trim() || void 0,
        ownerName: ownerName.trim() || void 0,
        brief: brief.trim() || void 0,
        mode: isMount ? "mount" : "initial",
        autoComplete: false
      });
      setOptimisticStep(4);
    } catch (err) {
      setOptimisticStep(0);
      throw err;
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
    }
  }
  return h3(
    "div",
    { className: "tw-container" },
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3(
          "div",
          null,
          h3("h2", { className: "tw-h2" }, isMount ? "\u4E3A\u73B0\u6709\u4E3B\u5206\u8EAB\u6302\u8F7D\u65B0\u9879\u76EE\u80FD\u529B\u5305" : "\u9996\u6B21\u53EA\u8BFB\u63D0\u70BC \xB7 \u4ECE\u73B0\u6709\u9879\u76EE\u957F\u51FA\u4F60\u7684\u5DE5\u4F5C\u5206\u8EAB"),
          h3(
            "p",
            { className: "tw-muted", style: { marginTop: "0.25rem" } },
            "\u5168\u7A0B\u53EA\u8BFB\u6388\u6743\u9879\u76EE\u6587\u6863\uFF1B\u81EA\u52A8\u9694\u79BB\u5BC6\u94A5\u3001\u51ED\u636E\u4E0E\u5199\u811A\u672C\uFF1B\u63D0\u70BC\u8FC7\u7A0B\u4E2D\u53EF\u968F\u65F6\u6536\u8D77\u5230\u540E\u53F0\u6D4F\u89C8\u5DE5\u4F5C\u53F0\u3002"
          )
        ),
        activeStep > 0 && activeStep < 4 && h3("button", {
          id: "btnMinimizeExtraction",
          type: "button",
          className: "tw-btn",
          onClick: () => onAction("minimize_extraction", {})
        }, "\u6536\u8D77\u5230\u540E\u53F0\u770B\u5DE5\u4F5C\u53F0")
      ),
      h3(
        "div",
        { className: "tw-step-list", style: { marginBottom: "1rem" } },
        STEP_LABELS.map((item) => {
          const done = activeStep > item.step || job?.status === "ready";
          const current = activeStep === item.step && job?.status !== "ready";
          return h3(
            "div",
            {
              key: item.step,
              className: `tw-step ${done ? "is-done" : current ? "is-active" : ""}`
            },
            h3("div", { style: { fontWeight: 650 } }, item.title),
            h3("div", { className: "tw-muted", style: { marginTop: "0.2rem" } }, item.detail)
          );
        })
      ),
      (!job || job.status !== "ready") && h3(
        "div",
        { className: "tw-field" },
        h3(
          "div",
          { className: "tw-grid-2" },
          h3(
            "label",
            { className: "tw-field" },
            h3("span", { className: "tw-label" }, "\u4ECE\u5F53\u524D Harness \u5DE5\u4F5C\u533A\u9009\u53D6\u9879\u76EE"),
            h3(
              "select",
              {
                id: "onboardProjectSelect",
                className: "tw-select",
                value: selectedCandidateId,
                disabled: busy,
                onChange: (e) => {
                  setSelectedCandidateId(e.target.value);
                  const found = (projects || []).find((p) => p.id === e.target.value);
                  if (found) setProjectName(found.name);
                }
              },
              (projects || []).length ? projects.map((p) => h3("option", { key: p.id, value: p.id }, p.name)) : h3("option", { value: "" }, "\u5F53\u524D\u672A\u6302\u8F7D\u5DE5\u4F5C\u533A\uFF08\u8BF7\u5728\u53F3\u4FA7\u8F93\u5165\u672C\u673A\u76EE\u5F55\uFF09")
            )
          ),
          h3(
            "label",
            { className: "tw-field" },
            h3("span", { className: "tw-label" }, "\u5206\u8EAB\u663E\u793A\u9879\u76EE\u522B\u540D\uFF08\u5BF9\u5916\u53EF\u89C1\u540D\u79F0\uFF0C\u4E0D\u542B\u7269\u7406\u8DEF\u5F84\uFF09"),
            h3("input", {
              id: "onboardProjectAlias",
              className: "tw-input",
              placeholder: "\u5982\uFF1A\u534E\u4E1C\u7ECF\u8425\u590D\u76D8\u9879\u76EE",
              value: projectName,
              onChange: (e) => setProjectName(e.target.value)
            })
          )
        ),
        h3(
          "details",
          { className: "tw-trace", open: !(projects || []).length },
          h3("summary", null, (projects || []).length ? "\u6216\u624B\u5DE5\u6307\u5B9A\u672C\u673A\u5176\u4ED6\u53EA\u8BFB\u9879\u76EE\u76EE\u5F55" : "\u6307\u5B9A\u672C\u673A\u53EA\u8BFB\u9879\u76EE\u76EE\u5F55"),
          h3(
            "div",
            { className: "tw-grid-2", style: { marginTop: "0.55rem" } },
            h3(
              "label",
              { className: "tw-field" },
              h3("span", { className: "tw-label" }, "\u672C\u5730\u76EE\u5F55\u7EDD\u5BF9\u8DEF\u5F84\uFF08\u4EC5\u7528\u4E8E\u540E\u53F0\u5EFA\u7ACB\u53EA\u8BFB\u7D22\u5F15\uFF09"),
              h3("input", {
                id: "onboardFolderInput",
                className: "tw-input",
                placeholder: "\u4F8B\u5982 /Users/.../my-project",
                value: manualRootPath,
                onChange: (e) => setManualRootPath(e.target.value)
              })
            ),
            h3(
              "label",
              { className: "tw-field" },
              h3("span", { className: "tw-label" }, "\u6211\u7684\u79F0\u547C\uFF08\u7528\u4E8E\u751F\u6210\u5206\u8EAB\u540D\u7247\uFF09"),
              h3("input", {
                className: "tw-input",
                placeholder: "\u5982\uFF1A\u9879\u76EE\u8D1F\u8D23\u4EBA",
                value: ownerName,
                onChange: (e) => setOwnerName(e.target.value)
              })
            )
          )
        ),
        h3(
          "label",
          { className: "tw-field" },
          h3("span", { className: "tw-label" }, "\u5148\u5631\u5490\u51E0\u53E5\u5206\u8EAB\u89C4\u77E9\uFF08\u53EF\u9009\uFF09"),
          h3("textarea", {
            className: "tw-textarea",
            placeholder: "\u4F8B\u5982\uFF1A\u5148\u590D\u8FF0\u5BF9\u65B9\u8BC9\u6C42\u518D\u56DE\u7B54\uFF1B\u9047\u5230\u6CA1\u5199\u7684\u53E3\u5F84\u76F4\u63A5\u6807\u6210\u5F85\u8865\u53E3\u5F84\uFF0C\u4E25\u7981\u7F16\u9020\u3002",
            value: brief,
            onChange: (e) => setBrief(e.target.value)
          })
        ),
        h3(
          "div",
          { className: "tw-actions" },
          h3("button", {
            id: "btnStartExtraction",
            type: "button",
            className: "tw-btn tw-btn-primary",
            disabled: busy || !selectedCandidateId && !manualRootPath.trim(),
            onClick: beginExtraction
          }, busy ? "\u6B63\u5728\u626B\u63CF\u5E76\u5B89\u5168\u5265\u79BB..." : isMount ? "\u5F00\u59CB\u53EA\u8BFB\u626B\u63CF\u5E76\u6302\u8F7D\u80FD\u529B" : "\u5F00\u59CB\u53EA\u8BFB\u63D0\u70BC\u5E76\u751F\u6210\u5206\u8EAB"),
          view?.lifecycleStage === "mature" && h3("button", {
            type: "button",
            className: "tw-btn",
            onClick: () => onAction("switch_scene", { scene: "desk" })
          }, "\u8FD4\u56DE\u5DE5\u4F5C\u53F0")
        )
      )
    ),
    job?.status === "ready" && h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3(
          "div",
          null,
          h3("h2", { className: "tw-h2" }, `\u7B2C 4 \u6B65 \xB7 \u5DF2\u4ECE\u300C${job.projectName}\u300D\u63D0\u70BC\u80FD\u529B\u5E76\u8349\u62DF\u5206\u8EAB\u540D\u7247`),
          h3(
            "p",
            { className: "tw-muted", style: { marginTop: "0.2rem" } },
            "\u80FD\u529B\u9879\u7531\u6587\u6863\u771F\u5B9E\u63D0\u70BC\uFF1B\u4E0B\u65B9\u5B9A\u4F4D\u4E0E\u540D\u7247\u5DF2\u4F9D\u636E\u9879\u76EE\u81EA\u52A8\u751F\u6210\uFF0C\u4F60\u53EF\u4EE5\u5207\u6362\u4EBA\u8BBE\u6216\u5FAE\u8C03\u540E\u542F\u7528\u3002"
          )
        )
      ),
      h3(
        "div",
        { className: "tw-actions", style: { marginBottom: "0.85rem" } },
        (job.discoveredCaps || []).map((c, idx) => h3("span", { key: idx, className: "tw-badge is-ok" }, c))
      ),
      !isMount && h3(
        "div",
        { className: "tw-field" },
        h3("span", { className: "tw-label" }, "\u9009\u4E00\u4E2A\u9ED8\u8BA4\u5B9A\u4F4D\u4EBA\u8BBE\uFF08\u81EA\u52A8\u5339\u914D\u63A8\u8350\u503C\u73ED\u65B9\u5F0F\uFF09"),
        h3(
          "div",
          { className: "tw-actions", style: { marginBottom: "0.6rem" } },
          (presets || []).map((p) => h3("button", {
            key: p.id,
            type: "button",
            className: draftPersonaId === p.id ? "tw-btn tw-btn-primary" : "tw-btn",
            onClick: () => {
              setDraftPersonaId(p.id);
              setDraftName(p.defaultName);
              setDraftIntro(p.intro);
              setDraftDuty(p.recommendedDuty);
            }
          }, p.title))
        ),
        h3(
          "div",
          { className: "tw-grid-2" },
          h3(
            "label",
            { className: "tw-field" },
            h3("span", { className: "tw-label" }, "\u5206\u8EAB\u5BF9\u5916\u540D\u79F0"),
            h3("input", {
              className: "tw-input",
              value: draftName,
              onChange: (e) => setDraftName(e.target.value)
            })
          ),
          h3(
            "label",
            { className: "tw-field" },
            h3("span", { className: "tw-label" }, "\u521D\u59CB\u503C\u73ED\u6A21\u5F0F"),
            h3(
              "select",
              {
                className: "tw-select",
                value: draftDuty,
                onChange: (e) => setDraftDuty(e.target.value)
              },
              h3("option", { value: "shadow" }, "\u53EA\u51FA\u8349\u7A3F\u6211\u6765\u6279\uFF08\u6700\u7A33\u59A5\uFF09"),
              h3("option", { value: "live" }, "\u767D\u540D\u5355\u76F4\u63A5\u7B54"),
              h3("option", { value: "off" }, "\u6682\u4E0D\u5BF9\u5916\uFF0C\u5148\u4FDD\u7559\u5728\u672C\u5730")
            )
          )
        ),
        h3(
          "label",
          { className: "tw-field", style: { marginTop: "0.5rem" } },
          h3("span", { className: "tw-label" }, "\u5BF9\u5916\u4E00\u53E5\u8BDD\u4ECB\u7ECD"),
          h3("input", {
            className: "tw-input",
            value: draftIntro,
            onChange: (e) => setDraftIntro(e.target.value)
          })
        )
      ),
      h3(
        "div",
        { className: "tw-card", style: { marginTop: "0.85rem", background: "var(--tw-sunken)" } },
        h3("div", { className: "tw-label", style: { marginBottom: "0.35rem" } }, "\u4E0A\u7EBF\u524D\u5148\u8BD5\u95EE\u4E00\u53E5\uFF08\u4EC5\u672C\u4EBA\u6C99\u7BB1\u9884\u6F14\uFF0C\u4E0D\u7559\u5BF9\u5916\u75D5\u8FF9\uFF09"),
        h3(
          "div",
          { className: "tw-actions" },
          h3("input", {
            className: "tw-input",
            style: { flex: 1 },
            placeholder: "\u5982\uFF1A\u8FD9\u4E2A\u9879\u76EE\u80FD\u5BF9\u5916\u8BB2\u54EA\u4E9B\u5185\u5BB9\uFF1F",
            value: selfTestQ,
            onChange: (e) => setSelfTestQ(e.target.value)
          }),
          h3("button", {
            type: "button",
            className: "tw-btn",
            disabled: busy || !selfTestQ.trim(),
            onClick: () => onAction("self_test", { question: selfTestQ.trim() })
          }, "\u8BD5\u95EE\u5206\u8EAB")
        ),
        view?.selfTestTurn && h3(
          "div",
          { className: "tw-draft-box", style: { marginTop: "0.55rem" } },
          h3("div", { className: "tw-muted" }, `\u4F9D\u636E\uFF1A${view.selfTestTurn.basis}\uFF08${view.selfTestTurn.duration}\uFF09`),
          h3("div", { style: { marginTop: "0.25rem" } }, view.selfTestTurn.answer)
        )
      ),
      h3(
        "div",
        { className: "tw-actions", style: { marginTop: "0.95rem" } },
        h3("button", {
          id: "btnCompleteOnboard",
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: busy,
          onClick: async () => {
            if (!isMount && draftName.trim()) {
              await onAction("update_profile", {
                personaId: draftPersonaId,
                name: draftName.trim(),
                intro: draftIntro.trim(),
                dutyMode: draftDuty
              });
            }
            await onAction("complete_extraction", { scene: isMount ? "caps" : "desk" });
          }
        }, isMount ? "\u786E\u8BA4\u65B0\u80FD\u529B\u5305\u5E76\u56DE\u5230\u80FD\u529B\u9875" : "\u786E\u8BA4\u540D\u7247\u5E76\u8FDB\u5165\u5DE5\u4F5C\u53F0"),
        !isMount && h3("button", {
          type: "button",
          className: "tw-btn",
          disabled: busy,
          onClick: async () => {
            if (draftName.trim()) {
              await onAction("update_profile", {
                personaId: draftPersonaId,
                name: draftName.trim(),
                intro: draftIntro.trim(),
                dutyMode: draftDuty
              });
            }
            await onAction("complete_extraction", { scene: "desk" });
            onOpenInvite();
          }
        }, "\u542F\u7528\u5E76\u987A\u4FBF\u5F00\u901A\u7B2C\u4E00\u4F4D\u8BD5\u7528\u5BF9\u8C61")
      )
    )
  );
}
function DeskScene({
  view,
  busy,
  onAction,
  onEditDraft,
  onOpenPreview,
  onOpenProfileEdit,
  onOpenInvite,
  onHandoffToOwner
}) {
  const [commandText, setCommandText] = (0, import_react3.useState)("");
  const people = view?.people || [];
  const enabledPeopleCount = people.filter((p) => p.enabled).length;
  const enabledCapsCount = (view?.capabilities || []).filter((c) => c.enabled).length;
  const approvals = view?.approvals || [];
  const deliveries = view?.deliveries || [];
  const hasAnyDelta = (view?.mountedProjects || []).some((p) => p.hasDelta);
  async function submitCommand() {
    if (!commandText.trim()) return;
    await onAction("run_command", { text: commandText.trim() });
    setCommandText("");
  }
  return h3(
    "div",
    { className: "tw-container" },
    view?.extractionJob && h3(
      "div",
      { className: "tw-banner" },
      h3("span", null, view.extractionJob.status === "ready" ? `\u300C${view.extractionJob.projectName}\u300D\u5DF2\u5B8C\u6210\u80FD\u529B\u63D0\u70BC\u4E0E\u540D\u7247\u8349\u62DF\uFF0C\u70B9\u53F3\u4FA7\u5B9A\u7A3F\u751F\u6548\u3002` : `\u5206\u8EAB\u6B63\u5728\u540E\u53F0\u53EA\u8BFB\u63D0\u70BC\u300C${view.extractionJob.projectName}\u300D...`),
      h3("button", {
        type: "button",
        className: "tw-btn tw-btn-primary",
        onClick: () => onAction("switch_scene", { scene: "onboard" })
      }, view.extractionJob.status === "ready" ? "\u53BB\u7B2C 4 \u6B65\u5B9A\u7A3F\u540D\u7247" : "\u67E5\u770B\u63D0\u70BC\u8FDB\u5EA6")
    ),
    view?.dutyMode === "off" && h3(
      "div",
      { className: "tw-banner is-warn" },
      h3("span", null, "\u5F53\u524D\u5DF2\u6682\u505C\u5BF9\u5916\u503C\u73ED\uFF1A\u6240\u6709\u5916\u90E8\u8BBF\u5BA2\u6216\u7FA4\u804A\u63D0\u95EE\u90FD\u4F1A\u6536\u5230\u793C\u8C8C\u6682\u505C\u63D0\u793A\uFF0C\u4E0D\u4F1A\u76F2\u76EE\u5E94\u7B54\u3002"),
      h3("button", {
        type: "button",
        className: "tw-btn",
        disabled: busy,
        onClick: () => onAction("set_duty_mode", { dutyMode: "shadow" })
      }, "\u6062\u590D\u300C\u53EA\u51FA\u8349\u7A3F\u6211\u6765\u6279\u300D")
    ),
    hasAnyDelta && h3(
      "div",
      { className: "tw-banner" },
      h3("span", null, "\u68C0\u6D4B\u5230\u5DF2\u6302\u8F7D\u9879\u76EE\u6587\u6863\u53D1\u751F\u672C\u673A\u53D8\u52A8\uFF080-Token \u589E\u91CF\u611F\u5E94\uFF09\uFF0C\u7B49\u5F85\u4F60\u786E\u8BA4\u5347\u7EA7\u80FD\u529B\u5305\u3002"),
      h3("button", {
        type: "button",
        className: "tw-btn tw-btn-primary",
        onClick: () => onAction("switch_scene", { scene: "caps" })
      }, "\u67E5\u770B\u53D8\u52A8\u5E76\u786E\u8BA4\u5347\u7EA7")
    ),
    h3(
      "section",
      { className: "tw-status-strip" },
      h3(
        "div",
        { style: { minWidth: 0, flex: "1 1 240px" } },
        h3(
          "div",
          { className: "tw-actions" },
          h3("strong", { style: { fontSize: "1.02rem" } }, view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB"),
          h3("button", {
            id: "btnEditTwinProfile",
            type: "button",
            className: "tw-btn",
            onClick: onOpenProfileEdit
          }, "\u7F16\u8F91\u540D\u7247")
        ),
        h3(
          "p",
          { className: "tw-muted", style: { marginTop: "0.25rem" } },
          view?.twinProfile?.intro || "\u5728\u6388\u6743\u9879\u76EE\u53EA\u8BFB\u8303\u56F4\u4E0E\u7EA2\u7EBF\u5185\u66FF\u4F60\u7B54\u7591\u4E0E\u6C47\u603B\uFF0C\u7EDD\u4E0D\u7F16\u9020\u4F9D\u636E"
        )
      ),
      h3(
        "div",
        { className: "tw-actions" },
        h3(
          "div",
          { className: "tw-seg", role: "group", "aria-label": "\u5BF9\u5916\u503C\u73ED\u65B9\u5F0F" },
          [
            ["shadow", "\u53EA\u51FA\u8349\u7A3F\u6211\u6765\u6279"],
            ["live", "\u5F00\u542F\u81EA\u52A8\u6258\u7BA1"],
            ["off", "\u6682\u505C\u503C\u73ED"]
          ].map(([mode, label]) => h3("button", {
            key: mode,
            type: "button",
            className: view?.dutyMode === mode ? "tw-seg-btn is-active" : "tw-seg-btn",
            disabled: busy,
            onClick: () => onAction("set_duty_mode", { dutyMode: mode })
          }, label))
        ),
        h3(
          "label",
          { className: "tw-switch" },
          h3("input", {
            type: "checkbox",
            checked: Boolean(view?.presenceAutoYield),
            disabled: busy,
            onChange: (e) => onAction("set_presence_yield", { enabled: e.target.checked })
          }),
          "\u672C\u4EBA\u5728\u573A 15 \u5206\u949F\u81EA\u52A8\u6536\u58F0"
        ),
        h3("button", {
          id: "btnPreviewCallerView",
          type: "button",
          className: "tw-btn",
          onClick: () => onOpenPreview()
        }, "\u5BA2\u6237\u89C6\u89D2\u9884\u89C8"),
        h3("button", {
          id: "btnDeskInvite",
          type: "button",
          className: "tw-btn tw-btn-primary",
          onClick: onOpenInvite
        }, "+ \u5F00\u901A\u670D\u52A1\u5BF9\u8C61 / \u53D1\u9080\u8BF7")
      )
    ),
    h3(
      "section",
      { className: "tw-metrics" },
      h3(
        "div",
        { className: "tw-metric" },
        h3("div", { className: "tw-muted" }, "\u767D\u540D\u5355\u670D\u52A1\u5BF9\u8C61"),
        h3("div", { className: "tw-metric-num" }, `${enabledPeopleCount} / ${people.length}`)
      ),
      h3(
        "div",
        { className: "tw-metric" },
        h3("div", { className: "tw-muted" }, "\u5F53\u524D\u5F00\u653E\u80FD\u529B\u9879"),
        h3("div", { className: "tw-metric-num" }, `${enabledCapsCount}`)
      ),
      h3(
        "div",
        { className: "tw-metric" },
        h3("div", { className: "tw-muted" }, "\u5F85\u62CD\u677F\u4E0E\u5F85\u8865\u53E3\u5F84"),
        h3("div", { className: "tw-metric-num" }, `${approvals.length}`)
      )
    ),
    view?.hasDeskUndo && h3(
      "div",
      { id: "deskUndoStrip", className: "tw-undo-strip" },
      h3("span", null, "\u5DE5\u4F5C\u53F0\u521A\u5B8C\u6210\u4E00\u6B21\u64CD\u4F5C\u3002\u5982\u6709\u8BEF\u70B9\u53EF\u7ACB\u5373\u64A4\u56DE\u3002"),
      h3("button", {
        type: "button",
        className: "tw-btn",
        disabled: busy,
        onClick: () => onAction("undo_desk", {})
      }, "\u64A4\u9500\u4E0A\u4E00\u6B65\u64CD\u4F5C")
    ),
    h3(
      "section",
      { className: "tw-field" },
      h3(
        "div",
        { className: "tw-card-head", style: { marginBottom: 0 } },
        h3("h2", { className: "tw-h2" }, `\u9700\u8981\u4F60\u62FF\u4E3B\u610F\uFF08${approvals.length}\uFF09`),
        h3("span", { className: "tw-muted" }, "\u6240\u6709\u8D8A\u6743\u8FB9\u754C\u3001\u5F85\u8865\u53E3\u5F84\u4E0E\u5F71\u5B50\u6A21\u5F0F\u8349\u7A3F\u90FD\u5728\u8FD9\u91CC\u4EBA\u5DE5\u5B9A\u97F3")
      ),
      approvals.length ? approvals.map((app) => h3(
        "article",
        {
          key: app.id,
          className: app.tone === "danger" ? "tw-approval is-danger" : "tw-approval"
        },
        h3(
          "div",
          { className: "tw-card-head", style: { marginBottom: 0 } },
          h3(
            "div",
            { className: "tw-actions" },
            h3("span", { className: `tw-badge ${app.tone === "danger" ? "is-danger" : "is-amber"}` }, app.tag),
            h3("strong", null, app.headline)
          ),
          h3("span", { className: "tw-muted" }, app.channel)
        ),
        h3("p", { className: "tw-muted" }, app.gist),
        h3(
          "div",
          { className: "tw-draft-box" },
          h3("div", { className: "tw-muted", style: { marginBottom: "0.25rem" } }, `\u539F\u95EE\uFF1A${app.question}`),
          h3("div", null, app.draft)
        ),
        h3(
          "div",
          { className: "tw-actions" },
          h3("button", {
            type: "button",
            className: "tw-btn tw-btn-primary",
            disabled: busy,
            onClick: () => onAction("approve_draft", { approvalId: app.id })
          }, app.primaryActionLabel || "\u6279\u51C6\u53D1\u51FA"),
          h3("button", {
            type: "button",
            className: "tw-btn",
            disabled: busy,
            onClick: () => onEditDraft(app)
          }, "\u6539\u4E00\u4E0B\u518D\u53D1"),
          h3("button", {
            type: "button",
            className: "tw-btn",
            disabled: busy,
            onClick: () => onHandoffToOwner(app)
          }, "\u8F6C\u6211\u672C\u4EBA\u8FDB\u4F1A\u8BDD\u5904\u7406"),
          app.allowRuleExtract && h3("button", {
            type: "button",
            className: "tw-btn",
            disabled: busy,
            onClick: () => onAction("save_approval_as_rule", { approvalId: app.id, ruleText: app.draft, kind: "\u89C4\u77E9" })
          }, "\u53D1\u51FA\u5E76\u8BB0\u6210\u957F\u671F\u89C4\u77E9"),
          h3("button", {
            type: "button",
            className: "tw-btn",
            disabled: busy,
            onClick: () => onAction("dismiss_approval", { approvalId: app.id })
          }, "\u5148\u6401\u7F6E")
        ),
        app.trace && h3(
          "details",
          { className: "tw-trace" },
          h3("summary", null, "\u67E5\u770B\u53EA\u8BFB\u6838\u5BF9\u4F9D\u636E\u4E0E\u5BA1\u8BA1\u8F68\u8FF9"),
          h3("p", { className: "tw-muted", style: { margin: "0.35rem 0" } }, app.trace.intro),
          (app.trace.steps || []).map((st, i) => h3("div", { key: i, className: "tw-muted" }, `${i + 1}. ${st.title}\uFF1A${st.detail}`)),
          app.trace.techNote && h3("div", { className: "tw-muted", style: { marginTop: "0.25rem" } }, app.trace.techNote)
        )
      )) : h3(
        "div",
        { className: "tw-card" },
        h3("h3", { className: "tw-h3" }, "\u76EE\u524D\u6CA1\u6709\u79EF\u538B\u5F85\u62CD\u677F\u4E8B\u9879"),
        h3(
          "p",
          { className: "tw-muted", style: { marginTop: "0.25rem" } },
          "\u4F60\u53EF\u4EE5\u70B9\u51FB\u4E0A\u65B9\u300C\u5BA2\u6237\u89C6\u89D2\u9884\u89C8\u300D\u68C0\u9A8C\u5206\u8EAB\u56DE\u7B54\u53E3\u5F84\uFF0C\u6216\u5728\u4E0B\u65B9\u6307\u4EE4\u680F\u8BD5\u8DD1\u4E00\u53E5\u63D0\u95EE\u3002"
        )
      )
    ),
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3(
          "div",
          null,
          h3("h2", { className: "tw-h2" }, "\u76F4\u63A5\u7ED9\u5206\u8EAB\u4EA4\u4EE3\u65B0\u89C4\u77E9 / \u672C\u5730\u8BD5\u95EE"),
          h3(
            "p",
            { className: "tw-muted", style: { marginTop: "0.2rem" } },
            "\u652F\u6301\u81EA\u7136\u8BED\u8A00\u6307\u4EE4\uFF0C\u4F8B\u5982\u300C\u52A0\u6761\u7EA2\u7EBF\uFF1A\u62A5\u4EF7\u4E0E\u6392\u671F\u4E00\u5F8B\u8F6C\u6211\u300D\u3001\u300C\u6682\u505C\u67D0\u4F4D\u5BF9\u8C61\u300D\u6216\u76F4\u63A5\u8F93\u5165\u63D0\u95EE\u6D4B\u8BD5\u53E3\u543B\u3002"
          )
        )
      ),
      h3(
        "div",
        { className: "tw-actions" },
        h3("input", {
          id: "deskCommandInput",
          className: "tw-input",
          style: { flex: 1 },
          placeholder: "\u8F93\u5165\u6307\u4EE4\u6216\u8BD5\u8DD1\u63D0\u95EE\uFF0C\u5982\uFF1A\u52A0\u6761\u89C4\u77E9\uFF1A\u5148\u590D\u8FF0\u8BC9\u6C42\u518D\u7ED9\u524D 3 \u884C\u7ED3\u8BBA",
          value: commandText,
          onChange: (e) => setCommandText(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") submitCommand();
          }
        }),
        h3("button", {
          id: "btnDeskCommandSubmit",
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: busy || !commandText.trim(),
          onClick: submitCommand
        }, "\u6267\u884C\u6307\u4EE4")
      ),
      view?.selfTestTurn && h3(
        "div",
        { className: "tw-draft-box", style: { marginTop: "0.65rem" } },
        h3("div", { className: "tw-muted" }, `\u81EA\u6D4B\u95EE\uFF1A${view.selfTestTurn.question} \xB7 ${view.selfTestTurn.basis}`),
        h3("div", { style: { marginTop: "0.25rem" } }, view.selfTestTurn.answer)
      )
    ),
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3("h2", { className: "tw-h2" }, `\u6700\u8FD1\u503C\u73ED\u8BB0\u5F55\uFF08${deliveries.length}\uFF09`),
        h3("span", { className: "tw-muted" }, "\u81EA\u52A8\u56DE\u590D\u3001\u672C\u4EBA\u62CD\u677F\u56DE\u6267\u53CA\u5728\u573A\u81EA\u52A8\u6536\u58F0\u5747\u7559\u75D5\u53EF\u67E5")
      ),
      deliveries.length ? deliveries.map((d) => h3(
        "div",
        { key: d.id, className: "tw-row", style: { alignItems: "flex-start", flexDirection: "column", gap: "0.25rem" } },
        h3(
          "div",
          { style: { display: "flex", width: "100%", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" } },
          h3(
            "div",
            { className: "tw-actions" },
            h3("strong", null, d.who),
            h3("span", { className: "tw-muted" }, `${d.channel} \xB7 ${d.time}`),
            h3("span", { className: `tw-badge ${d.statusTone === "ok" ? "is-ok" : ""}` }, d.statusLabel)
          )
        ),
        h3("div", { className: "tw-muted", style: { color: "var(--tw-ink)" } }, d.summary),
        d.trace && h3(
          "details",
          { className: "tw-trace", style: { width: "100%" } },
          h3("summary", null, "\u67E5\u770B\u5BA1\u8BA1\u7EC6\u8282"),
          h3("div", { className: "tw-muted" }, d.trace.intro),
          (d.trace.steps || []).map((st, idx) => h3("div", { key: idx, className: "tw-muted" }, `${idx + 1}. ${st.title}\uFF1A${st.detail}`))
        )
      )) : h3("p", { className: "tw-muted" }, "\u5C1A\u65E0\u5916\u90E8\u670D\u52A1\u6295\u9012\u8BB0\u5F55\u3002\u5F00\u901A\u9996\u4F4D\u670D\u52A1\u5BF9\u8C61\u540E\uFF0C\u6BCF\u7B14\u56DE\u590D\u90FD\u4F1A\u5B9E\u65F6\u663E\u793A\u5728\u8FD9\u91CC\u3002")
    )
  );
}
function PeopleScene({ view, busy, onAction, onOpenInvite, onSelectPerson, onOpenPreview }) {
  const people = view?.people || [];
  return h3(
    "div",
    { className: "tw-container" },
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3(
          "div",
          null,
          h3("h2", { className: "tw-h2" }, "\u6211\u5F00\u901A\u7684\u4EBA \xB7 \u5355\u4EBA\u767D\u540D\u5355\u4E0E\u7269\u7406\u9694\u79BB\u4F1A\u8BDD"),
          h3(
            "p",
            { className: "tw-muted", style: { marginTop: "0.25rem" } },
            "\u6BCF\u4EBA\u4F7F\u7528\u72EC\u7ACB\u7269\u7406\u9694\u79BB\u6587\u4EF6\u5939\u5B58\u50A8\u5BF9\u8BDD\uFF1B\u9ED8\u8BA4\u5355\u4EBA\u5355\u65E5\u4E0A\u9650 30 \u8F6E\u9632\u5237\u5C4F\uFF1B\u96F6\u4ED8\u8D39\u5899\u6216\u5151\u6362\u7801\u9650\u5236\u3002"
          )
        ),
        h3("button", {
          id: "btnAddPerson",
          type: "button",
          className: "tw-btn tw-btn-primary",
          onClick: onOpenInvite
        }, "+ \u5F00\u901A\u670D\u52A1\u5BF9\u8C61 / \u53D1\u9080\u8BF7")
      ),
      people.length ? h3(
        "div",
        { style: { overflowX: "auto" } },
        h3(
          "table",
          { className: "tw-table" },
          h3(
            "thead",
            null,
            h3(
              "tr",
              null,
              h3("th", null, "\u670D\u52A1\u5BF9\u8C61"),
              h3("th", null, "\u5F00\u901A\u901A\u9053\u4E0E\u7ED1\u5B9A"),
              h3("th", null, "\u7B54\u590D\u8FB9\u754C"),
              h3("th", null, "\u72B6\u6001\u4E0E\u4ECA\u65E5\u9891\u6B21"),
              h3("th", null, "\u5F00\u5173"),
              h3("th", null, "\u64CD\u4F5C")
            )
          ),
          h3(
            "tbody",
            null,
            people.map((p) => h3(
              "tr",
              { key: p.id, className: "is-row-clickable" },
              h3(
                "td",
                null,
                h3("div", { style: { fontWeight: 600 } }, p.name),
                h3("div", { className: "tw-muted" }, p.role)
              ),
              h3(
                "td",
                { "data-label": "\u901A\u9053" },
                h3("div", null, p.channel),
                h3("div", { className: "tw-muted" }, formatBindingText(p))
              ),
              h3("td", { "data-label": "\u7B54\u590D\u8FB9\u754C" }, formatModeLabel(p.mode)),
              h3(
                "td",
                { "data-label": "\u72B6\u6001" },
                h3("div", null, p.expiry),
                h3("div", { className: "tw-muted" }, `\u4ECA\u65E5 ${p.todayCount || 0}/${view?.dailyTurnCap || 30} \u8F6E \xB7 \u7D2F\u8BA1 ${p.servedCount || 0} \u6B21`)
              ),
              h3(
                "td",
                { "data-label": "\u542F\u7528\u5F00\u5173" },
                h3("input", {
                  type: "checkbox",
                  "aria-label": `\u5207\u6362 ${p.name} \u542F\u7528\u72B6\u6001`,
                  checked: Boolean(p.enabled),
                  disabled: busy,
                  onChange: (e) => onAction("toggle_person", { personId: p.id, enabled: e.target.checked })
                })
              ),
              h3(
                "td",
                null,
                h3(
                  "div",
                  { className: "tw-actions" },
                  h3("button", {
                    type: "button",
                    className: "tw-btn",
                    onClick: () => onSelectPerson(p.id)
                  }, "\u8BE6\u60C5\u4E0E\u5BF9\u8BDD"),
                  h3("button", {
                    type: "button",
                    className: "tw-btn",
                    onClick: () => onOpenPreview(p.id)
                  }, "\u5BA2\u6237\u89C6\u89D2")
                )
              )
            ))
          )
        )
      ) : h3("div", { className: "tw-draft-box" }, "\u6682\u672A\u5F00\u901A\u4EFB\u4F55\u5916\u90E8\u6216\u5185\u90E8\u8BD5\u7528\u5BF9\u8C61\u3002\u70B9\u51FB\u53F3\u4E0A\u89D2\u300C+ \u5F00\u901A\u670D\u52A1\u5BF9\u8C61 / \u53D1\u9080\u8BF7\u300D\uFF0C\u4E00\u952E\u751F\u6210\u4E13\u5C5E\u7F51\u9875\u94FE\u63A5\u30015 \u5206\u949F\u5FAE\u4FE1\u626B\u7801\u51ED\u8BC1\u6216\u7FA4\u767D\u540D\u5355\u3002")
    )
  );
}
function CapsScene({ view, busy, onAction, onOpenChannel, onConfirm }) {
  const [newKind, setNewKind] = (0, import_react3.useState)("\u89C4\u77E9");
  const [newText, setNewText] = (0, import_react3.useState)("");
  const [editingRuleId, setEditingRuleId] = (0, import_react3.useState)("");
  const [editingRuleText, setEditingRuleText] = (0, import_react3.useState)("");
  const [editingRuleKind, setEditingRuleKind] = (0, import_react3.useState)("\u89C4\u77E9");
  const mountedProjects = view?.mountedProjects || [];
  const capabilities = view?.capabilities || [];
  const channels = view?.channels || [];
  const rules = view?.rules || [];
  return h3(
    "div",
    { className: "tw-container" },
    view?.hasCapsUndo && h3(
      "div",
      { id: "capsUndoStrip", className: "tw-undo-strip" },
      h3("span", null, "\u521A\u8C03\u6574\u4E86\u80FD\u529B\u5305\u3001\u901A\u9053\u6216\u89C4\u77E9\u8BBE\u7F6E\u3002"),
      h3("button", {
        type: "button",
        className: "tw-btn",
        disabled: busy,
        onClick: () => onAction("undo_caps", {})
      }, "\u64A4\u9500\u672C\u9875\u6539\u52A8")
    ),
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3(
          "div",
          null,
          h3("h2", { className: "tw-h2" }, `\u5DF2\u6302\u8F7D\u7684\u9879\u76EE\u80FD\u529B\u5305\uFF08${mountedProjects.length}\uFF09`),
          h3(
            "p",
            { className: "tw-muted", style: { marginTop: "0.2rem" } },
            "\u91C7\u7528\u300C1 \u4E2A\u4E3B\u5206\u8EAB + \u591A\u9879\u76EE\u53EA\u8BFB\u80FD\u529B\u5305\u300D\u67B6\u6784\uFF1B0-Token \u672C\u5730mtime\u611F\u77E5\u53D8\u52A8\u540E\u7B49\u5F85\u4F60\u70B9\u6309\u786E\u8BA4\u5347\u7EA7\u3002"
          )
        ),
        h3("button", {
          id: "btnMountProject",
          type: "button",
          className: "tw-btn tw-btn-primary",
          onClick: () => onAction("switch_scene", { scene: "onboard", onboardMode: "mount" })
        }, "+ \u6302\u8F7D\u65B0\u9879\u76EE")
      ),
      mountedProjects.length ? h3(
        "div",
        { className: "tw-grid-2" },
        mountedProjects.map((mp) => h3(
          "article",
          { key: mp.id, className: "tw-card" },
          h3(
            "div",
            { className: "tw-card-head" },
            h3(
              "div",
              null,
              h3("h3", { className: "tw-h3" }, mp.projectName),
              h3(
                "p",
                { className: "tw-muted", style: { marginTop: "0.2rem" } },
                `${mp.docCount} \u7BC7\u53EA\u8BFB\u6587\u6863 \xB7 \u5DF2\u9694\u79BB ${mp.blockedSecretCount} \u9879\u51ED\u636E / ${mp.blockedWriteScriptCount} \u4E2A\u5199\u811A\u672C`
              )
            ),
            mp.hasDelta && h3("span", { className: "tw-badge is-amber" }, "\u68C0\u6D4B\u5230\u53D8\u52A8")
          ),
          h3("p", { className: "tw-muted" }, mp.shortSummary),
          mp.deltaSpec && h3(
            "div",
            { className: "tw-banner is-warn", style: { marginTop: "0.6rem" } },
            h3(
              "div",
              { style: { flex: 1 } },
              h3("div", { style: { fontWeight: 600 } }, mp.deltaSpec.badge || "\u68C0\u6D4B\u5230\u9879\u76EE\u53D8\u52A8"),
              mp.deltaSpec.intro && h3("div", { className: "tw-muted" }, mp.deltaSpec.intro),
              (mp.deltaSpec.items || []).map((it, i) => h3("div", { key: i, className: "tw-muted" }, `${it.title}\uFF1A${it.desc}`))
            ),
            h3("button", {
              type: "button",
              className: "tw-btn tw-btn-primary",
              disabled: busy,
              onClick: () => onAction("confirm_delta_upgrade", { projectId: mp.id })
            }, "\u786E\u8BA4\u5347\u7EA7\u5206\u8EAB")
          ),
          h3(
            "div",
            { className: "tw-actions", style: { marginTop: "0.65rem" } },
            h3("button", {
              type: "button",
              className: "tw-btn",
              disabled: busy,
              onClick: () => onAction("recheck_delta", { projectId: mp.id })
            }, "\u91CD\u65B0\u68C0\u6D4B\u53D8\u52A8"),
            h3("button", {
              type: "button",
              className: "tw-btn tw-btn-danger",
              disabled: busy,
              onClick: () => onConfirm({
                title: `\u5378\u8F7D\u300C${mp.projectName}\u300D\u80FD\u529B\u5305\uFF1F`,
                message: "\u5378\u8F7D\u4EC5\u79FB\u9664\u5206\u8EAB\u5BF9\u8BE5\u9879\u76EE\u6587\u6863\u7684\u7D22\u5F15\u5F15\u7528\uFF0C\u7EDD\u4E0D\u4F1A\u4FEE\u6539\u6216\u5220\u9664\u4F60\u539F\u672C\u7684\u4EFB\u4F55\u9879\u76EE\u6587\u4EF6\u3002",
                onAccept: () => onAction("unmount_project", { projectId: mp.id })
              })
            }, "\u5378\u8F7D\u9879\u76EE")
          )
        ))
      ) : h3("div", { className: "tw-draft-box" }, "\u6682\u672A\u6302\u8F7D\u4EFB\u4F55\u9879\u76EE\u80FD\u529B\u5305\u3002\u70B9\u51FB\u53F3\u4E0A\u89D2\u300C+ \u6302\u8F7D\u65B0\u9879\u76EE\u300D\u5F00\u59CB\u53EA\u8BFB\u63D0\u70BC\u3002")
    ),
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3("h2", { className: "tw-h2" }, `\u5206\u8EAB\u5DF2\u638C\u63E1\u7684\u53EA\u8BFB\u80FD\u529B\u9879\uFF08${capabilities.length}\uFF09`),
        h3("span", { className: "tw-muted" }, "\u5173\u95ED\u67D0\u9879\u5F00\u5173\u540E\uFF0C\u5206\u8EAB\u5C06\u62D2\u7EDD\u68C0\u7D22\u8BE5\u4E3B\u9898\u8D44\u6599")
      ),
      capabilities.length ? h3(
        "div",
        null,
        capabilities.map((cap) => h3(
          "div",
          { key: cap.id, className: "tw-row" },
          h3(
            "div",
            null,
            h3(
              "div",
              { style: { fontWeight: 600 } },
              cap.name,
              h3("span", { className: "tw-badge", style: { marginLeft: "0.45rem" } }, cap.projectName || "\u5DF2\u6388\u6743\u9879\u76EE")
            ),
            h3("div", { className: "tw-muted" }, cap.scope || cap.summary)
          ),
          h3(
            "label",
            { className: "tw-switch" },
            h3("input", {
              type: "checkbox",
              checked: Boolean(cap.enabled),
              disabled: busy,
              onChange: (e) => onAction("toggle_capability", { capId: cap.id, enabled: e.target.checked })
            }),
            cap.enabled ? "\u5F00\u653E" : "\u6536\u8D77"
          )
        ))
      ) : h3("p", { className: "tw-muted" }, "\u5C1A\u65E0\u63D0\u70BC\u51FA\u7684\u80FD\u529B\u9879\u3002")
    ),
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3("h2", { className: "tw-h2" }, "\u4E94\u7C7B\u672C\u5730\u76F4\u8FDE\u63A5\u5F85\u901A\u9053"),
        h3("span", { className: "tw-muted" }, "\u5747\u5728\u672C\u673A\u6267\u884C\u957F\u8FDE\u63A5\u6216\u626B\u7801\u9274\u6743\uFF0C\u6240\u6709\u5E94\u7528 Secret \u4EC5\u5B58\u4E8E\u672C\u673A 0600 \u51ED\u636E\u5E93")
      ),
      h3(
        "div",
        { className: "tw-grid-2" },
        channels.map((ch) => h3(
          "article",
          { key: ch.id, className: "tw-card" },
          h3(
            "div",
            { className: "tw-card-head" },
            h3(
              "div",
              null,
              h3("h3", { className: "tw-h3" }, ch.name),
              h3(
                "div",
                { className: "tw-actions", style: { marginTop: "0.25rem" } },
                h3("span", { className: `tw-badge ${ch.enabled ? "is-ok" : ""}` }, ch.enabled ? "\u5DF2\u542F\u7528" : "\u672A\u542F\u7528"),
                ch.appIdHint && h3("span", { className: "tw-badge" }, ch.appIdHint)
              )
            ),
            ch.id !== "ch-web" && h3("input", {
              type: "checkbox",
              "aria-label": `\u5F00\u5173 ${ch.name}`,
              checked: Boolean(ch.enabled),
              disabled: busy || !ch.configured && !ch.enabled,
              onChange: (e) => onAction("toggle_channel", { channelId: ch.id, enabled: e.target.checked })
            })
          ),
          h3("p", { className: "tw-muted" }, ch.desc),
          h3("p", { className: "tw-muted", style: { marginTop: "0.35rem", color: "var(--tw-ink)" } }, ch.status),
          ch.id !== "ch-web" && h3(
            "div",
            { className: "tw-actions", style: { marginTop: "0.65rem" } },
            h3("button", {
              type: "button",
              className: "tw-btn",
              onClick: () => onOpenChannel(ch)
            }, ch.id === "ch-wechat" ? "\u751F\u6210 5 \u5206\u949F\u5FAE\u4FE1\u7801 / \u626B\u7801\u7BA1\u7406" : ch.configured ? "\u91CD\u65B0\u914D\u7F6E / \u65AD\u5F00" : "\u5F15\u5BFC\u914D\u7F6E\u8FDE\u63A5")
          )
        ))
      )
    ),
    h3(
      "section",
      { className: "tw-card" },
      h3(
        "div",
        { className: "tw-card-head" },
        h3("h2", { className: "tw-h2" }, `\u8BF4\u8BDD\u89C4\u77E9\u4E0E\u5B89\u5168\u7EA2\u7EBF\uFF08${rules.length}\uFF09`),
        h3("span", { className: "tw-muted" }, "\u7EA2\u7EBF\u89C4\u5219\u59CB\u7EC8\u5148\u4E8E\u8D44\u6599\u68C0\u7D22\u6267\u884C")
      ),
      h3(
        "div",
        { className: "tw-actions", style: { marginBottom: "0.85rem" } },
        h3(
          "select",
          {
            id: "newRuleKind",
            className: "tw-select",
            style: { width: "auto" },
            value: newKind,
            onChange: (e) => setNewKind(e.target.value)
          },
          h3("option", { value: "\u89C4\u77E9" }, "\u89C4\u77E9"),
          h3("option", { value: "\u7EA2\u7EBF" }, "\u7EA2\u7EBF")
        ),
        h3("input", {
          id: "newRuleText",
          className: "tw-input",
          style: { flex: 1 },
          placeholder: "\u65B0\u589E\u4E00\u6761\u6E05\u6670\u7684\u5927\u767D\u8BDD\u89C4\u5219\uFF0C\u4F8B\u5982\uFF1A\u9047\u5230\u672A\u516C\u5F00\u5B9A\u4EF7\u7B56\u7565\u5FC5\u987B\u7531\u672C\u4EBA\u786E\u8BA4",
          value: newText,
          onChange: (e) => setNewText(e.target.value)
        }),
        h3("button", {
          id: "btnAddRule",
          type: "button",
          className: "tw-btn tw-btn-primary",
          disabled: busy || !newText.trim(),
          onClick: async () => {
            await onAction("add_rule", { kind: newKind, text: newText.trim() });
            setNewText("");
          }
        }, "\u6DFB\u52A0")
      ),
      rules.map((r) => h3(
        "div",
        { key: r.id, className: "tw-row" },
        editingRuleId === r.id ? h3(
          "div",
          { className: "tw-actions", style: { flex: 1 } },
          h3(
            "select",
            {
              className: "tw-select",
              style: { width: "auto" },
              value: editingRuleKind,
              onChange: (e) => setEditingRuleKind(e.target.value)
            },
            h3("option", { value: "\u89C4\u77E9" }, "\u89C4\u77E9"),
            h3("option", { value: "\u7EA2\u7EBF" }, "\u7EA2\u7EBF")
          ),
          h3("input", {
            className: "tw-input",
            style: { flex: 1 },
            value: editingRuleText,
            onChange: (e) => setEditingRuleText(e.target.value)
          }),
          h3("button", {
            type: "button",
            className: "tw-btn tw-btn-primary",
            disabled: busy || !editingRuleText.trim(),
            onClick: async () => {
              await onAction("edit_rule", { ruleId: r.id, kind: editingRuleKind, text: editingRuleText.trim() });
              setEditingRuleId("");
            }
          }, "\u4FDD\u5B58"),
          h3("button", {
            type: "button",
            className: "tw-btn",
            onClick: () => setEditingRuleId("")
          }, "\u53D6\u6D88")
        ) : h3(
          import_react3.default.Fragment,
          null,
          h3(
            "div",
            { style: { flex: 1 } },
            h3("span", { className: `tw-badge ${r.kind === "\u7EA2\u7EBF" ? "is-danger" : ""}`, style: { marginRight: "0.45rem" } }, r.kind),
            r.text
          ),
          h3(
            "div",
            { className: "tw-actions" },
            h3("button", {
              type: "button",
              className: "tw-btn",
              onClick: () => {
                setEditingRuleId(r.id);
                setEditingRuleKind(r.kind);
                setEditingRuleText(r.text);
              }
            }, "\u7F16\u8F91"),
            h3("button", {
              type: "button",
              className: "tw-btn tw-btn-danger",
              disabled: busy,
              onClick: () => onAction("delete_rule", { ruleId: r.id })
            }, "\u5220\u9664")
          )
        )
      ))
    )
  );
}

// src-client/index.js
var h4 = import_react4.default.createElement;
var PANEL_ID = "agent-twin";
function TwinWorkbenchRoot({ ctx }) {
  const [payload, setPayload] = (0, import_react4.useState)(null);
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [errorMsg, setErrorMsg] = (0, import_react4.useState)("");
  const [toastMsg, setToastMsg] = (0, import_react4.useState)("");
  const [editingApproval, setEditingApproval] = (0, import_react4.useState)(null);
  const [inviteOpen, setInviteOpen] = (0, import_react4.useState)(false);
  const [previewOpen, setPreviewOpen] = (0, import_react4.useState)(false);
  const [previewPersonId, setPreviewPersonId] = (0, import_react4.useState)("");
  const [profileOpen, setProfileOpen] = (0, import_react4.useState)(false);
  const [selectedPersonId, setSelectedPersonId] = (0, import_react4.useState)("");
  const [activeChannel, setActiveChannel] = (0, import_react4.useState)(null);
  const [confirmSpec, setConfirmSpec] = (0, import_react4.useState)(null);
  (0, import_react4.useEffect)(() => {
    ensureTwinStyles();
  }, []);
  const refresh = (0, import_react4.useCallback)(async () => {
    try {
      const next = await fetchTwinView();
      setPayload(next);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err?.message || "\u65E0\u6CD5\u8FDE\u63A5 AI \u5206\u8EAB\u4E3B\u673A\u670D\u52A1");
    }
  }, []);
  (0, import_react4.useEffect)(() => {
    void refresh();
  }, [refresh]);
  const handleAction = (0, import_react4.useCallback)(async (action, args = {}) => {
    setBusy(true);
    setErrorMsg("");
    try {
      const res = await runTwinAction(action, args);
      if (res.view) {
        setPayload((prev) => ({ ...prev || {}, view: res.view }));
      }
      if (action === "start_extraction" || action === "confirm_delta_upgrade") {
        void refresh();
      }
      if (res.result?.message) {
        setToastMsg(res.result.message);
      } else if (res.result?.statusLabel) {
        setToastMsg(res.result.statusLabel);
      }
      return res;
    } catch (err) {
      setErrorMsg(err?.message || "\u64CD\u4F5C\u5931\u8D25");
      throw err;
    } finally {
      setBusy(false);
    }
  }, [refresh]);
  async function handleHandoffToOwner(approval) {
    const uiWs = optService(ctx, "uiWorkspace");
    const wsReg = optService(ctx, "workspaceRegistry");
    const layout = optService(ctx, "layout");
    const draftPrompt = `\u8BF7\u63A5\u624B\u5904\u7406\u8BBF\u5BA2\u300C${approval.personName}\u300D\u7684\u95EE\u9898\u5E76\u8D77\u8349\u56DE\u590D\uFF1A
\u539F\u95EE\uFF1A${approval.question}
\u5F53\u524D\u4F9D\u636E\u7EBF\u7D22\uFF1A${approval.basisHint || "\u9700\u6838\u5BF9\u6700\u65B0\u9879\u76EE\u6750\u6599"}`;
    try {
      const firstWs = wsReg?.list?.()?.[0];
      if (uiWs && typeof uiWs.startSession === "function") {
        const session = await uiWs.startSession(firstWs ? { workspaceId: firstWs.id } : {});
        if (session?.id && typeof uiWs.requestDraftInitialization === "function") {
          await uiWs.requestDraftInitialization(session.id, { prompt: draftPrompt });
        } else if (session?.id && typeof uiWs.openSession === "function") {
          await uiWs.openSession(session.id);
        }
        await handleAction("dismiss_approval", { approvalId: approval.id });
        layout?.selectPanel?.(null);
        setToastMsg("\u5DF2\u8F6C\u81F3\u4F60\u7684\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u7EE7\u7EED\u5904\u7406");
        return;
      }
      if (uiWs && typeof uiWs.openWorkspace === "function" && firstWs) {
        await uiWs.openWorkspace(firstWs.id);
        await handleAction("dismiss_approval", { approvalId: approval.id });
        layout?.selectPanel?.(null);
        setToastMsg("\u5DF2\u6253\u5F00\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u63A5\u624B\u5904\u7406");
        return;
      }
    } catch (err) {
      setErrorMsg(err?.message || "\u8F6C\u4EA4\u5BBF\u4E3B\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u5931\u8D25");
      return;
    }
    setToastMsg("\u5DF2\u8BB0\u5F55\u5F85\u672C\u4EBA\u63A5\u624B\uFF08\u53EF\u5728\u5BBF\u4E3B\u5DE5\u4F5C\u533A\u5BF9\u8BDD\u4E2D\u76F4\u63A5\u7C98\u8D34\u539F\u95EE\u56DE\u590D\uFF0C\u6216\u70B9\u51FB\u300C\u6539\u4E00\u4E0B\u518D\u53D1\u300D\uFF09");
  }
  const view = payload?.view || null;
  const presets = payload?.presets || [];
  const channelGuides = payload?.channelGuides || {};
  const projects = payload?.projects || [];
  const scene = view?.scene || "onboard";
  const selectedPerson = (view?.people || []).find((p) => p.id === selectedPersonId) || null;
  const pendingCount = (view?.approvals || []).length;
  const tabs = [
    ...view?.lifecycleStage === "cold" || scene === "onboard" ? [["onboard", view?.onboardMode === "mount" ? "\u6302\u8F7D\u80FD\u529B\u5305" : "\u9996\u6B21\u63D0\u70BC"]] : [],
    ["desk", "\u6211\u7684\u5DE5\u4F5C\u53F0", pendingCount],
    ["people", "\u6211\u5F00\u901A\u7684\u4EBA", (view?.people || []).length],
    ["caps", "\u5206\u8EAB\u672C\u4E8B\u4E0E\u901A\u9053", (view?.capabilities || []).length]
  ];
  return h4(
    "div",
    { className: "tw-root", "data-agent-twin-workbench": "v4" },
    h4(
      "header",
      { className: "tw-topbar" },
      h4(
        "div",
        { className: "tw-brand" },
        h4("div", { className: "tw-brand-mark" }, h4(TwinNavIcon)),
        h4(
          "div",
          null,
          h4("h1", { className: "tw-brand-title" }, "AI \u5206\u8EAB\u5DE5\u4F5C\u53F0"),
          h4("p", { className: "tw-brand-sub" }, "1 \u4E2A\u4E3B\u5206\u8EAB + \u591A\u9879\u76EE\u53EA\u8BFB\u80FD\u529B\u5305 \xB7 \u672C\u5730\u9694\u79BB\u6C99\u7BB1")
        )
      ),
      h4(
        "nav",
        { className: "tw-tabs", "aria-label": "\u5DE5\u4F5C\u53F0\u573A\u666F\u5207\u6362" },
        tabs.map(([id, label, count]) => h4(
          "button",
          {
            key: id,
            type: "button",
            className: scene === id ? "tw-tab is-active" : "tw-tab",
            "aria-current": scene === id ? "page" : void 0,
            onClick: () => handleAction("switch_scene", { scene: id })
          },
          label,
          typeof count === "number" && h4("span", { className: "tw-badge" }, String(count))
        )),
        h4("button", {
          type: "button",
          className: "tw-btn",
          disabled: busy,
          onClick: refresh
        }, "\u5237\u65B0")
      )
    ),
    h4(
      "main",
      { className: "tw-scroll" },
      h4(
        "div",
        { className: "tw-container", style: { marginBottom: errorMsg || toastMsg ? "0.85rem" : 0 } },
        errorMsg && h4(
          "div",
          { className: "tw-banner is-danger", role: "alert" },
          h4("span", null, errorMsg),
          h4("button", { type: "button", className: "tw-btn", onClick: () => setErrorMsg("") }, "\u77E5\u9053\u4E86")
        ),
        toastMsg && !errorMsg && h4(
          "div",
          { className: "tw-banner", role: "status" },
          h4("span", null, toastMsg),
          h4("button", { type: "button", className: "tw-btn", onClick: () => setToastMsg("") }, "\u6536\u8D77")
        )
      ),
      !view ? h4(
        "div",
        { className: "tw-container" },
        h4("div", { className: "tw-card" }, errorMsg ? "\u5206\u8EAB\u4E3B\u673A\u6682\u672A\u54CD\u5E94\uFF0C\u8BF7\u786E\u8BA4\u63D2\u4EF6\u5DF2\u542F\u7528\u5E76\u70B9\u51FB\u5237\u65B0\u3002" : "\u6B63\u5728\u8FDE\u63A5\u672C\u673A\u5206\u8EAB\u670D\u52A1\u4E0E\u72B6\u6001\u5E93...")
      ) : scene === "onboard" ? h4(OnboardScene, {
        view,
        projects,
        presets,
        busy,
        onAction: handleAction,
        onOpenInvite: () => setInviteOpen(true)
      }) : scene === "people" ? h4(PeopleScene, {
        view,
        busy,
        onAction: handleAction,
        onOpenInvite: () => setInviteOpen(true),
        onSelectPerson: (id) => setSelectedPersonId(id),
        onOpenPreview: (id) => {
          setPreviewPersonId(id);
          setPreviewOpen(true);
        }
      }) : scene === "caps" ? h4(CapsScene, {
        view,
        busy,
        onAction: handleAction,
        onOpenChannel: (ch) => setActiveChannel(ch),
        onConfirm: (spec) => setConfirmSpec(spec)
      }) : h4(DeskScene, {
        view,
        busy,
        onAction: handleAction,
        onEditDraft: (app) => setEditingApproval(app),
        onOpenPreview: (id) => {
          setPreviewPersonId(id || "");
          setPreviewOpen(true);
        },
        onOpenProfileEdit: () => setProfileOpen(true),
        onOpenInvite: () => setInviteOpen(true),
        onHandoffToOwner: handleHandoffToOwner
      })
    ),
    h4(EditDraftModal, {
      approval: editingApproval,
      busy,
      onClose: () => setEditingApproval(null),
      onSubmit: async (approvalId, customDraft) => {
        await handleAction("approve_draft", { approvalId, customDraft });
        setEditingApproval(null);
      },
      onSaveAsRule: async (approvalId, customDraft, ruleText) => {
        await handleAction("save_approval_as_rule", { approvalId, customDraft, ruleText, kind: "\u89C4\u77E9" });
        setEditingApproval(null);
      }
    }),
    h4(InvitePersonModal, {
      open: inviteOpen,
      view,
      busy,
      onClose: () => setInviteOpen(false),
      onCreated: (payload2) => handleAction("add_person", payload2)
    }),
    h4(CallerPreviewModal, {
      open: previewOpen,
      view,
      initialPersonId: previewPersonId,
      onClose: () => setPreviewOpen(false)
    }),
    h4(ProfileEditModal, {
      open: profileOpen,
      view,
      presets,
      busy,
      onClose: () => setProfileOpen(false),
      onSave: (args) => handleAction("update_profile", args)
    }),
    h4(PersonDrawer, {
      person: selectedPerson,
      view,
      busy,
      onClose: () => setSelectedPersonId(""),
      onAction: handleAction,
      onOpenPreview: (id) => {
        setPreviewPersonId(id);
        setPreviewOpen(true);
      },
      onConfirm: (spec) => setConfirmSpec(spec)
    }),
    h4(ChannelConfigModal, {
      channel: activeChannel,
      guide: activeChannel ? channelGuides[activeChannel.id] : null,
      busy,
      onClose: () => setActiveChannel(null),
      onAction: handleAction,
      onConfirm: (spec) => setConfirmSpec(spec)
    }),
    h4(ConfirmActionModal, {
      confirmSpec,
      busy,
      onClose: () => setConfirmSpec(null)
    })
  );
}
function apply(ctx) {
  function Workbench(props) {
    return h4(TwinWorkbenchRoot, { ...props, ctx });
  }
  if (typeof ctx.effect === "function" && ctx.slots && typeof ctx.slots.register === "function") {
    ctx.effect(() => ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL_ID }, Workbench)));
    ctx.effect(() => ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL_ID, label: "AI \u5206\u8EAB", order: 6 }, TwinNavIcon)));
    ctx.effect(() => ctx.slots.inject("plugins.row.config", () => ctx.slots.register(
      { name: "plugins.row.config", key: "agent-twin-starter" },
      (props) => props?.view === "summary" ? "1 \u4E2A\u4E3B\u5206\u8EAB + \u591A\u9879\u76EE\u53EA\u8BFB\u80FD\u529B\u5305 \xB7 \u4E94\u901A\u9053\u672C\u673A\u957F\u8FDE\u63A5\u4E0E\u7269\u7406\u9694\u79BB\u6C99\u7BB1" : h4("p", { style: { margin: 0 } }, "\u6240\u6709\u80FD\u529B\u63D0\u70BC\u3001\u4E94\u901A\u9053\u51ED\u636E\u4E0E\u503C\u73ED\u6743\u9650\u5747\u5728\u5DE6\u4FA7\u300CAI \u5206\u8EAB\u300D\u5DE5\u4F5C\u53F0\u914D\u7F6E\u4E0E\u7EF4\u62A4\u3002")
    )));
  }
}
var inject = ["slots"];

return module.exports;}});
