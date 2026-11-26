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
var import_react5 = __toESM(require("react"), 1);

// src-client/styles.js
var TWIN_STYLE_ID = "dsh-agent-twin-v4-styles";
var CLIENT_CSS = `
.tw-root,
dialog.tw-dlg,
.tw-tv-card {
  --bg: var(--dsw-alias-bg-base, #f6f5f0);
  --surface: var(--dsw-alias-bg-layer-1, #fffefb);
  --surface-subtle: var(--dsw-alias-bg-layer-2, #eeece5);
  --paper-inset: var(--dsw-alias-bg-layer-2, #eeece5);
  --ink: var(--dsw-alias-label-primary, #1b2228);
  --text: var(--ink);
  --text-secondary: var(--dsw-alias-label-secondary, #4f5963);
  --text-muted: var(--dsw-alias-label-tertiary, #767f87);
  --line: var(--dsw-alias-border-l4, rgba(27, 34, 40, 0.11));
  --line-strong: var(--dsw-alias-border-l3, rgba(27, 34, 40, 0.22));
  --accent: #245947;
  --accent-soft: rgba(36, 89, 71, 0.09);
  --accent-line: rgba(36, 89, 71, 0.28);
  --primary-btn: #1b2228;
  --primary-btn-hover: #2c3740;
  --primary-btn-text: #ffffff;
  --amber: #945512;
  --amber-soft: rgba(148, 85, 18, 0.1);
  --amber-line: rgba(148, 85, 18, 0.28);
  --danger: #a63429;
  --danger-soft: rgba(166, 52, 41, 0.1);
  --twin-bubble-bg: #edf3f0;
  --twin-bubble-border: #cfe0d8;
  --draft-bubble-bg: #fdfaf2;
  --draft-danger-bg: #fdf6f5;
  --shadow-card: 0 1px 2px rgba(27, 34, 40, 0.04), 0 6px 18px rgba(27, 34, 40, 0.025);
  --shadow-float: 0 12px 32px rgba(27, 34, 40, 0.14);
  --shadow-drawer: -0.75rem 0 2.5rem rgba(27, 34, 40, 0.13);
  --font-serif: 'Newsreader', 'Noto Serif SC', 'Songti SC', 'STSong', Georgia, serif;
  --font-sans: var(--dsw-font-family, 'Inter', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', sans-serif);
  --font-mono: ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  --radius-card: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.375rem;
  color-scheme: light dark;
  box-sizing: border-box;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--text);
  text-align: start;
  -webkit-font-smoothing: antialiased;
}

.tw-root[data-tw-scheme="dark"],
dialog.tw-dlg[data-tw-scheme="dark"],
.tw-tv-card[data-tw-scheme="dark"],
:is(.dark, [data-theme="dark"], [data-color-scheme="dark"]) .tw-root,
:is(.dark, [data-theme="dark"], [data-color-scheme="dark"]) dialog.tw-dlg,
:is(.dark, [data-theme="dark"], [data-color-scheme="dark"]) .tw-tv-card {
  --bg: var(--dsw-alias-bg-base, #14171c);
  --surface: var(--dsw-alias-bg-layer-1, #1c2027);
  --surface-subtle: var(--dsw-alias-bg-layer-2, #252a33);
  --paper-inset: var(--dsw-alias-bg-layer-2, #252a33);
  --ink: var(--dsw-alias-label-primary, #eceee9);
  --text: var(--ink);
  --text-secondary: var(--dsw-alias-label-secondary, #b2b8be);
  --text-muted: var(--dsw-alias-label-tertiary, #848d96);
  --line: var(--dsw-alias-border-l4, rgba(236, 238, 233, 0.11));
  --line-strong: var(--dsw-alias-border-l3, rgba(236, 238, 233, 0.22));
  --accent: #58b489;
  --accent-soft: rgba(88, 180, 137, 0.15);
  --accent-line: rgba(88, 180, 137, 0.34);
  --primary-btn: #eceee9;
  --primary-btn-hover: #ffffff;
  --primary-btn-text: #14171c;
  --amber: #e2a252;
  --amber-soft: rgba(226, 162, 82, 0.15);
  --amber-line: rgba(226, 162, 82, 0.34);
  --danger: #ea786c;
  --danger-soft: rgba(234, 120, 108, 0.16);
  --twin-bubble-bg: #1c2b26;
  --twin-bubble-border: #2c463d;
  --draft-bubble-bg: #262015;
  --draft-danger-bg: #2a1b1b;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.26), 0 8px 22px rgba(0, 0, 0, 0.16);
  --shadow-float: 0 14px 36px rgba(0, 0, 0, 0.45);
  --shadow-drawer: -0.75rem 0 2.5rem rgba(0, 0, 0, 0.45);
  color-scheme: dark;
}

.tw-root :where(*, *::before, *::after),
dialog.tw-dlg :where(*, *::before, *::after),
.tw-tv-card :where(*, *::before, *::after) {
  box-sizing: border-box;
}

.tw-root [hidden],
dialog.tw-dlg [hidden],
.tw-tv-card [hidden] {
  display: none !important;
}

.tw-root button,
.tw-root input,
.tw-root textarea,
.tw-root select,
dialog.tw-dlg button,
dialog.tw-dlg input,
dialog.tw-dlg textarea,
dialog.tw-dlg select,
.tw-tv-card :where(button, input, textarea, select) {
  font: inherit;
  color: inherit;
}

.tw-root button,
dialog.tw-dlg button,
.tw-tv-card :where(button) {
  cursor: pointer;
}

.tw-root button:focus-visible,
.tw-root input:focus-visible,
.tw-root textarea:focus-visible,
.tw-root select:focus-visible,
.tw-root summary:focus-visible,
dialog.tw-dlg button:focus-visible,
dialog.tw-dlg input:focus-visible,
dialog.tw-dlg textarea:focus-visible,
dialog.tw-dlg select:focus-visible,
dialog.tw-dlg summary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.tw-root h1,
.tw-root h2,
.tw-root h3,
dialog.tw-dlg h1,
dialog.tw-dlg h2,
dialog.tw-dlg h3 {
  text-wrap: balance;
}

.tw-root p,
.tw-root blockquote,
.tw-root li,
.tw-root .cap-desc,
.tw-root .person-sub,
.tw-root .person-ledger-meta,
.tw-root .person-note {
  text-wrap: pretty;
}

.tw-root {
  container-type: inline-size;
  container-name: tw;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--bg);
  color: var(--text);
}

/* Dot V2 editorial header bar (right padding clears DSH top-right floating gear icon) */
.tw-root .plugin-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  min-height: 3.375rem;
  padding: 0.625rem 3.5rem 0 1.75rem;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.tw-root .brand-title {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.625rem;
  min-width: 0;
  padding-bottom: 0.625rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
}

.tw-root .brand-mark {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: var(--radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
}

.tw-root .brand-edit-btn {
  padding: 0.1875rem 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tw-root .header-extract-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.1875rem 0.5625rem;
  border-radius: 999px;
  border: 1px solid var(--amber-line);
  background: var(--amber-soft);
  color: var(--amber);
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.tw-root .header-extract-pill:hover {
  border-color: var(--amber);
}

.tw-root .header-extract-pill.is-ready {
  border-color: var(--accent-line);
  background: var(--accent-soft);
  color: var(--accent);
}

.tw-root .header-extract-pill.is-ready:hover {
  border-color: var(--accent);
}

.tw-root .header-extract-pill-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .tw-root .header-extract-pill:not(.is-ready) .header-extract-pill-dot {
    animation: twPulseDot 1.6s ease-in-out infinite;
  }

  @keyframes twPulseDot {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }
}

.tw-root .header-tabs {
  display: flex;
  align-items: stretch;
  gap: 1.5rem;
  align-self: flex-end;
}

.tw-root .tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.625rem 0.125rem;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.15s ease, border-color 0.15s ease;
}

.tw-root .tab-btn:hover {
  color: var(--text);
}

.tw-root .tab-btn[aria-selected="true"] {
  color: var(--ink);
  border-bottom-color: var(--ink);
  font-weight: 600;
}

.tw-root .tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 1.15em;
  padding: 0.0625rem 0.375rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.25;
  font-weight: 600;
  background: var(--amber-soft);
  color: var(--amber);
}

.tw-root .duty-switch {
  display: inline-flex;
  align-items: center;
  margin-bottom: 0.625rem;
  padding: 0.1875rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-subtle);
  gap: 0.125rem;
  flex-shrink: 0;
}

.tw-root .duty-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3125rem;
  padding: 0.25rem 0.625rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.78125rem;
  font-weight: 500;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

.tw-root .duty-btn[aria-pressed="true"] {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 2px rgba(27, 34, 40, 0.08);
}

.tw-root .duty-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--text-muted);
  flex-shrink: 0;
}

.tw-root .duty-btn[data-duty="shadow"][aria-pressed="true"] .duty-dot {
  background: var(--amber);
}

.tw-root .duty-btn[data-duty="live"][aria-pressed="true"] .duty-dot {
  background: var(--accent);
}

/* Main scroll container */
.tw-root .tw-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  padding: 2.25rem 1.75rem 5.5rem;
}

.tw-root .tw-container {
  width: 100%;
  max-width: 56.25rem;
  margin: 0 auto;
}

.tw-root .tw-container--narrow {
  max-width: 41.25rem;
}

.tw-root .tw-container--desk {
  max-width: 68.5rem;
}

/* Restrained editorial buttons & inputs */
.tw-root .tw-btn,
dialog.tw-dlg .tw-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.4375rem 0.9375rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--text);
  font-size: 0.8125rem;
  font-weight: 500;
  line-height: 1.35;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.tw-root .tw-btn:hover:not(:disabled),
dialog.tw-dlg .tw-btn:hover:not(:disabled) {
  background: var(--surface-subtle);
}

.tw-root .tw-btn:disabled,
dialog.tw-dlg .tw-btn:disabled {
  opacity: 0.52;
  cursor: not-allowed;
}

.tw-root .tw-btn--primary,
dialog.tw-dlg .tw-btn--primary {
  background: var(--primary-btn);
  color: var(--primary-btn-text);
  border-color: transparent;
}

.tw-root .tw-btn--primary:hover:not(:disabled),
dialog.tw-dlg .tw-btn--primary:hover:not(:disabled) {
  background: var(--primary-btn-hover);
}

.tw-root .tw-btn--subtle,
dialog.tw-dlg .tw-btn--subtle {
  background: var(--surface-subtle);
  border-color: transparent;
  color: var(--text);
}

.tw-root .tw-btn--subtle:hover:not(:disabled),
dialog.tw-dlg .tw-btn--subtle:hover:not(:disabled) {
  border-color: var(--line);
}

.tw-root .tw-btn--ghost,
dialog.tw-dlg .tw-btn--ghost {
  background: transparent;
  border-color: transparent;
  color: var(--text-secondary);
  padding: 0.375rem 0.625rem;
}

.tw-root .tw-btn--ghost:hover:not(:disabled),
dialog.tw-dlg .tw-btn--ghost:hover:not(:disabled) {
  background: var(--surface-subtle);
  color: var(--text);
}

.tw-root .tw-btn--paper,
dialog.tw-dlg .tw-btn--paper {
  background: var(--surface);
  border-color: var(--line-strong);
  color: var(--text);
}

.tw-root .tw-btn--paper:hover:not(:disabled),
dialog.tw-dlg .tw-btn--paper:hover:not(:disabled) {
  background: var(--surface-subtle);
  border-color: var(--ink);
}

.tw-root .tw-btn--danger-ghost,
dialog.tw-dlg .tw-btn--danger-ghost {
  color: var(--danger);
}

.tw-root .tw-btn--danger-ghost:hover:not(:disabled),
dialog.tw-dlg .tw-btn--danger-ghost:hover:not(:disabled) {
  background: var(--danger-soft);
  color: var(--danger);
}

.tw-root .tw-btn--sm,
dialog.tw-dlg .tw-btn--sm {
  padding: 0.3125rem 0.75rem;
  font-size: 0.78125rem;
}

.tw-root .tw-input,
.tw-root .tw-select,
.tw-root .tw-textarea,
dialog.tw-dlg .tw-input,
dialog.tw-dlg .tw-select,
dialog.tw-dlg .tw-textarea {
  width: 100%;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text);
  padding: 0.5625rem 0.75rem;
  font-size: 0.84375rem;
  line-height: 1.5;
  transition: border-color 0.15s ease;
}

.tw-root .tw-input:focus,
.tw-root .tw-select:focus,
.tw-root .tw-textarea:focus,
dialog.tw-dlg .tw-input:focus,
dialog.tw-dlg .tw-select:focus,
dialog.tw-dlg .tw-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.tw-root .tw-textarea,
dialog.tw-dlg .tw-textarea {
  min-height: 4.875rem;
  resize: vertical;
}

.tw-root .visually-hidden,
dialog.tw-dlg .visually-hidden {
  position: absolute;
  clip-path: inset(50%);
  overflow: hidden;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  border: 0;
  white-space: nowrap;
}

.tw-root .card,
.tw-root .list-surface {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.tw-root .card {
  padding: 1.25rem 1.375rem;
}

.tw-root .tw-error-banner {
  margin-bottom: 1rem;
  padding: 0.6875rem 1rem;
  border-radius: var(--radius-md);
  background: var(--danger-soft);
  border: 1px solid rgba(166, 52, 41, 0.28);
  color: var(--danger);
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

/* Scene 0: Onboarding */
.tw-root .onboard-wrap {
  padding: 1.25rem 0 0.75rem;
}

.tw-root .eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.tw-root .serif-h1 {
  font-family: var(--font-serif);
  font-size: clamp(1.625rem, 1.25rem + 1.5vw, 2.125rem);
  font-weight: 600;
  line-height: 1.28;
  letter-spacing: -0.015em;
  margin: 0;
  color: var(--text);
}

.tw-root .page-lead {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  color: var(--text-secondary);
  max-width: 62ch;
}

.tw-root .onboard-card {
  margin-top: 1.5rem;
  padding: 1.5rem;
}

.tw-root .card-section + .card-section {
  margin-top: 1.375rem;
  padding-top: 1.375rem;
  border-top: 1px solid var(--line);
}

.tw-root .section-step-title {
  display: block;
  font-size: 0.90625rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.625rem;
}

.tw-root .project-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tw-root .project-name {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .project-summary {
  margin: 0.625rem 0 0;
  font-size: 0.84375rem;
  color: var(--text-secondary);
}

.tw-root .scope-details {
  margin-top: 0.625rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.tw-root .scope-details summary {
  cursor: pointer;
  color: var(--text-muted);
  font-size: 0.78125rem;
  user-select: none;
  width: fit-content;
}

.tw-root .scope-details summary:hover {
  color: var(--text);
}

.tw-root .scope-list {
  margin: 0.625rem 0 0;
  padding-left: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
}

.tw-root .onboard-actions {
  margin-top: 1.375rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tw-root .onboard-hint {
  font-size: 0.78125rem;
  color: var(--text-muted);
}

/* Native <progress> (separate vendor selectors) */
.tw-root .tw-progress {
  appearance: none;
  border: 0 solid;
  overflow: clip;
  inline-size: 100%;
  block-size: 0.375rem;
  border-radius: 1e5px;
  background: var(--line);
  display: block;
}

.tw-root .tw-progress--sm {
  inline-size: 7.5rem;
  block-size: 0.3125rem;
  flex-shrink: 0;
}

.tw-root .tw-progress::-webkit-progress-bar {
  background: transparent;
}

.tw-root .tw-progress::-webkit-progress-value {
  background: var(--accent);
  border-radius: 1e5px;
  transition: inline-size 0.28s ease;
}

.tw-root .tw-progress::-moz-progress-bar {
  background: var(--accent);
  border-radius: 1e5px;
  transition: inline-size 0.28s ease;
}

.tw-root .extract-pane {
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.tw-root .extract-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tw-root .extract-status-text {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .extract-step-meta {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.tw-root .extract-step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tw-root .extract-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.tw-root .extract-step-mark {
  width: 1.375rem;
  height: 1.375rem;
  border-radius: 50%;
  border: 1.5px solid var(--line-strong);
  background: var(--surface);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 0.0625rem;
}

.tw-root .extract-step[data-step-state="done"] .extract-step-mark {
  border-color: var(--accent);
  background: var(--accent);
  color: #ffffff;
}

.tw-root .extract-step[data-step-state="running"] .extract-step-mark {
  border-color: var(--amber);
  background: var(--amber-soft);
  color: var(--amber);
}

.tw-root .extract-step-body {
  min-width: 0;
  flex: 1;
}

.tw-root .extract-step-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
}

.tw-root .extract-step[data-step-state="pending"] .extract-step-title {
  color: var(--text-muted);
  font-weight: 500;
}

.tw-root .extract-step-desc {
  margin-top: 0.125rem;
  font-size: 0.78125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tw-root .extract-found-box {
  padding: 0.875rem 1rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tw-root .extract-found-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.78125rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .extract-found-sub {
  font-size: 0.78125rem;
  font-weight: 400;
  color: var(--text-secondary);
}

.tw-root .extract-found-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4375rem;
}

.tw-root .extract-cap-tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 0.78125rem;
  color: var(--text);
  font-weight: 500;
}

.tw-root .extract-draft-preview {
  margin-top: 0.25rem;
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--accent-line);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text);
}

/* Cold-Start Launchpad */
.tw-root .launchpad-stack {
  margin-top: 0.5rem;
}

.tw-root .launch-step {
  padding: 1.125rem 0;
  border-top: 1px solid var(--line);
}

.tw-root .launch-step:first-child {
  border-top: 2px solid var(--ink);
}

.tw-root .launch-step-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 0.625rem;
}

.tw-root .launch-step-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.5625rem;
}

.tw-root .launch-step-title {
  margin: 0;
  font-size: 0.96875rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .launch-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.6875rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  font-size: 0.8125rem;
  color: var(--text);
  line-height: 1.5;
}

.tw-root .launch-inline-form {
  margin-top: 0.625rem;
  padding: 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--line-strong);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tw-root .inline-persona-pills,
dialog.tw-dlg .inline-persona-pills {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tw-root .persona-mini-btn,
dialog.tw-dlg .persona-mini-btn {
  border: 1px solid var(--line-strong);
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 0.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.tw-root .persona-mini-btn:hover,
dialog.tw-dlg .persona-mini-btn:hover {
  border-color: var(--ink);
  color: var(--text);
}

.tw-root .persona-mini-btn.is-active,
dialog.tw-dlg .persona-mini-btn.is-active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
  font-weight: 600;
}

.tw-root .selftest-form {
  margin-top: 0.5625rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tw-root .selftest-result {
  margin-top: 0.6875rem;
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  font-size: 0.84375rem;
  line-height: 1.6;
  color: var(--text);
}

.tw-root .selftest-result-meta {
  margin-top: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-root .launch-muted-note,
dialog.tw-dlg .launch-muted-note {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.55;
  margin: 0;
}

.tw-root .launch-channel-list {
  margin-top: 0.625rem;
  border-top: 1px solid var(--line);
}

.tw-root .launch-channel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.625rem 0.125rem;
  border-bottom: 1px solid var(--line);
}

.tw-root .launch-channel-main {
  min-width: 0;
  flex: 1 1 14rem;
}

.tw-root .launch-channel-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.84375rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .launch-channel-meta {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.tw-root .invite-people-list {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tw-root .invite-person-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.625rem 0.8125rem;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--line);
}

.tw-root .invite-person-meta {
  min-width: 0;
  flex: 1 1 12rem;
  font-size: 0.8125rem;
  color: var(--text);
}

.tw-root .invite-person-sub {
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Scene 1: Live Desk (Asymmetric 2-col editorial board) */
.tw-root .hero-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.125rem;
}

.tw-root .desk-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2.25rem;
  align-items: start;
}

.tw-root .desk-main {
  min-width: 0;
}

.tw-root .desk-intro {
  margin-bottom: 1.25rem;
}

.tw-root .desk-rail {
  min-width: 0;
}

.tw-root .rail-section + .rail-section {
  margin-top: 2rem;
}

.tw-root .rail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1.5px solid var(--ink);
  margin-bottom: 0.75rem;
}

.tw-root .rail-head--sub {
  margin-bottom: 0.25rem;
}

.tw-root .rail-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
  padding: 0.6875rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  font-variant-numeric: tabular-nums;
}

.tw-root .rail-metric {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.tw-root .rail-metric + .rail-metric {
  padding-left: 0.375rem;
}

.tw-root .rail-metric-num {
  font-family: var(--font-serif);
  font-size: 1.3125rem;
  font-weight: 600;
  line-height: 1.2;
  color: var(--text);
}

.tw-root .rail-metric-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tw-root .rail-roster {
  display: flex;
  flex-direction: column;
  margin-top: 0.5rem;
  gap: 0.125rem;
}

.tw-root .rail-person-btn {
  width: 100%;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  padding: 0.4375rem 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  text-align: start;
  color: var(--text);
  font-size: 0.84375rem;
  transition: background 0.15s ease, color 0.15s ease;
}

.tw-root .rail-person-btn:hover {
  background: var(--surface);
}

.tw-root[data-tw-scheme="dark"] .rail-person-btn:hover,
:is(.dark, [data-theme="dark"], [data-color-scheme="dark"]) .tw-root .rail-person-btn:hover {
  background: var(--surface-subtle);
}

.tw-root .rail-person-left {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  font-weight: 500;
}

.tw-root .rail-person-tag {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.tw-root .rail-person-tag.is-pending {
  color: var(--amber);
  font-weight: 500;
}

.tw-root .pulse-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.tw-root .pulse-dot.is-pending {
  background: var(--amber);
}

.tw-root .rail-empty-note {
  padding: 0.75rem 0;
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--text-muted);
}

.tw-root .command-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.4375rem 0.4375rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-strong);
  background: var(--surface);
  box-shadow: var(--shadow-card);
  transition: border-color 0.15s ease;
}

.tw-root .command-form:focus-within {
  border-color: var(--accent);
}

.tw-root .command-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  padding: 0.375rem 0.25rem;
  font-size: 0.875rem;
  color: var(--text);
}

.tw-root .command-input:focus {
  outline: none;
}

.tw-root .quick-prompts {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin-top: 0.625rem;
}

.tw-root .quick-chips-group,
dialog.tw-dlg .quick-chips-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4375rem;
}

.tw-root .quick-sim-btn {
  border: 0;
  background: transparent;
  color: var(--text-secondary);
  padding: 0.21875rem 0.25rem;
  font-size: 0.75rem;
  line-height: 1.4;
  white-space: nowrap;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--line-strong);
  transition: color 0.15s ease;
}

.tw-root .quick-sim-btn:hover {
  color: var(--text);
}

.tw-root .quick-chip,
dialog.tw-dlg .quick-chip {
  border: 1px solid var(--line);
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(27, 34, 40, 0.03);
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 0.21875rem 0.5625rem;
  font-size: 0.75rem;
  line-height: 1.4;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.tw-root .quick-chip:hover,
dialog.tw-dlg .quick-chip:hover {
  background: var(--surface-subtle);
  color: var(--text);
  border-color: var(--line-strong);
}

.tw-root .undo-strip {
  margin-top: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8125rem;
}

.tw-root .section-block {
  margin-top: 2rem;
}

.tw-root .section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.875rem;
  padding-top: 0.75rem;
  border-top: 1.5px solid var(--ink);
  flex-wrap: wrap;
}

.tw-root .section-head--plain {
  border-top: 0;
  padding-top: 0;
}

.tw-root .section-head--desk {
  border-top-width: 2px;
  margin-bottom: 0;
}

.tw-root .section-title-wrap {
  display: inline-flex;
  align-items: baseline;
  gap: 0.625rem;
}

.tw-root .section-index {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.tw-root .section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .section-meta {
  font-size: 0.78125rem;
  color: var(--text-muted);
}

/* Open-air decision briefs */
.tw-root .brief-list {
  display: flex;
  flex-direction: column;
}

.tw-root .decision-brief {
  padding: 1.25rem 0;
}

.tw-root .decision-brief + .decision-brief {
  border-top: 1px solid var(--line);
}

.tw-root .brief-meta-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tw-root .brief-meta-left {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  color: var(--text-muted);
}

.tw-root .brief-idx {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.tw-root .brief-who-static {
  font-weight: 600;
  color: var(--text);
}

.tw-root .who-link {
  border: 0;
  background: transparent;
  padding: 0;
  font-weight: 600;
  color: var(--text);
  text-decoration: underline;
  text-decoration-color: var(--line-strong);
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
}

.tw-root .who-link:hover {
  color: var(--accent);
  text-decoration-color: var(--accent);
}

.tw-root .status-pill,
dialog.tw-dlg .status-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: 0.75rem;
  font-weight: 500;
  background: var(--amber-soft);
  color: var(--amber);
  white-space: nowrap;
}

.tw-root .status-pill--danger,
dialog.tw-dlg .status-pill--danger {
  background: var(--danger-soft);
  color: var(--danger);
}

.tw-root .status-pill--ok,
dialog.tw-dlg .status-pill--ok {
  background: var(--accent-soft);
  color: var(--accent);
}

.tw-root .status-pill--muted,
dialog.tw-dlg .status-pill--muted {
  background: var(--surface-subtle);
  color: var(--text-secondary);
  border-color: var(--line);
}

.tw-root .brief-headline {
  margin: 0.375rem 0 0.625rem;
  font-size: 1.0625rem;
  font-weight: 650;
  line-height: 1.38;
  letter-spacing: -0.012em;
  color: var(--text);
}

.tw-root .brief-gist {
  margin: 0;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  color: var(--text-secondary);
  font-size: 0.84375rem;
  line-height: 1.5;
  text-wrap: pretty;
}

.tw-root .brief-gist strong {
  color: var(--text);
  font-weight: 600;
  margin-right: 0.375rem;
}

.tw-root .brief-raw-box,
.tw-root .brief-edit-box {
  margin-top: 0.625rem;
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tw-root .brief-raw-row {
  font-size: 0.8125rem;
  line-height: 1.58;
  color: var(--text-secondary);
  text-wrap: pretty;
}

.tw-root .brief-raw-row strong {
  color: var(--text);
  font-weight: 600;
  margin-right: 0.375rem;
}

.tw-root .brief-actions {
  margin-top: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tw-root .brief-mobile-break {
  display: none;
}

.tw-root .brief-trace-link {
  margin-left: auto;
  font-size: 0.78125rem;
}

.tw-root .action-row,
dialog.tw-dlg .action-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-root .text-link-btn,
dialog.tw-dlg .text-link-btn {
  border: none;
  background: transparent;
  padding: 0.25rem 0.125rem;
  font-size: 0.78125rem;
  color: var(--text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--line-strong);
}

.tw-root .text-link-btn:hover,
dialog.tw-dlg .text-link-btn:hover {
  color: var(--text);
}

.tw-root .empty-brief {
  padding: 2rem 0;
  border-bottom: 1px solid var(--line);
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.tw-root .empty-brief strong {
  display: block;
  font-size: 0.9375rem;
  color: var(--text);
  margin-bottom: 0.25rem;
}

.tw-root .list-surface {
  overflow: hidden;
}

.tw-root .list-row {
  padding: 0.9375rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.875rem;
}

.tw-root .list-row + .list-row {
  border-top: 1px solid var(--line);
}

/* Right rail dot timeline */
.tw-root .rail-deliveries-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding-top: 0.375rem;
}

.tw-root .rail-delivery-row {
  padding: 0;
  border: 0;
  display: grid;
  grid-template-columns: 0.5rem minmax(0, 1fr);
  gap: 0 0.625rem;
  align-items: start;
}

.tw-root .rail-delivery-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  background: var(--accent);
  margin-top: 0.4375rem;
}

.tw-root .rail-delivery-dot.is-muted {
  background: var(--text-muted);
}

.tw-root .rail-delivery-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.tw-root .rail-delivery-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-root .rail-delivery-who {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3125rem;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  color: var(--text);
}

.tw-root .rail-delivery-time {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tw-root .rail-delivery-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tw-root .rail-delivery-summary {
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--text-secondary);
  text-wrap: pretty;
}

/* Scene 2: People */
.tw-root .overview-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1.5px solid var(--ink);
  border-bottom: 1px solid var(--line);
  margin-bottom: 1.25rem;
}

.tw-root .overview-cell {
  padding: 0.875rem 0.75rem 0.875rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}

.tw-root .overview-cell + .overview-cell {
  padding-left: 1rem;
  border-left: 1px solid var(--line);
}

.tw-root .overview-num {
  font-family: var(--font-serif);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
  color: var(--text);
}

.tw-root .overview-num.is-amber {
  color: var(--amber);
}

.tw-root .overview-label {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tw-root .filter-bar {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.tw-root .filter-pill {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.6875rem;
  font-size: 0.78125rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.tw-root .filter-pill[aria-pressed="true"] {
  background: var(--surface);
  color: var(--text);
  border-color: var(--ink);
}

.tw-root .person-row {
  padding: 1.125rem 1.25rem;
  display: grid;
  grid-template-columns: minmax(15.75rem, 1.3fr) minmax(14rem, 1.7fr) auto;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  transition: background 0.15s ease;
}

.tw-root .person-row:hover {
  background: var(--surface-subtle);
}

.tw-root .person-row + .person-row {
  border-top: 1px solid var(--line);
}

.tw-root .person-row.is-paused {
  opacity: 0.76;
}

.tw-root .person-identity {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-width: 0;
}

.tw-root .avatar,
dialog.tw-dlg .avatar {
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: 0 0.375rem;
  aspect-ratio: 1;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  font-weight: 600;
  background: var(--surface-subtle);
  color: var(--text);
  flex-shrink: 0;
}

.tw-root .avatar[data-avatar-tone="amber"],
dialog.tw-dlg .avatar[data-avatar-tone="amber"] {
  background: rgba(148, 85, 18, 0.14);
  color: #874b0d;
}

.tw-root .avatar[data-avatar-tone="terra"],
dialog.tw-dlg .avatar[data-avatar-tone="terra"] {
  background: rgba(166, 52, 41, 0.13);
  color: #932e24;
}

.tw-root .avatar[data-avatar-tone="sage"],
dialog.tw-dlg .avatar[data-avatar-tone="sage"] {
  background: rgba(36, 89, 71, 0.14);
  color: #205241;
}

.tw-root .avatar[data-avatar-tone="slate"],
dialog.tw-dlg .avatar[data-avatar-tone="slate"] {
  background: rgba(79, 89, 99, 0.14);
  color: #46505a;
}

.tw-root[data-tw-scheme="dark"] .avatar[data-avatar-tone="amber"],
dialog.tw-dlg[data-tw-scheme="dark"] .avatar[data-avatar-tone="amber"] {
  background: rgba(226, 162, 82, 0.2);
  color: #f0ba73;
}

.tw-root[data-tw-scheme="dark"] .avatar[data-avatar-tone="terra"],
dialog.tw-dlg[data-tw-scheme="dark"] .avatar[data-avatar-tone="terra"] {
  background: rgba(234, 120, 108, 0.2);
  color: #f39a90;
}

.tw-root[data-tw-scheme="dark"] .avatar[data-avatar-tone="sage"],
dialog.tw-dlg[data-tw-scheme="dark"] .avatar[data-avatar-tone="sage"] {
  background: rgba(88, 180, 137, 0.2);
  color: #7cd4aa;
}

.tw-root[data-tw-scheme="dark"] .avatar[data-avatar-tone="slate"],
dialog.tw-dlg[data-tw-scheme="dark"] .avatar[data-avatar-tone="slate"] {
  background: rgba(178, 184, 190, 0.18);
  color: #c9cfd4;
}

.tw-root .person-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-root .person-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .person-sub {
  font-size: 0.78125rem;
  color: var(--text-muted);
  margin-top: 0.125rem;
}

.tw-root .person-ledger {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}

.tw-root .person-ledger-meta {
  font-size: 0.8125rem;
  color: var(--text);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.tw-root .person-last-q {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tw-root .person-note {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.tw-root .person-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.tw-root .expiry-text {
  font-size: 0.75rem;
  color: var(--text-muted);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.tw-root .expiry-text.is-soon {
  color: var(--amber);
  font-weight: 500;
}

/* Switch track control */
.tw-root .switch,
dialog.tw-dlg .switch {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}

.tw-root .switch input,
dialog.tw-dlg .switch input {
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  margin: 0;
}

.tw-root .switch-track,
dialog.tw-dlg .switch-track {
  width: 2.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: var(--line-strong);
  position: relative;
  transition: background 0.18s ease;
}

.tw-root .switch-track::after,
dialog.tw-dlg .switch-track::after {
  content: "";
  position: absolute;
  top: 0.125rem;
  left: 0.125rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.22);
  transition: transform 0.18s ease;
}

.tw-root .switch input:checked + .switch-track,
dialog.tw-dlg .switch input:checked + .switch-track {
  background: var(--accent);
}

.tw-root .switch input:checked + .switch-track::after,
dialog.tw-dlg .switch input:checked + .switch-track::after {
  transform: translateX(1rem);
}

.tw-root .switch input:focus-visible + .switch-track,
dialog.tw-dlg .switch input:focus-visible + .switch-track {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Scene 3: Capabilities & Channels */
.tw-root .extract-live-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.875rem;
  flex-wrap: wrap;
  padding: 0.6875rem 1rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  border: 1px solid var(--line);
  margin-bottom: 1.25rem;
}

.tw-root .extract-live-banner.is-ready {
  background: var(--accent-soft);
  border-color: var(--accent-line);
}

.tw-root .extract-live-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1 1 20rem;
  flex-wrap: wrap;
}

.tw-root .extract-live-copy {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-root .extract-live-title {
  font-size: 0.84375rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .extract-live-sub {
  font-size: 0.78125rem;
  color: var(--text-secondary);
}

.tw-root .extract-live-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.tw-root .caps-undo-strip {
  margin-bottom: 0.875rem;
  padding: 0.5625rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.8125rem;
  color: var(--text);
}

.tw-root .source-project-row {
  padding: 0.9375rem 1.125rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.tw-root .source-project-row + .source-project-row {
  border-top: 1px solid var(--line);
}

.tw-root .source-project-main {
  min-width: 0;
  flex: 1 1 22rem;
}

.tw-root .source-project-title-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-root .source-project-name {
  font-size: 0.90625rem;
  font-weight: 600;
  color: var(--text);
}

.tw-root .source-project-desc {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tw-root .source-project-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.tw-root .cap-source-tag {
  display: inline-block;
  margin-bottom: 0.3125rem;
  font-size: 0.71875rem;
  font-weight: 500;
  color: var(--text-muted);
}

.tw-root .grid-3 {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.875rem;
}

.tw-root .grid-3 > .card {
  display: flex;
  flex-direction: column;
}

.tw-root .cap-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.625rem;
}

.tw-root .cap-card-title {
  margin: 0;
  font-size: 0.90625rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1.4;
}

.tw-root .cap-desc {
  margin: 0.625rem 0 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.55;
  flex: 1;
}

.tw-root .cap-meta {
  margin-top: 0.75rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--line);
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  gap: 0.1875rem;
}

.tw-root .cap-foot-actions {
  margin-top: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-root .rule-row {
  padding: 0.8125rem 1.125rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-size: 0.84375rem;
}

.tw-root .rule-row + .rule-row {
  border-top: 1px solid var(--line);
}

.tw-root .rule-num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  color: var(--text-muted);
  padding-top: 0.125rem;
  flex-shrink: 0;
}

.tw-root .rule-kind {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.0625rem 0.4375rem;
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
  color: var(--text-secondary);
  margin-top: 0.0625rem;
}

.tw-root .rule-kind--redline {
  background: var(--danger-soft);
  color: var(--danger);
}

.tw-root .rule-row-main {
  flex: 1;
  min-width: 12rem;
}

.tw-root .rule-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.tw-root .rule-edit-inline {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 12rem;
}

.tw-root .inline-add-row,
dialog.tw-dlg .inline-add-row {
  padding: 0.75rem 1.125rem;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
  background: var(--surface);
}

/* Native <dialog> & Top-Layer Animations (following modern-web-guidance) */
dialog.tw-dlg {
  margin: auto;
  padding: 0;
  width: min(35rem, calc(100vw - 1.5rem));
  max-width: calc(100vw - 1.5rem);
  max-height: calc(100dvh - 2rem);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-card);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow-float);
  overflow: hidden;
  opacity: 0;
  transition-property: opacity, transform, display, overlay;
  transition-duration: 0.18s;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  transition-behavior: allow-discrete;
}

dialog.tw-dlg:modal {
  overscroll-behavior: contain;
}

dialog.tw-dlg[open] {
  display: flex;
  flex-direction: column;
}

dialog.tw-dlg::backdrop {
  background-color: rgba(17, 21, 26, 0);
  backdrop-filter: blur(2px);
  overflow: hidden;
  overscroll-behavior: contain;
  transition-property: background-color, display, overlay;
  transition-duration: 0.18s;
  transition-timing-function: ease-out;
  transition-behavior: allow-discrete;
}

dialog.tw-dlg.drawer-dialog {
  margin: 0 0 0 auto;
  inset: 0 0 0 auto;
  width: min(36rem, 100vw);
  inline-size: min(36rem, 100vw);
  max-width: 100vw;
  max-inline-size: 100vw;
  height: 100dvh;
  block-size: 100dvh;
  max-height: 100dvh;
  max-block-size: 100dvh;
  border-radius: 0;
  border: 0;
  border-left: 1px solid var(--line-strong);
  box-shadow: var(--shadow-drawer);
}

@media (prefers-reduced-motion: no-preference) {
  dialog.tw-dlg:not(.drawer-dialog) {
    transform: translateY(0.5rem);
  }

  dialog.tw-dlg.drawer-dialog {
    transform: translateX(100%);
  }
}

:is(dialog.tw-dlg[open]):where(:not([data-closing])) {
  opacity: 1;

  @starting-style {
    opacity: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    transform: translateY(0);

    @starting-style {
      transform: translateY(0.5rem);
    }
  }

  &::backdrop {
    background-color: rgba(17, 21, 26, 0.38);

    @starting-style {
      background-color: rgba(17, 21, 26, 0);
    }
  }
}

:is(dialog.tw-dlg.drawer-dialog[open]):where(:not([data-closing])) {
  @media (prefers-reduced-motion: no-preference) {
    transform: translateX(0);

    @starting-style {
      transform: translateX(100%);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  dialog.tw-dlg,
  dialog.tw-dlg::backdrop {
    transition-duration: 0.08s;
  }
}

dialog.tw-dlg .dlg-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.375rem;
  border-bottom: 1px solid var(--line);
}

dialog.tw-dlg .dlg-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

dialog.tw-dlg .dlg-close {
  border: none;
  background: transparent;
  color: var(--text-muted);
  min-width: 1.875rem;
  min-height: 1.875rem;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

dialog.tw-dlg .dlg-close:hover {
  background: var(--surface-subtle);
  color: var(--text);
}

dialog.tw-dlg .dlg-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 1.125rem 1.375rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

dialog.tw-dlg .dlg-foot {
  flex-shrink: 0;
  padding: 0.875rem 1.375rem;
  border-top: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Drawer inner UI */
dialog.tw-dlg .drawer-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6875rem 1.25rem;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

dialog.tw-dlg .drawer-who {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  min-width: 0;
  flex: 1;
}

dialog.tw-dlg .drawer-who-text {
  min-width: 0;
}

dialog.tw-dlg .drawer-name {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.1875rem;
  font-weight: 600;
  line-height: 1.25;
  color: var(--text);
}

dialog.tw-dlg .drawer-sub {
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--text-muted);
  margin-top: 0.0625rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

dialog.tw-dlg .drawer-head-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

dialog.tw-dlg .seg-group {
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-subtle);
  gap: 0.125rem;
  flex-shrink: 0;
}

dialog.tw-dlg .seg-btn {
  padding: 0.25rem 0.5625rem;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}

dialog.tw-dlg .seg-btn:hover {
  color: var(--text);
}

dialog.tw-dlg .seg-btn[aria-pressed="true"] {
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(27, 34, 40, 0.08);
}

dialog.tw-dlg .drawer-chat {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--bg);
  padding: 0.9375rem 1.25rem 1.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

dialog.tw-dlg .chat-exchange {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

dialog.tw-dlg .chat-time-sep {
  align-self: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
  padding: 0.0625rem 0.5rem;
}

dialog.tw-dlg .chat-sys-note {
  align-self: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background: var(--surface-subtle);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 0.1875rem 0.75rem;
  text-align: center;
  text-wrap: pretty;
}

dialog.tw-dlg .msg-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 85%;
}

dialog.tw-dlg .msg-row--caller {
  align-self: flex-start;
  align-items: flex-start;
}

dialog.tw-dlg .msg-row--twin {
  align-self: flex-end;
  align-items: flex-end;
}

dialog.tw-dlg .msg-row--draft {
  width: 100%;
  max-width: 88%;
}

dialog.tw-dlg .msg-bubble {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
  line-height: 1.56;
  color: var(--text);
  text-wrap: pretty;
  word-break: break-word;
}

dialog.tw-dlg .msg-bubble--caller {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 0.25rem 0.75rem 0.75rem 0.75rem;
}

dialog.tw-dlg .msg-bubble--twin {
  background: var(--twin-bubble-bg);
  border: 1px solid var(--twin-bubble-border);
  border-radius: 0.75rem 0.25rem 0.75rem 0.75rem;
}

dialog.tw-dlg .msg-foot {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 0 0.125rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

dialog.tw-dlg .msg-trace-btn {
  border: 0;
  background: none;
  padding: 0;
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-decoration: underline;
  text-underline-offset: 0.18em;
  text-decoration-color: var(--line-strong);
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
}

dialog.tw-dlg .msg-trace-btn:hover {
  color: var(--ink);
  text-decoration-color: var(--ink);
}

dialog.tw-dlg .msg-bubble--draft {
  background: var(--draft-bubble-bg);
  border: 1.5px dashed var(--amber);
  border-radius: 0.75rem 0.25rem 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5625rem;
  width: 100%;
}

dialog.tw-dlg .msg-bubble--draft[data-tone="danger"] {
  background: var(--draft-danger-bg);
  border-color: var(--danger);
}

dialog.tw-dlg .draft-kicker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--amber);
  flex-wrap: wrap;
}

dialog.tw-dlg .msg-bubble--draft[data-tone="danger"] .draft-kicker {
  color: var(--danger);
}

dialog.tw-dlg .draft-sync-note {
  font-weight: 400;
  color: var(--text-muted);
}

dialog.tw-dlg .drawer-meta {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--surface);
  padding: 1.25rem 1.375rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.375rem;
}

dialog.tw-dlg .meta-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

dialog.tw-dlg .meta-section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1.5px solid var(--ink);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text);
}

dialog.tw-dlg .meta-section-idx {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-right: 0.375rem;
}

dialog.tw-dlg .meta-kv-list {
  display: flex;
  flex-direction: column;
}

dialog.tw-dlg .meta-kv-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5625rem 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.8125rem;
}

dialog.tw-dlg .meta-kv-row--center {
  align-items: center;
}

dialog.tw-dlg .meta-kv-row:last-child {
  border-bottom: 0;
}

dialog.tw-dlg .meta-kv-label {
  color: var(--text-muted);
  flex-shrink: 0;
}

dialog.tw-dlg .meta-kv-val {
  color: var(--text);
  text-align: right;
  text-wrap: pretty;
  font-variant-numeric: tabular-nums;
}

dialog.tw-dlg .meta-note-current {
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  font-size: 0.8125rem;
  color: var(--text);
  text-wrap: pretty;
}

dialog.tw-dlg .drawer-note-form {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

dialog.tw-dlg .meta-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-wrap: pretty;
}

dialog.tw-dlg .field-group,
.tw-root .field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

dialog.tw-dlg .field-label,
.tw-root .field-label {
  font-size: 0.78125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

dialog.tw-dlg .field-row-2,
.tw-root .field-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

dialog.tw-dlg .radio-stack,
dialog.tw-dlg .check-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

dialog.tw-dlg .choice-row {
  display: flex;
  align-items: flex-start;
  gap: 0.5625rem;
  font-size: 0.84375rem;
  cursor: pointer;
}

dialog.tw-dlg .choice-row input {
  margin-top: 0.1875rem;
  accent-color: var(--accent);
}

dialog.tw-dlg .field-hint-box {
  padding: 0.5625rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface-subtle);
  font-size: 0.78125rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

dialog.tw-dlg .field-warn-box {
  padding: 0.6875rem 0.8125rem;
  border-radius: var(--radius-md);
  background: var(--amber-soft);
  border: 1px solid var(--amber-line);
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
}

dialog.tw-dlg .invite-summary-strip {
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  font-size: 0.8125rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

dialog.tw-dlg .invite-summary-strip strong {
  color: var(--text);
}

dialog.tw-dlg .copy-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

dialog.tw-dlg .copy-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
}

dialog.tw-dlg .copy-tip {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--accent);
  white-space: nowrap;
}

dialog.tw-dlg .invite-qr-box {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  border: 1px solid var(--line);
}

dialog.tw-dlg .invite-qr-svg {
  width: 9rem;
  height: 9rem;
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  background: #ffffff;
  border: 1px solid var(--line);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

dialog.tw-dlg .invite-qr-svg svg {
  width: 100%;
  height: 100%;
  display: block;
}

dialog.tw-dlg .invite-qr-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

dialog.tw-dlg .invite-pair-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  border: 1px solid var(--line);
}

dialog.tw-dlg .invite-pair-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

dialog.tw-dlg .invite-pair-code {
  margin-top: 0.1875rem;
  font-family: var(--font-mono);
  font-size: 1.1875rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

dialog.tw-dlg .invite-bot-guide {
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 0.78125rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

dialog.tw-dlg .cfg-guide-box {
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  font-size: 0.8125rem;
  color: var(--text);
  line-height: 1.55;
}

dialog.tw-dlg .cfg-steps-ol {
  margin: 0.375rem 0 0;
  padding-left: 1.125rem;
  color: var(--text-secondary);
  font-size: 0.78125rem;
  line-height: 1.55;
}

dialog.tw-dlg .delta-intro {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.58;
}

dialog.tw-dlg .delta-diff-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

dialog.tw-dlg .delta-diff-item {
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

dialog.tw-dlg .delta-diff-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  font-size: 0.84375rem;
  font-weight: 600;
  color: var(--text);
}

dialog.tw-dlg .delta-diff-kind {
  font-size: 0.71875rem;
  font-weight: 600;
  padding: 0.0625rem 0.4375rem;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent);
}

dialog.tw-dlg .delta-diff-kind.is-safe {
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text-secondary);
}

dialog.tw-dlg .delta-diff-desc {
  font-size: 0.78125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

dialog.tw-dlg .caller-preview-card {
  padding: 1rem 1.125rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--line-strong);
  background: var(--paper-inset);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

dialog.tw-dlg .caller-preview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid var(--line);
}

dialog.tw-dlg .caller-preview-name {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--text);
}

dialog.tw-dlg .caller-preview-intro {
  margin: 0.25rem 0 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

dialog.tw-dlg .caller-preview-caps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

dialog.tw-dlg .caller-preview-cap-tag {
  padding: 0.1875rem 0.5rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 0.75rem;
  color: var(--text-secondary);
}

dialog.tw-dlg .caller-preview-paused {
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-sm);
  background: var(--amber-soft);
  border: 1px solid var(--amber-line);
  font-size: 0.8125rem;
  color: var(--text);
  line-height: 1.5;
}

dialog.tw-dlg .caller-preview-reply {
  padding: 0.75rem 0.875rem;
  border-radius: var(--radius-sm);
  background: var(--surface);
  border: 1px solid var(--line);
  font-size: 0.8125rem;
  color: var(--text);
  line-height: 1.55;
}

dialog.tw-dlg .trace-steps {
  margin: 0;
  padding-left: 1.125rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  font-size: 0.84375rem;
  color: var(--text);
}

dialog.tw-dlg .trace-steps span {
  display: block;
  font-size: 0.78125rem;
  color: var(--text-secondary);
  margin-top: 0.125rem;
}

dialog.tw-dlg .tech-details {
  margin-top: 0.375rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--line);
  font-size: 0.78125rem;
  color: var(--text-secondary);
}

dialog.tw-dlg .tech-details summary {
  cursor: pointer;
  color: var(--text-muted);
  user-select: none;
}

dialog.tw-dlg .tech-details p {
  margin: 0.5rem 0 0;
  line-height: 1.6;
}

/* Floating bottom Toast */
.tw-root .tw-toast {
  position: absolute;
  left: 50%;
  bottom: 1.25rem;
  transform: translateX(-50%);
  max-width: calc(100% - 2rem);
  padding: 0.5625rem 1rem;
  border-radius: var(--radius-md);
  background: var(--primary-btn);
  color: var(--primary-btn-text);
  font-size: 0.8125rem;
  box-shadow: var(--shadow-float);
  z-index: 40;
  pointer-events: none;
}

/* Container-query responsive layout + safe fallback */
@media (min-width: 56rem) {
  .tw-root .desk-grid {
    grid-template-columns: minmax(0, 1.68fr) minmax(17.5rem, 0.92fr);
    gap: 0 3.25rem;
  }
}

@supports (container-type: inline-size) {
  @media (min-width: 56rem) {
    .tw-root .desk-grid {
      grid-template-columns: minmax(0, 1fr);
      gap: 2.25rem;
    }
  }

  @container tw (min-width: 56rem) {
    .tw-root .desk-grid {
      grid-template-columns: minmax(0, 1.68fr) minmax(17.5rem, 0.92fr);
      gap: 0 3.25rem;
    }
  }

  @container tw (max-width: 46.25rem) {
    .tw-root .plugin-header {
      flex-wrap: wrap;
      padding: 0.625rem 3.5rem 0 1rem;
      gap: 0.625rem;
    }

    .tw-root .brand-title {
      padding-bottom: 0;
    }

    .tw-root .duty-switch {
      margin-bottom: 0;
    }

    .tw-root .header-tabs {
      order: 3;
      width: 100%;
      justify-content: flex-start;
      overflow-x: auto;
      gap: 1.25rem;
    }

    .tw-root .overview-strip {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .tw-root .overview-cell:nth-child(3) {
      padding-left: 0;
      border-left: 0;
      border-top: 1px solid var(--line);
    }

    .tw-root .overview-cell:nth-child(4) {
      border-top: 1px solid var(--line);
    }

    .tw-root .grid-3 {
      grid-template-columns: 1fr;
    }

    .tw-root .person-row {
      grid-template-columns: 1fr;
      gap: 0.625rem;
      align-items: flex-start;
    }

    .tw-root .person-controls {
      width: 100%;
      justify-content: flex-start;
      flex-wrap: wrap;
    }
  }

  @container tw (max-width: 35rem) {
    .tw-root .tw-scroll {
      padding: 1.25rem 0.875rem 4.5rem;
    }

    .tw-root .card,
    .tw-root .onboard-card {
      padding: 1rem;
    }

    .tw-root .list-row {
      flex-direction: column;
      align-items: flex-start;
      padding: 0.875rem 1rem;
    }

    .tw-root .field-row-2,
    dialog.tw-dlg .field-row-2 {
      grid-template-columns: 1fr;
    }

    .tw-root .command-form {
      padding: 0.25rem 0.25rem 0.25rem 0.75rem;
    }

    .tw-root .brief-actions {
      justify-content: flex-start;
      gap: 0.5rem 0.375rem;
    }

    .tw-root .brief-actions .action-row {
      display: contents;
    }

    .tw-root .brief-mobile-break {
      display: block;
      flex-basis: 100%;
      height: 0;
    }

    .tw-root .extract-live-banner,
    .tw-root .source-project-row {
      flex-direction: column;
      align-items: flex-start;
    }

    .tw-root .extract-live-left,
    .tw-root .source-project-main {
      flex-basis: auto;
      width: 100%;
    }

    .tw-root .selftest-form,
    dialog.tw-dlg .copy-row {
      flex-direction: column;
      align-items: stretch;
    }

    .tw-root .launch-summary-bar,
    .tw-root .invite-person-item,
    .tw-root .launch-channel-row,
    dialog.tw-dlg .invite-qr-box,
    dialog.tw-dlg .invite-pair-box {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}

@media (max-width: 40rem) {
  dialog.tw-dlg .drawer-head,
  dialog.tw-dlg .drawer-chat,
  dialog.tw-dlg .drawer-meta {
    padding-inline: 1rem;
  }

  dialog.tw-dlg .msg-row {
    max-width: 90%;
  }
}

dialog.tw-dlg .official-conn-box {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.875rem 1rem;
  border-radius: var(--radius-card);
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
}

dialog.tw-dlg .official-conn-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.625rem;
  flex-wrap: wrap;
}

dialog.tw-dlg .official-conn-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
}

dialog.tw-dlg .official-conn-status {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.tw-tv-card {
  container-type: inline-size;
  container-name: twtv;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: hidden;
  margin: 0.375rem 0;
  padding: 0.9375rem 1.0625rem;
  border-radius: 0.75rem;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-family: var(--font-sans);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.6875rem;
}

.tw-tv-card > * {
  min-width: 0;
  max-width: 100%;
}

.tw-tv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.tw-tv-title-group {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}

.tw-tv-summary,
.tw-tv-approval-title,
.tw-tv-quote-text {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.tw-tv-kicker {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--accent);
}

.tw-tv-title {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--ink);
}

.tw-tv-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem 0.5625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--line);
}

.tw-tv-pill--ok {
  background: var(--accent-soft);
  border-color: var(--accent-line);
  color: var(--accent);
}

.tw-tv-pill--amber {
  background: var(--amber-soft);
  border-color: var(--amber-line);
  color: var(--amber);
}

.tw-tv-pill--danger {
  background: var(--danger-soft);
  border-color: rgba(166, 52, 41, 0.32);
  color: var(--danger);
}

.tw-tv-pill--muted {
  background: var(--surface-subtle);
  color: var(--text-muted);
}

.tw-tv-body {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.tw-tv-summary {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ink);
  font-weight: 500;
}

.tw-tv-muted {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.tw-tv-error {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--danger);
  font-weight: 500;
}

.tw-tv-meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4375rem;
}

.tw-tv-chip {
  font-size: 0.75rem;
  padding: 0.2rem 0.5625rem;
  border-radius: 0.4375rem;
  background: var(--paper-inset);
  border: 1px solid var(--line);
  color: var(--text-secondary);
}

.tw-tv-chip--accent {
  background: var(--accent-soft);
  border-color: var(--accent-line);
  color: var(--accent);
  font-weight: 600;
}

.tw-tv-cap-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 0.5rem;
}

.tw-tv-cap-item {
  min-width: 0;
  padding: 0.5625rem 0.6875rem;
  border-radius: 0.5rem;
  background: var(--bg);
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}

.tw-tv-cap-item strong {
  color: var(--ink);
  font-size: 0.8125rem;
}

.tw-tv-cap-item span {
  color: var(--text-secondary);
  line-height: 1.45;
}

.tw-tv-code-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.625rem;
  flex-wrap: wrap;
  padding: 0.5rem 0.6875rem;
  border-radius: 0.5rem;
  background: var(--paper-inset);
  border: 1px solid var(--line);
}

.tw-tv-code-val {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--ink);
  word-break: break-all;
}

.tw-tv-approval-list {
  display: flex;
  flex-direction: column;
  gap: 0.6875rem;
}

.tw-tv-approval {
  padding: 0.8125rem 0.875rem;
  border-radius: 0.625rem;
  background: var(--draft-bubble-bg);
  border: 1px solid var(--amber-line);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tw-tv-approval--danger {
  background: var(--draft-danger-bg);
  border-color: rgba(166, 52, 41, 0.34);
}

.tw-tv-approval-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-tv-approval-who {
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.tw-tv-approval-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--ink);
}

.tw-tv-quote {
  padding: 0.5rem 0.6875rem;
  border-radius: 0.4375rem;
  background: var(--surface);
  border: 1px solid var(--line);
}

.tw-tv-quote-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.1875rem;
}

.tw-tv-quote-text {
  font-size: 0.8125rem;
  color: var(--ink);
  line-height: 1.5;
  white-space: pre-wrap;
}

.tw-tv-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.tw-tv-textarea {
  width: 100%;
  padding: 0.5625rem 0.6875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--line-strong);
  background: var(--surface);
  color: var(--ink);
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
}

@container twtv (max-width: 28rem) {
  .tw-tv-card {
    padding: 0.8125rem;
  }

  .tw-tv-cap-list {
    grid-template-columns: minmax(0, 1fr);
  }

  .tw-tv-code-box {
    flex-direction: column;
    align-items: stretch;
  }
}

.tw-tv-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tw-tv-btn {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid transparent;
  transition: background 140ms ease, opacity 140ms ease;
}

.tw-tv-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.tw-tv-btn--primary {
  background: var(--primary-btn);
  color: var(--primary-btn-text);
}

.tw-tv-btn--subtle {
  background: var(--surface);
  border-color: var(--line-strong);
  color: var(--ink);
}

.tw-tv-btn--ghost {
  background: transparent;
  color: var(--text-muted);
}

.tw-tv-receipt {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: var(--accent-soft);
  border: 1px solid var(--accent-line);
  color: var(--accent);
  font-size: 0.8125rem;
  font-weight: 600;
}

.tw-tv-tip {
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 500;
}

.tw-root .public-lobby-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 12rem;
  gap: 1.125rem;
  align-items: start;
}

.tw-root .public-lobby-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.tw-root .public-lobby-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.75rem;
}

.tw-root .public-lobby-field {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  min-width: 0;
}

.tw-root .public-lobby-label {
  font-size: 0.78125rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.tw-root .public-lobby-caps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4375rem;
}

.tw-root .public-cap-check {
  display: inline-flex;
  align-items: center;
  gap: 0.4375rem;
  padding: 0.375rem 0.625rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--line-strong);
  background: var(--surface-subtle);
  font-size: 0.8125rem;
  color: var(--text);
  cursor: pointer;
}

.tw-root .public-cap-check.is-selected {
  background: var(--accent-soft);
  border-color: var(--accent-line);
  color: var(--accent);
  font-weight: 600;
}

.tw-root .public-cap-proj {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 400;
}

.tw-root .public-lobby-qr-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5625rem;
  padding: 0.875rem;
  border-radius: var(--radius-md);
  background: var(--surface-subtle);
  border: 1px solid var(--line);
}

.tw-root .public-lobby-qr-box {
  width: 9.5rem;
  height: 9.5rem;
  padding: 0.4375rem;
  border-radius: var(--radius-sm);
  background: #ffffff;
  border: 1px solid var(--line);
  display: flex;
  align-items: center;
  justify-content: center;
}

.tw-root .public-lobby-qr-box img,
.tw-root .public-lobby-qr-box svg {
  width: 100%;
  height: 100%;
  display: block;
}

@container tw (max-width: 44rem) {
  .tw-root .public-lobby-grid,
  .tw-root .public-lobby-row {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;
function ensureTwinStyles() {
  if (typeof document === "undefined") return;
  let el = document.getElementById(TWIN_STYLE_ID);
  if (!el) {
    el = document.createElement("style");
    el.id = TWIN_STYLE_ID;
    document.head.appendChild(el);
  }
  if (el.textContent !== CLIENT_CSS) {
    el.textContent = CLIENT_CSS;
  }
}

// src-client/api.js
var import_react = __toESM(require("react"), 1);
var h = import_react.default.createElement;
var supportsDisplayTransitionCache;
function canTransitionDisplay() {
  if (supportsDisplayTransitionCache !== void 0) return supportsDisplayTransitionCache;
  if (typeof window === "undefined" || !window.CSS?.supports?.("transition-behavior", "allow-discrete") || !document.body) {
    return false;
  }
  const probe = document.createElement("div");
  probe.style.cssText = "transition: display 1s allow-discrete !important; display: block;";
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = "none";
  supportsDisplayTransitionCache = getComputedStyle(probe).display === "block";
  probe.remove();
  return supportsDisplayTransitionCache;
}
function supportsTopLayerExit() {
  return typeof window !== "undefined" && Boolean(window.CSS?.supports?.("overlay", "auto") && canTransitionDisplay());
}
async function closeTopLayer(el) {
  if (!el || !el.open) return;
  if (!supportsTopLayerExit()) {
    el.setAttribute("data-closing", "");
    const animations = typeof el.getAnimations === "function" ? el.getAnimations({ subtree: true }) : [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 400))
      ]);
    }
    if (!el.hasAttribute("data-closing")) return;
    el.removeAttribute("data-closing");
  }
  el.close();
}
function useDialogController(open, onClose) {
  const ref = (0, import_react.useRef)(null);
  const onCloseRef = (0, import_react.useRef)(onClose);
  onCloseRef.current = onClose;
  (0, import_react.useEffect)(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      el.removeAttribute("data-closing");
      if (!el.open && typeof el.showModal === "function") {
        el.showModal();
      }
      return;
    }
    if (el.open) {
      void closeTopLayer(el);
    }
  }, [open]);
  (0, import_react.useEffect)(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = (ev) => {
      if (ev.cancelable) ev.preventDefault();
      onCloseRef.current?.();
    };
    const handleClose = () => {
      el.returnValue = "";
      el.removeAttribute("data-closing");
      onCloseRef.current?.();
    };
    el.addEventListener("cancel", handleCancel);
    el.addEventListener("close", handleClose);
    let cleanupFallback = null;
    if (typeof HTMLDialogElement !== "undefined" && !("closedBy" in HTMLDialogElement.prototype)) {
      const outside = (ev) => {
        const r = el.getBoundingClientRect();
        return ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onDown = (ev) => {
        pressedOutside = outside(ev);
      };
      const onUp = (ev) => {
        if (pressedOutside && outside(ev)) {
          onCloseRef.current?.();
        }
      };
      el.addEventListener("pointerdown", onDown);
      el.addEventListener("pointerup", onUp);
      cleanupFallback = () => {
        el.removeEventListener("pointerdown", onDown);
        el.removeEventListener("pointerup", onUp);
      };
    }
    return () => {
      el.removeEventListener("cancel", handleCancel);
      el.removeEventListener("close", handleClose);
      cleanupFallback?.();
    };
  }, []);
  return ref;
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
function parseRgbOrHexLuma(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/i);
  if (m && (m[4] === void 0 || Number(m[4]) > 0.1)) {
    return 0.2126 * Number(m[1]) + 0.7152 * Number(m[2]) + 0.0722 * Number(m[3]);
  }
  if (/^#[0-9a-f]{6}$/i.test(s)) {
    const hex = s.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return null;
}
function detectHostDarkMode(rootEl) {
  if (typeof document === "undefined") return false;
  const html = document.documentElement;
  const body = document.body;
  try {
    const tokenEl = rootEl?.parentElement || body || html;
    const tokenLuma = parseRgbOrHexLuma(getComputedStyle(tokenEl).getPropertyValue("--dsw-alias-bg-base"));
    if (tokenLuma !== null) return tokenLuma < 128;
  } catch {
  }
  const explicitTheme = html?.getAttribute("data-theme") || body?.getAttribute("data-theme") || html?.getAttribute("data-color-scheme") || body?.getAttribute("data-color-scheme") || "";
  if (explicitTheme === "dark") return true;
  if (explicitTheme === "light") return false;
  const explicitDarkClass = html?.classList?.contains("dark") || body?.classList?.contains("dark") || elHasDarkAttr(rootEl?.parentElement || null);
  if (explicitDarkClass) return true;
  try {
    const hostSample = rootEl?.parentElement || body;
    const bgLuma = hostSample ? parseRgbOrHexLuma(getComputedStyle(hostSample).backgroundColor) : null;
    if (bgLuma !== null) return bgLuma < 128;
  } catch {
  }
  return Boolean(typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
}
function elHasDarkAttr(el) {
  let cur = el;
  while (cur && cur.nodeType === 1) {
    if (cur.classList?.contains("dark") || cur.getAttribute("data-theme") === "dark" || cur.getAttribute("data-color-scheme") === "dark") {
      return true;
    }
    cur = cur.parentElement;
  }
  return false;
}
function createImeHandlers() {
  let lastCompEnd = -1;
  return {
    onCompositionEnd(ev) {
      lastCompEnd = ev.timeStamp || Date.now();
    },
    onKeyDown(ev) {
      if (ev.key !== "Enter") return;
      const nowTs = ev.timeStamp || Date.now();
      if (ev.nativeEvent?.isComposing || ev.isComposing || ev.keyCode === 229 || lastCompEnd > 0 && nowTs - lastCompEnd < 50) {
        ev.preventDefault();
      }
    }
  };
}
function channelIdFromLabel(labelOrId) {
  const s = String(labelOrId || "").trim();
  if (s === "ch-wechat" || s.includes("\u4E2A\u4EBA\u5FAE\u4FE1") || s === "\u5FAE\u4FE1") return "ch-wechat";
  if (s === "ch-feishu" || s.includes("\u98DE\u4E66") || s.includes("Lark")) return "ch-feishu";
  if (s === "ch-wecom" || s.includes("\u4F01\u5FAE") || s.includes("\u4F01\u4E1A\u5FAE\u4FE1")) return "ch-wecom";
  if (s === "ch-slack" || s.includes("Slack")) return "ch-slack";
  return "ch-web";
}
function modeLabelText(mode) {
  if (mode === "direct") return "\u767D\u540D\u5355\u76F4\u63A5\u7B54";
  if (mode === "summary") return "\u53EA\u7ED9\u6C47\u603B\uFF08\u7981\u4E2A\u4EBA\u660E\u7EC6\uFF09";
  return "\u6BCF\u6B21\u5148\u5199\u8349\u7A3F\u7ED9\u6211\u770B";
}
function formatBindingText(p) {
  const chId = channelIdFromLabel(p?.channel);
  if (chId === "ch-web") return "\u72EC\u7ACB\u7F51\u9875\u94FE\u63A5 \xB7 \u4F1A\u8BDD\u9694\u79BB";
  if (chId === "ch-wechat") return p?.wechatBound ? "\u5DF2\u626B\u7801\u7ED1\u5B9A\u4E00\u5BF9\u4E00\u5FAE\u4FE1" : "\u5F85\u626B 5 \u5206\u949F\u4E13\u5C5E\u4E8C\u7EF4\u7801\u9501\u5B9A";
  if (p?.bindMode === "group_allow" || !p?.pairCode && p?.channelHandle) {
    return p?.channelHandle ? `\u7FA4\u767D\u540D\u5355\uFF1A${p.channelHandle}` : "\u6307\u5B9A\u7FA4\u804A\u767D\u540D\u5355";
  }
  if (p?.pairCode) return `\u79C1\u804A\u914D\u5BF9\u7801 ${p.pairCode}`;
  return "\u5DF2\u7B7E\u53D1\u914D\u5BF9\u6743\u9650";
}
function findTraceEntry(view, itemId) {
  if (!view || !itemId) return null;
  const app = (view.approvals || []).find((a) => a.id === itemId);
  if (app) return { label: app.personName, trace: app.trace };
  const del = (view.deliveries || []).find((d) => d.id === itemId);
  if (del) return { label: del.who, trace: del.trace };
  for (const p of view.people || []) {
    const hit = (p.threads || []).find((t) => t.id === itemId);
    if (hit) return { label: p.name, trace: hit.trace };
  }
  return null;
}
function BrandUserIcon() {
  return h(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.65,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    h("circle", { cx: 12, cy: 8, r: 4 }),
    h("path", { d: "M5 20a7 7 0 0 1 14 0" })
  );
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
function FolderIcon() {
  return h(
    "svg",
    {
      width: 16,
      height: 16,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    h("path", { d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" })
  );
}
function CheckIcon() {
  return h(
    "svg",
    {
      width: 12,
      height: 12,
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2.2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true"
    },
    h("path", { d: "M3.5 8.5 6.5 11.5 12.5 4.5" })
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
function QrCodeMatrixSvg({ seed }) {
  const size = 21;
  let hash = 2166136261;
  const text = String(seed || "twin-qr");
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const inFinder = (r, c, fr, fc) => {
    const dr = r - fr;
    const dc = c - fc;
    if (dr < 0 || dc < 0 || dr > 6 || dc > 6) return null;
    if (dr === 0 || dr === 6 || dc === 0 || dc === 6) return true;
    if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) return true;
    return false;
  };
  const rects = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      let dark = inFinder(r, c, 0, 0);
      if (dark === null) dark = inFinder(r, c, 0, size - 7);
      if (dark === null) dark = inFinder(r, c, size - 7, 0);
      if (dark === null) {
        const sep = r <= 7 && c <= 7 || r <= 7 && c >= size - 8 || r >= size - 8 && c <= 7;
        if (sep) {
          dark = false;
        } else {
          hash ^= r * 31 + c * 17 + 7;
          hash = Math.imul(hash, 16777619);
          dark = (hash >>> 0) % 10 < 5;
        }
      }
      if (dark) {
        rects.push(h("rect", { key: `${r}-${c}`, x: c, y: r, width: 1, height: 1, fill: "#111827" }));
      }
    }
  }
  return h(
    "svg",
    {
      viewBox: `0 0 ${size} ${size}`,
      shapeRendering: "crispEdges",
      role: "img",
      "aria-label": "\u4E13\u5C5E\u5FAE\u4FE1\u7ED1\u5B9A\u4E8C\u7EF4\u7801"
    },
    h("rect", { width: size, height: size, fill: "#ffffff" }),
    ...rects
  );
}

// src-client/modals.js
var import_react2 = __toESM(require("react"), 1);
var h2 = import_react2.default.createElement;
function buildInviteMessage(person, view) {
  if (!person) return "";
  const chId = channelIdFromLabel(person.channel);
  const channels = view?.channels || [];
  const ch = channels.find((c) => c.id === chId) || {};
  const project = view?.mountedProjects?.[0];
  const projectName = project?.projectName || "\u5DE5\u4F5C\u533A\u9879\u76EE";
  const twinName = view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB";
  const capNames = (view?.capabilities || []).filter((c) => (person.caps || []).includes(c.id)).map((c) => c.name);
  const capPreview = capNames.length > 0 ? capNames.join("\u3001") : `${(person.caps || []).length} \u9879\u53EA\u8BFB\u6838\u6570\u80FD\u529B`;
  if (chId === "ch-web") {
    const url = person.guestUrl || "\u672C\u673A\u5DF2\u751F\u6210\u72EC\u7ACB\u8BD5\u7528\u7F51\u5740";
    return `\u4F60\u597D ${person.name}\uFF0C\u6211\u628A\u6700\u8FD1\u6574\u7406\u7684\u300C${projectName}\u300D\u6307\u6807\u53E3\u5F84\u4E0E\u53EA\u8BFB\u5206\u6790\u80FD\u529B\u6574\u7406\u6210\u4E86\u4E13\u5C5E\u5206\u8EAB\u300C${twinName}\u300D\uFF08\u4E3A\u4F60\u5F00\u653E\u4E86\u300C${capPreview}\u300D\uFF0C${person.expiry}\uFF0C\u65E0\u4EFB\u4F55\u6536\u8D39\u73AF\u8282\uFF09\u3002

\u70B9\u5F00\u94FE\u63A5\u5C31\u80FD\u76F4\u63A5\u95EE\uFF1A${url}
\u6709\u4EFB\u4F55\u9700\u8981\u7EC6\u5316\u53E3\u5F84\u6216\u5BF9\u6BD4\u57FA\u7EBF\u7684\u5730\u65B9\uFF0C\u76F4\u63A5\u7ED9\u6211\u53CD\u9988\u5C31\u884C\u3002`;
  }
  if (chId === "ch-wechat") {
    return `\u4F60\u597D ${person.name}\uFF0C\u6211\u4E3A\u4F60\u5F00\u597D\u4E86\u5FAE\u4FE1\u5DE5\u4F5C\u5206\u8EAB\u300C${twinName}\u300D\uFF08\u5F00\u653E\u300C${capPreview}\u300D\uFF0C${person.expiry}\uFF09\u3002

\u8BF7\u7528\u5FAE\u4FE1\u626B\u4E00\u626B\u4E0B\u9762\u8FD9\u5F20 5 \u5206\u949F\u4E13\u5C5E\u7ED1\u5B9A\u7801\u5373\u53EF\u5EFA\u7ACB 1 \u5BF9 1 \u767D\u540D\u5355\uFF1B\u7ED1\u5B9A\u540E\u76F4\u63A5\u53D1\u95EE\u9898\u8FC7\u6765\u5373\u53EF\uFF0C\u6D89\u654F\u660E\u7EC6\u4F1A\u5148\u8F6C\u6211\u672C\u4EBA\u70B9\u5934\u786E\u8BA4\u3002`;
  }
  const botName = ch.botName || twinName;
  const chLabel = ch.shortLabel || person.channel || "\u534F\u4F5C\u9891\u9053";
  if (person.bindMode === "group_allow" || !person.pairCode && person.channelHandle) {
    const groupLabel = person.channelHandle || "\u4E13\u5C5E\u5DE5\u4F5C\u7FA4";
    return `Hi ${person.name}\uFF0C\u5DF2\u5728 ${chLabel}\u300C${groupLabel}\u300D\u63A5\u5165\u5DE5\u4F5C\u5206\u8EAB\u300C${botName}\u300D\uFF08\u5F00\u653E\u300C${capPreview}\u300D\uFF0C${person.expiry}\uFF09\u3002
\u76F4\u63A5\u5728\u7FA4\u91CC @${botName} \u63D0\u95EE\u5373\u53EF\u6838\u5BF9\u53E3\u5F84\u4E0E\u5F02\u5E38\u6CE2\u52A8\uFF1B\u82E5\u6211\u672C\u4EBA\u521A\u56DE\u590D\u8FC7\u5219\u5206\u8EAB\u4F1A\u81EA\u52A8\u6536\u58F0\u3002`;
  }
  return `Hi ${person.name}\uFF0C\u5DF2\u5728 ${chLabel} \u4E3A\u4F60\u5F00\u901A\u300C${botName}\u300D\u4E00\u5BF9\u4E00\u767D\u540D\u5355\u6743\u9650\uFF08\u5F00\u653E\u300C${capPreview}\u300D\uFF0C${person.expiry}\uFF09\u3002
\u8BF7\u5728 ${chLabel} \u641C\u7D22\u5E76\u79C1\u804A\u300C${botName}\u300D\uFF0C\u53D1\u9001\u4E00\u6B21\u6027\u914D\u5BF9\u53E3\u4EE4\u300C${person.pairCode || "\u5DF2\u7B7E\u53D1"}\u300D\u5B8C\u6210\u7ED1\u5B9A\u540E\u5373\u53EF\u5F00\u59CB\u63D0\u95EE\u3002`;
}
function PersonDrawer({
  person,
  view,
  scheme,
  busy,
  onClose,
  onAction,
  onOpenEditPerson,
  onOpenInvite,
  onOpenPreview,
  onOpenTrace,
  onOpenHandoff,
  onToast
}) {
  const open = Boolean(person);
  const ref = useDialogController(open, onClose);
  const [tab, setTab] = (0, import_react2.useState)("chat");
  const [noteInput, setNoteInput] = (0, import_react2.useState)("");
  const [editingApprovalId, setEditingApprovalId] = (0, import_react2.useState)("");
  const [draftText, setDraftText] = (0, import_react2.useState)("");
  const imeNote = (0, import_react2.useMemo)(() => createImeHandlers(), []);
  (0, import_react2.useEffect)(() => {
    if (!open || !person?.id) return;
    setTab("chat");
    setNoteInput("");
    setEditingApprovalId("");
    setDraftText("");
  }, [open, person?.id]);
  const tones = ["amber", "terra", "sage", "slate"];
  const personIdx = person ? Math.max(0, (view?.people || []).findIndex((x) => x.id === person.id)) : 0;
  const tone = person?.avatarTone || tones[personIdx % tones.length];
  const initial = person ? String(person.name || "U").trim().slice(0, 1).toUpperCase() : "U";
  const threads = person?.threads || [];
  const pendingItems = person ? (view?.approvals || []).filter((a) => a.personId === person.id) : [];
  const capNames = person ? (view?.capabilities || []).filter((c) => (person.caps || []).includes(c.id)).map((c) => c.name) : [];
  return h2(
    "dialog",
    {
      ref,
      id: "personDrawer",
      className: "tw-dlg drawer-dialog",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "drawerTitle"
    },
    person && [
      h2(
        "div",
        { key: "head", className: "drawer-head" },
        h2(
          "div",
          { className: "drawer-who" },
          h2("span", { id: "drawerAvatar", className: "avatar", "data-avatar-tone": tone, "aria-hidden": "true" }, initial),
          h2(
            "div",
            { className: "drawer-who-text" },
            h2("h2", { id: "drawerTitle", className: "drawer-name" }, person.name),
            h2(
              "div",
              { id: "drawerSub", className: "drawer-sub" },
              `${person.role || "\u5916\u90E8\u8BD5\u7528\u5BF9\u8C61"} \xB7 ${person.channel}${person.enabled ? "" : " \xB7 \u5DF2\u6682\u505C"}`
            )
          )
        ),
        h2(
          "div",
          { className: "drawer-head-actions" },
          h2(
            "div",
            { className: "seg-group", role: "group", "aria-label": "\u62BD\u5C49\u89C6\u56FE\u5207\u6362" },
            h2("button", {
              type: "button",
              className: "seg-btn",
              "aria-pressed": String(tab === "chat"),
              onClick: () => setTab("chat")
            }, "\u4F1A\u8BDD"),
            h2("button", {
              type: "button",
              className: "seg-btn",
              "aria-pressed": String(tab === "meta"),
              onClick: () => setTab("meta")
            }, "\u6458\u8981\u4E0E\u5907\u6CE8")
          ),
          h2("button", {
            type: "button",
            id: "btnCloseDrawer",
            className: "dlg-close",
            "aria-label": "\u5173\u95ED\u5BF9\u8BDD\u8BE6\u60C5\u62BD\u5C49",
            onClick: onClose
          }, h2(CloseIcon))
        )
      ),
      h2(
        "div",
        { key: "chat", id: "drawerChatPanel", className: "drawer-chat", hidden: tab !== "chat" },
        threads.length === 0 && pendingItems.length === 0 ? h2(
          "div",
          { className: "chat-sys-note", style: { marginTop: "1.5rem" } },
          "\u8FD8\u6CA1\u6709\u5BF9\u8BDD\u8BB0\u5F55\uFF0C\u53D1\u51FA\u8BD5\u7528\u94FE\u63A5\u540E\u5BF9\u8BDD\u4F1A\u5B9E\u65F6\u5448\u73B0\u5728\u8FD9\u91CC\u3002"
        ) : [
          ...threads.map((t) => {
            const isDigest = String(t.question || "").startsWith("\uFF08\u5B9A\u65F6\u8BA2\u9605\uFF09");
            return h2(
              "div",
              { key: t.id, className: "chat-exchange", "data-thread-id": t.id },
              h2("div", { className: "chat-time-sep" }, t.time),
              isDigest ? h2("div", { className: "chat-sys-note" }, `\u5B9A\u65F6\u63A8\u9001 \xB7 ${t.question.replace(/^（定时订阅）\s*/, "")}`) : h2(
                "div",
                { className: "msg-row msg-row--caller" },
                h2("div", { className: "msg-bubble msg-bubble--caller" }, t.question)
              ),
              h2(
                "div",
                { className: "msg-row msg-row--twin" },
                h2("div", { className: "msg-bubble msg-bubble--twin" }, t.reply),
                h2(
                  "div",
                  { className: "msg-foot" },
                  h2("span", null, t.statusLabel),
                  h2("span", { "aria-hidden": "true" }, "\xB7"),
                  h2("button", {
                    type: "button",
                    className: "msg-trace-btn",
                    onClick: () => onOpenTrace(t.id)
                  }, "\u67E5\u770B\u8FC7\u7A0B")
                )
              )
            );
          }),
          ...pendingItems.map((item) => {
            const isEditing = editingApprovalId === item.id;
            const pendingTime = String(item.channel || "").split(" \xB7 ")[1] || "\u521A\u521A";
            const kickerLabel = item.tone === "danger" ? "\u5DF2\u62E6\u4E0B\u654F\u611F\u660E\u7EC6 \xB7 \u5F85\u4F60\u786E\u8BA4" : `\u5206\u8EAB\u62DF\u56DE \xB7 ${item.tag}`;
            return h2(
              "div",
              { key: item.id, className: "chat-exchange" },
              h2("div", { className: "chat-time-sep" }, pendingTime),
              h2(
                "div",
                { className: "msg-row msg-row--caller" },
                h2("div", { className: "msg-bubble msg-bubble--caller" }, item.question)
              ),
              h2(
                "div",
                { className: "msg-row msg-row--twin msg-row--draft" },
                h2(
                  "div",
                  {
                    className: "msg-bubble msg-bubble--draft",
                    "data-approval-id": item.id,
                    "data-tone": item.tone
                  },
                  h2(
                    "div",
                    { className: "draft-kicker" },
                    h2("span", null, kickerLabel),
                    h2("span", { className: "draft-sync-note" }, "\u4E0E\u670D\u52A1\u53F0\u540C\u6B65")
                  ),
                  isEditing ? h2(
                    "div",
                    { className: "field-group" },
                    h2("textarea", {
                      className: "tw-textarea",
                      value: draftText,
                      onChange: (e) => setDraftText(e.target.value),
                      "aria-label": "\u6539\u5199\u56DE\u590D\u8349\u7A3F"
                    }),
                    h2(
                      "div",
                      { className: "action-row" },
                      h2("button", {
                        type: "button",
                        className: "tw-btn tw-btn--primary tw-btn--sm",
                        disabled: busy,
                        onClick: async () => {
                          if (!draftText.trim()) return;
                          await onAction("approve_draft", { approvalId: item.id, customDraft: draftText.trim() });
                          setEditingApprovalId("");
                          onToast?.(`\u5DF2\u6279\u51C6\u5E76\u53D1\u51FA\u7ED9 ${person.name}`);
                        }
                      }, "\u4FDD\u5B58\u5E76\u53D1\u51FA"),
                      h2("button", {
                        type: "button",
                        className: "tw-btn tw-btn--ghost tw-btn--sm",
                        onClick: () => setEditingApprovalId("")
                      }, "\u53D6\u6D88\u4FEE\u6539")
                    )
                  ) : [
                    h2("div", { key: "txt" }, item.draft),
                    h2(
                      "div",
                      { key: "act", className: "action-row" },
                      h2("button", {
                        type: "button",
                        className: "tw-btn tw-btn--primary tw-btn--sm",
                        disabled: busy,
                        onClick: async () => {
                          await onAction("approve_draft", { approvalId: item.id });
                          onToast?.(`\u5DF2\u6279\u51C6\u5E76\u53D1\u51FA\u7ED9 ${person.name}`);
                        }
                      }, item.primaryActionLabel || "\u6279\u51C6\u53D1\u51FA"),
                      h2("button", {
                        type: "button",
                        className: "tw-btn tw-btn--subtle tw-btn--sm",
                        onClick: () => {
                          setEditingApprovalId(item.id);
                          setDraftText(item.draft || "");
                        }
                      }, "\u6539\u4E00\u4E0B\u518D\u53D1"),
                      item.tone === "danger" && h2("button", {
                        type: "button",
                        className: "tw-btn tw-btn--subtle tw-btn--sm",
                        onClick: () => onOpenHandoff({ kind: "approval", item })
                      }, "\u8F6C\u6211\u53BB\u5BF9\u8BDD\u91CC\u4EB2\u81EA\u5904\u7406"),
                      h2("button", {
                        type: "button",
                        className: "msg-trace-btn",
                        onClick: () => onOpenTrace(item.id)
                      }, "\u67E5\u770B\u8FC7\u7A0B")
                    )
                  ]
                )
              )
            );
          })
        ],
        !person.enabled && h2("div", { className: "chat-sys-note" }, "\u5F53\u524D\u5DF2\u6682\u505C\u6B64\u4EBA\u7684\u8BBF\u95EE\u6743\u9650\uFF0C\u53EF\u5728\u300C\u6458\u8981\u4E0E\u5907\u6CE8\u300D\u4E2D\u6062\u590D")
      ),
      h2(
        "div",
        { key: "meta", id: "drawerMetaPanel", className: "drawer-meta", hidden: tab !== "meta" },
        h2(
          "section",
          { className: "meta-section", "aria-labelledby": "metaSecSummaryTitle" },
          h2(
            "div",
            { id: "metaSecSummaryTitle", className: "meta-section-head" },
            h2("span", null, h2("span", { className: "meta-section-idx" }, "01"), "\u670D\u52A1\u6458\u8981")
          ),
          h2(
            "div",
            { className: "meta-kv-list" },
            h2(
              "div",
              { className: "meta-kv-row meta-kv-row--center" },
              h2("span", { className: "meta-kv-label" }, "\u8BBF\u95EE\u6743\u9650"),
              h2(
                "label",
                { className: "switch", "aria-label": "\u5207\u6362\u6B64\u4EBA\u7684\u8BBF\u95EE\u6743\u9650" },
                h2("input", {
                  type: "checkbox",
                  checked: Boolean(person.enabled),
                  disabled: busy,
                  onChange: async (e) => {
                    const checked = e.target.checked;
                    await onAction("toggle_person", { personId: person.id, enabled: checked });
                    onToast?.(checked ? `\u5DF2\u5F00\u542F ${person.name} \u7684\u8BBF\u95EE\u6743\u9650` : `\u5DF2\u6682\u505C ${person.name} \u7684\u8BBF\u95EE\u6743\u9650`);
                  }
                }),
                h2("span", { className: "switch-track" })
              )
            ),
            h2(
              "div",
              { className: "meta-kv-row" },
              h2("span", { className: "meta-kv-label" }, "\u7D2F\u8BA1\u5DF2\u670D\u52A1"),
              h2("span", { className: "meta-kv-val" }, `\u5DF2\u670D\u52A1 ${person.servedCount || 0} \u8F6E`)
            ),
            h2(
              "div",
              { className: "meta-kv-row" },
              h2("span", { className: "meta-kv-label" }, "\u56DE\u590D\u5C3A\u5EA6"),
              h2("span", { className: "meta-kv-val" }, modeLabelText(person.mode))
            ),
            h2(
              "div",
              { className: "meta-kv-row" },
              h2("span", { className: "meta-kv-label" }, "\u5F00\u653E\u80FD\u529B"),
              h2("span", { className: "meta-kv-val" }, `${capNames.join("\u3001") || "\u6682\u672A\u52FE\u9009"}${person.digest ? " \xB7 \u542B\u6BCF\u65E5 09:00 \u65E9\u62A5" : ""}`)
            ),
            h2(
              "div",
              { className: "meta-kv-row" },
              h2("span", { className: "meta-kv-label" }, "\u6709\u6548\u671F\u9650"),
              h2("span", { className: "meta-kv-val" }, `${person.enabled ? person.expiry : "\u5DF2\u6682\u505C"} \xB7 \u6700\u8FD1\u4E92\u52A8 ${person.lastActive || "\u6682\u65E0"}`)
            )
          )
        ),
        h2(
          "section",
          { className: "meta-section", "aria-labelledby": "metaSecNoteTitle" },
          h2(
            "div",
            { id: "metaSecNoteTitle", className: "meta-section-head" },
            h2("span", null, h2("span", { className: "meta-section-idx" }, "02"), "\u4E13\u95E8\u53EE\u5631\u4E0E\u5907\u6CE8")
          ),
          h2(
            "div",
            { id: "drawerNoteDisplay", className: "meta-note-current" },
            `\u5F53\u524D\u53EE\u5631\uFF1A${person.note || "\u6682\u65E0\u7279\u522B\u53EE\u5631\uFF0C\u53EF\u5728\u4E0B\u65B9\u76F4\u63A5\u8865\u5145"}`
          ),
          h2(
            "form",
            {
              id: "drawerNoteForm",
              className: "drawer-note-form",
              onSubmit: async (ev) => {
                ev.preventDefault();
                if (!noteInput.trim()) return;
                await onAction("update_person_note", { personId: person.id, note: noteInput.trim() });
                setNoteInput("");
                onToast?.(`\u5DF2\u66F4\u65B0\u5BF9 ${person.name} \u7684\u4E13\u95E8\u53EE\u5631`);
              }
            },
            h2("input", {
              id: "drawerNoteInput",
              className: "tw-input",
              type: "text",
              value: noteInput,
              onChange: (e) => setNoteInput(e.target.value),
              onCompositionEnd: imeNote.onCompositionEnd,
              onKeyDown: imeNote.onKeyDown,
              placeholder: "\u8865\u4E00\u6761\u7ED9\u4ED6\u7684\u4E13\u95E8\u53EE\u5631\uFF08\u4F8B\u5982\uFF1A\u82F1\u6587\u95EE\u4E5F\u5E26\u4E2D\u6587\u6838\u5FC3\u672F\u8BED\uFF09\u2026",
              autoComplete: "off"
            }),
            h2("button", { type: "submit", className: "tw-btn tw-btn--primary tw-btn--sm", disabled: busy }, "\u8BB0\u4E0B\u53EE\u5631")
          ),
          h2("div", { className: "meta-hint" }, "\u4EC5\u5BF9\u8FD9\u4F4D\u8054\u7CFB\u4EBA\u5355\u72EC\u751F\u6548\uFF0C\u4E0D\u5F71\u54CD\u5176\u4ED6\u4EBA\uFF1B\u4F1A\u8BDD\u8BB0\u5F55\u6309\u8BBF\u5BA2\u72EC\u7ACB\u9694\u79BB\u5B58\u6863\u3002")
        ),
        h2(
          "section",
          { className: "meta-section", "aria-labelledby": "metaSecActionsTitle" },
          h2(
            "div",
            { id: "metaSecActionsTitle", className: "meta-section-head" },
            h2("span", null, h2("span", { className: "meta-section-idx" }, "03"), "\u6743\u9650\u4E0E\u63A5\u624B\u64CD\u4F5C")
          ),
          h2(
            "div",
            { className: "action-row" },
            h2("button", {
              type: "button",
              className: "tw-btn tw-btn--subtle tw-btn--sm",
              onClick: () => onOpenEditPerson(person.id)
            }, "\u6539\u6743\u9650\u4E0E\u8303\u56F4"),
            h2("button", {
              type: "button",
              className: "tw-btn tw-btn--ghost tw-btn--sm",
              onClick: () => onOpenInvite(person.id)
            }, "\u67E5\u770B\u63A5\u5165\u51ED\u8BC1 / \u53D1\u9080\u8BF7"),
            h2("button", {
              type: "button",
              className: "tw-btn tw-btn--ghost tw-btn--sm",
              onClick: () => onOpenPreview(person.id)
            }, "\u5BF9\u65B9\u89C6\u89D2\u9884\u89C8"),
            h2("button", {
              type: "button",
              className: "tw-btn tw-btn--ghost tw-btn--sm",
              onClick: () => onOpenHandoff({ kind: "person", person })
            }, "\u8F6C\u539F\u751F\u5BF9\u8BDD\u4EB2\u81EA\u63A5\u624B")
          )
        )
      )
    ]
  );
}
function TraceModal({ view, traceItemId, scheme, onClose }) {
  const found = findTraceEntry(view, traceItemId);
  const open = Boolean(traceItemId && found);
  const ref = useDialogController(open, onClose);
  const [techOpen, setTechOpen] = (0, import_react2.useState)(false);
  (0, import_react2.useEffect)(() => {
    if (open) setTechOpen(false);
  }, [open, traceItemId]);
  return h2(
    "dialog",
    {
      ref,
      id: "traceDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "traceDlgTitle"
    },
    found && [
      h2(
        "div",
        { key: "h", className: "dlg-head" },
        h2("h3", { id: "traceDlgTitle", className: "dlg-title" }, `${found.label} \xB7 \u67E5\u8BC1\u8FC7\u7A0B`),
        h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
      ),
      h2(
        "div",
        { key: "b", className: "dlg-body" },
        h2("div", { style: { fontSize: "0.84375rem", color: "var(--text-secondary)" } }, found.trace?.intro || ""),
        h2(
          "ol",
          { className: "trace-steps" },
          (found.trace?.steps || []).map(
            (s, idx) => h2(
              "li",
              { key: idx },
              h2("strong", null, s.title),
              h2("span", null, s.detail)
            )
          )
        ),
        h2(
          "details",
          { className: "tech-details", open: techOpen, onToggle: (e) => setTechOpen(e.currentTarget.open) },
          h2("summary", null, "\u5C55\u5F00\u5E95\u5C42\u5B89\u5168\u8BB0\u5F55\uFF08\u4EC5\u4F9B\u6392\u67E5\uFF09"),
          h2("p", null, found.trace?.techNote || "\u53EA\u8BFB\u9694\u79BB\u6C99\u7BB1\u8FD0\u884C\uFF0C\u654F\u611F\u8DEF\u5F84\u4E0E\u5BC6\u94A5\u5DF2\u5C4F\u853D\u3002")
        )
      ),
      h2(
        "div",
        { key: "f", className: "dlg-foot" },
        h2("button", { type: "button", className: "tw-btn tw-btn--primary", onClick: onClose }, "\u5173\u95ED")
      )
    ]
  );
}
function PersonModal({
  open,
  editingPerson,
  initialDraft,
  draftNonce,
  view,
  scheme,
  busy,
  onClose,
  onJumpChannelConfig,
  onSavePerson,
  onToast
}) {
  const ref = useDialogController(open, onClose);
  const [name, setName] = (0, import_react2.useState)("");
  const [role, setRole] = (0, import_react2.useState)("");
  const [channel, setChannel] = (0, import_react2.useState)("\u514D\u88C5\u8BD5\u7528\u7F51\u9875");
  const [expiry, setExpiry] = (0, import_react2.useState)("\u5269 7 \u5929\u8BD5\u7528");
  const [bindMode, setBindMode] = (0, import_react2.useState)("dm_pair");
  const [channelHandle, setChannelHandle] = (0, import_react2.useState)("");
  const [mode, setMode] = (0, import_react2.useState)("confirm");
  const [caps, setCaps] = (0, import_react2.useState)([]);
  const [digest, setDigest] = (0, import_react2.useState)(true);
  const [enabled, setEnabled] = (0, import_react2.useState)(true);
  const [note, setNote] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    if (initialDraft) {
      setName(initialDraft.name || "");
      setRole(initialDraft.role || "\u5916\u90E8\u8BD5\u7528\u5BF9\u8C61");
      setChannel(initialDraft.channel || "\u514D\u88C5\u8BD5\u7528\u7F51\u9875");
      setExpiry(initialDraft.expiry || "\u5269 7 \u5929\u8BD5\u7528");
      setBindMode(initialDraft.bindMode || "dm_pair");
      setChannelHandle(initialDraft.channelHandle || "");
      setMode(initialDraft.mode || "confirm");
      setCaps(Array.isArray(initialDraft.caps) ? initialDraft.caps : []);
      setDigest(Boolean(initialDraft.digest));
      setEnabled(Boolean(initialDraft.enabled));
      setNote(initialDraft.note || "");
      return;
    }
    if (editingPerson) {
      setName(editingPerson.name || "");
      setRole(editingPerson.role || "\u5916\u90E8\u8BD5\u7528\u5BF9\u8C61");
      const chId = channelIdFromLabel(editingPerson.channel);
      setChannel(
        chId === "ch-wechat" ? "\u4E2A\u4EBA\u5FAE\u4FE1" : chId === "ch-feishu" ? "\u98DE\u4E66" : chId === "ch-wecom" ? "\u4F01\u4E1A\u5FAE\u4FE1" : chId === "ch-slack" ? "\u5408\u4F5C\u65B9 Slack" : "\u514D\u88C5\u8BD5\u7528\u7F51\u9875"
      );
      setExpiry(editingPerson.expiry || "\u5269 7 \u5929\u8BD5\u7528");
      setBindMode(editingPerson.bindMode === "group_allow" ? "group_allow" : "dm_pair");
      setChannelHandle(editingPerson.channelHandle || "");
      setMode(editingPerson.mode || "confirm");
      setCaps(Array.isArray(editingPerson.caps) ? editingPerson.caps : []);
      setDigest(Boolean(editingPerson.digest));
      setEnabled(Boolean(editingPerson.enabled));
      setNote(editingPerson.note || "");
      return;
    }
    setName("");
    setRole("\u5916\u90E8\u8BD5\u8DD1\u4F19\u4F34");
    setChannel("\u514D\u88C5\u8BD5\u7528\u7F51\u9875");
    setExpiry("\u5269 7 \u5929\u8BD5\u7528");
    setBindMode("dm_pair");
    setChannelHandle("");
    setMode("confirm");
    setCaps((view?.capabilities || []).filter((c) => c.enabled).slice(0, 3).map((c) => c.id));
    setDigest(false);
    setEnabled(true);
    setNote("");
  }, [open, editingPerson?.id, draftNonce]);
  const targetChId = channelIdFromLabel(channel);
  const targetCh = (view?.channels || []).find((c) => c.id === targetChId) || { id: "ch-web", configured: true, shortLabel: "\u7F51\u9875" };
  const isBot = targetChId === "ch-feishu" || targetChId === "ch-wecom" || targetChId === "ch-slack";
  const botUnconfigured = isBot && !targetCh.configured;
  const handleLabelMap = {
    "ch-feishu": { label: "\u5141\u8BB8\u4ECB\u5165\u7684\u98DE\u4E66\u7FA4\u804A\u540D\u79F0\u6216\u7FA4 ID", ph: "\u4F8B\u5982\uFF1A\u9879\u76EE\u8054\u5408\u5BF9\u9F50\u7FA4" },
    "ch-wecom": { label: "\u5141\u8BB8\u4ECB\u5165\u7684\u4F01\u5FAE\u5916\u90E8\u7FA4\u540D\u79F0", ph: "\u4F8B\u5982\uFF1A\u9879\u76EE\u5916\u90E8\u8BD5\u8DD1\u7FA4" },
    "ch-slack": { label: "\u5141\u8BB8\u4ECB\u5165\u7684 Slack \u9891\u9053\u540D\u79F0", ph: "\u4F8B\u5982\uFF1A#ext-growth" }
  };
  const hSpec = handleLabelMap[targetChId] || { label: "\u767D\u540D\u5355\u7FA4\u804A / \u9891\u9053\u540D", ph: "\u4F8B\u5982\uFF1A#ext-project" };
  async function submitForm(ev) {
    ev.preventDefault();
    if (!name.trim()) return;
    if (botUnconfigured) {
      onToast?.(`\u8BF7\u5148\u63A5\u901A\u300C${targetCh.shortLabel}\u300D\u5E95\u5EA7\u901A\u9053\u51ED\u8BC1`);
      return;
    }
    await onSavePerson({
      isEdit: Boolean(editingPerson),
      personId: editingPerson?.id,
      name: name.trim(),
      role: role.trim() || "\u5916\u90E8\u8BD5\u7528\u5BF9\u8C61",
      channel,
      expiry,
      bindMode: isBot ? bindMode : targetCh.kind,
      channelHandle: isBot && bindMode === "group_allow" ? channelHandle.trim() : "",
      mode,
      caps,
      digest,
      enabled,
      note: note.trim()
    });
  }
  return h2(
    "dialog",
    {
      ref,
      id: "personDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "personDlgTitle"
    },
    h2(
      "div",
      { className: "dlg-head" },
      h2(
        "h3",
        { id: "personDlgTitle", className: "dlg-title" },
        editingPerson ? `\u8C03\u6574 ${editingPerson.name} \u7684\u8BBF\u95EE\u6743\u9650` : "\u5F00\u901A\u670D\u52A1\u5BF9\u8C61\u4E0E\u9080\u8BF7\u6743\u9650"
      ),
      h2("button", { type: "button", className: "dlg-close", "aria-label": "\u53D6\u6D88\u5E76\u5173\u95ED", onClick: onClose }, h2(CloseIcon))
    ),
    h2(
      "form",
      { id: "personForm", style: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }, onSubmit: submitForm },
      h2(
        "div",
        { className: "dlg-body" },
        h2(
          "p",
          { className: "launch-muted-note" },
          editingPerson ? "\u53EF\u968F\u65F6\u4FEE\u6539\u53EA\u8BFB\u80FD\u529B\u8303\u56F4\u3001\u56DE\u590D\u5C3A\u5EA6\u3001\u6709\u6548\u5929\u6570\u6216\u5F00\u5173\u72B6\u6001\u3002" : "\u9009\u5B9A\u5BF9\u8C61\u3001\u7ED1\u5B9A\u6765\u5F80\u901A\u9053\u5E76\u6307\u5B9A\u53EA\u8BFB\u80FD\u529B\u540E\uFF0C\u4FDD\u5B58\u5373\u53EF\u53D1\u51FA\u4E13\u5C5E\u9080\u8BF7\u3002"
        ),
        h2(
          "div",
          { className: "field-row-2" },
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "dlgName" }, "\u600E\u4E48\u79F0\u547C"),
            h2("input", {
              id: "dlgName",
              className: "tw-input",
              type: "text",
              required: true,
              value: name,
              onChange: (e) => setName(e.target.value),
              placeholder: "\u4F8B\u5982\uFF1A\u6797\u603B / \u5408\u4F5C\u65B9"
            })
          ),
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "dlgRole" }, "\u8EAB\u4EFD\u5907\u6CE8"),
            h2("input", {
              id: "dlgRole",
              className: "tw-input",
              type: "text",
              value: role,
              onChange: (e) => setRole(e.target.value),
              placeholder: "\u4F8B\u5982\uFF1A\u5916\u90E8\u8BD5\u8DD1\u5BA2\u6237"
            })
          )
        ),
        h2(
          "div",
          { className: "field-row-2" },
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "dlgChannel" }, "\u6765\u5F80\u65B9\u5F0F"),
            h2(
              "select",
              {
                id: "dlgChannel",
                className: "tw-select",
                value: channel,
                onChange: (e) => setChannel(e.target.value)
              },
              h2("option", { value: "\u514D\u88C5\u8BD5\u7528\u7F51\u9875" }, "\u514D\u88C5\u8BD5\u7528\u7F51\u9875\uFF08\u514D\u914D\u7F6E \xB7 \u751F\u6210\u4E13\u5C5E\u8BD5\u8DD1\u94FE\u63A5\uFF09"),
              h2("option", { value: "\u4E2A\u4EBA\u5FAE\u4FE1" }, "\u4E2A\u4EBA\u5FAE\u4FE1\uFF08\u514D\u914D\u7F6E \xB7 \u751F\u6210\u4E00\u5BF9\u4E00\u626B\u7801\u4E8C\u7EF4\u7801\uFF09"),
              h2("option", { value: "\u98DE\u4E66" }, "\u98DE\u4E66 / Lark\uFF08\u914D\u5BF9\u7801\u79C1\u804A \u6216 \u6307\u5B9A\u9879\u76EE\u7FA4\uFF09"),
              h2("option", { value: "\u4F01\u4E1A\u5FAE\u4FE1" }, "\u4F01\u4E1A\u5FAE\u4FE1\uFF08\u5BA2\u6237\u4E92\u901A\u7FA4 \u6216 \u6210\u5458\u914D\u5BF9\u7801\uFF09"),
              h2("option", { value: "\u5408\u4F5C\u65B9 Slack" }, "Slack\uFF08\u6307\u5B9A\u9891\u9053\u767D\u540D\u5355 \u6216 \u6210\u5458\u914D\u5BF9\u7801\uFF09")
            )
          ),
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "dlgExpiry" }, "\u6709\u6548\u671F\u5B89\u6392"),
            h2(
              "select",
              {
                id: "dlgExpiry",
                className: "tw-select",
                value: expiry,
                onChange: (e) => setExpiry(e.target.value)
              },
              h2("option", { value: "\u957F\u671F\u6709\u6548" }, "\u957F\u671F\u6709\u6548"),
              h2("option", { value: "\u5269 6 \u5929\u8BD5\u7528" }, "6 \u5929\u8BD5\u7528"),
              h2("option", { value: "\u5269 7 \u5929\u8BD5\u7528" }, "7 \u5929\u8BD5\u7528"),
              h2("option", { value: "\u5269 14 \u5929\u8BD5\u7528" }, "14 \u5929\u8BD5\u7528"),
              h2("option", { value: "\u81F3 12-31" }, "\u81F3 12-31"),
              h2("option", { value: "\u5DF2\u6682\u505C" }, "\u6682\u505C\u4E2D")
            )
          )
        ),
        h2(
          "div",
          { className: "field-group" },
          h2(
            "div",
            { className: "field-hint-box" },
            targetChId === "ch-web" ? "\u4FDD\u5B58\u540E\u81EA\u52A8\u751F\u6210\u72EC\u7ACB\u7F51\u9875\u94FE\u63A5\uFF1A\u5BF9\u65B9\u6D4F\u89C8\u5668\u6253\u5F00\u5373\u53EF\u63D0\u95EE\uFF0C\u65E0\u9700\u767B\u5F55\u3001\u65E0\u6536\u8D39\u5899\uFF0C\u4F1A\u8BDD\u6570\u636E\u4E0E\u4ED6\u4EBA\u4E25\u683C\u7269\u7406\u9694\u79BB\u3002" : targetChId === "ch-wechat" ? "\u96F6\u516C\u4F17\u53F7\u6CE8\u518C\uFF1A\u4FDD\u5B58\u540E\u751F\u6210 5 \u5206\u949F\u6709\u6548\u7684\u4E00\u5BF9\u4E00\u5FAE\u4FE1\u7ED1\u5B9A\u4E8C\u7EF4\u7801\uFF0C\u5BF9\u65B9\u5FAE\u4FE1\u626B\u7801\u9501\u5B9A\u540E\u624D\u53EF\u5BF9\u8BDD\uFF0C\u964C\u751F\u4EBA\u96F6\u54CD\u5E94\u3002" : botUnconfigured ? `\u5C1A\u672A\u63A5\u5165\u300C${targetCh.name}\u300D\u3002\u53EA\u9700 1 \u6B21\u586B\u5165\u5F00\u653E\u5E73\u53F0\u51ED\u8BC1\u5F00\u542F\u672C\u673A\u957F\u8FDE\u63A5\uFF08\u514D\u516C\u7F51\u670D\u52A1\u5668\uFF09\uFF0C\u968F\u540E\u5373\u53EF\u4E3A\u5BF9\u8C61\u53D1\u914D\u5BF9\u7801\u6216\u7ED1\u5B9A\u7FA4\u804A\u3002` : bindMode === "group_allow" ? `\u4EC5\u5728\u6307\u5B9A\u7FA4\u804A/\u9891\u9053\u5185 @ ${targetCh.botName || "\u5206\u8EAB"} \u65F6\u624D\u4ECB\u5165\u6838\u6570\uFF1B\u82E5\u4F60\u672C\u4EBA 15 \u5206\u949F\u5185\u521A\u53D1\u8A00\u4F1A\u81EA\u52A8\u6536\u58F0\u3002` : "\u4FDD\u5B58\u540E\u5373\u523B\u751F\u6210\u552F\u4E00\u79C1\u804A\u914D\u5BF9\u53E3\u4EE4\uFF0C\u5BF9\u65B9\u79C1\u804A\u673A\u5668\u4EBA\u53D1\u9001\u8BE5\u53E3\u4EE4\u540E\u624D\u6B63\u5F0F\u7ED1\u5B9A\u767D\u540D\u5355\u3002"
          ),
          botUnconfigured && h2(
            "div",
            { className: "field-warn-box" },
            h2("div", null, h2("strong", null, `\u9700\u8981\u5148\u63A5\u901A\u300C${targetCh.shortLabel}\u300D\u5E95\u5EA7\u901A\u9053`)),
            h2(
              "div",
              { style: { color: "var(--text-secondary)" } },
              "\u5B8C\u6210\u540E\u4F1A\u81EA\u52A8\u56DE\u5230\u6B64\u5F39\u7A97\u7EE7\u7EED\u586B\u5199\uFF0C\u5DF2\u8F93\u5165\u7684\u5BF9\u8C61\u540D\u79F0\u4E0E\u52FE\u9009\u80FD\u529B\u4F1A\u4E3A\u4F60\u4FDD\u7559\u3002"
            ),
            h2("button", {
              type: "button",
              className: "tw-btn tw-btn--primary tw-btn--sm",
              onClick: () => onJumpChannelConfig(targetCh.id, {
                personId: editingPerson?.id || "",
                name,
                role,
                channel,
                expiry,
                bindMode,
                channelHandle,
                mode,
                caps,
                digest,
                enabled,
                note
              })
            }, `\u5148\u53BB\u914D\u7F6E\u5E76\u63A5\u901A${targetCh.shortLabel}`)
          ),
          isBot && !botUnconfigured && [
            h2(
              "div",
              { key: "bm", className: "field-group" },
              h2("span", { className: "field-label" }, "\u901A\u8FC7\u6B64\u901A\u9053\u600E\u4E48\u8BC6\u522B\u5BF9\u65B9\u5E76\u5F00\u59CB\u5BF9\u8BDD\uFF1F"),
              h2(
                "div",
                { className: "radio-stack" },
                h2(
                  "label",
                  { className: "choice-row" },
                  h2("input", { type: "radio", name: "dlgBindMode", value: "dm_pair", checked: bindMode !== "group_allow", onChange: () => setBindMode("dm_pair") }),
                  h2("span", null, h2("strong", null, "\u79C1\u804A\u4E00\u5BA2\u4E00\u7801\u914D\u5BF9"), " \u2014 \u751F\u6210\u4E00\u6B21\u6027\u914D\u5BF9\u53E3\u4EE4\uFF0C\u5BF9\u65B9\u79C1\u804A\u53D1\u7ED9\u673A\u5668\u4EBA\u5373\u7ED1\u5B9A\u4E2A\u4EBA\u6743\u9650")
                ),
                h2(
                  "label",
                  { className: "choice-row" },
                  h2("input", { type: "radio", name: "dlgBindMode", value: "group_allow", checked: bindMode === "group_allow", onChange: () => setBindMode("group_allow") }),
                  h2("span", null, h2("strong", null, "\u6307\u5B9A\u7FA4\u804A / \u9891\u9053\u767D\u540D\u5355"), " \u2014 \u628A\u673A\u5668\u4EBA\u62C9\u8FDB\u7FA4\uFF0C\u4EC5\u8BE5\u767D\u540D\u5355\u7FA4\u5185 @\u5206\u8EAB \u624D\u4F1A\u4F5C\u7B54")
                )
              )
            ),
            bindMode === "group_allow" && h2(
              "div",
              { key: "bh", className: "field-group" },
              h2("label", { className: "field-label", htmlFor: "dlgChannelHandle" }, hSpec.label),
              h2("input", {
                id: "dlgChannelHandle",
                className: "tw-input",
                type: "text",
                value: channelHandle,
                onChange: (e) => setChannelHandle(e.target.value),
                placeholder: hSpec.ph,
                autoCorrect: "off",
                autoCapitalize: "none",
                spellCheck: false
              })
            )
          ]
        ),
        h2(
          "div",
          { className: "field-group" },
          h2("span", { className: "field-label" }, "\u4ED6\u63D0\u95EE\u65F6\uFF0C\u5206\u8EAB\u600E\u4E48\u56DE\uFF1F"),
          h2(
            "div",
            { className: "radio-stack" },
            h2(
              "label",
              { className: "choice-row" },
              h2("input", { type: "radio", name: "dlgMode", value: "direct", checked: mode === "direct", onChange: () => setMode("direct") }),
              h2("span", null, h2("strong", null, "\u767D\u540D\u5355\u76F4\u63A5\u7B54"), " \u2014 \u5F00\u653E\u80FD\u529B\u5185\u67E5\u6E05\u540E\u76F4\u63A5\u53D1\u7ED9\u5BF9\u65B9\uFF0C\u7701\u5FC3\u7701\u529B")
            ),
            h2(
              "label",
              { className: "choice-row" },
              h2("input", { type: "radio", name: "dlgMode", value: "confirm", checked: mode === "confirm", onChange: () => setMode("confirm") }),
              h2("span", null, h2("strong", null, "\u6BCF\u6B21\u5148\u5199\u8349\u7A3F\u7ED9\u6211\u770B"), " \u2014 \u6211\u70B9\u5934\u786E\u8BA4\u540E\u624D\u53D1\u51FA\u53BB")
            ),
            h2(
              "label",
              { className: "choice-row" },
              h2("input", { type: "radio", name: "dlgMode", value: "summary", checked: mode === "summary", onChange: () => setMode("summary") }),
              h2("span", null, h2("strong", null, "\u53EA\u7ED9\u6C47\u603B\uFF0C\u7981\u4E2A\u4EBA\u660E\u7EC6"), " \u2014 \u81EA\u52A8\u6321\u6389\u624B\u673A\u53F7\u548C\u5355\u6761\u660E\u7EC6")
            )
          )
        ),
        h2(
          "div",
          { className: "field-group" },
          h2("span", { className: "field-label" }, "\u5F00\u653E\u7ED9\u4ED6\u4F7F\u7528\u7684\u80FD\u529B"),
          h2(
            "div",
            { className: "check-stack" },
            (view?.capabilities || []).length === 0 ? h2("div", { className: "field-hint-box" }, "\u6682\u672A\u63D0\u53D6\u9879\u76EE\u80FD\u529B\uFF0C\u53EF\u5728\u300C\u9996\u6B21\u542F\u7528\u300D\u63D0\u53D6\u540E\u968F\u65F6\u56DE\u6765\u52FE\u9009\u3002") : (view?.capabilities || []).map(
              (cap) => h2(
                "label",
                { key: cap.id, className: "choice-row" },
                h2("input", {
                  type: "checkbox",
                  checked: caps.includes(cap.id),
                  onChange: (e) => setCaps((prev) => e.target.checked ? [...prev, cap.id] : prev.filter((id) => id !== cap.id))
                }),
                h2("span", null, h2("strong", null, cap.name), `\uFF08${cap.basis}\uFF09`)
              )
            )
          )
        ),
        h2(
          "div",
          { className: "field-group" },
          h2(
            "label",
            { className: "choice-row" },
            h2("input", { type: "checkbox", checked: digest, onChange: (e) => setDigest(e.target.checked) }),
            h2("span", null, "\u6BCF\u5929 09:00 \u987A\u5E26\u53D1\u4E00\u4EFD\u6838\u5FC3\u6307\u6807\u65E9\u62A5\u7ED9\u4ED6")
          ),
          h2(
            "label",
            { className: "choice-row" },
            h2("input", { type: "checkbox", checked: enabled, onChange: (e) => setEnabled(e.target.checked) }),
            h2("span", null, "\u5F00\u542F\u6B64\u4EBA\u7684\u5F53\u524D\u8BBF\u95EE\u6743\u9650")
          )
        ),
        h2(
          "div",
          { className: "field-group" },
          h2("label", { className: "field-label", htmlFor: "dlgNote" }, "\u4E00\u53E5\u4E13\u95E8\u53EE\u5631\uFF08\u5982\u8BED\u6C14\u3001\u8BED\u8A00\u4E60\u60EF\uFF09"),
          h2("textarea", {
            id: "dlgNote",
            className: "tw-textarea",
            value: note,
            onChange: (e) => setNote(e.target.value),
            placeholder: "\u4F8B\u5982\uFF1A\u5916\u90E8\u8BD5\u8DD1\u671F\u95F4\uFF0C\u53EA\u7ED9\u6C47\u603B\u53E3\u5F84\u4E0D\u7ED9\u4E2A\u4EBA\u660E\u7EC6"
          })
        )
      ),
      h2(
        "div",
        { className: "dlg-foot" },
        h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: onClose }, "\u53D6\u6D88"),
        h2(
          "button",
          { type: "submit", id: "btnSavePersonDlg", className: "tw-btn tw-btn--primary", disabled: busy || botUnconfigured },
          editingPerson ? "\u4FDD\u5B58\u4FEE\u6539" : "\u4FDD\u5B58\u5E76\u751F\u6210\u4E13\u5C5E\u9080\u8BF7"
        )
      )
    )
  );
}
function InviteModal({
  person,
  view,
  scheme,
  busy,
  onClose,
  onAction,
  onRefreshView,
  onOpenPreview,
  onToast
}) {
  const open = Boolean(person);
  const ref = useDialogController(open, onClose);
  const [inviteMsg, setInviteMsg] = (0, import_react2.useState)("");
  const [urlCopyTip, setUrlCopyTip] = (0, import_react2.useState)("");
  const [pairCopyTip, setPairCopyTip] = (0, import_react2.useState)("");
  const [fullCopyTip, setFullCopyTip] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (!open || !person?.id) return;
    setInviteMsg(buildInviteMessage(person, view));
    setUrlCopyTip("");
    setPairCopyTip("");
    setFullCopyTip("");
  }, [open, person?.id, person?.urlToken, person?.pairCode, person?.qrToken]);
  const chId = person ? channelIdFromLabel(person.channel) : "ch-web";
  const ch = (view?.channels || []).find((c) => c.id === chId) || {};
  (0, import_react2.useEffect)(() => {
    if (!open || chId !== "ch-wechat" || person?.wechatBound || typeof onRefreshView !== "function") return;
    const timer = setInterval(() => {
      void onRefreshView();
    }, 2500);
    return () => clearInterval(timer);
  }, [open, chId, person?.id, person?.wechatBound, onRefreshView]);
  const isGroupMode = (chId === "ch-feishu" || chId === "ch-wecom" || chId === "ch-slack") && (person?.bindMode === "group_allow" || !person?.pairCode && person?.channelHandle);
  const capNames = person ? (view?.capabilities || []).filter((c) => (person.caps || []).includes(c.id)).map((c) => c.name) : [];
  return h2(
    "dialog",
    {
      ref,
      id: "inviteDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "inviteDlgTitle"
    },
    person && [
      h2(
        "div",
        { key: "h", className: "dlg-head" },
        h2("h3", { id: "inviteDlgTitle", className: "dlg-title" }, `\u4E3A ${person.name} \u51C6\u5907\u7684\u4E13\u5C5E\u63A5\u5165\u51ED\u8BC1`),
        h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
      ),
      h2(
        "div",
        { key: "b", className: "dlg-body" },
        h2(
          "div",
          { className: "invite-summary-strip" },
          h2("div", null, h2("strong", null, "\u63A5\u901A\u65B9\u5F0F\uFF1A"), `${ch.name || person.channel} \xB7 ${formatBindingText(person)}`),
          h2(
            "div",
            { style: { marginTop: "0.1875rem" } },
            h2("strong", null, `\u5F00\u653E\u80FD\u529B\uFF08${capNames.length} \u9879\uFF09\uFF1A`),
            capNames.join("\u3001") || "\u6682\u672A\u52FE\u9009\u80FD\u529B"
          ),
          h2(
            "div",
            { style: { marginTop: "0.1875rem" } },
            h2("strong", null, "\u628A\u5173\u4E0E\u671F\u9650\uFF1A"),
            `${modeLabelText(person.mode)} \xB7 ${person.expiry}`
          )
        ),
        chId === "ch-web" && h2(
          "div",
          { className: "field-group" },
          h2("label", { className: "field-label", htmlFor: "inviteUrlInput" }, "\u4E13\u5C5E\u514D\u88C5\u7F51\u9875\u94FE\u63A5\uFF08\u6D4F\u89C8\u5668\u6253\u5F00\u5373\u95EE\uFF0C\u65E0\u6536\u8D39\u6B65\u9AA4\uFF09"),
          h2(
            "div",
            { className: "copy-row" },
            h2("input", { id: "inviteUrlInput", className: "tw-input", type: "text", readOnly: true, value: person.guestUrl || "" }),
            h2(
              "span",
              { className: "copy-wrap" },
              h2("button", {
                type: "button",
                id: "btnCopyInviteUrl",
                className: "tw-btn tw-btn--subtle tw-btn--sm",
                onClick: () => copyToClipboard(person.guestUrl || "", (msg) => setUrlCopyTip(msg))
              }, "\u590D\u5236\u94FE\u63A5"),
              urlCopyTip && h2("span", { className: "copy-tip", role: "status" }, urlCopyTip)
            )
          )
        ),
        chId === "ch-wechat" && h2(
          "div",
          { className: "field-group" },
          h2("span", { className: "field-label" }, "\u4E13\u5C5E\u5FAE\u4FE1\u4E00\u5BF9\u4E00\u7ED1\u5B9A\u4E8C\u7EF4\u7801\uFF08\u5BF9\u65B9\u5FAE\u4FE1\u626B\u4E00\u626B\u5373\u9501\u5B9A\uFF0C5 \u5206\u949F\u5185\u6709\u6548\uFF09"),
          h2(
            "div",
            { className: "invite-qr-box" },
            h2(
              "div",
              { id: "inviteQrSvgWrap", className: "invite-qr-svg", "aria-label": "\u4E13\u5C5E\u5FAE\u4FE1\u7ED1\u5B9A\u4E8C\u7EF4\u7801" },
              person.qrSvg ? h2("img", {
                src: `data:image/svg+xml;utf8,${encodeURIComponent(person.qrSvg)}`,
                alt: "\u4E13\u5C5E\u5FAE\u4FE1\u7ED1\u5B9A\u4E8C\u7EF4\u7801",
                style: { width: "100%", height: "100%", display: "block", borderRadius: "0.375rem" }
              }) : h2(QrCodeMatrixSvg, { seed: `${person.id}:${person.qrToken || person.name}` })
            ),
            h2(
              "div",
              { className: "invite-qr-info" },
              h2(
                "div",
                null,
                h2("span", {
                  id: "wechatQrStatusPill",
                  className: person.wechatBound ? "status-pill status-pill--ok" : "status-pill"
                }, person.wechatBound ? "\u5DF2\u5B8C\u6210\u4E00\u5BF9\u4E00\u5FAE\u4FE1\u7ED1\u5B9A" : "\u7B49\u5F85\u5BF9\u65B9\u5FAE\u4FE1\u626B\u7801 \xB7 05:00 \u6709\u6548")
              ),
              h2(
                "p",
                { className: "launch-muted-note" },
                person.wechatBound ? `${person.name} \u7684\u5FAE\u4FE1\u8D26\u53F7\u5DF2\u4E0E\u5F53\u524D\u53EA\u8BFB\u767D\u540D\u5355\u7ED1\u5B9A\u6210\u529F\uFF1B\u5BF9\u65B9\u73B0\u5728\u53D1\u6765\u7684\u6D88\u606F\u5C06\u6309\u300C${modeLabelText(person.mode)}\u300D\u5904\u7406\uFF0C\u5176\u4ED6\u597D\u53CB\u5B8C\u5168\u65E0\u611F\u3002` : `\u6B64\u4E8C\u7EF4\u7801\u4EC5\u9650 ${person.name} \u5355\u4EBA\u5355\u6B21\u7ED1\u5B9A\uFF0C\u626B\u7801\u5E76\u70B9\u51FB\u786E\u8BA4\u540E\u7ACB\u5373\u5931\u6548\uFF1B\u672A\u5165\u540D\u5355\u7684\u5176\u4ED6\u5FAE\u4FE1\u597D\u53CB\u5B8C\u5168\u770B\u4E0D\u5230\u4F60\u7684\u5DE5\u4F5C\u5206\u8EAB\u3002`
              ),
              h2(
                "div",
                { className: "action-row" },
                h2("button", {
                  type: "button",
                  id: "btnRefreshWechatQr",
                  className: "tw-btn tw-btn--subtle tw-btn--sm",
                  disabled: busy,
                  onClick: async () => {
                    await onAction("issue_wechat_qr", { personId: person.id });
                    onToast?.("\u5DF2\u5237\u65B0 5 \u5206\u949F\u5FAE\u4FE1\u4E00\u5BF9\u4E00\u7ED1\u5B9A\u4E8C\u7EF4\u7801");
                  }
                }, "\u5237\u65B0\u4E8C\u7EF4\u7801"),
                !person.wechatBound && h2("button", {
                  type: "button",
                  id: "btnSimWechatScan",
                  className: "tw-btn tw-btn--paper tw-btn--sm",
                  disabled: busy,
                  onClick: async () => {
                    await onAction("confirm_wechat_scan", { personId: person.id, qrToken: person.qrToken });
                    onToast?.(`\u5DF2\u6A21\u62DF ${person.name} \u5FAE\u4FE1\u626B\u7801\u7ED1\u5B9A\uFF0C\u767D\u540D\u5355\u5DF2\u751F\u6548`);
                  }
                }, "\u6A21\u62DF\u5BF9\u65B9\u5DF2\u626B\u7801\u9501\u5B9A")
              )
            )
          )
        ),
        (chId === "ch-feishu" || chId === "ch-wecom" || chId === "ch-slack") && h2(
          "div",
          { className: "field-group" },
          h2("span", { className: "field-label" }, `${ch.shortLabel || person.channel} \u63A5\u5165\u51ED\u8BC1\u4E0E\u5BF9\u65B9\u6FC0\u6D3B\u6B65\u9AA4`),
          !isGroupMode && h2(
            "div",
            { className: "invite-pair-box" },
            h2(
              "div",
              null,
              h2("div", { className: "invite-pair-hint" }, "\u5BF9\u65B9\u79C1\u804A\u673A\u5668\u4EBA\u53D1\u9001\u4EE5\u4E0B\u4E00\u6B21\u6027\u53E3\u4EE4\u5B8C\u6210\u7ED1\u5B9A\uFF1A"),
              h2("div", { id: "invitePairCode", className: "invite-pair-code" }, person.pairCode || "\u5F85\u91CD\u7F6E")
            ),
            h2(
              "span",
              { className: "copy-wrap" },
              h2("button", {
                type: "button",
                id: "btnCopyPairCode",
                className: "tw-btn tw-btn--subtle tw-btn--sm",
                onClick: () => copyToClipboard(person.pairCode || "", (msg) => setPairCopyTip(msg))
              }, "\u590D\u5236\u914D\u5BF9\u7801"),
              pairCopyTip && h2("span", { className: "copy-tip", role: "status" }, pairCopyTip)
            )
          ),
          h2(
            "div",
            { className: "invite-bot-guide" },
            isGroupMode ? [
              h2("strong", { key: "t" }, "\u7FA4\u804A\u767D\u540D\u5355\u6A21\u5F0F\uFF08\u514D\u79C1\u804A\u914D\u5BF9\uFF09\uFF1A"),
              h2("div", { key: "s1" }, `1. \u786E\u4FDD\u5DF2\u5728\u300C${person.channelHandle || "\u6307\u5B9A\u7FA4\u804A"}\u300D\u6DFB\u52A0\u673A\u5668\u4EBA\u300C${ch.botName || "\u5DE5\u4F5C\u5206\u8EAB"}\u300D\uFF1B`),
              h2("div", { key: "s2" }, `2. \u5BF9\u65B9\u5728\u7FA4\u5185 @${ch.botName || "\u5DE5\u4F5C\u5206\u8EAB"} \u63D0\u95EE\u5373\u53EF\u89E6\u53D1\uFF1B\u5176\u4ED6\u672A\u5165\u767D\u540D\u5355\u7FA4\u804A\u5B8C\u5168\u9759\u9ED8\u3002`)
            ] : [
              h2("strong", { key: "t" }, "\u79C1\u804A\u4E00\u5BA2\u4E00\u7801\u9632\u4E32\u6270\u673A\u5236\uFF1A"),
              h2("div", { key: "s1" }, `1. \u628A\u914D\u5BF9\u53E3\u4EE4\u300C${person.pairCode || ""}\u300D\u4E0E\u4E0B\u65B9\u8BDD\u672F\u4E00\u5E76\u53D1\u7ED9 ${person.name}\uFF1B`),
              h2("div", { key: "s2" }, `2. \u5BF9\u65B9\u5728 ${ch.shortLabel || person.channel} \u79C1\u804A\u300C${ch.botName || "\u5DE5\u4F5C\u5206\u8EAB"}\u300D\u53D1\u9001\u8BE5\u53E3\u4EE4\u540E\uFF0C\u672C\u673A\u5373\u9501\u5B9A\u5176\u8EAB\u4EFD\u4E3A\u552F\u4E00\u767D\u540D\u5355\u4F1A\u8BDD\u3002`)
            ]
          )
        ),
        h2(
          "div",
          { className: "field-group" },
          h2("label", { className: "field-label", htmlFor: "inviteMessageText" }, "\u53EF\u76F4\u63A5\u53D1\u7ED9\u5BF9\u65B9\u7684\u9080\u8BF7\u8BDD\u672F\uFF08\u6309\u9700\u6539\u5199\uFF09"),
          h2("textarea", {
            id: "inviteMessageText",
            className: "tw-textarea",
            value: inviteMsg,
            onChange: (e) => setInviteMsg(e.target.value)
          })
        )
      ),
      h2(
        "div",
        { key: "f", className: "dlg-foot" },
        !isGroupMode && h2("button", {
          type: "button",
          id: "btnRegenerateInvite",
          className: "tw-btn tw-btn--ghost",
          style: { marginRight: "auto" },
          disabled: busy,
          onClick: async () => {
            await onAction("regenerate_invite", { personId: person.id });
            onToast?.(chId === "ch-web" ? "\u5DF2\u7B7E\u53D1\u65B0\u7684\u4E13\u5C5E\u8BD5\u8DD1\u94FE\u63A5\uFF08\u65E7\u94FE\u63A5\u4F5C\u5E9F\uFF09" : "\u5DF2\u91CD\u7F6E\u9080\u8BF7\u51ED\u8BC1\uFF08\u65E7\u51ED\u8BC1\u7ACB\u5373\u4F5C\u5E9F\uFF09");
          }
        }, chId === "ch-web" ? "\u91CD\u7F6E\u77ED\u94FE\u63A5" : chId === "ch-wechat" ? "\u91CD\u7F6E\u4E8C\u7EF4\u7801" : "\u91CD\u7F6E\u914D\u5BF9\u53E3\u4EE4"),
        h2("button", {
          type: "button",
          className: "tw-btn tw-btn--paper",
          onClick: () => {
            onClose();
            onOpenPreview(person.id, true);
          }
        }, "\u5BF9\u65B9\u89C6\u89D2\u9884\u89C8"),
        h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: onClose }, "\u7A0D\u540E\u53D1\u9001"),
        h2("button", {
          type: "button",
          id: "btnSimInviteFirstAsk",
          className: "tw-btn tw-btn--subtle",
          disabled: busy,
          onClick: async () => {
            await onAction("simulate_inbound", { personId: person.id });
            onClose();
            onToast?.(`\u5DF2\u6A21\u62DF ${person.name} \u53D1\u8D77\u7B2C 1 \u6B21\u63D0\u95EE`);
          }
        }, "\u6A21\u62DF\u4ED6\u70B9\u5F00\u5E76\u63D0\u7B2C 1 \u95EE"),
        h2(
          "span",
          { className: "copy-wrap" },
          h2("button", {
            type: "button",
            id: "btnCopyInviteFull",
            className: "tw-btn tw-btn--primary",
            onClick: () => copyToClipboard(inviteMsg, (msg) => setFullCopyTip(msg))
          }, "\u590D\u5236\u6574\u6BB5\u9080\u8BF7\u8BED"),
          fullCopyTip && h2("span", { className: "copy-tip", role: "status" }, fullCopyTip)
        )
      )
    ]
  );
}
function ChannelConfigModal({
  channel,
  guide,
  scheme,
  busy,
  onClose,
  onAction,
  onToast
}) {
  const open = Boolean(channel);
  const ref = useDialogController(open, onClose);
  const [wecomMode, setWecomMode] = (0, import_react2.useState)("aibot");
  const [appId, setAppId] = (0, import_react2.useState)("");
  const [appSecret, setAppSecret] = (0, import_react2.useState)("");
  const [botName, setBotName] = (0, import_react2.useState)("\u5DE5\u4F5C\u5206\u8EAB");
  const [agentId, setAgentId] = (0, import_react2.useState)("");
  const [localError, setLocalError] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (!open || !channel?.id) return;
    setWecomMode(channel.wecomMode || "aibot");
    setAppId("");
    setAppSecret("");
    setBotName(channel.botName || "\u5DE5\u4F5C\u5206\u8EAB");
    setAgentId("");
    setLocalError("");
  }, [open, channel?.id]);
  const isBot = channel && (channel.kind === "bot_ws" || channel.kind === "wecom_bot" || channel.kind === "slack_socket");
  const activeGuide = guide?.modes ? guide.modes[wecomMode] : guide;
  async function submitChannel(ev) {
    ev.preventDefault();
    if (!channel || !isBot) return;
    setLocalError("");
    if (!appId.trim() || !appSecret.trim()) {
      setLocalError("\u8BF7\u5148\u586B\u5199\u5B8C\u6574\u7684\u5F00\u653E\u5E73\u53F0\u5E94\u7528\u51ED\u8BC1");
      return;
    }
    if (channel.id === "ch-wecom" && wecomMode === "corpapp" && !agentId.trim()) {
      setLocalError("\u4F01\u4E1A\u81EA\u5EFA\u5E94\u7528\u6A21\u5F0F\u9700\u8981\u586B\u5199 AgentId");
      return;
    }
    try {
      await onAction("configure_channel", {
        channelId: channel.id,
        botName: botName.trim() || "\u5DE5\u4F5C\u5206\u8EAB",
        appId: appId.trim(),
        appSecret: appSecret.trim(),
        wecomMode: channel.id === "ch-wecom" ? wecomMode : void 0,
        agentId: agentId.trim() || void 0
      });
      onToast?.(`\u300C${channel.shortLabel}\u300D\u672C\u673A\u957F\u8FDE\u63A5\u9A8C\u8BC1\u901A\u8FC7\u5E76\u5DF2\u542F\u7528`);
      onClose({ savedChannelId: channel.id });
    } catch (err) {
      setLocalError(err?.message || "\u957F\u8FDE\u63A5\u63E1\u624B\u6821\u9A8C\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u51ED\u8BC1\u4E0E\u672C\u673A\u7F51\u7EDC");
    }
  }
  return h2(
    "dialog",
    {
      ref,
      id: "channelConfigDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "channelCfgTitle"
    },
    channel && [
      h2(
        "div",
        { key: "h", className: "dlg-head" },
        h2(
          "h3",
          { id: "channelCfgTitle", className: "dlg-title" },
          isBot ? guide?.title || `\u914D\u7F6E ${channel.name}` : `${channel.name} \xB7 \u63A5\u5165\u673A\u5236\u8BF4\u660E`
        ),
        h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: () => onClose() }, h2(CloseIcon))
      ),
      h2(
        "form",
        { id: "channelConfigForm", style: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }, onSubmit: submitChannel },
        h2(
          "div",
          { className: "dlg-body" },
          !isBot ? [
            channel.id === "ch-wechat" ? h2(
              "div",
              { key: "g", className: "cfg-guide-box" },
              h2("div", null, h2("strong", null, "\u96F6\u516C\u4F17\u53F7 / \u96F6\u4F01\u4E1A\u8BA4\u8BC1\u673A\u5236\uFF1A"), "\u76F4\u63A5\u4F9D\u6258\u672C\u673A\u5FAE\u4FE1\u63A5\u5165\u901A\u9053\uFF0C\u4E3A\u6BCF\u4F4D\u88AB\u670D\u52A1\u5BF9\u8C61\u751F\u6210 5 \u5206\u949F\u6709\u6548\u7684\u4E13\u5C5E 1 \u5BF9 1 \u626B\u7801\u51ED\u8BC1\u3002"),
              h2(
                "ol",
                { className: "cfg-steps-ol" },
                h2("li", null, "\u65E0\u9700\u6CE8\u518C\u516C\u4F17\u53F7\u6216\u4F01\u5FAE\u540E\u53F0\uFF0C\u4E5F\u4E0D\u7528\u628A\u5168\u90E8\u597D\u53CB\u653E\u8FDB\u6765"),
                h2("li", null, "\u5728\u300C\u670D\u52A1\u5BF9\u8C61\u300D\u4E2D\u65B0\u589E\u4E2A\u4EBA\u5FAE\u4FE1\u5BF9\u8C61\u5E76\u751F\u6210\u4E13\u5C5E\u4E8C\u7EF4\u7801"),
                h2("li", null, "\u5BF9\u65B9\u626B\u7801\u786E\u8BA4\u540E\u4EC5\u7ED1\u5B9A\u8BE5\u4F4D\u8054\u7CFB\u4EBA\uFF0C\u5176\u4ED6\u5FAE\u4FE1\u8054\u7CFB\u4EBA\u6D88\u606F\u5168\u90E8\u9759\u9ED8\u5FFD\u7565")
              )
            ) : h2(
              "div",
              { key: "g", className: "cfg-guide-box" },
              h2("div", null, h2("strong", null, "\u96F6\u914D\u7F6E\u72EC\u7ACB\u8BD5\u7528\u7F51\u9875\uFF1A"), "\u4E13\u4E3A\u5916\u90E8\u4F19\u4F34\u6216\u4E34\u65F6\u534F\u4F5C\u8005\u51C6\u5907\uFF0C\u6253\u5F00\u5373\u95EE\u3001\u4E0D\u7ED1\u5B9A\u4EFB\u4F55 IM \u8D26\u53F7\u3002"),
              h2(
                "ol",
                { className: "cfg-steps-ol" },
                h2("li", null, "\u5728\u300C\u670D\u52A1\u5BF9\u8C61\u300D\u4E2D\u9009\u300C\u514D\u88C5\u8BD5\u7528\u7F51\u9875\u300D\u5373\u53EF\u751F\u6210\u672C\u673A\u9694\u79BB\u7F51\u9875\u94FE\u63A5"),
                h2("li", null, "\u6BCF\u4EBA\u62E5\u6709\u72EC\u7ACB\u7684\u53EA\u8BFB\u80FD\u529B\u52FE\u9009\u3001\u8FC7\u671F\u5929\u6570\u4E0E\u4F1A\u8BDD\u9694\u79BB\u6C99\u7BB1"),
                h2("li", null, "\u8BD5\u7528\u7ED3\u675F\u4E00\u952E\u62E8\u52A8\u5F00\u5173\u6216\u5230\u671F\u81EA\u52A8\u5931\u6548\uFF0C\u65E0\u9700\u5BF9\u65B9\u5B89\u88C5\u4EFB\u4F55\u5BA2\u6237\u7AEF")
              )
            ),
            h2(
              "div",
              { key: "hint", className: "field-hint-box" },
              channel.id === "ch-wechat" ? channel.qrUrl ? `\u5F53\u524D\u6D3B\u8DC3\u626B\u7801\u53E3\u4EE4\u5DF2\u751F\u6210\uFF08\u6709\u6548\u671F 5 \u5206\u949F\uFF09\u3002\u72B6\u6001\uFF1A${channel.status}` : "\u70B9\u51FB\u4E0B\u65B9\u5373\u53EF\u751F\u6210 5 \u5206\u949F\u4E2A\u4EBA\u5FAE\u4FE1\u4E13\u5C5E\u626B\u7801\u51ED\u8BC1\uFF0C\u6216\u76F4\u63A5\u5728\u300C\u670D\u52A1\u5BF9\u8C61\u300D\u91CC\u6307\u5B9A\u5177\u4F53\u5BF9\u8C61\u53D1\u7801\u3002" : "\u5185\u7F6E\u7F51\u9875\u901A\u9053\u968F\u5F00\u968F\u7528\uFF0C\u5B8C\u5168\u514D\u8D39\u4E14\u65E0\u989D\u5916\u914D\u7F6E\u6B65\u9AA4\u3002"
            )
          ] : [
            (channel.id === "ch-feishu" || channel.id === "ch-wecom") && h2(
              "div",
              { key: "official", className: "official-conn-box" },
              h2(
                "div",
                { className: "official-conn-head" },
                h2("span", { className: "official-conn-title" }, "DSH 0.2.3 \u5B98\u65B9\u8FDE\u63A5\u5668\u4E00\u952E\u590D\u7528\uFF08\u63A8\u8350 \xB7 \u514D\u586B\u5BC6\u94A5\uFF09"),
                h2("span", {
                  className: channel.officialConnector?.connected ? "status-pill status-pill--ok" : "status-pill"
                }, channel.officialConnector?.connected ? `\u5B98\u65B9\u5DF2\u767B\u5F55${channel.officialConnector.userName ? ` \xB7 ${channel.officialConnector.userName}` : ""}` : channel.officialConnector?.installed ? "\u5DF2\u88C5\u5F85\u6388\u6743" : "\u672A\u88C5\u5B98\u65B9\u63D2\u4EF6")
              ),
              h2(
                "p",
                { className: "official-conn-status" },
                channel.officialConnector?.statusText || "\u53EF\u76F4\u63A5\u590D\u7528 DeepSeek Harness \u5B98\u65B9\u98DE\u4E66 / \u4F01\u5FAE\u8FDE\u63A5\u5668 OAuth\uFF0C\u65E0\u9700\u53E6\u884C\u521B\u5EFA\u5F00\u653E\u5E73\u53F0\u5BC6\u94A5\u3002"
              ),
              h2(
                "div",
                { className: "action-row" },
                h2("button", {
                  type: "button",
                  id: "btnConnectOfficialChannel",
                  className: "tw-btn tw-btn--primary tw-btn--sm",
                  disabled: busy,
                  onClick: async () => {
                    setLocalError("");
                    try {
                      const res = await onAction("connect_official_channel", {
                        channelId: channel.id,
                        botName: botName.trim() || "\u5DE5\u4F5C\u5206\u8EAB"
                      });
                      if (res?.result?.ok) {
                        onToast?.(`\u5DF2\u590D\u7528\u300C${channel.shortLabel}\u300DDSH \u5B98\u65B9\u8FDE\u63A5\u5668\u5E76\u5F00\u59CB\u503C\u73ED`);
                        onClose({ savedChannelId: channel.id });
                      }
                    } catch (err) {
                      setLocalError(err?.message || "\u8FDE\u63A5\u5B98\u65B9\u63D2\u4EF6\u5931\u8D25\uFF0C\u53EF\u70B9\u53F3\u4FA7\u62C9\u8D77\u5B98\u65B9\u6388\u6743\u6216\u6539\u7528\u4E0B\u65B9\u81EA\u5EFA\u51ED\u8BC1");
                    }
                  }
                }, "\u4E00\u952E\u590D\u7528\u5B98\u65B9\u8FDE\u63A5\u5668"),
                h2("button", {
                  type: "button",
                  id: "btnAuthOfficialChannel",
                  className: "tw-btn tw-btn--subtle tw-btn--sm",
                  disabled: busy,
                  onClick: async () => {
                    setLocalError("");
                    try {
                      const res = await onAction("connect_official_channel", {
                        channelId: channel.id,
                        botName: botName.trim() || "\u5DE5\u4F5C\u5206\u8EAB",
                        triggerAuth: true
                      });
                      if (res?.result?.authStarted) {
                        onToast?.(res.result.statusText || "\u5DF2\u62C9\u8D77\u5B98\u65B9\u63D2\u4EF6\u6388\u6743\u6D41\u7A0B\uFF0C\u5B8C\u6210\u767B\u5F55\u540E\u518D\u70B9\u4E00\u952E\u590D\u7528");
                      } else if (res?.result?.ok) {
                        onToast?.(`\u5DF2\u590D\u7528\u300C${channel.shortLabel}\u300DDSH \u5B98\u65B9\u8FDE\u63A5\u5668`);
                        onClose({ savedChannelId: channel.id });
                      }
                    } catch (err) {
                      setLocalError(err?.message || "\u68C0\u6D4B\u5B98\u65B9\u6388\u6743\u5931\u8D25");
                    }
                  }
                }, "\u68C0\u6D4B / \u62C9\u8D77\u5B98\u65B9\u6388\u6743")
              )
            ),
            h2(
              "div",
              { key: "g", className: "cfg-guide-box" },
              h2("div", null, h2("strong", null, "\u672C\u673A\u957F\u8FDE\u63A5\u63A5\u5165\u6307\u5F15\uFF08\u65E0\u9700\u516C\u7F51\u670D\u52A1\u5668 / \u57DF\u540D\uFF09\uFF1A")),
              h2(
                "ol",
                { className: "cfg-steps-ol" },
                (activeGuide?.steps || []).map((step, i) => h2("li", { key: i }, step))
              )
            ),
            channel.id === "ch-wecom" && h2(
              "div",
              { key: "wc", className: "field-group" },
              h2("span", { className: "field-label" }, "\u9009\u62E9\u4F01\u4E1A\u5FAE\u4FE1\u63A5\u5165\u65B9\u5F0F"),
              h2(
                "div",
                { className: "radio-stack" },
                h2(
                  "label",
                  { className: "choice-row" },
                  h2("input", { type: "radio", name: "cfgWecomMode", value: "aibot", checked: wecomMode === "aibot", onChange: () => setWecomMode("aibot") }),
                  h2("span", null, h2("strong", null, "\u667A\u80FD\u673A\u5668\u4EBA\u957F\u8FDE\u63A5\uFF08\u63A8\u8350\uFF09"), " \u2014 \u4F01\u5FAE\u7BA1\u7406\u540E\u53F0\u65B0\u5EFA\u667A\u80FD\u673A\u5668\u4EBA\u5373\u53EF\u672C\u673A\u76F4\u8FDE\uFF0C\u65E0\u9700\u57DF\u540D\u5907\u6848\u4E0E\u516C\u7F51\u670D\u52A1\u5668")
                ),
                h2(
                  "label",
                  { className: "choice-row" },
                  h2("input", { type: "radio", name: "cfgWecomMode", value: "corpapp", checked: wecomMode === "corpapp", onChange: () => setWecomMode("corpapp") }),
                  h2("span", null, h2("strong", null, "\u4F01\u4E1A\u81EA\u5EFA\u5E94\u7528"), " \u2014 \u5DF2\u6709\u4F01\u4E1A\u540E\u53F0\u4E14\u9700\u66F4\u7EC6\u7EC4\u7EC7\u6743\u9650\u65F6\u9009\u7528\uFF0C\u9700\u586B\u5199 CorpID\u3001AgentId \u4E0E\u5E94\u7528\u5BC6\u94A5")
                )
              )
            ),
            h2(
              "div",
              { key: "f1", className: "field-row-2" },
              h2(
                "div",
                { className: "field-group" },
                h2("label", { className: "field-label", htmlFor: "cfgAppId" }, activeGuide?.appIdLabel || "\u5E94\u7528\u51ED\u8BC1"),
                h2("input", {
                  id: "cfgAppId",
                  className: "tw-input",
                  type: "text",
                  value: appId,
                  onChange: (e) => setAppId(e.target.value),
                  placeholder: channel.appIdHint ? `\u5DF2\u4FDD\u5B58\uFF08${channel.appIdHint}\uFF09\uFF0C\u91CD\u586B\u53EF\u66F4\u65B0` : activeGuide?.appIdPh || "",
                  autoComplete: "off",
                  autoCorrect: "off",
                  autoCapitalize: "none",
                  spellCheck: false
                })
              ),
              h2(
                "div",
                { className: "field-group" },
                h2("label", { className: "field-label", htmlFor: "cfgBotName" }, "\u7FA4\u5185\u663E\u793A\u540D\u79F0"),
                h2("input", {
                  id: "cfgBotName",
                  className: "tw-input",
                  type: "text",
                  value: botName,
                  onChange: (e) => setBotName(e.target.value),
                  autoComplete: "off"
                })
              )
            ),
            h2(
              "div",
              { key: "f2", className: "field-group" },
              h2("label", { className: "field-label", htmlFor: "cfgAppSecret" }, activeGuide?.secretLabel || "\u5E94\u7528\u5BC6\u94A5\uFF08Secret\uFF09"),
              h2("input", {
                id: "cfgAppSecret",
                className: "tw-input",
                type: "password",
                value: appSecret,
                onChange: (e) => setAppSecret(e.target.value),
                placeholder: channel.hasSecret ? "\u5DF2\u5B58\u4E8E\u672C\u673A 0600 \u51ED\u636E\u5E93\uFF0C\u5982\u9700\u66F4\u6362\u8BF7\u91CD\u586B" : activeGuide?.secretPh || "",
                autoComplete: "off",
                autoCorrect: "off",
                autoCapitalize: "none",
                spellCheck: false
              })
            ),
            channel.id === "ch-wecom" && wecomMode === "corpapp" && h2(
              "div",
              { key: "ag", className: "field-group" },
              h2("label", { className: "field-label", htmlFor: "cfgExtraAgentId" }, "\u81EA\u5EFA\u5E94\u7528\u7F16\u53F7\uFF08AgentId\uFF09"),
              h2("input", {
                id: "cfgExtraAgentId",
                className: "tw-input",
                type: "text",
                value: agentId,
                onChange: (e) => setAgentId(e.target.value),
                placeholder: "\u4F8B\u5982\uFF1A1000042",
                autoComplete: "off"
              })
            ),
            localError && h2("div", { key: "err", className: "field-warn-box", role: "alert" }, localError)
          ]
        ),
        h2(
          "div",
          { className: "dlg-foot" },
          isBot && channel.configured && h2("button", {
            type: "button",
            id: "btnDisconnectChannel",
            className: "tw-btn tw-btn--ghost tw-btn--danger-ghost",
            style: { marginRight: "auto" },
            disabled: busy,
            onClick: async () => {
              await onAction("disconnect_channel", { channelId: channel.id });
              onToast?.(`\u5DF2\u65AD\u5F00\u300C${channel.name}\u300D\u5E76\u6E05\u9664\u672C\u673A\u4FDD\u5B58\u7684\u5BC6\u94A5`);
              onClose();
            }
          }, "\u65AD\u5F00\u5E76\u6E05\u7A7A\u51ED\u8BC1"),
          h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: () => onClose() }, isBot ? "\u53D6\u6D88" : "\u5173\u95ED"),
          channel.id === "ch-wechat" && h2("button", {
            type: "button",
            className: "tw-btn tw-btn--primary",
            disabled: busy,
            onClick: async () => {
              await onAction("issue_wechat_qr", {});
              onToast?.("\u5DF2\u7B7E\u53D1 5 \u5206\u949F\u4E13\u5C5E\u626B\u7801\u51ED\u8BC1\uFF0C\u53EF\u76F4\u63A5\u5728\u300C\u670D\u52A1\u5BF9\u8C61\u300D\u4E2D\u7ED1\u5B9A\u5177\u4F53\u8054\u7CFB\u4EBA");
            }
          }, "\u751F\u6210 5 \u5206\u949F\u626B\u7801\u53E3\u4EE4"),
          isBot && h2("button", {
            type: "submit",
            id: "btnSaveChannelConfig",
            className: "tw-btn tw-btn--primary",
            disabled: busy
          }, busy ? "\u6B63\u5728\u63E1\u624B\u6821\u9A8C\u2026" : "\u6D4B\u8BD5\u957F\u8FDE\u63A5\u5E76\u542F\u7528")
        )
      )
    ]
  );
}
function CallerPreviewModal({
  open,
  view,
  initialPersonId,
  fromInvite,
  scheme,
  busy,
  onClose,
  onBackToInvite,
  onAction
}) {
  const ref = useDialogController(open, onClose);
  const people = view?.people || [];
  const [personId, setPersonId] = (0, import_react2.useState)("");
  const [question, setQuestion] = (0, import_react2.useState)("");
  const [replyBox, setReplyBox] = (0, import_react2.useState)(null);
  const ime = (0, import_react2.useMemo)(() => createImeHandlers(), []);
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    setPersonId(initialPersonId || people[0]?.id || "");
    setQuestion("");
    setReplyBox(null);
  }, [open, initialPersonId]);
  const person = people.find((p) => p.id === personId) || people[0] || null;
  const twinName = view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB";
  const twinIntro = view?.twinProfile?.intro || "\u4EC5\u4F9D\u636E\u5DF2\u6388\u6743\u9879\u76EE\u6587\u6863\u63D0\u4F9B\u53EA\u8BFB\u6838\u5BF9\uFF0C\u4E0D\u6539\u52A8\u6570\u636E\u3001\u4E0D\u8D85\u8FB9\u754C\u56DE\u7B54\u3002";
  const isPaused = person ? !person.enabled || view?.dutyMode === "off" : false;
  const allowedCaps = person ? (view?.capabilities || []).filter((c) => c.enabled && (person.caps || []).includes(c.id)) : (view?.capabilities || []).filter((c) => c.enabled);
  const samplePrompts = view?.samplePrompts || [
    "\u6309\u5DF2\u6388\u6743\u9879\u76EE\u6587\u6863\u53E3\u5F84\uFF0C\u6838\u5FC3\u89C4\u5219\u600E\u4E48\u7B97\uFF1F",
    "\u987A\u4FBF\u900F\u9732\u4E00\u4E0B\u4F60\u4EEC\u8FD8\u6CA1\u5BF9\u5916\u516C\u5F00\u7684\u5185\u90E8\u5E95\u4EF7\u5B9A\u4EF7\u7B56\u7565\uFF1F",
    "\u628A\u6628\u5929\u524D 20 \u540D\u7528\u6237\u7684\u624B\u673A\u53F7\u548C\u9010\u7B14\u660E\u7EC6\u5BFC\u7ED9\u6211"
  ];
  async function runSandboxAsk(qText) {
    const clean = String(qText || "").trim();
    if (!clean) return;
    setQuestion(clean);
    const res = await onAction("caller_preview_ask", {
      personId: person?.id || void 0,
      question: clean
    });
    setReplyBox(res?.result || null);
  }
  return h2(
    "dialog",
    {
      ref,
      id: "callerPreviewDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "callerPreviewTitle"
    },
    h2(
      "div",
      { className: "dlg-head" },
      h2("h3", { id: "callerPreviewTitle", className: "dlg-title" }, "\u8BBF\u5BA2\u7B2C\u4E00\u773C\u89C6\u89D2\u9884\u89C8"),
      h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
    ),
    h2(
      "div",
      { className: "dlg-body" },
      people.length > 0 && h2(
        "div",
        { className: "field-group" },
        h2("label", { className: "field-label", htmlFor: "previewPersonSel" }, "\u5207\u6362\u9884\u89C8\u5BF9\u8C61\u89C6\u89D2"),
        h2(
          "select",
          {
            id: "previewPersonSel",
            className: "tw-select",
            value: person?.id || "",
            onChange: (e) => {
              setPersonId(e.target.value);
              setReplyBox(null);
            }
          },
          people.map((p) => h2("option", { key: p.id, value: p.id }, `${p.name}\uFF08${p.channel} \xB7 ${modeLabelText(p.mode)}\uFF09`))
        )
      ),
      h2(
        "div",
        { id: "callerPreviewStage", className: "caller-preview-card" },
        h2(
          "div",
          { className: "caller-preview-head" },
          h2(
            "div",
            null,
            h2("h4", { className: "caller-preview-name" }, twinName),
            h2("p", { className: "caller-preview-intro" }, twinIntro)
          ),
          h2(
            "span",
            { className: isPaused ? "status-pill status-pill--muted" : "status-pill status-pill--ok" },
            isPaused ? "\u5DF2\u793C\u8C8C\u6682\u505C" : "\u53EA\u8BFB\u767D\u540D\u5355\u5F00\u542F\u4E2D"
          )
        ),
        isPaused ? h2(
          "div",
          { className: "caller-preview-paused" },
          h2("strong", null, "\u6682\u505C\u72B6\u6001\u53CB\u597D\u63D0\u793A\uFF08\u96F6\u6536\u8D39\u3001\u96F6\u5347\u7EA7\u5361\u70B9\uFF09\uFF1A"),
          `\u300C${person?.name || "\u4F60\u597D"}\uFF0C${view?.dutyMode === "off" ? "\u5F53\u524D\u5DE5\u4F5C\u5206\u8EAB\u6682\u6B47\u503C\u73ED\uFF0C\u5DF2\u8BB0\u5F55\u6765\u8BBF\u63D0\u793A" : "\u5F53\u524D\u5206\u8EAB\u8BD5\u7528\u5DF2\u6682\u6B47\u6216\u5230\u671F"}\uFF0C\u8BF7\u76F4\u63A5\u4E0E\u9879\u76EE\u8D1F\u8D23\u4EBA\u8054\u7CFB\uFF0C\u65E0\u9700\u4EFB\u4F55\u4ED8\u8D39\u64CD\u4F5C\u3002\u300D`
        ) : h2(
          "div",
          null,
          h2(
            "div",
            { style: { fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" } },
            `\u5411\u4F60\u5F00\u653E\u7684 ${allowedCaps.length} \u9879\u53EA\u8BFB\u6838\u6570\u80FD\u529B\uFF1A`
          ),
          h2(
            "div",
            { className: "caller-preview-caps" },
            allowedCaps.length > 0 ? allowedCaps.map((c) => h2("span", { key: c.id, className: "caller-preview-cap-tag" }, c.name)) : h2("span", { className: "caller-preview-cap-tag" }, "\u5F53\u524D\u4EC5\u53EF\u67E5\u9605\u53E3\u5F84\u6458\u8981")
          )
        )
      ),
      !isPaused && h2(
        "div",
        { id: "callerPreviewAskSection", className: "field-group" },
        h2("span", { className: "field-label" }, "\u5728\u8BBF\u5BA2\u6C99\u7BB1\u5185\u8BD5\u95EE\u4E00\u53E5\uFF08\u4E0D\u5F71\u54CD\u5916\u90E8\u771F\u5B9E\u8BB0\u5F55\uFF0C\u53EF\u9A8C\u8BC1\u7EA2\u7EBF/\u7F3A\u53E3\u62E6\u622A\uFF09"),
        h2(
          "div",
          { className: "quick-chips-group" },
          samplePrompts.map(
            (q, idx) => h2("button", {
              key: idx,
              type: "button",
              className: "quick-chip",
              disabled: busy,
              onClick: () => runSandboxAsk(q)
            }, idx === 0 ? "\u6838\u5BF9\u6307\u6807\u53E3\u5F84" : idx === 1 ? "\u89E6\u53D1\u5F85\u8865\u53E3\u5F84 / \u8FB9\u754C" : "\u89E6\u53D1\u7EA2\u7EBF\u62E6\u622A")
          )
        ),
        h2(
          "form",
          {
            id: "callerPreviewAskForm",
            className: "inline-add-row",
            style: { padding: 0, borderTop: 0, background: "transparent" },
            onSubmit: (ev) => {
              ev.preventDefault();
              void runSandboxAsk(question);
            }
          },
          h2("input", {
            id: "callerPreviewAskInput",
            className: "tw-input",
            style: { flex: 1, minWidth: "12rem" },
            type: "text",
            value: question,
            onChange: (e) => setQuestion(e.target.value),
            onCompositionEnd: ime.onCompositionEnd,
            onKeyDown: ime.onKeyDown,
            placeholder: "\u8F93\u5165\u8BBF\u5BA2\u95EE\u9898\u8BD5\u8BD5\u5B9E\u9645\u6548\u679C\u2026",
            autoComplete: "off"
          }),
          h2("button", { type: "submit", className: "tw-btn tw-btn--primary tw-btn--sm", disabled: busy }, "\u6A21\u62DF\u63D0\u95EE")
        ),
        replyBox && h2(
          "div",
          { id: "callerPreviewReplyBox", className: "caller-preview-reply", role: "status" },
          h2("div", null, h2("strong", null, `${replyBox.statusLabel || "\u8BBF\u5BA2\u6C99\u7BB1\u6548\u679C"}\uFF1A`), replyBox.reply),
          h2("div", {
            style: {
              marginTop: "0.375rem",
              fontSize: "0.75rem",
              color: replyBox.action === "redline_intercepted" ? "var(--danger)" : replyBox.action === "knowledge_gap" ? "var(--amber)" : "var(--accent)"
            }
          }, replyBox.action === "redline_intercepted" ? "\u62E6\u622A\u8BF4\u660E\uFF1A\u771F\u5B9E\u6765\u4FE1\u4F1A\u5728\u4F60\u7684\u670D\u52A1\u53F0\u540C\u6B65\u751F\u6210\u300C\u654F\u611F\u62E6\u622A\u5F85\u62CD\u677F\u300D\u3002" : replyBox.action === "knowledge_gap" ? "\u7F3A\u53E3\u62A4\u680F\uFF1A\u5B81\u53EF\u8F6C\u8D1F\u8D23\u4EBA\u6807\u300C\u5F85\u8865\u53E3\u5F84\u300D\uFF0C\u7EDD\u4E0D\u7F16\u9020\u6216\u8BFB\u53D6\u672A\u6388\u6743\u76EE\u5F55\u3002" : `\u9694\u79BB\u8BF4\u660E\uFF1A\u4EC5\u5728 ${person?.name || "\u72EC\u7ACB\u8BBF\u5BA2"} \u4E2A\u4EBA\u6C99\u7BB1\u5185\u8FD0\u884C\uFF0C\u5176\u4ED6\u670D\u52A1\u5BF9\u8C61\u5B8C\u5168\u4E0D\u53EF\u89C1\u3002`)
        )
      )
    ),
    h2(
      "div",
      { className: "dlg-foot" },
      fromInvite && person && h2("button", {
        type: "button",
        className: "tw-btn tw-btn--subtle",
        onClick: () => {
          onClose();
          onBackToInvite(person.id);
        }
      }, "\u8FD4\u56DE\u51ED\u8BC1\u5F39\u7A97"),
      h2("button", { type: "button", className: "tw-btn tw-btn--primary", onClick: onClose }, "\u5173\u95ED\u9884\u89C8")
    )
  );
}
function ProfileEditModal({ open, view, presets, scheme, busy, onClose, onSave, onToast }) {
  const ref = useDialogController(open, onClose);
  const [personaId, setPersonaId] = (0, import_react2.useState)("advisor");
  const [name, setName] = (0, import_react2.useState)("");
  const [dutyMode, setDutyMode] = (0, import_react2.useState)("shadow");
  const [intro, setIntro] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    setPersonaId(view?.twinProfile?.personaId || "advisor");
    setName(view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB");
    setDutyMode(view?.dutyMode || "shadow");
    setIntro(view?.twinProfile?.intro || "\u4F9D\u636E\u5DF2\u6388\u6743\u9879\u76EE\u6587\u6863\u63D0\u4F9B\u53EA\u8BFB\u53E3\u5F84\u89E3\u7B54\uFF0C\u6D89\u654F\u660E\u7EC6\u8F6C\u8D1F\u8D23\u4EBA\u786E\u8BA4");
  }, [open]);
  return h2(
    "dialog",
    {
      ref,
      id: "profileEditDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "profileEditTitle"
    },
    h2(
      "div",
      { className: "dlg-head" },
      h2("h3", { id: "profileEditTitle", className: "dlg-title" }, "\u7F16\u8F91\u5206\u8EAB\u540D\u7247\u4E0E\u8868\u8FBE\u5B9A\u4F4D"),
      h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
    ),
    h2(
      "form",
      {
        style: { display: "flex", flexDirection: "column", minHeight: 0, flex: 1 },
        onSubmit: async (ev) => {
          ev.preventDefault();
          if (!name.trim()) return;
          await onSave({ personaId, name: name.trim(), intro: intro.trim(), dutyMode });
          onToast?.("\u5DF2\u4FDD\u5B58\u5206\u8EAB\u5BF9\u5916\u540D\u7247\u4E0E\u8868\u8FBE\u5B9A\u4F4D");
          onClose();
        }
      },
      h2(
        "div",
        { className: "dlg-body" },
        h2(
          "div",
          { className: "field-group" },
          h2("span", { className: "field-label" }, "\u5FEB\u6377\u5957\u7528\u8868\u8FBE\u8BED\u6C14\u6A21\u677F"),
          h2(
            "div",
            { className: "inline-persona-pills", role: "group", "aria-label": "\u5206\u8EAB\u8BED\u6C14\u6A21\u677F" },
            (presets || []).map(
              (p) => h2("button", {
                key: p.id,
                type: "button",
                className: personaId === p.id ? "persona-mini-btn is-active" : "persona-mini-btn",
                onClick: () => {
                  setPersonaId(p.id);
                  setIntro(p.intro);
                  setDutyMode(p.recommendedDuty);
                }
              }, p.title)
            )
          )
        ),
        h2(
          "div",
          { className: "field-row-2" },
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "profileNameInput" }, "\u5BF9\u5916\u540D\u7247\u540D\u79F0"),
            h2("input", {
              id: "profileNameInput",
              className: "tw-input",
              type: "text",
              required: true,
              value: name,
              onChange: (e) => setName(e.target.value),
              autoComplete: "off"
            })
          ),
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "profileDutySelect" }, "\u9ED8\u8BA4\u5BF9\u5916\u628A\u5173\u6863\u4F4D"),
            h2(
              "select",
              {
                id: "profileDutySelect",
                className: "tw-select",
                value: dutyMode,
                onChange: (e) => setDutyMode(e.target.value)
              },
              h2("option", { value: "shadow" }, "\u8BD5\u8DD1\u628A\u5173\uFF08\u5148\u62DF\u8349\u7A3F\u7ECF\u6211\u70B9\u5934\uFF09"),
              h2("option", { value: "live" }, "\u6B63\u5F0F\u503C\u73ED\uFF08\u767D\u540D\u5355\u76F4\u53D1\uFF0C\u6D89\u654F\u518D\u95EE\u6211\uFF09"),
              h2("option", { value: "off" }, "\u6682\u505C\u5BF9\u5916\u503C\u73ED\uFF08\u5916\u90E8\u5165\u53E3\u4F18\u96C5\u544A\u4F11\uFF09")
            )
          )
        ),
        h2(
          "div",
          { className: "field-group" },
          h2("label", { className: "field-label", htmlFor: "profileIntroInput" }, "\u4E00\u53E5\u8BDD\u5BF9\u5916\u4ECB\u7ECD\uFF08\u663E\u793A\u5728\u8BBF\u5BA2\u7F51\u9875\u4E0E IM \u6B22\u8FCE\u8BED\u9876\u90E8\uFF09"),
          h2("textarea", {
            id: "profileIntroInput",
            className: "tw-textarea",
            required: true,
            value: intro,
            onChange: (e) => setIntro(e.target.value)
          })
        )
      ),
      h2(
        "div",
        { className: "dlg-foot" },
        h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: onClose }, "\u53D6\u6D88"),
        h2("button", { type: "submit", className: "tw-btn tw-btn--primary", disabled: busy }, "\u4FDD\u5B58\u540D\u7247\u4E0E\u5B9A\u4F4D")
      )
    )
  );
}
function ProjectSelectModal({
  mode,
  projects,
  selectedCandidateId,
  mountedProjects,
  scheme,
  busy,
  onClose,
  onSelectWorkspace,
  onSelectCustomFolder
}) {
  const open = Boolean(mode);
  const ref = useDialogController(open, onClose);
  const [customPath, setCustomPath] = (0, import_react2.useState)("");
  const [customName, setCustomName] = (0, import_react2.useState)("");
  (0, import_react2.useEffect)(() => {
    if (!open) return;
    setCustomPath("");
    setCustomName("");
  }, [open, mode]);
  const isMount = mode === "mount";
  return h2(
    "dialog",
    {
      ref,
      id: "projectDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "projectDlgTitle"
    },
    h2(
      "div",
      { className: "dlg-head" },
      h2(
        "h3",
        { id: "projectDlgTitle", className: "dlg-title" },
        isMount ? "\u63A5\u5165\u65B0\u9879\u76EE\u80FD\u529B\u5230\u4E3B\u5206\u8EAB" : "\u9009\u62E9\u8981\u63D0\u70BC\u7684\u9879\u76EE"
      ),
      h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
    ),
    h2(
      "div",
      { className: "dlg-body" },
      isMount && h2(
        "p",
        { className: "launch-muted-note" },
        "\u5BF9\u5916\u4ECD\u7136\u662F\u540C\u4E00\u4E2A\u5DE5\u4F5C\u5206\u8EAB\uFF0C\u53EA\u4E3A\u5B83\u8FFD\u52A0\u65B0\u9879\u76EE\u7684\u53EA\u8BFB\u80FD\u529B\u4E0E\u53E3\u5F84\u8BF4\u660E\uFF1B\u53EF\u53BB\u300C\u80FD\u529B\u4E0E\u901A\u9053\u300D\u6309\u9700\u5F00\u5173\u6216\u5378\u8F7D\u3002"
      ),
      (projects || []).length > 0 && h2(
        "div",
        { className: "delta-diff-list" },
        projects.map((proj) => {
          const isCurrent = selectedCandidateId === proj.id;
          const isMounted = (mountedProjects || []).some((mp) => mp.projectName === proj.name);
          return h2(
            "div",
            { key: proj.id, className: "delta-diff-item" },
            h2(
              "div",
              { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" } },
              h2(
                "div",
                { style: { minWidth: 0, flex: "1 1 14rem" } },
                h2(
                  "div",
                  { className: "delta-diff-head" },
                  h2("span", null, proj.name),
                  isCurrent && !isMount && h2("span", { className: "status-pill status-pill--ok" }, "\u5F53\u524D\u5DF2\u9009"),
                  isMount && isMounted && h2("span", { className: "status-pill status-pill--muted" }, "\u5DF2\u63A5\u5165"),
                  proj.isTempWorkspace && h2("span", { className: "status-pill status-pill--muted" }, "\u6D4B\u8BD5\u5DE5\u4F5C\u533A")
                ),
                h2("div", { className: "delta-diff-desc", style: { marginTop: "0.1875rem" } }, proj.shortSummary)
              ),
              h2("button", {
                type: "button",
                className: isCurrent ? "tw-btn tw-btn--paper tw-btn--sm" : "tw-btn tw-btn--primary tw-btn--sm",
                disabled: busy,
                onClick: () => onSelectWorkspace(proj, mode)
              }, isMount ? "\u4ECE\u6B64\u9879\u76EE\u63D0\u70BC\u63A5\u5165" : isCurrent ? "\u4FDD\u6301\u9009\u7528" : "\u9009\u62E9\u8BE5\u9879\u76EE")
            )
          );
        })
      ),
      h2(
        "details",
        { className: "tech-details", open: (projects || []).length === 0 },
        h2("summary", null, "\u6307\u5B9A\u672C\u673A\u5176\u4ED6\u9879\u76EE\u6587\u4EF6\u5939\uFF08\u53EA\u8BFB\u626B\u63CF\uFF0C\u4E0D\u6539\u52A8\u539F\u76EE\u5F55\uFF09"),
        h2(
          "form",
          {
            className: "field-group",
            style: { marginTop: "0.75rem" },
            onSubmit: (ev) => {
              ev.preventDefault();
              if (!customPath.trim()) return;
              onSelectCustomFolder({ rootPath: customPath.trim(), projectName: customName.trim() || void 0 }, mode);
            }
          },
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "customProjPath" }, "\u672C\u673A\u9879\u76EE\u7EDD\u5BF9\u76EE\u5F55"),
            h2("input", {
              id: "customProjPath",
              className: "tw-input",
              type: "text",
              value: customPath,
              onChange: (e) => setCustomPath(e.target.value),
              placeholder: "/Users/.../my-project"
            })
          ),
          h2(
            "div",
            { className: "field-group" },
            h2("label", { className: "field-label", htmlFor: "customProjName" }, "\u5BF9\u5916\u663E\u793A\u540D\u79F0\uFF08\u4E0D\u542B\u672C\u5730\u8DEF\u5F84\uFF09"),
            h2("input", {
              id: "customProjName",
              className: "tw-input",
              type: "text",
              value: customName,
              onChange: (e) => setCustomName(e.target.value),
              placeholder: "\u4F8B\u5982\uFF1A\u589E\u957F\u590D\u76D8\u53E3\u5F84\u5E93"
            })
          ),
          h2(
            "div",
            { className: "action-row" },
            h2(
              "button",
              { type: "submit", className: "tw-btn tw-btn--primary tw-btn--sm", disabled: busy || !customPath.trim() },
              isMount ? "\u9009\u5B9A\u5E76\u63D0\u70BC\u63A5\u5165" : "\u9009\u5B9A\u6B64\u9879\u76EE\u76EE\u5F55"
            )
          )
        )
      )
    ),
    h2(
      "div",
      { className: "dlg-foot" },
      h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: onClose }, "\u53D6\u6D88")
    )
  );
}
function DeltaUpgradeModal({ project, scheme, busy, onClose, onConfirmUpgrade }) {
  const open = Boolean(project);
  const ref = useDialogController(open, onClose);
  const spec = project?.deltaSpec || {};
  return h2(
    "dialog",
    {
      ref,
      id: "deltaUpgradeDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "deltaDlgTitle"
    },
    project && [
      h2(
        "div",
        { key: "h", className: "dlg-head" },
        h2("h3", { id: "deltaDlgTitle", className: "dlg-title" }, `${project.projectName} \xB7 \u589E\u91CF\u53D8\u52A8\u6838\u5BF9`),
        h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
      ),
      h2(
        "div",
        { key: "b", className: "dlg-body" },
        h2(
          "p",
          { className: "delta-intro" },
          spec.intro || "\u5E73\u65F6\u4EC5\u6838\u5BF9\u672C\u5730\u6587\u4EF6\u4FEE\u6539\u6807\u8BB0\uFF08\u4E0D\u6D88\u8017\u6A21\u578B\u989D\u5EA6\uFF0C\u7EDD\u4E0D\u64C5\u81EA\u6539\u5199\u5DF2\u6709\u53E3\u5F84\uFF09\u3002\u68C0\u6D4B\u5230\u53D8\u52A8\u5982\u4E0B\uFF1A"
        ),
        h2(
          "div",
          { className: "delta-diff-list" },
          (spec.items || []).map(
            (item, idx) => h2(
              "div",
              { key: idx, className: "delta-diff-item" },
              h2(
                "div",
                { className: "delta-diff-head" },
                h2("span", { className: item.safe ? "delta-diff-kind is-safe" : "delta-diff-kind" }, item.kind),
                h2("span", null, item.title)
              ),
              h2("div", { className: "delta-diff-desc" }, item.desc)
            )
          )
        )
      ),
      h2(
        "div",
        { key: "f", className: "dlg-foot" },
        h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: onClose }, "\u6682\u4E0D\u5347\u7EA7"),
        h2("button", {
          type: "button",
          id: "btnConfirmDeltaUpgrade",
          className: "tw-btn tw-btn--primary",
          disabled: busy,
          onClick: () => onConfirmUpgrade(project.id)
        }, "\u786E\u8BA4\u7EB3\u5165\u5206\u8EAB")
      )
    ]
  );
}
function HandoffModal({ target, scheme, busy, onClose, onConfirmHandoff }) {
  const open = Boolean(target);
  const ref = useDialogController(open, onClose);
  return h2(
    "dialog",
    {
      ref,
      id: "handoffDialog",
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "handoffDlgTitle"
    },
    target && [
      h2(
        "div",
        { key: "h", className: "dlg-head" },
        h2("h3", { id: "handoffDlgTitle", className: "dlg-title" }, "\u8F6C\u5165\u539F\u751F\u5BF9\u8BDD\u4EB2\u81EA\u5904\u7406"),
        h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
      ),
      h2(
        "div",
        { key: "b", className: "dlg-body" },
        target.kind === "person" ? h2(
          "div",
          { style: { fontSize: "0.84375rem", color: "var(--text)" } },
          h2("strong", null, "\u5C06\u5E26\u5165\u65B0\u5BF9\u8BDD\u7684\u5185\u5BB9\uFF1A"),
          h2("br"),
          `1. ${target.person.name}\uFF08${target.person.channel}\uFF09\u8FD1 ${(target.person.threads || []).length} \u8F6E\u5B8C\u6574\u6C9F\u901A\u8BB0\u5F55\uFF1B`,
          h2("br"),
          "2. \u5206\u8EAB\u5F53\u524D\u751F\u6548\u7684\u7EA2\u7EBF\u8FB9\u754C\u4E0E\u4E13\u95E8\u53EE\u5631\uFF0C\u7531\u4F60\u76F4\u63A5\u63A5\u624B\u6DF1\u804A\u3002"
        ) : h2(
          "div",
          { style: { fontSize: "0.84375rem", color: "var(--text)" } },
          h2("strong", null, "\u5C06\u5E26\u5165\u65B0\u5BF9\u8BDD\u7684\u5185\u5BB9\uFF1A"),
          h2("br"),
          `1. ${target.item.personName} \u7684\u539F\u95EE\uFF1A\u300C${target.item.question}\u300D`,
          h2("br"),
          "2. \u5206\u8EAB\u5DF2\u62E6\u622A\u7684\u654F\u611F\u70B9\u4E0E\u63D0\u524D\u7B97\u597D\u7684\u8131\u654F\u6C47\u603B\u65B9\u6848\u3002"
        ),
        h2(
          "p",
          { style: { margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" } },
          "\u70B9\u51FB\u300C\u5E26\u4E0A\u4E0B\u6587\u6253\u5F00\u65B0\u5BF9\u8BDD\u300D\u4F1A\u62C9\u8D77\u4E00\u6761\u5BBF\u4E3B\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4F1A\u8BDD\uFF0C\u81EA\u52A8\u5E26\u597D\u5BF9\u65B9\u539F\u95EE\u4E0E\u4E0A\u4E0B\u6587\uFF0C\u65E0\u9700\u91CD\u8FF0\u80CC\u666F\u3002"
        )
      ),
      h2(
        "div",
        { key: "f", className: "dlg-foot" },
        h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: onClose }, "\u5148\u7559\u5728\u8FD9"),
        h2("button", {
          type: "button",
          id: "btnConfirmHandoff",
          className: "tw-btn tw-btn--primary",
          disabled: busy,
          onClick: () => onConfirmHandoff(target)
        }, "\u5E26\u4E0A\u4E0B\u6587\u6253\u5F00\u65B0\u5BF9\u8BDD")
      )
    ]
  );
}
function ConfirmActionModal({ spec, scheme, busy, onClose }) {
  const open = Boolean(spec);
  const ref = useDialogController(open, onClose);
  return h2(
    "dialog",
    {
      ref,
      className: "tw-dlg",
      closedby: "any",
      "data-tw-scheme": scheme,
      "aria-labelledby": "confirmDlgTitle"
    },
    spec && [
      h2(
        "div",
        { key: "h", className: "dlg-head" },
        h2("h3", { id: "confirmDlgTitle", className: "dlg-title" }, spec.title || "\u786E\u8BA4\u64CD\u4F5C"),
        h2("button", { type: "button", className: "dlg-close", "aria-label": "\u5173\u95ED\u5F39\u7A97", onClick: onClose }, h2(CloseIcon))
      ),
      h2(
        "div",
        { key: "b", className: "dlg-body" },
        h2("p", { style: { margin: 0, fontSize: "0.84375rem", color: "var(--text-secondary)" } }, spec.message)
      ),
      h2(
        "div",
        { key: "f", className: "dlg-foot" },
        h2("button", { type: "button", className: "tw-btn tw-btn--ghost", onClick: onClose }, "\u53D6\u6D88"),
        h2("button", {
          type: "button",
          className: "tw-btn tw-btn--primary",
          disabled: busy,
          onClick: async () => {
            await spec.onConfirm?.();
            onClose();
          }
        }, spec.confirmLabel || "\u786E\u8BA4\u6267\u884C")
      )
    ]
  );
}

// src-client/scenes.js
var import_react3 = __toESM(require("react"), 1);
var h3 = import_react3.default.createElement;
function pendingCountForPerson(view, personId) {
  return (view?.approvals || []).filter((a) => a.personId === personId).length;
}
function latestSnippetForPerson(view, person) {
  const pending = (view?.approvals || []).find((a) => a.personId === person.id);
  if (pending) return `\u5F85\u62CD\u677F\uFF1A\u300C${pending.question}\u300D`;
  const threads = person?.threads || [];
  if (threads.length > 0) {
    const last = threads[threads.length - 1];
    return `\u6700\u8FD1\u95EE\u7B54\uFF08${last.time}\uFF09\uFF1A\u300C${last.question}\u300D`;
  }
  return "\u6682\u65E0\u5386\u53F2\u63D0\u95EE\uFF0C\u53EF\u5148\u70B9\u8FDB\u67E5\u770B\u6216\u53D1\u8BD5\u7528\u94FE\u63A5";
}
function buildExtractionSteps(job) {
  const isMount = job?.mode === "mount";
  const isDone = job?.status === "ready";
  const totalCaps = job?.totalCaps || 3;
  const foundCount = (job?.discoveredCaps || []).length;
  const projectName = job?.projectName || "\u9009\u4E2D\u9879\u76EE";
  const stepDefs = [
    {
      title: "\u9501\u5B9A\u9879\u76EE\u8303\u56F4\u4E0E\u5B89\u5168\u8FB9\u754C",
      desc: "\u5DF2\u5212\u5B9A\u53EA\u8BFB\u767D\u540D\u5355\u8303\u56F4\uFF0C\u8D26\u53F7\u5BC6\u94A5\u3001\u73AF\u5883\u53D8\u91CF\u4E0E\u5199\u5165\u811A\u672C\u5747\u7559\u5728\u5916\u4FA7"
    },
    {
      title: "\u901A\u8BFB\u4E1A\u52A1\u53E3\u5F84\u4E0E\u8FD1\u671F\u590D\u76D8\u6837\u672C",
      desc: `\u6B63\u5728\u68B3\u7406\u300C${projectName}\u300D\u6587\u6863\u53E3\u5F84\u4E0E\u5386\u53F2\u590D\u76D8\u8868\u8FBE\u4E60\u60EF`
    },
    {
      title: "\u9010\u9879\u63D0\u53D6\u53EF\u6267\u884C\u80FD\u529B\u5305",
      desc: `\u9010\u6B65\u63D0\u53D6\u80FD\u529B\u8BF4\u660E\u3001\u53EA\u8BFB\u67E5\u8BE2\u652F\u6491\u4E0E\u8F93\u51FA\u683C\u5F0F\uFF08\u5DF2\u63D0\u53D6 ${foundCount}/${totalCaps} \u9879\uFF09`
    },
    {
      title: isMount ? "\u5408\u5E76\u589E\u91CF\u5E72\u6D3B\u89C4\u77E9\u4E0E\u7EA2\u7EBF" : "\u5F52\u7EB3\u5E72\u6D3B\u89C4\u77E9\u5E76\u751F\u6210\u5BF9\u5916\u540D\u7247\u8349\u7A3F",
      desc: isMount ? "\u4E0E\u4E3B\u5206\u8EAB\u73B0\u6709\u89C4\u77E9\u5408\u5E76\u53BB\u91CD\uFF0C\u4E0D\u8986\u76D6\u5DF2\u6709\u5168\u5C40\u7EAA\u5F8B" : "\u57FA\u4E8E\u5DF2\u63D0\u53D6\u80FD\u529B\u81EA\u52A8\u62DF\u5B9A\u5BF9\u5916\u79F0\u547C\u3001\u804C\u8D23\u4E00\u53E5\u8BDD\u4E0E\u300C\u5F85\u786E\u8BA4\u300D\u62E6\u622A\u7EA2\u7EBF"
    }
  ];
  return stepDefs.map((def, i) => {
    const stepNum = i + 1;
    let stepState = "pending";
    if (isDone || (job?.step || 1) > stepNum) stepState = "done";
    else if ((job?.step || 1) === stepNum) stepState = "running";
    return { stepNum, stepState, ...def };
  });
}
function ExtractLiveBanner({ job, busy, bannerId, onAction }) {
  if (!job) return null;
  const isReady = job.status === "ready";
  const projectName = job.projectName || "\u9009\u4E2D\u9879\u76EE";
  const foundCount = (job.discoveredCaps || []).length;
  const totalCaps = job.totalCaps || 3;
  return h3(
    "div",
    {
      id: bannerId,
      className: isReady ? "extract-live-banner is-ready" : "extract-live-banner",
      role: "status",
      "aria-live": "polite"
    },
    isReady ? [
      h3(
        "div",
        { key: "l", className: "extract-live-left" },
        h3(
          "div",
          { className: "extract-live-copy" },
          h3("span", { className: "extract-live-title" }, `\u300C${projectName}\u300D\u63D0\u70BC\u5B8C\u6210`),
          h3("span", { className: "extract-live-sub" }, `\u5DF2\u63D0\u53D6 ${totalCaps} \u9879\u53EF\u6267\u884C\u80FD\u529B\uFF0C\u81EA\u6D4B\u9A8C\u8D27\u4E0E\u80FD\u529B\u6E05\u5355\u5DF2\u540C\u6B65\u89E3\u9501`)
        )
      ),
      h3(
        "div",
        { key: "r", className: "extract-live-actions" },
        h3("button", {
          type: "button",
          className: "tw-btn tw-btn--paper tw-btn--sm",
          disabled: busy,
          onClick: () => onAction("switch_scene", { scene: "onboard" })
        }, "\u67E5\u770B\u63D0\u70BC\u660E\u7EC6"),
        h3("button", {
          type: "button",
          className: "tw-btn tw-btn--primary tw-btn--sm",
          disabled: busy,
          onClick: () => onAction("complete_extraction", { keepScene: true })
        }, "\u77E5\u9053\u4E86")
      )
    ] : [
      h3(
        "div",
        { key: "l", className: "extract-live-left" },
        h3("progress", {
          className: "tw-progress tw-progress--sm",
          max: 4,
          value: job.step || 1,
          "aria-label": "\u540E\u53F0\u63D0\u70BC\u8FDB\u5EA6"
        }),
        h3(
          "div",
          { className: "extract-live-copy" },
          h3("span", { className: "extract-live-title" }, `\u6B63\u5728\u4ECE\u300C${projectName}\u300D\u63D0\u70BC\u5206\u8EAB\u80FD\u529B\uFF08${job.step || 1}/4\uFF09`),
          h3("span", { className: "extract-live-sub" }, `\u5DF2\u63D0\u53D6 ${foundCount}/${totalCaps} \u9879\u80FD\u529B \xB7 \u4F60\u53EF\u5148\u5728\u4E0B\u65B9\u914D\u7F6E\u540D\u7247\u3001\u901A\u9053\u4E0E\u9080\u8BF7`)
        )
      ),
      h3(
        "div",
        { key: "r", className: "extract-live-actions" },
        h3("button", {
          type: "button",
          className: "tw-btn tw-btn--ghost tw-btn--sm",
          disabled: busy,
          onClick: () => onAction("fast_forward_extraction")
        }, "\u7ACB\u5373\u5B8C\u6210"),
        h3("button", {
          type: "button",
          className: "tw-btn tw-btn--paper tw-btn--sm",
          disabled: busy,
          onClick: () => onAction("switch_scene", { scene: "onboard" })
        }, "\u67E5\u770B\u5B9E\u65F6\u8FDB\u5EA6")
      )
    ]
  );
}
function OnboardScene({
  view,
  projects,
  selectedCandidateId,
  customProject,
  busy,
  onOpenProjectDialog,
  onAction,
  onToast
}) {
  const [brief, setBrief] = (0, import_react3.useState)("");
  const isMountMode = view?.onboardMode === "mount";
  const job = view?.extractionJob || null;
  const twinName = view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB";
  const activeProject = (0, import_react3.useMemo)(() => {
    if (customProject?.rootPath) {
      return {
        id: "custom",
        name: customProject.projectName || "\u81EA\u5B9A\u4E49\u672C\u5730\u9879\u76EE",
        scanSummary: "\u5DF2\u6307\u5B9A\u672C\u673A\u53EA\u8BFB\u9879\u76EE\u76EE\u5F55\uFF1A\u70B9\u51FB\u5F00\u59CB\u63D0\u70BC\u5C06\u626B\u63CF\u4E1A\u52A1\u6587\u6863\u4E0E\u53EA\u8BFB\u811A\u672C\u5E76\u81EA\u52A8\u9694\u79BB\u5BC6\u94A5\u4E0E\u53D8\u66F4\u811A\u672C",
        scope: [
          "\u6388\u6743\u53EF\u8BFB\u6587\u6863\uFF1A\u4E1A\u52A1\u53E3\u5F84\u3001\u8BF4\u660E\u6587\u6863\u4E0E\u590D\u76D8\u8BB0\u5F55\uFF08\u4EC5\u53EA\u8BFB\u6458\u8981\uFF09",
          "\u53EA\u8BFB\u8F85\u52A9\u5DE5\u5177\uFF1A\u4EC5\u9650\u89E3\u91CA\u53E3\u5F84\u4E0E\u65E0\u526F\u4F5C\u7528\u6838\u67E5",
          "\u9ED8\u8BA4\u81EA\u52A8\u9694\u79BB\uFF1A\u5BC6\u94A5\u914D\u7F6E\u3001\u73AF\u5883\u53D8\u91CF\u4E0E\u4E00\u5207\u4FEE\u6539\u6216\u5199\u5165\u6570\u636E\u52A8\u4F5C"
        ]
      };
    }
    const found = (projects || []).find((p) => p.id === selectedCandidateId) || (projects || [])[0] || null;
    if (found) return found;
    return {
      id: "",
      name: "\u5C1A\u672A\u7ED1\u5B9A\u5DE5\u4F5C\u533A",
      scanSummary: "\u5F53\u524D\u6682\u672A\u68C0\u6D4B\u5230\u5DF2\u6253\u5F00\u7684\u5DE5\u4F5C\u533A\u76EE\u5F55\uFF0C\u8BF7\u70B9\u51FB\u53F3\u4FA7\u300C\u9009\u62E9\u672C\u673A\u76EE\u5F55\u300D\u6311\u9009\u4E00\u4E2A\u672C\u5730\u9879\u76EE\u6587\u4EF6\u5939\u3002",
      scope: [
        "\u6388\u6743\u53EF\u8BFB\u6587\u6863\uFF1A\u4E1A\u52A1\u53E3\u5F84\u3001\u8BF4\u660E\u6587\u6863\u4E0E\u5386\u53F2\u590D\u76D8\u6458\u8981",
        "\u53EA\u8BFB\u8F85\u52A9\u5DE5\u5177\uFF1A\u89E3\u91CA\u53E3\u5F84\u4E0E\u53EA\u8BFB\u67E5\u8BE2\u652F\u6491",
        "\u9ED8\u8BA4\u81EA\u52A8\u9694\u79BB\uFF1A\u8D26\u53F7\u5BC6\u94A5\u3001\u73AF\u5883\u53D8\u91CF\u53CA\u5199\u5E93\u4FEE\u6539\u811A\u672C"
      ]
    };
  }, [projects, selectedCandidateId, customProject]);
  async function handleStartExtraction() {
    if (!customProject?.rootPath && !activeProject.id) {
      onOpenProjectDialog("switch");
      return;
    }
    try {
      await onAction("start_extraction", {
        candidateId: customProject?.rootPath ? void 0 : activeProject.id,
        rootPath: customProject?.rootPath || void 0,
        projectName: activeProject.name,
        mode: isMountMode ? "mount" : "initial",
        brief: brief.trim(),
        autoComplete: false
      });
      onToast?.("\u5DF2\u5F00\u59CB\u9010\u9879\u8BFB\u53D6\u4E0E\u63D0\u70BC\uFF1B\u5B8C\u6210\u540E\u5C06\u81EA\u52A8\u62DF\u5B9A\u540D\u7247\u8349\u7A3F\uFF0C\u968F\u65F6\u53EF\u6536\u8D77\u5230\u670D\u52A1\u53F0");
    } catch {
    }
  }
  const steps = job ? buildExtractionSteps(job) : [];
  const isJobReady = job?.status === "ready";
  const foundCaps = job?.discoveredCaps || [];
  const totalCaps = job?.totalCaps || 3;
  const showDraftPreview = job && job.mode === "initial" && ((job.step || 1) >= 4 || isJobReady) && job.draftProfile;
  return h3(
    "section",
    { id: "viewOnboard", className: "tw-container tw-container--narrow" },
    h3(
      "div",
      { className: "onboard-wrap" },
      h3(
        "div",
        { id: "onboardEyebrow", className: "eyebrow" },
        isMountMode ? "\u4E3B\u5206\u8EAB\u6269\u5C55 \xB7 \u63A5\u5165\u65B0\u9879\u76EE\u80FD\u529B" : "AI \u5206\u8EAB \xB7 \u521D\u6B21\u542F\u7528"
      ),
      h3(
        "h1",
        { id: "onboardTitle", className: "serif-h1" },
        isMountMode ? `\u4E3A\u300C${twinName}\u300D\u63A5\u5165\u65B0\u9879\u76EE\u80FD\u529B` : "\u6311\u4E00\u4E2A\u9879\u76EE\uFF0C\u628A\u4F60\u7684\u5DE5\u4F5C\u601D\u8DEF\u70BC\u6210\u5206\u8EAB"
      ),
      h3(
        "p",
        { id: "onboardLead", className: "page-lead" },
        isMountMode ? "\u590D\u7528\u73B0\u6709\u5FAE\u4FE1\u3001\u98DE\u4E66\u3001Slack \u7B49\u901A\u9053\u4E0E\u670D\u52A1\u53F0\u6536\u4EF6\u7BB1\uFF0C\u65B0\u9879\u76EE\u72EC\u7ACB\u6253\u5305\u53EA\u8BFB\u76EE\u5F55\u5E76\u6309\u4EBA\u6388\u6743\u9694\u79BB\u3002" : "\u5148\u5212\u5B9A\u53EA\u8BFB\u76EE\u5F55\u4E0E\u654F\u611F\u7EA2\u7EBF\uFF1B\u5206\u8EAB\u540D\u7247\u3001\u53E3\u5F84\u603B\u7ED3\u4E0E\u7B54\u590D\u8BED\u6C14\u5C06\u5728\u63D0\u70BC\u5B8C\u6210\u540E\u7531 AI \u6839\u636E\u9879\u76EE\u5B9E\u6599\u81EA\u52A8\u62DF\u7A3F\uFF0C\u4E0D\u7528\u73B0\u5728\u76F2\u586B\u3002"
      ),
      h3(
        "div",
        { className: "card onboard-card" },
        !job ? h3(
          "div",
          { id: "onboardSetupPane" },
          h3(
            "div",
            { className: "card-section" },
            h3(
              "div",
              { id: "onboardStep1Title", className: "section-step-title" },
              isMountMode ? "1. \u786E\u8BA4\u8981\u63D0\u70BC\u63A5\u5165\u7684\u9879\u76EE" : "1. \u9009\u4E00\u4E2A\u6B63\u5728\u505A\u7684\u9879\u76EE"
            ),
            h3(
              "div",
              { className: "project-row" },
              h3(
                "div",
                { className: "project-name" },
                h3(FolderIcon),
                h3("span", { id: "onboardProjectName" }, activeProject.name)
              ),
              h3("button", {
                type: "button",
                id: "btnSwitchProject",
                className: "tw-btn tw-btn--subtle tw-btn--sm",
                onClick: () => onOpenProjectDialog(isMountMode ? "mount" : "switch")
              }, activeProject.id || customProject?.rootPath ? "\u5207\u6362\u9879\u76EE" : "\u9009\u62E9\u672C\u673A\u76EE\u5F55")
            ),
            h3(
              "p",
              { id: "onboardProjectSummary", className: "project-summary" },
              activeProject.scanSummary
            ),
            h3(
              "details",
              { id: "onboardScopeDetails", className: "scope-details" },
              h3("summary", null, "\u67E5\u770B\u5DF2\u76D8\u70B9\u4E0E\u81EA\u52A8\u4FDD\u62A4\u8303\u56F4"),
              h3(
                "ul",
                { id: "onboardScopeList", className: "scope-list" },
                (activeProject.scope || []).map((line, i) => h3("li", { key: i }, line))
              )
            )
          ),
          h3(
            "div",
            { className: "card-section" },
            h3(
              "label",
              { id: "onboardStep2Label", className: "section-step-title", htmlFor: "onboardBrief" },
              isMountMode ? "2. \u8865\u5145\u8BE5\u9879\u76EE\u7684\u4E13\u5C5E\u89C4\u77E9\uFF08\u53EF\u9009\uFF0C\u7559\u7A7A\u6CBF\u7528\u4E3B\u5206\u8EAB\u5168\u5C40\u89C4\u77E9\uFF09" : "2. \u4E34\u51FA\u53D1\u524D\u7684\u7279\u522B\u53EE\u5631\uFF08\u53EF\u9009\uFF09"
            ),
            h3("textarea", {
              id: "onboardBrief",
              className: "tw-textarea",
              value: brief,
              onChange: (e) => setBrief(e.target.value),
              placeholder: "\u4F8B\u5982\uFF1A\u524D 3 \u884C\u5148\u7ED9\u76F4\u63A5\u7ED3\u8BBA\uFF1B\u62A5\u6CE2\u52A8\u5148\u6392\u9664\u5468\u672B\u6D4B\u8BD5\u5355\uFF1B\u62FF\u4E0D\u51C6\u7684\u6570\u5B57\u6807\u300C\u5F85\u786E\u8BA4\u300D\uFF08\u7559\u7A7A\u4E5F\u4F1A\u5728\u63D0\u70BC\u65F6\u4ECE\u5386\u53F2\u590D\u76D8\u81EA\u52A8\u603B\u7ED3\uFF09"
            })
          ),
          h3(
            "div",
            { className: "onboard-actions" },
            h3(
              "span",
              { id: "onboardActionsHint", className: "onboard-hint" },
              isMountMode ? "\u63D0\u70BC\u7ED3\u679C\u53EF\u5728\u300C\u80FD\u529B\u4E0E\u901A\u9053\u300D\u67E5\u770B\uFF0C\u5E76\u6309\u4EBA\u5355\u72EC\u6388\u6743\u5F00\u5173" : "\u63D0\u70BC\u4E2D\u53EF\u968F\u65F6\u6536\u8D77\u5230\u670D\u52A1\u53F0\uFF0C\u5148\u53BB\u63A5\u901A\u5FAE\u4FE1\u3001\u98DE\u4E66\u6216 Slack \u901A\u9053"
            ),
            h3(
              "div",
              { className: "action-row" },
              h3("button", {
                type: "button",
                id: "btnSkipToDesk",
                className: "tw-btn tw-btn--ghost",
                disabled: busy,
                onClick: () => onAction("switch_scene", { scene: isMountMode ? "caps" : "desk" })
              }, isMountMode ? "\u53D6\u6D88\u8FD4\u56DE" : "\u5148\u53BB\u670D\u52A1\u53F0\u914D\u901A\u9053"),
              h3("button", {
                type: "button",
                id: "btnFinishOnboard",
                className: "tw-btn tw-btn--primary",
                disabled: busy,
                onClick: handleStartExtraction
              }, busy ? "\u6B63\u5728\u626B\u63CF\u9879\u76EE\u2026" : isMountMode ? "\u5F00\u59CB\u63D0\u70BC\u8BE5\u9879\u76EE\u80FD\u529B" : "\u5F00\u59CB\u63D0\u70BC\u5E76\u62DF\u5B9A\u540D\u7247")
            )
          )
        ) : h3(
          "div",
          { id: "onboardProgressPane", className: "extract-pane" },
          h3(
            "div",
            { className: "extract-head" },
            h3(
              "div",
              { id: "extractLiveStatus", className: "extract-status-text", role: "status", "aria-live": "polite" },
              isJobReady ? `\u300C${job.projectName}\u300D\u63D0\u70BC\u5B8C\u6210\uFF0C\u5171\u63D0\u53D6 ${totalCaps} \u9879\u53EF\u6267\u884C\u80FD\u529B` : `\u6B63\u5728\u4ECE\u300C${job.projectName}\u300D\u63D0\u70BC\u80FD\u529B\uFF08${job.step || 1}/4\uFF09\u2026`
            ),
            h3(
              "span",
              { id: "extractStepMeta", className: "extract-step-meta" },
              isJobReady ? "4 / 4 \u5DF2\u5B8C\u6210" : `\u7B2C ${job.step || 1} / 4 \u6B65`
            )
          ),
          h3("progress", {
            id: "extractProgressBar",
            className: "tw-progress",
            max: 4,
            value: job.step || 1,
            "aria-label": "\u5206\u8EAB\u63D0\u70BC\u8FDB\u5EA6"
          }),
          h3(
            "ol",
            { id: "extractStepsList", className: "extract-step-list" },
            steps.map(
              (st) => h3(
                "li",
                { key: st.stepNum, className: "extract-step", "data-step-state": st.stepState },
                h3(
                  "span",
                  { className: "extract-step-mark", "aria-hidden": "true" },
                  st.stepState === "done" ? h3(CheckIcon) : `0${st.stepNum}`
                ),
                h3(
                  "div",
                  { className: "extract-step-body" },
                  h3("div", { className: "extract-step-title" }, st.title),
                  h3("div", { className: "extract-step-desc" }, st.desc)
                )
              )
            )
          ),
          h3(
            "div",
            { id: "extractFoundBox", className: "extract-found-box" },
            h3(
              "div",
              { className: "extract-found-head" },
              h3("span", null, `\u5DF2\u63D0\u53D6\u80FD\u529B\u9884\u89C8\uFF08${foundCaps.length}/${totalCaps} \u9879\uFF09`),
              h3("span", { className: "extract-found-sub" }, isJobReady ? "\u5DF2\u540C\u6B65\u5199\u5165\u5DE5\u4F5C\u53F0\u80FD\u529B\u6E05\u5355" : "\u6309\u6B65\u6D41\u5F0F\u63D0\u53D6\u4E2D\uFF0C\u968F\u65F6\u53EF\u6536\u8D77\u5230\u540E\u53F0")
            ),
            foundCaps.length > 0 ? h3(
              "div",
              { className: "extract-found-tags" },
              foundCaps.map((name, idx) => h3("span", { key: idx, className: "extract-cap-tag" }, name))
            ) : h3("div", { className: "extract-found-sub" }, "\u6B63\u5728\u6838\u5BF9\u76EE\u5F55\u4E0E\u9694\u79BB\u8FB9\u754C\uFF0C\u5B8C\u6210\u540E\u968F\u5373\u5F00\u59CB\u9010\u9879\u63D0\u53D6\u80FD\u529B\u2026"),
            showDraftPreview && h3(
              "div",
              { className: "extract-draft-preview" },
              h3(
                "div",
                { className: "extract-found-head" },
                h3("strong", null, "AI \u5DF2\u62DF\u5B9A\u5206\u8EAB\u540D\u7247\u8349\u7A3F"),
                h3("span", { className: "status-pill status-pill--ok" }, "\u57FA\u4E8E\u5DF2\u63D0\u70BC\u5185\u5BB9\u751F\u6210")
              ),
              h3(
                "div",
                { style: { marginTop: "0.3125rem", fontSize: "0.84375rem", color: "var(--text)" } },
                h3("strong", null, job.draftProfile.name),
                ` \xB7 ${job.draftProfile.intro}`
              )
            ),
            !showDraftPreview && job.mode === "initial" && h3(
              "div",
              { className: "extract-found-sub", style: { marginTop: "0.25rem" } },
              "\u5BF9\u5916\u540D\u7247\u4E0E\u4E00\u53E5\u8BDD\u5B9A\u4F4D\u5C06\u5728\u7B2C 4 \u6B65\u80FD\u529B\u63D0\u70BC\u9F50\u6574\u540E\u7531 AI \u81EA\u52A8\u62DF\u7A3F\u3002"
            )
          ),
          h3(
            "div",
            { className: "onboard-actions", style: { marginTop: "0.25rem" } },
            h3(
              "span",
              { id: "extractActionsHint", className: "onboard-hint" },
              isJobReady ? job.mode === "mount" ? "\u65B0\u80FD\u529B\u5DF2\u5408\u5E76\u5165\u300C\u80FD\u529B\u4E0E\u901A\u9053\u300D\uFF0C\u53EF\u5728\u300C\u670D\u52A1\u5BF9\u8C61\u300D\u4E2D\u6309\u4EBA\u52FE\u9009\u5F00\u653E" : "\u63A5\u4E0B\u6765\u53EF\u5728\u670D\u52A1\u53F0\u5148\u81EA\u6D4B\u9A8C\u8D27\uFF0C\u518D\u51B3\u5B9A\u7ED9\u8C01\u5F00\u901A\u5E76\u590D\u5236\u9080\u8BF7" : "\u63D0\u70BC\u5728\u5DE5\u4F5C\u53F0\u540E\u53F0\u6301\u7EED\u8FD0\u884C\uFF0C\u5207\u8D70\u770B\u670D\u52A1\u53F0\u4E5F\u4E0D\u4F1A\u4E2D\u65AD"
            ),
            h3(
              "div",
              { className: "action-row" },
              !isJobReady && h3("button", {
                type: "button",
                id: "btnCollapseExtractToDesk",
                className: "tw-btn tw-btn--subtle",
                disabled: busy,
                onClick: async () => {
                  const backScene = job.mode === "mount" ? "caps" : "desk";
                  await onAction("switch_scene", { scene: backScene });
                  onToast?.("\u63D0\u70BC\u5DF2\u5728\u540E\u53F0\u7EE7\u7EED\u8FDB\u884C\uFF1B\u53EF\u5148\u5728\u670D\u52A1\u53F0\u63A5\u901A\u6C9F\u901A\u901A\u9053\u6216\u914D\u7F6E\u5F85\u9080\u5BF9\u8C61");
                }
              }, job.mode === "mount" ? "\u6536\u8D77\u5230\u540E\u53F0\uFF0C\u56DE\u80FD\u529B\u4E0E\u901A\u9053" : "\u6536\u8D77\u5230\u540E\u53F0\uFF0C\u5148\u770B\u670D\u52A1\u53F0"),
              !isJobReady && h3("button", {
                type: "button",
                id: "btnFastForwardExtract",
                className: "tw-btn tw-btn--ghost tw-btn--sm",
                disabled: busy,
                onClick: async () => {
                  await onAction("fast_forward_extraction");
                  onToast?.("4 \u6B65\u63D0\u70BC\u5DF2\u5B8C\u6210\uFF0C\u80FD\u529B\u6E05\u5355\u4E0E\u540D\u7247\u8349\u7A3F\u5DF2\u5C31\u7EEA");
                }
              }, "\u7ACB\u5373\u5B8C\u6210"),
              isJobReady && h3("button", {
                type: "button",
                id: "btnInspectCapsAfterExtract",
                className: "tw-btn tw-btn--ghost",
                disabled: busy,
                onClick: () => onAction("complete_extraction", { scene: "caps" })
              }, "\u53BB\u80FD\u529B\u4E0E\u901A\u9053\u67E5\u770B"),
              isJobReady && h3("button", {
                type: "button",
                id: "btnConfirmExtractedTwin",
                className: "tw-btn tw-btn--primary",
                disabled: busy,
                onClick: () => onAction("complete_extraction", { scene: job.mode === "mount" ? "caps" : "desk" })
              }, job.mode === "mount" ? "\u786E\u8BA4\u8FD4\u56DE\u80FD\u529B\u4E0E\u901A\u9053" : "\u53BB\u670D\u52A1\u53F0\u8BD5\u95EE\u5E76\u53D1\u9080\u8BF7")
            )
          )
        )
      )
    )
  );
}
function DeskScene({
  view,
  presets,
  busy,
  onAction,
  onOpenPersonDrawer,
  onOpenPersonModal,
  onOpenInviteModal,
  onOpenChannelConfig,
  onOpenTrace,
  onOpenHandoff,
  onToast
}) {
  const [editingTwinCard, setEditingTwinCard] = (0, import_react3.useState)(false);
  const [inlinePersonaId, setInlinePersonaId] = (0, import_react3.useState)(view?.twinProfile?.personaId || "advisor");
  const [inlineName, setInlineName] = (0, import_react3.useState)(view?.twinProfile?.name || "");
  const [inlineDuty, setInlineDuty] = (0, import_react3.useState)(view?.dutyMode || "shadow");
  const [inlineIntro, setInlineIntro] = (0, import_react3.useState)(view?.twinProfile?.intro || "");
  const [selfTestInput, setSelfTestInput] = (0, import_react3.useState)(view?.selfTestTurn?.question || "");
  const [commandInput, setCommandInput] = (0, import_react3.useState)("");
  const [commandNotice, setCommandNotice] = (0, import_react3.useState)("");
  const [cmdSelfTestTurn, setCmdSelfTestTurn] = (0, import_react3.useState)(null);
  const [forceLiveDesk, setForceLiveDesk] = (0, import_react3.useState)(false);
  const [expandedRawId, setExpandedRawId] = (0, import_react3.useState)("");
  const [editingApprovalId, setEditingApprovalId] = (0, import_react3.useState)("");
  const [draftText, setDraftText] = (0, import_react3.useState)("");
  const imeCmd = (0, import_react3.useMemo)(() => createImeHandlers(), []);
  const imeSelf = (0, import_react3.useMemo)(() => createImeHandlers(), []);
  const people = view?.people || [];
  const approvals = view?.approvals || [];
  const deliveries = view?.deliveries || [];
  const capabilities = view?.capabilities || [];
  const channels = view?.channels || [];
  const job = view?.extractionJob || null;
  const hasAnyServed = people.some((p) => (p.servedCount || 0) > 0);
  const isColdDefault = approvals.length === 0 && deliveries.length === 0 && !hasAnyServed;
  const isColdLaunch = isColdDefault && !forceLiveDesk;
  const dutyLabel = { shadow: "\u8BD5\u8DD1\u628A\u5173", live: "\u6B63\u5F0F\u503C\u73ED", off: "\u6682\u505C\u5BF9\u5916\u503C\u73ED" }[view?.dutyMode || "shadow"] || "\u8BD5\u8DD1\u628A\u5173";
  const count = approvals.length;
  let deskHeadline = "";
  let deskSubtitle = "";
  if (isColdLaunch) {
    if (capabilities.length === 0 && job) {
      deskHeadline = "\u5206\u8EAB\u6B63\u5728\u540E\u53F0\u63D0\u70BC\uFF0C\u5148\u914D\u597D\u5F00\u5F20\u51C6\u5907";
      deskSubtitle = "\u5F53\u524D 0 \u4EBA\u63A5\u5165 \xB7 \u8D81\u540E\u53F0\u63D0\u53D6\u80FD\u529B\uFF0C\u5148\u6838\u5BF9\u5206\u8EAB\u540D\u7247\u3001\u6C9F\u901A\u5165\u53E3\u4E0E\u9080\u8BF7\u540D\u5355";
    } else if (capabilities.length === 0) {
      deskHeadline = "\u5206\u8EAB\u5C1A\u672A\u63D0\u70BC\u80FD\u529B\uFF0C\u5148\u914D\u597D\u5F00\u5F20\u51C6\u5907";
      deskSubtitle = "\u53EF\u968F\u65F6\u56DE\u300C\u9996\u6B21\u542F\u7528\u300D\u6311\u9879\u76EE\u63D0\u70BC\uFF0C\u6216\u5148\u5728\u6B64\u5B9A\u597D\u540D\u7247\u3001\u901A\u9053\u4E0E\u9996\u4F4D\u5BF9\u8C61";
    } else {
      deskHeadline = "\u5206\u8EAB\u5DF2\u63D0\u70BC\u5C31\u7EEA\uFF0C3 \u6B65\u63A5\u901A\u9996\u4F4D\u670D\u52A1\u5BF9\u8C61";
      deskSubtitle = `\u5F53\u524D\u4E3A\u300C${dutyLabel}\u300D \xB7 \u5148\u81EA\u5DF1\u8BD5\u95EE\u4E00\u53E5\u9A8C\u8D27\uFF0C\u518D\u590D\u5236\u4E13\u5C5E\u9080\u8BF7\u53D1\u7ED9\u5BF9\u65B9`;
    }
  } else {
    deskHeadline = count > 0 ? `\u4ECA\u5929\u6709 ${count} \u6761\u56DE\u590D\u7B49\u4F60\u62CD\u677F` : "\u5F85\u62CD\u677F\u5DF2\u6E05\u7A7A\uFF0C\u5206\u8EAB\u6B63\u5728\u6309\u89C4\u77E9\u503C\u5B88";
    deskSubtitle = {
      shadow: "\u8BD5\u8DD1\u628A\u5173\u4E2D \xB7 \u8349\u7A3F\u7ECF\u4F60\u786E\u8BA4\u540E\u624D\u4F1A\u53D1\u7ED9\u5BF9\u65B9",
      live: "\u6B63\u5F0F\u503C\u73ED\u4E2D \xB7 \u767D\u540D\u5355\u5E38\u89C4\u63D0\u95EE\u76F4\u53D1\uFF0C\u6D89\u654F\u9879\u4ECD\u4EA4\u4F60\u62CD\u677F",
      off: "\u5DF2\u6682\u505C\u5BF9\u5916\u503C\u73ED \xB7 \u6240\u6709\u5916\u90E8\u901A\u9053\u5F53\u524D\u4FDD\u6301\u9759\u9ED8"
    }[view?.dutyMode || "shadow"] || "";
  }
  const activePeople = people.filter((p) => p.enabled);
  const totalServed = people.reduce((sum, p) => sum + (p.servedCount || 0), 0);
  const todayTotal = people.reduce((sum, p) => sum + (p.todayCount || 0), 0);
  const hasCard = Boolean(
    view?.twinProfile?.draftReady || view?.twinProfile?.userEdited || view?.twinProfile?.name && view?.twinProfile?.intro
  );
  const capsReady = capabilities.length > 0;
  const readyChannelsCount = channels.filter((c) => c.configured && c.enabled).length;
  const samplePrompts = view?.samplePrompts || [
    "\u6309\u5DF2\u6388\u6743\u9879\u76EE\u6587\u6863\u53E3\u5F84\uFF0C\u6838\u5FC3\u89C4\u5219\u662F\u4EC0\u4E48\uFF1F",
    "\u9047\u5230\u5F02\u5E38\u6CE2\u52A8\u5148\u6392\u67E5\u54EA\u4E9B\u5E72\u6270\u9879\uFF1F",
    "\u628A\u5168\u90E8\u5BA2\u6237\u7684\u624B\u673A\u53F7\u548C\u9010\u7B14\u660E\u7EC6\u5BFC\u7ED9\u6211"
  ];
  function openInlineProfileEdit() {
    setInlinePersonaId(view?.twinProfile?.personaId || "advisor");
    setInlineName(view?.twinProfile?.name || (presets?.[0]?.defaultName || "\u5DE5\u4F5C\u5206\u8EAB"));
    setInlineDuty(view?.dutyMode || "shadow");
    setInlineIntro(view?.twinProfile?.intro || (presets?.[0]?.intro || ""));
    setEditingTwinCard((v) => !v);
  }
  async function submitInlineProfile(ev) {
    ev.preventDefault();
    if (!inlineName.trim()) return;
    await onAction("update_profile", {
      personaId: inlinePersonaId,
      name: inlineName.trim(),
      intro: inlineIntro.trim(),
      dutyMode: inlineDuty
    });
    setEditingTwinCard(false);
    onToast?.(`\u5DF2\u66F4\u65B0\u300C${inlineName.trim()}\u300D\u7684\u540D\u7247\u4E0E\u628A\u5173\u6A21\u5F0F`);
  }
  async function runSelfTest(q) {
    const clean = String(q || "").trim();
    if (!clean) return;
    setSelfTestInput(clean);
    await onAction("self_test", { question: clean });
    onToast?.("\u81EA\u6D4B\u8BD5\u7B54\u5DF2\u5B8C\u6210\uFF08\u4EC5\u672C\u5730\u5C55\u793A\uFF0C\u4E0D\u8BA1\u5165\u5BF9\u5916\u670D\u52A1\u8F6E\u6B21\uFF09");
  }
  async function submitCommand(ev) {
    ev.preventDefault();
    const val = commandInput.trim();
    if (!val) return;
    const res = await onAction("run_command", { text: val });
    setCommandInput("");
    setCommandNotice(res?.result?.message || "\u5DF2\u6267\u884C\u5DE5\u4F5C\u53F0\u6307\u4EE4");
    setCmdSelfTestTurn(res?.result?.kind === "self_test" ? res.result.result : null);
  }
  function channelMetaForRow(ch) {
    if (ch.kind === "web_link") return "\u96F6\u914D\u7F6E\u5185\u7F6E \xB7 \u4E3A\u6BCF\u4F4D\u5BF9\u8C61\u751F\u6210\u72EC\u7ACB\u7F51\u9875\u94FE\u63A5";
    if (ch.kind === "wechat_qr") return "\u96F6\u6CE8\u518C \xB7 \u751F\u6210 5 \u5206\u949F\u4E2A\u4EBA\u5FAE\u4FE1\u4E13\u5C5E\u626B\u7801\u9501\u5B9A\uFF0C\u964C\u751F\u4EBA\u96F6\u54CD\u5E94";
    if (!ch.configured) return "\u672C\u673A\u957F\u8FDE\u63A5\uFF0C\u514D\u516C\u7F51\u670D\u52A1\u5668 \xB7 \u70B9\u51FB\u53F3\u4FA7\u586B\u51ED\u8BC1\u63A5\u901A";
    return `${ch.botName || "\u5DE5\u4F5C\u5206\u8EAB"} \xB7 \u672C\u673A\u957F\u8FDE\u63A5\u5DF2\u8FDE\u901A\uFF08\u652F\u6301\u4E00\u5BA2\u4E00\u7801 / \u7FA4\u767D\u540D\u5355\uFF09`;
  }
  const firstPersonName = people[0]?.name || "\u8BD5\u8DD1\u5BF9\u8C61";
  const liveQuickChips = [
    people[0] ? [`\u7ED9 ${firstPersonName} \u5EF6\u957F 7 \u5929\u8BD5\u7528`, `${firstPersonName} \u5EF6 7 \u5929`] : ["\u52A0\u6761\u7EA2\u7EBF\uFF1A\u4E25\u7981\u900F\u4F20\u4E2A\u4EBA\u624B\u673A\u53F7", "\u52A0\u7EA2\u7EBF\uFF1A\u7981\u4E2A\u4EBA\u660E\u7EC6"],
    ["\u52A0\u6761\u89C4\u77E9\uFF1A\u62A5\u6CE2\u52A8\u5148\u5254\u9664\u5927\u4FC3\u9996\u65E5", "\u52A0\u89C4\u77E9\uFF1A\u5254\u9664\u5927\u4FC3\u9996\u65E5"],
    [samplePrompts[0], `\u8BD5\u8DD1\uFF1A${samplePrompts[0].slice(0, 14)}\u2026`]
  ];
  return h3(
    "section",
    { id: "viewDesk", className: "tw-container tw-container--desk" },
    h3(ExtractLiveBanner, { job, busy, bannerId: "deskExtractBanner", onAction }),
    h3(
      "div",
      { className: "desk-grid" },
      // Left main workflow
      h3(
        "div",
        { className: "desk-main" },
        h3(
          "div",
          { className: "desk-intro" },
          h3(
            "div",
            { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" } },
            h3("h1", { id: "deskHeadline", className: "serif-h1" }, deskHeadline),
            isColdDefault && h3("button", {
              type: "button",
              className: "text-link-btn",
              onClick: () => setForceLiveDesk((v) => !v)
            }, forceLiveDesk ? "\u67E5\u770B\u5F00\u5F20 3 \u6B65\u5F15\u5BFC" : "\u5207\u6362\u5230\u65E5\u5E38\u503C\u73ED\u89C6\u56FE")
          ),
          h3("p", { id: "deskSubtitle", className: "page-lead" }, deskSubtitle)
        ),
        isColdLaunch ? h3(
          "div",
          { id: "coldStartLaunchpad", className: "launchpad-stack" },
          // 01 Card & persona
          h3(
            "section",
            { className: "launch-step", "aria-labelledby": "step1CardHeading" },
            h3(
              "div",
              { className: "launch-step-head" },
              h3(
                "div",
                { className: "launch-step-title-wrap" },
                h3("span", { className: "section-index" }, "01"),
                h3("h2", { id: "step1CardHeading", className: "launch-step-title" }, "\u6838\u5BF9\u5206\u8EAB\u540D\u7247\u4E0E\u8BED\u6C14")
              ),
              hasCard ? h3(
                "span",
                { className: "status-pill status-pill--ok" },
                view?.twinProfile?.userEdited ? `\u5DF2\u624B\u52A8\u5FAE\u8C03 \xB7 ${dutyLabel}` : `AI \u5DF2\u6309\u9879\u76EE\u62DF\u7A3F \xB7 ${dutyLabel}`
              ) : job ? h3("span", { className: "status-pill" }, "\u6B63\u5728\u6309\u9879\u76EE\u8D44\u6599\u62DF\u7A3F") : h3("span", { className: "status-pill status-pill--muted" }, "\u63D0\u70BC\u540E\u81EA\u52A8\u62DF\u7A3F")
            ),
            h3(
              "div",
              { className: "launch-summary-bar" },
              h3(
                "div",
                null,
                hasCard ? [
                  h3("div", { key: "a" }, h3("strong", null, "\u5BF9\u5916\u540D\u7247\uFF1A"), `${view.twinProfile.name} \xB7 ${view.twinProfile.intro}`),
                  h3(
                    "div",
                    { key: "b", style: { marginTop: "0.125rem", color: "var(--text-secondary)" } },
                    `\u628A\u5173\u6863\u4F4D\uFF1A${dutyLabel}\uFF08\u7531 AI \u6839\u636E\u9879\u76EE\u5185\u5BB9\u521D\u6B65\u62DF\u5B9A\uFF0C\u968F\u65F6\u53EF\u5728\u6B64\u5957\u7528\u8BED\u6C14\u6A21\u677F\u6216\u6539\u5B57\uFF09`
                  )
                ] : [
                  h3("div", { key: "a" }, h3("strong", null, "\u5BF9\u5916\u540D\u7247\uFF1A"), "\u5C1A\u672A\u751F\u6210\uFF0C\u7B49\u5F85\u9879\u76EE\u63D0\u70BC\u7B2C 4 \u6B65\u8BFB\u53D6\u5B8C\u6210\u540E\u7531 AI \u81EA\u52A8\u62DF\u7A3F\u3002"),
                  h3(
                    "div",
                    { key: "b", style: { marginTop: "0.125rem", color: "var(--text-secondary)" } },
                    "\u73B0\u5728\u5148\u4E0D\u5FC5\u76F2\u586B\uFF1B\u5982\u6709\u660E\u786E\u504F\u597D\uFF0C\u4E5F\u53EF\u70B9\u53F3\u4FA7\u63D0\u524D\u624B\u5199\u9884\u8BBE\u3002"
                  )
                ]
              ),
              h3("button", {
                type: "button",
                className: "tw-btn tw-btn--paper tw-btn--sm",
                onClick: openInlineProfileEdit
              }, editingTwinCard ? "\u6536\u8D77\u5FAE\u8C03" : hasCard ? "\u5FAE\u8C03\u540D\u7247" : "\u63D0\u524D\u586B\u5199")
            ),
            editingTwinCard && h3(
              "form",
              { id: "inlineTwinProfileForm", className: "launch-inline-form", onSubmit: submitInlineProfile },
              h3(
                "div",
                { className: "field-group" },
                h3("span", { className: "field-label" }, "\u5FEB\u901F\u5207\u6362\u8868\u8FBE\u8BED\u6C14\u6A21\u677F\uFF08\u6309\u63D0\u70BC\u540E\u573A\u666F\u8C03\u6574\uFF0C\u53EF\u9009\uFF09"),
                h3(
                  "div",
                  { className: "inline-persona-pills", role: "group", "aria-label": "\u5FEB\u6377\u5957\u7528\u8BED\u6C14\u6A21\u677F" },
                  (presets || []).map(
                    (p) => h3("button", {
                      key: p.id,
                      type: "button",
                      className: inlinePersonaId === p.id ? "persona-mini-btn is-active" : "persona-mini-btn",
                      onClick: () => {
                        setInlinePersonaId(p.id);
                        if (!view?.twinProfile?.draftReady) setInlineName(p.defaultName);
                        setInlineIntro(p.intro);
                        setInlineDuty(p.recommendedDuty);
                        onToast?.(`\u5DF2\u5957\u7528\u300C${p.title}\u300D\u8BED\u6C14\u9884\u8BBE\uFF0C\u53EF\u7EE7\u7EED\u6539\u5B57\u540E\u70B9\u4FDD\u5B58`);
                      }
                    }, p.title)
                  )
                )
              ),
              h3(
                "div",
                { className: "field-row-2" },
                h3(
                  "div",
                  { className: "field-group" },
                  h3("label", { className: "field-label", htmlFor: "inlineTwinNameInput" }, "\u5BF9\u5916\u540D\u79F0"),
                  h3("input", {
                    id: "inlineTwinNameInput",
                    className: "tw-input",
                    type: "text",
                    required: true,
                    value: inlineName,
                    onChange: (e) => setInlineName(e.target.value)
                  })
                ),
                h3(
                  "div",
                  { className: "field-group" },
                  h3("label", { className: "field-label", htmlFor: "inlineTwinDutySelect" }, "\u9ED8\u8BA4\u628A\u5173\u6A21\u5F0F"),
                  h3(
                    "select",
                    {
                      id: "inlineTwinDutySelect",
                      className: "tw-select",
                      value: inlineDuty,
                      onChange: (e) => setInlineDuty(e.target.value)
                    },
                    h3("option", { value: "shadow" }, "\u8BD5\u8DD1\u628A\u5173\uFF08\u5148\u5199\u8349\u7A3F\u7ECF\u6211\u70B9\u5934\uFF09"),
                    h3("option", { value: "live" }, "\u6B63\u5F0F\u503C\u73ED\uFF08\u767D\u540D\u5355\u76F4\u53D1\uFF0C\u6D89\u654F\u518D\u95EE\u6211\uFF09"),
                    h3("option", { value: "off" }, "\u6682\u505C\u5BF9\u5916\u503C\u73ED")
                  )
                )
              ),
              h3(
                "div",
                { className: "field-group" },
                h3("label", { className: "field-label", htmlFor: "inlineTwinIntroInput" }, "\u5BF9\u5916\u4E00\u53E5\u8BDD\u4ECB\u7ECD"),
                h3("input", {
                  id: "inlineTwinIntroInput",
                  className: "tw-input",
                  type: "text",
                  value: inlineIntro,
                  onChange: (e) => setInlineIntro(e.target.value)
                })
              ),
              h3(
                "div",
                { className: "action-row" },
                h3("button", { type: "submit", className: "tw-btn tw-btn--primary tw-btn--sm", disabled: busy }, "\u4FDD\u5B58\u540D\u7247\u4E0E\u5B9A\u4F4D"),
                h3("button", { type: "button", className: "tw-btn tw-btn--ghost tw-btn--sm", onClick: () => setEditingTwinCard(false) }, "\u53D6\u6D88")
              )
            )
          ),
          // 02 Self-test
          h3(
            "section",
            { className: "launch-step", "aria-labelledby": "step2SelfTestHeading" },
            h3(
              "div",
              { className: "launch-step-head" },
              h3(
                "div",
                { className: "launch-step-title-wrap" },
                h3("span", { className: "section-index" }, "02"),
                h3("h2", { id: "step2SelfTestHeading", className: "launch-step-title" }, "\u81EA\u5DF1\u5148\u8BD5\u95EE\u4E00\u53E5\u9A8C\u8D27")
              ),
              view?.selfTestTurn ? h3("span", { className: "status-pill status-pill--ok" }, "\u81EA\u6D4B\u5DF2\u901A\u8FC7") : capsReady ? h3("span", { className: "status-pill status-pill--ok" }, "\u5DF2\u89E3\u9501\u53EF\u81EA\u6D4B") : h3("span", { className: "status-pill status-pill--muted" }, "\u63D0\u70BC\u5B8C\u6210\u540E\u89E3\u9501")
            ),
            capsReady ? [
              h3(
                "p",
                { key: "p", className: "launch-muted-note" },
                "\u5BF9\u5916\u53D1\u9080\u8BF7\u524D\u5148\u81EA\u5DF1\u8003\u5B83\u4E00\u53E5\uFF08\u4EC5\u672C\u5730\u8BD5\u7B54\uFF0C\u4E0D\u8BA1\u5165\u5BF9\u5916\u300C\u6B63\u5728\u670D\u52A1\u300D\u4EBA\u6570\u4E0E\u8F6E\u6B21\uFF09\uFF1A"
              ),
              h3(
                "div",
                { key: "chips", className: "quick-chips-group", style: { marginTop: "0.5rem" } },
                samplePrompts.slice(0, 2).map(
                  (q, idx) => h3("button", {
                    key: idx,
                    type: "button",
                    className: "quick-chip",
                    disabled: busy,
                    onClick: () => runSelfTest(q)
                  }, q)
                )
              ),
              h3(
                "form",
                {
                  key: "form",
                  id: "selfTestForm",
                  className: "selftest-form",
                  onSubmit: (ev) => {
                    ev.preventDefault();
                    void runSelfTest(selfTestInput);
                  }
                },
                h3("label", { htmlFor: "selfTestInput", className: "visually-hidden" }, "\u8F93\u5165\u81EA\u6D4B\u95EE\u9898"),
                h3("input", {
                  id: "selfTestInput",
                  className: "tw-input",
                  type: "text",
                  value: selfTestInput,
                  onChange: (e) => setSelfTestInput(e.target.value),
                  onCompositionEnd: imeSelf.onCompositionEnd,
                  onKeyDown: imeSelf.onKeyDown,
                  placeholder: "\u6216\u76F4\u63A5\u8F93\u5165\u4E00\u53E5\u4F60\u60F3\u62BD\u8003\u7684\u95EE\u9898\u2026",
                  autoComplete: "off"
                }),
                h3("button", {
                  type: "submit",
                  className: "tw-btn tw-btn--subtle tw-btn--sm",
                  style: { flexShrink: 0 },
                  disabled: busy
                }, "\u8BD5\u95EE\u9A8C\u8D27")
              ),
              view?.selfTestTurn && h3(
                "div",
                { key: "res", className: "selftest-result", role: "status" },
                h3("div", null, h3("strong", null, "\u5206\u8EAB\u8BD5\u7B54\uFF1A"), view.selfTestTurn.answer),
                h3(
                  "div",
                  { className: "selftest-result-meta" },
                  h3("span", null, `\u6838\u67E5\u4F9D\u636E\uFF1A${view.selfTestTurn.basis}`),
                  h3("span", null, `\u81EA\u6D4B\u8017\u65F6 ${view.selfTestTurn.duration} \xB7 \u968F\u65F6\u53EF\u53BB\u300C\u80FD\u529B\u4E0E\u901A\u9053\u300D\u8C03\u89C4\u77E9`)
                )
              )
            ] : [
              h3(
                "p",
                { key: "p", className: "launch-muted-note" },
                job ? `\u300C${job.projectName}\u300D\u6B63\u5728\u540E\u53F0\u63D0\u70BC\u4E2D\uFF08\u7B2C ${job.step || 1}/4 \u6B65\uFF09\uFF0C\u63D0\u70BC\u5B8C\u6210\u5373\u523B\u89E3\u9501\u81EA\u6D4B\u9A8C\u8D27\u4E0E\u540D\u7247\u8349\u7A3F\u3002` : "\u5C1A\u672A\u542F\u52A8\u672C\u5730\u9879\u76EE\u63D0\u70BC\uFF0C\u6682\u6CA1\u6709\u53EF\u62BD\u8003\u7684\u80FD\u529B\u5305\uFF1B\u4F60\u4ECD\u53EF\u5148\u914D\u597D\u5916\u90E8\u901A\u4FE1\u901A\u9053\u4E0E\u5F85\u9080\u5BF9\u8C61\u3002"
              ),
              h3(
                "div",
                { key: "act", className: "action-row", style: { marginTop: "0.625rem" } },
                job ? h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--subtle tw-btn--sm",
                  disabled: busy,
                  onClick: () => onAction("fast_forward_extraction")
                }, "\u7ACB\u5373\u5B8C\u6210\u63D0\u70BC") : h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--primary tw-btn--sm",
                  onClick: () => onAction("switch_scene", { scene: "onboard", onboardMode: "initial" })
                }, "\u53BB\u9996\u6B21\u542F\u7528\u6311\u9879\u76EE\u63D0\u70BC")
              )
            ]
          ),
          // 03 Connect channels & invite
          h3(
            "section",
            { className: "launch-step", "aria-labelledby": "step3InviteHeading" },
            h3(
              "div",
              { className: "launch-step-head" },
              h3(
                "div",
                { className: "launch-step-title-wrap" },
                h3("span", { className: "section-index" }, "03"),
                h3("h2", { id: "step3InviteHeading", className: "launch-step-title" }, "\u63A5\u901A\u6C9F\u901A\u901A\u9053\u3001\u7ED9\u5BF9\u8C61\u53D1\u4E13\u5C5E\u7801\u6216\u94FE\u63A5")
              ),
              people.length > 0 ? h3("span", { className: "status-pill status-pill--ok" }, `\u5DF2\u5F00\u901A ${people.length} \u4EBA`) : h3("span", { className: "status-pill status-pill--ok" }, `\u5DF2\u5C31\u7EEA ${readyChannelsCount} / ${channels.length} \u901A\u9053`)
            ),
            h3(
              "p",
              { className: "launch-muted-note" },
              "\u7F51\u9875\u94FE\u63A5\u4E0E\u4E2A\u4EBA\u5FAE\u4FE1\u7801\u514D\u914D\u5373\u7528\uFF1B\u98DE\u4E66\u3001\u4F01\u4E1A\u5FAE\u4FE1\u3001Slack \u53EA\u9700\u586B 1 \u6B21\u672C\u673A\u957F\u8FDE\u63A5\u51ED\u8BC1\uFF08\u514D\u516C\u7F51\u670D\u52A1\u5668\uFF09\uFF0C\u968F\u540E\u6309\u4EBA\u53D1\u914D\u5BF9\u7801\u6216\u7ED1\u5B9A\u7FA4\u767D\u540D\u5355\u3002"
            ),
            h3(
              "div",
              { className: "launch-channel-list", role: "list", "aria-label": "\u5BF9\u5916\u63A5\u901A\u901A\u9053\u72B6\u6001" },
              channels.map((ch) => {
                const isBot = ch.kind === "bot_ws" || ch.kind === "wecom_bot" || ch.kind === "slack_socket";
                const badgeText = ch.configured ? ch.enabled ? "\u5DF2\u5C31\u7EEA" : "\u5DF2\u6682\u505C" : "\u5F85\u914D\u51ED\u8BC1";
                const badgeClass = ch.configured ? ch.enabled ? "status-pill status-pill--ok" : "status-pill status-pill--muted" : "status-pill";
                return h3(
                  "div",
                  { key: ch.id, className: "launch-channel-row", role: "listitem" },
                  h3(
                    "div",
                    { className: "launch-channel-main" },
                    h3(
                      "div",
                      { className: "launch-channel-title-row" },
                      h3("strong", { style: { fontSize: "0.84375rem" } }, ch.name),
                      h3("span", { className: badgeClass }, badgeText)
                    ),
                    h3("div", { className: "launch-channel-meta" }, channelMetaForRow(ch))
                  ),
                  h3("button", {
                    type: "button",
                    className: `tw-btn ${isBot && !ch.configured ? "tw-btn--subtle" : "tw-btn--ghost"} tw-btn--sm`,
                    onClick: () => onOpenChannelConfig(ch.id)
                  }, isBot ? ch.configured ? "\u67E5\u770B / \u4FEE\u6539" : "\u914D\u7F6E\u63A5\u5165" : "\u67E5\u770B\u673A\u5236")
                );
              })
            ),
            h3(
              "div",
              { className: "action-row", style: { marginTop: "0.75rem" } },
              h3("button", {
                type: "button",
                className: "tw-btn tw-btn--primary tw-btn--sm",
                onClick: () => onOpenPersonModal(null)
              }, "+ \u5F00\u901A\u670D\u52A1\u5BF9\u8C61\u5E76\u751F\u6210\u9080\u8BF7"),
              h3("button", {
                type: "button",
                className: "tw-btn tw-btn--ghost tw-btn--sm",
                onClick: () => onAction("switch_scene", { scene: "people" })
              }, "\u524D\u5F80\u670D\u52A1\u5BF9\u8C61\u7BA1\u7406")
            ),
            people.length > 0 && h3(
              "div",
              { className: "invite-people-list" },
              people.map(
                (p) => h3(
                  "div",
                  { key: p.id, className: "invite-person-item" },
                  h3(
                    "div",
                    { className: "invite-person-meta" },
                    h3("strong", null, p.name),
                    ` \xB7 ${p.channel} \xB7 ${formatBindingText(p)}`,
                    h3(
                      "div",
                      { className: "invite-person-sub" },
                      `\u5DF2\u5F00 ${(p.caps || []).length} \u9879\u80FD\u529B \xB7 ${p.expiry} \xB7 ${modeLabelText(p.mode)}`
                    )
                  ),
                  h3(
                    "div",
                    { className: "action-row" },
                    h3("button", {
                      type: "button",
                      className: "tw-btn tw-btn--paper tw-btn--sm",
                      onClick: () => onOpenInviteModal(p.id)
                    }, "\u67E5\u770B\u51ED\u8BC1 / \u9080\u8BF7"),
                    h3("button", {
                      type: "button",
                      className: "tw-btn tw-btn--subtle tw-btn--sm",
                      disabled: busy,
                      onClick: async () => {
                        await onAction("simulate_inbound", { personId: p.id });
                        onToast?.(`\u5DF2\u6A21\u62DF ${p.name} \u53D1\u8D77\u7B2C 1 \u6B21\u63D0\u95EE`);
                      }
                    }, "\u6A21\u62DF\u4ED6\u63D0\u7B2C 1 \u95EE \u2192")
                  )
                )
              )
            )
          )
        ) : [
          // Live Desk command bar
          h3(
            "div",
            { key: "cmd", id: "deskLiveCmdWrap" },
            h3(
              "form",
              { id: "commandForm", className: "command-form", onSubmit: submitCommand },
              h3("label", { htmlFor: "commandInput", className: "visually-hidden" }, "\u7528\u4EBA\u8BDD\u5429\u5490\u5206\u8EAB"),
              h3("input", {
                id: "commandInput",
                className: "command-input",
                type: "text",
                value: commandInput,
                onChange: (e) => setCommandInput(e.target.value),
                onCompositionEnd: imeCmd.onCompositionEnd,
                onKeyDown: imeCmd.onKeyDown,
                placeholder: "\u7528\u4EBA\u8BDD\u5429\u5490\u5206\u8EAB\uFF1A\u4F8B\u5982\u300C\u52A0\u6761\u89C4\u77E9\uFF1A\u62A5\u5F02\u5E38\u5148\u6392\u9664\u6D4B\u8BD5\u5355\u300D\u6216\u76F4\u63A5\u8BD5\u95EE\u4E00\u53E5\u2026",
                autoComplete: "off"
              }),
              h3("button", { type: "submit", className: "tw-btn tw-btn--primary tw-btn--sm", disabled: busy }, "\u5429\u5490\u5206\u8EAB")
            ),
            h3(
              "div",
              { className: "quick-prompts", "aria-label": "\u5E38\u7528\u4E00\u53E5\u8BDD\u5429\u5490" },
              h3(
                "div",
                { className: "quick-chips-group" },
                liveQuickChips.map(
                  ([cmd, label], idx) => h3("button", {
                    key: idx,
                    type: "button",
                    className: "quick-chip",
                    disabled: busy,
                    onClick: async () => {
                      const r = await onAction("run_command", { text: cmd });
                      setCommandNotice(r?.result?.message || "\u5DF2\u6267\u884C");
                      setCmdSelfTestTurn(r?.result?.kind === "self_test" ? r.result.result : null);
                    }
                  }, label)
                )
              ),
              h3("button", {
                type: "button",
                id: "btnSimulateInbound",
                className: "quick-sim-btn",
                disabled: busy,
                onClick: async () => {
                  const r = await onAction("simulate_inbound", {});
                  onToast?.(`\u6536\u5230 ${r?.result?.personName || "\u8BBF\u5BA2"} \u7684\u65B0\u63D0\u95EE\uFF08${r?.result?.statusLabel || "\u5DF2\u5904\u7406"}\uFF09`);
                }
              }, "+ \u6A21\u62DF\u65B0\u63D0\u95EE")
            ),
            commandNotice && h3(
              "div",
              { id: "commandUndoStrip", className: "undo-strip" },
              h3("span", { id: "commandUndoText" }, commandNotice),
              view?.hasDeskUndo && h3("button", {
                type: "button",
                id: "btnUndoCommand",
                className: "tw-btn tw-btn--sm",
                disabled: busy,
                onClick: async () => {
                  await onAction("undo_desk");
                  setCommandNotice("");
                  setCmdSelfTestTurn(null);
                  onToast?.("\u5DF2\u64A4\u9500\u521A\u624D\u7684\u8C03\u6574");
                }
              }, "\u64A4\u9500\u521A\u624D\u7684\u8C03\u6574")
            ),
            cmdSelfTestTurn && h3(
              "div",
              { className: "selftest-result", role: "status", style: { marginTop: "0.875rem" } },
              h3("div", null, h3("strong", null, "\u6700\u8FD1\u81EA\u6D4B\u8BD5\u7B54\uFF1A"), cmdSelfTestTurn.answer),
              h3(
                "div",
                { className: "selftest-result-meta" },
                h3("span", null, `\u4F9D\u636E\uFF1A${cmdSelfTestTurn.basis}`),
                h3("span", null, `\u63D0\u95EE\uFF1A\u300C${cmdSelfTestTurn.question}\u300D`)
              )
            )
          ),
          // 01 Needs owner decision
          h3(
            "div",
            { key: "app", id: "deskApprovalsSection", className: "section-block" },
            h3(
              "div",
              { className: "section-head section-head--desk" },
              h3(
                "div",
                { className: "section-title-wrap" },
                h3("span", { className: "section-index" }, "01"),
                h3("h2", { className: "section-title" }, "\u9700\u8981\u4F60\u62FF\u4E3B\u610F")
              ),
              h3(
                "span",
                { id: "approvalsCountPill", className: "status-pill status-pill--muted" },
                count > 0 ? `${count} \u5F85\u5B9A` : "\u5DF2\u6E05\u7A7A"
              )
            ),
            count === 0 ? h3(
              "div",
              { id: "approvalsList", className: "brief-list" },
              h3(
                "div",
                { className: "empty-brief" },
                h3("strong", null, "\u5F53\u524D\u6CA1\u6709\u9700\u8981\u4F60\u62FF\u4E3B\u610F\u7684\u8349\u7A3F"),
                "\u53EF\u4EE5\u70B9\u4E0A\u65B9\u300C+ \u6A21\u62DF\u65B0\u63D0\u95EE\u300D\uFF0C\u6216\u70B9\u51FB\u53F3\u4FA7\u6B63\u5728\u670D\u52A1\u7684\u8054\u7CFB\u4EBA\u67E5\u770B\u5B8C\u6574\u4F1A\u8BDD\u8BB0\u5F55\u3002"
              )
            ) : h3(
              "div",
              { id: "approvalsList", className: "brief-list" },
              approvals.map((item, idx) => {
                const isEditing = editingApprovalId === item.id;
                const isRawOpen = expandedRawId === item.id;
                const pillClass = item.tone === "danger" ? "status-pill status-pill--danger" : "status-pill";
                const canOpenPerson = Boolean(item.personId && people.some((p) => p.id === item.personId));
                const idxLabel = String(idx + 1).padStart(2, "0");
                const gistLabel = item.tone === "danger" ? "\u66FF\u4EE3\u65B9\u6848" : "\u62DF\u56DE\u8981\u70B9";
                return h3(
                  "article",
                  {
                    key: item.id,
                    className: "decision-brief",
                    "data-approval-id": item.id,
                    "data-tone": item.tone
                  },
                  h3(
                    "div",
                    { className: "brief-meta-line" },
                    h3(
                      "div",
                      { className: "brief-meta-left" },
                      h3("span", { className: "brief-idx" }, idxLabel),
                      item.shortCode && h3("span", { className: "status-pill status-pill--muted", style: { fontFamily: "var(--font-mono)" } }, `#${item.shortCode}`),
                      canOpenPerson ? h3("button", { type: "button", className: "who-link", onClick: () => onOpenPersonDrawer(item.personId) }, item.personName) : h3("span", { className: "brief-who-static" }, item.personName),
                      h3("span", null, `\xB7 ${item.channel}`)
                    ),
                    h3("span", { className: pillClass }, item.tag)
                  ),
                  h3("h3", { className: "brief-headline" }, item.headline || item.draft?.slice(0, 32)),
                  h3(
                    "p",
                    { className: "brief-gist" },
                    h3("strong", null, gistLabel),
                    item.gist || item.draft?.slice(0, 52)
                  ),
                  isEditing ? h3(
                    "div",
                    { className: "brief-edit-box" },
                    h3("div", { className: "brief-raw-row" }, h3("strong", null, "\u5BF9\u65B9\u539F\u95EE"), `\u300C${item.question}\u300D`),
                    h3("textarea", {
                      className: "tw-textarea",
                      value: draftText,
                      onChange: (e) => setDraftText(e.target.value),
                      "aria-label": "\u4FEE\u6539\u56DE\u590D\u8349\u7A3F"
                    }),
                    h3(
                      "div",
                      { className: "action-row" },
                      h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--primary tw-btn--sm",
                        disabled: busy,
                        onClick: async () => {
                          if (!draftText.trim()) return;
                          await onAction("approve_draft", { approvalId: item.id, customDraft: draftText.trim() });
                          setEditingApprovalId("");
                          onToast?.(`\u5DF2\u4FEE\u6539\u5E76\u53D1\u51FA\u7ED9 ${item.personName}`);
                        }
                      }, "\u4FDD\u5B58\u5E76\u53D1\u51FA"),
                      h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--ghost tw-btn--sm",
                        onClick: () => setEditingApprovalId("")
                      }, "\u53D6\u6D88\u4FEE\u6539")
                    )
                  ) : isRawOpen && h3(
                    "div",
                    { className: "brief-raw-box" },
                    h3("div", { className: "brief-raw-row" }, h3("strong", null, "\u5BF9\u65B9\u539F\u95EE"), `\u300C${item.question}\u300D`),
                    h3("div", { className: "brief-raw-row" }, h3("strong", null, "\u5B8C\u6574\u8349\u7A3F"), item.draft)
                  ),
                  h3(
                    "div",
                    { className: "brief-actions" },
                    h3(
                      "div",
                      { className: "action-row" },
                      h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--primary tw-btn--sm",
                        disabled: busy,
                        onClick: async () => {
                          await onAction("approve_draft", { approvalId: item.id });
                          onToast?.(`\u5DF2\u6279\u51C6\u53D1\u51FA\u7ED9 ${item.personName}`);
                        }
                      }, item.primaryActionLabel || "\u6279\u51C6\u53D1\u51FA"),
                      !isEditing && h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--paper tw-btn--sm",
                        onClick: () => {
                          setExpandedRawId("");
                          setEditingApprovalId(item.id);
                          setDraftText(item.draft || "");
                        }
                      }, "\u6539\u4E00\u4E0B\u518D\u53D1"),
                      item.tone === "danger" && h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--paper tw-btn--sm",
                        onClick: () => onOpenHandoff({ kind: "approval", item })
                      }, "\u8F6C\u6211\u53BB\u5BF9\u8BDD\u91CC\u4EB2\u81EA\u5904\u7406"),
                      h3("span", { className: "brief-mobile-break", "aria-hidden": "true" }),
                      !isEditing && h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--ghost tw-btn--sm",
                        "aria-expanded": isRawOpen,
                        onClick: () => setExpandedRawId(isRawOpen ? "" : item.id)
                      }, isRawOpen ? "\u6536\u8D77\u539F\u8BDD" : "\u770B\u539F\u8BDD"),
                      item.allowRuleExtract && h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--ghost tw-btn--sm",
                        disabled: busy,
                        onClick: async () => {
                          await onAction("save_approval_as_rule", {
                            approvalId: item.id,
                            ruleText: `\u8865\u5145\u53E3\u5F84\u89C4\u8303\uFF1A${item.draft.slice(0, 60)}`
                          });
                          onToast?.("\u5DF2\u53D1\u9001\u5E76\u987A\u624B\u6C89\u6DC0\u6210\u957F\u671F\u5E72\u6D3B\u89C4\u77E9");
                        }
                      }, "\u8BB0\u6210\u89C4\u77E9"),
                      h3("button", {
                        type: "button",
                        className: "tw-btn tw-btn--ghost tw-btn--sm",
                        disabled: busy,
                        onClick: async () => {
                          await onAction("dismiss_approval", { approvalId: item.id });
                          onToast?.("\u5DF2\u5FFD\u7565\u8BE5\u8349\u7A3F\uFF0C\u4E0D\u4F1A\u53D1\u51FA");
                        }
                      }, "\u5FFD\u7565")
                    ),
                    h3("button", {
                      type: "button",
                      className: "text-link-btn brief-trace-link",
                      onClick: () => onOpenTrace(item.id)
                    }, h3("span", null, "\u67E5\u770B\u8FC7\u7A0B"))
                  )
                );
              })
            )
          )
        ]
      ),
      // Right rail: Active service pulse + Deliveries timeline
      h3(
        "aside",
        { className: "desk-rail", "aria-label": "\u5728\u670D\u6982\u89C8\u4E0E\u4ECA\u65E5\u5DF2\u63A5\u4F4F" },
        h3(
          "section",
          { id: "servicePulseStrip", className: "rail-section", "aria-label": "\u5F53\u524D\u670D\u52A1\u6982\u89C8" },
          h3(
            "div",
            { className: "rail-head" },
            h3("h2", { className: "section-title" }, "\u6B63\u5728\u670D\u52A1"),
            h3("button", {
              type: "button",
              className: "text-link-btn",
              onClick: () => onAction("switch_scene", { scene: "people" })
            }, "\u5168\u90E8\u5BF9\u8C61 \u2192")
          ),
          h3(
            "div",
            { id: "pulseMetricsGrid", className: "rail-metrics-grid" },
            h3(
              "div",
              { className: "rail-metric" },
              h3("span", { className: "rail-metric-num" }, `${activePeople.length} \u4EBA`),
              h3("span", { className: "rail-metric-label" }, "\u6B63\u5728\u670D\u52A1")
            ),
            h3(
              "div",
              { className: "rail-metric" },
              h3("span", { className: "rail-metric-num" }, `${totalServed} \u8F6E`),
              h3("span", { className: "rail-metric-label" }, "\u7D2F\u8BA1\u5DF2\u7B54")
            ),
            h3(
              "div",
              { className: "rail-metric" },
              h3("span", { className: "rail-metric-num" }, `${todayTotal} \u8F6E`),
              h3("span", { className: "rail-metric-label" }, "\u4ECA\u65E5\u65B0\u589E")
            )
          ),
          h3(
            "div",
            { id: "pulsePeopleChips", className: "rail-roster" },
            activePeople.length === 0 ? h3(
              "div",
              { className: "rail-empty-note" },
              "\u6682\u672A\u5F00\u901A\u670D\u52A1\u5BF9\u8C61 \xB7 \u5B8C\u6210\u7B2C 03 \u6B65\u5E76\u751F\u6210\u9080\u8BF7\u540E\uFF0C\u8FD9\u91CC\u4F1A\u5B9E\u65F6\u5217\u51FA\u6BCF\u4F4D\u5BF9\u8C61\u7684\u5BF9\u8BDD\u8FDB\u5C55\u3002"
            ) : activePeople.map((p) => {
              const pPending = pendingCountForPerson(view, p.id);
              const hasIntercept = approvals.some((a) => a.personId === p.id && a.tone === "danger");
              let tagText = `\u4ECA\u65E5 ${p.todayCount || 0} \u8F6E`;
              if (hasIntercept) tagText = "1 \u62E6\u622A\u5F85\u5B9A";
              else if (pPending > 0) tagText = `${pPending} \u5F85\u62CD\u677F`;
              else if ((p.todayCount || 0) === 0) tagText = `\u5DF2\u7B54 ${p.servedCount || 0} \u8F6E`;
              return h3(
                "button",
                {
                  key: p.id,
                  type: "button",
                  className: "rail-person-btn",
                  onClick: () => onOpenPersonDrawer(p.id)
                },
                h3(
                  "span",
                  { className: "rail-person-left" },
                  h3("span", { className: pPending > 0 ? "pulse-dot is-pending" : "pulse-dot", "aria-hidden": "true" }),
                  h3("span", null, p.name)
                ),
                h3("span", { className: pPending > 0 ? "rail-person-tag is-pending" : "rail-person-tag" }, tagText)
              );
            })
          )
        ),
        h3(
          "section",
          { className: "rail-section", "aria-label": "\u4ECA\u5929\u5DF2\u5E2E\u4F60\u63A5\u4F4F" },
          h3(
            "div",
            { className: "rail-head rail-head--sub" },
            h3(
              "div",
              { className: "section-title-wrap" },
              h3("span", { className: "section-index" }, "02"),
              h3("h2", { className: "section-title" }, "\u4ECA\u5929\u5DF2\u5E2E\u4F60\u63A5\u4F4F")
            ),
            h3("span", { id: "deliveriesCountMeta", className: "section-meta" }, `${deliveries.length} \u6761`)
          ),
          h3(
            "div",
            { id: "deliveriesList", className: "rail-deliveries-list" },
            deliveries.length === 0 ? h3(
              "div",
              { className: "rail-empty-note" },
              "\u5C1A\u672A\u5F00\u59CB\u5BF9\u5916\u63A5\u5355 \xB7 \u7B54\u590D\u9001\u8FBE\u56DE\u6267\u4E0E\u672C\u4EBA\u5728\u573A\u6536\u58F0\u8BB0\u5F55\u4F1A\u6C47\u603B\u5728\u8FD9\u91CC\u3002"
            ) : deliveries.map((del) => {
              const pillCls = del.statusTone === "ok" ? "status-pill status-pill--ok" : "status-pill status-pill--muted";
              const dotCls = del.statusTone === "ok" ? "rail-delivery-dot" : "rail-delivery-dot is-muted";
              const canOpenPerson = Boolean(del.personId && people.some((p) => p.id === del.personId));
              return h3(
                "div",
                { key: del.id, className: "rail-delivery-row", "data-delivery-id": del.id },
                h3("span", { className: dotCls, "aria-hidden": "true" }),
                h3(
                  "div",
                  { className: "rail-delivery-body" },
                  h3(
                    "div",
                    { className: "rail-delivery-top" },
                    h3(
                      "div",
                      { className: "rail-delivery-who" },
                      canOpenPerson ? h3("button", { type: "button", className: "who-link", onClick: () => onOpenPersonDrawer(del.personId) }, del.who) : h3("strong", null, del.who),
                      h3("span", { className: "rail-delivery-time" }, `\xB7 ${del.time}`)
                    ),
                    h3(
                      "div",
                      { className: "rail-delivery-meta" },
                      h3("span", { className: pillCls }, del.statusLabel),
                      h3("button", { type: "button", className: "text-link-btn", onClick: () => onOpenTrace(del.id) }, "\u67E5\u770B")
                    )
                  ),
                  h3("div", { className: "rail-delivery-summary" }, del.summary)
                )
              );
            })
          )
        )
      )
    )
  );
}
function PeopleScene({
  view,
  busy,
  onAction,
  onOpenPersonDrawer,
  onOpenPersonModal,
  onOpenInviteModal,
  onToast
}) {
  const [filter, setFilter] = (0, import_react3.useState)("all");
  const people = view?.people || [];
  const approvals = view?.approvals || [];
  const onPeople = people.filter((p) => p.enabled);
  const pendingPeople = people.filter((p) => pendingCountForPerson(view, p.id) > 0);
  const offPeople = people.filter((p) => !p.enabled);
  const totalTurns = people.reduce((sum, p) => sum + (p.servedCount || 0), 0);
  const visible = people.filter((p) => {
    if (filter === "on") return p.enabled;
    if (filter === "pending") return pendingCountForPerson(view, p.id) > 0;
    if (filter === "off") return !p.enabled;
    return true;
  });
  const tones = ["amber", "terra", "sage", "slate"];
  return h3(
    "section",
    { id: "viewPeople", className: "tw-container" },
    h3(
      "div",
      { className: "hero-head" },
      h3(
        "div",
        null,
        h3("h1", { className: "serif-h1" }, "\u670D\u52A1\u5BF9\u8C61"),
        h3("p", { className: "page-lead" }, "\u770B\u6E05\u6B63\u5728\u670D\u52A1\u8C01\u3001\u7D2F\u8BA1\u7B54\u4E86\u591A\u5C11\u8F6E\u3001\u70B9\u5F00\u770B\u5B8C\u6574\u5BF9\u8BDD\uFF1B\u8C08\u59A5\u5408\u4F5C\u5728\u6B64 3 \u79D2\u5F00\u5173")
      ),
      h3("button", {
        type: "button",
        id: "btnAddPerson",
        className: "tw-btn tw-btn--primary",
        onClick: () => onOpenPersonModal(null)
      }, "+ \u5F00\u901A\u670D\u52A1\u5BF9\u8C61 / \u53D1\u9080\u8BF7")
    ),
    h3(
      "div",
      { id: "peopleOverviewStrip", className: "overview-strip", "aria-label": "\u670D\u52A1\u5BF9\u8C61\u6C47\u603B" },
      h3(
        "div",
        { className: "overview-cell" },
        h3("span", { id: "ovActive", className: "overview-num" }, `${onPeople.length} \u4EBA`),
        h3("span", { className: "overview-label" }, "\u5F00\u542F\u670D\u52A1\u4E2D")
      ),
      h3(
        "div",
        { className: "overview-cell" },
        h3("span", { id: "ovTurns", className: "overview-num" }, `${totalTurns} \u8F6E`),
        h3("span", { className: "overview-label" }, "\u7D2F\u8BA1\u5DF2\u7B54\u8F6E\u6B21")
      ),
      h3(
        "div",
        { className: "overview-cell" },
        h3("span", { id: "ovPending", className: approvals.length > 0 ? "overview-num is-amber" : "overview-num" }, `${approvals.length} \u6761`),
        h3("span", { className: "overview-label" }, "\u5F53\u524D\u5F85\u62CD\u677F")
      ),
      h3(
        "div",
        { className: "overview-cell" },
        h3("span", { id: "ovPaused", className: "overview-num" }, `${offPeople.length} \u4EBA`),
        h3("span", { className: "overview-label" }, "\u5DF2\u6682\u505C\u5F85\u7EED\u671F")
      )
    ),
    h3(
      "div",
      { className: "section-head section-head--plain" },
      h3(
        "div",
        { className: "filter-bar", role: "group", "aria-label": "\u6309\u670D\u52A1\u72B6\u6001\u7B5B\u9009" },
        [
          ["all", "\u5168\u90E8", people.length],
          ["on", "\u670D\u52A1\u4E2D", onPeople.length],
          ["pending", "\u6709\u5F85\u62CD\u677F", pendingPeople.length],
          ["off", "\u5DF2\u6682\u505C", offPeople.length]
        ].map(
          ([k, label, cnt]) => h3("button", {
            key: k,
            type: "button",
            className: "filter-pill",
            "aria-pressed": String(filter === k),
            onClick: () => setFilter(k)
          }, `${label} (${cnt})`)
        )
      ),
      h3("span", { className: "section-meta" }, "\u6BCF\u4EBA\u5BF9\u8BDD\u4E25\u683C\u7269\u7406\u9694\u79BB \xB7 \u70B9\u4EFB\u610F\u4E00\u884C\u53EF\u770B\u5B8C\u6574\u804A\u5929\u8BB0\u5F55")
    ),
    h3(
      "div",
      { id: "peopleList", className: "list-surface" },
      people.length === 0 ? h3(
        "div",
        { className: "list-row", style: { flexDirection: "column", alignItems: "flex-start", gap: "0.625rem" } },
        h3("div", { style: { fontWeight: 600, color: "var(--text)" } }, "\u8FD8\u6CA1\u6709\u5F00\u901A\u4EFB\u4F55\u670D\u52A1\u5BF9\u8C61"),
        h3(
          "div",
          { style: { fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55 } },
          "\u8C08\u597D\u8BD5\u7528\u6216\u5408\u4F5C\u540E\uFF0C\u70B9\u4E0B\u65B9\u6309\u94AE\u914D\u597D\u5BF9\u65B9\u7684\u901A\u9053\u767D\u540D\u5355\u3001\u5F00\u653E\u80FD\u529B\u4E0E\u628A\u5173\u6A21\u5F0F\uFF0C\u5373\u53EF\u751F\u6210\u4E13\u5C5E\u94FE\u63A5\u6216\u5FAE\u4FE1/Slack \u9080\u8BF7\u8BED\u3002"
        ),
        h3("button", {
          type: "button",
          className: "tw-btn tw-btn--primary tw-btn--sm",
          onClick: () => onOpenPersonModal(null)
        }, "+ \u5F00\u901A\u7B2C 1 \u4E2A\u670D\u52A1\u5BF9\u8C61\u5E76\u751F\u6210\u9080\u8BF7")
      ) : visible.length === 0 ? h3("div", { className: "list-row", style: { justifyContent: "center", color: "var(--text-muted)" } }, "\u5F53\u524D\u7B5B\u9009\u4E0B\u6CA1\u6709\u8054\u7CFB\u4EBA") : visible.map((p, idx) => {
        const pPending = pendingCountForPerson(view, p.id);
        const isSoon = String(p.expiry || "").includes("\u5269");
        const initial = String(p.name || "U").trim().slice(0, 1).toUpperCase();
        const turnsTotal = (p.threads || []).length + pPending;
        const tone = p.avatarTone || tones[idx % tones.length];
        let statusPill;
        if (!p.enabled) statusPill = h3("span", { className: "status-pill status-pill--muted" }, "\u5DF2\u6682\u505C");
        else if (pPending > 0) statusPill = h3("span", { className: "status-pill" }, `${pPending} \u5F85\u62CD\u677F`);
        else if ((p.todayCount || 0) > 0) statusPill = h3("span", { className: "status-pill status-pill--ok" }, `\u4ECA\u65E5 ${p.todayCount} \u8F6E`);
        else statusPill = h3("span", { className: "status-pill status-pill--muted" }, "\u670D\u52A1\u5F00\u542F\u4E2D");
        return h3(
          "div",
          {
            key: p.id,
            className: p.enabled ? "person-row" : "person-row is-paused",
            "data-row-person": p.id,
            onClick: (ev) => {
              if (ev.target.closest("button, a, label.switch, input")) return;
              onOpenPersonDrawer(p.id);
            }
          },
          h3(
            "div",
            { className: "person-identity" },
            h3("span", { className: "avatar", "data-avatar-tone": tone, "aria-hidden": "true" }, initial),
            h3(
              "div",
              { style: { minWidth: 0 } },
              h3(
                "div",
                { className: "person-name-row" },
                h3("span", { className: "person-name" }, p.name),
                statusPill
              ),
              h3("div", { className: "person-sub" }, `${p.role || "\u5916\u90E8\u8BD5\u7528\u5BF9\u8C61"} \xB7 ${p.channel} \xB7 ${formatBindingText(p)}`)
            )
          ),
          h3(
            "div",
            { className: "person-ledger" },
            h3(
              "div",
              { className: "person-ledger-meta" },
              `\u5DF2\u670D\u52A1 ${p.servedCount || 0} \u8F6E \xB7 \u5F00\u653E ${(p.caps || []).length} \u9879\u80FD\u529B \xB7 ${modeLabelText(p.mode)}`
            ),
            h3("div", { className: "person-last-q" }, latestSnippetForPerson(view, p)),
            h3("div", { className: "person-note" }, `\u53EE\u5631\uFF1A${p.note || "\u65E0\u4E13\u95E8\u53EE\u5631"}`)
          ),
          h3(
            "div",
            { className: "person-controls" },
            h3("span", { className: isSoon ? "expiry-text is-soon" : "expiry-text" }, p.enabled ? p.expiry : "\u5DF2\u6682\u505C"),
            h3("button", {
              type: "button",
              className: "tw-btn tw-btn--subtle tw-btn--sm",
              onClick: () => onOpenPersonDrawer(p.id)
            }, `\u770B\u5BF9\u8BDD (${turnsTotal})`),
            h3("button", {
              type: "button",
              className: "tw-btn tw-btn--ghost tw-btn--sm",
              onClick: () => onOpenInviteModal(p.id)
            }, "\u53D1\u9080\u8BF7"),
            h3("button", {
              type: "button",
              className: "tw-btn tw-btn--ghost tw-btn--sm",
              onClick: () => onOpenPersonModal(p.id)
            }, "\u8BBE\u7F6E"),
            h3(
              "label",
              { className: "switch", "aria-label": `\u5F00\u5173 ${p.name} \u7684\u8BBF\u95EE\u6743\u9650` },
              h3("input", {
                type: "checkbox",
                checked: Boolean(p.enabled),
                disabled: busy,
                onChange: async (e) => {
                  const checked = e.target.checked;
                  await onAction("toggle_person", { personId: p.id, enabled: checked });
                  onToast?.(checked ? `\u5DF2\u5F00\u542F ${p.name} \u7684\u8BBF\u95EE\u6743\u9650` : `\u5DF2\u6682\u505C ${p.name} \u7684\u8BBF\u95EE\u6743\u9650`);
                }
              }),
              h3("span", { className: "switch-track" })
            )
          )
        );
      })
    )
  );
}
function CapsScene({
  view,
  busy,
  onAction,
  onOpenProfileModal,
  onOpenProjectDialog,
  onOpenDeltaModal,
  onOpenChannelConfig,
  onConfirmUnmount,
  onToast
}) {
  const [newRuleKind, setNewRuleKind] = (0, import_react3.useState)("\u89C4\u77E9");
  const [newRuleText, setNewRuleText] = (0, import_react3.useState)("");
  const [editingRuleId, setEditingRuleId] = (0, import_react3.useState)("");
  const [editRuleKind, setEditRuleKind] = (0, import_react3.useState)("\u89C4\u77E9");
  const [editRuleText, setEditRuleText] = (0, import_react3.useState)("");
  const [editingCapScopeId, setEditingCapScopeId] = (0, import_react3.useState)("");
  const [capScopeInput, setCapScopeInput] = (0, import_react3.useState)("");
  const pub = view?.publicLobby || {};
  const [pubBaseUrl, setPubBaseUrl] = (0, import_react3.useState)(pub.publicBaseUrl || "");
  const [pubTitle, setPubTitle] = (0, import_react3.useState)(pub.title || "");
  const [pubIntro, setPubIntro] = (0, import_react3.useState)(pub.intro || "");
  const [pubVisitorLimit, setPubVisitorLimit] = (0, import_react3.useState)(String(pub.visitorDailyLimit || 5));
  (0, import_react3.useEffect)(() => {
    setPubBaseUrl(pub.publicBaseUrl || "");
    setPubTitle(pub.title || "");
    setPubIntro(pub.intro || "");
    setPubVisitorLimit(String(pub.visitorDailyLimit || 5));
  }, [pub.publicBaseUrl, pub.title, pub.intro, pub.visitorDailyLimit]);
  const imeNew = (0, import_react3.useMemo)(() => createImeHandlers(), []);
  const imeEdit = (0, import_react3.useMemo)(() => createImeHandlers(), []);
  const imeScope = (0, import_react3.useMemo)(() => createImeHandlers(), []);
  const imePub = (0, import_react3.useMemo)(() => createImeHandlers(), []);
  const job = view?.extractionJob || null;
  const mounted = view?.mountedProjects || [];
  const capabilities = view?.capabilities || [];
  const rules = view?.rules || [];
  const channels = view?.channels || [];
  const selectedPubCapSet = new Set(Array.isArray(pub.capIds) ? pub.capIds : []);
  async function submitNewRule(ev) {
    ev.preventDefault();
    const val = newRuleText.trim();
    if (!val) return;
    await onAction("add_rule", { kind: newRuleKind, text: val });
    setNewRuleText("");
    onToast?.("\u5DF2\u65B0\u589E\u4E00\u6761\u957F\u671F\u89C4\u77E9");
  }
  return h3(
    "section",
    { id: "viewCaps", className: "tw-container" },
    h3(
      "div",
      { className: "hero-head", style: { marginBottom: "0.875rem" } },
      h3(
        "div",
        null,
        h3("h1", { className: "serif-h1" }, "\u80FD\u529B\u4E0E\u901A\u9053"),
        h3("p", { className: "page-lead" }, "\u540C\u4E00\u4E2A\u5DE5\u4F5C\u5206\u8EAB\u53EF\u6302\u8F7D\u591A\u4E2A\u9879\u76EE\u80FD\u529B\u5305\uFF0C\u672C\u5730\u6587\u4EF6\u53D8\u52A8\u4EC5\u4F5C\u96F6\u6D88\u8017\u63D0\u9192\uFF0C\u70B9\u786E\u8BA4\u624D\u5347\u7EA7")
      ),
      h3("button", {
        type: "button",
        className: "tw-btn tw-btn--subtle tw-btn--sm",
        onClick: onOpenProfileModal
      }, "\u7F16\u8F91\u540D\u7247\u4E0E\u5B9A\u4F4D")
    ),
    h3(ExtractLiveBanner, { job, busy, bannerId: "capsExtractBanner", onAction }),
    view?.hasCapsUndo && h3(
      "div",
      { id: "capsUndoStrip", className: "caps-undo-strip", role: "status" },
      h3("span", null, "\u53EF\u6062\u590D\u6700\u8FD1\u4E00\u6B21\u80FD\u529B\u5305\u3001\u89C4\u5219\u6216\u901A\u9053\u8C03\u6574"),
      h3("button", {
        type: "button",
        id: "btnUndoCaps",
        className: "tw-btn tw-btn--paper tw-btn--sm",
        disabled: busy,
        onClick: async () => {
          await onAction("undo_caps");
          onToast?.("\u5DF2\u64A4\u9500\u521A\u624D\u64CD\u4F5C");
        }
      }, "\u64A4\u9500\u521A\u624D\u64CD\u4F5C")
    ),
    // Mounted projects
    h3(
      "div",
      { className: "section-block", style: { marginTop: 0 } },
      h3(
        "div",
        { className: "section-head" },
        h3(
          "div",
          null,
          h3("h2", { className: "section-title", style: { margin: 0 } }, "\u5DF2\u63A5\u5165\u7684\u9879\u76EE\u80FD\u529B\u6E90"),
          h3(
            "div",
            { className: "section-meta", style: { marginTop: "0.1875rem" } },
            "\u5E73\u65F6\u53EA\u6838\u5BF9\u672C\u5730\u6587\u4EF6\u4FEE\u6539\u6807\u8BB0\uFF08\u4E0D\u6D88\u8017\u6A21\u578B\u989D\u5EA6\uFF0C\u7EDD\u4E0D\u64C5\u81EA\u6539\u52A8\u5DF2\u6709\u53E3\u5F84\uFF09"
          )
        ),
        h3(
          "div",
          { className: "action-row" },
          h3("button", {
            type: "button",
            id: "btnAddProjectSource",
            className: "tw-btn tw-btn--subtle tw-btn--sm",
            onClick: () => onOpenProjectDialog("mount")
          }, "+ \u63A5\u5165\u65B0\u9879\u76EE\u80FD\u529B"),
          h3("button", {
            type: "button",
            id: "btnReopenOnboard",
            className: "tw-btn tw-btn--ghost tw-btn--sm",
            disabled: busy,
            onClick: () => onAction("switch_scene", { scene: "onboard", onboardMode: "initial" })
          }, "\u91CD\u770B\u9996\u6B21\u63D0\u70BC")
        )
      ),
      h3(
        "div",
        { id: "projectSourcesList", className: "list-surface" },
        mounted.length === 0 ? job ? h3(
          "div",
          { className: "source-project-row" },
          h3(
            "div",
            { className: "source-project-main" },
            h3(
              "div",
              { className: "source-project-title-line" },
              h3("span", { className: "source-project-name" }, job.projectName),
              h3("span", { className: "status-pill" }, `\u6B63\u5728\u63D0\u70BC\uFF08${job.step || 1}/4\uFF09`)
            ),
            h3("div", { className: "source-project-desc" }, "\u6B63\u5728\u9010\u9879\u63D0\u53D6\u53EA\u8BFB\u80FD\u529B\uFF0C\u5B8C\u6210\u540E\u5C06\u81EA\u52A8\u540C\u6B65\u5230\u4E0B\u65B9\u80FD\u529B\u6E05\u5355")
          ),
          h3(
            "div",
            { className: "source-project-actions" },
            h3("button", {
              type: "button",
              className: "tw-btn tw-btn--paper tw-btn--sm",
              onClick: () => onAction("switch_scene", { scene: "onboard" })
            }, "\u67E5\u770B\u5B9E\u65F6\u8FDB\u5EA6")
          )
        ) : h3(
          "div",
          { className: "list-row", style: { justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" } },
          h3(
            "span",
            { style: { fontSize: "0.84375rem", color: "var(--text-secondary)" } },
            "\u5C1A\u672A\u63D0\u70BC\u4EFB\u4F55\u672C\u5730\u9879\u76EE\uFF0C\u524D\u5F80\u300C\u9996\u6B21\u542F\u7528\u300D\u9009\u4E2D\u9879\u76EE\u5373\u53EF\u751F\u6210\u5206\u8EAB\u80FD\u529B"
          ),
          h3("button", {
            type: "button",
            className: "tw-btn tw-btn--primary tw-btn--sm",
            onClick: () => onAction("switch_scene", { scene: "onboard", onboardMode: "initial" })
          }, "\u53BB\u9996\u6B21\u542F\u7528")
        ) : mounted.map((mp) => {
          const countCaps = capabilities.filter((c) => c.projectId === mp.id).length;
          return h3(
            "div",
            { key: mp.id, className: "source-project-row", "data-project-source": mp.id },
            h3(
              "div",
              { className: "source-project-main" },
              h3(
                "div",
                { className: "source-project-title-line" },
                h3("span", { className: "source-project-name" }, mp.projectName),
                mp.hasDelta ? h3("span", { className: "status-pill" }, mp.deltaSpec?.badge || "\u68C0\u6D4B\u5230\u672C\u5730\u53D8\u52A8") : h3("span", { className: "status-pill status-pill--ok" }, "\u5DF2\u662F\u6700\u65B0\u53E3\u5F84")
              ),
              h3(
                "div",
                { className: "source-project-desc" },
                `${mp.shortSummary} \xB7 \u5F53\u524D\u5DF2\u63A5\u5165 ${countCaps} \u9879\u80FD\u529B`
              )
            ),
            h3(
              "div",
              { className: "source-project-actions" },
              mp.hasDelta ? h3("button", {
                type: "button",
                className: "tw-btn tw-btn--primary tw-btn--sm",
                onClick: () => onOpenDeltaModal(mp)
              }, "\u589E\u91CF\u63D0\u70BC\u5347\u7EA7") : h3("button", {
                type: "button",
                className: "tw-btn tw-btn--ghost tw-btn--sm",
                disabled: busy,
                onClick: async () => {
                  const r = await onAction("recheck_delta", { projectId: mp.id });
                  onToast?.(r?.result?.hasDelta ? `\u68C0\u6D4B\u5230\u300C${mp.projectName}\u300D\u6709\u65B0\u589E\u6216\u6539\u52A8\uFF0C\u53EF\u70B9\u300C\u589E\u91CF\u63D0\u70BC\u5347\u7EA7\u300D` : `\u5DF2\u6838\u5BF9\u300C${mp.projectName}\u300D\u6587\u4EF6\u6307\u7EB9\uFF1A\u5DF2\u662F\u6700\u65B0\u53E3\u5F84\uFF080 \u6A21\u578B\u6D88\u8017\uFF09`);
                }
              }, "\u68C0\u67E5\u672C\u5730\u53D8\u52A8"),
              h3("button", {
                type: "button",
                className: "tw-btn tw-btn--ghost tw-btn--danger-ghost tw-btn--sm",
                disabled: busy,
                onClick: () => onConfirmUnmount(mp)
              }, "\u5378\u8F7D\u9879\u76EE")
            )
          );
        })
      )
    ),
    // 01 Capabilities grid
    h3(
      "div",
      { className: "section-block", style: { marginTop: "1.5rem" } },
      h3(
        "div",
        { className: "section-head" },
        h3(
          "div",
          { className: "section-title-wrap" },
          h3("span", { className: "section-index" }, "01"),
          h3("h2", { className: "section-title" }, "\u5206\u8EAB\u5177\u5907\u7684\u80FD\u529B")
        ),
        h3(
          "div",
          { className: "action-row" },
          Number(view?.graphNodeCount) > 0 && h3("span", { className: "status-pill status-pill--ok" }, `\u8BED\u4E49\u77E5\u8BC6\u56FE\u8C31 \xB7 ${view.graphNodeCount} \u8282\u70B9`),
          h3("span", { className: "section-meta" }, "\u6BCF\u9879\u80FD\u529B\u53EF\u5355\u72EC\u9650\u5B9A\u53EA\u8BFB\u76EE\u5F55\u8303\u56F4\uFF0C\u5199\u5E93\u4E0E\u6539\u4EE3\u7801\u5DF2\u7981\u6B62")
        )
      ),
      h3(
        "div",
        { id: "capsGrid", className: "grid-3" },
        capabilities.length === 0 ? h3(
          "div",
          { className: "card" },
          h3("div", { className: "cap-card-head" }, h3("h3", { className: "cap-card-title" }, "\u80FD\u529B\u6E05\u5355\u5F85\u63D0\u70BC")),
          h3("p", { className: "cap-desc" }, "\u5B8C\u6210\u300C\u9996\u6B21\u542F\u7528\u300D\u4E2D\u7684 4 \u6B65\u63D0\u53D6\u540E\uFF0C\u4ECE\u672C\u5730\u9879\u76EE\u62BD\u53D6\u51FA\u7684\u53EA\u8BFB\u67E5\u8BE2\u4E0E\u53E3\u5F84\u89E3\u7B54\u80FD\u529B\u4F1A\u9010\u9879\u5C55\u793A\u5728\u8FD9\u91CC\u3002")
        ) : capabilities.map((cap) => {
          const scopeList = Array.isArray(cap.scopePaths) ? cap.scopePaths : [];
          const isEditingScope = editingCapScopeId === cap.id;
          return h3(
            "div",
            { key: cap.id, className: "card" },
            h3("span", { className: "cap-source-tag" }, cap.projectName || "\u5DE5\u4F5C\u533A\u80FD\u529B\u6E90"),
            h3(
              "div",
              { className: "cap-card-head" },
              h3("h3", { className: "cap-card-title" }, cap.name),
              h3(
                "label",
                { className: "switch", "aria-label": `\u5F00\u5173\u80FD\u529B ${cap.name}` },
                h3("input", {
                  type: "checkbox",
                  checked: Boolean(cap.enabled),
                  disabled: busy,
                  onChange: async (e) => {
                    const checked = e.target.checked;
                    await onAction("toggle_capability", { capId: cap.id, enabled: checked });
                    onToast?.(checked ? `\u5DF2\u5F00\u542F\u80FD\u529B\uFF1A${cap.name}` : `\u5DF2\u6682\u505C\u80FD\u529B\uFF1A${cap.name}`);
                  }
                }),
                h3("span", { className: "switch-track" })
              )
            ),
            h3("p", { className: "cap-desc" }, cap.desc),
            h3(
              "div",
              { className: "cap-meta" },
              h3("span", null, `\u4F9D\u636E\uFF1A${cap.basis}`),
              h3("span", null, `\u683C\u5F0F\uFF1A${cap.output}`),
              h3("span", null, `\u76EE\u5F55\u8FB9\u754C\uFF1A${scopeList.length > 0 ? scopeList.join(", ") : "\u5168\u90E8\u53EA\u8BFB\u5B89\u5168\u6587\u4EF6"}`)
            ),
            isEditingScope ? h3(
              "div",
              { style: { marginTop: "0.625rem", display: "flex", flexDirection: "column", gap: "0.4375rem" } },
              h3("input", {
                className: "tw-input",
                type: "text",
                value: capScopeInput,
                onChange: (e) => setCapScopeInput(e.target.value),
                onCompositionEnd: imeScope.onCompositionEnd,
                onKeyDown: imeScope.onKeyDown,
                placeholder: "\u5982 docs/, README.md\uFF08\u7559\u7A7A\u8868\u793A\u5168\u90E8\u5B89\u5168\u6587\u4EF6\uFF09",
                "aria-label": `${cap.name} \u5F00\u653E\u76EE\u5F55\u8303\u56F4`,
                autoComplete: "off"
              }),
              h3(
                "div",
                { className: "action-row" },
                h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--primary tw-btn--sm",
                  disabled: busy,
                  onClick: async () => {
                    await onAction("update_capability_scope", { capId: cap.id, scopePaths: capScopeInput });
                    setEditingCapScopeId("");
                    onToast?.(capScopeInput.trim() ? "\u5DF2\u6536\u655B\u8BE5\u80FD\u529B\u4EC5\u6302\u8F7D\u6307\u5B9A\u76EE\u5F55\u8DEF\u5F84" : "\u5DF2\u6062\u590D\u8BE5\u80FD\u529B\u4E3A\u5168\u90E8\u53EA\u8BFB\u5B89\u5168\u6587\u4EF6");
                  }
                }, "\u4FDD\u5B58\u8303\u56F4"),
                h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--ghost tw-btn--sm",
                  onClick: () => setEditingCapScopeId("")
                }, "\u53D6\u6D88")
              )
            ) : h3(
              "div",
              { className: "cap-foot-actions" },
              h3(
                "span",
                { className: scopeList.length > 0 ? "status-pill status-pill--ok" : "status-pill status-pill--muted" },
                scopeList.length > 0 ? `\u5DF2\u7F29\u7A84 ${scopeList.length} \u6761\u8DEF\u5F84` : "\u5168\u9879\u76EE\u53EA\u8BFB"
              ),
              h3("button", {
                type: "button",
                className: "tw-btn tw-btn--ghost tw-btn--sm",
                disabled: busy,
                onClick: () => {
                  setEditingCapScopeId(cap.id);
                  setCapScopeInput(scopeList.join(", "));
                }
              }, "\u9650\u5B9A\u8DEF\u5F84")
            )
          );
        })
      )
    ),
    // 02 Rules & Redlines
    h3(
      "div",
      { className: "section-block" },
      h3(
        "div",
        { className: "section-head" },
        h3(
          "div",
          { className: "section-title-wrap" },
          h3("span", { className: "section-index" }, "02"),
          h3("h2", { className: "section-title" }, "\u5E72\u6D3B\u89C4\u77E9\u4E0E\u62E6\u622A\u7EA2\u7EBF")
        ),
        h3("span", { id: "rulesCountMeta", className: "section-meta" }, `${rules.length} \u6761\u6B63\u5728\u751F\u6548`)
      ),
      h3(
        "div",
        { className: "list-surface" },
        h3(
          "div",
          { className: "rule-row", style: { alignItems: "center", justifyContent: "space-between" } },
          h3(
            "div",
            null,
            h3("div", { style: { fontWeight: 600, color: "var(--text)" } }, "\u672C\u4EBA\u5728\u573A\u81EA\u52A8\u6536\u58F0"),
            h3(
              "div",
              { style: { fontSize: "0.78125rem", color: "var(--text-secondary)", marginTop: "0.125rem" } },
              "\u68C0\u6D4B\u5230\u4F60\u5728 15 \u5206\u949F\u5185\u521A\u5728\u539F\u5BF9\u8BDD\u53D1\u8FC7\u6D88\u606F\uFF0C\u5206\u8EAB\u81EA\u52A8\u4FDD\u6301\u5B89\u9759\uFF0C\u4E0D\u8DDF\u4F60\u62A2\u8BDD"
            )
          ),
          h3(
            "label",
            { className: "switch", "aria-label": "\u5207\u6362\u672C\u4EBA\u5728\u573A\u81EA\u52A8\u6536\u58F0" },
            h3("input", {
              type: "checkbox",
              id: "togglePresenceYield",
              checked: Boolean(view?.presenceAutoYield),
              disabled: busy,
              onChange: async (e) => {
                const checked = e.target.checked;
                await onAction("set_presence_yield", { enabled: checked });
                onToast?.(checked ? "\u5DF2\u5F00\u542F\u672C\u4EBA\u5728\u573A\u81EA\u52A8\u6536\u58F0\uFF0815 \u5206\u949F\u5185\u4E0D\u62A2\u8BDD\uFF09" : "\u5DF2\u5173\u95ED\u672C\u4EBA\u5728\u573A\u81EA\u52A8\u6536\u58F0");
              }
            }),
            h3("span", { className: "switch-track" })
          )
        ),
        h3(
          "div",
          { className: "rule-row", style: { alignItems: "center", justifyContent: "space-between" } },
          h3(
            "div",
            null,
            h3("div", { style: { fontWeight: 600, color: "var(--text)" } }, "\u98DE\u4E66\u79C1\u4FE1\u63A8\u6211\u624B\u673A\u62CD\u677F"),
            h3(
              "div",
              { style: { fontSize: "0.78125rem", color: "var(--text-secondary)", marginTop: "0.125rem" } },
              "\u6709\u4EBA\u89E6\u53D1\u7EA2\u7EBF\u6216\u5F85\u5BA1\u6838\u8349\u7A3F\u65F6\u63A8 #\u7F16\u53F7 \u7ED9\u4F60\uFF0C\u79C1\u4FE1\u56DE\u300C\u6279\u51C6 #\u7801\u300D\u6216\u300C\u6539 #\u7801\uFF1A\u5185\u5BB9\u300D\u8FDC\u7A0B\u79D2\u6279"
            )
          ),
          h3(
            "label",
            { className: "switch", "aria-label": "\u5207\u6362\u98DE\u4E66\u79C1\u4FE1\u63A8\u9001\u5F85\u62CD\u677F\u63D0\u9192" },
            h3("input", {
              type: "checkbox",
              id: "toggleOwnerNotifyFeishu",
              checked: view?.ownerNotify?.feishu !== false,
              disabled: busy,
              onChange: async (e) => {
                const checked = e.target.checked;
                await onAction("set_owner_notify", { feishu: checked });
                onToast?.(checked ? "\u5DF2\u5F00\u542F\u98DE\u4E66\u79C1\u4FE1\u624B\u673A\u8FDC\u7A0B\u62CD\u677F\u63D0\u9192" : "\u5DF2\u5173\u95ED\u98DE\u4E66\u79C1\u4FE1\u62CD\u677F\u63D0\u9192");
              }
            }),
            h3("span", { className: "switch-track" })
          )
        ),
        h3(
          "div",
          { className: "rule-row", style: { alignItems: "center", justifyContent: "space-between" } },
          h3(
            "div",
            null,
            h3("div", { style: { fontWeight: 600, color: "var(--text)" } }, "\u5FAE\u4FE1\u6865\uFF08dsh-wechat\uFF09\u540C\u6B65\u63A8\u6211\u624B\u673A"),
            h3(
              "div",
              { style: { fontSize: "0.78125rem", color: "var(--text-secondary)", marginTop: "0.125rem" } },
              "\u8C03\u7528\u672C\u673A dsh-wechat \u901A\u9053\u628A\u5F85\u62CD\u677F #\u7F16\u53F7 \u6458\u8981\u63A8\u5230\u4F60\u7684\u5FAE\u4FE1\uFF0C\u51FA\u95E8\u4E5F\u80FD\u968F\u65F6\u638C\u63E1\u8FB9\u754C\u62E6\u622A"
            )
          ),
          h3(
            "label",
            { className: "switch", "aria-label": "\u5207\u6362 dsh-wechat \u5FAE\u4FE1\u5F85\u62CD\u677F\u63A8\u9001" },
            h3("input", {
              type: "checkbox",
              id: "toggleOwnerNotifyWechat",
              checked: Boolean(view?.ownerNotify?.wechat),
              disabled: busy,
              onChange: async (e) => {
                const checked = e.target.checked;
                await onAction("set_owner_notify", { wechat: checked });
                onToast?.(checked ? "\u5DF2\u5F00\u542F dsh-wechat \u5FAE\u4FE1\u540C\u6B65\u63A8\u9001" : "\u5DF2\u5173\u95ED dsh-wechat \u5FAE\u4FE1\u63A8\u9001");
              }
            }),
            h3("span", { className: "switch-track" })
          )
        ),
        h3(
          "div",
          { className: "rule-row", style: { alignItems: "center", justifyContent: "space-between" } },
          h3(
            "div",
            null,
            h3("div", { style: { fontWeight: 600, color: "var(--text)" } }, "\u6162\u54CD\u5E94\u5148\u7ED9\u5BF9\u65B9\u4E00\u53E5\u56DE\u6267"),
            h3(
              "div",
              { style: { fontSize: "0.78125rem", color: "var(--text-secondary)", marginTop: "0.125rem" } },
              "\u5916\u90E8\u5206\u8EAB\u6DF1\u5EA6\u53EA\u8BFB\u6838\u7B97\u8D85\u8FC7 3.5 \u79D2\u65F6\u81EA\u52A8\u5B89\u629A\u4E00\u6B21\uFF0C\u907F\u514D\u540C\u4E8B\u4EE5\u4E3A\u6D88\u606F\u6CA1\u6536\u5230"
            )
          ),
          h3(
            "label",
            { className: "switch", "aria-label": "\u5207\u6362\u6162\u54CD\u5E94\u81EA\u52A8\u56DE\u6267" },
            h3("input", {
              type: "checkbox",
              id: "toggleAckSlowTurns",
              checked: view?.ackSlowTurns !== false,
              disabled: busy,
              onChange: async (e) => {
                const checked = e.target.checked;
                await onAction("set_ack_slow_turns", { enabled: checked });
                onToast?.(checked ? "\u5DF2\u5F00\u542F 3.5 \u79D2\u6162\u54CD\u5E94\u81EA\u52A8\u56DE\u6267" : "\u5DF2\u5173\u95ED\u6162\u54CD\u5E94\u81EA\u52A8\u56DE\u6267");
              }
            }),
            h3("span", { className: "switch-track" })
          )
        ),
        h3(
          "div",
          { id: "rulesList" },
          rules.map(
            (r, idx) => editingRuleId === r.id ? h3(
              "div",
              { key: r.id, className: "rule-row" },
              h3("span", { className: "rule-num" }, String(idx + 1).padStart(2, "0")),
              h3(
                "div",
                { className: "rule-edit-inline" },
                h3(
                  "select",
                  {
                    className: "tw-select",
                    style: { width: "auto" },
                    value: editRuleKind,
                    onChange: (e) => setEditRuleKind(e.target.value),
                    "aria-label": "\u89C4\u5219\u7C7B\u578B"
                  },
                  h3("option", { value: "\u89C4\u77E9" }, "\u89C4\u77E9"),
                  h3("option", { value: "\u7EA2\u7EBF" }, "\u7EA2\u7EBF")
                ),
                h3("input", {
                  className: "tw-input",
                  style: { flex: 1, minWidth: "10rem" },
                  type: "text",
                  value: editRuleText,
                  onChange: (e) => setEditRuleText(e.target.value),
                  onCompositionEnd: imeEdit.onCompositionEnd,
                  onKeyDown: imeEdit.onKeyDown,
                  autoComplete: "off"
                }),
                h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--primary tw-btn--sm",
                  disabled: busy,
                  onClick: async () => {
                    if (!editRuleText.trim()) return;
                    await onAction("edit_rule", { ruleId: r.id, kind: editRuleKind, text: editRuleText.trim() });
                    setEditingRuleId("");
                    onToast?.("\u5DF2\u66F4\u65B0\u8BE5\u6761\u89C4\u5219");
                  }
                }, "\u4FDD\u5B58"),
                h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--ghost tw-btn--sm",
                  onClick: () => setEditingRuleId("")
                }, "\u53D6\u6D88")
              )
            ) : h3(
              "div",
              { key: r.id, className: "rule-row" },
              h3("span", { className: "rule-num" }, String(idx + 1).padStart(2, "0")),
              h3("span", { className: r.kind === "\u7EA2\u7EBF" ? "rule-kind rule-kind--redline" : "rule-kind" }, r.kind),
              h3("span", { className: "rule-row-main" }, r.text),
              h3(
                "span",
                { className: "rule-row-actions" },
                h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--ghost tw-btn--sm",
                  onClick: () => {
                    setEditingRuleId(r.id);
                    setEditRuleKind(r.kind || "\u89C4\u77E9");
                    setEditRuleText(r.text || "");
                  }
                }, "\u7F16\u8F91"),
                h3("button", {
                  type: "button",
                  className: "tw-btn tw-btn--ghost tw-btn--danger-ghost tw-btn--sm",
                  disabled: busy,
                  onClick: async () => {
                    await onAction("delete_rule", { ruleId: r.id });
                    onToast?.("\u5DF2\u5220\u9664\u8BE5\u6761\u89C4\u5219\uFF0C\u53EF\u70B9\u4E0A\u65B9\u64A4\u9500\u6062\u590D");
                  }
                }, "\u5220\u9664")
              )
            )
          )
        ),
        h3(
          "form",
          { id: "addRuleForm", className: "inline-add-row", onSubmit: submitNewRule },
          h3(
            "select",
            {
              id: "newRuleKind",
              className: "tw-select",
              style: { width: "auto", flexShrink: 0 },
              value: newRuleKind,
              onChange: (e) => setNewRuleKind(e.target.value),
              "aria-label": "\u65B0\u589E\u6761\u76EE\u7C7B\u578B"
            },
            h3("option", { value: "\u89C4\u77E9" }, "\u89C4\u77E9"),
            h3("option", { value: "\u7EA2\u7EBF" }, "\u7EA2\u7EBF")
          ),
          h3("input", {
            id: "newRuleInput",
            className: "tw-input",
            style: { flex: 1, minWidth: "12rem" },
            type: "text",
            value: newRuleText,
            onChange: (e) => setNewRuleText(e.target.value),
            onCompositionEnd: imeNew.onCompositionEnd,
            onKeyDown: imeNew.onKeyDown,
            placeholder: "\u518D\u4EA4\u4EE3\u4E00\u6761\u5E72\u6D3B\u89C4\u77E9\u6216\u62E6\u622A\u7EA2\u7EBF\uFF08\u6309\u56DE\u8F66\u6216\u70B9\u6DFB\u52A0\u7ACB\u5373\u751F\u6548\uFF09\u2026",
            autoComplete: "off"
          }),
          h3("button", { type: "submit", className: "tw-btn tw-btn--subtle tw-btn--sm", disabled: busy }, "\u6DFB\u52A0\u6761\u76EE")
        )
      )
    ),
    // 03 External Channels grid
    h3(
      "div",
      { className: "section-block" },
      h3(
        "div",
        { className: "section-head" },
        h3(
          "div",
          { className: "section-title-wrap" },
          h3("span", { className: "section-index" }, "03"),
          h3("h2", { className: "section-title" }, "\u5916\u90E8\u6C9F\u901A\u5165\u53E3")
        ),
        h3("span", { className: "section-meta" }, "\u76F4\u63A5\u590D\u7528\u672C\u673A\u5DF2\u6709\u804A\u5929\u901A\u9053\uFF0C\u5E76\u914D\u514D\u88C5\u8BD5\u8DD1\u7F51\u9875")
      ),
      h3(
        "div",
        { id: "channelsGrid", className: "grid-3" },
        channels.map((ch) => {
          const isBot = ch.kind === "bot_ws" || ch.kind === "wecom_bot" || ch.kind === "slack_socket";
          return h3(
            "div",
            { key: ch.id, className: "card" },
            h3(
              "div",
              { className: "cap-card-head" },
              h3("h3", { className: "cap-card-title" }, ch.name),
              h3(
                "label",
                { className: "switch", "aria-label": `\u5F00\u5173\u901A\u9053 ${ch.name}` },
                h3("input", {
                  type: "checkbox",
                  checked: Boolean(ch.enabled),
                  disabled: busy,
                  onChange: async (e) => {
                    const checked = e.target.checked;
                    if (checked && !ch.configured && ch.id !== "ch-web") {
                      onOpenChannelConfig(ch.id);
                      onToast?.(`\u542F\u7528\u300C${ch.name}\u300D\u524D\u8BF7\u5148\u5B8C\u6210\u4E00\u6B21\u957F\u8FDE\u63A5\u914D\u7F6E\u6216\u626B\u7801\u6FC0\u6D3B`);
                      return;
                    }
                    await onAction("toggle_channel", { channelId: ch.id, enabled: checked });
                    onToast?.(checked ? `\u5DF2\u63A5\u901A\u5165\u53E3\uFF1A${ch.name}` : `\u5DF2\u5173\u95ED\u5165\u53E3\uFF1A${ch.name}`);
                  }
                }),
                h3("span", { className: "switch-track" })
              )
            ),
            h3("p", { className: "cap-desc" }, ch.desc),
            h3(
              "div",
              { className: "cap-meta" },
              h3("span", null, ch.configured ? ch.enabled ? ch.status : "\u5DF2\u5173\u95ED\uFF1A\u6682\u505C\u4ECE\u6B64\u5165\u53E3\u6536\u53D1\u6D88\u606F" : ch.officialConnector?.connected ? ch.officialConnector.statusText || "\u68C0\u6D4B\u5230 DSH \u5B98\u65B9\u63D2\u4EF6\u5DF2\u767B\u5F55\uFF0C\u53EF\u514D\u586B\u5BC6\u94A5\u4E00\u952E\u590D\u7528" : "\u5F85\u914D\u7F6E\uFF1A\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u914D\u7F6E\u540E\u672C\u673A\u76F4\u8FDE"),
              ch.botName && ch.configured && h3("span", null, `\u7FA4\u5185\u663E\u793A\uFF1A${ch.botName}${ch.appIdHint ? ` (${ch.appIdHint})` : ""}`)
            ),
            h3(
              "div",
              { className: "cap-foot-actions" },
              h3("span", {
                className: ch.configured ? ch.enabled ? "status-pill status-pill--ok" : "status-pill status-pill--muted" : ch.officialConnector?.connected ? "status-pill status-pill--ok" : "status-pill"
              }, ch.configured ? ch.enabled ? "\u5DF2\u5C31\u7EEA" : "\u5DF2\u6682\u505C" : ch.officialConnector?.connected ? "\u5B98\u65B9\u63D2\u4EF6\u5C31\u7EEA" : "\u5F85\u63A5\u901A"),
              h3("button", {
                type: "button",
                className: `tw-btn ${ch.configured ? "tw-btn--ghost" : ch.officialConnector?.connected ? "tw-btn--primary" : "tw-btn--subtle"} tw-btn--sm`,
                onClick: () => onOpenChannelConfig(ch.id)
              }, isBot ? ch.configured ? "\u67E5\u770B / \u4FEE\u6539\u51ED\u8BC1" : ch.officialConnector?.connected ? "\u4E00\u952E\u590D\u7528\u5B98\u65B9\u8FDE\u63A5\u5668" : "\u914D\u7F6E\u673A\u5668\u4EBA\u63A5\u5165" : "\u67E5\u770B\u63A5\u5165\u673A\u5236")
            )
          );
        })
      )
    ),
    // 04 Public Scan-to-Try Lobby (/try)
    h3(
      "div",
      { id: "publicLobbySection", className: "section-block" },
      h3(
        "div",
        { className: "section-head" },
        h3(
          "div",
          { className: "section-title-wrap" },
          h3("span", { className: "section-index" }, "04"),
          h3("h2", { className: "section-title" }, "\u516C\u5F00\u626B\u7801\u771F\u4F53\u9A8C\u5927\u5385\uFF08/try\uFF09")
        ),
        h3(
          "div",
          { className: "action-row" },
          h3("span", {
            className: pub.enabled && selectedPubCapSet.size > 0 ? "status-pill status-pill--ok" : "status-pill status-pill--muted"
          }, pub.enabled ? selectedPubCapSet.size > 0 ? `\u516C\u5F00\u63A5\u5F85\u4E2D \xB7 \u5DF2\u5F00\u653E ${selectedPubCapSet.size} \u9879` : "\u5DF2\u5F00\u542F\u4F46\u672A\u52FE\u9009\u516C\u5F00\u80FD\u529B" : "\u5DF2\u5173\u95ED"),
          h3("span", { className: "section-meta" }, `\u4ECA\u65E5\u5DF2\u63A5\u5F85 ${pub.todayGlobalUsed || 0} / ${pub.globalDailyLimit || 200} \u8F6E`)
        )
      ),
      h3(
        "div",
        { className: "card" },
        h3(
          "div",
          { className: "rule-row", style: { paddingTop: 0, alignItems: "center", justifyContent: "space-between" } },
          h3(
            "div",
            null,
            h3("div", { style: { fontWeight: 600, color: "var(--text)" } }, "\u542F\u7528\u516C\u5F00\u626B\u7801\u4F53\u9A8C\u5927\u5385\uFF08\u533F\u540D Cookie \u4F1A\u8BDD\u9694\u79BB\uFF09"),
            h3(
              "div",
              { style: { fontSize: "0.78125rem", color: "var(--text-secondary)", marginTop: "0.125rem" } },
              "\u6BCF\u4F4D\u626B\u7801\u8BBF\u5BA2\u83B7\u72EC\u7ACB\u9694\u79BB\u4F1A\u8BDD\u4E0E\u6BCF\u65E5\u9650\u989D\uFF1BFail-Closed \u9ED8\u8BA4\u5168\u4E0D\u66B4\u9732\uFF0C\u672A\u52FE\u9009\u7684\u79C1\u6709\u9879\u76EE\u7269\u7406\u4E0D\u53EF\u89C1\u3002"
            )
          ),
          h3(
            "label",
            { className: "switch", "aria-label": "\u5207\u6362\u516C\u5F00\u626B\u7801\u4F53\u9A8C\u5927\u5385" },
            h3("input", {
              type: "checkbox",
              id: "togglePublicLobby",
              checked: Boolean(pub.enabled),
              disabled: busy,
              onChange: async (e) => {
                const checked = e.target.checked;
                await onAction("configure_public_lobby", { enabled: checked });
                onToast?.(checked ? "\u5DF2\u5F00\u542F\u516C\u5F00\u626B\u7801\u4F53\u9A8C\u5927\u5385\uFF08\u8BF7\u786E\u8BA4\u4E0B\u65B9\u5DF2\u52FE\u9009\u516C\u5F00\u53EA\u8BFB\u80FD\u529B\uFF09" : "\u5DF2\u5173\u95ED\u516C\u5F00\u626B\u7801\u4F53\u9A8C\u5927\u5385");
              }
            }),
            h3("span", { className: "switch-track" })
          )
        ),
        h3(
          "div",
          { className: "public-lobby-grid", style: { marginTop: "0.875rem" } },
          h3(
            "div",
            { className: "public-lobby-form" },
            h3(
              "div",
              { className: "public-lobby-row" },
              h3(
                "div",
                { className: "public-lobby-field" },
                h3("label", { className: "public-lobby-label", htmlFor: "publicLobbyBaseUrl" }, "\u516C\u7F51\u96A7\u9053\u57DF\u540D\uFF08\u53EF\u9009\uFF0C\u7528\u4E8E\u751F\u6210\u6C38\u4E45\u4E8C\u7EF4\u7801\uFF09"),
                h3("input", {
                  id: "publicLobbyBaseUrl",
                  className: "tw-input",
                  type: "url",
                  value: pubBaseUrl,
                  onChange: (e) => setPubBaseUrl(e.target.value),
                  onCompositionEnd: imePub.onCompositionEnd,
                  onKeyDown: imePub.onKeyDown,
                  placeholder: "\u4F8B\u5982\uFF1Ahttps://twin.finvo.ai",
                  autoComplete: "off"
                })
              ),
              h3(
                "div",
                { className: "public-lobby-field" },
                h3("label", { className: "public-lobby-label", htmlFor: "publicLobbyVisitorLimit" }, "\u6BCF\u4EBA\u6BCF\u65E5\u4F53\u9A8C\u8F6E\u6B21\u4E0A\u9650"),
                h3("input", {
                  id: "publicLobbyVisitorLimit",
                  className: "tw-input",
                  type: "number",
                  min: 1,
                  max: 100,
                  value: pubVisitorLimit,
                  onChange: (e) => setPubVisitorLimit(e.target.value)
                })
              )
            ),
            h3(
              "div",
              { className: "public-lobby-row" },
              h3(
                "div",
                { className: "public-lobby-field" },
                h3("label", { className: "public-lobby-label", htmlFor: "publicLobbyTitle" }, "\u516C\u5F00\u5927\u5385\u5BF9\u5916\u5206\u8EAB\u540D\uFF08\u72EC\u7ACB\u9694\u79BB\u540D\u7247\uFF09"),
                h3("input", {
                  id: "publicLobbyTitle",
                  className: "tw-input",
                  type: "text",
                  value: pubTitle,
                  onChange: (e) => setPubTitle(e.target.value),
                  onCompositionEnd: imePub.onCompositionEnd,
                  onKeyDown: imePub.onKeyDown,
                  placeholder: "\u4F8B\u5982\uFF1A\u725B\u6751\u6728\u6728\u5C71 \xB7 DSH \u5B9E\u6218\u4F53\u9A8C\u5206\u8EAB",
                  autoComplete: "off"
                })
              ),
              h3(
                "div",
                { className: "public-lobby-field" },
                h3("label", { className: "public-lobby-label", htmlFor: "publicLobbyIntro" }, "\u516C\u5F00\u5927\u5385\u4E00\u53E5\u8BDD\u4ECB\u7ECD"),
                h3("input", {
                  id: "publicLobbyIntro",
                  className: "tw-input",
                  type: "text",
                  value: pubIntro,
                  onChange: (e) => setPubIntro(e.target.value),
                  onCompositionEnd: imePub.onCompositionEnd,
                  onKeyDown: imePub.onKeyDown,
                  placeholder: "\u4F8B\u5982\uFF1A\u672C\u673A DeepSeek Harness \u53EA\u8BFB\u9A71\u52A8",
                  autoComplete: "off"
                })
              )
            ),
            h3(
              "div",
              { className: "public-lobby-field" },
              h3("span", { className: "public-lobby-label" }, "\u52FE\u9009\u5F00\u653E\u7ED9\u516C\u5F00\u626B\u7801\u8BBF\u5BA2\u7684\u53EA\u8BFB\u80FD\u529B\uFF08\u9ED8\u8BA4\u5168\u4E0D\u52FE\u9009 \xB7 \u7269\u7406\u9694\u79BB\u79C1\u5BC6\u9879\u76EE\uFF09"),
              capabilities.length === 0 ? h3("div", { style: { fontSize: "0.8125rem", color: "var(--text-muted)" } }, "\u8BF7\u5148\u63D0\u70BC\u81F3\u5C11\u4E00\u4E2A\u516C\u5F00\u793A\u4F8B\u6216\u8131\u654F\u5DE5\u4F5C\u533A\u80FD\u529B\u5305") : h3(
                "div",
                { id: "publicLobbyCapList", className: "public-lobby-caps" },
                capabilities.map((cap) => {
                  const isSelected = Boolean(cap.enabled) && selectedPubCapSet.has(cap.id);
                  return h3(
                    "label",
                    {
                      key: cap.id,
                      className: isSelected ? "public-cap-check is-selected" : "public-cap-check"
                    },
                    h3("input", {
                      type: "checkbox",
                      checked: isSelected,
                      disabled: busy || !cap.enabled,
                      onChange: async (e) => {
                        const nextSet = new Set(selectedPubCapSet);
                        if (e.target.checked) nextSet.add(cap.id);
                        else nextSet.delete(cap.id);
                        await onAction("configure_public_lobby", { capIds: [...nextSet] });
                        onToast?.(e.target.checked ? `\u5DF2\u5411\u516C\u5F00\u5927\u5385\u5F00\u653E\u300C${cap.name}\u300D` : `\u5DF2\u4ECE\u516C\u5F00\u5927\u5385\u64A4\u56DE\u300C${cap.name}\u300D`);
                      }
                    }),
                    h3("span", null, cap.name),
                    h3("span", { className: "public-cap-proj" }, `[${cap.projectName || "\u9879\u76EE"}]`)
                  );
                })
              )
            ),
            h3(
              "div",
              { className: "action-row", style: { justifyContent: "space-between", flexWrap: "wrap", marginTop: "0.25rem" } },
              h3(
                "label",
                { style: { display: "inline-flex", alignItems: "center", gap: "0.4375rem", fontSize: "0.8125rem", color: "var(--text-secondary)", cursor: "pointer" } },
                h3("input", {
                  type: "checkbox",
                  id: "togglePublicPushOwner",
                  checked: Boolean(pub.pushOwner),
                  disabled: busy,
                  onChange: async (e) => {
                    await onAction("configure_public_lobby", { pushOwner: e.target.checked });
                    onToast?.(e.target.checked ? "\u5DF2\u5F00\u542F\u516C\u5F00\u7EA2\u7EBF\u89E6\u53D1\u624B\u673A\u63A8\u9001\uFF08\u6BCF 10 \u5206\u949F\u81F3\u591A 1 \u6B21\uFF09" : "\u5DF2\u5173\u95ED\u516C\u5F00\u4F53\u9A8C\u624B\u673A\u63A8\u9001\u9632\u6253\u6270");
                  }
                }),
                h3("span", null, "\u516C\u5F00\u8BBF\u5BA2\u89E6\u53D1\u7EA2\u7EBF\u65F6\u63A8\u6211\u624B\u673A\uFF0810 \u5206\u949F\u51B7\u5374\u9632\u5237\u5C4F\uFF09")
              ),
              h3("button", {
                type: "button",
                id: "btnSavePublicLobby",
                className: "tw-btn tw-btn--primary tw-btn--sm",
                disabled: busy,
                onClick: async () => {
                  await onAction("configure_public_lobby", {
                    publicBaseUrl: pubBaseUrl.trim(),
                    title: pubTitle.trim(),
                    intro: pubIntro.trim(),
                    visitorDailyLimit: Number(pubVisitorLimit) || 5
                  });
                  onToast?.("\u5DF2\u4FDD\u5B58\u516C\u5F00\u626B\u7801\u5927\u5385\u8BBE\u7F6E\u5E76\u66F4\u65B0\u4E8C\u7EF4\u7801");
                }
              }, "\u4FDD\u5B58\u5927\u5385\u8BBE\u7F6E")
            )
          ),
          h3(
            "div",
            { className: "public-lobby-qr-col" },
            h3(
              "div",
              { id: "publicLobbyQrWrap", className: "public-lobby-qr-box", "aria-label": "\u516C\u5F00\u626B\u7801\u4F53\u9A8C\u6C38\u4E45\u4E8C\u7EF4\u7801" },
              pub.qrSvg ? h3("img", {
                src: `data:image/svg+xml;utf8,${encodeURIComponent(pub.qrSvg)}`,
                alt: "\u516C\u5F00\u626B\u7801\u4F53\u9A8C\u4E8C\u7EF4\u7801"
              }) : h3(QrCodeMatrixSvg, { seed: pub.tryUrl || "twin-try-lobby" })
            ),
            h3("input", {
              id: "publicLobbyTryUrl",
              className: "tw-input",
              type: "text",
              readOnly: true,
              value: pub.tryUrl || "\u542F\u52A8\u672C\u5730\u7F51\u9875\u5165\u53E3\u540E\u751F\u6210",
              style: { fontSize: "0.75rem", textAlign: "center" }
            }),
            h3("button", {
              type: "button",
              id: "btnCopyPublicTryUrl",
              className: "tw-btn tw-btn--subtle tw-btn--sm",
              disabled: !pub.tryUrl,
              onClick: () => copyToClipboard(pub.tryUrl || "", (msg) => onToast?.(msg))
            }, "\u590D\u5236\u4F53\u9A8C\u94FE\u63A5")
          )
        )
      )
    )
  );
}

// src-client/toolviews.js
var import_react4 = __toESM(require("react"), 1);
var h4 = import_react4.default.createElement;
function parseToolPayload(block) {
  if (!block) return null;
  const contents = Array.isArray(block.content) ? block.content : [];
  for (const part of contents) {
    if (part && part.type === "text" && typeof part.text === "string") {
      try {
        return JSON.parse(part.text);
      } catch {
        return { summary: part.text };
      }
    }
  }
  return null;
}
function parseRawArgs(block) {
  if (block?.args && typeof block.args === "object") return block.args;
  const raw = block?.call?.argsRaw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}
function useToolCardChrome() {
  const ref = (0, import_react4.useRef)(null);
  const [scheme, setScheme] = (0, import_react4.useState)("light");
  (0, import_react4.useEffect)(() => {
    ensureTwinStyles();
    const update = () => setScheme(detectHostDarkMode(ref.current) ? "dark" : "light");
    update();
    if (typeof MutationObserver !== "function") return;
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-color-scheme", "style"] });
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme", "data-color-scheme", "style"] });
    }
    return () => obs.disconnect();
  }, []);
  return { ref, scheme };
}
function CardShell({ toolLabel, pillText, pillTone = "ok", phase, block, children }) {
  const { ref, scheme } = useToolCardChrome();
  const isError = Boolean(block?.isError);
  const running = phase && phase !== "result";
  return h4(
    "div",
    {
      ref,
      className: "tw-tv-card",
      "data-tw-scheme": scheme
    },
    h4(
      "div",
      { className: "tw-tv-head" },
      h4(
        "div",
        { className: "tw-tv-title-group" },
        h4("span", { className: "tw-tv-kicker" }, "AI \u5206\u8EAB\u5DE5\u4F5C\u53F0"),
        h4("strong", { className: "tw-tv-title" }, toolLabel)
      ),
      h4("span", {
        className: `tw-tv-pill tw-tv-pill--${isError ? "danger" : running ? "muted" : pillTone}`
      }, isError ? "\u6267\u884C\u5F02\u5E38" : running ? "\u5904\u7406\u4E2D" : pillText)
    ),
    running ? h4(
      "div",
      { className: "tw-tv-body" },
      h4("p", { className: "tw-tv-muted" }, "\u6B63\u5728\u5DE5\u4F5C\u533A\u9694\u79BB\u73AF\u5883\u6838\u5BF9\u53EA\u8BFB\u4E0A\u4E0B\u6587\u4E0E\u901A\u9053\u72B6\u6001\u2026")
    ) : isError ? h4(
      "div",
      { className: "tw-tv-body" },
      h4("p", { className: "tw-tv-error" }, block?.error?.message || "\u5DE5\u5177\u8C03\u7528\u672A\u5B8C\u6210\uFF0C\u8BF7\u6253\u5F00\u5DE6\u4FA7\u300CAI \u5206\u8EAB\u300D\u9762\u677F\u67E5\u770B\u8BE6\u60C5\u3002")
    ) : h4("div", { className: "tw-tv-body" }, children)
  );
}
var DUTY_LABELS = {
  shadow: "\u5F71\u5B50\u8BD5\u8DD1",
  live: "\u6B63\u5F0F\u503C\u73ED",
  off: "\u5DF2\u6682\u505C"
};
function TwinStatusToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const [dutyMode, setDutyMode] = (0, import_react4.useState)(data.dutyMode || "shadow");
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [tip, setTip] = (0, import_react4.useState)("");
  (0, import_react4.useEffect)(() => {
    if (data.dutyMode) setDutyMode(data.dutyMode);
  }, [data.dutyMode]);
  async function switchDuty(nextMode) {
    if (busy || nextMode === dutyMode) return;
    setBusy(true);
    setTip("");
    try {
      await runTwinAction("set_duty_mode", { dutyMode: nextMode });
      setDutyMode(nextMode);
      setTip(`\u5DF2\u5207\u6362\u4E3A\u300C${DUTY_LABELS[nextMode] || nextMode}\u300D`);
    } catch (err) {
      setTip(err?.message || "\u5207\u6362\u503C\u73ED\u6A21\u5F0F\u5931\u8D25");
    } finally {
      setBusy(false);
    }
  }
  const projects = Array.isArray(data.mountedProjects) ? data.mountedProjects : [];
  const channels = Array.isArray(data.channels) ? data.channels : [];
  const connectedChannels = channels.filter((c) => c.enabled && c.configured);
  return h4(
    CardShell,
    {
      toolLabel: data.twinProfile?.name || "AI \u5206\u8EAB\u503C\u73ED\u72B6\u6001",
      pillText: DUTY_LABELS[dutyMode] || dutyMode,
      pillTone: dutyMode === "live" ? "ok" : dutyMode === "off" ? "muted" : "amber",
      phase: props.phase,
      block: props.block
    },
    data.summary && h4("p", { className: "tw-tv-summary" }, data.summary),
    h4(
      "div",
      { className: "tw-tv-meta-row" },
      h4("span", { className: "tw-tv-chip" }, `\u5DF2\u6302\u8F7D\u9879\u76EE ${projects.length}`),
      h4("span", { className: "tw-tv-chip" }, `\u5728\u7EBF\u901A\u9053 ${connectedChannels.length}/${channels.length}`),
      h4("span", { className: "tw-tv-chip" }, `\u5F85\u62CD\u677F ${data.pendingCount ?? 0}`),
      h4("span", { className: "tw-tv-chip" }, data.fullBloodAvailable ? "\u6EE1\u8840 DSH \u9694\u79BB\u5185\u6838\u5C31\u7EEA" : "\u79BB\u7EBF\u89C4\u5219\u515C\u5E95")
    ),
    data.selfTestResult?.answer && h4(
      "div",
      { className: "tw-tv-quote" },
      h4("div", { className: "tw-tv-quote-label" }, `\u81EA\u6D4B\u7B54\u590D\uFF08${data.selfTestResult.basis || "\u53EA\u8BFB\u6838\u5BF9"}\uFF09`),
      h4("div", { className: "tw-tv-quote-text" }, data.selfTestResult.answer)
    ),
    h4(
      "div",
      { className: "tw-tv-actions" },
      ["shadow", "live", "off"].map((mode) => h4("button", {
        key: mode,
        type: "button",
        className: `tw-tv-btn ${dutyMode === mode ? "tw-tv-btn--primary" : "tw-tv-btn--subtle"}`,
        disabled: busy,
        onClick: () => switchDuty(mode)
      }, DUTY_LABELS[mode])),
      tip && h4("span", { className: "tw-tv-tip", role: "status" }, tip)
    )
  );
}
function TwinPublishToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const [dutyMode, setDutyMode] = (0, import_react4.useState)(data.dutyMode || "shadow");
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [tip, setTip] = (0, import_react4.useState)("");
  (0, import_react4.useEffect)(() => {
    if (data.dutyMode) setDutyMode(data.dutyMode);
  }, [data.dutyMode]);
  async function enableLiveDuty() {
    if (busy) return;
    setBusy(true);
    setTip("");
    try {
      await runTwinAction("set_duty_mode", { dutyMode: "live" });
      setDutyMode("live");
      setTip("\u5DF2\u5F00\u542F\u6B63\u5F0F\u503C\u73ED\u6A21\u5F0F");
    } catch (err) {
      setTip(err?.message || "\u5207\u6362\u5931\u8D25");
    } finally {
      setBusy(false);
    }
  }
  const caps = Array.isArray(data.capabilities) ? data.capabilities : [];
  const proj = data.project || {};
  return h4(
    CardShell,
    {
      toolLabel: proj.projectName ? `\u5DF2\u53D1\u5E03\u300C${proj.projectName}\u300D\u5206\u8EAB` : "\u5DE5\u4F5C\u533A\u80FD\u529B\u53D1\u5E03",
      pillText: DUTY_LABELS[dutyMode] || "\u5DF2\u63D0\u70BC",
      pillTone: dutyMode === "live" ? "ok" : "amber",
      phase: props.phase,
      block: props.block
    },
    data.summary && h4("p", { className: "tw-tv-summary" }, data.summary),
    h4(
      "div",
      { className: "tw-tv-meta-row" },
      h4("span", { className: "tw-tv-chip" }, `\u53EA\u8BFB\u6587\u6863 ${proj.docCount ?? 0}`),
      h4("span", { className: "tw-tv-chip" }, `\u5C4F\u853D\u79C1\u5BC6 ${proj.blockedSecretCount ?? 0}`),
      h4("span", { className: "tw-tv-chip" }, `\u62E6\u622A\u5199\u811A\u672C ${proj.blockedWriteScriptCount ?? 0}`),
      data.feishuChannel?.connectionMode === "official_cli" && h4("span", { className: "tw-tv-chip tw-tv-chip--accent" }, "0.2.3 \u5B98\u65B9\u98DE\u4E66\u5DF2\u8FDE\u901A")
    ),
    caps.length > 0 && h4(
      "div",
      { className: "tw-tv-cap-list" },
      caps.slice(0, 4).map((cap) => h4(
        "div",
        { key: cap.id || cap.name, className: "tw-tv-cap-item" },
        h4("strong", null, cap.name),
        cap.desc && h4("span", null, cap.desc)
      ))
    ),
    h4(
      "div",
      { className: "tw-tv-actions" },
      dutyMode !== "live" && h4("button", {
        type: "button",
        className: "tw-tv-btn tw-tv-btn--primary",
        disabled: busy,
        onClick: enableLiveDuty
      }, "\u5207\u6362\u5230\u6B63\u5F0F\u503C\u73ED"),
      tip && h4("span", { className: "tw-tv-tip", role: "status" }, tip)
    )
  );
}
function TwinGrantToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const args = parseRawArgs(props.block);
  const [copyTip, setCopyTip] = (0, import_react4.useState)("");
  const person = data.person || {};
  const modeMap = {
    direct: "\u767D\u540D\u5355\u76F4\u7B54",
    summary: "\u4EC5\u6C47\u603B\u53E3\u5F84",
    confirm: "\u8349\u7A3F\u5148\u5BA1"
  };
  return h4(
    CardShell,
    {
      toolLabel: person.name ? `\u5DF2\u6388\u6743\u300C${person.name}\u300D` : "\u8BBF\u5BA2\u9694\u79BB\u6388\u6743",
      pillText: modeMap[person.mode] || person.channel || "\u5DF2\u5F00\u901A",
      pillTone: "ok",
      phase: props.phase,
      block: props.block
    },
    data.summary && h4("p", { className: "tw-tv-summary" }, data.summary),
    h4(
      "div",
      { className: "tw-tv-meta-row" },
      h4("span", { className: "tw-tv-chip" }, person.role || "\u534F\u4F5C\u8005"),
      h4("span", { className: "tw-tv-chip" }, person.channel || args.channel || "\u514D\u88C5\u8BD5\u7528\u7F51\u9875"),
      h4("span", { className: "tw-tv-chip" }, person.expiry || "\u5269 7 \u5929\u8BD5\u7528")
    ),
    data.guestUrl && h4(
      "div",
      { className: "tw-tv-code-box" },
      h4("span", { className: "tw-tv-code-val" }, data.guestUrl),
      h4("button", {
        type: "button",
        className: "tw-tv-btn tw-tv-btn--subtle",
        onClick: () => copyToClipboard(data.guestUrl, (msg) => setCopyTip(msg))
      }, "\u590D\u5236\u8BD5\u7528\u94FE\u63A5")
    ),
    data.pairCode && h4(
      "div",
      { className: "tw-tv-code-box" },
      h4("span", { className: "tw-tv-code-val" }, `\u4E00\u6B21\u6027\u914D\u5BF9\u53E3\u4EE4\uFF1A${data.pairCode}`),
      h4("button", {
        type: "button",
        className: "tw-tv-btn tw-tv-btn--subtle",
        onClick: () => copyToClipboard(data.pairCode, (msg) => setCopyTip(msg))
      }, "\u590D\u5236\u914D\u5BF9\u7801")
    ),
    data.qrAvailable && h4("p", { className: "tw-tv-muted" }, "\u5DF2\u751F\u6210 5 \u5206\u949F\u4E13\u5C5E\u5FAE\u4FE1 iLink \u626B\u7801\u51ED\u8BC1\uFF0C\u53EF\u5728\u5DE6\u4FA7\u300CAI \u5206\u8EAB -> \u670D\u52A1\u5BF9\u8C61\u300D\u5C55\u5F00\u626B\u7801\u7ED1\u5B9A\u3002"),
    copyTip && h4("div", { className: "tw-tv-tip", role: "status" }, copyTip)
  );
}
function ApprovalCardItem({ item }) {
  const [draft, setDraft] = (0, import_react4.useState)(item.draft || "");
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [doneText, setDoneText] = (0, import_react4.useState)("");
  const [errText, setErrText] = (0, import_react4.useState)("");
  async function handleApprove(saveRule) {
    if (busy || doneText) return;
    setBusy(true);
    setErrText("");
    try {
      if (saveRule) {
        await runTwinAction("save_approval_as_rule", {
          approvalId: item.id,
          customDraft: draft,
          kind: "\u89C4\u77E9",
          ruleText: `\u540C\u7C7B\u95EE\u9898\uFF08${String(item.question || "").slice(0, 18)}\uFF09\u6309\u5DF2\u62CD\u677F\u56DE\u590D\u4E3A\u51C6`
        });
        setDoneText("\u5DF2\u53D1\u51FA\u56DE\u6267\u5E76\u8BB0\u4E3A\u957F\u671F\u89C4\u77E9");
      } else {
        const res = await runTwinAction("approve_draft", {
          approvalId: item.id,
          customDraft: draft
        });
        setDoneText(res?.result?.statusLabel || "\u901A\u9053\u56DE\u6267\u5DF2\u9001\u8FBE");
      }
    } catch (err) {
      setErrText(err?.message || "\u5904\u7406\u5BA1\u6279\u5931\u8D25");
    } finally {
      setBusy(false);
    }
  }
  async function handleDismiss() {
    if (busy || doneText) return;
    setBusy(true);
    setErrText("");
    try {
      await runTwinAction("dismiss_approval", { approvalId: item.id });
      setDoneText("\u5DF2\u5FFD\u7565\u6B64\u6761\u5F85\u529E");
    } catch (err) {
      setErrText(err?.message || "\u5FFD\u7565\u5931\u8D25");
    } finally {
      setBusy(false);
    }
  }
  const isDanger = item.tone === "danger";
  return h4(
    "div",
    { className: `tw-tv-approval ${isDanger ? "tw-tv-approval--danger" : ""}` },
    h4(
      "div",
      { className: "tw-tv-approval-head" },
      h4("span", { className: `tw-tv-pill tw-tv-pill--${isDanger ? "danger" : "amber"}` }, item.tag || "\u5F85\u62CD\u677F"),
      h4("span", { className: "tw-tv-approval-who" }, `${item.personName || "\u8BBF\u5BA2"} \xB7 ${item.channel || ""}`)
    ),
    item.headline && h4("div", { className: "tw-tv-approval-title" }, item.headline),
    item.question && h4(
      "div",
      { className: "tw-tv-quote" },
      h4("div", { className: "tw-tv-quote-label" }, "\u5BF9\u65B9\u539F\u95EE\u9898"),
      h4("div", { className: "tw-tv-quote-text" }, item.question)
    ),
    doneText ? h4("div", { className: "tw-tv-receipt", role: "status" }, doneText) : [
      h4(
        "label",
        { key: "l", className: "tw-tv-label", htmlFor: `tv-draft-${item.id}` },
        `\u62DF\u56DE\u590D\u8349\u7A3F${item.basisHint ? `\uFF08${item.basisHint}\uFF09` : ""}`
      ),
      h4("textarea", {
        key: "t",
        id: `tv-draft-${item.id}`,
        className: "tw-tv-textarea",
        rows: 3,
        value: draft,
        disabled: busy,
        onChange: (e) => setDraft(e.target.value)
      }),
      errText && h4("div", { key: "e", className: "tw-tv-error" }, errText),
      h4(
        "div",
        { key: "a", className: "tw-tv-actions" },
        h4("button", {
          type: "button",
          className: "tw-tv-btn tw-tv-btn--primary",
          disabled: busy || !draft.trim(),
          onClick: () => handleApprove(false)
        }, busy ? "\u53D1\u9001\u4E2D\u2026" : item.primaryActionLabel || "\u6279\u51C6\u53D1\u51FA"),
        item.allowRuleExtract !== false && h4("button", {
          type: "button",
          className: "tw-tv-btn tw-tv-btn--subtle",
          disabled: busy || !draft.trim(),
          onClick: () => handleApprove(true)
        }, "\u53D1\u51FA\u5E76\u8BB0\u4E3A\u89C4\u77E9"),
        h4("button", {
          type: "button",
          className: "tw-tv-btn tw-tv-btn--ghost",
          disabled: busy,
          onClick: handleDismiss
        }, "\u5FFD\u7565")
      )
    ]
  );
}
function TwinInboxToolView(props) {
  const data = parseToolPayload(props.block) || {};
  const approvals = Array.isArray(data.approvals) ? data.approvals : [];
  const deliveries = Array.isArray(data.recentDeliveries) ? data.recentDeliveries : [];
  return h4(
    CardShell,
    {
      toolLabel: "\u6536\u4EF6\u7BB1\u4E0E\u7EA2\u7EBF\u62CD\u677F",
      pillText: approvals.length > 0 ? `${approvals.length} \u6761\u5F85\u62CD\u677F` : "\u5DF2\u6E05\u7A7A",
      pillTone: approvals.length > 0 ? "amber" : "ok",
      phase: props.phase,
      block: props.block
    },
    data.summary && h4("p", { className: "tw-tv-summary" }, data.summary),
    data.resolved?.reply && h4(
      "div",
      { className: "tw-tv-receipt", role: "status" },
      `${data.resolved.statusLabel || "\u5DF2\u5B8C\u6210"}\uFF1A${String(data.resolved.reply).slice(0, 80)}`
    ),
    approvals.length > 0 ? h4(
      "div",
      { className: "tw-tv-approval-list" },
      approvals.map((item) => h4(ApprovalCardItem, { key: item.id, item }))
    ) : h4(
      "p",
      { className: "tw-tv-muted" },
      deliveries.length > 0 ? `\u8FD1\u671F\u5DF2\u9001\u8FBE ${deliveries.length} \u6761\u8BB0\u5F55\uFF08\u6700\u8FD1\uFF1A${deliveries[0].who} \xB7 ${deliveries[0].statusLabel}\uFF09\u3002` : "\u5F53\u524D\u6CA1\u6709\u9700\u8981\u4F60\u672C\u4EBA\u62CD\u677F\u7684\u8D8A\u6743\u62E6\u622A\u6216\u5F85\u8865\u53E3\u5F84\u95EE\u9898\u3002"
    )
  );
}

// src-client/index.js
var h5 = import_react5.default.createElement;
var PANEL_ID = "agent-twin";
function TwinWorkbenchRoot({ ctx }) {
  const rootRef = (0, import_react5.useRef)(null);
  const scrollRef = (0, import_react5.useRef)(null);
  const toastTimerRef = (0, import_react5.useRef)(null);
  const [scheme, setScheme] = (0, import_react5.useState)("light");
  const [payload, setPayload] = (0, import_react5.useState)(null);
  const [busy, setBusy] = (0, import_react5.useState)(false);
  const [errorMsg, setErrorMsg] = (0, import_react5.useState)("");
  const [toastMsg, setToastMsg] = (0, import_react5.useState)("");
  const [selectedCandidateId, setSelectedCandidateId] = (0, import_react5.useState)("");
  const [customProject, setCustomProject] = (0, import_react5.useState)(null);
  const [projectDialogMode, setProjectDialogMode] = (0, import_react5.useState)("");
  const [drawerPersonId, setDrawerPersonId] = (0, import_react5.useState)("");
  const [personModalState, setPersonModalState] = (0, import_react5.useState)({ open: false, editingId: "", initialDraft: null, draftNonce: 0 });
  const [pendingPersonReturnDraft, setPendingPersonReturnDraft] = (0, import_react5.useState)(null);
  const [invitePersonId, setInvitePersonId] = (0, import_react5.useState)("");
  const [channelModalId, setChannelModalId] = (0, import_react5.useState)("");
  const [previewState, setPreviewState] = (0, import_react5.useState)({ open: false, personId: "", fromInvite: false });
  const [profileOpen, setProfileOpen] = (0, import_react5.useState)(false);
  const [deltaProjectId, setDeltaProjectId] = (0, import_react5.useState)("");
  const [traceItemId, setTraceItemId] = (0, import_react5.useState)("");
  const [handoffTarget, setHandoffTarget] = (0, import_react5.useState)(null);
  const [confirmSpec, setConfirmSpec] = (0, import_react5.useState)(null);
  const showToast = (0, import_react5.useCallback)((msg) => {
    const clean = String(msg || "").trim();
    if (!clean) return;
    setToastMsg(clean);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg("");
    }, 3e3);
  }, []);
  (0, import_react5.useEffect)(() => {
    ensureTwinStyles();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);
  (0, import_react5.useEffect)(() => {
    const updateScheme = () => {
      const dark = detectHostDarkMode(rootRef.current);
      setScheme(dark ? "dark" : "light");
    };
    updateScheme();
    if (typeof MutationObserver !== "function") return;
    const obs = new MutationObserver(updateScheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "data-color-scheme", "style"] });
    if (document.body) {
      obs.observe(document.body, { attributes: true, attributeFilter: ["class", "data-theme", "data-color-scheme", "style"] });
    }
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", updateScheme);
    return () => {
      obs.disconnect();
      mq?.removeEventListener?.("change", updateScheme);
    };
  }, []);
  const refresh = (0, import_react5.useCallback)(async () => {
    try {
      const next = await fetchTwinView();
      setPayload(next);
      setErrorMsg("");
    } catch (err) {
      setErrorMsg(err?.message || "\u65E0\u6CD5\u8FDE\u63A5 AI \u5206\u8EAB\u4E3B\u673A\u670D\u52A1");
    }
  }, []);
  (0, import_react5.useEffect)(() => {
    void refresh();
  }, [refresh]);
  const jobStatus = payload?.view?.extractionJob?.status;
  (0, import_react5.useEffect)(() => {
    if (jobStatus === "ready") {
      setToastMsg((prev) => prev.startsWith("\u5DF2\u5F00\u59CB\u9010\u9879\u8BFB\u53D6\u4E0E\u63D0\u70BC") ? "" : prev);
    }
    if (jobStatus !== "running") return;
    const timer = setInterval(() => {
      void refresh();
    }, 450);
    return () => clearInterval(timer);
  }, [jobStatus, refresh]);
  const handleAction = (0, import_react5.useCallback)(async (action, args = {}) => {
    setBusy(true);
    setErrorMsg("");
    try {
      const res = await runTwinAction(action, args);
      if (res.view) {
        setPayload((prev) => ({ ...prev || {}, view: res.view }));
      }
      if (action === "switch_scene" || action === "complete_extraction") {
        setToastMsg("");
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }
      if (action === "confirm_delta_upgrade") {
        void refresh();
      }
      return res;
    } catch (err) {
      setErrorMsg(err?.message || "\u64CD\u4F5C\u5931\u8D25");
      throw err;
    } finally {
      setBusy(false);
    }
  }, [refresh]);
  async function handleHandoffConfirm(target) {
    const uiWs = optService(ctx, "uiWorkspace");
    const wsReg = optService(ctx, "workspaceRegistry");
    const layout = optService(ctx, "layout");
    let draftPrompt = "";
    if (target.kind === "person") {
      const p = target.person;
      const last = (p.threads || [])[p.threads.length - 1];
      draftPrompt = `\u8BF7\u63A5\u624B\u5904\u7406\u670D\u52A1\u5BF9\u8C61\u300C${p.name}\u300D\uFF08${p.channel}\uFF09\u7684\u5BF9\u8BDD\uFF1A
\u6700\u8FD1\u5BF9\u8BDD\uFF1A${last?.question || "\u9700\u8FDB\u4E00\u6B65\u786E\u8BA4"}
\u4E13\u95E8\u53EE\u5631\uFF1A${p.note || "\u65E0"}`;
    } else {
      const a = target.item;
      draftPrompt = `\u8BF7\u63A5\u624B\u5904\u7406\u8BBF\u5BA2\u300C${a.personName}\u300D\u7684\u95EE\u9898\u5E76\u8D77\u8349\u56DE\u590D\uFF1A
\u539F\u95EE\uFF1A${a.question}
\u5F53\u524D\u4F9D\u636E\u7EBF\u7D22\uFF1A${a.basisHint || "\u9700\u6838\u5BF9\u6700\u65B0\u9879\u76EE\u6750\u6599"}`;
    }
    try {
      const firstWs = wsReg?.list?.()?.[0];
      if (uiWs && typeof uiWs.startSession === "function") {
        const session = await uiWs.startSession(firstWs ? { workspaceId: firstWs.id } : {});
        if (session?.id && typeof uiWs.requestDraftInitialization === "function") {
          await uiWs.requestDraftInitialization(session.id, { prompt: draftPrompt });
        } else if (session?.id && typeof uiWs.openSession === "function") {
          await uiWs.openSession(session.id);
        }
        if (target.kind === "approval") {
          await handleAction("dismiss_approval", { approvalId: target.item.id });
        }
        setHandoffTarget(null);
        setDrawerPersonId("");
        layout?.selectPanel?.(null);
        showToast("\u5DF2\u8F6C\u81F3\u4F60\u7684\u72EC\u7ACB\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u7EE7\u7EED\u5904\u7406");
        return;
      }
      if (uiWs && typeof uiWs.openWorkspace === "function" && firstWs) {
        await uiWs.openWorkspace(firstWs.id);
        await copyToClipboard(draftPrompt);
        if (target.kind === "approval") {
          await handleAction("dismiss_approval", { approvalId: target.item.id });
        }
        setHandoffTarget(null);
        setDrawerPersonId("");
        layout?.selectPanel?.(null);
        showToast("\u5DF2\u6253\u5F00\u5DE5\u4F5C\u533A\u5BF9\u8BDD\u5E76\u5C06\u80CC\u666F\u4FE1\u606F\u590D\u5236\u5230\u526A\u8D34\u677F");
        return;
      }
    } catch (err) {
      setErrorMsg(err?.message || "\u8F6C\u4EA4\u5BBF\u4E3B\u5DE5\u4F5C\u533A\u4F1A\u8BDD\u5931\u8D25");
      return;
    }
    await copyToClipboard(draftPrompt);
    setHandoffTarget(null);
    showToast("\u5DF2\u590D\u5236\u80CC\u666F\u63D0\u793A\u8BCD\u5230\u526A\u8D34\u677F\uFF0C\u53EF\u5728\u5DE5\u4F5C\u533A\u65B0\u5BF9\u8BDD\u4E2D\u76F4\u63A5\u7C98\u8D34\u7EE7\u7EED");
  }
  const view = payload?.view || null;
  const presets = payload?.presets || [];
  const channelGuides = payload?.channelGuides || {};
  const projects = payload?.projects || [];
  const scene = view?.scene || "onboard";
  const isOnboard = scene === "onboard";
  const pendingCount = (view?.approvals || []).length;
  const drawerPerson = (view?.people || []).find((p) => p.id === drawerPersonId) || null;
  const editingPerson = personModalState.editingId ? (view?.people || []).find((p) => p.id === personModalState.editingId) || null : null;
  const invitePerson = (view?.people || []).find((p) => p.id === invitePersonId) || null;
  const activeChannel = (view?.channels || []).find((c) => c.id === channelModalId) || null;
  const deltaProject = (view?.mountedProjects || []).find((m) => m.id === deltaProjectId) || null;
  const job = view?.extractionJob || null;
  return h5(
    "div",
    {
      ref: rootRef,
      className: "tw-root",
      "data-agent-twin-workbench": "v4",
      "data-tw-scheme": scheme
    },
    // Editorial single-row header — hidden on scene === 'onboard'
    h5(
      "header",
      { id: "pluginHeader", className: "plugin-header", hidden: isOnboard },
      h5(
        "div",
        { className: "brand-title" },
        h5("span", { className: "brand-mark" }, h5(BrandUserIcon)),
        h5("span", { id: "brandTwinName" }, view?.twinProfile?.name || "\u5DE5\u4F5C\u5206\u8EAB"),
        h5("button", {
          type: "button",
          id: "btnEditTwinProfile",
          className: "tw-btn tw-btn--ghost tw-btn--sm brand-edit-btn",
          onClick: () => setProfileOpen(true)
        }, "\u7F16\u8F91\u540D\u7247"),
        job && h5(
          "button",
          {
            type: "button",
            id: "headerExtractPill",
            className: job.status === "ready" ? "header-extract-pill is-ready" : "header-extract-pill",
            onClick: () => handleAction("switch_scene", { scene: "onboard" })
          },
          h5("span", { className: "header-extract-pill-dot", "aria-hidden": "true" }),
          h5(
            "span",
            { id: "headerExtractPillText" },
            job.status === "ready" ? `${job.projectName} \xB7 \u5F85\u542F\u7528` : `\u63D0\u70BC\u4E2D ${job.step || 1}/4`
          )
        )
      ),
      h5(
        "nav",
        { className: "header-tabs", role: "tablist", "aria-label": "\u5206\u8EAB\u5DE5\u4F5C\u533A" },
        [
          ["desk", "\u670D\u52A1\u53F0", pendingCount],
          ["people", "\u670D\u52A1\u5BF9\u8C61", 0],
          ["caps", "\u80FD\u529B\u4E0E\u901A\u9053", 0]
        ].map(
          ([tabId, label, count]) => h5(
            "button",
            {
              key: tabId,
              type: "button",
              className: "tab-btn",
              role: "tab",
              "data-tab": tabId,
              "aria-selected": String(scene === tabId),
              onClick: () => handleAction("switch_scene", { scene: tabId })
            },
            h5("span", null, label),
            count > 0 && h5("span", { id: "tabPendingBadge", className: "tab-count" }, String(count))
          )
        )
      ),
      h5(
        "div",
        { className: "duty-switch", role: "group", "aria-label": "\u503C\u73ED\u6A21\u5F0F\u5207\u6362" },
        [
          ["shadow", "\u8BD5\u8DD1\u628A\u5173"],
          ["live", "\u6B63\u5F0F\u503C\u73ED"],
          ["off", "\u6682\u505C"]
        ].map(
          ([duty, label]) => h5(
            "button",
            {
              key: duty,
              type: "button",
              className: "duty-btn",
              "data-duty": duty,
              "aria-pressed": String((view?.dutyMode || "shadow") === duty),
              disabled: busy,
              onClick: async () => {
                await handleAction("set_duty_mode", { dutyMode: duty });
                const labelMap = { shadow: "\u8BD5\u8DD1\u628A\u5173", live: "\u6B63\u5F0F\u503C\u73ED", off: "\u6682\u505C\u5BF9\u5916\u503C\u73ED" };
                showToast(`\u5DF2\u5207\u6362\u4E3A\uFF1A${labelMap[duty]}`);
              }
            },
            h5("span", { className: "duty-dot", "aria-hidden": "true" }),
            h5("span", null, label)
          )
        )
      )
    ),
    // Main scroll area
    h5(
      "main",
      { ref: scrollRef, id: "twScroll", className: "tw-scroll" },
      errorMsg && h5(
        "div",
        { className: "tw-container" },
        h5(
          "div",
          { className: "tw-error-banner", role: "alert" },
          h5("span", null, errorMsg),
          h5("button", { type: "button", className: "tw-btn tw-btn--sm", onClick: () => setErrorMsg("") }, "\u77E5\u9053\u4E86")
        )
      ),
      !view ? h5(
        "div",
        { className: "tw-container tw-container--narrow" },
        h5(
          "div",
          { className: "card" },
          errorMsg ? "\u5206\u8EAB\u4E3B\u673A\u6682\u672A\u54CD\u5E94\uFF0C\u8BF7\u786E\u8BA4\u63D2\u4EF6\u5DF2\u542F\u7528\u3002" : "\u6B63\u5728\u8FDE\u63A5\u672C\u673A\u5206\u8EAB\u670D\u52A1\u4E0E\u72B6\u6001\u5E93..."
        )
      ) : scene === "onboard" ? h5(OnboardScene, {
        view,
        projects,
        selectedCandidateId,
        customProject,
        busy,
        onOpenProjectDialog: (mode) => setProjectDialogMode(mode),
        onAction: handleAction,
        onToast: showToast
      }) : scene === "people" ? h5(PeopleScene, {
        view,
        busy,
        onAction: handleAction,
        onOpenPersonDrawer: (id) => setDrawerPersonId(id),
        onOpenPersonModal: (id) => setPersonModalState({ open: true, editingId: id || "", initialDraft: null, draftNonce: Date.now() }),
        onOpenInviteModal: (id) => setInvitePersonId(id),
        onToast: showToast
      }) : scene === "caps" ? h5(CapsScene, {
        view,
        busy,
        onAction: handleAction,
        onOpenProfileModal: () => setProfileOpen(true),
        onOpenProjectDialog: (mode) => setProjectDialogMode(mode),
        onOpenDeltaModal: (mp) => setDeltaProjectId(mp.id),
        onOpenChannelConfig: (chId) => setChannelModalId(chId),
        onConfirmUnmount: (mp) => setConfirmSpec({
          title: `\u5378\u8F7D\u300C${mp.projectName}\u300D\u80FD\u529B\u5305`,
          message: "\u4EC5\u4ECE\u5F53\u524D\u5206\u8EAB\u5378\u8F7D\u8BE5\u9879\u76EE\u7684\u53EA\u8BFB\u7D22\u5F15\uFF0C\u4E0D\u4F1A\u5220\u9664\u539F\u9879\u76EE\u76EE\u5F55\u5185\u4EFB\u4F55\u6587\u4EF6\uFF1B\u79FB\u9664\u540E\u53EF\u5728\u4E0A\u65B9\u4E00\u952E\u64A4\u9500\u6062\u590D\u3002",
          confirmLabel: "\u786E\u8BA4\u5378\u8F7D",
          onConfirm: async () => {
            await handleAction("unmount_project", { projectId: mp.id });
            showToast(`\u5DF2\u5378\u8F7D\u300C${mp.projectName}\u300D\u80FD\u529B\u5305\uFF0C\u53EF\u70B9\u4E0A\u65B9\u300C\u64A4\u9500\u521A\u624D\u64CD\u4F5C\u300D\u6062\u590D`);
          }
        }),
        onToast: showToast
      }) : h5(DeskScene, {
        view,
        presets,
        busy,
        onAction: handleAction,
        onOpenPersonDrawer: (id) => setDrawerPersonId(id),
        onOpenPersonModal: (id) => setPersonModalState({ open: true, editingId: id || "", initialDraft: null, draftNonce: Date.now() }),
        onOpenInviteModal: (id) => setInvitePersonId(id),
        onOpenChannelConfig: (chId) => setChannelModalId(chId),
        onOpenTrace: (itemId) => setTraceItemId(itemId),
        onOpenHandoff: (target) => setHandoffTarget(target),
        onToast: showToast
      })
    ),
    toastMsg && h5("div", { id: "twToast", className: "tw-toast", role: "status", "aria-live": "polite" }, toastMsg),
    // Right slide-over drawer + Native Top-Layer dialogs
    h5(PersonDrawer, {
      person: drawerPerson,
      view,
      scheme,
      busy,
      onClose: () => setDrawerPersonId(""),
      onAction: handleAction,
      onOpenEditPerson: (id) => setPersonModalState({ open: true, editingId: id, initialDraft: null, draftNonce: Date.now() }),
      onOpenInvite: (id) => setInvitePersonId(id),
      onOpenPreview: (id) => setPreviewState({ open: true, personId: id, fromInvite: false }),
      onOpenTrace: (itemId) => setTraceItemId(itemId),
      onOpenHandoff: (target) => setHandoffTarget(target),
      onToast: showToast
    }),
    h5(TraceModal, {
      view,
      traceItemId,
      scheme,
      onClose: () => setTraceItemId("")
    }),
    h5(PersonModal, {
      open: personModalState.open,
      editingPerson,
      initialDraft: personModalState.initialDraft,
      draftNonce: personModalState.draftNonce,
      view,
      scheme,
      busy,
      onClose: () => {
        setPendingPersonReturnDraft(null);
        setPersonModalState((prev) => ({ ...prev, open: false }));
      },
      onJumpChannelConfig: (chId, draft) => {
        setPendingPersonReturnDraft(draft);
        setPersonModalState((prev) => ({ ...prev, open: false }));
        setChannelModalId(chId);
      },
      onSavePerson: async (formPayload) => {
        if (formPayload.isEdit && formPayload.personId) {
          await handleAction("update_person", formPayload);
          setPersonModalState((prev) => ({ ...prev, open: false }));
          showToast(`\u5DF2\u4FDD\u5B58 ${formPayload.name} \u7684\u6743\u9650\u8BBE\u7F6E`);
        } else {
          const res = await handleAction("add_person", formPayload);
          setPersonModalState((prev) => ({ ...prev, open: false }));
          const createdId = res?.result?.person?.id;
          if (createdId) {
            setInvitePersonId(createdId);
          }
          showToast(`\u5DF2\u4E3A ${formPayload.name} \u5F00\u901A\u6743\u9650\uFF0C\u4E13\u5C5E\u9080\u8BF7\u51ED\u8BC1\u5DF2\u5C31\u7EEA`);
        }
      },
      onToast: showToast
    }),
    h5(InviteModal, {
      person: invitePerson,
      view,
      scheme,
      busy,
      onClose: () => setInvitePersonId(""),
      onAction: handleAction,
      onRefreshView: refresh,
      onOpenPreview: (id, fromInvite) => setPreviewState({ open: true, personId: id, fromInvite: Boolean(fromInvite) }),
      onToast: showToast
    }),
    h5(ChannelConfigModal, {
      channel: activeChannel,
      guide: activeChannel ? channelGuides[activeChannel.id] : null,
      scheme,
      busy,
      onClose: (meta) => {
        setChannelModalId("");
        if (meta?.savedChannelId && pendingPersonReturnDraft) {
          const draft = pendingPersonReturnDraft;
          setPendingPersonReturnDraft(null);
          setPersonModalState({
            open: true,
            editingId: draft.personId || "",
            initialDraft: draft,
            draftNonce: Date.now()
          });
        } else if (!meta?.savedChannelId) {
          setPendingPersonReturnDraft(null);
        }
      },
      onAction: handleAction,
      onToast: showToast
    }),
    h5(CallerPreviewModal, {
      open: previewState.open,
      view,
      initialPersonId: previewState.personId,
      fromInvite: previewState.fromInvite,
      scheme,
      busy,
      onClose: () => setPreviewState((prev) => ({ ...prev, open: false })),
      onBackToInvite: (id) => setInvitePersonId(id),
      onAction: handleAction
    }),
    h5(ProfileEditModal, {
      open: profileOpen,
      view,
      presets,
      scheme,
      busy,
      onClose: () => setProfileOpen(false),
      onSave: (args) => handleAction("update_profile", args),
      onToast: showToast
    }),
    h5(ProjectSelectModal, {
      mode: projectDialogMode,
      projects,
      selectedCandidateId: selectedCandidateId || (projects[0]?.id || ""),
      mountedProjects: view?.mountedProjects || [],
      scheme,
      busy,
      onClose: () => setProjectDialogMode(""),
      onSelectWorkspace: async (proj, mode) => {
        setProjectDialogMode("");
        if (mode === "mount") {
          await handleAction("start_extraction", {
            candidateId: proj.id,
            projectName: proj.name,
            mode: "mount",
            autoComplete: false
          });
          await handleAction("switch_scene", { scene: "onboard", onboardMode: "mount" });
          showToast(`\u5F00\u59CB\u4ECE\u300C${proj.name}\u300D\u63D0\u70BC\u80FD\u529B\u5E76\u63A5\u5165\u4E3B\u5206\u8EAB`);
        } else {
          setCustomProject(null);
          setSelectedCandidateId(proj.id);
          showToast(`\u5DF2\u5207\u6362\u9879\u76EE\u4E3A\uFF1A${proj.name}`);
        }
      },
      onSelectCustomFolder: async (custom, mode) => {
        setProjectDialogMode("");
        if (mode === "mount") {
          await handleAction("start_extraction", {
            rootPath: custom.rootPath,
            projectName: custom.projectName,
            mode: "mount",
            autoComplete: false
          });
          await handleAction("switch_scene", { scene: "onboard", onboardMode: "mount" });
          showToast("\u5F00\u59CB\u4ECE\u81EA\u5B9A\u4E49\u672C\u5730\u9879\u76EE\u63D0\u70BC\u80FD\u529B\u5E76\u63A5\u5165\u4E3B\u5206\u8EAB");
        } else {
          setCustomProject(custom);
          showToast(`\u5DF2\u9009\u5B9A\u672C\u5730\u76EE\u5F55\uFF1A${custom.projectName || "\u5DE5\u4F5C\u533A\u9879\u76EE"}`);
        }
      }
    }),
    h5(DeltaUpgradeModal, {
      project: deltaProject,
      scheme,
      busy,
      onClose: () => setDeltaProjectId(""),
      onConfirmUpgrade: async (projectId) => {
        const name = deltaProject?.projectName || "\u9879\u76EE";
        await handleAction("confirm_delta_upgrade", { projectId });
        setDeltaProjectId("");
        showToast(`\u5DF2\u5B8C\u6210\u300C${name}\u300D\u589E\u91CF\u63D0\u70BC\u5347\u7EA7\uFF0C\u80FD\u529B\u53E3\u5F84\u5DF2\u540C\u6B65`);
      }
    }),
    h5(HandoffModal, {
      target: handoffTarget,
      scheme,
      busy,
      onClose: () => setHandoffTarget(null),
      onConfirmHandoff: handleHandoffConfirm
    }),
    h5(ConfirmActionModal, {
      spec: confirmSpec,
      scheme,
      busy,
      onClose: () => setConfirmSpec(null)
    })
  );
}
function apply(ctx) {
  function Workbench(props) {
    return h5(TwinWorkbenchRoot, { ...props, ctx });
  }
  if (typeof ctx.effect === "function" && ctx.slots && typeof ctx.slots.register === "function") {
    ctx.effect(() => ctx.slots.inject("main", () => ctx.slots.register({ name: "main", key: PANEL_ID }, Workbench)));
    ctx.effect(() => ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({ name: "sidebar.panellist", id: PANEL_ID, label: "AI \u5206\u8EAB", order: 6 }, TwinNavIcon)));
    ctx.effect(() => ctx.slots.inject("plugins.row.config", () => ctx.slots.register(
      { name: "plugins.row.config", key: "agent-twin-starter" },
      (props) => props?.view === "summary" ? "1 \u4E2A\u4E3B\u5206\u8EAB + \u591A\u9879\u76EE\u53EA\u8BFB\u80FD\u529B\u5305 \xB7 \u4E94\u901A\u9053\u672C\u673A\u957F\u8FDE\u63A5\u4E0E\u7269\u7406\u9694\u79BB\u6C99\u7BB1" : h5("p", { style: { margin: 0 } }, "\u6240\u6709\u80FD\u529B\u63D0\u70BC\u3001\u4E94\u901A\u9053\u51ED\u636E\u4E0E\u503C\u73ED\u6743\u9650\u5747\u5728\u5DE6\u4FA7\u300CAI \u5206\u8EAB\u300D\u5DE5\u4F5C\u53F0\u914D\u7F6E\u4E0E\u7EF4\u62A4\u3002")
    )));
    ctx.effect(() => ctx.slots.inject("tool.call.toolview", function* () {
      yield ctx.slots.register({ name: "tool.call.toolview", key: "twin_status" }, TwinStatusToolView);
      yield ctx.slots.register({ name: "tool.call.toolview", key: "twin_publish_workspace" }, TwinPublishToolView);
      yield ctx.slots.register({ name: "tool.call.toolview", key: "twin_grant_access" }, TwinGrantToolView);
      yield ctx.slots.register({ name: "tool.call.toolview", key: "twin_inbox" }, TwinInboxToolView);
    }));
  }
}
var inject = ["slots"];

return module.exports;}});
