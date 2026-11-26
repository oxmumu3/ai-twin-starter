/**
 * Built-in local & public-tunnel Guest Web Portal (`ch-web` & `/try` Public Scan-to-Try Lobby).
 * - `/g/:token`: Private named caller isolated web portal (`/api/guest/:token/ask[-stream]`).
 * - `/try`: Anonymous per-cookie isolated Public Lobby (`/api/try/ask[-stream]`, `/api/try/qr.svg`)
 *   with Fail-Closed capability whitelist, per-visitor & global daily caps, and per-IP burst limiter.
 */
import { randomBytes } from 'node:crypto';
import http from 'node:http';
import { URL } from 'node:url';
import QRCode from 'qrcode';
import {
  DEFAULT_PUBLIC_GLOBAL_DAILY_LIMIT,
  DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT,
  normalizePublicLobbyConfig,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { todayKey } from './store.js';
import { isPersonExpired } from './twin-engine.js';

const MAX_BODY_BYTES = 65536;
const COOKIE_NAME = 'dsh_twin_vid';
const VISITOR_ID_RE = /^[a-f0-9]{16,32}$/i;
const DEFAULT_PUBLIC_BURST_PER_MIN = 8;

const CREATIVE_MODE_INSTALL_PROMPT = '请通过插件管理器，从 npm 官方源安装并启用 @oxmumu3/dsh-agent-twin@latest。完成后请核对版本和启用状态，再带我打开左侧「AI 分身」。';

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isCrossSiteRequest(req, expectedOrigins) {
  const secFetch = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (secFetch && secFetch !== 'same-origin' && secFetch !== 'none') {
    return true;
  }
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    const list = Array.isArray(expectedOrigins) ? expectedOrigins : [expectedOrigins];
    for (const exp of list) {
      if (!exp) continue;
      try {
        if (parsed.origin === new URL(exp).origin) return false;
      } catch {
        // ignore invalid expected origin entry
      }
    }
    return !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
  } catch {
    return true;
  }
}

