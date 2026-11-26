/**
 * Full-Blooded Native DSH Agent Runner (`Thin Harness` architecture):
 * - Spawns the real `dsh --profile headless --json --permission-mode read-only`
 *   runtime inside a caller's symlink-isolated Scoped Workspace (`sandboxCwd`).
 * - Stores Twin caller sessions inside `$DSH_HOME/agent-twin/dsh-runner-home`
 *   so external callers NEVER clutter the owner's main DSH Desktop sidebar.
 * - Preserves persistent per-caller `--session-id` multi-turn memory and real
 *   tool usage (`read`, `grep`, `glob`, `bash` Python/CSV calculations).
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { lstat, mkdir, symlink, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { basename, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { sanitizeSurfaceText } from '../shared/schema.js';

export const DEFAULT_DSH_CLI_PATH = '/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh';

function findInPath(binNames) {
  const pathEnv = process.env.PATH || '';
  const sep = process.platform === 'win32' ? ';' : ':';
  for (const dir of pathEnv.split(sep).filter(Boolean)) {
    for (const name of binNames) {
      const candidate = join(dir, name);
      if (isExecutable(candidate)) return candidate;
    }
  }
  return '';
}

export function resolveDshCliPath(explicitPath = '') {
  const isWin = process.platform === 'win32';
  const binNames = isWin ? ['dsh.cmd', 'dsh.exe', 'dsh'] : ['dsh'];
  const candidates = [
    explicitPath,
    process.env.DSH_TWIN_CLI_PATH,
    process.env.DSH_CLI_PATH,
    ...(typeof process.resourcesPath === 'string' && process.resourcesPath
      ? binNames.map(n => join(process.resourcesPath, 'runtime', 'cli', 'bin', n))
      : []),
    DEFAULT_DSH_CLI_PATH
  ].filter(Boolean);
  for (const cand of candidates) {
    if (isExecutable(cand)) return cand;
  }
  return findInPath(binNames) || explicitPath || DEFAULT_DSH_CLI_PATH;
}

const TOOL_LABELS = new Map([
  ['read', '查阅授权文档'],
  ['read_file', '查阅授权文档'],
  ['grep', '检索项目内容'],
  ['glob', '浏览授权文件'],
  ['bash', '执行只读核算'],
  ['pwsh', '执行只读核算'],
  ['run_code', '运行只读分析'],
  ['web_search', '检索公开资料'],
  ['web_fetch', '读取公开页面']
]);

function isExecutable(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  try {
    accessSync(filePath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

function readJsonFileText(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function detectCredentialMode({ dshHome, allowHostCredentials = false }) {
  const apiKey = typeof process.env.DEEPSEEK_API_KEY === 'string' && process.env.DEEPSEEK_API_KEY.trim()
    ? process.env.DEEPSEEK_API_KEY.trim()
    : '';
  if (apiKey) {
    return { ready: true, mode: 'official_key', apiKey, credsPath: '' };
  }

  const localCreds = dshHome ? join(dshHome, '.credentials.yaml') : '';
  if (localCreds && existsSync(localCreds)) {
    const raw = readJsonFileText(localCreds);
    if (raw.includes('deepseek-account') || raw.includes('kind: grant') || raw.includes('DEEPSEEK_API_KEY')) {
      return { ready: true, mode: 'account_grant', apiKey: '', credsPath: localCreds };
    }
  }

  if (allowHostCredentials) {
    const hostCreds = join(os.homedir(), '.dsh', '.credentials.yaml');
    if (existsSync(hostCreds)) {
      const raw = readJsonFileText(hostCreds);
      if (raw.includes('deepseek-account') || raw.includes('kind: grant') || raw.includes('DEEPSEEK_API_KEY')) {
        return { ready: true, mode: 'account_grant', apiKey: '', credsPath: hostCreds };
      }
    }
  }

  return { ready: false, mode: 'none', apiKey: '', credsPath: '' };
}

function formatToolStepDetail(toolName, input) {
  if (toolName === 'bash' || toolName === 'pwsh') {
    const cmd = sanitizeSurfaceText(String(input?.description || input?.command || input?.cmd || '').trim());
    const first = cmd.split(/\r?\n/, 1)[0] || '';
    return first.length > 56 ? `${first.slice(0, 56)}…` : first;
  }
  const target = input?.path || input?.file_path || input?.filePath || input?.pattern || '';
  if (typeof target === 'string' && target.trim()) {
    return sanitizeSurfaceText(basename(target.trim()));
  }
  return '';
}

/**
 * Parse NDJSON lines from `dsh --profile headless --json`.
 */
