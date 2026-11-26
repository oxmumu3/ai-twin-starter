/**
 * Real Personal WeChat (`iLink` bot protocol) client & QR SVG generator.
 * Implements `get_bot_qrcode`, `get_qrcode_status` (incl. redirect host),
 * `getupdates` long-polling, and `sendmessage` with single `-2` context recovery.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import QRCode from 'qrcode';

const DEFAULT_WEIXIN_BASE = 'https://ilinkai.weixin.qq.com';
const CHANNEL_VERSION = '2.4.10';
const CLIENT_VER_INT = String((2 * 65536) + (4 * 256) + 10);
const PRIVATE_HOST_RE = /^(?:localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|0\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[0-1])\.\d+\.\d+|\[::1\]|::1)$/i;

/**
 * Strict SSRF guard for `iLink` WeChat gateway base URLs.
 */
export function validateWeixinBaseUrl(rawUrl, { allowLoopbackForTest = false } = {}) {
  let parsed;
  try {
    parsed = new URL(String(rawUrl || ''));
  } catch {
    throw new Error('微信接口地址格式无效');
  }
  if (!allowLoopbackForTest) {
    if (parsed.protocol !== 'https:') {
      throw new Error('仅允许使用 HTTPS 协议连接微信接口');
    }
    const host = parsed.hostname.toLowerCase();
    if (PRIVATE_HOST_RE.test(host) || host.endsWith('.local') || host.endsWith('.internal')) {
      throw new Error('禁止连接本机或内网私有地址，已拦截潜在 SSRF 风险');
    }
    if (host !== 'ilinkai.weixin.qq.com' && !host.endsWith('.weixin.qq.com')) {
      throw new Error('仅允许官方微信 iLink 域名');
    }
  }
  return parsed.origin;
}

