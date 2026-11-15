/**
 * Shared client utilities: API requests, clipboard announcer, dialog controller,
 * optional host services lookup, and crisp monochrome SVG icons (zero emojis).
 */
import React, { useEffect, useRef } from 'react';
const h = React.createElement;

function canTransitionDisplay() {
  try {
    return typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('transition-behavior', 'allow-discrete');
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

async function runTwinAction(action, payload = {}) {
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

async function copyToClipboard(text, setNotice) {
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

function useDialogController(open, onClose) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open && typeof el.showModal === 'function') {
        el.classList.remove('is-closing');
        el.showModal();
      }
      return;
    }
    if (el.open && typeof el.close === 'function') {
      const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !canTransitionDisplay()) {
        el.close();
      } else {
        el.classList.add('is-closing');
        const timer = setTimeout(() => {
          el.classList.remove('is-closing');
          if (el.open) el.close();
        }, 140);
        return () => clearTimeout(timer);
      }
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleCancel = ev => {
      ev.preventDefault();
      onClose?.();
    };
    const handleClick = ev => {
      if (!('closedBy' in HTMLDialogElement.prototype) && ev.target === el) {
        onClose?.();
      }
    };
    el.addEventListener('cancel', handleCancel);
    el.addEventListener('click', handleClick);
    return () => {
      el.removeEventListener('cancel', handleCancel);
      el.removeEventListener('click', handleClick);
    };
  }, [onClose]);

  return ref;
}

function TwinNavIcon() {
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

function CloseIcon() {
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

export {
  canTransitionDisplay,
  optService,
  fetchTwinView,
  runTwinAction,
  copyToClipboard,
  useDialogController,
  TwinNavIcon,
  CloseIcon
};
