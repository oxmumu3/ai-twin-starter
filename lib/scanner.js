/**
 * Local read-only project scanner, secret/write-script isolator,
 * zero-token mtime/size delta detector, and Step-4 profile drafter.
 */
import { createHash } from 'node:crypto';
import { lstat, open, readdir } from 'node:fs/promises';
import { basename, extname, join, relative, resolve } from 'node:path';
import {
  IGNORED_DIR_NAMES,
  SECRET_FILE_RE,
  WRITE_CONTENT_RE,
  WRITE_SCRIPT_NAME_RE,
  sanitizeSurfaceText
} from '../shared/schema.js';

const DOC_EXTS = new Set(['.md', '.mdx', '.txt', '.rst', '.csv', '.json']);
const SCRIPT_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.py', '.sh', '.sql']);
const MAX_FILES = 400;
const MAX_DEPTH = 5;
const EXCERPT_BYTES = 4096;

async function readBoundedHead(filePath, maxBytes = EXCERPT_BYTES) {
  let fh;
  try {
    fh = await open(filePath, 'r');
    const buf = Buffer.alloc(maxBytes);
    const { bytesRead } = await fh.read(buf, 0, maxBytes, 0);
    return buf.subarray(0, bytesRead).toString('utf8');
  } catch {
    return '';
  } finally {
    await fh?.close();
  }
}

function projectIdForPath(rootPath) {
  const hash = createHash('sha256').update(resolve(rootPath)).digest('hex').slice(0, 8);
  const base = basename(resolve(rootPath)).toLowerCase().replace(/[^a-z0-9_-]+/g, '-') || 'project';
  return `proj-${base}-${hash}`;
}

function extractTitle(relPath, content) {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) return sanitizeSurfaceText(headingMatch[1].trim()).slice(0, 48);
  const stem = basename(relPath, extname(relPath)).replace(/[-_]+/g, ' ');
  return sanitizeSurfaceText(stem || relPath).slice(0, 48);
}

function tokenizeKeywords(text) {
  const tokens = new Set();
  const latin = String(text || '').toLowerCase().match(/[a-z0-9]{2,}/g) || [];
  for (const w of latin) tokens.add(w);
  const cjkRuns = String(text || '').match(/[\u4e00-\u9fff]{2,}/g) || [];
  for (const run of cjkRuns) {
    tokens.add(run);
    for (let i = 0; i <= run.length - 2; i++) {
      tokens.add(run.slice(i, i + 2));
    }
  }
  return [...tokens].slice(0, 40);
}

