/**
 * Shared schema, constants, curated presets, and surface sanitizers
 * for `@oxmumu3/dsh-agent-twin` (v0.5.0).
 */

export const PLUGIN_ID = '@oxmumu3/dsh-agent-twin';
export const DEFAULT_DAILY_TURN_CAP = 30;
export const DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT = 5;
export const DEFAULT_PUBLIC_GLOBAL_DAILY_LIMIT = 200;
export const PRESENCE_YIELD_MS = 15 * 60 * 1000;
export const WECHAT_QR_TTL_MS = 5 * 60 * 1000;

export const DUTY_MODES = Object.freeze(['shadow', 'live', 'off']);
export const PERSON_MODES = Object.freeze(['direct', 'confirm', 'summary']);
export const RULE_KINDS = Object.freeze(['规矩', '红线']);

export const TWIN_PERSONA_PRESETS = Object.freeze([
  {
    id: 'advisor',
    title: '口径与归因顾问',
    defaultName: '工作分身',
    intro: '依据项目文档与复盘口径提供只读解答与波动归因，涉敏明细转负责人确认',
    recommendedDuty: 'shadow',
    defaultMode: 'confirm',
    brief: '先用一句话复述对方问题，前 3 行直接给结论；报异常前先剔除测试单与周期脉冲；拿不准的数字标成「待确认」，绝不瞎猜。'
  },
  {
    id: 'trial',
    title: '合作方试跑分身',
    defaultName: '项目试跑分身',
    intro: '供外部合作方试跑体验授权范围内的口径说明与指标分析，回复经本人把关',
    recommendedDuty: 'shadow',
    defaultMode: 'summary',
    brief: '对外保持专业克制，只输出汇总比例与同比趋势，任何单客明细或排期报价承诺一律转我本人确认。'
  },
  {
    id: 'team',
    title: '团队内部值班搭档',
    defaultName: '团队值班分身',
    intro: '在团队频道即时解答常规口径与文档规范，本人在场 15 分钟内自动收声',
    recommendedDuty: 'live',
    defaultMode: 'direct',
    brief: '白名单内常规口径直接附上计算边界与结论；发现我在 15 分钟内刚发过言则自动保持安静。'
  }
]);

export function createDefaultChannels() {
  return [
    {
      id: 'ch-web',
      name: '免装试用网页',
      shortLabel: '免装试用网页',
      kind: 'web_link',
      enabled: true,
      configured: true,
      desc: '零配置内置入口。为每位对象生成独立隔离链接，浏览器打开即问，无需登录、无收费墙。',
      status: '免配直开 · 按人生成独立链接与隔离会话'
    },
    {
      id: 'ch-wechat',
      name: '个人微信（一人一码）',
      shortLabel: '个人微信',
      kind: 'wechat_qr',
      enabled: false,
      configured: false,
      desc: '零公众号注册，在本机生成 5 分钟专属扫码凭证：对方微信扫一扫即锁定 1 对 1 白名单会话，陌生人零响应。',
      status: '待扫码激活本机 iLink 会话'
    },
    {
      id: 'ch-feishu',
      name: '飞书 / Lark 机器人',
      shortLabel: '飞书',
      kind: 'bot_ws',
      enabled: false,
      configured: false,
      botName: '工作分身',
      appIdHint: '',
      desc: '通过 DSH 0.2.3 官方飞书插件（lark-cli）免配置一键接入，或填凭证本机直连；支持一客一码与群白名单。',
      status: '待连接：支持 DSH 官方飞书插件免密复用或本机凭证接入'
    },
    {
      id: 'ch-wecom',
      name: '企业微信机器人',
      shortLabel: '企业微信',
      kind: 'wecom_bot',
      wecomMode: 'aibot',
      enabled: false,
      configured: false,
      botName: '工作分身',
      appIdHint: '',
      desc: '支持复用 DSH 0.2.3 官方企微插件免配出站推送；双向实时问答走智能机器人本机长连接（免域名备案）。',
      status: '待配置：智能机器人长连接或复用官方企微插件出站'
    },
    {
      id: 'ch-slack',
      name: 'Slack 团队与合作频道',
      shortLabel: 'Slack',
      kind: 'slack_socket',
      enabled: false,
      configured: false,
      botName: '工作分身',
      appIdHint: '',
      desc: '通过 Socket 长连接直通工作区（免公网回调地址），按团队频道或合作方私密频道白名单独立应答。',
      status: '待配置：填入 App-Level Token 与 Bot Token 后直连'
    }
  ];
}

