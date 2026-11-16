/**
 * Shared client utilities: API requests, clipboard announcer, Modern Web Guidance
 * `<dialog>` controller (computed-style discrete display probe + `closedby` fallback),
 * host dark-mode luminance detection, IME-safe input guard, and crisp monochrome SVGs.
 */
import React, { useEffect, useRef } from 'react';
const h = React.createElement;

let supportsDisplayTransitionCache;

export function canTransitionDisplay() {
  if (supportsDisplayTransitionCache !== undefined) return supportsDisplayTransitionCache;
  if (typeof window === 'undefined' || !window.CSS?.supports?.('transition-behavior', 'allow-discrete') || !document.body) {
    return false;
  }
  const probe = document.createElement('div');
  probe.style.cssText = 'transition: display 1s allow-discrete !important; display: block;';
  document.body.appendChild(probe);
  getComputedStyle(probe).display;
  probe.style.display = 'none';
  supportsDisplayTransitionCache = getComputedStyle(probe).display === 'block';
  probe.remove();
  return supportsDisplayTransitionCache;
}

export function supportsTopLayerExit() {
  return typeof window !== 'undefined' && Boolean(window.CSS?.supports?.('overlay', 'auto') && canTransitionDisplay());
}

export async function closeTopLayer(el) {
  if (!el || !el.open) return;
  if (!supportsTopLayerExit()) {
    el.setAttribute('data-closing', '');
    const animations = typeof el.getAnimations === 'function' ? el.getAnimations({ subtree: true }) : [];
    if (animations.length > 0) {
      await Promise.race([
        Promise.allSettled(animations.map(a => a.finished)),
        new Promise(r => setTimeout(r, 400))
      ]);
    }
    if (!el.hasAttribute('data-closing')) return;
    el.removeAttribute('data-closing');
  }
  el.close();
}

export function useDialogController(open, onClose) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      el.removeAttribute('data-closing');
      if (!el.open && typeof el.showModal === 'function') {
        el.showModal();
      }
      return;
    }
    if (el.open) {
      void closeTopLayer(el);
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleCancel = ev => {
      if (ev.cancelable) ev.preventDefault();
      onCloseRef.current?.();
    };

    const handleClose = () => {
      el.returnValue = '';
      el.removeAttribute('data-closing');
      onCloseRef.current?.();
    };

    el.addEventListener('cancel', handleCancel);
    el.addEventListener('close', handleClose);

    let cleanupFallback = null;
    if (typeof HTMLDialogElement !== 'undefined' && !('closedBy' in HTMLDialogElement.prototype)) {
      const outside = ev => {
        const r = el.getBoundingClientRect();
        return ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onDown = ev => { pressedOutside = outside(ev); };
      const onUp = ev => {
        if (pressedOutside && outside(ev)) {
          onCloseRef.current?.();
        }
      };
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointerup', onUp);
      cleanupFallback = () => {
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointerup', onUp);
      };
    }

    return () => {
      el.removeEventListener('cancel', handleCancel);
      el.removeEventListener('close', handleClose);
      cleanupFallback?.();
    };
  }, []);

  return ref;
}

export function optService(ctx, name) {
  try {
    return ctx?.[name] || ctx?.get?.(name, false) || ctx?.root?.get?.(name, false) || ctx?.root?.[name] || null;
  } catch {
    return null;
  }
}

export async function fetchTwinView() {
  const res = await fetch('/api/agent_twin/view', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store'
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json?.error || '读取 AI 分身状态失败');
  }
  return json;
}

export async function runTwinAction(action, payload = {}) {
  const res = await fetch('/api/agent_twin/action', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload })
  });
  const json = await res.json();
  if (!res.ok || !json.ok) {
    throw new Error(json?.error || `操作失败（${action}）`);
  }
  return json;
}

export async function copyToClipboard(text, setNotice) {
  const val = String(text || '');
  if (!val) return false;
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(val);
    } else {
      const ta = document.createElement('textarea');
      ta.value = val;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setNotice?.('已复制到剪贴板');
    return true;
  } catch {
    setNotice?.('复制失败，请手动选中复制');
    return false;
  }
}