export function collectHeadlessEvents(onStep = null) {
  const steps = new Map();
  let sessionId = '';
  let finalText = '';
  let currentStepText = '';
  let errorMessage = '';
  let failed = false;

  function consume(event) {
    if (!event || typeof event !== 'object') return;
    switch (event.type) {
      case 'session':
        if (typeof event.sessionId === 'string' && event.sessionId) {
          sessionId = event.sessionId;
        }
        break;
      case 'status':
        if (event.phase === 'step_start') {
          currentStepText = '';
        } else if (event.phase === 'turn_end' && event.reason?.kind === 'error') {
          failed = true;
          errorMessage = event.reason?.error?.message || errorMessage || 'DSH 回合执行失败';
        }
        break;
      case 'text':
      case 'text_delta': {
        const delta = event.text ?? event.delta;
        if (typeof delta === 'string') {
          currentStepText += delta;
        }
        break;
      }
      case 'tool_call':
      case 'tool_start': {
        const toolName = String(event.tool || event.name || event.step || '').trim();
        const callId = String(event.callId || `${toolName}-${steps.size + 1}`);
        const isNew = !steps.has(callId);
        const title = TOOL_LABELS.get(toolName) || '核对项目资料';
        const detail = formatToolStepDetail(toolName, event.input);
        const stepObj = {
          title,
          detail: detail || `${toolName || 'tool'} 只读执行`,
          toolName
        };
        steps.set(callId, {
          title: stepObj.title,
          detail: stepObj.detail
        });
        if (isNew && typeof onStep === 'function') {
          try {
            onStep(stepObj);
          } catch {
            // ignore progress listener errors
          }
        }
        break;
      }
      case 'final':
        if (typeof event.sessionId === 'string' && event.sessionId) {
          sessionId = event.sessionId;
        }
        if (typeof event.text === 'string' && event.text.trim()) {
          finalText = event.text;
        }
        if (event.reason?.kind === 'error') {
          failed = true;
          errorMessage = event.reason?.error?.message || errorMessage || 'DSH 运行失败';
        }
        break;
      default:
        break;
    }
  }

  function finish() {
    const text = (finalText || currentStepText || '').trim();
    return {
      ok: !failed && Boolean(text),
      sessionId,
      text,
      error: errorMessage,
      traceSteps: [...steps.values()]
    };
  }

  return { consume, finish };
}

/**
 * Extract structured `[[TWIN_DECISION:REDLINE|reason]]` or `[[TWIN_DECISION:GAP|reason]]`
 * boundary directives emitted by the Full-Blooded Twin Agent.
 */
export function parseTwinDecision(rawText) {
  const trimmed = String(rawText || '').trim();
  const m = trimmed.match(/^\[\[TWIN_DECISION:(REDLINE|GAP)\|([^\]]+)\]\]\s*/i);
  if (!m) {
    return { decision: 'ANSWER', reason: '', reply: trimmed };
  }
  const decision = m[1].toUpperCase();
  const reason = sanitizeSurfaceText(m[2].trim());
  const reply = trimmed.slice(m[0].length).trim() || (
    decision === 'REDLINE'
      ? '这个问题涉及敏感边界或未定稿策略，已转呈负责人拍板，确认后第一时间答复你。'
      : '这块暂未在当前已授权项目文档中找到明确口径，我已转请负责人补充确认后回复你。'
  );
  return { decision, reason, reply };
}

export function computePolicyDigest({ twinProfile, rules, mode, note, activeCaps }) {
  return createHash('sha256')
    .update(JSON.stringify({
      name: twinProfile?.name || '',
      intro: twinProfile?.intro || '',
      rules: (rules || []).map(r => [r.kind, r.text]),
      mode: mode || 'confirm',
      note: note || '',
      caps: [...(activeCaps || [])].sort()
    }))
    .digest('hex')
    .slice(0, 16);
}