function summarizeExcerpt(content) {
  const lines = String(content || '')
    .split(/\r?\n/)
    .map(l => l.replace(/^#+\s*/, '').trim())
    .filter(l => l && !l.startsWith('```') && !l.startsWith('---'));
  const joined = lines.slice(0, 6).join(' ');
  return sanitizeSurfaceText(joined).slice(0, 260);
}

/**
 * Walk a local directory in read-only bounded mode, separating docs, read-only tools,
 * secret files, and write-capable scripts without storing secret values.
 */
export async function scanProjectDirectory(rootPath, opts = {}) {
  const absRoot = resolve(String(rootPath || ''));
  const rootStat = await lstat(absRoot);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error('选中的项目路径必须是本地真实文件夹');
  }

  const docs = [];
  const readOnlyScripts = [];
  const blockedSecrets = [];
  const blockedWriteScripts = [];
  const fingerprints = {};

  async function walk(dir, depth) {
    if (depth > MAX_DEPTH || Object.keys(fingerprints).length >= MAX_FILES) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const ent of entries) {
      if (Object.keys(fingerprints).length >= MAX_FILES) break;
      if (ent.name === '.' || ent.name === '..') continue;
      if (ent.isDirectory()) {
        if (IGNORED_DIR_NAMES.has(ent.name)) continue;
        await walk(join(dir, ent.name), depth + 1);
        continue;
      }
      const fullPath = join(dir, ent.name);
      let st;
      try {
        st = await lstat(fullPath);
      } catch {
        continue;
      }
      if (st.isSymbolicLink() || !st.isFile()) continue;

      const rel = relative(absRoot, fullPath).split('\\').join('/');
      fingerprints[rel] = { mtimeMs: Math.round(st.mtimeMs), size: st.size };

      if (SECRET_FILE_RE.test(rel)) {
        blockedSecrets.push(rel);
        continue;
      }

      const ext = extname(ent.name).toLowerCase();
      if (SCRIPT_EXTS.has(ext)) {
        const head = await readBoundedHead(fullPath, EXCERPT_BYTES);
        if (WRITE_SCRIPT_NAME_RE.test(ent.name) || WRITE_CONTENT_RE.test(head)) {
          blockedWriteScripts.push(rel);
        } else {
          const title = extractTitle(rel, head);
          readOnlyScripts.push({
            id: `tool-${createHash('sha1').update(rel).digest('hex').slice(0, 8)}`,
            relPath: rel,
            title,
            excerpt: summarizeExcerpt(head) || `${title} 只读核查脚本`,
            keywords: tokenizeKeywords(`${title} ${head.slice(0, 400)}`)
          });
        }
        continue;
      }

      if (DOC_EXTS.has(ext) && ent.name !== 'package-lock.json') {
        const head = await readBoundedHead(fullPath, EXCERPT_BYTES);
        const title = extractTitle(rel, head);
        const excerpt = summarizeExcerpt(head);
        docs.push({
          id: `doc-${createHash('sha1').update(rel).digest('hex').slice(0, 8)}`,
          relPath: rel,
          title,
          excerpt: excerpt || `${title} 口径说明文档`,
          keywords: tokenizeKeywords(`${title} ${excerpt}`)
        });
      }
    }
  }

  await walk(absRoot, 0);

  const projectName = sanitizeSurfaceText(opts.projectName || basename(absRoot) || '本地工作项目');
  const projectId = opts.projectId || projectIdForPath(absRoot);

  const docCount = docs.length;
  const toolCount = readOnlyScripts.length;
  const secretCount = blockedSecrets.length;
  const writeCount = blockedWriteScripts.length;

  const capabilities = buildCapabilities({ projectId, projectName, docs, readOnlyScripts });
  const snippets = [
    ...docs.map(d => ({
      id: d.id,
      capIds: capabilities.slice(0, 2).map(c => c.id),
      title: d.title,
      summary: d.excerpt,
      keywords: d.keywords
    })),
    ...readOnlyScripts.map(t => ({
      id: t.id,
      capIds: capabilities.map(c => c.id),
      title: t.title,
      summary: t.excerpt,
      keywords: t.keywords
    }))
  ];

  const shortSummary = `${docCount} 份项目资料、${toolCount} 项只读工具 · ${secretCount + writeCount} 项敏感操作已隔离`;
  const scanSummary = `本地快扫完成：发现 ${docCount} 份业务/项目文档、${toolCount} 个只读核查工具 · ${secretCount} 处密钥文件与 ${writeCount} 个写入脚本已默认隔离`;
  const scope = [
    `授权可读文档（${docCount} 份）：业务口径、方案说明与近期复盘摘要`,
    `只读辅助工具（${toolCount} 项）：仅限解释口径与无副作用只读核查`,
    `默认自动隔离（${secretCount + writeCount} 项）：密钥配置文件、私密凭据及含写库/修改动作脚本`
  ];

  const capSummaryList = capabilities.slice(0, 3).map(c => c.name.replace(/解答|核查|分析/, '')).join('、') || '项目口径答疑';
  const ownerDisplay = opts.ownerName ? `${opts.ownerName} · ` : '';
  const draftProfile = {
    name: `${ownerDisplay}${projectName}工作分身`,
    intro: `基于「${projectName}」${docCount} 份实料提炼：负责解答${capSummaryList}，涉敏明细与未定义口径转负责人拍板`,
    recommendedDuty: 'shadow'
  };

  return {
    projectId,
    projectName,
    rootPath: absRoot,
    fileCount: Object.keys(fingerprints).length,
    docCount,
    readOnlyToolCount: toolCount,
    blockedSecretCount: secretCount,
    blockedWriteScriptCount: writeCount,
    scanSummary,
    shortSummary,
    scope,
    capabilities,
    snippets,
    fingerprints,
    draftProfile,
    scannedAt: new Date().toISOString()
  };
}

function buildCapabilities({ projectId, projectName, docs, readOnlyScripts }) {
  const caps = [];
  const docTopics = docs.slice(0, 3).map(d => d.title).join('、');

  caps.push({
    id: `cap-${projectId}-metric`,
    projectId,
    projectName,
    name: `${projectName} · 指标与业务口径解答`,
    enabled: true,
    desc: docs.length > 0
      ? `依据已扫描的「${docTopics}」等 ${docs.length} 份项目文档，精确说明口径定义与统计边界。`
      : `仅在「${projectName}」现有说明范围内提供只读解答，遇到未定义内容自动标注「待补口径」。`,
    basis: `${docs.length} 份授权只读文档`,
    output: '先给直接结论，再说明适用前提'
  });

  if (docs.length >= 2 || readOnlyScripts.length > 0) {
    caps.push({
      id: `cap-${projectId}-anomaly`,
      projectId,
      projectName,
      name: `${projectName} · 异常排查与规律总结`,
      enabled: true,
      desc: '对照历史复盘与只读查询结构拆解波动原因，优先排除测试干扰后再输出归因判断。',
      basis: `${docs.length} 份文档 · ${readOnlyScripts.length} 项只读逻辑`,
      output: '逐条列出主因、已排除干扰项与建议'
    });
  }

  caps.push({
    id: `cap-${projectId}-review`,
    projectId,
    projectName,
    name: `${projectName} · 方案复核与只读核验`,
    enabled: true,
    desc: '按约定规则与拦截红线复核对外提问，自动挡回越权明细与修改写入请求。',
    basis: '项目规范与只读红线边界',
    output: '安全汇总结论，越权部分转负责人拍板'
  });

  return caps;
}

