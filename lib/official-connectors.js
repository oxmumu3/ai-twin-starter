/**
 * DSH 0.2.3-alpha.2+ Official Office Connectors Bridge (`@deepseek-ai/dsh-feishu` & `@deepseek-ai/dsh-wecom`).
 * - Discovers official managed CLIs (`lark-cli` & `wecom-cli`) and optional `ctx.connectorAccounts` without
 *   ever reading or storing raw vendor OAuth secrets in plugin storage.
 * - Runs bounded `lark-cli event consume im.message.receive_v1 --as bot` NDJSON stream with auto-reconnect
 *   and owner presence detection; dispatches via `lark-cli im +messages-reply / +messages-send --as bot`.
 * - Dispatches WeCom outbound notifications via `wecom-cli message aibot send` while leaving real-time
 *   WeCom inbound to the AI Bot WebSocket adapter (since `@wecom/cli@1.3.4` has no inbound event stream).
 */
import { execFile, spawn } from 'node:child_process';
import { accessSync, constants, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const OFFICIAL_PACKAGES = Object.freeze({
  'ch-feishu': '@deepseek-ai/dsh-feishu',
  'ch-wecom': '@deepseek-ai/dsh-wecom'
});

function isExecutable(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveProfileDir(ctx, paths) {
  if (typeof ctx?.baseUrl === 'string' && ctx.baseUrl.startsWith('file:')) {
    try {
      return resolve(fileURLToPath(ctx.baseUrl));
    } catch {
      // fallback below
    }
  }
  if (paths?.profileDir) return resolve(paths.profileDir);
  if (paths?.dshHome) return join(paths.dshHome, 'profiles', 'desktop');
  return '';
}

function resolveManagedBin({ profileDir, wrapperPkg, targetPkg, binName, envOverride, explicitOverride }) {
  if (explicitOverride && isExecutable(explicitOverride)) return explicitOverride;
  if (envOverride && isExecutable(envOverride)) return envOverride;
  if (!profileDir) return '';

  const candidates = [];
  try {
    const profilePkgJson = join(profileDir, 'package.json');
    if (existsSync(profilePkgJson)) {
      const req = createRequire(profilePkgJson);
      const wrapperDir = dirname(req.resolve(`${wrapperPkg}/package.json`));
      const wrapperReq = createRequire(join(wrapperDir, 'package.json'));
      const targetDir = dirname(wrapperReq.resolve(`${targetPkg}/package.json`));
      candidates.push(join(targetDir, 'bin', binName));
    }
  } catch {
    // ignore require resolution misses
  }

  candidates.push(
    join(profileDir, 'node_modules', wrapperPkg, 'node_modules', targetPkg, 'bin', binName),
    join(profileDir, 'node_modules', targetPkg, 'bin', binName)
  );

  const pathEnv = process.env.PATH || '';
  const sep = process.platform === 'win32' ? ';' : ':';
  for (const dir of pathEnv.split(sep).filter(Boolean)) {
    candidates.push(join(dir, binName));
  }

  return candidates.find(isExecutable) || '';
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(String(raw || ''));
  } catch {
    return null;
  }
}

function extractFeishuIncoming(frame) {
  if (!frame || typeof frame !== 'object') return null;
  const ev = frame.event || frame;
  const msg = ev?.message;
  if (!msg || typeof msg !== 'object') return null;

  const senderObj = ev?.sender || frame.sender || {};
  const senderType = String(senderObj.sender_type || '').toLowerCase();
  if (senderType === 'app' || senderType === 'bot') return null;

  const senderId = String(
    senderObj.sender_id?.open_id ||
    senderObj.sender_id?.user_id ||
    senderObj.sender_id?.union_id ||
    ''
  ).trim();
  const chatId = String(msg.chat_id || senderId || '').trim();
  const messageId = String(msg.message_id || frame.header?.event_id || '').trim();
  const isGroup = msg.chat_type === 'group';

  let text = String(msg.content || '');
  const parsed = parseJsonSafe(text);
  if (parsed && typeof parsed.text === 'string') {
    text = parsed.text;
  }
  text = text.replace(/@_user_\d+\s*/g, '').trim();

  const mentionsBot = !isGroup || Boolean((Array.isArray(msg.mentions) && msg.mentions.length > 0) || ev.mentions_bot);
  return {
    eventId: messageId || `${chatId}:${Date.now()}`,
    messageId,
    senderId,
    chatId,
    chatType: isGroup ? 'group' : 'dm',
    text,
    mentionsBot,
    replyContext: {
      messageId,
      chatId,
      openId: senderId
    }
  };
}

/**
 * Create the bridge for DSH 0.2.3 official Feishu & WeCom connector packages.
 */
export function createOfficialConnectorsBridge({
  ctx = null,
  paths = {},
  execFileImpl = execFileAsync,
  spawnImpl = spawn,
  larkCliPath = '',
  wecomCliPath = '',
  logger = console
} = {}) {
  const profileDir = resolveProfileDir(ctx, paths);
  const feishuBinName = process.platform === 'win32' ? 'lark-cli.exe' : 'lark-cli';
  const wecomBinName = process.platform === 'win32' ? 'wecom-cli.exe' : 'wecom-cli';
  const wecomPlatformPkg = `@wecom/cli-${process.platform}-${process.arch}`;

  function getConnectorAccountsService() {
    try {
      return ctx?.get?.('connectorAccounts', false) ?? ctx?.root?.get?.('connectorAccounts', false) ?? null;
    } catch {
      return null;
    }
  }

  function resolveFeishuExecutable() {
    return resolveManagedBin({
      profileDir,
      wrapperPkg: OFFICIAL_PACKAGES['ch-feishu'],
      targetPkg: '@larksuite/cli',
      binName: feishuBinName,
      envOverride: process.env.DSH_TWIN_LARK_CLI,
      explicitOverride: larkCliPath
    });
  }

  function resolveWecomExecutable() {
    return resolveManagedBin({
      profileDir,
      wrapperPkg: OFFICIAL_PACKAGES['ch-wecom'],
      targetPkg: wecomPlatformPkg,
      binName: wecomBinName,
      envOverride: process.env.DSH_TWIN_WECOM_CLI,
      explicitOverride: wecomCliPath
    });
  }

  async function probeFeishu() {
    const executable = resolveFeishuExecutable();
    if (!executable) {
      return {
        installed: false,
        connected: false,
        packageName: OFFICIAL_PACKAGES['ch-feishu'],
        appId: '',
        userName: '',
        openId: '',
        executable: '',
        statusText: '未安装官方飞书插件（@deepseek-ai/dsh-feishu）'
      };
    }

    try {
      const { stdout, stderr } = await execFileImpl(executable, ['auth', 'status', '--verify', '--json'], {
        timeout: 10_000,
        encoding: 'utf8'
      });
      const parsed = parseJsonSafe(stdout) || parseJsonSafe(stderr) || {};
      const user = parsed?.identities?.user || {};
      const appId = String(parsed?.appId || '');
      const connected = Boolean(appId && (user.available && user.verified !== false || parsed?.identities?.bot?.available));
      return {
        installed: true,
        connected,
        packageName: OFFICIAL_PACKAGES['ch-feishu'],
        appId,
        userName: String(user.userName || ''),
        openId: String(user.openId || ''),
        executable,
        statusText: connected
          ? `已复用 DSH 官方飞书连接器${user.userName ? `（${user.userName}）` : ''}`
          : appId
            ? '已关联飞书应用，待在插件页完成飞书扫码授权'
            : '官方飞书插件已安装，待在插件页点击连接飞书'
      };
    } catch (err) {
      const errJson = parseJsonSafe(err?.stderr) || parseJsonSafe(err?.stdout) || {};
      const subtype = errJson?.error?.subtype || '';
      return {
        installed: true,
        connected: false,
        packageName: OFFICIAL_PACKAGES['ch-feishu'],
        appId: '',
        userName: '',
        openId: '',
        executable,
        statusText: subtype === 'not_configured'
          ? '官方飞书插件已安装，待在插件页一键关联飞书应用'
          : '官方飞书插件就绪，待完成账号授权校验'
      };
    }
  }

  async function probeWecom() {
    const executable = resolveWecomExecutable();
    if (!executable) {
      return {
        installed: false,
        connected: false,
        packageName: OFFICIAL_PACKAGES['ch-wecom'],
        botId: '',
        ownerUserId: '',
        executable: '',
        statusText: '未安装官方企微插件（@deepseek-ai/dsh-wecom）'
      };
    }

    try {
      const { stdout } = await execFileImpl(executable, ['auth', 'show'], {
        timeout: 10_000,
        encoding: 'utf8'
      });
      const stateMatch = String(stdout || '').match(/^Status:[ \t]*(authorized|unauthorized)[ \t]*$/mu);
      const botMatch = String(stdout || '').match(/^Bot ID:[ \t]*(\S+)[ \t]*$/mu);
      const authorized = stateMatch?.[1] === 'authorized';
      const botId = String(botMatch?.[1] || '');
      let ownerUserId = '';
      if (authorized) {
        try {
          const who = await execFileImpl(executable, ['identity', 'whoami', '--json'], {
            timeout: 8_000,
            encoding: 'utf8'
          });
          const whoJson = parseJsonSafe(who?.stdout);
          ownerUserId = String(whoJson?.userid || whoJson?.user_id || '');
        } catch {
          // optional identity lookup
        }
      }
      return {
        installed: true,
        connected: authorized,
        packageName: OFFICIAL_PACKAGES['ch-wecom'],
        botId,
        ownerUserId,
        executable,
        statusText: authorized
          ? `已复用 DSH 官方企微连接器（出站就绪${botId ? ` · ${botId.slice(0, 8)}` : ''}）`
          : '官方企微插件已安装，待在插件页扫码绑定智能机器人'
      };
    } catch {
      return {
        installed: true,
        connected: false,
        packageName: OFFICIAL_PACKAGES['ch-wecom'],
        botId: '',
        ownerUserId: '',
        executable,
        statusText: '官方企微插件已安装，待在插件页扫码绑定'
      };
    }
  }

  async function probeAll() {
    const [feishu, wecom] = await Promise.all([probeFeishu(), probeWecom()]);
    const hasConnectorAccounts = Boolean(getConnectorAccountsService());
    return {
      hasConnectorAccounts,
      'ch-feishu': feishu,
      'ch-wecom': wecom
    };
  }

  async function triggerOfficialAuth(channelId) {
    const svc = getConnectorAccountsService();
    const pkg = OFFICIAL_PACKAGES[channelId];
    if (!svc || typeof svc.start !== 'function' || !pkg) {
      return { triggered: false, reason: 'connector_accounts_unavailable' };
    }
    if (channelId === 'ch-feishu') {
      const st = await probeFeishu();
      const op = st.appId ? 'sign-in' : 'link-app';
      const opId = await svc.start(pkg, op);
      return { triggered: true, packageName: pkg, operation: op, operationId: opId };
    }
    if (channelId === 'ch-wecom') {
      const opId = await svc.start(pkg, 'connect');
      return { triggered: true, packageName: pkg, operation: 'connect', operationId: opId };
    }
    return { triggered: false, reason: 'unsupported_channel' };
  }

  function startFeishuStream({ ownerOpenId = '', onMessage, onOwnerActivity, onStatus }) {
    const executable = resolveFeishuExecutable();
    if (!executable) {
      throw new Error('未找到官方飞书 CLI（@deepseek-ai/dsh-feishu），无法启动事件流');
    }

    let stopped = false;
    let currentChild = null;
    let retryTimer = null;
    let attempt = 0;

    function launch() {
      if (stopped) return;
      const child = spawnImpl(executable, ['event', 'consume', 'im.message.receive_v1', '--as', 'bot'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      currentChild = child;

      const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
      lines.on('line', line => {
        if (stopped) return;
        const raw = line.trim();
        if (!raw.startsWith('{')) return;
        const parsed = parseJsonSafe(raw);
        if (!parsed) return;
        const event = extractFeishuIncoming(parsed);
        if (!event || !event.text) return;
        if (ownerOpenId && event.senderId === ownerOpenId) {
          if (event.chatType === 'group') {
            onOwnerActivity?.(event.chatId);
          } else {
            onMessage?.({ ...event, isOwner: true, isOwnerDm: true });
          }
          return;
        }
        onMessage?.(event);
      });

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', chunk => {
        if (chunk.includes('[event] ready')) {
          attempt = 0;
          onStatus?.({ ready: true });
        }
      });

      child.on('error', err => {
        logger?.warn?.('[agent-twin] lark-cli stream error:', err?.message);
      });

      child.once('close', code => {
        if (currentChild === child) currentChild = null;
        if (stopped) return;
        onStatus?.({ ready: false, exitCode: code });
        const delayMs = Math.min(30_000, 2000 * (2 ** Math.min(attempt, 4)));
        attempt += 1;
        retryTimer = setTimeout(launch, delayMs);
        retryTimer.unref?.();
      });
    }

    launch();

    return {
      async stop() {
        stopped = true;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        const child = currentChild;
        currentChild = null;
        if (!child) return;
        await new Promise(resolveStop => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            resolveStop();
          };
          const killTimer = setTimeout(() => {
            try { child.kill('SIGKILL'); } catch {}
            finish();
          }, 1500);
          killTimer.unref?.();
          child.once('close', () => {
            clearTimeout(killTimer);
            finish();
          });
          try { child.stdin?.end(); } catch {}
          try { child.kill('SIGTERM'); } catch {
            clearTimeout(killTimer);
            finish();
          }
        });
      }
    };
  }

  async function sendFeishuMessage({ replyContext = {}, person = null, text }) {
    const executable = resolveFeishuExecutable();
    if (!executable) {
      return { delivered: false, reason: 'missing_feishu_cli' };
    }
    const clean = String(text || '').trim();
    if (!clean) return { delivered: false, reason: 'empty_text' };

    let args;
    if (replyContext.messageId) {
      args = ['im', '+messages-reply', '--message-id', String(replyContext.messageId), '--markdown', clean, '--as', 'bot', '--json'];
    } else if (replyContext.chatId || person?.externalChatId) {
      args = ['im', '+messages-send', '--chat-id', String(replyContext.chatId || person.externalChatId), '--markdown', clean, '--as', 'bot', '--json'];
    } else if (replyContext.openId || person?.externalSenderId) {
      args = ['im', '+messages-send', '--user-id', String(replyContext.openId || person.externalSenderId), '--markdown', clean, '--as', 'bot', '--json'];
    } else {
      return { delivered: false, reason: 'missing_feishu_target' };
    }

    await execFileImpl(executable, args, { timeout: 15_000, encoding: 'utf8' });
    return { delivered: true, channelId: 'ch-feishu', transport: 'official_cli' };
  }

  async function sendWecomMessage({ replyContext = {}, person = null, text }) {
    const executable = resolveWecomExecutable();
    if (!executable) {
      return { delivered: false, reason: 'missing_wecom_cli' };
    }
    const clean = String(text || '').trim();
    if (!clean) return { delivered: false, reason: 'empty_text' };

    let chatId = String(replyContext.chatId || person?.externalChatId || '').trim();
    if (!chatId) {
      try {
        const listRes = await execFileImpl(executable, ['message', 'aibot', 'sessions', 'list', '--json'], {
          timeout: 10_000,
          encoding: 'utf8'
        });
        const listJson = parseJsonSafe(listRes?.stdout);
        const sessions = Array.isArray(listJson?.sessions) ? listJson.sessions : [];
        const needle = String(person?.channelHandle || person?.name || '').trim();
        const hit = needle ? sessions.find(s => s.chat_name === needle || s.chat_id === needle) : null;
        if (hit?.chat_id) chatId = String(hit.chat_id);
      } catch {
        // fallback below
      }
    }
    if (!chatId) {
      return { delivered: false, reason: 'missing_wecom_chat_id' };
    }

    const payload = JSON.stringify({
      chat_id: chatId,
      msg_type: 'markdown',
      markdown: { content: clean }
    });
    await execFileImpl(executable, ['message', 'aibot', 'send', '--json', payload], {
      timeout: 15_000,
      encoding: 'utf8'
    });
    return { delivered: true, channelId: 'ch-wecom', transport: 'official_cli' };
  }

  return {
    probeFeishu,
    probeWecom,
    probeAll,
    triggerOfficialAuth,
    startFeishuStream,
    sendFeishuMessage,
    sendWecomMessage,
    resolveFeishuExecutable,
    resolveWecomExecutable
  };
}