/**
 * Create the Full-Blooded Native DSH Agent runner.
 */
export function createFullBloodTwinRunner({
  ctx = null,
  paths,
  dshCliPath = '',
  spawnImpl = spawn,
  allowHostCredentials = process.env.DSH_TWIN_USE_HOST_CREDS === '1',
  runnerModel = process.env.DSH_TWIN_RUNNER_MODEL || 'deepseek-flash',
  timeoutMs = 120_000,
  runnerOverride = null,
  logger = console
}) {
  const resolvedCliPath = resolveDshCliPath(dshCliPath);
  const runnerHome = join(paths.rootDir, 'dsh-runner-home');
  const callerQueues = new Map();
  let preparedHome = false;

  function enqueueForCaller(callerId, task) {
    const key = String(callerId || 'default');
    const prev = callerQueues.get(key) || Promise.resolve();
    const run = prev.catch(() => {}).then(task);
    const tail = run.then(() => {}, () => {});
    tail.finally(() => {
      if (callerQueues.get(key) === tail) callerQueues.delete(key);
    });
    callerQueues.set(key, tail);
    return run;
  }

  function credStatus() {
    return detectCredentialMode({ dshHome: paths?.dshHome, allowHostCredentials });
  }

  function isAvailable() {
    if (runnerOverride) return true;
    if (!isExecutable(resolvedCliPath)) return false;
    return credStatus().ready;
  }

  async function ensureRunnerHome(cred) {
    if (preparedHome) return;
    const profileDir = join(runnerHome, 'profiles', 'headless');
    await mkdir(profileDir, { recursive: true, mode: 0o700 });

    const pkgPath = join(profileDir, 'package.json');
    if (!existsSync(pkgPath)) {
      await writeFile(pkgPath, `${JSON.stringify({
        name: 'dsh-profile-headless',
        private: true,
        dependencies: {},
        dsh: {
          profile: {
            bundles: ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-headless']
          }
        }
      }, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    }

    const patchPath = join(profileDir, 'cordis.patch.yml');
    const platformName = ['darwin', 'win32'].includes(process.platform) ? process.platform : 'null';
    const customEffort = typeof process.env.DSH_TWIN_REASONING_EFFORT === 'string'
      ? process.env.DSH_TWIN_REASONING_EFFORT.trim()
      : '';
    const effortLine = customEffort ? [`    reasoningEffort: ${customEffort}`] : [];
    const patchContent = cred.mode === 'official_key'
      ? [
          '- id: agent-default-model',
          '  config:',
          '    provider: deepseek-official',
          `    model: ${runnerModel}`,
          ...effortLine
        ].join('\n')
      : [
          '- id: authorization',
          '  disabled: false',
          '- id: credentials',
          '  disabled: false',
          '- id: deepseek-account',
          '  disabled: false',
          '  config:',
          `    desktopPlatform: ${platformName}`,
          '- id: agent-default-model',
          '  config:',
          '    provider: deepseek-account',
          `    model: ${runnerModel}`,
          ...effortLine
        ].join('\n');
    await writeFile(patchPath, `${patchContent}\n`, { encoding: 'utf8', mode: 0o600 });

    if (cred.credsPath) {
      const targetLink = join(runnerHome, '.credentials.yaml');
      let needsLink = true;
      try {
        const st = await lstat(targetLink);
        if (st.isSymbolicLink() || st.isFile()) {
          needsLink = false;
        }
      } catch {
        needsLink = true;
      }
      if (needsLink) {
        await unlink(targetLink).catch(() => {});
        await symlink(resolve(cred.credsPath), targetLink);
      }
    }
    preparedHome = true;
  }

  async function invokeDshTurn({ sessionId = '', sandboxCwd, prompt, signal, onProgress = null }) {
    const cred = credStatus();
    if (!cred.ready || !isExecutable(resolvedCliPath)) {
      throw new Error('Full-Blooded DSH runner credentials or CLI unavailable');
    }
    await ensureRunnerHome(cred);

    if (typeof onProgress === 'function') {
      try {
        onProgress({ phase: 'sandbox', title: '启动只读隔离沙箱', detail: '核对白名单与规矩红线' });
      } catch {
        // ignore progress listener errors
      }
    }

    const runOnce = async sid => {
      const args = [
        '--profile',
        'headless',
        '--json',
        '--permission-mode',
        'read-only',
        '--approval-policy',
        'never',
        ...(sid ? ['--session-id', sid] : []),
        '-'
      ];

      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(new Error('DSH Twin runner timed out')), timeoutMs);
      timer.unref?.();
      const combinedSignal = signal ? AbortSignal.any([signal, ac.signal]) : ac.signal;

      const collector = collectHeadlessEvents(step => {
        if (typeof onProgress === 'function') {
          onProgress({ phase: 'tool', ...step });
        }
      });
      let stderr = '';
      let child;
      try {
        child = spawnImpl(resolvedCliPath, args, {
          cwd: sandboxCwd,
          env: {
            ...process.env,
            DSH_HOME: runnerHome,
            ...(cred.apiKey ? { DEEPSEEK_API_KEY: cred.apiKey } : {})
          },
          stdio: ['pipe', 'pipe', 'pipe'],
          signal: combinedSignal
        });
      } catch (err) {
        clearTimeout(timer);
        throw err;
      }

      let spawnErr = null;
      const closed = new Promise(resolveExit => {
        child.on('error', err => { spawnErr = err; });
        child.once('close', code => resolveExit(code));
      });
      child.stderr.setEncoding('utf8');
      child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-8192); });
      child.stdin.on('error', err => { spawnErr ??= err; });

      const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
      child.stdin.end(String(prompt || ''));

      try {
        for await (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('{')) continue;
          try {
            collector.consume(JSON.parse(trimmed));
          } catch {
            // ignore non-JSON diagnostic lines
          }
        }
      } finally {
        clearTimeout(timer);
      }

      const exitCode = await closed;
      const out = collector.finish();
      if (!out.ok || exitCode !== 0 || spawnErr) {
        const msg = out.error || spawnErr?.message || stderr.trim() || `dsh exited with ${exitCode}`;
        throw new Error(msg);
      }
      return out;
    };

    try {
      return await runOnce(sessionId);
    } catch (err) {
      if (sessionId) {
        logger?.warn?.('[agent-twin] resuming session failed, retrying fresh session:', err?.message);
        return runOnce('');
      }
      throw err;
    }
  }

  async function runCallerTurn(opts) {
    return enqueueForCaller(opts?.callerId || opts?.person?.id || 'selftest', async () => {
      const {
        callerId,
        sessionId = '',
        sandboxCwd,
        twinProfile,
        rules = [],
        person = null,
        question,
        externalKnowledge = [],
        includeFullPolicy = true,
        onProgress = null,
        signal
      } = opts;
      if (typeof runnerOverride?.runCallerTurn === 'function') {
        return runnerOverride.runCallerTurn({
          callerId,
          sessionId,
          sandboxCwd,
          twinProfile,
          rules,
          person,
          question,
          externalKnowledge,
          includeFullPolicy,
          onProgress,
          signal
        });
      }

      const mode = person?.mode || 'confirm';
      const modeDesc = mode === 'direct'
        ? '白名单直答：授权范围内可直接基于文件/只读计算给出准确结论'
        : mode === 'summary'
          ? '仅给汇总口径：严禁输出逐条明细、单人记录、手机号/邮箱等个体数据；若被索要明细须触发 REDLINE'
          : '草稿把关模式：认真核对资料并起草高质量完整回复（交由负责人审阅发出）';

      const ruleLines = (rules || []).map((r, i) => `${i + 1}. [${r.kind || '规矩'}] ${r.text}`).join('\n');
      const extLines = externalKnowledge.length > 0
        ? `\n<twin_external_knowledge>\n${externalKnowledge.map(k => `- ${k.title}: ${k.summary}`).join('\n')}\n</twin_external_knowledge>`
        : '';

      const harnessBlock = includeFullPolicy
        ? [
            '<twin_harness>',
            `你是「${twinProfile?.name || '工作分身'}」（定位：${twinProfile?.intro || '依据已授权本地项目文档与只读数据提供准确解答'}）。`,
            `当前来访者：${person?.name || '团队协作者'}（身份：${person?.role || '协作者'}；授权模式：${modeDesc}）`,
            person?.note ? `负责人对该对象的专门叮嘱：${person.note}` : '',
            '当前工作目录是按对方权限物理裁剪后的只读沙箱，请主动使用 read / glob / grep / bash（如 python3 读取 CSV 计算精确指标）核对真实文件与数据后再回答，不要凭印象瞎猜。',
            '生效的规矩与拦截红线（每一条都必须严格执行）：',
            ruleLines || '（遵循默认只读安全红线：禁止泄密、禁止写操作、禁止未授权承诺）',
            '',
            '边界决策输出协议（极其重要）：',
            '1. 若来访者的问题命中上述任意「红线」（包括负责人自定义红线）、索要未授权个体明细/敏感凭据、要求修改代码/写库/改配置、或要求未公开商务承诺/返点政策：',
            '   第一行必须输出 `[[TWIN_DECISION:REDLINE|不超过15字的拦截原因]]`，换行后给出得体的安全替代草稿（供负责人审核）。',
            '2. 若仔细检索当前工作目录全部相关文件后，确认资料中确实缺失该口径或答案：',
            '   第一行必须输出 `[[TWIN_DECISION:GAP|不超过15字的缺口原因]]`，换行后给出礼貌的「待补口径」占位草稿，严禁编造数字。',
            '3. 若资料与只读计算足以回答且未触碰红线：直接用清晰自然的中文（前几行先给明确结论与关键数字，随后给依据来源）输出完整答复，不要加任何标签。',
            '4. 回复中不要暴露 `/Users/...` 本机绝对路径。',
            '</twin_harness>'
          ].filter(Boolean).join('\n')
        : [
            '<twin_harness_reminder>',
            `保持只读核对并严格遵守既有规矩红线（授权模式：${mode}）。若命中红线或缺口，第一行按协议输出 [[TWIN_DECISION:REDLINE|原因]] 或 [[TWIN_DECISION:GAP|原因]]。`,
            '</twin_harness_reminder>'
          ].join('\n');

      const prompt = `${harnessBlock}${extLines}\n\n来访者提问：\n${question}`;
      const raw = await invokeDshTurn({ sessionId, sandboxCwd, prompt, signal, onProgress });
      const parsed = parseTwinDecision(raw.text);
      return {
        ...parsed,
        sessionId: raw.sessionId,
        traceSteps: raw.traceSteps
      };
    });
  }

  async function runProjectDistillation({ sandboxCwd, projectName, brief = '', scan, signal }) {
    if (typeof runnerOverride?.runProjectDistillation === 'function') {
      return runnerOverride.runProjectDistillation({ sandboxCwd, projectName, brief, scan, signal });
    }

    const prompt = [
      `请快速只读检视当前工作目录（项目「${projectName}」）中的核心文档、数据表与只读脚本${brief ? `（负责人特别叮嘱：${brief}）` : ''}。`,
      '请提炼 3 项最具代表性的业务能力、1 份对外分身名片草稿、以及 3 条贴合本项目真实内容的试跑提问（第 3 条为触发敏感边界/明细红线的测试问句）。',
      '只输出一个严格 JSON 对象，不要 markdown 代码块围栏，字段如下：',
      '{"twinName":"不超过16字名称","twinIntro":"不超过65字对外介绍","recommendedDuty":"shadow","capabilities":[{"name":"能力名","desc":"40-80字基于实料的能力说明","basis":"依据哪些真实文件","output":"输出格式约定"}],"samplePrompts":["真实口径问题1","真实异常排查问题2","触碰红线试探问题3"]}'
    ].join('\n');

    const raw = await invokeDshTurn({ sessionId: '', sandboxCwd, prompt, signal });
    const cleaned = raw.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Distillation output is not JSON');
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed?.capabilities) || parsed.capabilities.length === 0) {
      throw new Error('Distillation JSON missing capabilities');
    }
    return parsed;
  }

  return {
    isAvailable,
    credStatus,
    runnerHome,
    runCallerTurn,
    runProjectDistillation
  };
}
