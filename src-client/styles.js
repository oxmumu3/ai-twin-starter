/**
 * Scoped Editorial Paper + DSH `--dsw-alias-*` stylesheet (`v4.1`).
 * Two-class specificity defense, `rem`/`clamp()` typography, container-query
 * responsive grid, and reduced-motion-safe `<dialog>` animations.
 */

export const TWIN_STYLE_ID = 'dsh-agent-twin-v4-styles';

export const CLIENT_CSS = `
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
    content: attr(data-label) "：";
    color: var(--tw-muted);
    font-size: 0.78rem;
    margin-right: 0.35rem;
  }
}
`;

/** Inject scoped stylesheet once into document head. */
export function ensureTwinStyles(doc = globalThis.document) {
  if (!doc || !doc.head) return;
  let el = doc.getElementById(TWIN_STYLE_ID);
  if (!el) {
    el = doc.createElement('style');
    el.id = TWIN_STYLE_ID;
    el.textContent = CLIENT_CSS;
    doc.head.appendChild(el);
  }
}