function parseRgbOrHexLuma(raw) {
  const s = String(raw || '').trim();
  if (!s) return null;
  const m = s.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?\)/i);
  if (m && (m[4] === undefined || Number(m[4]) > 0.1)) {
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

export function detectHostDarkMode(rootEl) {
  if (typeof document === 'undefined') return false;
  const html = document.documentElement;
  const body = document.body;

  try {
    const tokenEl = rootEl?.parentElement || body || html;
    const tokenLuma = parseRgbOrHexLuma(getComputedStyle(tokenEl).getPropertyValue('--dsw-alias-bg-base'));
    if (tokenLuma !== null) return tokenLuma < 128;
  } catch {
    // ignore style read errors
  }

  const explicitTheme =
    html?.getAttribute('data-theme') ||
    body?.getAttribute('data-theme') ||
    html?.getAttribute('data-color-scheme') ||
    body?.getAttribute('data-color-scheme') ||
    '';

  if (explicitTheme === 'dark') return true;
  if (explicitTheme === 'light') return false;

  const explicitDarkClass =
    html?.classList?.contains('dark') ||
    body?.classList?.contains('dark') ||
    elHasDarkAttr(rootEl?.parentElement || null);
  if (explicitDarkClass) return true;

  try {
    const hostSample = rootEl?.parentElement || body;
    const bgLuma = hostSample ? parseRgbOrHexLuma(getComputedStyle(hostSample).backgroundColor) : null;
    if (bgLuma !== null) return bgLuma < 128;
  } catch {
    // ignore
  }
  return Boolean(typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function elHasDarkAttr(el) {
  let cur = el;
  while (cur && cur.nodeType === 1) {
    if (
      cur.classList?.contains('dark') ||
      cur.getAttribute('data-theme') === 'dark' ||
      cur.getAttribute('data-color-scheme') === 'dark'
    ) {
      return true;
    }
    cur = cur.parentElement;
  }
  return false;
}

export function createImeHandlers() {
  let lastCompEnd = -1;
  return {
    onCompositionEnd(ev) {
      lastCompEnd = ev.timeStamp || Date.now();
    },
    onKeyDown(ev) {
      if (ev.key !== 'Enter') return;
      const nowTs = ev.timeStamp || Date.now();
      if (ev.nativeEvent?.isComposing || ev.isComposing || ev.keyCode === 229 || (lastCompEnd > 0 && nowTs - lastCompEnd < 50)) {
        ev.preventDefault();
      }
    }
  };
}

export function channelIdFromLabel(labelOrId) {
  const s = String(labelOrId || '').trim();
  if (s === 'ch-wechat' || s.includes('个人微信') || s === '微信') return 'ch-wechat';
  if (s === 'ch-feishu' || s.includes('飞书') || s.includes('Lark')) return 'ch-feishu';
  if (s === 'ch-wecom' || s.includes('企微') || s.includes('企业微信')) return 'ch-wecom';
  if (s === 'ch-slack' || s.includes('Slack')) return 'ch-slack';
  return 'ch-web';
}

export function modeLabelText(mode) {
  if (mode === 'direct') return '白名单直接答';
  if (mode === 'summary') return '只给汇总（禁个人明细）';
  return '每次先写草稿给我看';
}

export function formatBindingText(p) {
  const chId = channelIdFromLabel(p?.channel);
  if (chId === 'ch-web') return '独立网页链接 · 会话隔离';
  if (chId === 'ch-wechat') return p?.wechatBound ? '已扫码绑定一对一微信' : '待扫 5 分钟专属二维码锁定';
  if (p?.bindMode === 'group_allow' || (!p?.pairCode && p?.channelHandle)) {
    return p?.channelHandle ? `群白名单：${p.channelHandle}` : '指定群聊白名单';
  }
  if (p?.pairCode) return `私聊配对码 ${p.pairCode}`;
  return '已签发配对权限';
}

export function findTraceEntry(view, itemId) {
  if (!view || !itemId) return null;
  const app = (view.approvals || []).find(a => a.id === itemId);
  if (app) return { label: app.personName, trace: app.trace };
  const del = (view.deliveries || []).find(d => d.id === itemId);
  if (del) return { label: del.who, trace: del.trace };
  for (const p of view.people || []) {
    const hit = (p.threads || []).find(t => t.id === itemId);
    if (hit) return { label: p.name, trace: hit.trace };
  }
  return null;
}

export function BrandUserIcon() {
  return h('svg', {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.65,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  },
    h('circle', { cx: 12, cy: 8, r: 4 }),
    h('path', { d: 'M5 20a7 7 0 0 1 14 0' })
  );
}

export function TwinNavIcon() {
  return h('svg', {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  },
    h('circle', { cx: 9, cy: 8, r: 3.25 }),
    h('path', { d: 'M3.5 19a5.5 5.5 0 0 1 11 0' }),
    h('circle', { cx: 17, cy: 9.5, r: 2.5 }),
    h('path', { d: 'M16.5 14.5a4.25 4.25 0 0 1 4 4.5' })
  );
}

export function FolderIcon() {
  return h('svg', {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  },
    h('path', { d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' })
  );
}

export function CheckIcon() {
  return h('svg', {
    width: 12,
    height: 12,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true'
  },
    h('path', { d: 'M3.5 8.5 6.5 11.5 12.5 4.5' })
  );
}

export function CloseIcon() {
  return h('svg', {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    'aria-hidden': 'true'
  },
    h('path', { d: 'M6 6l12 12' }),
    h('path', { d: 'M18 6l-12 12' })
  );
}

export function QrCodeMatrixSvg({ seed }) {
  const size = 21;
  let hash = 2166136261;
  const text = String(seed || 'twin-qr');
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
        const sep = (r <= 7 && c <= 7) || (r <= 7 && c >= size - 8) || (r >= size - 8 && c <= 7);
        if (sep) {
          dark = false;
        } else {
          hash ^= (r * 31 + c * 17 + 7);
          hash = Math.imul(hash, 16777619);
          dark = (hash >>> 0) % 10 < 5;
        }
      }
      if (dark) {
        rects.push(h('rect', { key: `${r}-${c}`, x: c, y: r, width: 1, height: 1, fill: '#111827' }));
      }
    }
  }
  return h('svg', {
    viewBox: `0 0 ${size} ${size}`,
    shapeRendering: 'crispEdges',
    role: 'img',
    'aria-label': '专属微信绑定二维码'
  },
    h('rect', { width: size, height: size, fill: '#ffffff' }),
    ...rects
  );
}
