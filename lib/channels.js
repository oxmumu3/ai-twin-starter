/**
 * 5 Local-First & Official 0.2.3 Channel Adapters + Inbound/Outbound Router:
 * - `ch-web`: built-in loopback guest portal tokens
 * - `ch-wechat`: real WeChat `iLink` 5-min QR + background pollUpdates + SSRF guard + 1-to-1 lock
 * - `ch-feishu`: DSH 0.2.3 official `lark-cli` (`official_cli`) 1-click stream/send OR direct app credentials
 * - `ch-wecom`: DSH 0.2.3 official `wecom-cli` outbound + WeCom AI Bot WS (`wss://openws.work.weixin.qq.com`) & CorpApp REST
 * - `ch-slack`: Slack Socket Mode (`apps.connections.open` + `envelope_id` ack) + `chat.postMessage`
 */
import { randomUUID } from 'node:crypto';
import {
  CHANNEL_PREFIX_MAP,
  WECHAT_QR_TTL_MS,
  channelIdFromSelection,
  channelSelectionLabel,
  maskSecretHint,
  redactSecrets,
  sanitizeSurfaceText
} from '../shared/schema.js';
import { createWeixinIlinkClient, validateWeixinBaseUrl } from './weixin-ilink.js';
import { parseOwnerMobileCommand } from './owner-notifier.js';
import { isPersonExpired } from './twin-engine.js';

