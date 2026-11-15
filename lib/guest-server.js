/**
 * Built-in zero-dependency loopback Guest Web Portal (`ch-web`, Step 1).
 * Serves isolated per-caller conversation pages (`/g/:token`) and JSON question
 * endpoint (`/api/guest/:token/ask`) with zero redeem codes or paywalls.
 */
import http from 'node:http';
import { URL } from 'node:url';
import {
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { isPersonExpired } from './twin-engine.js';

const MAX_BODY_BYTES = 65536;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isCrossSiteRequest(req, expectedOrigin) {
  const secFetch = String(req.headers['sec-fetch-site'] || '').toLowerCase();
  if (secFetch && secFetch !== 'same-origin' && secFetch !== 'none') {
    return true;
  }
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (expectedOrigin) {
      const exp = new URL(expectedOrigin);
      if (parsed.origin === exp.origin) return false;
    }
    return !['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
  } catch {
    return true;
  }
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
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

  const turnsHtml = (thread.turns || []).length
    ? thread.turns.map(t => `
      <article class="turn">
        <div class="q-row"><span class="role">你</span><span class="time">${escapeHtml(t.time || '')}</span></div>
        <div class="q-text">${escapeHtml(sanitizeSurfaceText(t.question || ''))}</div>
        <div class="a-row"><span class="role">${escapeHtml(twinName)}</span><span class="badge">${escapeHtml(t.statusLabel || '已依据文档回复')}</span></div>
        <div class="a-text">${escapeHtml(sanitizeSurfaceText(t.reply || ''))}</div>
      </article>`).join('')
    : '<div class="empty">向我提问授权范围内的口径或文档细节，对话内容仅你本人与负责人可见。</div>';

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(twinName)} · ${escapeHtml(person.name)} 的专属访问入口</title>
<style>
  :root { color-scheme: light dark; --bg: #faf9f6; --surface: #ffffff; --text: #1c1917; --muted: #57534e; --border: #e7e5e4; --accent: #1d4ed8; --warn-bg: #fffbeb; --warn-bd: #fde68a; --warn-fg: #92400e; }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #111317; --surface: #181b20; --text: #f5f5f4; --muted: #a8a29e; --border: #2c313a; --accent: #60a5fa; --warn-bg: rgba(245,158,11,0.12); --warn-bd: rgba(245,158,11,0.35); --warn-fg: #fcd34d; }
  }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: var(--bg); color: var(--text); font-size: 1rem; line-height: 1.55; }
  .wrap { max-width: 720px; margin: 0 auto; padding: 1.5rem 1rem 3rem; display: flex; flex-direction: column; gap: 1rem; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.125rem 1.25rem; }
  h1 { margin: 0 0 0.25rem; font-size: 1.25rem; }
  .sub { margin: 0; color: var(--muted); font-size: 0.9rem; }
  .meta { margin-top: 0.75rem; display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
  .chip { font-size: 0.8rem; border: 1px solid var(--border); border-radius: 999px; padding: 0.2rem 0.6rem; color: var(--muted); }
  .pause { background: var(--warn-bg); border: 1px solid var(--warn-bd); color: var(--warn-fg); border-radius: 0.75rem; padding: 1rem 1.125rem; }
  .turn { border-bottom: 1px solid var(--border); padding: 0.85rem 0; }
  .turn:last-child { border-bottom: 0; }
  .q-row, .a-row { display: flex; gap: 0.5rem; align-items: center; font-size: 0.8rem; color: var(--muted); margin-bottom: 0.2rem; }
  .role { font-weight: 600; color: var(--text); }
  .badge { font-size: 0.75rem; border: 1px solid var(--border); border-radius: 0.35rem; padding: 0.05rem 0.4rem; }
  .q-text { margin-bottom: 0.65rem; font-weight: 500; }
  .a-text { white-space: pre-wrap; }
  .empty { color: var(--muted); font-size: 0.9rem; padding: 0.5rem 0; }
  form { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
  input[type="text"] { flex: 1; font: inherit; font-size: 0.95rem; padding: 0.55rem 0.75rem; border-radius: 0.5rem; border: 1px solid var(--border); background: var(--bg); color: var(--text); }
  button { font: inherit; font-size: 0.9rem; font-weight: 600; padding: 0.55rem 1rem; border-radius: 0.5rem; border: 0; background: var(--accent); color: #fff; cursor: pointer; }
  button:disabled { opacity: 0.5; cursor: not-allowed; }
  .feedback { margin-top: 0.5rem; font-size: 0.85rem; color: var(--muted); min-height: 1.2em; }
</style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <h1>${escapeHtml(twinName)} · 为 ${escapeHtml(person.name)} 开通的只读入口</h1>
      <p class="sub">${escapeHtml(twinIntro)}</p>
      <div class="meta">
        <span class="chip">权限：${escapeHtml(person.mode === 'direct' ? '白名单直接答' : person.mode === 'summary' ? '仅给汇总口径' : '草稿确认后发')}</span>
        ${capChips}
      </div>
    </section>
    ${isPaused ? `<section class="pause" role="status"><strong>${pauseHeading}</strong><p style="margin:0.35rem 0 0">${pauseDetail}</p></section>` : ''}
    <section class="card" aria-label="专属隔离会话">
      <div id="thread">${turnsHtml}</div>
      <form id="askForm">
        <input id="questionInput" type="text" placeholder="${isPaused ? '当前处于暂停状态' : '输入你的问题，例如：核心指标包含哪些边界？'}" ${isPaused ? 'disabled' : ''} required />
        <button id="sendBtn" type="submit" ${isPaused ? 'disabled' : ''}>发送提问</button>
      </form>
      <div id="feedback" class="feedback" role="status" aria-live="polite"></div>
    </section>
  </main>
  <script>
    (function () {
      var token = ${JSON.stringify(String(token || ''))};
      var form = document.getElementById('askForm');
      var input = document.getElementById('questionInput');
      var btn = document.getElementById('sendBtn');
      var fb = document.getElementById('feedback');
      var thread = document.getElementById('thread');
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
        var as = document.createElement('span'); as.className = 'role'; as.textContent = ${JSON.stringify(twinName)};
        var bs = document.createElement('span'); bs.className = 'badge'; bs.textContent = badge || '已收到';
        ar.appendChild(as); ar.appendChild(bs);
        var at = document.createElement('div'); at.className = 'a-text'; at.textContent = a;
        art.appendChild(qr); art.appendChild(qt); art.appendChild(ar); art.appendChild(at);
        thread.appendChild(art);
      }
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var q = String(input.value || '').trim();
        if (!q || btn.disabled) return;
        btn.disabled = true;
        fb.textContent = '正在核对授权文档...';
        fetch('/api/guest/' + encodeURIComponent(token) + '/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: q })
        }).then(function (r) { return r.json().then(function (d) { return { status: r.status, data: d }; }); })
          .then(function (res) {
            if (!res.data || !res.data.ok) {
              fb.textContent = (res.data && res.data.error) || '提问未受理';
              return;
            }
            var d = res.data;
            if (d.action === 'pending_approval' || d.action === 'redline_intercepted') {
              appendTurn(q, '已收到你的问题，因涉及口径确认或保密边界，已转交项目负责人审核后答复。', d.statusLabel || '待本人确认');
              fb.textContent = d.statusLabel || '已转负责人确认';
            } else {
              appendTurn(q, d.reply || '已处理', d.statusLabel || '已回复');
              fb.textContent = d.statusLabel || '已回复';
            }
            input.value = '';
          })
          .catch(function () { fb.textContent = '连接本地分身服务失败，请稍后重试。'; })
          .finally(function () { btn.disabled = false; });
      });
    })();
  </script>
