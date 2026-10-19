# 在 DeepSeek Harness 中安装

按三步搭建分身：先从自己的工作项目中蒸馏知识、判断、流程和工具用法，再连接自己的消息通道，最后设置人员权限与本人决策边界。

`0.2.0` 已提供显式选材、来源行号与内容哈希、私有知识卡片、源文件变化检查，以及 Slack 的只读身份/范围核验和收件分流 dry run。卡片语义由当前 Agent 提炼，工具负责限定读取范围、核对来源并落盘。没有开通自动外发、业务执行或常驻调度。

本版面向官方 DeepSeek Harness `0.2.1-rc.2`、Node.js 22+。以下工具和参数已从该版本官方 Desktop 安装包的代码核对；其他版本需重新验证。插件安装、项目初始化、渠道接通和后台运行是四个独立状态。

## 给 Harness 的一句话

本版预定固定下载地址如下；只有对应 Release 及校验和实际发布并核验后，安装口令才可对外使用：

```text
https://github.com/piggy00544/ai-twin-starter/releases/download/v0.2.0/dsh-agent-twin-0.2.0.tgz
```

> 请阅读 https://github.com/piggy00544/ai-twin-starter 的 README，安装并启用 https://github.com/piggy00544/ai-twin-starter/releases/download/v0.2.0/dsh-agent-twin-0.2.0.tgz ，按“蒸馏项目能力→连接消息通道→设置权限”的顺序帮我搭分身。只读取我选定的材料；令牌留在本地，连接先做只读核验，再做权限分流 dry run。暂不对外发送、执行业务或启动定时服务。

宿主的正式工具调用如下。先 `list_bundles` 取得已安装的准确包名，避免重复安装或擅自卸载旧版。

```json
{"action":"list_bundles","limit":100}
```

```json
{"action":"install_bundle","target":"https://github.com/piggy00544/ai-twin-starter/releases/download/v0.2.0/dsh-agent-twin-0.2.0.tgz","enabled":true}
```

以上是 `plugin_manager` 的参数。当前宿主接受 npm 包、Git 地址、HTTP(S) `.tgz` 及本地绝对路径。推荐固定版本 Release 的预构建 `.tgz`，同时核对 Release 中的 `SHA256SUMS`；本包没有安装时脚本。正式包名可从同一 Release 的 `package.json` 核对。

该工具要求宿主的 `danger-full-access` 权限或本次调用的批准；安装的 Host 代码运行在工作区沙箱之外。用户需要在 Harness 自己的批准流程中授权，插件不修改权限模式，也不绕过审批。若宿主报告 `pendingBuilds`，须先解释具体包的安装脚本并取得批准，不能自行传 `approvedBuilds` 放行。版本不兼容时换兼容版，不自动加版本豁免。

安装返回后，再调用 `plugin_manager` 的 `list_bundles` 和 `list_plugins`。只有变更结果的 `application` 为 `applied`，且回读该包及其组件已启用、没有失败，才报告安装成功。`restart-required` 按宿主 `nextStep` 处理；保存、下载、登记为 dependency 或关闭安装框都不代表已启用。不要为了这一步打断正在运行的任务。