function nonempty(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function normalizeIncomingMessage(msg) {
  const parts = [];
  for (const item of Array.isArray(msg?.item_list) ? msg.item_list : []) {
    if (item?.type === 1 && typeof item.text_item?.text === 'string') {
      parts.push(item.text_item.text);
    } else if (item?.type === 3 && nonempty(item.voice_item?.text)) {
      parts.push(item.voice_item.text);
    }
  }
  return {
    messageId: String(msg?.message_id ?? msg?.client_id ?? ''),
    senderId: String(msg?.from_user_id || ''),
    accountId: String(msg?.to_user_id || ''),
    groupId: String(msg?.group_id || ''),
    chatType: msg?.group_id ? 'group' : 'dm',
    text: parts.join('\n').trim(),
    contextToken: typeof msg?.context_token === 'string' ? msg.context_token : ''
  };
}

export async function renderQrSvg(payload) {
  return QRCode.toString(String(payload || ''), {
    type: 'svg',
    margin: 1,
    width: 180,
    color: { dark: '#111827', light: '#ffffff' }
  });
}

/**
 * Create the real `iLink` WeChat bot API client.
 */
export function createWeixinIlinkClient({
  fetchImpl = globalThis.fetch,
  baseUrl = DEFAULT_WEIXIN_BASE,
  allowLoopbackForTest = false
} = {}) {
  const initialBase = validateWeixinBaseUrl(baseUrl, { allowLoopbackForTest });
  const qrHostByToken = new Map();

  async function request(host, endpoint, { token, body, signal, timeoutMs = 15_000, send = false } = {}) {
    const validBase = validateWeixinBaseUrl(host, { allowLoopbackForTest });
    const headers = {
      'iLink-App-Id': 'bot',
      'iLink-App-ClientVersion': CLIENT_VER_INT
    };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers.AuthorizationType = 'ilink_bot_token';
      headers['X-WECHAT-UIN'] = Buffer.from(String(randomBytes(4).readUInt32BE())).toString('base64');
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const timer = AbortSignal.timeout(timeoutMs);
    const combined = signal ? AbortSignal.any([signal, timer]) : timer;
    try {
      const res = await fetchImpl(new URL(endpoint, `${validBase}/`).href, {
        method: body === undefined ? 'GET' : 'POST',
        headers,
        redirect: 'error',
        signal: combined,
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });
      if (!res.ok) {
        throw Object.assign(new Error(`微信网关 HTTP ${res.status}`), { sendOutcome: send ? 'uncertain' : 'failed' });
      }
      const raw = await res.text();
      const parsed = raw ? JSON.parse(raw) : {};
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('微信接口返回格式无效');
      }
      for (const k of ['ret', 'errcode']) {
        if (parsed[k] !== undefined && parsed[k] !== 0) {
          const code = parsed.errcode ?? parsed.ret;
          throw Object.assign(new Error(parsed.errmsg || `微信接口返回错误码 ${code}`), {
            code,
            sendOutcome: 'failed'
          });
        }
      }
      return parsed;
    } catch (err) {
      if (!send && timer.aborted && !signal?.aborted && endpoint.includes('getupdates')) {
        return { msgs: [] };
      }
      if (send && !err?.sendOutcome) {
        err.sendOutcome = 'uncertain';
      }
      throw err;
    }
  }

  async function getQr({ signal } = {}) {
    const val = await request(initialBase, 'ilink/bot/get_bot_qrcode?bot_type=3', {
      signal,
      body: { local_token_list: [] }
    });
    if (!nonempty(val.qrcode) || !nonempty(val.qrcode_img_content)) {
      throw new Error('微信未返回有效二维码载荷');
    }
    qrHostByToken.set(val.qrcode, initialBase);
    const qrSvg = await renderQrSvg(val.qrcode_img_content);
    return {
      qrcode: val.qrcode,
      qrUrl: val.qrcode_img_content,
      qrSvg
    };
  }

  async function checkQr({ qrcode, signal } = {}) {
    if (!nonempty(qrcode)) throw new Error('缺少微信二维码凭证');
    const host = qrHostByToken.get(qrcode) || initialBase;
    const q = new URLSearchParams({ qrcode });
    let val;
    try {
      val = await request(host, `ilink/bot/get_qrcode_status?${q}`, { signal, timeoutMs: 35_000 });
    } catch (err) {
      if (signal?.aborted || err?.sendOutcome === 'failed') throw err;
      return { status: 'wait' };
    }
    if (val.status === 'scaned_but_redirect') {
      if (nonempty(val.redirect_host)) {
        qrHostByToken.set(
          qrcode,
          validateWeixinBaseUrl(`https://${val.redirect_host}`, { allowLoopbackForTest })
        );
      }
      return { status: 'scaned' };
    }
    if (val.status !== 'confirmed') {
      return { status: String(val.status || 'wait') };
    }
    const confirmedBase = validateWeixinBaseUrl(val.baseurl || qrHostByToken.get(qrcode) || initialBase, { allowLoopbackForTest });
    if (![val.bot_token, val.ilink_bot_id, val.ilink_user_id].every(nonempty)) {
      throw new Error('微信登录返回字段不完整');
    }
    qrHostByToken.delete(qrcode);
    return {
      status: 'confirmed',
      botToken: val.bot_token,
      baseUrl: confirmedBase,
      botId: val.ilink_bot_id,
      peerId: val.ilink_user_id
    };
  }

  async function pollUpdates({ botToken, baseUrl: host = initialBase, cursor = '', signal } = {}) {
    if (!nonempty(botToken)) throw new Error('尚未获得微信 botToken');
    const val = await request(host, 'ilink/bot/getupdates', {
      token: botToken,
      signal,
      timeoutMs: 38_000,
      body: {
        get_updates_buf: cursor,
        base_info: { channel_version: CHANNEL_VERSION, bot_agent: 'DSHAgentTwin/0.6.0' }
      }
    });
    return {
      messages: (Array.isArray(val.msgs) ? val.msgs : []).map(normalizeIncomingMessage),
      cursor: typeof val.get_updates_buf === 'string' ? val.get_updates_buf : cursor
    };
  }

  async function sendText({
    botToken,
    baseUrl: host = initialBase,
    peerId,
    contextToken = '',
    text,
    clientId = randomUUID(),
    signal
  }) {
    if (![botToken, peerId, text].every(nonempty)) {
      return { delivered: false, reason: 'missing_weixin_context' };
    }
    const dispatch = ctxTok => request(host, 'ilink/bot/sendmessage', {
      token: botToken,
      signal,
      send: true,
      timeoutMs: 15_000,
      body: {
        msg: {
          from_user_id: '',
          to_user_id: peerId,
          client_id: clientId,
          message_type: 2,
          message_state: 2,
          item_list: [{ type: 1, text_item: { text } }],
          ...(nonempty(ctxTok) ? { context_token: ctxTok } : {})
        },
        base_info: { channel_version: CHANNEL_VERSION, bot_agent: 'DSHAgentTwin/0.6.0' }
      }
    });

    let res;
    try {
      res = await dispatch(contextToken);
    } catch (err) {
      // Only recover once on definite -2 context rejection; never auto-retry network uncertainty.
      if (err?.sendOutcome === 'failed' && err.code === -2 && nonempty(contextToken)) {
        res = await dispatch('');
      } else {
        throw err;
      }
    }
    return {
      delivered: true,
      channelId: 'ch-wechat',
      messageId: res?.message_id || ''
    };
  }

  return {
    getQr,
    checkQr,
    pollUpdates,
    sendText
  };
}