export function createDefaultRules() {
  return [
    { id: 'r1', kind: '规矩', text: '先用一句话复述对方诉求再动手核对，确保双方聊的是同一件事。' },
    { id: 'r2', kind: '规矩', text: '提问存在多处模糊口径时，用编号短问题一次问清，不瞎猜时间范围。' },
    { id: 'r3', kind: '规矩', text: '回复前 3 行先给直接结论，支撑证据放到后半段，方便对方一秒看懂。' },
    { id: 'r4', kind: '规矩', text: '未能在已授权文档找到明确依据时，标明「待补口径」转负责人补充，严禁编造。' },
    { id: 'r5', kind: '红线', text: '对方索要用户手机号、身份证、逐笔订单等原始个人明细时，一律拦截并转你拍板。' },
    { id: 'r6', kind: '红线', text: '要求改代码、写入数据库或做出排期、报价承诺时，分身自动挡回，绝不擅自答应。' }
  ];
}

export function createDefaultPublicLobby() {
  return {
    enabled: false,
    publicBaseUrl: '',
    title: '',
    intro: '',
    mode: 'summary',
    visitorDailyLimit: DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT,
    globalDailyLimit: DEFAULT_PUBLIC_GLOBAL_DAILY_LIMIT,
    pushOwner: false,
    capIds: [],
    starterPrompts: []
  };
}

export function normalizePublicBaseUrl(rawUrl) {
  const s = typeof rawUrl === 'string' ? rawUrl.trim() : '';
  if (!s) return '';
  let parsed;
  try {
    parsed = new URL(s);
  } catch {
    throw new Error('公开访问基址 URL 格式无效，请填写如 https://twin.finvo.ai 的完整地址');
  }
  const isLoopback = ['127.0.0.1', 'localhost', '[::1]'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback)) {
    throw new Error('公开访问基址仅支持 https:// 公网隧道域名或本机回环地址');
  }
  return parsed.origin;
}

export function normalizePublicLobbyConfig(raw = {}, prev = null) {
  const base = createDefaultPublicLobby();
  const src = { ...base, ...(prev && typeof prev === 'object' ? prev : {}), ...(raw && typeof raw === 'object' ? raw : {}) };
  let safeUrl = '';
  if (typeof src.publicBaseUrl === 'string' && src.publicBaseUrl.trim()) {
    try {
      safeUrl = normalizePublicBaseUrl(src.publicBaseUrl);
    } catch {
      safeUrl = typeof prev?.publicBaseUrl === 'string' ? prev.publicBaseUrl : '';
    }
  }
  const vLimit = Number(src.visitorDailyLimit);
  const gLimit = Number(src.globalDailyLimit);
  return {
    enabled: Boolean(src.enabled),
    publicBaseUrl: safeUrl,
    title: sanitizeSurfaceText(String(src.title || '').trim()).slice(0, 48),
    intro: sanitizeSurfaceText(String(src.intro || '').trim()).slice(0, 180),
    mode: src.mode === 'direct' ? 'direct' : 'summary',
    visitorDailyLimit: Number.isFinite(vLimit) && vLimit >= 1 ? Math.min(100, Math.round(vLimit)) : DEFAULT_PUBLIC_VISITOR_DAILY_LIMIT,
    globalDailyLimit: Number.isFinite(gLimit) && gLimit >= 1 ? Math.min(5000, Math.round(gLimit)) : DEFAULT_PUBLIC_GLOBAL_DAILY_LIMIT,
    pushOwner: Boolean(src.pushOwner),
    capIds: Array.isArray(src.capIds) ? [...new Set(src.capIds.map(x => String(x || '').trim()).filter(Boolean))] : [],
    starterPrompts: Array.isArray(src.starterPrompts)
      ? src.starterPrompts.map(q => sanitizeSurfaceText(String(q || '').trim())).filter(Boolean).slice(0, 4)
      : []
  };
}