核查依据：[官方插件管理工具](https://github.com/deepseek-ai/deepseek-harness/blob/332895e0f7c9d4dbfb29729f5eb367fa263ff986/packages/boot/plugin-manager/src/tools.ts)、[官方安装地址解析](https://github.com/deepseek-ai/deepseek-harness/blob/332895e0f7c9d4dbfb29729f5eb367fa263ff986/packages/boot/plugin-manager/src/install-spec.ts)。核对版本的 Desktop build commit 为 `332895e0f7c9d4dbfb29729f5eb367fa263ff986`。

## 第一步：蒸馏分身

插件启用后，先在要搭建分身的当前工作项目中调用 `agent_twin`：

```json
{"operation":"init"}
```

```json
{"operation":"distill_prepare","entries":["README.md","notes/working-method.md"]}
```

```json
{"operation":"distill_apply","batchId":"使用prepare返回的batchId","cards":[{"id":"delivery-check","kind":"workflow","title":"交付前检查","content":"根据选定材料提炼的实际流程。","when":"交付前","limits":"来源记载与实际执行验收分开。","sourceRefs":[{"sourceId":"使用prepare返回的sourceId","startLine":1,"endLine":2}],"status":"documented"}]}
```

`entries` 必须是用户明确选择的当前项目内相对 `.md/.txt` 文件。只准备这些材料，不扫描目录、不读取账号凭据或私密聊天。prepare 向当前 Agent 返回所选正文、来源 ID 和行号；原文不会因此进入公开包。Agent 再提炼四类卡片：`knowledge`（知识）、`judgment`（判断）、`workflow`（流程）、`tool`（工具用法），说明适用情形 `when`、限制 `limits` 和确切 `sourceRefs`。已有记载用 `documented`，尚需验证的推断用 `candidate`；不把抽取成功写成实际能力验收。

apply 核对批次、来源哈希、引用行号与卡片格式后，保存到本地私有 `.agent-twin` 中。`distill_status` 查看沉淀状态；`distill_refresh` 只检查来源变化，报告受影响卡片，不自动重新写卡。材料变化后重新prepare和提炼，保留人的判断。

使用沉淀内容前调用只读操作 `knowledge_read`。它实际读取当前有效的 `documented` 卡片，排除来源失效和 `candidate` 内容；源材料改动后，旧卡不会继续作为有效知识返回。当前 Agent 只在来客获准的scope内使用卡片，不能把整个私有包或来源材料转发给来客。这个本地读取入口没有替代身份核验或宿主权限。

```json
{"operation":"knowledge_read"}
```

## 第二步：连接通道

本版直接使用 Slack Web API 的只读适配器，不假定已经安装其他 Slack 插件。用户仍要在自己的 Slack 工作区创建/授权应用、安装机器人，并提供对应的最小读取权限。插件不替用户接受授权、不创建账号或发送消息。

令牌只从启动 Harness 的本地环境变量 `AGENT_TWIN_SLACK_BOT_TOKEN` 读取，保留在进程内存中；不要粘贴到聊天，也不要写进知识卡片、公开配置或 Git。工具不接受 `token`、URL 或任意目标路径参数。

先在本地 `.agent-twin/config.json` 指定本人 `ownerId`、本人消息目的地 `ownerDestinationId`、允许读取的 `allowedChannelIds` 和允许目的地 `allowedDestinationIds`，`channel` 设为 `slack`。保持 `enabled:false`。实际身份/频道 ID 来自用户自己的 Slack 工作区，不能从消息里的自称推断。

```json
{"operation":"channel_probe"}
```

probe 只调用 Slack 的认证与资料读取 API，核对机器人工作区、本人身份、准入频道及成员、本人的消息目的地。缺少授权或范围不匹配返回blocked，不能把工具存在、配置存在或安装成功当作已连接。`channel_status` 仅查看本地回执；缓存回执不代表本次重新检查身份。

## 第三步：权限与服务试运行

在 `.agent-twin/policy.json` 为不同人员设置可读知识、工具、动作与项目范围；未知人员、未匹配范围、权限冲突与超范围请求进入本人决策队列。记录清楚“分身能独立决定什么、什么时候必须交给我”。

```json
{"operation":"channel_tick"}
```

该工具强制 `dryRun:true`，即使配置保持 `enabled:false` 也可显式验收。它读取配置准入范围内的消息，按稳定身份与消息标识去重，产生分流及本人队列的本地记录；不回复 Slack、不调用业务工具，不接受模型传入 `dryRun:false`。重复消息、越权请求与身份变化都应纳入验收。身份变化时重新probe，不能沿用旧回执。

原 `status`、`runbook` 操作仍保留。初始配置为 `enabled:false`；`ready:false` 表示本包没有提供自动业务执行、对外发送或常驻服务。通道只读核验、dry-run通过、真实发送和持续在线分别验收。本版真实 Slack 账号/消息收发尚未验收，不能承诺持续在线。

所有工具从宿主 `workingDirectory.get(agent.session)` 获取当前目录，不接受模型指定绝对路径，也不根据历史 header 猜目录。init、prepare、apply、channel_probe和channel_tick会写本地状态，均遵守宿主sandbox策略：只读、缺失或未知策略拒绝；workspace-write仅允许当前目录处于宿主工作区范围内。状态查询及来源变化检查保持只读。初始化已有同名目录时拒绝覆盖。

宿主正式 `schedule_create` 可另行安排每600秒的当前Agent唤起；本插件不会注册它。只有另行实现并验收发送/业务执行及其强制权限门后，再由用户明确启用持续服务。休眠、退出及认证失效期间的停服边界须如实记录。

## 官方市场功能与本包索引

[官方插件市场功能](https://deepseek-harness.github.io/deepseek-harness/guide/plugin-market)已提供实验性的“发现”页和自定义JSON索引，默认没有索引源。`plugin_market` 只能列出用户已配置的索引、搜索插件及版本，安装仍经 `plugin_manager`。当前官方文档没有统一商店的提交审核API。

仓库的 `market/index.json` 按format1准备本包条目；新版本的实际40位commit与发布时间填入并通过官方校验后，才可发布静态索引。source采用固定commit的Git仓库；现有tgz下载地址仍用于直接安装。准备索引不等于已发布索引、已添加到用户Harness或已获任何市场收录。本轮不提交市场、不启用Pages、不更改用户索引源。

## 隔离验证

源码验证只使用临时合成目录，不访问日常 profile、工作项目、模型密钥或消息渠道：

```sh
npm install --ignore-scripts
npm test
npm pack --ignore-scripts
```

需要验证正式安装管理器时，使用全新的 `DSH_HOME`，不要复制日常 profile 或挂载真实项目。以下命令仅作隔离测试示例，包路径须替换成刚刚打出的实际绝对路径：

```sh
trial_home="$(mktemp -d)"
DSH_HOME="$trial_home" npx --yes @deepseek-ai/dsh@0.2.1-rc.2 plugin --profile web add /ABSOLUTE_PATH/dsh-agent-twin-0.2.0.tgz
```

隔离 CLI 安装只证明包管理路径；工具/SDK测试只证明适配逻辑。二者均不证明真实 Desktop 中已加载、模型已调用、渠道已收到或工作流已持续运行。真实验收须分别登记，不通过操作微信客户端来核对收件。