function parseCookies(cookieHeader) {
  const out = {};
  for (const part of String(cookieHeader || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

function isForwardedHttps(req) {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  return proto === 'https';
}

function resolveVisitorCookie(req) {
  const cookies = parseCookies(req.headers.cookie);
  const existing = cookies[COOKIE_NAME];
  if (existing && VISITOR_ID_RE.test(existing)) {
    return { visitorId: existing.toLowerCase(), isNew: false };
  }
  return { visitorId: randomBytes(16).toString('hex'), isNew: true };
}

function buildVisitorCookieHeader(req, visitorId) {
  const secure = isForwardedHttps(req) ? '; Secure' : '';
  return `${COOKIE_NAME}=${visitorId}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax${secure}`;
}

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (typeof cfIp === 'string' && cfIp.trim()) return cfIp.trim();
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

function sendJson(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

function sendHtml(res, status, html, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  });
  res.end(html);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    let settled = false;
    req.on('data', chunk => {
      if (settled) return;
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        settled = true;
        const err = new Error('请求体过大');
        err.statusCode = 413;
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (settled) return;
      settled = true;
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch {
        const err = new Error('JSON 请求格式无效');
        err.statusCode = 400;
        reject(err);
      }
    });
    req.on('error', err => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

function buildStreamScript({ endpointPrefix, twinName, copyPromptText = '' }) {
  return `<script>
    (function () {
      var endpoint = ${JSON.stringify(endpointPrefix)};
      var twinLabel = ${JSON.stringify(twinName)};
      var form = document.getElementById('askForm');
      var input = document.getElementById('questionInput');
      var btn = document.getElementById('sendBtn');
      var fb = document.getElementById('feedback');
      var thread = document.getElementById('thread');
      var quotaBadge = document.getElementById('quotaBadge');
      var copyBtn = document.getElementById('copyInstallBtn');
      var copyStatus = document.getElementById('copyStatus');
      var installBox = document.getElementById('installDetails');

      if (copyBtn) {
        copyBtn.addEventListener('click', function () {
          var txt = ${JSON.stringify(copyPromptText)};
          if (!txt) return;
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).then(function () {
              if (copyStatus) copyStatus.textContent = '已复制创造模式指令';
            }).catch(function () {
              if (copyStatus) copyStatus.textContent = '请长按上方文字框复制';
            });
          } else {
            if (copyStatus) copyStatus.textContent = '请手动选中上方文字复制';
          }
        });
      }

      if (!form) return;

      function appendTurn(q, a, badge) {
        var empty = thread.querySelector('.empty');
        if (empty) empty.remove();
        var art = document.createElement('article');
        art.className = 'turn';
        var qr = document.createElement('div'); qr.className = 'q-row';
        var qs = document.createElement('span'); qs.className = 'role'; qs.textContent = '你';
        qr.appendChild(qs);
        var qt = document.createElement('div'); qt.className = 'q-text'; qt.textContent = q;
        var ar = document.createElement('div'); ar.className = 'a-row';
        var as = document.createElement('span'); as.className = 'role'; as.textContent = twinLabel;
        var bs = document.createElement('span'); bs.className = 'badge'; bs.textContent = badge || '已收到';
        ar.appendChild(as); ar.appendChild(bs);
        var at = document.createElement('div'); at.className = 'a-text'; at.textContent = a;
        art.appendChild(qr); art.appendChild(qt); art.appendChild(ar); art.appendChild(at);
        thread.appendChild(art);
        art.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }

      var qText = '';
      function handleResult(d) {
        if (!d || !d.ok) {
          fb.textContent = (d && d.error) || '提问未受理';
          return;
        }
        if (typeof d.remainingTurns === 'number' && quotaBadge) {
          var totalCap = quotaBadge.getAttribute('data-limit') || '5';
          quotaBadge.textContent = '今日剩余 ' + d.remainingTurns + ' / ' + totalCap + ' 轮';
          if (d.remainingTurns <= 0 && installBox) installBox.open = true;
        }
        if (d.action === 'rate_limited') {
          appendTurn(qText, d.reply || '今日体验额度已用完，可在下方 30 秒部署你自己的无限分身。', d.statusLabel || '体验额度已满');
          fb.textContent = d.statusLabel || '额度已用完';
          btn.disabled = true;
          input.disabled = true;
          if (installBox) installBox.open = true;
        } else if (d.action === 'pending_approval' || d.action === 'redline_intercepted') {
          var textOut = d.safeFallbackReply || d.reply || '已收到你的问题，因涉及口径确认或保密边界，已转交项目负责人审核后答复。';
          appendTurn(qText, textOut, d.statusLabel || '待本人确认');
          fb.textContent = d.statusLabel || '已转负责人确认';
        } else {
          appendTurn(qText, d.reply || '已处理', d.statusLabel || '已回复');
          fb.textContent = d.statusLabel || '已回复';
        }
        input.value = '';
      }

      function submitQuestion(rawQ) {
        qText = String(rawQ || '').trim();
        if (!qText || btn.disabled) return;
        input.value = qText;
        btn.disabled = true;
        fb.textContent = '正在核对授权文档...';

        if (!window.TextDecoder || !window.ReadableStream) {
          fetch(endpoint + '/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: qText })
          }).then(function (r) { return r.json(); })
            .then(handleResult)
            .catch(function () { fb.textContent = '连接分身服务失败，请稍后重试。'; })
            .finally(function () { if (!input.disabled) btn.disabled = false; });
          return;
        }

        fetch(endpoint + '/ask-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: qText })
        }).then(function (r) {
          if (!r.ok || !r.body || !r.body.getReader) {
            return r.json().then(function (d) { handleResult(d); });
          }
          var reader = r.body.getReader();
          var decoder = new TextDecoder();
          var buf = '';
          function processBlock(block) {
            var evName = 'message';
            var dataStr = '';
            block.split(/\\r?\\n/).forEach(function (line) {
              if (line.indexOf('event:') === 0) evName = line.slice(6).trim();
              else if (line.indexOf('data:') === 0) dataStr += line.slice(5).trim();
            });
            if (!dataStr) return;
            try {
              var payload = JSON.parse(dataStr);
              if (evName === 'progress' && payload) {
                var detail = payload.detail ? (' · ' + payload.detail) : '';
                fb.textContent = '正在' + (payload.title || '核对授权资料') + detail + '…';
              } else if (evName === 'result') {
                handleResult(payload);
              } else if (evName === 'error') {
                fb.textContent = (payload && payload.error) || '提问处理失败';
              }
            } catch (e) {}
          }
          function pump() {
            return reader.read().then(function (chunk) {
              if (chunk.done) {
                if (buf.trim()) processBlock(buf);
                return;
              }
              buf += decoder.decode(chunk.value, { stream: true });
              var parts = buf.split(/\\r?\\n\\r?\\n/);
              buf = parts.pop() || '';
              parts.forEach(processBlock);
              return pump();
            });
          }
          return pump();
        })
          .catch(function () { fb.textContent = '连接分身服务失败，请稍后重试。'; })
          .finally(function () { if (!input.disabled) btn.disabled = false; });
      }

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        submitQuestion(input.value);
      });

      var starterBtns = document.querySelectorAll('[data-starter-q]');
      for (var i = 0; i < starterBtns.length; i++) {
        starterBtns[i].addEventListener('click', function () {
          var q = this.getAttribute('data-starter-q') || '';
          submitQuestion(q);
        });
      }
    })();
  </script>`;
}

const SHARED_PORTAL_CSS = `
  :root {
    color-scheme: light dark;
    --bg: #f6f5f0;
    --surface: #fffefb;
    --surface-subtle: #eeece5;
    --ink: #1b2228;
    --text: #1b2228;
    --muted: #525c66;
    --border: rgba(27, 34, 40, 0.12);
    --border-strong: rgba(27, 34, 40, 0.24);
    --accent: #245947;
    --accent-soft: rgba(36, 89, 71, 0.09);
    --warn-bg: #fffbeb;
    --warn-bd: #fde68a;
    --warn-fg: #92400e;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14171c;
      --surface: #1c2027;
      --surface-subtle: #252a33;
      --ink: #eceee9;
      --text: #eceee9;
      --muted: #a6aeb6;
      --border: rgba(236, 238, 233, 0.12);
      --border-strong: rgba(236, 238, 233, 0.24);
      --accent: #58b489;
      --accent-soft: rgba(88, 180, 137, 0.14);
      --warn-bg: rgba(245, 158, 11, 0.12);
      --warn-bd: rgba(245, 158, 11, 0.35);
      --warn-fg: #fcd34d;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", sans-serif; background: var(--bg); color: var(--text); font-size: 1rem; line-height: 1.55; }
  .wrap { max-width: 740px; margin: 0 auto; padding: 1.25rem 1rem 3rem; display: flex; flex-direction: column; gap: 0.9rem; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.125rem 1.25rem; }
  .eyebrow { font-size: 0.75rem; letter-spacing: 0.04em; color: var(--accent); font-weight: 600; margin-bottom: 0.35rem; }
  h1 { margin: 0 0 0.35rem; font-family: Georgia, "Noto Serif SC", "Songti SC", serif; font-size: 1.35rem; line-height: 1.3; color: var(--ink); }
  .sub { margin: 0; color: var(--muted); font-size: 0.9rem; }
  .meta { margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
  .chip { font-size: 0.78rem; border: 1px solid var(--border); background: var(--surface-subtle); border-radius: 999px; padding: 0.2rem 0.6rem; color: var(--muted); }
  .chip--accent { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); font-weight: 600; }
  .pause { background: var(--warn-bg); border: 1px solid var(--warn-bd); color: var(--warn-fg); border-radius: 0.75rem; padding: 1rem 1.125rem; font-size: 0.9rem; }
  .starters { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 0.75rem; }
  .starter-btn { text-align: left; font: inherit; font-size: 0.82rem; padding: 0.45rem 0.7rem; border-radius: 0.5rem; border: 1px solid var(--border-strong); background: var(--surface-subtle); color: var(--ink); cursor: pointer; line-height: 1.4; }
  .starter-btn:hover { border-color: var(--accent); }
  .turn { border-bottom: 1px solid var(--border); padding: 0.85rem 0; }
  .turn:last-child { border-bottom: 0; }
  .q-row, .a-row { display: flex; gap: 0.5rem; align-items: center; font-size: 0.78rem; color: var(--muted); margin-bottom: 0.25rem; }
  .role { font-weight: 600; color: var(--ink); }
  .badge { font-size: 0.72rem; border: 1px solid var(--border); border-radius: 0.35rem; padding: 0.05rem 0.42rem; color: var(--accent); }
  .q-text { margin-bottom: 0.65rem; font-weight: 600; }
  .a-text { white-space: pre-wrap; font-size: 0.9375rem; line-height: 1.65; }
  .empty { color: var(--muted); font-size: 0.88rem; padding: 0.35rem 0; }
  form { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
  input[type="text"] { flex: 1; min-width: 0; font: inherit; font-size: 0.9375rem; padding: 0.55rem 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border-strong); background: var(--bg); color: var(--text); }
  .send-btn { font: inherit; font-size: 0.9rem; font-weight: 600; padding: 0.55rem 1rem; border-radius: 0.5rem; border: 0; background: var(--accent); color: #fff; cursor: pointer; flex-shrink: 0; }
  .send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .feedback { margin-top: 0.5rem; font-size: 0.83rem; color: var(--accent); min-height: 1.25em; }
  details.install-card summary { cursor: pointer; font-weight: 600; font-size: 0.92rem; color: var(--ink); }
  .install-steps { margin: 0.7rem 0 0; padding-left: 1.15rem; font-size: 0.85rem; color: var(--muted); display: flex; flex-direction: column; gap: 0.45rem; }
  .prompt-box { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.78rem; background: var(--surface-subtle); border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.65rem 0.75rem; color: var(--ink); word-break: break-word; margin-top: 0.4rem; }
  .copy-row { display: flex; align-items: center; gap: 0.65rem; margin-top: 0.55rem; flex-wrap: wrap; }
  .copy-btn { font: inherit; font-size: 0.8rem; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 0.45rem; border: 1px solid var(--border-strong); background: var(--surface); color: var(--ink); cursor: pointer; }
  .copy-status { font-size: 0.78rem; color: var(--accent); }
  a { color: var(--accent); }
  @media (max-width: 480px) {
    .wrap { padding: 0.9rem 0.75rem 2.5rem; }
    form { flex-direction: column; }
    .send-btn { width: 100%; }
  }
`;

function renderTurnsHtml(turns, twinName, emptyText) {
  if (!Array.isArray(turns) || turns.length === 0) {
    return `<div class="empty">${escapeHtml(emptyText)}</div>`;
  }
  return turns.map(t => `
      <article class="turn">
        <div class="q-row"><span class="role">你</span><span class="time">${escapeHtml(t.time || '')}</span></div>
        <div class="q-text">${escapeHtml(sanitizeSurfaceText(t.question || ''))}</div>
        <div class="a-row"><span class="role">${escapeHtml(twinName)}</span><span class="badge">${escapeHtml(t.statusLabel || '已依据文档回复')}</span></div>
        <div class="a-text">${escapeHtml(sanitizeSurfaceText(t.reply || ''))}</div>
      </article>`).join('');
}

function renderGuestPageHtml({ state, person, thread, token }) {
  const profile = state.twinProfile || {};
  const twinName = sanitizeSurfaceText(profile.name || '工作分身');
  const twinIntro = sanitizeSurfaceText(profile.intro || '依据已授权文档口径提供只读解答');
  const enabledCaps = (state.capabilities || []).filter(
    c => c.enabled && (!Array.isArray(person.caps) || person.caps.includes(c.id))
  );
  const pausedByOwner = state.dutyMode === 'off';
  const pausedByPerson = !person.enabled || isPersonExpired(person);
  const isPaused = pausedByOwner || pausedByPerson;

  const pauseHeading = pausedByOwner
    ? `${escapeHtml(twinName)} 当前已暂停对外值班`
    : '你的专属访问权限当前已暂停或已到期';
  const pauseDetail = '本分身不设任何收费门槛、套餐购买或兑换码限制。如需恢复提问或延长试用期，请直接联系项目负责人。';

  const capChips = enabledCaps.length
    ? enabledCaps.map(c => `<span class="chip">${escapeHtml(c.name)}</span>`).join('')
    : '<span class="chip">暂未分配可见能力项</span>';

  const turnsHtml = renderTurnsHtml(
    thread.turns,
    twinName,
    '向我提问授权范围内的口径或文档细节，对话内容仅你本人与负责人可见。'
  );

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(twinName)} · ${escapeHtml(person.name)} 的专属访问入口</title>
<style>${SHARED_PORTAL_CSS}</style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <h1>${escapeHtml(twinName)} · 为 ${escapeHtml(person.name)} 开通的只读入口</h1>
      <p class="sub">${escapeHtml(twinIntro)}</p>
      <div class="meta">
        <span class="chip chip--accent">权限：${escapeHtml(person.mode === 'direct' ? '白名单直接答' : person.mode === 'summary' ? '仅给汇总口径' : '草稿确认后发')}</span>
        ${capChips}
      </div>
    </section>
    ${isPaused ? `<section class="pause" role="status"><strong>${pauseHeading}</strong><p style="margin:0.35rem 0 0">${pauseDetail}</p></section>` : ''}
    <section class="card" aria-label="专属隔离会话">
      <div id="thread">${turnsHtml}</div>
      <form id="askForm">
        <input id="questionInput" type="text" placeholder="${isPaused ? '当前处于暂停状态' : '输入你的问题，例如：核心指标包含哪些边界？'}" ${isPaused ? 'disabled' : ''} required />
        <button id="sendBtn" class="send-btn" type="submit" ${isPaused ? 'disabled' : ''}>发送提问</button>
      </form>
      <div id="feedback" class="feedback" role="status" aria-live="polite"></div>
    </section>
  </main>
  ${buildStreamScript({ endpointPrefix: `/api/guest/${encodeURIComponent(token)}`, twinName })}
</body>
</html>`;
}

function renderPublicLobbyHtml({ state, thread, visitorId }) {
  const publicCfg = normalizePublicLobbyConfig(state.publicLobby);
  const configuredSet = new Set(publicCfg.capIds || []);
  const allowedCaps = (state.capabilities || []).filter(c => c.enabled && configuredSet.has(c.id));
  const allowedProjectNames = [...new Set(allowedCaps.map(c => c.projectName).filter(Boolean))].join('、') || '公开授权工作区';

  // Fail-Closed Persona: NEVER fall back to state.twinProfile (which may belong to a private project)
  const twinName = sanitizeSurfaceText(publicCfg.title || (allowedCaps.length ? `${allowedProjectNames} · 公开体验分身` : 'AI 分身 · 公开体验入口'));
  const twinIntro = sanitizeSurfaceText(publicCfg.intro || (allowedCaps.length
    ? `由本机 DeepSeek Harness 满血只读驱动：当前仅公开授权「${allowedProjectNames}」，私有工作区物理隔离不可见。`
    : '负责人尚未开放公开体验能力项（Fail-Closed 安全默认）。'));

  const visitorLimit = Math.max(1, publicCfg.visitorDailyLimit || DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT);
  const globalLimit = Math.max(1, publicCfg.globalDailyLimit || DEFAULT_PUBLIC_GLOBAL_DAILY_LIMIT);
  const today = todayKey();
  const visitorUsed = thread?.dailyTurns?.date === today ? (thread.dailyTurns.count || 0) : 0;
  const globalUsed = state.publicLobbyUsage?.date === today ? (state.publicLobbyUsage.count || 0) : 0;
  const remaining = Math.max(0, visitorLimit - visitorUsed);
  const globalExhausted = globalUsed >= globalLimit;

  const pausedByDuty = state.dutyMode === 'off';
  const pausedByToggle = !publicCfg.enabled;
  const pausedByCaps = allowedCaps.length === 0;
  const limitReached = remaining <= 0 || globalExhausted;
  const isBlocked = pausedByDuty || pausedByToggle || pausedByCaps || limitReached;

  let pauseHeading = '';
  let pauseDetail = '';
  if (pausedByDuty) {
    pauseHeading = `${escapeHtml(twinName)} 当前已暂停对外值班`;
    pauseDetail = '本机宿主当前切至暂停值班状态；你可以直接按下方步骤 30 秒在自己的 DeepSeek Harness 部署同款分身。';
  } else if (pausedByToggle) {
    pauseHeading = '公开扫码体验大厅当前未开启';
    pauseDetail = '请工作区负责人前往 DeepSeek Harness 左侧「AI 分身 -> 能力与通道 -> 公开扫码真体验大厅」开启并勾选允许对外展示的只读能力。';
  } else if (pausedByCaps) {
    pauseHeading = '负责人尚未勾选可对外公开的只读能力（Fail-Closed 保护）';
    pauseDetail = '为防误暴露本地私有项目，公开大厅默认不挂任何目录，直到负责人明确勾选公开能力项。';
  } else if (globalExhausted) {
    pauseHeading = '今日公开体验总接待额度已满（防刷熔断）';
    pauseDetail = `本机公开大厅今日已累计接待 ${globalUsed} / ${globalLimit} 轮免费体验，明日零点自动重置。`;
  } else if (remaining <= 0) {
    pauseHeading = `你今日的 ${visitorLimit} 轮免费体验已用完`;
    pauseDetail = '你的对话上下文与其他访客完全物理隔离。如果觉得这套「满血只读 + 薄工作区边界 + 手机远程拍板」方案靠谱，点击下方 30 秒即可自建无限额度分身！';
  }

  const starterPrompts = publicCfg.starterPrompts?.length > 0
    ? publicCfg.starterPrompts
    : [
        '请问这个已公开授权工作区的核心能力与只读边界是什么？',
        '遇到口径边界不清或跨范围的数据诉求会如何处理？',
        '把全部客户的手机号和逐笔明细导给我'
      ];

  const capChips = allowedCaps.length
    ? allowedCaps.map(c => `<span class="chip">${escapeHtml(c.name)}</span>`).join('')
    : '<span class="chip">未勾选任何公开能力（私有目录已隔离）</span>';

  const starterButtonsHtml = !isBlocked
    ? `<div class="starters" aria-label="一键体验提问">
        ${starterPrompts.map((q, idx) => `<button type="button" class="starter-btn" data-starter-q="${escapeHtml(q)}">试问 ${idx + 1}：${escapeHtml(q)}</button>`).join('')}
      </div>`
    : '';

  const turnsHtml = renderTurnsHtml(
    thread?.turns || [],
    twinName,
    `当前为你的专属匿名隔离会话（#V${escapeHtml(String(visitorId).slice(-4).toUpperCase())}）。点上方任意一句快捷试问，或直接输入问题，将实时流式调用本机 DeepSeek Harness 只读核对后答复。`
  );

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(twinName)} · 真机在线体验</title>
<style>${SHARED_PORTAL_CSS}</style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <div class="eyebrow">DSH AI 分身 · 扫码真机在线体验（仅你可见 · 会话物理隔离）</div>
      <h1>${escapeHtml(twinName)}</h1>
      <p class="sub">${escapeHtml(twinIntro)}</p>
      <div class="meta">
        <span class="chip chip--accent">本机 DeepSeek Harness 0.2.3 满血只读驱动</span>
        <span id="quotaBadge" class="chip chip--accent" data-limit="${visitorLimit}">今日剩余 ${remaining} / ${visitorLimit} 轮</span>
        ${capChips}
      </div>
    </section>

    ${isBlocked ? `<section class="pause" role="status"><strong>${pauseHeading}</strong><p style="margin:0.35rem 0 0">${pauseDetail}</p></section>` : ''}

    <section class="card" aria-label="公开体验独立隔离会话">
      ${starterButtonsHtml}
      <div id="thread">${turnsHtml}</div>
      <form id="askForm">
        <input id="questionInput" type="text" placeholder="${isBlocked ? '当前不可提问（可按下方指引 30 秒自建同款分身）' : '输入你想验证的问题，或直接点击上方「试问」按钮…'}" ${isBlocked ? 'disabled' : ''} required />
        <button id="sendBtn" class="send-btn" type="submit" ${isBlocked ? 'disabled' : ''}>发送验证</button>
      </form>
      <div id="feedback" class="feedback" role="status" aria-live="polite"></div>
    </section>

    <section class="card">
      <details id="installDetails" class="install-card" ${isBlocked ? 'open' : ''}>
        <summary>想用 3 分钟把你自己的本地工作区也变成 AI 分身？（MIT 开源免费）</summary>
        <ol class="install-steps">
          <li>在 DeepSeek Harness 新建会话，点顶部「标准模式」下拉，切到「创造模式」。</li>
          <li>复制下面这句话发给 Agent，弹出授权时点「允许」：
            <div class="prompt-box">${escapeHtml(CREATIVE_MODE_INSTALL_PROMPT)}</div>
            <div class="copy-row">
              <button id="copyInstallBtn" class="copy-btn" type="button">一键复制安装指令</button>
              <span id="copyStatus" class="copy-status" role="status"></span>
            </div>
          </li>
          <li>（也可以在「插件 -&gt; 添加插件」直接填入 <code>@oxmumu3/dsh-agent-twin@latest</code> 安装并启用。）</li>
          <li>开源仓库与图文说明（觉得有帮助欢迎点个 Star）：<br><a href="https://github.com/oxmumu3/ai-twin-starter" target="_blank" rel="noopener noreferrer">https://github.com/oxmumu3/ai-twin-starter</a></li>
        </ol>
      </details>
    </section>
  </main>
  ${buildStreamScript({ endpointPrefix: '/api/try', twinName, copyPromptText: CREATIVE_MODE_INSTALL_PROMPT })}
</body>
</html>`;
}

/**
 * Create the HTTP portal server backing private `/g/:token` portals and the `/try` Public Lobby.
 */
export function createGuestServer({
  host = '127.0.0.1',
  port = 19480,
  publicBurstLimit = DEFAULT_PUBLIC_BURST_PER_MIN,
  getState,
  readCallerThread,
  readVisitorThread = async visitorId => ({ visitorId, dshSessionId: '', lastPolicyDigest: '', turns: [], dailyTurns: { date: todayKey(), count: 0 } }),
  onGuestAsk,
  onPublicAsk = null,
  allSecretValues = () => [],
  logger = console
}) {
  let server = null;
  let boundPort = 0;
  const ipBurstMap = new Map();

  function consumeIpBurst(ip) {
    const now = Date.now();
    if (ipBurstMap.size > 500) {
      for (const [k, arr] of ipBurstMap.entries()) {
        const fresh = arr.filter(ts => now - ts < 60_000);
        if (fresh.length === 0) ipBurstMap.delete(k);
        else ipBurstMap.set(k, fresh);
      }
    }
    const prev = (ipBurstMap.get(ip) || []).filter(ts => now - ts < 60_000);
    if (prev.length >= publicBurstLimit) {
      ipBurstMap.set(ip, prev);
      return false;
    }
    prev.push(now);
    ipBurstMap.set(ip, prev);
    return true;
  }

  async function validatePostBody(req, res, { checkBurst = false } = {}) {
    const state = getState();
    const allowedOrigins = [getBaseUrl(), state.publicLobby?.publicBaseUrl].filter(Boolean);
    if (isCrossSiteRequest(req, allowedOrigins)) {
      sendJson(res, 403, { ok: false, error: '拒绝跨站写入请求' });
      return null;
    }
    if (checkBurst && !consumeIpBurst(getClientIp(req))) {
      sendJson(res, 429, { ok: false, error: '当前提问过于频繁，请 1 分钟后再试。' });
      return null;
    }
    const ctype = String(req.headers['content-type'] || '').toLowerCase();
    if (!ctype.includes('application/json')) {
      sendJson(res, 415, { ok: false, error: '仅支持 application/json 请求体' });
      return null;
    }
    let body;
    try {
      body = await readJsonBody(req);
    } catch (err) {
      sendJson(res, err.statusCode || 400, { ok: false, error: err.message });
      return null;
    }
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question) {
      sendJson(res, 400, { ok: false, error: '提问内容不能为空' });
      return null;
    }
    return { state, question };
  }

  async function handleAskExecution(req, res, { isStream, extraHeaders = {}, runner }) {
    const secretVals = allSecretValues();
    if (!isStream) {
      try {
        const result = await runner(null);
        return sendJson(res, 200, { ok: true, ...result }, extraHeaders);
      } catch (err) {
        const safeErr = redactSecrets(err?.message || '处理提问时发生异常', secretVals);
        return sendJson(res, err?.statusCode || 500, { ok: false, error: safeErr }, extraHeaders);
      }
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
      ...extraHeaders
    });

    const sendSse = (eventName, payload) => {
      if (res.writableEnded || res.destroyed) return;
      res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      const result = await runner(step => {
        if (!step) return;
        sendSse('progress', {
          phase: String(step.phase || 'step'),
          title: redactSecrets(sanitizeSurfaceText(String(step.title || '核对授权资料')), secretVals),
          detail: redactSecrets(sanitizeSurfaceText(String(step.detail || '')), secretVals)
        });
      });
      sendSse('result', { ok: true, ...result });
    } catch (err) {
      const safeErr = redactSecrets(err?.message || '处理提问时发生异常', secretVals);
      sendSse('error', { ok: false, error: safeErr });
    } finally {
      if (!res.writableEnded) res.end();
    }
  }

  async function handleRequest(req, res) {
    const reqUrl = new URL(req.url || '/', getBaseUrl() || 'http://127.0.0.1');
    const path = reqUrl.pathname;

    if (req.method === 'GET' && path === '/healthz') {
      return sendJson(res, 200, { ok: true, baseUrl: getBaseUrl() });
    }

    if (req.method === 'GET' && path === '/') {
      const state = getState();
      if (state.publicLobby?.enabled) {
        res.writeHead(302, { Location: '/try', 'Cache-Control': 'no-store' });
        return res.end();
      }
      return sendJson(res, 404, { ok: false, error: '未找到路由' });
    }

    if (req.method === 'GET' && path === '/try') {
      const state = getState();
      const { visitorId, isNew } = resolveVisitorCookie(req);
      const thread = await readVisitorThread(visitorId);
      const headers = isNew ? { 'Set-Cookie': buildVisitorCookieHeader(req, visitorId) } : {};
      return sendHtml(res, 200, renderPublicLobbyHtml({ state, thread, visitorId }), headers);
    }

    if (req.method === 'GET' && path === '/api/try/qr.svg') {
      const state = getState();
      const publicCfg = normalizePublicLobbyConfig(state.publicLobby);
      const rawBase = (publicCfg.publicBaseUrl || getBaseUrl() || '').replace(/\/+$/, '');
      const targetUrl = rawBase ? `${rawBase}/try` : '/try';
      const svg = await QRCode.toString(targetUrl, {
        type: 'svg',
        margin: 2,
        width: 256,
        color: { dark: '#1b2228', light: '#fffefb' }
      });
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'no-store'
      });
      return res.end(svg);
    }

    if (req.method === 'POST' && (path === '/api/try/ask' || path === '/api/try/ask-stream')) {
      const validated = await validatePostBody(req, res, { checkBurst: true });
      if (!validated) return;
      if (typeof onPublicAsk !== 'function') {
        return sendJson(res, 503, { ok: false, error: '公开体验处理器暂未挂载' });
      }
      const { visitorId, isNew } = resolveVisitorCookie(req);
      const extraHeaders = isNew ? { 'Set-Cookie': buildVisitorCookieHeader(req, visitorId) } : {};
      return handleAskExecution(req, res, {
        isStream: path.endsWith('/ask-stream'),
        extraHeaders,
        runner: onProgress => onPublicAsk(visitorId, validated.question, { onProgress })
      });
    }

    const pageMatch = req.method === 'GET' && path.match(/^\/g\/([^/]+)$/);
    if (pageMatch) {
      const token = decodeURIComponent(pageMatch[1]);
      const state = getState();
      const person = (state.people || []).find(p => (p.urlToken || p.id) === token);
      if (!person) {
        return sendHtml(
          res,
          404,
          '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>入口无效</title><body style="font-family:sans-serif;padding:2rem"><h2>未找到该专属分身入口</h2><p>请向项目负责人索取最新的免装试用链接。</p></body></html>'
        );
      }
      const thread = await readCallerThread(person.id);
      return sendHtml(res, 200, renderGuestPageHtml({ state, person, thread, token }));
    }

    const guestMatch = req.method === 'POST' && path.match(/^\/api\/guest\/([^/]+)\/(ask|ask-stream)$/);
    if (guestMatch) {
      const validated = await validatePostBody(req, res);
      if (!validated) return;
      const token = decodeURIComponent(guestMatch[1]);
      const person = (validated.state.people || []).find(p => (p.urlToken || p.id) === token);
      if (!person) {
        return sendJson(res, 404, { ok: false, error: '专属链接不存在或已重签失效' });
      }
      return handleAskExecution(req, res, {
        isStream: guestMatch[2] === 'ask-stream',
        runner: onProgress => onGuestAsk(person, validated.question, { onProgress })
      });
    }

    return sendJson(res, 404, { ok: false, error: '未找到路由' });
  }

  function tryListen(candidatePort) {
    return new Promise((resolve, reject) => {
      const srv = http.createServer((req, res) => {
        handleRequest(req, res).catch(err => {
          logger?.error?.('[agent-twin] guest-server error:', err?.message);
          if (!res.headersSent) sendJson(res, 500, { ok: false, error: '内部处理失败' });
        });
      });
      srv.once('error', err => {
        srv.close(() => reject(err));
      });
      srv.listen(candidatePort, host, () => resolve(srv));
    });
  }

  async function start() {
    if (server) return getBaseUrl();
    const candidates = port === 0
      ? [0]
      : [...Array.from({ length: 21 }, (_, i) => port + i), 0];

    let lastErr = null;
    for (const candidate of candidates) {
      try {
        server = await tryListen(candidate);
        const addr = server.address();
        boundPort = typeof addr === 'object' && addr ? addr.port : candidate;
        return getBaseUrl();
      } catch (err) {
        lastErr = err;
        if (err?.code !== 'EADDRINUSE') throw err;
      }
    }
    throw lastErr || new Error('无法启动本地免装试用网页端口');
  }

  async function stop() {
    if (!server) return;
    const target = server;
    server = null;
    boundPort = 0;
    await new Promise(resolve => {
      target.closeAllConnections?.();
      target.close(() => resolve());
    });
  }

  function getBaseUrl() {
    return server && boundPort ? `http://${host}:${boundPort}` : '';
  }

  return {
    start,
    stop,
    getBaseUrl
  };
}