export const CHANNEL_GUIDE_MAP = Object.freeze({
  'ch-feishu': {
    title: '接入飞书 / Lark 机器人（本机直连）',
    appIdLabel: '应用凭证（App ID）',
    appIdPh: 'cli_a7xxxxxxxxxx',
    secretLabel: '应用密钥（App Secret）',
    secretPh: '填入飞书开放平台 App Secret',
    steps: [
      '打开飞书开放平台创建企业自建应用并开启「机器人」能力',
      '事件订阅选择「使用长连接接收事件」（无需公网域名或备案）',
      '在本机保存 App ID 与 App Secret，保存时仅存于本机 0600 凭据库'
    ]
  },
  'ch-wecom': {
    title: '接入企业微信机器人（智能机器人长连接 / 自建应用）',
    modes: {
      aibot: {
        appIdLabel: '智能机器人 Bot ID',
        appIdPh: 'wb_xxxxxxxxxxxx',
        secretLabel: '机器人连接密钥（Secret）',
        secretPh: '填入企微智能机器人长连接 Secret',
        steps: [
          '登录企业微信管理后台 -> 安全与管理 -> 管理工具 -> 创建智能机器人',
          '收发消息方式选择「长连接模式」（免公网回调与域名备案）',
          '复制 Bot ID 与 Secret 填入本窗口后立即在本机握手测试'
        ]
      },
      corpapp: {
        appIdLabel: '企业 ID（CorpID）',
        appIdPh: 'wwxxxxxxxxxxxxxxxx',
        secretLabel: '应用密钥（Secret）',
        secretPh: '填入自建应用 Secret',
        steps: [
          '适用于已搭建过企业自建应用、需要按组织架构发消息的团队',
          '填写 CorpID、AgentId 与 Secret，用于获取访问令牌与推送消息',
          '凭证仅保存在本机 0600 凭据库，从不上行或写入项目文档'
        ]
      }
    }
  },
  'ch-slack': {
    title: '接入 Slack 团队与合作频道（Socket Mode）',
    appIdLabel: '应用级连接令牌（App-Level Token）',
    appIdPh: 'xapp-1-A0...',
    secretLabel: '机器人访问令牌（Bot User OAuth Token）',
    secretPh: 'xoxb-...',
    steps: [
      '在 Slack App 控制台启用「Socket Mode」并签发带 connections:write 权限的 xapp- 令牌',
      '开启 app_mention 与 message.im 订阅（无需公网 Request URL）',
      '在下方填入 xapp- 与 xoxb- 令牌后直连 Slack 网关'
    ]
  }
});

export const CHANNEL_PREFIX_MAP = Object.freeze({
  'ch-feishu': 'FS',
  'ch-wecom': 'WC',
  'ch-slack': 'SL'
});

export function channelIdFromSelection(labelOrId) {
  const s = String(labelOrId || '').trim();
  if (s === 'ch-wechat' || s.includes('个人微信') || s === '微信') return 'ch-wechat';
  if (s === 'ch-feishu' || s.includes('飞书') || s.includes('Lark')) return 'ch-feishu';
  if (s === 'ch-wecom' || s.includes('企微') || s.includes('企业微信')) return 'ch-wecom';
  if (s === 'ch-slack' || s.includes('Slack')) return 'ch-slack';
  return 'ch-web';
}

export function channelSelectionLabel(channelId) {
  switch (channelId) {
    case 'ch-wechat': return '个人微信';
    case 'ch-feishu': return '飞书';
    case 'ch-wecom': return '企业微信';
    case 'ch-slack': return '合作方 Slack';
    case 'ch-public-try': return '公开扫码体验';
    default: return '免装试用网页';
  }
}

export function formatModeLabel(mode) {
  if (mode === 'direct') return '白名单直接答';
  if (mode === 'summary') return '只给汇总（禁个人明细）';
  return '每条先草稿给我看';
}