/**
 * Zero-token local fingerprint comparison: checks file `mtimeMs` and `size`
 * against the last indexed snapshot without calling any language model.
 */
export async function detectProjectDelta(rootPath, previousIndex = {}) {
  const prevMap = previousIndex?.fingerprints || {};
  const absRoot = resolve(String(rootPath || ''));
  const currentFingerprints = {};
  const addedDocs = [];
  const modifiedDocs = [];
  const addedTools = [];
  const newlyBlockedScripts = [];

  async function walkStat(dir, depth) {
    if (depth > MAX_DEPTH || Object.keys(currentFingerprints).length >= MAX_FILES) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name === '.' || ent.name === '..') continue;
      if (ent.isDirectory()) {
        if (!IGNORED_DIR_NAMES.has(ent.name)) await walkStat(join(dir, ent.name), depth + 1);
        continue;
      }
      const fullPath = join(dir, ent.name);
      let st;
      try {
        st = await lstat(fullPath);
      } catch {
        continue;
      }
      if (st.isSymbolicLink() || !st.isFile()) continue;
      const rel = relative(absRoot, fullPath).split('\\').join('/');
      const fp = { mtimeMs: Math.round(st.mtimeMs), size: st.size };
      currentFingerprints[rel] = fp;

      const prev = prevMap[rel];
      const changed = !prev || prev.mtimeMs !== fp.mtimeMs || prev.size !== fp.size;
      if (!changed) continue;

      if (SECRET_FILE_RE.test(rel)) {
        newlyBlockedScripts.push(rel);
      } else if (SCRIPT_EXTS.has(extname(ent.name).toLowerCase())) {
        if (WRITE_SCRIPT_NAME_RE.test(ent.name)) {
          newlyBlockedScripts.push(rel);
        } else {
          addedTools.push(rel);
        }
      } else if (DOC_EXTS.has(extname(ent.name).toLowerCase()) && ent.name !== 'package-lock.json') {
        if (!prev) addedDocs.push(rel);
        else modifiedDocs.push(rel);
      }
    }
  }

  await walkStat(absRoot, 0);

  const hasDelta = addedDocs.length > 0 || modifiedDocs.length > 0 || addedTools.length > 0 || newlyBlockedScripts.length > 0;
  const items = [];
  if (addedDocs.length > 0) {
    items.push({
      kind: '新增文档口径',
      safe: false,
      title: `新增 ${addedDocs.length} 份可读口径文档`,
      desc: `纳入新增文档说明：${addedDocs.slice(0, 3).map(sanitizeSurfaceText).join('、')}`
    });
  }
  if (modifiedDocs.length > 0) {
    items.push({
      kind: '更新口径依据',
      safe: false,
      title: `修订 ${modifiedDocs.length} 份已有口径文档`,
      desc: `同步最新改动：${modifiedDocs.slice(0, 3).map(sanitizeSurfaceText).join('、')}`
    });
  }
  if (addedTools.length > 0) {
    items.push({
      kind: '新增只读支撑',
      safe: false,
      title: `检测到 ${addedTools.length} 个新工具脚本待复核只读属性`,
      desc: '确认升级后将重新校验写操作并入只读支持清单。'
    });
  }
  if (newlyBlockedScripts.length > 0) {
    items.push({
      kind: '自动安全隔离',
      safe: true,
      title: `自动屏蔽 ${newlyBlockedScripts.length} 项敏感或写入变动`,
      desc: '密钥与潜在写库改动已留在只读边界之外，绝不对外开放。'
    });
  }

  const badgeParts = [];
  if (addedDocs.length + modifiedDocs.length > 0) badgeParts.push(`${addedDocs.length + modifiedDocs.length} 份文档`);
  if (addedTools.length > 0) badgeParts.push(`${addedTools.length} 项工具`);
  const badge = hasDelta ? `检测到 ${badgeParts.join('与') || '安全边界'}变动` : '已是最新口径';

  return {
    hasDelta,
    tokenCost: 0,
    addedDocs,
    modifiedDocs,
    addedTools,
    newlyBlockedScripts,
    deltaSpec: {
      badge,
      intro: '平时仅核对本地文件修改标记（不消耗模型额度，绝不擅自改写已有口径）。检测到变动如下：',
      items
    }
  };
}
