/**
 * 5 Local-First Channel Adapters & Inbound/Outbound Router (Step 2):
 * - `ch-web`: built-in loopback guest portal tokens
 * - `ch-wechat`: personal WeChat `iLink` 5-min QR + SSRF URL validation + 1-to-1 lock
 * - `ch-feishu`: Feishu / Lark tenant token handshake + local long-connection WS
 * - `ch-wecom`: WeCom AI Bot WS (`wss://openws.work.weixin.qq.com`) & CorpApp REST
 * - `ch-slack`: Slack Socket Mode (`apps.connections.open` + `envelope_id` ack) + `chat.postMessage`
 */
import { randomUUID } from 'node:crypto';
import { URL } from 'node:url';
import {
  CHANNEL_PREFIX_MAP,
  WECHAT_QR_TTL_MS,
  channelIdFromSelection,
  channelSelectionLabel,
  maskSecretHint,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';

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

function attachWsHandlers(ws, onOpen, onMessage, onClose) {
  if (!ws) return;
  if (typeof ws.on === 'function') {
    if (ws.readyState === 1) onOpen?.();
    else ws.on('open', () => onOpen?.());
    ws.on('message', data => onMessage?.(data));
    ws.on('close', () => onClose?.());
    ws.on('error', () => {});
    return;
  }
  if (typeof ws.addEventListener === 'function') {
    if (ws.readyState === 1) onOpen?.();
    else ws.addEventListener('open', () => onOpen?.());
    ws.addEventListener('message', ev => onMessage?.(ev.data));
    ws.addEventListener('close', () => onClose?.());
    ws.addEventListener('error', () => {});
  }
}

async function readJsonResponse(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * Create the unified 5-channel runtime manager.
 */
export function createChannelManager({
  store,
  engine,
  guestServer,
  fetchImpl = globalThis.fetch,
  createWebSocket = url => new globalThis.WebSocket(url),
  weixinBaseUrl = 'https://ilinkai.weixin.qq.com',
  allowLoopbackForTest = false,
  logger = console
}) {
  const sockets = new Map();
  let stopped = false;

  function closeSocket(channelId) {
    const ws = sockets.get(channelId);
    sockets.delete(channelId);
    if (!ws) return;
    try {
      ws.close?.();
    } catch {
      // ignore socket close errors during teardown
    }
  }

  async function start() {
    stopped = false;
    const state = store.getState();
    let changed = false;
    for (const p of state.people || []) {
      if (!p.urlToken) changed = true;
    }
    if (changed) {
      await store.updateState(st => {
        for (const p of st.people) {
          if (!p.urlToken) p.urlToken = `tok-${randomUUID().slice(0, 12)}`;
        }
      });
    }
  }

  async function ensureWebToken(personId) {
    const state = store.getState();
    const target = state.people.find(p => p.id === personId);
    if (!target) throw new Error('未找到对应的服务对象');
    if (!target.urlToken) {
      const token = `tok-${randomUUID().slice(0, 12)}`;
      await store.updateState(st => {
        const p = st.people.find(x => x.id === personId);
        if (p) p.urlToken = token;
      });
    }
    const updated = store.getState().people.find(p => p.id === personId);
    const base = guestServer?.getBaseUrl?.() || '';
    return {
      urlToken: updated.urlToken,
      guestUrl: base ? `${base}/g/${encodeURIComponent(updated.urlToken)}` : `/g/${encodeURIComponent(updated.urlToken)}`
    };
  }

  async function startWechatQrSession(personId = null) {
    const origin = validateWeixinBaseUrl(weixinBaseUrl, { allowLoopbackForTest });
    const qrToken = `wxqr-${randomUUID().slice(0, 12)}`;
    const expiresAt = Date.now() + WECHAT_QR_TTL_MS;
    const qrPayload = `${origin}/dl/ilink?ticket=${qrToken}`;

    await store.updateChannelSecret('ch-wechat', {
      qrToken,
      qrUrl: qrPayload,
      expiresAt,
      pendingPersonId: personId || ''
    });

    await store.updateState(st => {
      const ch = st.channels.find(c => c.id === 'ch-wechat');
      if (ch) {
        ch.status = '5 分钟专属扫码凭证已生成 · 等待微信扫一扫确认';
      }
      if (personId) {
        const p = st.people.find(x => x.id === personId);
        if (p) {
          p.qrToken = qrToken;
          p.qrExpiresAt = expiresAt;
        }
      }
    });

    return { qrToken, qrUrl: qrPayload, expiresAt, ttlMs: WECHAT_QR_TTL_MS };
  }

  async function confirmWechatBind({ personId, wechatOpenId, qrToken }) {
    if (!wechatOpenId || typeof wechatOpenId !== 'string') {
      throw new Error('缺少有效的微信扫码身份标识');
    }
    const sec = store.getSecrets()['ch-wechat'] || {};
    const state = store.getState();
    const person = personId ? state.people.find(p => p.id === personId) : null;
    const expectedToken = person?.qrToken || sec.qrToken;
    const expiresAt = person?.qrExpiresAt || sec.expiresAt || 0;

    if (!expectedToken || (qrToken && qrToken !== expectedToken)) {
      throw new Error('微信二维码凭证不匹配或已被重置');
    }
    if (expiresAt && Date.now() > expiresAt) {
      throw new Error('微信 5 分钟扫码凭证已过期，请重新生成二维码');
    }

    await store.updateChannelSecret('ch-wechat', {
      ...sec,
      boundOpenId: wechatOpenId
    });

    await store.updateState(st => {
      const ch = st.channels.find(c => c.id === 'ch-wechat');
      if (ch) {
        ch.configured = true;
        ch.enabled = true;
        ch.status = '个人微信 1 对 1 已扫码锁定 · 陌生人零响应';
      }
      if (personId) {
        const p = st.people.find(x => x.id === personId);
        if (p) {
          p.externalSenderId = wechatOpenId;
          p.externalChatId = wechatOpenId;
          p.wechatBound = true;
          p.pairedAt = new Date().toISOString();
        }
      }
    }, { saveUndo: 'caps' });

    return { ok: true, wechatOpenId, personId: personId || null };
  }

  function openSlackSocket(wsUrl) {
    closeSocket('ch-slack');
    const ws = createWebSocket(wsUrl);
    sockets.set('ch-slack', ws);
    attachWsHandlers(
      ws,
      () => {},
      raw => {
        if (stopped) return;
        let msg;
        try {
          msg = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
        } catch {
          return;
        }
        if (msg.envelope_id) {
          try {
            ws.send?.(JSON.stringify({ envelope_id: msg.envelope_id }));
          } catch {
            // ignore closed socket
          }
        }
        if (msg.type === 'events_api' && msg.payload?.event) {
          const ev = msg.payload.event;
          if (ev.bot_id) return;
          const isGroup = ev.channel_type !== 'im';
          handleExternalEvent('ch-slack', {
            senderId: ev.user,
            chatId: ev.channel,
            chatType: isGroup ? 'group' : 'dm',
            text: String(ev.text || '').replace(/<@[A-Z0-9]+>\s*/g, '').trim(),
            mentionsBot: ev.type === 'app_mention' || /<@[A-Z0-9]+>/.test(String(ev.text || '')),
            replyContext: { channel: ev.channel, threadTs: ev.thread_ts || ev.ts }
          }).catch(err => logger?.warn?.('[agent-twin] slack inbound failed:', err?.message));
        }
      },
      () => {
        if (sockets.get('ch-slack') === ws) sockets.delete('ch-slack');
      }
    );
  }

  function openWecomAiBotSocket(wsUrl, { botId, secret }) {
    closeSocket('ch-wecom');
    const ws = createWebSocket(wsUrl);
    sockets.set('ch-wecom', ws);
    attachWsHandlers(
      ws,
      () => {
        try {
          ws.send?.(JSON.stringify({
            cmd: 'aibot_subscribe',
            headers: { req_id: randomUUID() },
            body: { bot_id: botId, secret }
          }));
        } catch {
          // ignore
        }
      },
      raw => {
        if (stopped) return;
        let frame;
        try {
          frame = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
        } catch {
          return;
        }
        if (frame.cmd === 'aibot_msg_callback' && frame.body) {
          const body = frame.body;
          const text = body.text?.content || body.content || '';
          const isGroup = body.chattype === 'group' || Boolean(body.chatid);
          handleExternalEvent('ch-wecom', {
            senderId: body.from?.userid || body.userid || 'wecom-user',
            chatId: body.chatid || body.from?.userid || 'wecom-chat',
            chatType: isGroup ? 'group' : 'dm',
            text: String(text).trim(),
            mentionsBot: !isGroup || Boolean(body.is_at_bot ?? body.mentions_bot ?? true),
            replyContext: { reqId: frame.headers?.req_id, chatId: body.chatid }
          }).catch(err => logger?.warn?.('[agent-twin] wecom inbound failed:', err?.message));
        }
      },
      () => {
        if (sockets.get('ch-wecom') === ws) sockets.delete('ch-wecom');
      }
    );
  }

  function openFeishuSocket(wsUrl) {
    closeSocket('ch-feishu');
    const ws = createWebSocket(wsUrl);
    sockets.set('ch-feishu', ws);
    attachWsHandlers(
      ws,
      () => {},
      raw => {
        if (stopped) return;
        let frame;
        try {
          frame = JSON.parse(typeof raw === 'string' ? raw : raw.toString('utf8'));
        } catch {
          return;
        }
        if (frame.event?.message) {
          const msg = frame.event.message;
          const sender = frame.event.sender?.sender_id?.open_id || frame.event.sender?.sender_id?.user_id || 'feishu-user';
          let parsedText = msg.content || '';
          try {
            const c = JSON.parse(msg.content);
            if (typeof c.text === 'string') parsedText = c.text;
          } catch {
            // plain text content
          }
          const isGroup = msg.chat_type === 'group';
          handleExternalEvent('ch-feishu', {
            senderId: sender,
            chatId: msg.chat_id || sender,
            chatType: isGroup ? 'group' : 'dm',
            text: String(parsedText).replace(/@_user_\d+\s*/g, '').trim(),
            mentionsBot: !isGroup || Boolean((msg.mentions || []).length || frame.event.mentions_bot),
            replyContext: { messageId: msg.message_id, chatId: msg.chat_id, senderId: sender }
          }).catch(err => logger?.warn?.('[agent-twin] feishu inbound failed:', err?.message));
        }
      },
      () => {
        if (sockets.get('ch-feishu') === ws) sockets.delete('ch-feishu');
      }
    );
  }

  /**
   * Configure & validate a channel locally without storing secrets in `state.json`.
   */
  async function configureChannel(channelId, config = {}, secretPayload = {}) {
    const botName = String(config.botName || '工作分身').trim() || '工作分身';
    const appId = String(config.appId || secretPayload.appId || '').trim();
    const appSecret = String(secretPayload.appSecret || config.appSecret || '').trim();

    if (channelId === 'ch-feishu') {
      if (!appId || !appSecret) throw new Error('请填写飞书应用的 App ID 与 App Secret');
      const tokenRes = await fetchImpl('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_secret: appSecret })
      });
      const tokenJson = await readJsonResponse(tokenRes);
      if (!tokenRes.ok || (tokenJson.code !== undefined && tokenJson.code !== 0) || !tokenJson.tenant_access_token) {
        throw new Error(redactSecrets(`飞书凭证校验失败：${tokenJson.msg || tokenRes.status}`, [appId, appSecret]));
      }
      let wsUrl = config.wsEndpoint || '';
      if (!wsUrl) {
        try {
          const wsRes = await fetchImpl('https://open.feishu.cn/callback/ws/endpoint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ AppID: appId, AppSecret: appSecret })
          });
          if (wsRes.ok) {
            const wsJson = await readJsonResponse(wsRes);
            wsUrl = wsJson?.data?.URL || wsJson?.url || '';
          }
        } catch {
          // optional endpoint during offline unit tests
        }
      }
      if (wsUrl) openFeishuSocket(wsUrl);

      await store.updateChannelSecret('ch-feishu', {
        appId,
        appSecret,
        tenantAccessToken: tokenJson.tenant_access_token,
        tokenExpiresAt: Date.now() + ((tokenJson.expire || 7200) * 1000),
        wsUrl
      });
      await store.updateState(st => {
        const ch = st.channels.find(c => c.id === 'ch-feishu');
        if (ch) {
          ch.botName = botName;
          ch.configured = true;
          ch.enabled = true;
          ch.appIdHint = maskSecretHint(appId);
          ch.status = '飞书已握手校验 · 本机 WS 长连接就绪';
        }
      }, { saveUndo: 'caps' });
      return { ok: true, channelId };
    }

    if (channelId === 'ch-wecom') {
      const wecomMode = config.wecomMode === 'corpapp' ? 'corpapp' : 'aibot';
      if (!appId || !appSecret) throw new Error('请填写企业微信 Bot ID/CorpID 与 Secret');

      if (wecomMode === 'aibot') {
        const wsUrl = config.wsEndpoint || 'wss://openws.work.weixin.qq.com';
        openWecomAiBotSocket(wsUrl, { botId: appId, secret: appSecret });
        await store.updateChannelSecret('ch-wecom', {
          wecomMode: 'aibot',
          appId,
          appSecret,
          wsUrl
        });
      } else {
        const agentId = String(config.agentId || secretPayload.agentId || '').trim();
        if (!agentId) throw new Error('企业自建应用模式需要填写 AgentId');
        const tokenRes = await fetchImpl(
          `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${encodeURIComponent(appId)}&corpsecret=${encodeURIComponent(appSecret)}`
        );
        const tokenJson = await readJsonResponse(tokenRes);
        if (!tokenRes.ok || (tokenJson.errcode && tokenJson.errcode !== 0) || !tokenJson.access_token) {
          throw new Error(redactSecrets(`企业微信自建应用校验失败：${tokenJson.errmsg || tokenRes.status}`, [appId, appSecret]));
        }
        await store.updateChannelSecret('ch-wecom', {
          wecomMode: 'corpapp',
          appId,
          agentId,
          appSecret,
          accessToken: tokenJson.access_token
        });
      }

      await store.updateState(st => {
        const ch = st.channels.find(c => c.id === 'ch-wecom');
        if (ch) {
          ch.botName = botName;
          ch.wecomMode = wecomMode;
          ch.configured = true;
          ch.enabled = true;
          ch.appIdHint = maskSecretHint(appId);
          ch.status = wecomMode === 'aibot'
            ? '企微智能机器人本机长连接已建立（免公网备案）'
            : '企微自建应用令牌已校验并保存';
        }
      }, { saveUndo: 'caps' });
      return { ok: true, channelId, wecomMode };
    }

    if (channelId === 'ch-slack') {
      if (!appId || !appSecret) throw new Error('请填写 Slack App-Level Token (xapp-) 与 Bot Token (xoxb-)');
      if (!appId.startsWith('xapp-') || !appSecret.startsWith('xoxb-')) {
        throw new Error('Slack 令牌格式需为 xapp- 与 xoxb-');
      }
      const openRes = await fetchImpl('https://slack.com/api/apps.connections.open', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${appId}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      const openJson = await readJsonResponse(openRes);
      if (!openRes.ok || !openJson.ok || !openJson.url) {
        throw new Error(redactSecrets(`Slack Socket 握手失败：${openJson.error || openRes.status}`, [appId, appSecret]));
      }
      openSlackSocket(openJson.url);
      await store.updateChannelSecret('ch-slack', {
        appId,
        appSecret,
        wsUrl: openJson.url
      });
      await store.updateState(st => {
        const ch = st.channels.find(c => c.id === 'ch-slack');
        if (ch) {
          ch.botName = botName;
          ch.configured = true;
          ch.enabled = true;
          ch.appIdHint = maskSecretHint(appId);
          ch.status = 'Slack Socket Mode 长连接已开启';
        }
      }, { saveUndo: 'caps' });
      return { ok: true, channelId };
    }

    throw new Error('不支持直接凭证配置的通道');
  }

  async function toggleChannel(channelId, enabled) {
    const ch = store.getState().channels.find(c => c.id === channelId);
    if (!ch) throw new Error('未找到目标通道');
    if (enabled && !ch.configured && channelId !== 'ch-web') {
      throw new Error('请先完成该通道的本地连接配置');
    }
    if (!enabled) closeSocket(channelId);
    await store.updateState(st => {
      const target = st.channels.find(c => c.id === channelId);
      if (target) target.enabled = Boolean(enabled);
    }, { saveUndo: 'caps' });
    return { ok: true, channelId, enabled: Boolean(enabled) };
  }

  async function disconnectChannel(channelId) {
    if (channelId === 'ch-web') {
      throw new Error('内置免装试用网页无需断开');
    }
    closeSocket(channelId);
    await store.updateChannelSecret(channelId, null);
    await store.updateState(st => {
      const target = st.channels.find(c => c.id === channelId);
      if (target) {
        target.configured = false;
        target.enabled = false;
        target.appIdHint = '';
        target.status = '已断开连接，本机 0600 凭据库已抹除对应密钥';
      }
    }, { saveUndo: 'caps' });
    return { ok: true, channelId };
  }

  async function sendOutbound(person, text, replyContext = {}) {
    const chId = channelIdFromSelection(person?.channel);
    const cleanText = redactSecrets(sanitizeSurfaceText(text), store.allSecretValues());
    const sec = store.getSecrets()[chId] || {};

    if (chId === 'ch-web') {
      return { delivered: true, channelId: 'ch-web' };
    }
    if (chId === 'ch-wechat') {
      return { delivered: true, channelId: 'ch-wechat' };
    }
    if (chId === 'ch-feishu') {
      const receiveId = replyContext.chatId || replyContext.senderId || person?.externalChatId || person?.externalSenderId;
      if (!sec.tenantAccessToken || !receiveId) return { delivered: false, reason: 'missing_feishu_context' };
      const res = await fetchImpl(
        `https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=${replyContext.chatId || person?.externalChatId ? 'chat_id' : 'open_id'}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sec.tenantAccessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receive_id: receiveId,
            msg_type: 'text',
            content: JSON.stringify({ text: cleanText })
          })
        }
      );
      return { delivered: res.ok, channelId: 'ch-feishu' };
    }
    if (chId === 'ch-wecom') {
      if (sec.wecomMode === 'corpapp') {
        const toUser = replyContext.senderId || person?.externalSenderId || '@all';
        if (!sec.accessToken) return { delivered: false, reason: 'missing_wecom_token' };
        const res = await fetchImpl(
          `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${encodeURIComponent(sec.accessToken)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              touser: toUser,
              msgtype: 'text',
              agentid: Number(sec.agentId) || sec.agentId,
              text: { content: cleanText }
            })
          }
        );
        return { delivered: res.ok, channelId: 'ch-wecom' };
      }
      const ws = sockets.get('ch-wecom');
      if (ws && typeof ws.send === 'function') {
        ws.send(JSON.stringify({
          cmd: 'aibot_respond_msg',
          headers: { req_id: replyContext.reqId || randomUUID() },
          body: {
            chatid: replyContext.chatId || person?.externalChatId || '',
            msgtype: 'text',
            text: { content: cleanText }
          }
        }));
        return { delivered: true, channelId: 'ch-wecom' };
      }
      return { delivered: false, reason: 'wecom_socket_inactive' };
    }
    if (chId === 'ch-slack') {
      const targetChannel = replyContext.channel || person?.externalChatId || person?.channelHandle;
      if (!sec.appSecret || !targetChannel) return { delivered: false, reason: 'missing_slack_context' };
      const res = await fetchImpl('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sec.appSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channel: targetChannel,
          text: cleanText,
          thread_ts: replyContext.threadTs
        })
      });
      const json = await readJsonResponse(res);
      return { delivered: Boolean(res.ok && json.ok), channelId: 'ch-slack' };
    }
    return { delivered: false, reason: 'unsupported_channel' };
  }

  /**
   * Unified inbound event dispatcher enforcing channel enablement, 1-to-1 pairing,
   * group `@bot` filtering, and 15-min owner presence tracking.
   */
  async function handleExternalEvent(channelId, event = {}) {
    if (event.isOwner) {
      engine.recordOwnerPresence(channelId, event.chatId || event.senderId);
      return { action: 'owner_presence_recorded' };
    }

    const state = store.getState();
    const channel = state.channels.find(c => c.id === channelId);
    if (!channel?.enabled) {
      return { action: 'ignored', reason: 'channel_disabled' };
    }

    const senderId = String(event.senderId || '').trim();
    const chatId = String(event.chatId || senderId || '').trim();
    const isGroup = event.chatType === 'group';
    const text = String(event.text || '').trim();

    if (!isGroup && senderId) {
      const pairingTarget = state.people.find(p =>
        channelIdFromSelection(p.channel) === channelId &&
        p.pairCode &&
        !p.externalSenderId &&
        text.toUpperCase().includes(String(p.pairCode).toUpperCase())
      );
      if (pairingTarget) {
        await store.updateState(st => {
          const target = st.people.find(x => x.id === pairingTarget.id);
          if (target) {
            target.externalSenderId = senderId;
            target.externalChatId = chatId;
            target.pairedAt = new Date().toISOString();
          }
        });
        const confirmMsg = `已成功配对 ${pairingTarget.name} 的「${channelSelectionLabel(channelId)}」专属隔离通道，可直接在这里开始提问。`;
        await sendOutbound(
          { ...pairingTarget, externalSenderId: senderId, externalChatId: chatId },
          confirmMsg,
          event.replyContext
        );
        return { action: 'paired', personId: pairingTarget.id, pairCode: pairingTarget.pairCode };
      }
    }

    let person = null;
    if (channelId === 'ch-wechat') {
      person = state.people.find(p =>
        channelIdFromSelection(p.channel) === 'ch-wechat' &&
        p.wechatBound &&
        p.externalSenderId === senderId
      );
      if (!person) return { action: 'ignored', reason: 'unwhitelisted_wechat' };
    } else if (isGroup) {
      person = state.people.find(p =>
        channelIdFromSelection(p.channel) === channelId &&
        p.bindMode === 'group_allow' &&
        (p.channelHandle === chatId || p.channelHandle === event.chatName || p.externalChatId === chatId)
      );
    } else {
      person = state.people.find(p =>
        channelIdFromSelection(p.channel) === channelId &&
        p.externalSenderId === senderId
      );
    }

    if (!person) {
      return { action: 'ignored', reason: 'not_whitelisted' };
    }

    const res = await engine.handleInboundMessage({
      personId: person.id,
      question: text,
      channelId,
      threadKey: chatId,
      isGroup,
      mentionsBot: Boolean(event.mentionsBot)
    });

    if (['replied', 'paused', 'rate_limited'].includes(res.action) && res.reply) {
      res.outbound = await sendOutbound(person, res.reply, event.replyContext);
    }
    return res;
  }

  async function regenerateInvite(personId) {
    const state = store.getState();
    const person = state.people.find(p => p.id === personId);
    if (!person) throw new Error('未找到对应的服务对象');
    const chId = channelIdFromSelection(person.channel);

    if (chId === 'ch-web') {
      const nextToken = `tok-${randomUUID().slice(0, 12)}`;
      await store.updateState(st => {
        const p = st.people.find(x => x.id === personId);
        if (p) p.urlToken = nextToken;
      }, { saveUndo: 'desk' });
      const base = guestServer?.getBaseUrl?.() || '';
      return {
        channelId: 'ch-web',
        urlToken: nextToken,
        guestUrl: base ? `${base}/g/${encodeURIComponent(nextToken)}` : ''
      };
    }

    if (chId === 'ch-wechat') {
      await store.updateState(st => {
        const p = st.people.find(x => x.id === personId);
        if (p) {
          p.wechatBound = false;
          p.externalSenderId = '';
          p.externalChatId = '';
          p.pairedAt = '';
        }
      }, { saveUndo: 'desk' });
      const qr = await startWechatQrSession(personId);
      return { channelId: 'ch-wechat', ...qr };
    }

    const prefix = CHANNEL_PREFIX_MAP[chId] || 'TW';
    const nextCode = store.nextPairCode(prefix);
    await store.updateState(st => {
      const p = st.people.find(x => x.id === personId);
      if (p) {
        p.pairCode = nextCode;
        p.externalSenderId = '';
        p.externalChatId = '';
        p.pairedAt = '';
      }
    }, { saveUndo: 'desk' });
    return { channelId: chId, pairCode: nextCode };
  }

  async function stopAll() {
    stopped = true;
    for (const chId of [...sockets.keys()]) {
      closeSocket(chId);
    }
  }

  return {
    start,
    stopAll,
    ensureWebToken,
    startWechatQrSession,
    confirmWechatBind,
    configureChannel,
    toggleChannel,
    disconnectChannel,
    handleExternalEvent,
    sendOutbound,
    regenerateInvite
  };
}