</body>
</html>`;
}

/**
 * Create the local HTTP loopback server backing `ch-web` guest portals.
 */
export function createGuestServer({
  host = '127.0.0.1',
  port = 19480,
  getState,
  readCallerThread,
  onGuestAsk,
  allSecretValues = () => [],
  logger = console
}) {
  let server = null;
  let boundPort = 0;

  async function handleRequest(req, res) {
    const reqUrl = new URL(req.url || '/', getBaseUrl() || 'http://127.0.0.1');
    const path = reqUrl.pathname;

    if (req.method === 'GET' && path === '/healthz') {
      return sendJson(res, 200, { ok: true, baseUrl: getBaseUrl() });
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

    const askMatch = req.method === 'POST' && path.match(/^\/api\/guest\/([^/]+)\/ask$/);
    if (askMatch) {
      if (isCrossSiteRequest(req, getBaseUrl())) {
        return sendJson(res, 403, { ok: false, error: '拒绝跨站写入请求' });
      }
      const ctype = String(req.headers['content-type'] || '').toLowerCase();
      if (!ctype.includes('application/json')) {
        return sendJson(res, 415, { ok: false, error: '仅支持 application/json 请求体' });
      }
      let body;
      try {
        body = await readJsonBody(req);
      } catch (err) {
        return sendJson(res, err.statusCode || 400, { ok: false, error: err.message });
      }
      const token = decodeURIComponent(askMatch[1]);
      const state = getState();
      const person = (state.people || []).find(p => (p.urlToken || p.id) === token);
      if (!person) {
        return sendJson(res, 404, { ok: false, error: '专属链接不存在或已重签失效' });
      }
      const question = typeof body?.question === 'string' ? body.question.trim() : '';
      if (!question) {
        return sendJson(res, 400, { ok: false, error: '提问内容不能为空' });
      }
      try {
        const result = await onGuestAsk(person, question);
        return sendJson(res, 200, { ok: true, ...result });
      } catch (err) {
        const safeErr = redactSecrets(err?.message || '处理提问时发生异常', allSecretValues());
        return sendJson(res, 500, { ok: false, error: safeErr });
      }
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