export function formatBindingText(person) {
  const chId = channelIdFromSelection(person?.channel);
  if (chId === 'ch-web') return '独立网页链接 · 会话隔离';
  if (chId === 'ch-wechat') {
    return person?.wechatBound ? '已扫码绑定一对一微信' : '待扫 5 分钟专属二维码锁定';
  }
  if (person?.bindMode === 'group_allow' || (!person?.pairCode && person?.channelHandle)) {
    return `群白名单：${person.channelHandle || '已指定群聊'}（需 @机器人）`;
  }
  return `一客一码私聊配对（${person?.pairCode || '已签发'}）`;
}

export const SECRET_FILE_RE = /(?:^|\/)(?:\.env(?:\.[^/]+)?|.*\.(?:pem|key|p12|pfx|keystore)|credentials(?:\.[^/]+)?|secrets(?:\.[^/]+)?|id_rsa|id_ed25519)$/i;
export const IGNORED_DIR_NAMES = new Set([
  '.git', '.hg', '.svn', 'node_modules', '.next', '.nuxt', '.venv', 'venv',
  'dist', 'build', 'coverage', '.dsh', '.agent-twin', '__pycache__', '.turbo',
  '.agent', '.claude', '.Codex', '.shared-agent', '.inbox', '.mirror',
  '.playwright-mcp', '.superpowers', 'logs', 'backups', 'sessions', 'archives'
]);
export const WRITE_SCRIPT_NAME_RE = /(?:migrate|seed|deploy|reset|drop|truncate|cleanup|clean[-_]?db|write[-_]?back|delete[-_]?all)/i;
export const WRITE_CONTENT_RE = /(?:\bDROP\s+TABLE\b|\bTRUNCATE\s+TABLE\b|\bDELETE\s+FROM\b|\bUPDATE\s+\w+\s+SET\b|\bINSERT\s+INTO\b|rm\s+-rf\b|writeFileSync|fs\.writeFile|CREATE\s+OR\s+REPLACE)/i;

export const REDLINE_PATTERNS = Object.freeze({
  pii: /(手机号|电话号码|联系方式|身份证|邮箱列表|逐笔订单|原始流水|客户名单|导出明细|明细列表|phone\s*number|export\s+csv|customer\s+list|email\s+list)/i,
  writeAction: /(改代码|修改代码|写库|写入数据库|删库|执行脚本|跑个脚本|改配置|run\s+migration|drop\s+table|write\s+to\s+db)/i,
  commitment: /(承诺排期|确认报价|签合同|底价折扣|违约条款|官方承诺|pricing\s+quote|guarantee\s+delivery)/i
});

/**
 * Strip absolute host file system paths while preserving markdown formatting and genuine file/metric names.
 */
export function sanitizeSurfaceText(input) {
  if (typeof input !== 'string') return '';
  const out = input
    .replace(/(?:\/Users\/|\/private\/var\/|~\/\.dsh\/|[A-Za-z]:\\)[^\s"'`，。；！？、)\]]+/g, '本机授权目录');
  return out.replace(/[^\S\r\n]{2,}/g, ' ').trim();
}

/**
 * Scrub any credential/secret string occurrences before returning responses or logs.
 */
export function redactSecrets(input, secretValues = []) {
  let out = typeof input === 'string' ? input : String(input ?? '');
  for (const val of secretValues) {
    if (typeof val === 'string' && val.length >= 4) {
      out = out.split(val).join('[REDACTED]');
    }
  }
  return out
    .replace(/\b(xox[bp]-[A-Za-z0-9-]+|xapp-[A-Za-z0-9-]+|cli_[a-z0-9]+|sk-[A-Za-z0-9_-]{8,})\b/g, '[REDACTED]')
    .replace(/(Bearer\s+)[^\s"']+/gi, '$1[REDACTED]');
}

export function maskSecretHint(secret) {
  const s = typeof secret === 'string' ? secret.trim() : '';
  if (!s) return '';
  if (s.length <= 6) return '***';
  return `${s.slice(0, 3)}***${s.slice(-3)}`;
}

export function slugifyCallerId(raw) {
  const safe = String(raw || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return safe || 'caller';
}
