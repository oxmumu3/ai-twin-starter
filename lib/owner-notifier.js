/**
 * Mobile Owner Push & Remote Phone Approval Loop (`lib/owner-notifier.js`):
 * - Sends concise `#CODE` pending approval briefs to the owner's Feishu DM (via 0.2.3 official
 *   `lark-cli`) and optionally via local `dsh-wechat` when `ownerNotify.wechat === true`.
 * - Parses crisp owner DM reply commands (`批准 #CODE`, `改 #CODE：...`, `记规矩 #CODE：...`,
 *   `忽略 #CODE`, `待办`) so owners can approve & dispatch from their phone in seconds.
 */
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { redactSecrets, sanitizeSurfaceText } from '../shared/schema.js';

const execFileAsync = promisify(execFile);

export function makeApprovalShortCode(id) {
  const clean = String(id || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (clean.length >= 4) return clean.slice(-4);
  return clean.padStart(4, '0');
}

/**
 * Parse an explicit 1-on-1 owner DM approval command. Returns `null` for ordinary chat.
 */
export function parseOwnerMobileCommand(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return null;

  if (/^(?:待办|待拍板|审批列表)$/i.test(text)) {
    return { kind: 'list', code: '', text: '' };
  }

  const approveMatch = text.match(/^(?:批准|同意|通过|准奏)(?:\s*#?([A-Za-z0-9_-]{3,20}))?$/i);
  if (approveMatch) {
    return { kind: 'approve', code: (approveMatch[1] || '').toUpperCase(), text: '' };
  }

  const ruleMatch = text.match(/^(?:记规矩|定规矩)(?:\s*#?([A-Za-z0-9_-]{3,20}))?\s*[:：]\s*([\s\S]+)$/i);
  if (ruleMatch) {
    return { kind: 'rule', code: (ruleMatch[1] || '').toUpperCase(), text: ruleMatch[2].trim() };
  }

  const editMatch = text.match(/^(?:改|修改|回复)(?:\s*#?([A-Za-z0-9_-]{3,20}))?\s*[:：]\s*([\s\S]+)$/i);
  if (editMatch) {
    return { kind: 'edit', code: (editMatch[1] || '').toUpperCase(), text: editMatch[2].trim() };
  }

  const dismissMatch = text.match(/^(?:忽略|驳回|不回)(?:\s*#?([A-Za-z0-9_-]{3,20}))?$/i);
  if (dismissMatch) {
    return { kind: 'dismiss', code: (dismissMatch[1] || '').toUpperCase(), text: '' };
  }

  return null;
}

export function createOwnerNotifier({
  store,
  officialConnectors = null,
  execFileImpl = execFileAsync,
  dshWechatBin = 'dsh-wechat',
  logger = console
}) {
  async function notifyPendingApproval(approval) {
    if (!approval || typeof approval !== 'object') return { skipped: true };
    const state = store.getState();
    const cfg = state.ownerNotify || { feishu: true, wechat: false };
    const code = approval.shortCode || makeApprovalShortCode(approval.id);
    const secrets = store.allSecretValues();

    const who = redactSecrets(sanitizeSurfaceText(approval.personName || '外部来访者'), secrets);
    const chan = redactSecrets(sanitizeSurfaceText(approval.channel || '外部通道'), secrets);
    const tag = redactSecrets(sanitizeSurfaceText(approval.tag || '待拍板'), secrets);
    const q = redactSecrets(sanitizeSurfaceText(approval.question || ''), secrets).slice(0, 120);
    const draft = redactSecrets(sanitizeSurfaceText(approval.draft || ''), secrets).slice(0, 260);

    const title = `AI 分身待拍板 #${code}（${tag}）`;
    const body = [
      `来访对象：${who}（${chan}）`,
      `对方提问：${q}`,
      `拟回草稿：${draft}`,
      '',
      `手机直接回复本条私信即可处理：`,
      `• 批准 #${code}`,
      `• 改 #${code}：你的最终回复内容`,
      `• 记规矩 #${code}：最终回复并沉淀长期规矩`,
      `• 忽略 #${code}`
    ].join('\n');

    let feishuDelivered = false;
    let wechatDelivered = false;

    if (cfg.feishu !== false && officialConnectors && typeof officialConnectors.probeFeishu === 'function') {
      try {
        const probe = await officialConnectors.probeFeishu();
        const ownerOpenId = cfg.feishuOpenId || probe?.openId;
        if (probe?.connected && ownerOpenId && typeof officialConnectors.sendFeishuMessage === 'function') {
          const sent = await officialConnectors.sendFeishuMessage({
            replyContext: { openId: ownerOpenId },
            text: `**${title}**\n\n${body}`
          });
          feishuDelivered = Boolean(sent?.delivered);
        }
      } catch (err) {
        logger?.warn?.('[agent-twin] owner feishu push failed:', err?.message);
      }
    }

    if (cfg.wechat === true) {
      try {
        await execFileImpl(dshWechatBin, ['send', title, body], { timeout: 10_000, encoding: 'utf8' });
        wechatDelivered = true;
      } catch (err) {
        logger?.warn?.('[agent-twin] owner dsh-wechat push failed:', err?.message);
      }
    }

    return { shortCode: code, feishuDelivered, wechatDelivered };
  }

  return {
    notifyPendingApproval,
    makeApprovalShortCode,
    parseOwnerMobileCommand
  };
}
