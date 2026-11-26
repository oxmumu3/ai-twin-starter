/**
 * Built-in Semantic Knowledge Graph Provider (`lib/graph-provider.js`):
 * - Discovers `graph/*.json`, `knowledge/*.json`, `*.graph.json` inside mounted read-only projects
 *   and owner-curated nodes at `$DSH_HOME/agent-twin/knowledge-graph.json`.
 * - Enforces caller capability authorization and `allowedModes` filtering before expanding
 *   1-hop semantic relations (`公式` / `口径注意` / `受保护关联边界提示`) into caller turns.
 */
import { createHash, randomUUID } from 'node:crypto';
import { chmod, lstat, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { IGNORED_DIR_NAMES, PERSON_MODES, sanitizeSurfaceText } from '../shared/schema.js';

const MAX_GRAPH_BYTES = 256 * 1024;
const MAX_SCAN_DEPTH = 3;

function tokenize(text) {
  const s = String(text || '').toLowerCase();
  const tokens = new Set(s.match(/[a-z0-9_.-]{2,}/g) || []);
  const cjk = s.match(/[\u4e00-\u9fff]{2,}/g) || [];
  for (const run of cjk) {
    tokens.add(run);
    for (let i = 0; i <= run.length - 2; i++) {
      tokens.add(run.slice(i, i + 2));
    }
  }
  return [...tokens];
}

function normalizeNode(raw, defaultProjectId = '') {
  if (!raw || typeof raw !== 'object') return null;
  const title = sanitizeSurfaceText(String(raw.title || raw.name || '').trim());
  const summary = sanitizeSurfaceText(String(raw.summary || raw.definition || raw.description || '').trim());
  if (!title && !summary) return null;

  const id = String(raw.id || '').trim() || `kg-${createHash('sha1').update(`${defaultProjectId}:${title}`).digest('hex').slice(0, 8)}`;
  const allowedModesRaw = Array.isArray(raw.allowedModes) ? raw.allowedModes : [];
  const allowedModes = allowedModesRaw.filter(m => PERSON_MODES.includes(m));
  const relations = Array.isArray(raw.relations)
    ? raw.relations
        .filter(r => r && typeof r === 'object' && (r.targetId || r.target))
        .map(r => ({
          rel: sanitizeSurfaceText(String(r.rel || r.type || '关联').trim()) || '关联',
          targetId: String(r.targetId || r.target).trim()
        }))
    : [];

  return {
    id,
    projectId: typeof raw.projectId === 'string' && raw.projectId.trim() ? raw.projectId.trim() : defaultProjectId,
    type: ['metric', 'term', 'policy', 'entity', 'event'].includes(raw.type) ? raw.type : 'term',
    title: title || id,
    aliases: Array.isArray(raw.aliases)
      ? raw.aliases.map(a => sanitizeSurfaceText(String(a || '').trim())).filter(Boolean).slice(0, 16)
      : [],
    summary,
    formula: sanitizeSurfaceText(String(raw.formula || '').trim()),
    caveats: sanitizeSurfaceText(String(raw.caveats || '').trim()),
    allowedModes: allowedModes.length > 0 ? allowedModes : ['direct', 'summary', 'confirm'],
    capIds: Array.isArray(raw.capIds) ? raw.capIds.map(x => String(x || '').trim()).filter(Boolean) : [],
    relations
  };
}

function isModeAllowed(node, mode) {
  if (!mode) return true;
  if (!Array.isArray(node.allowedModes) || node.allowedModes.length === 0) return true;
  return node.allowedModes.includes(mode);
}

async function safeAtomicWrite(filePath, payload) {
  await mkdir(dirname(filePath), { recursive: true, mode: 0o700 });
  const tmpPath = `${filePath}.tmp.${process.pid}.${randomUUID().slice(0, 8)}`;
  try {
    await writeFile(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
    await chmod(tmpPath, 0o600);
    await rename(tmpPath, filePath);
  } catch (err) {
    await unlink(tmpPath).catch(() => {});
    throw err;
  }
}

export function createKnowledgeGraphProvider({ store, logger = console }) {
  const customGraphPath = join(store.paths.rootDir, 'knowledge-graph.json');
  const fileCache = new Map();

  async function readGraphFileNodes(filePath, defaultProjectId = '') {
    try {
      const st = await lstat(filePath);
      if (st.isSymbolicLink() || !st.isFile() || st.size > MAX_GRAPH_BYTES) return [];
      const cacheKey = `${filePath}:${Math.round(st.mtimeMs)}:${st.size}:${defaultProjectId}`;
      if (fileCache.has(cacheKey)) return fileCache.get(cacheKey);
      const raw = await readFile(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.nodes) ? parsed.nodes : []);
      const normalized = list.map(n => normalizeNode(n, defaultProjectId)).filter(Boolean);
      if (fileCache.size > 64) fileCache.clear();
      fileCache.set(cacheKey, normalized);
      return normalized;
    } catch {
      return [];
    }
  }

  async function findProjectGraphFiles(rootPath) {
    const absRoot = resolve(String(rootPath || ''));
    try {
      const st = await lstat(absRoot);
      if (st.isSymbolicLink() || !st.isDirectory()) return [];
    } catch {
      return [];
    }

    const found = [];
    async function walk(dir, relPrefix, depth) {
      if (depth > MAX_SCAN_DEPTH || found.length >= 20) return;
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const ent of entries) {
        if (found.length >= 20) break;
        if (ent.name === '.' || ent.name === '..' || ent.name.startsWith('.')) continue;
        const full = join(dir, ent.name);
        let st;
        try {
          st = await lstat(full);
        } catch {
          continue;
        }
        if (st.isSymbolicLink()) continue;
        const rel = relPrefix ? `${relPrefix}/${ent.name}` : ent.name;
        if (ent.isDirectory()) {
          if (!IGNORED_DIR_NAMES.has(ent.name)) {
            await walk(full, rel, depth + 1);
          }
          continue;
        }
        if (!st.isFile()) continue;
        const lower = rel.toLowerCase();
        if (
          lower.endsWith('.graph.json') ||
          ((lower.startsWith('graph/') || lower.startsWith('knowledge/')) && lower.endsWith('.json'))
        ) {
          found.push(full);
        }
      }
    }
    await walk(absRoot, '', 0);
    return found;
  }

  async function loadAllNodes() {
    const state = store.getState();
    const out = [];
    const customNodes = await readGraphFileNodes(customGraphPath, '');
    out.push(...customNodes);

    for (const mp of state.mountedProjects || []) {
      if (!mp?.rootPath) continue;
      const files = await findProjectGraphFiles(mp.rootPath);
      for (const file of files) {
        const nodes = await readGraphFileNodes(file, mp.id);
        out.push(...nodes);
      }
    }

    // Deduplicate by id (custom graph takes precedence when ids collide)
    const byId = new Map();
    for (const n of out) {
      if (!byId.has(n.id)) byId.set(n.id, n);
    }
    return [...byId.values()];
  }

  async function listNodes() {
    return loadAllNodes();
  }

  async function upsertNodes(inputNodes = []) {
    const incoming = (Array.isArray(inputNodes) ? inputNodes : [inputNodes])
      .map(n => normalizeNode(n, n?.projectId || ''))
      .filter(Boolean);
    if (incoming.length === 0) {
      throw new Error('缺少有效的语义知识节点内容');
    }
    const existing = await readGraphFileNodes(customGraphPath, '');
    const merged = new Map(existing.map(n => [n.id, n]));
    for (const n of incoming) {
      merged.set(n.id, n);
    }
    const nextNodes = [...merged.values()];
    await safeAtomicWrite(customGraphPath, { format: 1, updatedAt: new Date().toISOString(), nodes: nextNodes });
    fileCache.clear();
    return { count: incoming.length, totalCustomNodes: nextNodes.length, nodes: nextNodes };
  }

  async function query(question, { person = null, activeCaps = null } = {}) {
    const q = String(question || '').trim();
    if (!q) return [];
    const qLower = q.toLowerCase();
    const qTokens = tokenize(q);
    if (qTokens.length === 0) return [];

    const state = store.getState();
    const activeSet = Array.isArray(activeCaps) ? new Set(activeCaps) : null;
    const enabledCaps = (state.capabilities || []).filter(c => c?.enabled && (!activeSet || activeSet.has(c.id)));
    const authorizedProjectIds = new Set(enabledCaps.map(c => c.projectId));

    const allNodes = await loadAllNodes();
    if (allNodes.length === 0) return [];

    const authorizedNodes = allNodes.filter(node => {
      if (node.projectId && !authorizedProjectIds.has(node.projectId)) return false;
      if (!node.projectId && person?.isPublicVisitor) return false;
      if (!node.projectId && activeSet && activeSet.size === 0) return false;
      if (node.capIds.length > 0 && activeSet && !node.capIds.some(cid => activeSet.has(cid))) return false;
      return true;
    });

    const nodeById = new Map(authorizedNodes.map(n => [n.id, n]));
    const mode = person?.mode || '';
    const scored = [];

    for (const node of authorizedNodes) {
      if (!isModeAllowed(node, mode)) continue;

      let score = 0;
      const titleLower = node.title.toLowerCase();
      if (titleLower && qLower.includes(titleLower)) score += 8;
      for (const alias of node.aliases) {
        if (alias && qLower.includes(alias.toLowerCase())) score += 8;
      }

      const headingHay = `${titleLower} ${node.aliases.join(' ').toLowerCase()}`;
      const bodyHay = `${node.summary} ${node.formula} ${node.caveats}`.toLowerCase();
      for (const tok of qTokens) {
        if (headingHay.includes(tok)) score += 4;
        else if (bodyHay.includes(tok)) score += 1;
      }

      if (score >= 4 || (score >= 2 && qTokens.length <= 2)) {
        scored.push({ score, node });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 4).map(({ score, node }) => {
      const parts = [node.summary];
      if (node.formula) parts.push(`计算公式：${node.formula}`);
      if (node.caveats) parts.push(`口径注意：${node.caveats}`);

      for (const rel of node.relations || []) {
        const target = nodeById.get(rel.targetId);
        if (!target) continue;
        if (isModeAllowed(target, mode)) {
          const extra = [target.summary, target.formula ? `公式：${target.formula}` : ''].filter(Boolean).join('；');
          parts.push(`[关联${rel.rel}: ${target.title} — ${extra}]`);
        } else {
          parts.push(`[边界提示: 关联项「${target.title}」受当前授权档位保护，若被追问细节须触发 REDLINE 转负责人拍板]`);
        }
      }

      return {
        nodeId: node.id,
        type: node.type,
        score,
        source: '语义知识图谱',
        title: node.title,
        summary: sanitizeSurfaceText(parts.filter(Boolean).join(' | '))
      };
    });
  }

  return {
    name: '语义知识图谱',
    query,
    listNodes,
    upsertNodes
  };
}
