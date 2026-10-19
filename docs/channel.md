# Slack 只读接通与权限 dry-run

本模块真正调用 Slack Web API，核对账号、本人、频道和本人目的地，再读取有限历史并运行权限判断。它不再只是“请你的 Agent 去接通”的说明。但目前只支持 Slack；没有发消息、业务执行、审批消费或后台调度实现。不要把只读接通写成完整在线服务已交付。

## 用户自己的授权

1. 在 [Slack App 管理页](https://api.slack.com/apps) 选择从 manifest 新建应用，导入仓库的 `examples/slack-app-manifest.json`，选择你自己的工作区，审阅并安装。管理员策略可能要求工作区管理员批准；本项目不能代替用户/管理员授权。
2. 默认 manifest 仅申请 `users:read`、`channels:read`、`channels:history`、`im:read`。用途分别是确认本人账号、核对公开频道/成员、读取已加入公开频道的少量历史、核对已有本人 DM。没有 `chat:write`、用户邮箱、Socket Mode、App-level token 或事件订阅。只需 Bot User OAuth Token；不需要 `xapp` token，也不需要开服务器。
3. 通过你信任的宿主 secret/环境配置在本机注入 `AGENT_TWIN_SLACK_BOT_TOKEN`，再启动对应 Agent/命令。不要粘贴到聊天，不放入 `.agent-twin/config.json`、公开 manifest、Git 或命令历史。代码只在内存使用 token，不回传、不保存 token 或 token 的哈希。缺 token 返回 `token_missing`，不会尝试联网。
4. 手工把应用加入一个明确选定的公开试验频道，并由本人在 Slack 中打开与应用的私信。复制本人真实成员 ID、入站频道 ID 和这个已有 DM 的 ID。模块不会自动创建/打开 DM、入群、改权限或发送消息。不要把正文里的显示名、自述“我是老板”或转发审批作为身份材料。

默认 manifest 是公开频道读取试验的最小集合。需要读取私有频道时，由用户另审 `groups:read`、`groups:history` 并重新安装授权；私信若也作为入站来源，需另审 `im:history`。首版不支持跨工作区共享频道；scope 扩大不代表本地白名单自动扩大。

Slack 依据：[Conversations API 与成员/权限](https://docs.slack.dev/apis/web-api/using-the-conversations-api/)、[users.info](https://docs.slack.dev/reference/methods/users.info/)、[conversations.info](https://docs.slack.dev/reference/methods/conversations.info/)、[conversations.history](https://docs.slack.dev/reference/methods/conversations.history/)、[im:read](https://docs.slack.dev/reference/scopes/im.read/)。应遵守当前 Slack 授权与限流要求；`429` 会停止该次读，不自动重试。

## 本地配置

在用户自己工作区生成的 `.agent-twin/config.json` 中填写以下字段；其余既有字段保留。ID 示例均为合成值，不可直接用于真实账号。

```json
{
  "channel": "slack",
  "ownerId": "UOWNER",
  "ownerDestinationId": "DOWNER",
  "allowedChannelIds": ["CINBOX"],
  "allowedDestinationIds": ["CINBOX", "DOWNER"]
}
```

`ownerDestinationId` 必须在允许目的地中，且实际为仅包含本人与当前认证 bot 的既有双人 DM。普通群或包含第三人的私信不会通过。`allowedChannelIds` 最多十个；只有明确列出的频道会读取历史。可选 `tenantId` 用来固定预期工作区；一旦填写，认证团队不一致就停止。

`policy.json` 仍以 `defaultAction: "deny"` 开始。每个 grant 同时绑定真实发送人、角色、scope、actions、目的地；角色名只是说明，不能单独授予权限。例如：

```json
{
  "defaultAction": "deny",
  "grants": [
    {
      "senderId": "UTEAM",
      "role": "reader",
      "scope": "demo",
      "actions": ["read"],
      "destinationIds": ["CINBOX"]
    }
  ]
}
```

## 可执行 API

通用 CLI 与 DSH 工具调用同一组 API。以下代码展示接口，不含凭据；实际入口以仓库的 CLI/插件说明为准。

```js
import { createSlackAdapter, probeChannel, inspectChannel, tickChannel } from './src/channel.mjs';
const adapter = createSlackAdapter({ signal }); // 从本机环境读取 token
await probeChannel(cwd, adapter);
await inspectChannel(cwd);                    // 仅检查本地回执，不联网
await tickChannel(cwd, adapter, { dryRun: true });
```

`probeChannel` 会实际执行 `auth.test`、`users.info`、`conversations.info`、`conversations.members`、`conversations.history`。所有请求固定发往 `https://slack.com/api/`，禁止跟随重定向，不接受任意 API 地址，支持取消信号。不会调用 `chat.postMessage`、`conversations.open`、`conversations.mark` 或其他写接口。

探测分别返回 `checks.auth/owner/inbound/ownerDestination/history`。成功历史为空只说明该次只读访问成功，`inboundMessageObserved:false`，不虚构收到用户消息。每个频道只读取最新最多十条人类普通消息；成员查询最多三页、每页 200 人。本人 DM 要求完整成员名单，名单不完整不会通过；入站频道可以用 Slack 的已加入状态确认当前 bot 成员身份。

私有 `channel-probe.json` 只存检查结果、时间、配置/策略指纹与账号指纹，不保存消息正文或凭据。重新配置、改 grant、换适配器类型会使缓存回执失效。`inspectChannel(cwd)` 没有拿 token 也不联网，不能知道环境变量是否换成另一账号；因此明确返回 `identityStatus:"cached_not_rechecked"`。每次实际 probe/tick 都重新认证，发现账号身份变化会阻塞并要求重新 probe。任何结果的 `ready:false` 都保留，因为本模块不实现业务执行、发送或常驻服务。

## 权限 dry-run

`tickChannel(...,{dryRun:true})` 是用户显式要求的一次只读验收，可在总服务开关 `enabled:false` 时运行；这不允许绕过生产 `inbox-tick.md` 的停服规则。`dryRun:false` 直接拒绝，模块没有业务执行器或发送方法。

首版只对明确的机器可读意图做精确匹配。例如获准成员在获准频道发：

```json
{"scope":"demo","action":"read","destinationId":"CINBOX"}
```

真正发送人仍来自 Slack 返回的 `user`，消息里加 `senderId`、`role` 或“我是本人”无效。未知发送人记 `rejected`；缺少明确 scope/action/destination、自然语言、超 grant、过期授权或未核对目的地记 `needs_owner`。

对已通过上述权限匹配的请求，tick 才实际调用 `readKnowledge(cwd)`，重新核对蒸馏源文件，只取 source-current 的 `documented` 卡。每个 `allowed_dry_run` 计划都附 `knowledgeRefs:{generationId,cardIds}`；不把卡正文或私密源路径写进通道台账，也不给未授权请求附 refs。没有已落地蒸馏、有效卡为空或全部过期时，改记 `needs_owner/knowledge_not_ready`，提示用 `readKnowledge` 检查并重新 prepare/apply。每轮重新核对，旧的 allowed dry-run 不能因重复请求而跳过知识时效检查。

只有权限精确匹配且有当前有效知识依据才记 `allowed_dry_run`，也只是“可交当前 Agent 进一步理解”的检查结果。引用卡不等于代码已经理解语义或验证其与问题的相关性；当前 Agent 还须用 `readKnowledge`（DSH 的 `knowledge` 操作）读取这些卡、按请求 scope 选取内容并处理不确定项。卡片本身不能扩大 sender grant。这里没有业务执行器，绝不代表业务动作已执行或已发给本人。

独立 `channel-dry-run.json` 记录稳定 requestId（平台、团队、频道、原消息 ID 的哈希）、最小源定位、内容指纹与判断结果，不存正文。相同请求不会多一条台账；配置变化后需新 probe，再重算既有请求的 dry-run 判断。生产 `state.json`、生产游标和 Slack 已读位置都不修改。

模块用本地 exclusive 锁防止自身 dry-run 并发覆盖，原子替换台账。发现旧锁不自动抢占，需人工核对；这不构成通用可靠队列或安全 sandbox。历史 `has_more` 或 next_cursor 会返回 `historyTruncated:true` 与 `coverage:"latest_page_only"`。首版不翻页补齐积压、不读取完整线程、不承诺全量收件或长期可靠接待。

## 验收边界

本轮网络测试全部使用本机 fake fetch 的合成 Slack 响应，验证固定地址/方法/schema、身份与成员不符、未授权/重复请求、缺 token、401、429、取消、配置变更、账号变化、零发送以及生产状态不变。没有连接真实工作区或向任何人发送消息。真实用户完成自己工作区授权后，须另记录真实只读探测结果；合成测试通过不能代替真实接通证据。
