/**
 * Scoped Dot V2 Editorial Paper + Sage/Ink stylesheet (`v4.2`) for `@oxmumu3/dsh-agent-twin`.
 * - Integrates DSH host `--dsw-alias-*` surface/label/border tokens with warm editorial fallbacks
 * - Uses Sage green accent (`#245947` / `#58b489`), Newsreader/Songti serif headings, `1.5px`/`2px` ink rules
 * - Uses `rem`/`clamp()` typography only (enforced by `check-client.cjs`)
 * - Container queries (`@container tw`), top-layer `@starting-style` `<dialog>` transitions, and `overscroll-behavior: contain`
 */

export const TWIN_STYLE_ID = 'dsh-agent-twin-v4-styles';

export const CLIENT_CSS = `
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

export function ensureTwinStyles() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(TWIN_STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = TWIN_STYLE_ID;
    document.head.appendChild(el);
  }
  if (el.textContent !== CLIENT_CSS) {
    el.textContent = CLIENT_CSS;
  }
}