export { validateWeixinBaseUrl };

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
  officialConnectors = null,
  fetchImpl = globalThis.fetch,
  createWebSocket = url => new globalThis.WebSocket(url),
  weixinBaseUrl = 'https://ilinkai.weixin.qq.com',
  allowLoopbackForTest = false,
  ackDelayMs = 3500,
  logger = console
}) {
  const sockets = new Map();
  const seenEventIds = new Set();
  const ilink = createWeixinIlinkClient({ fetchImpl, baseUrl: weixinBaseUrl, allowLoopbackForTest });

  let stopped = false;
  let feishuStreamHandle = null;
  let wechatPollAc = null;
  let wechatQrAc = null;
  let officialProbeCache = { hasConnectorAccounts: false };

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

  async function stopFeishuStream() {
    const handle = feishuStreamHandle;
    feishuStreamHandle = null;
    if (handle) {
      await handle.stop().catch(() => {});
    }
  }

  function stopWechatPoll() {
    if (wechatPollAc) {
      wechatPollAc.abort();
      wechatPollAc = null;
    }
  }

  function stopWechatQrWatch() {
    if (wechatQrAc) {
      wechatQrAc.abort();
      wechatQrAc = null;
    }
  }

  async function probeOfficialConnectors() {
    if (!officialConnectors || typeof officialConnectors.probeAll !== 'function') {
      return officialProbeCache;
    }
    try {
      officialProbeCache = await officialConnectors.probeAll();
      await store.updateState(st => {
        for (const chId of ['ch-feishu', 'ch-wecom']) {
          const ch = st.channels.find(c => c.id === chId);
          const probe = officialProbeCache[chId];
          if (ch && probe) {
            ch.officialConnector = {
              installed: Boolean(probe.installed),
              connected: Boolean(probe.connected),
              packageName: probe.packageName || '',
              userName: probe.userName || '',
              botId: probe.botId || '',
              statusText: probe.statusText || ''
            };
          }
        }
      });
    } catch (err) {
      logger?.warn?.('[agent-twin] official connector probe failed:', err?.message);
    }
    return officialProbeCache;
  }

  function startWechatPollLoop() {
    stopWechatPoll();
    const sec = store.getSecrets()['ch-wechat'] || {};
    const ch = store.getState().channels.find(c => c.id === 'ch-wechat');
    if (!ch?.enabled || !sec.botToken || stopped) return;

    const ac = new AbortController();
    wechatPollAc = ac;
    const baseUrl = sec.baseUrl || weixinBaseUrl;

    void (async () => {
      let cursor = sec.cursor || '';
      while (!stopped && !ac.signal.aborted) {
        const latestCh = store.getState().channels.find(c => c.id === 'ch-wechat');
        const latestSec = store.getSecrets()['ch-wechat'] || {};
        if (!latestCh?.enabled || !latestSec.botToken) break;
        try {
          const res = await ilink.pollUpdates({
            botToken: latestSec.botToken,
            baseUrl: latestSec.baseUrl || baseUrl,
            cursor,
            signal: ac.signal
          });
          if (res.cursor && res.cursor !== cursor) {
            cursor = res.cursor;
            await store.updateChannelSecret('ch-wechat', { cursor });
          }
          for (const msg of res.messages || []) {
            if (!msg.text || !msg.senderId) continue;
            if (msg.senderId === latestSec.botId || msg.senderId === latestSec.accountId) continue;
            await handleExternalEvent('ch-wechat', {
              eventId: msg.messageId ? `wx:${msg.messageId}` : '',
              senderId: msg.senderId,
              chatId: msg.groupId || msg.senderId,
              chatType: msg.chatType,
              text: msg.text,
              mentionsBot: true,
              replyContext: {
                peerId: msg.senderId,
                contextToken: msg.contextToken
              }
            }).catch(err => logger?.warn?.('[agent-twin] wechat inbound failed:', err?.message));
          }
        } catch (err) {
          if (ac.signal.aborted || stopped) break;
          logger?.warn?.('[agent-twin] wechat poll retry:', err?.message);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    })();
  }

  function watchWechatQrScan({ qrcode, personId }) {
    stopWechatQrWatch();
    const ac = new AbortController();
    wechatQrAc = ac;
    const deadline = Date.now() + WECHAT_QR_TTL_MS;

    void (async () => {
      while (!stopped && !ac.signal.aborted && Date.now() < deadline) {
        try {
          const status = await ilink.checkQr({ qrcode, signal: ac.signal });
          if (ac.signal.aborted || stopped) break;
          if (status.status === 'scaned') {
            await store.updateState(st => {
              const ch = st.channels.find(c => c.id === 'ch-wechat');
              if (ch) ch.status = '对方已扫码，等待手机端点击确认授权…';
            });
          } else if (status.status === 'confirmed') {
            await confirmWechatBind({
              personId,
              wechatOpenId: status.peerId,
              qrToken: qrcode,
              botToken: status.botToken,
              baseUrl: status.baseUrl,
              botId: status.botId
            });
            break;
          } else if (status.status === 'expired') {
            await store.updateState(st => {
              const ch = st.channels.find(c => c.id === 'ch-wechat');
              if (ch) ch.status = '微信二维码已过期，请刷新二维码重试';
            });
            break;
          }
        } catch (err) {
          if (ac.signal.aborted || stopped) break;
          await new Promise(r => setTimeout(r, 2500));
        }
      }
    })();
  }

  async function startOfficialFeishuLoop() {
    await stopFeishuStream();
    if (!officialConnectors || stopped) return;
    const ch = store.getState().channels.find(c => c.id === 'ch-feishu');
    if (!ch?.enabled || ch.connectionMode !== 'official_cli') return;
    const probe = await officialConnectors.probeFeishu();
    if (!probe.installed || !probe.connected) return;

    feishuStreamHandle = officialConnectors.startFeishuStream({
      ownerOpenId: probe.openId || '',
      onOwnerActivity: chatId => {
        engine.recordOwnerPresence('ch-feishu', chatId);
      },
      onMessage: ev => {
        handleExternalEvent('ch-feishu', ev).catch(err =>
          logger?.warn?.('[agent-twin] official feishu inbound failed:', err?.message)
        );
      },
      onStatus: async ({ ready }) => {
        await store.updateState(st => {
          const target = st.channels.find(c => c.id === 'ch-feishu');
          if (target && target.connectionMode === 'official_cli') {
            target.status = ready
              ? `已通过 DSH 官方飞书插件长连接值班中${probe.userName ? `（${probe.userName}）` : ''}`
              : '官方飞书事件流重连中…';
          }
        }).catch(() => {});
      }
    });
  }

  async function reconnectEnabledChannels() {
    const st = store.getState();
    const secrets = store.getSecrets();
    for (const ch of st.channels || []) {
      if (!ch.enabled || !ch.configured || stopped) continue;
      const sec = secrets[ch.id] || {};
      if (ch.id === 'ch-wechat' && sec.botToken) {
        startWechatPollLoop();
      } else if (ch.id === 'ch-feishu') {
        if (ch.connectionMode === 'official_cli') {
          await startOfficialFeishuLoop().catch(err =>
            logger?.warn?.('[agent-twin] reconnect official feishu failed:', err?.message)
          );
        } else if (sec.wsUrl) {
          openFeishuSocket(sec.wsUrl);
        }
      } else if (ch.id === 'ch-wecom' && sec.wecomMode !== 'corpapp' && sec.wsUrl && sec.appId && sec.appSecret) {
        openWecomAiBotSocket(sec.wsUrl, { botId: sec.appId, secret: sec.appSecret });
      } else if (ch.id === 'ch-slack' && sec.appId) {
        try {
          const openRes = await fetchImpl('https://slack.com/api/apps.connections.open', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${sec.appId}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          const openJson = await readJsonResponse(openRes);
          if (openRes.ok && openJson.ok && openJson.url) {
            openSlackSocket(openJson.url);
          }
        } catch {
          // keep stored config on offline restart
        }
      }
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
    await probeOfficialConnectors();
    await reconnectEnabledChannels();
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

  async function startWechatQrSession(personId = null, { autoWatch = true } = {}) {
    const qr = await ilink.getQr();
    const expiresAt = Date.now() + WECHAT_QR_TTL_MS;

    await store.updateChannelSecret('ch-wechat', {
      qrToken: qr.qrcode,
      qrUrl: qr.qrUrl,
      qrSvg: qr.qrSvg,
      expiresAt,
      pendingPersonId: personId || ''
    });

    await store.updateState(st => {
      const ch = st.channels.find(c => c.id === 'ch-wechat');
      if (ch) {
        ch.status = '5 分钟专属扫码二维码已生成 · 请对方用微信扫一扫';
      }
      if (personId) {
        const p = st.people.find(x => x.id === personId);
        if (p) {
          p.qrToken = qr.qrcode;
          p.qrUrl = qr.qrUrl;
          p.qrSvg = qr.qrSvg;
          p.qrExpiresAt = expiresAt;
        }
      }
    });

    if (autoWatch) {
      watchWechatQrScan({ qrcode: qr.qrcode, personId });
    }

    return {
      qrToken: qr.qrcode,
      qrUrl: qr.qrUrl,
      qrSvg: qr.qrSvg,
      expiresAt,
      ttlMs: WECHAT_QR_TTL_MS
    };
  }

  async function confirmWechatBind({ personId, wechatOpenId, qrToken, botToken = '', baseUrl = '', botId = '' }) {
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
      boundOpenId: wechatOpenId,
      ...(botToken ? { botToken } : {}),
      ...(baseUrl ? { baseUrl } : {}),
      ...(botId ? { botId } : {})
    });

    await store.updateState(st => {
      const ch = st.channels.find(c => c.id === 'ch-wechat');
      if (ch) {
        ch.configured = true;
        ch.enabled = true;
        ch.status = botToken
          ? '个人微信 1 对 1 已真实扫码锁定 · 陌生人零响应'
          : '个人微信 1 对 1 已扫码锁定 · 陌生人零响应';
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

    if (botToken) {
      startWechatPollLoop();
    }

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
            eventId: ev.client_msg_id || ev.event_ts || ev.ts ? `sl:${ev.channel}:${ev.ts || ev.event_ts}` : '',
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
            eventId: body.msgid || frame.headers?.req_id ? `wc:${body.msgid || frame.headers.req_id}` : '',
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
            eventId: msg.message_id ? `fs:${msg.message_id}` : '',
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
   * One-click reuse of DSH 0.2.3 official connector accounts (`@deepseek-ai/dsh-feishu` / `@deepseek-ai/dsh-wecom`).
   */
  async function connectOfficialChannel(channelId, { botName = '工作分身', triggerAuth = false } = {}) {
    if (!['ch-feishu', 'ch-wecom'].includes(channelId)) {
      throw new Error('仅飞书与企业微信支持 DSH 官方连接器复用');
    }
    if (!officialConnectors) {
      throw new Error('当前运行时未启用官方连接器探测服务');
    }

    const probe = channelId === 'ch-feishu'
      ? await officialConnectors.probeFeishu()
      : await officialConnectors.probeWecom();

    if (!probe.installed) {
      throw new Error(`尚未安装官方插件 ${probe.packageName}；请在「插件 -> 添加插件」安装并授权后再一键接入`);
    }

    if (!probe.connected) {
      if (triggerAuth) {
        const authRes = await officialConnectors.triggerOfficialAuth(channelId);
        if (authRes.triggered) {
          return { ok: false, authStarted: true, ...authRes, probe };
        }
      }
      throw new Error(probe.statusText || `请先在插件页完成 ${probe.packageName} 的账号授权`);
    }

    await store.updateState(st => {
      const ch = st.channels.find(c => c.id === channelId);
      if (ch) {
        ch.botName = String(botName || '工作分身').trim() || '工作分身';
        ch.connectionMode = 'official_cli';
        ch.configured = true;
        ch.enabled = true;
        ch.appIdHint = probe.appId ? maskSecretHint(probe.appId) : (probe.botId ? maskSecretHint(probe.botId) : '官方插件托管');
        ch.officialConnector = {
          installed: true,
          connected: true,
          packageName: probe.packageName,
          userName: probe.userName || '',
          botId: probe.botId || '',
          statusText: probe.statusText
        };
        ch.status = channelId === 'ch-feishu'
          ? `已复用 DSH 官方飞书插件（免填密钥 · 实时事件流就绪${probe.userName ? ` · ${probe.userName}` : ''}）`
          : '已复用 DSH 官方企微插件（免填密钥出站推送就绪；实时问答需配合智能机器人长连接）';
      }
    }, { saveUndo: 'caps' });

    if (channelId === 'ch-feishu') {
      await startOfficialFeishuLoop();
    }

    return { ok: true, channelId, connectionMode: 'official_cli', probe };
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
      await stopFeishuStream();
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
          ch.connectionMode = 'direct_app';
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
          ch.connectionMode = 'direct_app';
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
    if (!enabled) {
      closeSocket(channelId);
      if (channelId === 'ch-feishu') await stopFeishuStream();
      if (channelId === 'ch-wechat') stopWechatPoll();
    }
    await store.updateState(st => {
      const target = st.channels.find(c => c.id === channelId);
      if (target) target.enabled = Boolean(enabled);
    }, { saveUndo: 'caps' });
    if (enabled) {
      await reconnectEnabledChannels();
    }
    return { ok: true, channelId, enabled: Boolean(enabled) };
  }

  async function disconnectChannel(channelId) {
    if (channelId === 'ch-web') {
      throw new Error('内置免装试用网页无需断开');
    }
    closeSocket(channelId);
    if (channelId === 'ch-feishu') await stopFeishuStream();
    if (channelId === 'ch-wechat') {
      stopWechatPoll();
      stopWechatQrWatch();
    }
    await store.updateChannelSecret(channelId, null);
    await store.updateState(st => {
      const target = st.channels.find(c => c.id === channelId);
      if (target) {
        target.configured = false;
        target.enabled = false;
        target.connectionMode = '';
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
    const chObj = store.getState().channels.find(c => c.id === chId);

    if (chId === 'ch-web') {
      return { delivered: true, channelId: 'ch-web' };
    }
    if (chId === 'ch-wechat') {
      const peerId = replyContext.peerId || person?.externalSenderId || person?.externalChatId;
      if (sec.botToken && peerId) {
        return ilink.sendText({
          botToken: sec.botToken,
          baseUrl: sec.baseUrl || weixinBaseUrl,
          peerId,
          contextToken: replyContext.contextToken || person?.wechatContextToken || '',
          text: cleanText
        });
      }
      return { delivered: false, channelId: 'ch-wechat', reason: 'missing_wechat_token' };
    }
    if (chId === 'ch-feishu') {
      if (chObj?.connectionMode === 'official_cli' && officialConnectors) {
        return officialConnectors.sendFeishuMessage({ replyContext, person, text: cleanText });
      }
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
      if ((chObj?.connectionMode === 'official_cli' || officialProbeCache?.['ch-wecom']?.connected) && officialConnectors) {
        return officialConnectors.sendWecomMessage({ replyContext, person, text: cleanText });
      }
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
   * Unified inbound event dispatcher enforcing dedup, channel enablement, 1-to-1 pairing,
   * group `@bot` filtering, and 15-min owner presence tracking.
   */
  async function handleExternalEvent(channelId, event = {}) {
    if (event.isOwner) {
      const isDm = Boolean(event.isOwnerDm) || event.chatType === 'dm';
      const cmd = isDm && event.text ? parseOwnerMobileCommand(event.text) : null;
      if (cmd && typeof engine.resolveRemoteOwnerCommand === 'function') {
        const ownerEvtId = String(event.eventId || event.messageId || '').trim();
        const ownerDedupKey = ownerEvtId ? `${channelId}:${ownerEvtId}` : '';
        if (ownerDedupKey && (seenEventIds.has(ownerDedupKey) || store.hasProcessedEvent?.(ownerDedupKey))) {
          return { action: 'ignored', reason: 'duplicate_event' };
        }
        if (ownerDedupKey) {
          seenEventIds.add(ownerDedupKey);
          if (seenEventIds.size > 500) seenEventIds.delete(seenEventIds.values().next().value);
          await store.recordProcessedEvent?.(ownerDedupKey);
        }
        const replyMsg = await engine.resolveRemoteOwnerCommand(cmd);
        if (channelId === 'ch-feishu' && officialConnectors?.sendFeishuMessage) {
          await officialConnectors.sendFeishuMessage({
            replyContext: event.replyContext || { openId: event.senderId, chatId: event.chatId },
            text: replyMsg
          }).catch(err => logger?.warn?.('[agent-twin] owner dm confirm failed:', err?.message));
        }
        return { action: 'owner_command_handled', command: cmd.kind, reply: replyMsg };
      }
      engine.recordOwnerPresence(channelId, event.chatId || event.senderId);
      return { action: 'owner_presence_recorded' };
    }

    const eventId = String(event.eventId || event.messageId || '').trim();
    const dedupKey = eventId ? `${channelId}:${eventId}` : '';
    if (dedupKey && (seenEventIds.has(dedupKey) || store.hasProcessedEvent?.(dedupKey) || store.hasProcessedEvent?.(eventId))) {
      return { action: 'ignored', reason: 'duplicate_event' };
    }
    if (dedupKey) {
      seenEventIds.add(dedupKey);
      if (seenEventIds.size > 500) {
        const oldest = seenEventIds.values().next().value;
        seenEventIds.delete(oldest);
      }
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

    if (dedupKey) {
      await store.recordProcessedEvent?.(dedupKey);
    }

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
      if (event.replyContext?.contextToken) {
        await store.updateState(st => {
          const target = st.people.find(x => x.id === person.id);
          if (target) target.wechatContextToken = event.replyContext.contextToken;
        });
      }
    } else if (isGroup) {
      person = state.people.find(p =>
        channelIdFromSelection(p.channel) === channelId &&
        p.bindMode === 'group_allow' &&
        (p.channelHandle === chatId || p.channelHandle === event.chatName || p.externalChatId === chatId)
      );
      if (person && chatId && !person.externalChatId) {
        await store.updateState(st => {
          const target = st.people.find(x => x.id === person.id);
          if (target) target.externalChatId = chatId;
        });
      }
    } else {
      person = state.people.find(p =>
        channelIdFromSelection(p.channel) === channelId &&
        p.externalSenderId === senderId
      );
    }

    if (!person) {
      return { action: 'ignored', reason: 'not_whitelisted' };
    }

    const latestState = store.getState();
    const shouldArmAck = ackDelayMs > 0
      && channelId !== 'ch-web'
      && latestState.ackSlowTurns !== false
      && latestState.dutyMode !== 'off'
      && Boolean(person.enabled)
      && !isPersonExpired(person)
      && (!isGroup || Boolean(event.mentionsBot))
      && !(chatId && engine.isOwnerPresentRecently?.(channelId, chatId));

    let ackSent = false;
    let ackTimer = null;
    if (shouldArmAck) {
      ackTimer = setTimeout(() => {
        ackSent = true;
        void sendOutbound(
          person,
          '收到，正在只读核对授权资料与数据，稍候几秒…',
          event.replyContext
        ).catch(err => logger?.warn?.('[agent-twin] slow-turn ack send failed:', err?.message));
      }, ackDelayMs);
      ackTimer.unref?.();
    }

    let res;
    try {
      res = await engine.handleInboundMessage({
        personId: person.id,
        question: text,
        channelId,
        threadKey: chatId,
        isGroup,
        mentionsBot: Boolean(event.mentionsBot),
        replyContext: event.replyContext || {}
      });
    } finally {
      if (ackTimer) clearTimeout(ackTimer);
    }

    if (ackSent) {
      res.ackSent = true;
    }

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
    stopWechatPoll();
    stopWechatQrWatch();
    await stopFeishuStream();
    for (const chId of [...sockets.keys()]) {
      closeSocket(chId);
    }
  }

  return {
    start,
    stopAll,
    probeOfficialConnectors,
    connectOfficialChannel,
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
