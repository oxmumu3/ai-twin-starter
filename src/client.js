/* Native DSH client. Project data and execution state remain in the host service. */
window.__ModuleLoader__.load({
  id: 'dsh-agent-twin',
  factory: require => {
    const React = require('react');
    const { Modal, SettingsForm, SettingsSecretField } = require('@deepseek-ai/dsh-client-ui-primitives');
    const h = React.createElement;
    const inject = ['slots', 'layout', 'uiWorkspace', 'configForms'];
    const panelId = 'agent-twin';
    const tabs = [['overview', '概览'], ['project', '项目沉淀'], ['ability', '分身能力'], ['channels', '通道连接'], ['rules', '身份与规则']];
    const scopes = [['knowledge', '项目知识'], ['judgment', '判断与边界'], ['workflow', '标准流程'], ['tool', '工具说明']];
    const materialKinds = { background: '项目背景', knowledge: '知识', decision: '判断与决策', workflow: '工作流程', case: '案例', tool: '工具说明', bundle: '成果与大礼包' };
    const eventLabels = { task_generated: '已按当前授权能力生成任务产出。', delivery_result: '任务交付状态已更新，请查看原投递记录。', channel_seed_gap: '消息读取范围尚未完成初始化，服务保持暂停。', project_configured: '已绑定服务项目、专用会话与沉淀框架。', materials_organized: '已整理选定材料，并核对来源依据。', candidate_distilled: '已生成能力候选，等待试跑与采用。', candidate_test_failed: '候选试跑未通过，请检查依据与实际产出。', candidate_adopted: '已采用通过试跑的能力版本。', service_enabled: '已明确启用分身，按当前授权范围接单。', service_paused: '分身已暂停，配置与历史继续保留。', channel_blocked: '通道身份核验失败，分身已暂停。', channel_read_gap: '部分频道或线程读取不完整，分身已暂停。', incoming_rejected: '一条不符合接单要求的消息已被拒绝。' };
    const taskLabels = { queued: '等待执行', blocked: '已暂停，需核对', needs_approval: '等待审批', ready: '已生成，等待交付', sent: '通道报告已发出', delivery_unknown: '发送结果待核查', failed: '执行失败', denied: '已拒绝', sending: '正在交付，等待回执' };
    const stateLabels = { empty: '尚未准备', unconfigured: '尚未配置', configured: '已保存配置', ready: '已就绪', stale: '来源有变化', current: '与来源一致', adopted: '已采用', candidate: '有待复核候选', connected: '连接正常', failed: '失败', passed: '已通过', unknown: '尚未确认', pending: '等待核验', tested: '已试跑', invalidated: '变更后需复核', selected: '已选择来源，待整理', verified: '读取已核验', probe_required: '需要核验读取', delivery_required: '需要核验回传', sending: '正在发送，等待回执', sent: '通道报告已发出' };
    const textState = value => typeof value === 'string' ? stateLabels[value] ?? value : value?.status ? textState(value.status) : typeof value?.passed === 'boolean' ? value.passed ? '已通过' : '未通过' : '尚未确认';
    const taskState = task => task.status === 'ready' && task.request?.action === 'draft' ? '草稿已完成' : taskLabels[task.status] ?? textState(task.status);
    const reasons = { service_paused: '服务已暂停', channel_not_ready: '通道需要重新核验', identity_not_granted: '此身份尚未授权', scope_not_granted: '本次知识范围尚未授权', destination_not_granted: '本次目的地尚未授权', action_not_granted: '本次动作尚未授权', identity_expired: '身份授权已过期', knowledge_stale_or_missing: '来源变化或缺少当前能力', rules_retest_required: '权限规则需重新试跑', task_context_changed: '本次任务的来源或权限已变化', tool_execution_not_granted: '产出请求了未授权工具操作', owner_approval_required: '等待所有者批准本次外发', receipt_unknown: '发送回执未知，请核查原记录', delivery_failed: '投递失败，需查证后重试', delivery_recovery_required: '宿主恢复后需先核查原投递', channel_identity_failed: '通道身份核验失败', explicit_scope_required: '本次知识范围尚未明确，需要主人判断', scope_routing_unavailable: '暂时无法在已授权范围内识别本次知识范围', candidate_audit_failed: '卡片依据与边界审查未通过', candidate_trial_output_invalid: '试跑没有生成有效草稿', no_documented_cards: '没有可用于试跑的已确认卡片', delivery_context_changed: '原投递的账号或路由已变化' };
    const gapText = gap => ({ project_unbound: '先选择服务项目与专用会话。', materials_required: '选择并整理当前项目材料，补齐目标与关键机制。', ability_required: '生成、试跑并采用有来源依据的能力包。', channel_required: '完成通道读取核验与真实回传测试。', rules_required: '登记服务身份、保存规则，再执行当前权限试跑。', executor_missing: '尚未连接真实宿主模型执行器。', transport_missing: '尚未连接真实消息适配器。' })[gap.code] ?? gap.message ?? gap.code;
    const date = value => { try { return value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short', hourCycle: 'h23' }).format(new Date(value)) : '暂无记录'; } catch { return '时间未知'; } };
    const fingerprint = value => typeof value === 'string' ? value.slice(0, 12) : '尚无来源版本';
    const requestId = () => `work-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
    const projectBinding = project => JSON.stringify([project?.projectId, project?.cwd, project?.sessionId]);

    function validSnapshot(value) {
      return value && value.schemaVersion === 1 && Number.isSafeInteger(value.revision) && value.revision >= 0 &&
        value.materials && value.ability && value.channel && value.rules && value.service && value.readiness && value.runtime &&
        ['identities', 'tasks', 'outbox', 'events'].every(key => Array.isArray(value[key]));
    }
    function createTwinClient({ fetch: fetcher = fetch, baseUrl = '', timeoutMs = 300000 } = {}) {
      let view = Object.freeze({ snapshot: null, projects: [], busy: false, stale: true, uncertain: false, error: '' });
      let closed = false, flight = false, commandFailure = '';
      const listeners = new Set(), controllers = new Set();
      const publish = patch => { if (closed) return; view = Object.freeze({ ...view, ...patch }); for (const fn of [...listeners]) { try { fn(); } catch {} } };
      const request = async (path, body) => {
        const controller = new AbortController(); controllers.add(controller);
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetcher(baseUrl + path, { method: body ? 'POST' : 'GET', credentials: 'same-origin', redirect: 'error', cache: 'no-store', signal: controller.signal, ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
          let result; try { result = await response.json(); } catch { throw new Error('服务回复无法读取，请刷新核对。'); }
          if (!response.ok) {
            const failure = new Error(response.status === 409 ? '配置已被其他操作更新，请刷新后重新核对。' : response.status === 401 || response.status === 403 ? '请在已登录的 Harness 窗口中打开此页。' : response.status === 404 ? '分身服务不可用，请核对插件版本与启用状态。' : String(result?.message ?? result?.error ?? '本次操作未完成，请刷新核对。').slice(0, 500));
            failure.status = response.status; failure.code = result?.code; throw failure;
          }
          return result;
        } finally { clearTimeout(timer); controllers.delete(controller); }
      };
      const refresh = async ({ automatic = false } = {}) => {
        // A background read must not acknowledge a failed or ambiguous mutation
        // for the owner. Keep its explanation and write lock until explicit review.
        if (closed || flight || automatic && commandFailure) return false;
        flight = true; publish({ busy: true });
        try {
          const value = await request('/api/agent_twin/status');
          if (!validSnapshot(value)) throw new Error('分身状态格式不匹配，请核对客户端与服务版本。');
          if (view.snapshot && value.revision < view.snapshot.revision) throw new Error('服务返回了较旧状态，请刷新核对。');
          commandFailure = '';
          publish({ snapshot: value, projects: Array.isArray(value.projects) ? value.projects : view.projects, stale: false, uncertain: false, error: '' }); return true;
        } catch (failure) { const message = failure.message || '状态暂不可用，请刷新重试。'; publish({ stale: true, error: commandFailure ? `${commandFailure} 刷新未完成：${message}` : message }); return false; }
        finally { flight = false; publish({ busy: false }); }
      };
      const command = async (action, payload = {}) => {
        if (closed || flight || view.stale || view.uncertain || !view.snapshot) return false;
        flight = true; publish({ busy: true, error: '' });
        try {
          const value = await request('/api/agent_twin/action', { action, payload, expectedRevision: view.snapshot.revision });
          if (!validSnapshot(value) || value.revision <= view.snapshot.revision) throw new Error('操作回执未能核对，请刷新当前状态。');
          publish({ snapshot: value, stale: false, uncertain: false, error: '' }); return true;
        } catch (failure) { const code = typeof failure.code === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(failure.code) ? `（${failure.code}）` : ''; commandFailure = `${failure.message || '操作结果待核对。'}${code} 未自动重试；请先刷新当前状态。`; publish({ stale: true, uncertain: failure.status !== 409, error: commandFailure }); return false; }
        finally { flight = false; publish({ busy: false }); }
      };
      const loadProjects = async () => {
        if (closed) return [];
        try { const value = await request('/api/agent_twin/projects'); if (!Array.isArray(value?.projects)) throw new Error('项目列表暂不可用。'); publish({ projects: value.projects }); return value.projects; }
        catch (failure) { if (!commandFailure) publish({ error: failure.message || '项目列表暂不可用。' }); return []; }
      };
      return {
        getSnapshot: () => view,
        subscribe: fn => { if (closed || typeof fn !== 'function') return () => {}; listeners.add(fn); return () => listeners.delete(fn); },
        refresh, command, loadProjects,
        close() { if (closed) return; closed = true; for (const c of controllers) c.abort(); controllers.clear(); listeners.clear(); },
      };
    }

    const css = `
.at_native{height:100%;overflow:auto;color:var(--dsw-alias-label-primary,#222);font:14px/1.6 var(--dsw-font-family,system-ui,sans-serif);background:var(--dsw-alias-bg-base,#fff)}
.at_native *{box-sizing:border-box}.at_inner{max-width:1160px;margin:0 auto;padding:30px 40px 40px}.at_header,.at_title,.at_actions,.at_between{display:flex;align-items:center;justify-content:space-between;gap:14px}.at_header{margin-bottom:16px;align-items:flex-start}.at_native h1,.at_native h2,.at_native h3,.at_modal h2,.at_modal h3{margin:0;font-weight:600}.at_native h1{font-size:24px;letter-spacing:-.5px}.at_native h2{font-size:19px}.at_native h3,.at_modal h3{font-size:14px}.at_native p,.at_modal p{margin:5px 0 0}.at_kicker{font-size:11px;letter-spacing:.7px;color:var(--dsw-alias-label-tertiary,#888);margin-bottom:3px}.at_muted{font-size:12px;color:var(--dsw-alias-label-secondary,#777)}.at_actions{justify-content:flex-start;flex-wrap:wrap;gap:8px}.at_native button,.at_modal button{font:inherit;font-size:12px;line-height:1.4;cursor:pointer;border:1px solid var(--dsw-alias-border-l3,#ddd);border-radius:8px;padding:8px 12px;background:transparent;color:inherit;white-space:normal}.at_native button:hover:not(:disabled),.at_modal button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(128,128,128,.07))}.at_native button.at_primary,.at_modal button.at_primary{background:var(--dsw-alias-state-business-primary,#4176e6);color:white;border-color:transparent}.at_native button:disabled,.at_modal button:disabled{opacity:.45;cursor:default}.at_native :focus-visible,.at_modal :focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:3px}.at_tabs{display:flex;gap:24px;border-bottom:1px solid var(--dsw-alias-border-l3,#e5e7eb);margin:14px 0 26px;overflow-x:auto}.at_tabs button{border:0;border-radius:0;flex-shrink:0;padding:11px 0;border-bottom:2px solid transparent;font-size:13px;color:var(--dsw-alias-label-secondary,#777)}.at_tabs button[aria-current=page]{color:var(--dsw-alias-label-primary,#222);border-color:var(--dsw-alias-state-business-primary,#4176e6)}.at_binding{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-secondary,#777);padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l4,#eee)}.at_binding span{overflow-wrap:anywhere}.at_title{margin-bottom:20px;align-items:flex-start}.at_title p{max-width:650px}.at_grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.at_grid4{grid-template-columns:repeat(4,minmax(0,1fr))}.at_card{padding:20px;border:1px solid var(--dsw-alias-border-l3,#e5e7eb);border-radius:12px;min-width:0;background:var(--dsw-alias-bg-layer-1,#fff)}.at_card .at_actions{margin-top:16px}.at_card p{overflow-wrap:anywhere}.at_module_head{display:flex;gap:10px;align-items:center;margin-bottom:6px}.at_num{color:var(--dsw-alias-label-tertiary,#999);font-size:12px;font-variant-numeric:tabular-nums}.at_badge{display:inline-block;border:1px solid var(--dsw-alias-border-l3,#e5e7eb);border-radius:5px;padding:1px 6px;font-size:10px;color:var(--dsw-alias-label-secondary,#777);vertical-align:middle;white-space:nowrap}.at_good{color:var(--dsw-alias-state-success-primary,#267c56)}.at_warning{color:var(--dsw-alias-state-warning-primary,#ae6e17)}.at_error{color:var(--dsw-alias-state-error-primary,#b42318)}.at_notice{padding:12px 14px;background:var(--dsw-alias-bg-layer-2,#f8f9fb);border-radius:9px;font-size:12px;margin:14px 0}.at_section{margin-top:26px;padding-top:22px;border-top:1px solid var(--dsw-alias-border-l3,#e5e7eb)}.at_section>h3{margin-bottom:13px}.at_row{padding:14px 0;border-bottom:1px solid var(--dsw-alias-border-l4,#eee);display:flex;align-items:flex-start;justify-content:space-between;gap:18px}.at_row:last-child{border-bottom:0}.at_row>div{min-width:0}.at_row strong{font-size:13px}.at_row p{overflow-wrap:anywhere}.at_empty{padding:28px 0;color:var(--dsw-alias-label-secondary,#777);font-size:13px}.at_metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin:24px 0}.at_metric{padding:14px 0;border-top:1px solid var(--dsw-alias-border-l3,#eee)}.at_metric strong{display:block;font-size:25px;line-height:1.2;margin-bottom:5px;font-weight:500}.at_footer{margin-top:28px;font-size:11px;color:var(--dsw-alias-label-tertiary,#888)}.at_tablewrap{overflow-x:auto}.at_native table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}.at_native th{font-weight:500;color:var(--dsw-alias-label-secondary,#777);padding:10px 8px;border-bottom:1px solid var(--dsw-alias-border-l3,#ddd)}.at_native td{padding:13px 8px;border-bottom:1px solid var(--dsw-alias-border-l4,#eee);vertical-align:top;overflow-wrap:anywhere}.at_tablewrap .at_actions{min-width:75px}.at_native pre,.at_modal pre{font:12px/1.7 var(--dsw-font-family,system-ui,sans-serif);white-space:pre-wrap;overflow-wrap:anywhere;max-height:340px;overflow:auto;background:var(--dsw-alias-bg-layer-2,#f8f9fb);padding:12px;border-radius:8px}.at_modal{width:min(720px,100%);max-height:90vh;overflow:auto;padding:26px;color:var(--dsw-alias-label-primary,#222);font:14px/1.6 var(--dsw-font-family,system-ui,sans-serif)}.at_modal form{margin-top:18px}.at_field{display:flex;flex-direction:column;gap:6px;margin:14px 0;font-size:12px}.at_native input,.at_native select,.at_native textarea,.at_modal input,.at_modal select,.at_modal textarea{font:inherit;border:1px solid var(--dsw-alias-border-l3,#ddd);border-radius:7px;padding:9px;background:var(--dsw-alias-bg-layer-1,#fff);color:inherit;max-width:100%;min-width:0}.at_field textarea{min-height:85px;resize:vertical}.at_check{display:flex;align-items:flex-start;gap:9px;font-size:12px;padding:7px 0}.at_check input{margin-top:4px}.at_check span{overflow-wrap:anywhere}.at_check small{display:block;color:var(--dsw-alias-label-secondary,#888)}.at_source_list{max-height:350px;overflow:auto;padding:6px 0}.at_form_actions{display:flex;justify-content:flex-end;gap:8px;margin-top:24px}.at_twocol{display:grid;grid-template-columns:1fr 1fr;gap:16px}.at_version{font-family:ui-monospace,monospace;font-size:11px}.at_settings{padding:12px 24px 28px;max-width:760px;color:var(--dsw-alias-label-primary,#222);font:14px/1.6 var(--dsw-font-family,system-ui,sans-serif)}.at_settings button{font:inherit;border:1px solid var(--dsw-alias-border-l3,#ddd);border-radius:8px;padding:8px 12px;background:transparent;color:inherit;cursor:pointer}.at_settings .at_field{margin-top:18px}.at_settings h2{font-size:18px;font-weight:600;margin:0 0 10px}.at_settings .at_notice{margin:14px 0}.at_settings .at_actions{margin-top:18px}.at_icon{display:block}
@media(max-width:1000px){.at_inner{padding:24px}.at_grid4{grid-template-columns:repeat(2,minmax(0,1fr))}.at_tabs{gap:20px}}@media(max-width:650px){.at_inner{padding:20px 16px}.at_header,.at_title{flex-direction:column;gap:12px}.at_grid,.at_grid4,.at_twocol{grid-template-columns:1fr}.at_tabs{gap:18px;margin-bottom:20px}.at_metrics{grid-template-columns:repeat(2,1fr);gap:12px}.at_card{padding:16px}.at_row{flex-direction:column;gap:10px}.at_modal{padding:20px}.at_binding{gap:6px;flex-direction:column}}
`;

    function apply(ctx) {
      const client = createTwinClient();
      ctx.effect(() => () => client.close());
      ctx.effect(() => {
        if (typeof document === 'undefined') return;
        const style = document.createElement('style'); style.dataset.pluginCss = 'dsh-agent-twin/native'; style.textContent = css; document.head.appendChild(style);
        return () => style.remove();
      });
      const optional = name => { try { return ctx.get?.(name, false) ?? ctx[name]; } catch { return undefined; } };
      function useTwin() {
        const [view, setView] = React.useState(() => client.getSnapshot());
        React.useEffect(() => {
          const off = client.subscribe(() => setView(client.getSnapshot()));
          void client.refresh({ automatic: true });
          const timer = setInterval(() => { if (typeof document === 'undefined' || document.visibilityState !== 'hidden') void client.refresh({ automatic: true }); }, 15000);
          return () => { off(); clearInterval(timer); };
        }, []);
        return view;
      }
      function TwinIcon({ size = 20 } = {}) {
        return h('svg', { className: 'at_icon', width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true },
          h('path', { d: 'M8 4.5h8a3.5 3.5 0 0 1 3.5 3.5v8a3.5 3.5 0 0 1-3.5 3.5H8A3.5 3.5 0 0 1 4.5 16V8A3.5 3.5 0 0 1 8 4.5Z', stroke: 'currentColor', strokeWidth: 1.5 }),
          h('circle', { cx: 9, cy: 10, r: 1, fill: 'currentColor' }), h('circle', { cx: 15, cy: 10, r: 1, fill: 'currentColor' }), h('path', { d: 'M8.5 14.5c1.9 1.5 5.1 1.5 7 0', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' }));
      }
      function Credentials({ onSaved } = {}) {
        const twin = useTwin();
        const form = React.useMemo(() => { try { return optional('configForms')?.get('agent-twin-starter') ?? null; } catch { return null; } }, []);
        const [view, setView] = React.useState(() => form?.getSnapshot() ?? { status: 'unavailable', writable: false });
        const [draft, setDraft] = React.useState(undefined), [saving, setSaving] = React.useState(false), [failed, setFailed] = React.useState(false);
        const baseline = React.useRef(undefined), active = React.useRef(false), flight = React.useRef(false), current = React.useRef(view);
        current.current = view;
        React.useEffect(() => { active.current = true; const sync = () => { if (active.current && form) setView(form.getSnapshot()); }; const off = form?.subscribe(sync); sync(); return () => { active.current = false; off?.(); baseline.current = undefined; }; }, []);
        const stage = value => { if (flight.current || current.current.status !== 'ready' || !current.current.writable) return; if (draft === undefined) baseline.current = current.current.revision; setDraft(value === '' ? undefined : value); setFailed(false); };
        const discard = () => { setDraft(undefined); baseline.current = undefined; setFailed(false); };
        const save = async () => {
          if (!form || flight.current || view.status !== 'ready' || !view.writable || draft === undefined) return;
          flight.current = true; setSaving(true); setFailed(false);
          try { const ok = await form.mutate([draft === null ? { op: 'unset', path: ['slackBotToken'] } : { op: 'set', path: ['slackBotToken'], value: draft }], baseline.current); if (active.current) { if (ok === true) { discard(); setView(form.getSnapshot()); void client.refresh({ automatic: true }); onSaved?.(); } else setFailed(true); } }
          catch { if (active.current) setFailed(true); }
          finally { flight.current = false; if (active.current) setSaving(false); }
        };
        const blocked = view.status !== 'ready' || view.writable !== true || saving;
        if (!SettingsForm || !SettingsSecretField) return h('p', { role: 'status', className: 'at_error' }, '当前 Harness 原生凭据表单不可用，请更新宿主后重试。');
        return h('div', { className: 'at_settings' }, h('h2', null, '连接凭据'), h('p', { className: 'at_muted' }, '使用 Slack 应用的 Bot Token。只在宿主的原生配置中保存，不进入项目材料、能力包或聊天。空白保留已有值。'),
          h(SettingsForm, { labels: { unavailable: '原生配置尚未就绪，请稍后重新打开设置。', readOnly: '当前宿主配置只读。', saveFailed: '保存结果未确认，请重新读取原生配置后核对。', save: '保存凭据', saving: '正在保存…' }, state: { available: view.status === 'ready', writable: view.writable === true, dirty: draft !== undefined, invalid: draft !== undefined && draft !== null && (typeof draft !== 'string' || draft.length > 16384), saving, failed }, onSave: save, onDiscard: discard },
            h(SettingsSecretField, { id: 'agent-twin-slack-token', label: 'Slack Bot Token', hint: '新值只用于替换；旧值不回显。', text: typeof draft === 'string' ? draft : '', disabled: blocked, onEdit: stage, configured: twin.snapshot?.runtime?.transportConfigured === true, stateLabel: draft === null ? '保存后清除' : twin.snapshot?.runtime?.transportConfigured ? '已配置，不回显' : '尚未确认配置' }),
            h('button', { type: 'button', disabled: blocked, onClick: () => stage(null) }, '清除现有凭据')),
          h('p', { className: 'at_notice' }, '保存凭据后，回到“通道连接”分别核验读取和回传。配置成功不等于已经发出消息。'));
      }
      function Workbench() {
        const view = useTwin(), s = view.snapshot;
        const [tab, setTab] = React.useState('overview'), [modal, setModal] = React.useState(null), [localError, setLocalError] = React.useState('');
        const [selectedSources, setSelectedSources] = React.useState([]);
        const [projectChoice, setProjectChoice] = React.useState('');
        const writable = Boolean(s && !view.busy && !view.stale && !view.uncertain);
        const button = (label, onClick, props = {}) => h('button', { type: 'button', disabled: !writable, onClick, ...props }, label);
        const open = (kind, data) => { setLocalError(''); setModal({ kind, data, projectBinding: projectBinding(s?.project), requestId: ['daily-report-input', 'capture-input'].includes(kind) ? requestId() : undefined, key: `${kind}-${Date.now()}` }); if (kind === 'project') { setProjectChoice(s?.project?.projectId ?? ''); void client.loadProjects(); } if (kind === 'sources') setSelectedSources([...(s?.materials?.entries ?? [])]); };
        const close = () => { if (!view.busy) { if (modal?.kind === 'sources') setSelectedSources([]); setModal(null); setLocalError(''); } };
        const run = async (action, payload = {}, closeOnSuccess = false) => { setLocalError(''); const ok = await client.command(action, payload); if (ok && closeOnSuccess) setModal(null); return ok; };
        const submit = (action, build, closeOnSuccess = true) => async event => { event.preventDefault(); try { const payload = build(new FormData(event.currentTarget)); await run(action, payload, closeOnSuccess); } catch (failure) { setLocalError(failure.message || '请核对输入内容。'); } };
        const field = (label, name, value = '', options = {}) => { const { multiline, hint, ...props } = options; return h('label', { className: 'at_field' }, h('span', null, label), h(multiline ? 'textarea' : 'input', { name, defaultValue: value ?? '', disabled: !writable, ...props }), hint ? h('small', { className: 'at_muted' }, hint) : null); };
        const select = (label, name, value, choices, props = {}) => h('label', { className: 'at_field' }, h('span', null, label), h('select', { name, defaultValue: value, disabled: !writable, ...props }, ...choices.map(([key, label]) => h('option', { value: key, key }, label))));
        const actions = (...children) => h('div', { className: 'at_actions' }, ...children);
        const section = (title, ...children) => h('section', { className: 'at_section' }, h('h3', null, title), ...children);
        const empty = text => h('p', { className: 'at_empty' }, text);
        const badge = (label, good = false) => h('span', { className: `at_badge ${good ? 'at_good' : ''}` }, label);
        const scopeNames = values => (values ?? []).map(x => ({ __explicit_scope_required__: '待主人确认范围', __scope_routing_unavailable__: '范围识别待核对' })[x] ?? scopes.find(([key]) => key === x)?.[1] ?? ability.adopted?.cards?.find(card => card.id === x)?.title ?? x).join('、') || '尚无授权';
        const formActions = (label = '保存') => h('div', { className: 'at_form_actions' }, button('取消', close, { disabled: view.busy }), h('button', { type: 'submit', disabled: !writable, className: 'at_primary' }, view.busy ? '处理中…' : label));
        const project = s?.project, readiness = s?.readiness ?? {}, materials = s?.materials ?? {}, ability = s?.ability ?? {}, channel = s?.channel ?? {}, rules = s?.rules?.config ?? {};
        const workbench = s?.workbench ?? {}, reports = Array.isArray(workbench.reports) ? workbench.reports : [], captures = Array.isArray(workbench.captures) ? workbench.captures : [];
        const inventory = Array.isArray(materials.inventory) ? materials.inventory : materials.inventory?.entries ?? [];
        const selectableFiles = formats => inventory.filter(item => typeof item.path === 'string' && formats.includes(item.path.split('.').pop().toLowerCase()) && !['excluded', 'directory', 'unreadable'].includes(item.kind));
        const workStatus = status => ({ running: '正在生成，等待结果', completed: '本地已生成', failed: '执行失败', submitting: '正在提交，等待结果', pending: '待审阅', adopting: '采纳结果待核对', adopted: '已采纳为正式来源' })[status] ?? textState(status);
        const archiveLocation = kind => workbench.archive?.root ? `${workbench.archive.root}/${kind}/` : null;
        const archiveNotice = kind => archiveLocation(kind) ? h('p', { className: 'at_muted' }, `已归档 ${workbench.archive.counts?.[kind] ?? 0} 条 · 项目内私有归档：${archiveLocation(kind)}。原文件保留，归档后可继续创建。`) : null;
        const readyMap = { project: readiness.project, ability: readiness.ability, channels: readiness.channels, rules: readiness.rules };
        const moduleCopy = {
          project: ['准备可复用的项目土壤', project ? `${materials.entries?.length ?? 0} 个显式来源 · ${textState(materials.status)}` : '选择服务项目、专用会话和材料读取范围'],
          ability: ['把项目材料变成可交付能力', ability.adopted ? `采用版 v${ability.adopted.version ?? 1} · ${ability.adopted.staleCardIds?.length ? `${ability.adopted.staleCardIds.length} 项需更新` : textState(ability.status)}` : '蒸馏候选、试跑，并明确采用'],
          channels: ['让同事直接找到分身', channel.config?.platform ? `${channel.config.platform} · ${textState(channel.status)}` : '正规授权后核验读取和回传'],
          rules: ['规定服务谁、能做什么', `${s?.identities?.length ?? 0} 个已登记身份 · 默认无权`],
        };
        const moduleCards = () => h('div', { className: 'at_grid at_grid4' }, ...tabs.slice(1).map(([id, label], i) => h('article', { className: 'at_card', key: id }, h('div', { className: 'at_module_head' }, h('span', { className: 'at_num' }, `0${i + 1}`), h('h3', null, label)), badge(readyMap[id] ? '已就绪' : '待完善', readyMap[id]), h('p', { className: 'at_muted' }, moduleCopy[id][1]), actions(button(s?.service?.everEnabled ? '查看与管理' : '继续准备', () => setTab(id), { disabled: false })))));
        const taskRows = tasks => tasks.length ? h('div', { className: 'at_tablewrap' }, h('table', null, h('thead', null, h('tr', null, ...['任务', '执行状态', '发送状态', '更新时间', ''].map(t => h('th', { key: t }, t)))), h('tbody', null, ...tasks.map(task => h('tr', { key: task.id }, h('td', null, h('strong', null, task.text ?? task.request?.text ?? task.title ?? task.id), h('p', { className: 'at_muted' }, `${task.senderId ?? task.request?.senderId ?? '身份未知'} · ${scopeNames([task.scope ?? task.request?.scope])}`)), h('td', null, badge(taskState(task))), h('td', null, textState(s.outbox.find(item => item.id === task.deliveryId)?.status ?? task.delivery?.status ?? 'unknown')), h('td', { className: 'at_muted' }, date(task.updatedAt ?? task.createdAt)), h('td', null, button('查看', () => open('task', task), { disabled: false }))))))) : empty('还没有接单记录。启用后，通道中的授权请求会记在这里；也可以提交一次真实试单。');
        function Overview() {
          const daily = s.service.everEnabled;
          if (!daily) {
            const next = tabs.slice(1).find(([id]) => !readyMap[id])?.[0];
            return h('div', null, h('div', { className: 'at_title' }, h('div', null, h('h2', null, '让分身从一个项目开始'), h('p', { className: 'at_muted' }, '先准备材料，再蒸馏能力、连通消息和设定服务规则。四个部分今后也会一直保留。')), badge(`${Object.values(readyMap).filter(Boolean).length} / 4 已就绪`)), moduleCards(),
              h('div', { className: 'at_notice' }, h('strong', null, next ? `下一步：${tabs.find(([id]) => id === next)?.[1]}` : '四部分已就绪，核对后启用'), h('p', null, ((readiness.gaps ?? []).find(x => x.module === next) ? gapText((readiness.gaps ?? []).find(x => x.module === next)) : null) || '整理与试跑不会自动接单。启用前由你核对服务项目、对象和消息目的地。')),
              actions(next ? button('继续准备', () => setTab(next), { className: 'at_primary', disabled: false }) : button('核对并启用分身', () => open('enable'), { className: 'at_primary', disabled: !writable || !readiness.canEnable })),
              section('服务状态', h('p', { className: 'at_muted' }, '目前未接单。已保存的准备进度会在下次打开时继续。'), runtimeNotice()));
          }
          const counts = [s.tasks.filter(t => t.status === 'queued' || t.status === 'ready' && t.request?.action !== 'draft').length, s.tasks.filter(t => t.status === 'needs_approval').length, s.tasks.filter(t => t.status === 'delivery_unknown').length, s.tasks.filter(t => t.status === 'sent').length];
          return h('div', null, h('div', { className: 'at_title' }, h('div', null, h('h2', null, s.service.enabled ? '分身正在值班' : '分身已暂停'), h('p', { className: 'at_muted' }, '查看本次工作、审批和发送回执，也可以继续维护四部分配置。')), actions(s.service.enabled ? button('暂停接单', () => run('pause')) : button('核对后恢复', () => open('enable'), { className: 'at_primary', disabled: !writable || !readiness.canEnable }), button('提交一次试单', () => open('request'), { disabled: !writable || !s.service.enabled }))),
            h('div', { className: 'at_metrics' }, ...counts.map((n, i) => h('div', { className: 'at_metric', key: i }, h('strong', null, n), h('span', { className: 'at_muted' }, ['正在处理', '等待审批', '发送待核查', '通道报告已发出'][i])))), moduleCards(),
            section('需要关注与最近任务', taskRows([...s.tasks].sort((a, b) => { const rank = t => ['needs_approval', 'delivery_unknown', 'blocked', 'failed'].includes(t.status) ? 0 : 1; return rank(a) - rank(b) || String(b.updatedAt ?? b.createdAt).localeCompare(String(a.updatedAt ?? a.createdAt)); }).slice(0, 12))),
            section('服务健康', h('div', { className: 'at_grid' }, h('div', null, h('h3', null, '消息与执行'), h('p', { className: 'at_muted' }, `最近轮询：${date(s.service.lastTickAt)}`), h('p', { className: 'at_muted' }, `计划间隔：${rules.intervalMinutes ?? 10} 分钟 · 每轮最多 ${rules.maxTasksPerTick ?? 5} 件`), actions(button('立即检查一次', () => run('tick'), { disabled: !writable || !s.service.enabled }))), h('div', null, runtimeNotice()))), section('活动记录', eventList()));
        }
        function runtimeNotice() { return h('div', null, h('p', { className: 'at_muted' }, `执行器：${s.runtime.executorConfigured ? '宿主执行器已连接' : '尚未配置'} · 消息适配器：${s.runtime.transportConfigured ? '已配置' : '尚未配置'}`), h('p', { className: 'at_muted' }, '本地 Harness 与电脑需要持续在线。通道已发出与收件人实际收到、已读分别记录。')); }
        function eventList() { return (s.events ?? []).length ? [...s.events].reverse().slice(0, 15).map((event, i) => h('div', { className: 'at_row', key: event.id ?? i }, h('div', null, h('strong', null, eventLabels[event.type] ?? '服务记录已更新，请在相关模块查看详情。')), h('span', { className: 'at_muted' }, date(event.at ?? event.createdAt)))) : empty('尚无活动记录。'); }
        function ProjectView() {
          return h('div', null, h('div', { className: 'at_title' }, h('div', null, h('h2', null, '项目沉淀'), h('p', { className: 'at_muted' }, '先明确目标与机制，再从你选择的材料中整理 Context、SOP、判断、工具和成果。')), button(project ? '修改项目与框架' : '选择项目与会话', () => open('project'), { className: 'at_primary' })),
            h('div', { className: 'at_grid' }, h('article', { className: 'at_card' }, h('h3', null, '项目目标与关键机制'), project ? h('div', null, h('p', null, project.goal), h('p', { className: 'at_muted' }, project.mechanism), h('p', { className: 'at_muted' }, `目录：${project.cwd}`), h('p', { className: 'at_muted' }, `服务会话：${project.sessionId}`)) : empty('尚未绑定项目。切换宿主会话不会替分身绑定。')), h('article', { className: 'at_card' }, h('h3', null, '材料读取范围'), h('p', { className: 'at_muted' }, `${materials.entries?.length ?? 0} 个显式选择的文本来源；目录盘点只读取文件元数据。`), actions(button('盘点项目文件', () => run('inventory', { roots: ['.'] }), { disabled: !writable || !project }), button('选择来源', () => open('sources'), { disabled: !writable || !project }), button('整理选中材料', () => run('organize'), { className: 'at_primary', disabled: !writable || !materials.entries?.length || !s.runtime.executorConfigured })))),
            project?.structure ? section('已建立的项目沉淀结构', structureView(project.structure)) : null,
            captureSection(),
            section('整理结果', materials.packet ? h('div', null, h('p', { className: 'at_muted' }, `来源指纹：${fingerprint(materials.fingerprint)} · ${textState(materials.status)}`), packetView(materials.packet)) : empty('尚未整理。先选择来源，再让执行器把零散材料整理成可检查的项目资产。')),
            section('当前来源', ...(materials.entries ?? []).map(path => h('div', { className: 'at_row', key: path }, h('span', { className: 'at_version' }, path))), !materials.entries?.length ? empty('还没有授权读取任何文件。') : null),
            materials.issues?.length ? section('待补与排除项', ...materials.issues.map((issue, i) => h('p', { className: 'at_muted', key: i }, `${issue.path ? `${issue.path}：` : ''}${issue.message ?? issue.code ?? issue}`))) : null);
        }
        function captureSection() {
          return section('材料回流', h('p', { className: 'at_muted' }, '把一次工作的笔记、决策或复盘提交为待审材料。审阅正文并明确采纳后，才会保存为正式来源。'),
            actions(button('提交工作材料', () => open('capture-input'), { className: 'at_primary', disabled: !writable || !project })),
            h('p', { className: 'at_notice' }, '采纳材料不会自动更新分身能力。加入来源选择后，仍需整理、蒸馏、试跑并采用新能力版，才能用于之后的任务。'),
            captures.length ? [...captures].reverse().map(item => h('article', { className: 'at_row', key: item.id }, h('div', null, h('strong', null, item.entry), h('p', { className: 'at_muted' }, `${workStatus(item.status)} · ${date(item.createdAt)}`), item.source ? h('p', { className: 'at_version' }, `正式来源：${item.source}`) : null, item.error ? h('p', { className: 'at_error at_muted' }, item.error.message ?? item.error.code) : null), actions(
              ['pending', 'adopted'].includes(item.status) ? button('审阅材料', async () => { if (await run('capture_review', { id: item.id })) open('capture-review', { id: item.id }); }) : null,
              item.status === 'submitting' ? button('核对并继续提交', () => run('capture_submit', { entry: item.entry, requestId: item.requestId })) : null,
              item.status === 'adopting' ? button('继续已确认的采纳', () => run('capture_adopt', { id: item.id, confirmation: 'adopt' })) : null,
              item.status === 'adopted' ? button('归档记录', () => open('archive-record', { kind: 'captures', id: item.id })) : null,
              item.status === 'adopted' && item.source ? button(materials.entries?.includes(item.source) ? '已在读取范围' : '加入来源选择', () => run('select_sources', { entries: [...new Set([...(materials.entries ?? []), item.source])] }), { disabled: !writable || materials.entries?.includes(item.source) || (materials.entries?.length ?? 0) >= 16 }) : null))) : empty('还没有回流材料。每次提交、审阅和采纳的状态会保留在本机。'),
            archiveNotice('captures'),
            (materials.entries?.length ?? 0) >= 16 ? h('p', { className: 'at_muted' }, '读取范围已达 16 个来源；请先在“选择来源”中调整，再加入新材料。') : null);
        }
        function reportSummary(report) {
          const warningLabels = { column_count: '列数不符合要求', missing_value: '缺少必填值', invalid_date: '日期无效', invalid_nonnegative_number: '订单数或金额不是有效非负数' };
          return h('div', null,
            report.totals ? h('div', { className: 'at_metrics' }, ...[['orders', '订单数'], ['revenue', '收入'], ['cost', '成本'], ['margin', '收入减成本']].map(([key, label]) => h('div', { className: 'at_metric', key, style: { minWidth: 0 } }, h('strong', { style: { fontSize: 'clamp(16px, 2vw, 25px)', overflowWrap: 'anywhere' } }, report.totals[key] ?? '未记录'), h('span', { className: 'at_muted' }, label)))) : null,
            report.acceptedRows !== undefined ? h('p', { className: 'at_muted' }, `有效行 ${report.acceptedRows} · 排除行 ${report.rejectedRows ?? '未记录'}。只汇总有效行，金额单位沿用输入；重复行会累加，不推断订单去重。`) : null,
            report.warnings?.length ? h('details', { open: true, className: 'at_notice at_warning' }, h('summary', null, '数据检查与排除项'), h('ul', null, ...report.warnings.map((warning, i) => h('li', { key: i }, `第 ${warning.row} 行：${warningLabels[warning.code] ?? warning.code}；未计入汇总。`)))) : report.status === 'completed' ? h('p', { className: 'at_muted' }, '本次未记录数据校验异常。') : null,
            report.error ? h('p', { className: 'at_error' }, report.error.message ?? report.error.code) : null);
        }
        function dailyReportSection() {
          const latest = [...reports].reverse().find(item => item.status === 'completed');
          return section('本地日报', h('p', { className: 'at_muted' }, '选择项目内的 CSV，生成订单数、收入、成本汇总，并检查异常行。结果只保存在本地，未发送。'),
            actions(button('选择 CSV 生成日报', () => open('daily-report-input'), { className: 'at_primary', disabled: !writable || !project })),
            latest ? h('div', { className: 'at_card', style: { marginTop: 16 } }, h('h3', null, '最近一次完成的汇总'), h('p', { className: 'at_muted' }, `${latest.entry} · ${date(latest.completedAt ?? latest.createdAt)}`), reportSummary(latest)) : null,
            h('h3', { style: { marginTop: 20 } }, '日报历史'), reports.length ? [...reports].reverse().map(item => h('div', { className: 'at_row', key: item.id }, h('div', null, h('strong', null, item.entry), h('p', { className: 'at_muted' }, `${workStatus(item.status)} · ${date(item.createdAt)} · 未发送`), item.error ? h('p', { className: 'at_error at_muted' }, item.error.message ?? item.error.code) : null), actions(button('查看日报', () => open('daily-report', { id: item.id }), { disabled: false }), item.status === 'completed' ? button('归档记录', () => open('archive-record', { kind: 'reports', id: item.id })) : null, item.status === 'running' ? button('核对并继续生成', () => run('run_daily_report', { entry: item.entry, requestId: item.requestId })) : null))) : empty('活动列表中还没有日报。首次准备和日常管理都可从这里生成，重新打开后继续查看历史。'), archiveNotice('reports'));
        }
        function structureView(structure) {
          const labels = { context: '事实背景、决策依据与复盘', sop: '高频流程、异常与验收', skills: '可复用能力与适用边界', tools: '连接、权限与实际可用状态', outputs: '成果、大礼包与原始依据索引' };
          const root = String(structure.root ?? '');
          return h('div', null, h('p', { className: 'at_muted' }, `真实位置：${project.cwd}/${root}`),
            h('div', { className: 'at_grid' }, h('div', null, ...(structure.files ?? []).map(file => h('div', { className: 'at_row', key: file }, h('div', null, h('strong', { className: 'at_version' }, `${root}/${file}`), h('p', { className: 'at_muted' }, ({ 'PROJECT.md': '项目目标、核心机制与验收标准', 'INDEX.md': 'Context、SOP、Skill、工具和成果的统一索引', 'CAPTURE.md': '每次工作后的确认、归档与能力更新流程' })[file] ?? '项目资料'))))), h('div', null, ...(structure.directories ?? []).map(directory => h('div', { className: 'at_row', key: directory }, h('div', null, h('strong', { className: 'at_version' }, `${root}/${directory}/`), h('p', { className: 'at_muted' }, labels[directory] ?? '项目沉淀目录')))))),
            h('p', { className: 'at_muted' }, `本次建架回执：新建 ${structure.created?.length ?? 0} 个文件，更新 ${structure.updated?.length ?? 0} 个，保留 ${structure.preserved?.length ?? 0} 个手工编辑文件。`),
            structure.preserved?.length ? h('p', { className: 'at_notice' }, `保留手工修改：${structure.preserved.join('、')}。不会自动覆盖你的独立编辑。`) : h('p', { className: 'at_muted' }, '后续手工编辑的文件会保留。目录与工作规范已经建立，具体项目内容仍需在日常工作中持续补充。'),
            actions(button('盘点沉淀目录', () => run('inventory', { roots: [root] }), { disabled: !writable || !root }), button('选择沉淀材料作为来源', async () => { if (await run('inventory', { roots: [root] })) open('sources'); }, { disabled: !writable || !root })));
        }
        function trialReady(test) { return test?.passed === true && typeof test.output === 'string' && test.output.trim().length > 0 && typeof test.outputFingerprint === 'string' && test.outputFingerprint.length > 0; }
        function trialView(test, adoptedAt) {
          if (!test) return empty('还没有实际试跑记录。');
          return h('div', null, h('p', { className: 'at_muted' }, `${trialReady(test) ? adoptedAt ? '试跑通过，已明确采用' : '已生成实际草稿，待你验收' : '试跑尚未通过，不能采用'} · ${date(test.checkedAt)}`),
            test.reason ? h('p', { className: 'at_notice at_warning' }, reasons[test.reason] ?? test.reason) : null,
            h('h3', { className: 'at_section' }, '这次试跑任务'), h('pre', null, test.prompt || '未记录实际任务'), h('h3', { className: 'at_section' }, '实际试跑草稿'), h('pre', null, test.output || '尚未生成有效草稿；不能据此判断可交付。'),
            h('p', { className: 'at_muted' }, '此次仅使用候选中的已确认卡片生成草稿，不外发，不执行工具或改写外部系统。请核对内容、来源和适用边界。'),
            test.outputFingerprint ? h('p', { className: 'at_version' }, `草稿标识 ${fingerprint(test.outputFingerprint)}`) : null,
            h('details', { className: 'at_section', open: !test.passed }, h('summary', null, '卡片来源与边界审查'), ...(test.cases ?? []).map((entry, i) => h('div', { className: 'at_row', key: i }, h('div', null, h('strong', null, `${entry.cardId ?? entry.name ?? `检查 ${i + 1}`} · ${entry.passed === true ? '通过' : '未通过'}`), h('p', { className: 'at_muted' }, entry.reason || '未记录具体审查依据'))))));
        }
        function packetView(packet) {
          const items = packet.materials ?? [];
          return h('div', null, items.length ? items.map((item, i) => h('div', { className: 'at_row', key: item.id ?? i }, h('div', null, h('strong', null, item.title ?? item.name ?? materialKinds[item.kind] ?? '项目材料'), h('p', { className: 'at_muted' }, item.summary ?? item.content ?? item.description ?? ''), item.sourceRefs?.length ? h('p', { className: 'at_muted' }, `${item.sourceRefs.length} 条来源依据`) : null), badge(materialKinds[item.kind] ?? '项目材料'))) : h('pre', null, JSON.stringify(packet.project ?? packet, null, 2)),
            packet.gaps?.length ? h('div', { className: 'at_notice' }, h('strong', null, '仍需补充'), h('ul', null, ...packet.gaps.map((gap, i) => h('li', { key: i }, gap.message ?? gap.description ?? gap.question ?? gap.title ?? String(gap))))) : null);
        }
        function bundleView(bundle, label) {
          return h('article', { className: 'at_card' }, h('div', { className: 'at_between' }, h('h3', null, label), badge(`v${bundle.version ?? 1}`)), h('p', { className: 'at_muted' }, `${bundle.cards?.length ?? 0} 项能力 · ${scopeNames(bundle.scopes)}`), bundle.staleCardIds?.length ? h('p', { className: 'at_warning at_muted' }, `${bundle.staleCardIds.length} 项来源有变化，等待更新`) : null, bundle.candidateCardIds?.length ? h('p', { className: 'at_muted' }, `${bundle.candidateCardIds.length}项内容仍待确认，未用于在线任务`) : null, h('p', { className: 'at_version' }, `来源 ${fingerprint(bundle.fingerprint)}`), h('p', { className: 'at_muted' }, trialReady(bundle.test) && bundle.adoptedAt ? '试跑通过，已明确采用' : `试跑：${!bundle.test ? '尚未实跑' : trialReady(bundle.test) ? '已生成实际草稿，待验收' : '缺少有效实跑产出'}`), actions(button('查看能力与依据', () => open('bundle', bundle), { disabled: false })));
        }
        function AbilityView() {
          return h('div', null, h('div', { className: 'at_title' }, h('div', null, h('h2', null, '分身能力'), h('p', { className: 'at_muted' }, '项目材料持续更新，运行中的分身只使用你明确采用的能力版。候选不会覆盖采用版。')), button('生成新候选', () => run('distill'), { className: 'at_primary', disabled: !writable || !materials.packet || !s.runtime.executorConfigured })),
            dailyReportSection(),
            h('div', { className: 'at_grid' }, ability.adopted ? bundleView(ability.adopted, '当前采用版') : h('article', { className: 'at_card' }, h('h3', null, '当前采用版'), empty('尚未采用任何能力包。')), ability.candidate ? h('div', null, bundleView(ability.candidate, '待复核候选'), h('div', { className: 'at_notice' }, actions(button('对候选执行试跑', () => open('candidate-trial'), { disabled: !writable || !s.runtime.executorConfigured }), button('核对并采用', () => open('adopt'), { className: 'at_primary', disabled: !writable || !trialReady(ability.candidate.test) })))) : h('article', { className: 'at_card' }, h('h3', null, '待复核候选'), empty('整理项目材料后，生成带来源依据的候选能力。'))),
            ability.candidate?.test ? section('候选实际试跑记录', trialView(ability.candidate.test)) : null,
            ability.status === 'stale' || ability.adopted?.staleCardIds?.length ? h('div', { className: 'at_notice at_warning' }, '来源已变化。受影响任务会暂停；原采用版和历史记录继续保留。请重新整理、蒸馏和复核。') : null,
            section('已采用的版本', (ability.history ?? []).length ? [...ability.history].reverse().map((bundle, i) => h('div', { className: 'at_row', key: bundle.id ?? i }, h('div', null, h('strong', null, `v${bundle.version ?? i + 1}`), h('p', { className: 'at_muted' }, `${fingerprint(bundle.fingerprint)} · ${date(bundle.adoptedAt ?? bundle.createdAt)}`)), button('查看版本', () => open('bundle', bundle), { disabled: false }))) : empty('还没有历史采用版。')));
        }
        function ChannelsView() {
          const config = channel.config ?? {};
          return h('div', null, h('div', { className: 'at_title' }, h('div', null, h('h2', null, '通道连接'), h('p', { className: 'at_muted' }, '配置、读取核验、回传测试和对方收到是不同状态。每一步都保留独立回执。')), actions(button('连接凭据', () => open('credentials'), { disabled: false }), button('修改连接与路由', () => open('channel'), { className: 'at_primary' }))),
            h('div', { className: 'at_grid' }, h('article', { className: 'at_card' }, h('h3', null, 'Slack'), h('p', { className: 'at_muted' }, config.platform ? `工作区 ${config.tenantId || '由核验结果确认'} · ${textState(channel.status)}` : '尚未配置 Slack 应用和目的地'), h('p', { className: 'at_muted' }, `读取频道：${config.allowedChannelIds?.join('、') || '尚未指定'}`), h('p', { className: 'at_muted' }, `允许发送：${config.allowedDestinationIds?.join('、') || '尚未指定'}`), h('p', { className: 'at_muted' }, `所有者通知：${config.ownerDestinationId || '尚未指定'}`), actions(button('核验读取', () => run('probe_channel'), { disabled: !writable || !config.platform || !s.runtime.transportConfigured }), button(channel.delivery?.status === 'sent' ? '回传已核验' : '核对回传测试', () => open('delivery-test'), { disabled: !writable || !config.platform || !s.runtime.transportConfigured || ['sent', 'unknown', 'sending'].includes(channel.delivery?.status) }), ['unknown', 'failed'].includes(channel.delivery?.status) ? button('核查原测试记录', () => run('check_delivery', {})) : null)), h('article', { className: 'at_card' }, h('h3', null, '真实连接状态'), h('div', { className: 'at_row' }, h('span', null, '凭据配置'), badge(s.runtime.transportConfigured ? '已保存，不回显' : '未确认', s.runtime.transportConfigured)), h('div', { className: 'at_row' }, h('span', null, '读取核验'), badge(textState(channel.probe), channel.probe?.status === 'verified' && channel.probe?.readVerified === true)), h('div', { className: 'at_row' }, h('span', null, '回传测试'), badge(textState(channel.delivery), channel.delivery?.status === 'sent')), h('p', { className: 'at_muted' }, 'Slack 通道回执不证明本人已收到或已读。掉线不删除配置和历史。'))),
            channel.gaps?.length ? section('当前读取缺口', ...channel.gaps.map((gap, i) => h('p', { className: 'at_notice at_warning', key: i }, ({ thread_permission_required: '缺少线程读取权限，请补齐 Slack 授权后重新核验。', thread_tracking_limit: '线程跟踪范围达到上限，服务已暂停；请收窄读取范围后复核。', channel_read_gap: '部分频道或线程没有完成读取，服务已暂停；请检查连接并重新核验。' })[gap.code] ?? gap.message ?? gap.code))) : null,
            channel.threadCoverage ? h('p', { className: 'at_muted' }, `线程跟踪覆盖：${channel.threadCoverage.tracked} / ${channel.threadCoverage.limit} · ${textState(channel.threadCoverage.status)}`) : null,
            section('回传记录', s.outbox.length ? [...s.outbox].reverse().slice(0, 20).map((item, i) => h('div', { className: 'at_row', key: item.id ?? i }, h('div', null, h('strong', null, `${({ channel_test: '连接测试', owner_review: '所有者升级通知', task: '任务交付' })[item.kind] ?? '投递'} · ${item.taskId ?? item.id}`), h('p', { className: 'at_muted' }, `${item.destinationId ?? '目的地待核对'} · ${textState(item.status)}`)), h('div', null, h('span', { className: 'at_muted' }, date(item.updatedAt ?? item.createdAt)), ['unknown', 'failed'].includes(item.status) ? actions(button('核查原记录', () => run('check_delivery', { deliveryId: item.id }))) : null))) : empty('尚无发送记录。')), section('其他通道', h('p', { className: 'at_muted' }, '当前版本实现 Slack 适配器。其他平台需有正式 API 与对应适配器后，才能接入相同服务机制。')));
        }
        function RulesView() {
          return h('div', null, h('div', { className: 'at_title' }, h('div', null, h('h2', null, '身份与规则'), h('p', { className: 'at_muted' }, '先识别平台身份，再限定知识范围、动作和目的地。没有登记的来客默认无权。')), actions(button('添加服务身份', () => open('identity')), button('编辑服务规则', () => open('rules')))),
            h('div', { className: 'at_grid' }, h('article', { className: 'at_card' }, h('h3', null, '运行节奏与升级'), h('p', null, `每 ${rules.intervalMinutes ?? 10} 分钟检查 · 每轮最多 ${rules.maxTasksPerTick ?? 5} 件`), h('p', { className: 'at_muted' }, `外发审批：${rules.requireApproval === false ? '按身份长期授权执行' : '每次外发需批准'}`), h('p', { className: 'at_muted' }, `升级通知：${rules.ownerDestinationId || '尚未设置'}`), actions(button('试跑权限规则', () => run('test_rules'), { disabled: !writable || !ability.adopted || !s.identities.length || !rules.ownerDestinationId || !readiness.channels }), s.rules.test ? button('查看试跑记录', () => open('rule-test'), { disabled: false }) : null, badge(readiness.rules ? '当前规则已复核' : '需要复核', readiness.rules))), h('article', { className: 'at_card' }, h('h3', null, '接单状态'), h('p', null, s.service.enabled ? '正在接单' : s.service.everEnabled ? '已暂停，配置与历史保留' : '尚未正式启用'), actions(s.service.enabled ? button('暂停接单', () => run('pause')) : button('核对并启用', () => open('enable'), { className: 'at_primary', disabled: !writable || !readiness.canEnable })), h('p', { className: 'at_muted' }, '保存规则不会自动启用。权限或来源变更后，受影响动作先暂停再复核。'))),
            section('服务身份', s.identities.length ? h('div', { className: 'at_tablewrap' }, h('table', null, h('thead', null, h('tr', null, ...['身份', '可用知识范围', '允许动作与目的地', ''].map(label => h('th', { key: label }, label)))), h('tbody', null, ...s.identities.map(person => h('tr', { key: person.id }, h('td', null, h('strong', null, person.name), h('p', { className: 'at_muted' }, `${person.senderId} · ${person.enabled ? person.role || '服务对象' : '已停用'}`)), h('td', null, scopeNames(person.scopes)), h('td', null, (person.actions ?? []).map(x => ({ read: '读取', draft: '生成草稿', reply: '回复' })[x] ?? x).join('、') || '无权', h('p', { className: 'at_muted' }, person.destinationIds?.join('、') || '尚无目的地')), h('td', null, button('管理', () => open('identity', person)))))))) : empty('还没有服务身份。请使用平台稳定 ID 登记；显示名称不作为权限依据。')),
            section('待审批任务', taskRows(s.tasks.filter(t => t.status === 'needs_approval'))));
        }
        function modalContent() {
          if (!modal || !s) return null;
          const kind = modal.kind, row = modal.data;
          if (['sources', 'daily-report-input', 'daily-report', 'capture-input', 'capture-review', 'archive-record'].includes(kind) && modal.projectBinding !== projectBinding(project)) return h('p', { className: 'at_notice' }, '服务项目已变化，请关闭此窗口后重新选择当前项目的文件。');
          if (kind === 'archive-record') {
            const item = (row.kind === 'reports' ? reports : captures).find(item => item.id === row.id);
            if (!item) return empty('这条记录已不在当前项目活动列表中，请刷新核对。');
            const eligible = row.kind === 'reports' ? item.status === 'completed' : item.status === 'adopted';
            return h('div', null, h('p', null, `归档「${item.entry}」的这条记录？`), h('p', { className: 'at_notice' }, '归档后从活动列表移出，原文件和完整记录继续保留，腾出位置供日常工作使用。重复的旧请求仍会核对原记录。'),
              item.output || item.source ? h('p', { className: 'at_version' }, `原文件：${item.output ?? item.source}`) : null,
              archiveLocation(row.kind) ? h('p', { className: 'at_version' }, `归档目录：${archiveLocation(row.kind)}`) : null,
              row.kind === 'captures' ? h('p', { className: 'at_muted' }, '已选择的来源继续保留；可在“选择来源”中管理。需要加入其他已归档材料时，先盘点项目文件。') : null,
              h('div', { className: 'at_form_actions' }, button('取消', close, { disabled: view.busy }), button('确认归档记录', () => run('archive_workbench', { kind: row.kind, id: item.id }, true), { className: 'at_primary', disabled: !writable || !eligible })));
          }
          if (kind === 'daily-report-input' || kind === 'capture-input') {
            const daily = kind === 'daily-report-input', formats = daily ? ['csv'] : ['md', 'txt'];
            return h('div', null, h('p', { className: 'at_muted' }, `项目目录：${project?.cwd ?? '未绑定'}`),
              h('p', { className: 'at_notice' }, daily ? 'CSV 表头必须依次为 date,orders,revenue,cost，日期为 YYYY-MM-DD，订单数为非负整数，金额为非负数且最多两位小数。最多 1000 行、256 KiB；金额单位须一致。生成结果仅保存在本地，未发送。' : '选择一份 .md / .txt 工作材料（最多 60 KiB）。提交只生成待审记录；先审阅正文，再由你明确采纳。'),
              button('刷新文件列表', () => run('inventory', { roots: ['.'] })),
              h('form', { onSubmit: submit(daily ? 'run_daily_report' : 'capture_submit', data => {
                const selected = String(data.get('entrySelection') ?? '').trim(), typed = String(data.get('entry') ?? '').trim();
                if (selected && typed) throw new Error('请选择列表文件或填写相对路径其中一项，避免读取错误文件。');
                const entry = selected || typed;
                if (!entry) throw new Error('请明确选择一个文件，或填写项目内相对路径。');
                if (/^(?:[A-Za-z]:|[\\/])/.test(entry) || entry.includes('\\') || entry.includes('\0') || entry.split('/').some(part => !part || part.startsWith('.'))) throw new Error('请使用项目内相对路径，不含隐藏目录、绝对路径或上级目录。');
                if (!formats.includes(entry.split('.').pop().toLowerCase())) throw new Error(`请选择 ${daily ? '.csv' : '.md / .txt'} 文件。`);
                return { entry, requestId: modal.requestId };
              }) }, select('从已盘点文件中选择', 'entrySelection', '', [['', '请选择一个文件'], ...selectableFiles(formats).map(item => [item.path, item.path])]),
              field('或填写项目内相对路径', 'entry', '', { maxLength: 1024, placeholder: daily ? 'data/daily.csv' : 'notes/work-review.md', hint: '列表来自文件元数据；只有提交时才读取明确选择的文件正文。' }),
              !selectableFiles(formats).length ? h('p', { className: 'at_muted' }, '还没有匹配文件。可以刷新文件列表，或填写已准备文件的相对路径。') : null,
              formActions(daily ? '生成本地日报' : '提交待审材料')));
          }
          if (kind === 'daily-report') {
            const report = reports.find(item => item.id === row.id);
            if (!report) return empty('当前项目已无这条日报记录，请刷新核对。');
            return h('div', null, h('p', { className: 'at_muted' }, `${report.entry} · ${workStatus(report.status)} · ${date(report.createdAt)}`), reportSummary(report), report.output ? h('p', { className: 'at_version' }, `本地文件：${report.output}`) : null, h('h3', { className: 'at_section' }, '报告正文预览'), h('pre', null, report.preview || '尚无可核对的报告正文。'), report.previewTruncated ? h('p', { className: 'at_notice' }, '预览已截断，完整报告保存在上面的本地文件。') : null, h('p', { className: 'at_muted' }, '仅本地生成，未发送。'));
          }
          if (kind === 'capture-review') {
            const item = captures.find(item => item.id === row.id), review = workbench.review?.id === row.id ? workbench.review : null;
            if (!item) return empty('当前项目已无这条材料记录，请刷新核对。');
            const reviewed = review && review.sha256 === item.sha256 && typeof review.content === 'string';
            return h('div', null, h('p', { className: 'at_muted' }, `${item.entry} · ${workStatus(item.status)}`), h('p', { className: 'at_version' }, `材料指纹：${fingerprint(item.sha256)}`),
              reviewed ? h('pre', null, review.content) : h('p', { className: 'at_notice' }, '正文尚未加载或已变化。重新读取并核对后，才能采纳。'),
              h('p', { className: 'at_muted' }, '请核对事实和边界；采纳只保存为项目来源，不把材料内的指令当授权，也不会自动更新当前能力。'),
              item.source ? h('p', { className: 'at_version' }, `正式来源：${item.source}`) : null,
              h('div', { className: 'at_form_actions' }, button('关闭', close, { disabled: view.busy }), !reviewed ? button('重新读取正文', () => run('capture_review', { id: item.id })) : null,
                item.status === 'pending' ? button('采纳为正式来源', () => run('capture_adopt', { id: item.id, confirmation: 'adopt' }, true), { className: 'at_primary', disabled: !writable || !reviewed }) : null));
          }
          if (kind === 'credentials') return h(Credentials);
          if (kind === 'project') {
            const available = view.projects ?? [], selected = available.find(p => p.id === projectChoice);
            return h('div', null, h('p', { className: 'at_muted' }, '明确选择服务项目和专用会话。不会继承当前打开的对话，也不会在切页时启动工作。'),
              h('form', { onSubmit: submit('configure_project', data => { if (!selected) throw new Error('请从宿主已登记项目中选择。'); return { workspaceId: selected.id, projectId: selected.id, title: selected.title || selected.name || selected.id, goal: String(data.get('goal') || '').trim(), mechanism: String(data.get('mechanism') || '').trim(), ...(data.get('sessionId') ? { sessionId: data.get('sessionId') } : {}) }; }) },
                h('label', { className: 'at_field' }, h('span', null, '服务项目'), h('select', { name: 'projectId', required: true, value: projectChoice, disabled: !writable, onChange: e => setProjectChoice(e.target.value) }, h('option', { value: '' }, '请选择项目'), ...available.map(p => h('option', { key: p.id, value: p.id }, p.title || p.name || p.id)))),
                selected ? h('p', { className: 'at_muted' }, `目录：${selected.cwd}`) : h('p', { className: 'at_muted' }, '项目列表来自 Harness 本地工作区登记；不会搜索私人聊天。'),
                selected ? select('服务会话', 'sessionId', selected.id === project?.projectId ? project.sessionId : '', [['', '新建一个专用服务会话'], ...(selected.sessions ?? []).map(x => [x.id, x.title || x.id]), ...(selected.id === project?.projectId && project?.sessionId && !(selected.sessions ?? []).some(x => x.id === project.sessionId) ? [[project.sessionId, `当前已绑定服务会话 · ${project.sessionId}`]] : [])], { key: selected.id }) : null,
                h('div', { key: selected?.id ?? 'unselected' }, field('项目目标', 'goal', selected?.id === project?.projectId ? project?.goal : '', { required: true, maxLength: 2000, multiline: true, placeholder: '这个项目要解决什么问题、交付什么结果？' }), field('关键机制与验收方式', 'mechanism', selected?.id === project?.projectId ? project?.mechanism : '', { required: true, maxLength: 4000, multiline: true, placeholder: '核心工作如何推进，什么算做完，哪些事情必须找你？' })),
                project ? h('p', { className: 'at_notice' }, '修改目标、机制、绑定或来源后，相关能力和权限试跑需要重新复核；历史记录保留。') : null, formActions('确认绑定并保存框架')),
              !available.length ? button('刷新项目列表', () => client.loadProjects(), { disabled: view.busy }) : null);
          }
          if (kind === 'sources') {
            const entries = [...new Map([...(materials.entries ?? []).map(path => ({ path })), ...captures.filter(item => item.status === 'adopted' && item.source).map(item => ({ path: item.source, modifiedAt: item.adoptedAt })), ...selectableFiles(['md', 'txt'])].map(item => [item.path, item])).values()];
            return h('div', null, h('p', { className: 'at_muted' }, '盘点只读元数据。勾选并保存后，整理步骤才会读取这些文本正文；最多选择 16 个来源。敏感路径、符号链接和非文本材料会被排除。'),
              h('div', { className: 'at_source_list' }, ...entries.map(item => h('label', { className: 'at_check', key: item.path }, h('input', { type: 'checkbox', checked: selectedSources.includes(item.path), disabled: !writable || !selectedSources.includes(item.path) && selectedSources.length >= 16, onChange: e => setSelectedSources(current => e.target.checked ? [...current, item.path] : current.filter(x => x !== item.path)) }), h('span', null, item.path, h('small', null, `${typeof item.sizeBytes === 'number' ? `${item.sizeBytes} 字节` : '来源元数据待盘点'} · ${date(item.modifiedAt)}`)))), !entries.length ? empty('还没有可选择的文本来源。先盘点项目文件，或在项目目录中准备 .md / .txt 材料。') : null),
              h('p', { className: 'at_muted' }, `已选 ${selectedSources.length} / 16`), h('div', { className: 'at_form_actions' }, button('取消', close, { disabled: view.busy }), button('保存读取范围', () => run('select_sources', { entries: selectedSources }, true), { className: 'at_primary', disabled: !writable || !selectedSources.length })));
          }
          if (kind === 'candidate-trial') return h('div', null, h('p', { className: 'at_muted' }, '给候选一个具体小活：先审查卡片，再使用当前候选生成实际草稿。全程不外发，不自动采用。'), h('form', { onSubmit: submit('test_candidate', data => ({ prompt: String(data.get('prompt') || '').trim() }), false) }, field('试跑任务', 'prompt', ability.candidate?.test?.prompt || '请基于项目材料交付一份小结，说明能提供的帮助、依据，以及一个需要主人确认的限制。', { required: true, multiline: true, maxLength: 8000 }), formActions('执行真实试跑（不外发）')), ability.candidate?.test ? section('本次实际试跑', trialView(ability.candidate.test)) : null);
          if (kind === 'bundle') return h('div', null, h('p', { className: 'at_muted' }, `v${row.version ?? 1} · ${fingerprint(row.fingerprint)}`), ...(row.cards ?? []).map((card, i) => h('div', { className: 'at_section', key: card.id ?? i }, h('div', { className: 'at_between' }, h('h3', null, card.title ?? card.name ?? card.id), badge(scopes.find(([key]) => key === card.kind)?.[1] ?? card.kind)), h('p', { className: 'at_muted' }, card.status === 'documented' ? '有材料明确支持' : '候选，尚未作为可用事实'), h('pre', null, card.content ?? card.summary ?? JSON.stringify(card, null, 2)), card.when ? h('p', { className: 'at_muted' }, `适用：${card.when}`) : null, card.limits ? h('p', { className: 'at_muted' }, `边界：${card.limits}`) : null, card.sourceRefs?.length ? h('p', { className: 'at_muted' }, `来源：${card.sourceRefs.map(source => `${source.sourcePath ?? source.sourceId}:${source.startLine}–${source.endLine}`).join('；')}`) : null)), row.test ? section('实际试跑记录', trialView(row.test, row.adoptedAt)) : null);
          if (kind === 'adopt') return h('div', null, h('p', null, `采用候选 v${ability.candidate?.version ?? 1}，用于之后的新任务？`), h('p', { className: 'at_muted' }, `来源：${fingerprint(ability.candidate?.fingerprint)} · ${ability.candidate?.cards?.length ?? 0} 项能力。原版保留，旧任务不改标成新版。采用后还需要复核当前身份规则。`), h('div', { className: 'at_form_actions' }, button('取消', close, { disabled: view.busy }), button('确认采用', () => run('adopt_candidate', {}, true), { className: 'at_primary' })));
          if (kind === 'channel') {
            const config = channel.config ?? {};
            const ids = value => String(value ?? '').split(/[\s,，]+/).filter(Boolean);
            return h('form', { onSubmit: submit('configure_channel', data => ({ platform: 'slack', tenantId: String(data.get('tenantId') || '').trim(), ownerId: String(data.get('ownerId') || '').trim(), ownerDestinationId: String(data.get('ownerDestinationId') || '').trim(), allowedChannelIds: ids(data.get('allowedChannelIds')), allowedDestinationIds: ids(data.get('allowedDestinationIds')) })) },
              h('p', { className: 'at_muted' }, '使用 Slack 的稳定工作区、用户和会话 ID。读取与外发范围分别限定；凭据在“连接凭据”原生配置表单保存。'), field('工作区 ID（可选，核验时确认）', 'tenantId', config.tenantId, { maxLength: 100 }), field('所有者 Slack 用户 ID', 'ownerId', config.ownerId, { required: true, maxLength: 100, placeholder: 'U…' }), field('所有者接收通知的私聊 ID', 'ownerDestinationId', config.ownerDestinationId, { required: true, maxLength: 100, placeholder: 'D…', hint: '必须是机器人与上述所有者的私聊，不能使用普通频道或其他人的私聊。' }), field('允许读取的频道 ID', 'allowedChannelIds', (config.allowedChannelIds ?? []).join('\n'), { required: true, multiline: true, maxLength: 2000, hint: '每行一个，或用逗号分隔。只读取明确列出的频道。' }), field('允许外发的目的地 ID', 'allowedDestinationIds', (config.allowedDestinationIds ?? []).join('\n'), { required: true, multiline: true, maxLength: 2000, hint: '必须包含上面的所有者通知目的地。身份仍需单独授权。' }), formActions('保存连接与路由'));
          }
          if (kind === 'delivery-test') return h('div', null, h('p', null, '向所有者目的地发送一条连接测试消息？'), h('p', { className: 'at_muted' }, `目的地：${channel.config?.ownerDestinationId || '尚未配置'}。这是一次真实外发；接收和已读需由本人核对。`), h('div', { className: 'at_form_actions' }, button('取消', close, { disabled: view.busy }), button('确认发送测试', () => run('test_delivery', {}, true), { className: 'at_primary' })));
          if (kind === 'identity') {
            const person = row ?? {};
            return h('form', { onSubmit: submit('save_identity', data => {
              const expiresAt = String(data.get('expiresAt') ?? '').trim();
              if (expiresAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(expiresAt) || !Number.isFinite(Date.parse(expiresAt)))) throw new Error('有效期须为带时区的 ISO 日期，例如 2026-12-31T23:59:59+08:00；留空可明确取消到期限制。');
              return { ...(person.id ? { id: person.id } : {}), senderId: String(data.get('senderId') || '').trim(), name: String(data.get('name') || '').trim(), role: String(data.get('role') || 'colleague').trim(), scopes: data.getAll('scopes'), actions: data.getAll('actions'), destinationIds: String(data.get('destinationIds') || '').split(/[\s,，]+/).filter(Boolean), enabled: data.get('enabled') === 'on', expiresAt };
            }) },
              h('p', { className: 'at_muted' }, '新身份从无权开始。权限绑定平台 sender ID；Agent 与机器人仍须逐一授权，不自动回应自身或其他未知机器人。保存后需重新试跑。'), field('显示名称', 'name', person.name, { required: true, maxLength: 100 }), field('Slack sender ID', 'senderId', person.senderId, { required: true, maxLength: 100 }), select('身份类型', 'role', person.role || 'colleague', [['colleague', '同事'], ['agent', '同事的 Agent'], ['bot', '明确授权的机器人'], ...(!person.role || ['colleague', 'agent', 'bot'].includes(person.role) ? [] : [[person.role, person.role]])]),
              field('授权有效期截止（含时区，可留空）', 'expiresAt', person.expiresAt ?? '', { type: 'text', maxLength: 100, placeholder: '2026-12-31T23:59:59+08:00', hint: '使用 ISO 日期并明确 Z 或时区偏移；原时间（包括已过期时间）会保留。留空并保存表示取消到期限制。' }),
              h('div', { className: 'at_twocol' }, h('fieldset', { style: { border: 0, padding: 0, minWidth: 0 } }, h('legend', { className: 'at_muted' }, '可用知识范围'), ...[...scopes, ...(ability.adopted?.cards ?? []).map(card => [card.id, `单项：${card.title}`])].map(([id, label]) => h('label', { className: 'at_check', key: id }, h('input', { type: 'checkbox', name: 'scopes', value: id, defaultChecked: person.scopes?.includes(id) ?? false, disabled: !writable }), label))), h('fieldset', { style: { border: 0, padding: 0 } }, h('legend', { className: 'at_muted' }, '允许动作'), ...[['read', '读取范围内信息'], ['draft', '生成待审草稿'], ['reply', '向允许目的地回复']].map(([id, label]) => h('label', { className: 'at_check', key: id }, h('input', { type: 'checkbox', name: 'actions', value: id, defaultChecked: person.actions?.includes(id) ?? false, disabled: !writable }), label)))),
              field('允许回复的目的地 ID', 'destinationIds', (person.destinationIds ?? []).join('\n'), { multiline: true, maxLength: 2000, hint: '每行一个；必须同时在通道允许列表中。' }), h('label', { className: 'at_check' }, h('input', { type: 'checkbox', name: 'enabled', defaultChecked: person.enabled ?? false, disabled: !writable }), '启用这条身份授权'), formActions(person.id ? '保存身份规则' : '保存身份'));
          }
          if (kind === 'rules') return h('form', { onSubmit: submit('save_rules', data => ({ intervalMinutes: Number(data.get('intervalMinutes')), maxTasksPerTick: Number(data.get('maxTasksPerTick')), ownerDestinationId: String(data.get('ownerDestinationId') || '').trim(), requireApproval: data.get('requireApproval') === 'on', quietHours: String(data.get('quietHours') || '').trim() })) },
            h('p', { className: 'at_muted' }, '先从小范围和逐次审批开始。越权、失败和不确定交付保留记录，由你处理。'), field('检查间隔（分钟）', 'intervalMinutes', rules.intervalMinutes ?? 10, { required: true, type: 'number', min: 1, max: 1440 }), field('每轮最多处理任务', 'maxTasksPerTick', rules.maxTasksPerTick ?? 5, { required: true, type: 'number', min: 1, max: 30 }), field('所有者升级通知的私聊 ID', 'ownerDestinationId', rules.ownerDestinationId ?? channel.config?.ownerDestinationId, { required: true, maxLength: 100, placeholder: 'D…', hint: '必须与通道配置中已核验的所有者私聊一致。' }), h('p', { className: 'at_muted' }, '当前版本按固定间隔运行；尚未支持免打扰时段。'), h('label', { className: 'at_check' }, h('input', { type: 'checkbox', name: 'requireApproval', defaultChecked: rules.requireApproval !== false, disabled: !writable }), '每次外发均要求所有者审批'), formActions('保存服务规则'));
          if (kind === 'enable') return h('div', null, h('p', null, '核对以下范围后，允许分身开始接单？'), h('div', { className: 'at_notice' }, h('p', null, `项目：${project?.title ?? '尚未绑定'}`), h('p', null, `服务会话：${project?.sessionId ?? '尚未绑定'}`), h('p', null, `能力采用版：${ability.adopted ? `v${ability.adopted.version ?? 1}` : '尚未采用'}`), h('p', null, `服务身份：${s.identities.filter(p => p.enabled).map(p => p.name).join('、') || '无'}`), h('p', null, `允许频道：${channel.config?.allowedChannelIds?.join('、') || '无'}`), h('p', null, `所有者升级：${rules.ownerDestinationId || '未设'}`)), !readiness.canEnable ? h('ul', { className: 'at_error' }, ...(readiness.gaps ?? []).map((gap, i) => h('li', { key: i }, gapText(gap)))) : h('p', { className: 'at_muted' }, '需要电脑与 Harness 在线。启用后按既定节奏检查；修改规则仍需复核。'), h('div', { className: 'at_form_actions' }, button('返回检查', close, { disabled: view.busy }), button('确认启用接单', () => run('enable', {}, true), { className: 'at_primary', disabled: !writable || !readiness.canEnable })));
          if (kind === 'rule-test') return h('div', null, h('p', { className: 'at_muted' }, `${textState(s.rules.test)} · ${date(s.rules.test?.checkedAt)}`), h('pre', null, JSON.stringify(s.rules.test?.cases ?? [], null, 2)));
          if (kind === 'request') return h('form', { onSubmit: submit('submit_request', data => ({ senderId: String(data.get('senderId')), destinationId: String(data.get('destinationId')).trim(), text: String(data.get('text')).trim(), scope: String(data.get('scope')), action: String(data.get('action')) })) }, h('p', { className: 'at_muted' }, '按这条真实身份与目的地校验权限，并写入同一任务台账。生成与发送依照规则分别推进。'), select('服务身份', 'senderId', '', [['', '选择已登记身份'], ...s.identities.filter(p => p.enabled).map(p => [p.senderId, `${p.name} · ${p.senderId}`])], { required: true }), field('交付目的地 ID', 'destinationId', '', { required: true, maxLength: 100 }), select('知识范围', 'scope', ability.adopted?.scopes?.[0] ?? 'knowledge', scopes.filter(([key]) => ability.adopted?.scopes?.includes(key))), select('本次动作', 'action', 'draft', [['draft', '生成待审草稿'], ['reply', '生成并按规则回复']]), field('具体任务', 'text', '', { required: true, multiline: true, maxLength: 4000 }), formActions('提交到真实任务台账'));
          if (kind === 'task') {
            const task = s.tasks.find(t => t.id === row.id) ?? row, destination = task.destinationId ?? task.request?.destinationId;
            const delivery = s.outbox.find(item => item.id === task.deliveryId);
            return h('div', null, h('p', { className: 'at_muted' }, `${task.id} · ${taskState(task)}`), h('pre', null, task.text ?? task.request?.text ?? ''), h('p', { className: 'at_muted' }, `身份：${task.senderId ?? task.request?.senderId} · 目的地：${destination}`), h('p', { className: 'at_muted' }, `本次能力依据：${fingerprint(task.context?.cardFingerprint)} · 范围：${scopeNames([task.scope ?? task.request?.scope])}`), task.reason || task.blockReason || task.error ? h('p', { className: 'at_notice at_warning' }, reasons[task.reason] ?? task.blockReason ?? task.error?.message ?? task.error ?? task.reason) : null,
              h('h3', { className: 'at_section' }, '本次产出'), h('pre', null, task.output?.text ?? task.output ?? task.result?.text ?? task.reply ?? '尚无可交付产出。'), h('p', { className: 'at_muted' }, `发送：${textState(delivery?.status ?? task.delivery?.status ?? 'unknown')}。实际收到与已读未确认。`),
              h('div', { className: 'at_actions', style: { marginTop: 20 } }, task.status === 'queued' ? button('执行生成', () => run('task_step', { taskId: task.id })) : null, task.status === 'needs_approval' ? button('批准本次目的地外发', () => run('approve', { taskId: task.id, destinationId: destination }), { className: 'at_primary' }) : null, task.status === 'needs_approval' ? button('拒绝本次', () => run('deny', { taskId: task.id })) : null, task.status === 'ready' && task.request?.action !== 'draft' ? button('交付到已授权目的地', () => run('task_step', { taskId: task.id }), { className: 'at_primary' }) : null, ['delivery_unknown', 'sent', 'failed'].includes(task.status) && task.deliveryId ? button('核查原发送记录', () => run('check_delivery', { taskId: task.id })) : null, ['blocked', 'failed'].includes(task.status) ? button('按当前来源重新生成', () => run('regenerate', { taskId: task.id }), { disabled: !writable || !readiness.rules || !readiness.ability }) : null, delivery?.status === 'failed' && delivery.checkedNegative === true ? button('核对后重试交付', () => open('retry', task)) : null));
          }
          if (kind === 'retry') return h('div', null, h('p', null, '已核查原记录，确认上一次没有发出？'), h('p', { className: 'at_muted' }, '只对已查证失败的原任务重试，保留同一条投递记录；未知状态不能自动重发。'), h('div', { className: 'at_form_actions' }, button('返回', () => open('task', row)), button('确认未发出，重试此条', () => run('retry_delivery', { taskId: row.id, confirmNotSent: true }, true), { className: 'at_primary' })));
          return null;
        }
        const modalTitles = { project: '绑定项目与沉淀框架', 'daily-report-input': '选择日报输入文件', 'daily-report': '本地日报结果', 'capture-input': '提交待审工作材料', 'capture-review': '审阅并采纳工作材料', 'archive-record': '归档工作记录', 'candidate-trial': '给候选一项实际工作', sources: '选择项目材料读取范围', bundle: '能力内容与来源依据', adopt: '采用候选能力', credentials: 'AI 分身连接凭据', channel: 'Slack 连接与路由', 'delivery-test': '真实回传测试', identity: modal?.data ? '管理服务身份' : '新增服务身份', rules: '服务运行规则', enable: '启用前核对', request: '提交一次真实试单', task: '任务、审批与发送记录', 'rule-test': '当前权限试跑记录', retry: '核对原投递后重试' };
        return h('main', { className: 'at_native', 'data-agent-twin-workbench': true }, h('div', { className: 'at_inner' },
          h('header', { className: 'at_header' }, h('div', null, h('div', { className: 'at_kicker' }, 'AI TWIN'), h('h1', null, 'AI 分身'), h('p', { className: 'at_muted' }, '从日常项目沉淀，到持续在线服务')), actions(s ? badge(s.service.enabled ? '接单中' : s.service.everEnabled ? '已暂停' : '首次准备', s.service.enabled) : null, button(view.busy ? '正在处理…' : '刷新', () => client.refresh(), { disabled: view.busy }), button('连接凭据', () => open('credentials'), { disabled: false }), project ? button('打开服务会话', async () => { try { if (typeof ctx.uiWorkspace?.openSession !== 'function') throw new Error('原生会话入口暂不可用。'); await ctx.uiWorkspace.openSession(project.sessionId); ctx.layout.selectPanel(null); } catch (failure) { setLocalError(failure.message || '服务会话未能打开，请在宿主项目列表核对。'); } }, { disabled: view.busy }) : null)),
          h('div', { className: 'at_binding' }, h('span', null, `服务项目：${project?.title ?? '未绑定'}`), h('span', null, `专用会话：${project?.sessionId ?? '未绑定'}`), h('span', null, '页面导航不会切换宿主会话或自动提交任务')),
          h('nav', { className: 'at_tabs', 'aria-label': '分身管理' }, ...tabs.map(([id, label]) => button(label, () => setTab(id), { disabled: false, key: id, 'aria-current': tab === id ? 'page' : undefined }))),
          view.error ? h('div', { className: 'at_notice at_error', role: 'alert' }, view.error) : null, !modal && localError ? h('p', { className: 'at_notice at_error', role: 'alert' }, localError) : null,
          view.stale && s ? h('p', { className: 'at_notice' }, '当前保留上次读取的状态，操作已暂停。刷新核对后再继续。') : null,
          s ? tab === 'overview' ? h(Overview) : tab === 'project' ? h(ProjectView) : tab === 'ability' ? h(AbilityView) : tab === 'channels' ? h(ChannelsView) : h(RulesView) : empty(view.error ? '未取得分身状态。请确认插件在本地 Harness 中启用，再点击刷新。' : '正在读取本地分身配置与任务记录…'),
          h('footer', { className: 'at_footer' }, s ? `宿主状态修订 ${s.revision} · ${s.service.everEnabled ? '日常管理' : '准备进度保存在本机'} · 打开页面只查询状态，不会主动接单。` : '仅连接当前 Harness 的同源分身服务。')),
          modal ? h(Modal, { key: modal.key, open: true, title: modalTitles[modal.kind] ?? '分身管理', closeLabel: '关闭分身弹窗', className: 'at_modal', onClose: close }, view.error ? h('div', { className: 'at_notice at_error', role: 'alert' }, h('p', null, view.error), actions(button('刷新并核对状态', () => client.refresh(), { disabled: view.busy }))) : null, localError ? h('p', { className: 'at_error', role: 'alert' }, localError) : null, modalContent()) : null);
      }
      function SettingsSection(props) {
        return h('div', null, h(Credentials), h('div', { className: 'at_settings' }, h('h2', null, '分身项目与服务'), h('p', { className: 'at_muted' }, '材料、能力、通道和权限在同一分身管理页持续维护。'), h('div', { className: 'at_actions' }, h('button', { type: 'button', onClick: () => { props.close?.(); ctx.layout.selectPanel(panelId); } }, '打开 AI 分身'))));
      }
      ctx.effect(() => ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: panelId }, Workbench)));
      ctx.effect(() => ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: panelId, label: 'AI 分身', order: 6 }, TwinIcon)));
      ctx.effect(() => ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: panelId, label: 'AI 分身', order: 40 }, SettingsSection)));
      ctx.effect(() => ctx.slots.inject('plugins.row.config', () => ctx.slots.register({ name: 'plugins.row.config', key: 'dsh-agent-twin#agent-twin-starter' }, props => props.view === 'summary' ? '项目沉淀、分身能力、Slack 通道与服务权限' : h(Credentials))));
    }
    return { inject, apply, createTwinClient, validSnapshot };
  },
});
