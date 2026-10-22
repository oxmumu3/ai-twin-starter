# 在 DeepSeek Harness 中安装

0.4 预发布提供原生“AI 分身”工作台：项目沉淀、分身能力、通道连接、身份与规则四个模块，以及首次搭建和日常管理。当前验证宿主为 **官方 Web 0.2.1-rc.2，Node.js 22.13+**。Desktop 0.2.1-rc.2 的集成尚未验收；其他版本需重新验证，不使用版本豁免强行安装。

原生版运行步骤见 [native.md](native.md)，能力、证据与未测项见 [release-0.4.md](release-0.4.md)。安装、启用组件、项目配置、通道验收、服务在线分别记录。

## 给 Harness 的一句话

> 请阅读 https://github.com/oxmumu3/ai-twin-starter 的 README 和 https://github.com/oxmumu3/ai-twin-starter/releases （包括预发布），核对当前 Harness 版本，选择已公开且兼容的安装包，验证同一 Release 的 SHA256SUMS，再安装、启用并回读状态。按该版本运行手册带我搭建分身；0.4 使用原生“AI 分身”工作台，先核验模型、来源和 Slack 权限，再由我明确启用服务。

预发布可能不会出现在 `/releases/latest`。安装前确认仓库 canonical owner 为 `oxmumu3`、所选 Release 已公开、`.tgz` 与校验文件实际存在；不能仅凭 README 的版本号或猜出的下载地址安装。

宿主 `plugin_manager` 先执行：

```json
{"action":"list_bundles","limit":100}
```

核对已有准确包名和版本，避免重复安装。随后将 `install_bundle` 的 `target` 设为刚核实的固定版本 `.tgz` 地址，`enabled:true`。包名应为 `dsh-agent-twin`，包内版本、宿主 engines 与 Release 一致；本包没有安装时脚本。不要擅自卸载旧版或打断活跃任务。

该工具要求宿主的 `danger-full-access` 权限或本次调用的批准；安装的 Host 代码运行在工作区沙箱之外。用户需要在 Harness 自己的批准流程中授权，插件不修改权限模式，也不绕过审批。若宿主报告 `pendingBuilds`，须先解释具体包的安装脚本并取得批准，不能自行传 `approvedBuilds` 放行。版本不兼容时换兼容版，不自动加版本豁免。

安装返回后，再调用 `plugin_manager` 的 `list_bundles` 和 `list_plugins`。只有变更结果的 `application` 为 `applied`，且回读该包及其组件已启用、没有失败，才报告安装成功。`restart-required` 按宿主 `nextStep` 处理；保存、下载、登记为 dependency 或关闭安装框都不代表已启用。不要为了这一步打断正在运行的任务。

核查依据：[官方插件管理工具](https://github.com/deepseek-ai/deepseek-harness/blob/332895e0f7c9d4dbfb29729f5eb367fa263ff986/packages/boot/plugin-manager/src/tools.ts)、[官方安装地址解析](https://github.com/deepseek-ai/deepseek-harness/blob/332895e0f7c9d4dbfb29729f5eb367fa263ff986/packages/boot/plugin-manager/src/install-spec.ts)。核对版本的 Desktop build commit 为 `332895e0f7c9d4dbfb29729f5eb367fa263ff986`。

## 通用工具兼容路径（沿用 0.3）

以下操作说明适用于 `agent_twin` 工具，仍是只读通道核验及权限 dry-run。0.4 原生工作台的凭据配置、模型调用、任务、审批、回传和定时器使用独立原生运行路径，见 [native.md](native.md)。

## 第一步：准备分身材料

插件启用后，在要搭建分身的当前工作项目中调用 `agent_twin`。零散项目还没有现成知识库时，先明确允许盘点的相对目录；只读盘点无需初始化。例如：

```json
{"operation":"materials_inventory","roots":["notes","project-docs"]}
```

也可明确选择 `roots:["."]` 盘点当前项目。inventory 有数量和深度上限，只返回文件路径、类型、大小、更新时间等元数据，不读取正文、不自动选择候选文件，不跟随符号链接。`truncated`、`complete` 与 `issues` 表达盘点是否完整，不能把部分结果当作项目全量清单。不支持的格式会标为需转换；当前正文读取只接受普通 `.md/.txt`，不会悄悄安装转换器或执行文件。

由用户选定具体文件后，先用 `status` 检查当前项目。尚未初始化时创建私有目录；已有目录则沿用，不能覆盖：

```json
{"operation":"init"}
```

随后只准备选定正文：

```json
{"operation":"materials_prepare","entries":["notes/project-background.md","project-docs/delivery-method.txt"]}
```

prepare 返回所选文件的正文、来源ID、哈希与行号，同时写入本地私有批次。当前Agent据此整理项目概况、背景、知识、决策、流程、案例、工具及已有材料包，并单列信息缺口。材料尚未记载的事实不能靠补写摘要变成已知事实。

```json
{"operation":"materials_apply","batchId":"使用materials_prepare返回的batchId","packet":{"project":{"title":"我的项目","summary":"根据选定来源归纳的项目概况。","sourceRefs":[{"sourceId":"使用prepare返回的sourceId","startLine":1,"endLine":2}]},"materials":[{"id":"delivery-method","kind":"workflow","title":"交付方法","summary":"有来源支持的实际做法。","sourceRefs":[{"sourceId":"使用prepare返回的sourceId","startLine":3,"endLine":4}],"selectedForDistillation":true}],"gaps":[{"id":"missing-authorization","description":"尚需本人确认连接器授权。"}]}}
```

packet保存在本地私有 `.agent-twin`；它不是待公开的仓库内容。项目和材料摘要须有准确 `sourceRefs`。材料类型为 `tool` 时必须说明 `toolStatus`：`available`、`needs_connection` 或 `needs_development`；其他类型不带该字段。记录为可用的工具也不等于这次已经连接、调用或验收。`selectedForDistillation` 标记进入下一步的材料，`gaps` 只记缺口。

```json
{"operation":"materials_status"}
```

status只读检查来源变化和当前材料状态；来源已变时重新选材、prepare和归纳。材料包写入成功只完成准备阶段，尚未生成可供分身使用的知识卡片。

## 第二步：蒸馏分身

从已准备、来源仍有效的材料包进入蒸馏：

```json
{"operation":"materials_distill"}
```

它准备新的蒸馏批次，仍需当前Agent阅读返回的来源、提炼卡片并调用 `distill_apply`。如果已经有整理好的项目文件，也保留直接选材入口：

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

## 第三步：连接通道

本节通用工具直接使用 Slack Web API 的只读适配器，不假定已经安装其他 Slack 插件。用户仍要在自己的 Slack 工作区创建/授权应用、安装机器人，并提供对应的最小读取权限。插件不替用户接受授权、不创建账号或发送消息。

令牌只从启动 Harness 的本地环境变量 `AGENT_TWIN_SLACK_BOT_TOKEN` 读取，保留在进程内存中；不要粘贴到聊天，也不要写进知识卡片、公开配置或 Git。工具不接受 `token`、URL 或任意目标路径参数。

先在本地 `.agent-twin/config.json` 指定本人 `ownerId`、本人消息目的地 `ownerDestinationId`、允许读取的 `allowedChannelIds` 和允许目的地 `allowedDestinationIds`，`channel` 设为 `slack`。保持 `enabled:false`。实际身份/频道 ID 来自用户自己的 Slack 工作区，不能从消息里的自称推断。

```json
{"operation":"channel_probe"}
```

probe 只调用 Slack 的认证与资料读取 API，核对机器人工作区、本人身份、准入频道及成员、本人的消息目的地。缺少授权或范围不匹配返回blocked，不能把工具存在、配置存在或安装成功当作已连接。`channel_status` 仅查看本地回执；缓存回执不代表本次重新检查身份。

## 第四步：权限与服务试运行

在 `.agent-twin/policy.json` 为不同人员设置可读知识、工具、动作与项目范围；未知人员、未匹配范围、权限冲突与超范围请求进入本人决策队列。记录清楚“分身能独立决定什么、什么时候必须交给我”。

```json
{"operation":"channel_tick"}
```

该工具强制 `dryRun:true`，即使配置保持 `enabled:false` 也可显式验收。它读取配置准入范围内的消息，按稳定身份与消息标识去重，产生分流及本人队列的本地记录；不回复 Slack、不调用业务工具，不接受模型传入 `dryRun:false`。重复消息、越权请求与身份变化都应纳入验收。身份变化时重新probe，不能沿用旧回执。

原 `status`、`runbook` 操作仍保留。初始配置为 `enabled:false`；`ready:false` 表示通用工具路径没有提供自动业务执行、对外发送或常驻服务。通道只读核验、dry-run通过、真实发送和持续在线分别验收。本版真实 Slack 账号/消息收发尚未验收，不能承诺持续在线。

所有工具从宿主 `workingDirectory.get(agent.session)` 获取当前目录，不接受模型指定绝对路径，也不根据历史header猜目录。init、各prepare/apply、materials_distill、channel_probe和channel_tick会写本地状态，均遵守宿主sandbox策略：只读、缺失或未知策略拒绝；workspace-write仅允许当前目录处于宿主工作区范围内。materials_inventory和materials_status允许read-only，但仍要求当前目录在宿主sandboxRoot内；不因只读盘点扩大项目读取范围。状态查询及来源变化检查保持只读。初始化已有同名目录时拒绝覆盖。

宿主正式 `schedule_create` 可另行安排每600秒的当前Agent唤起；通用工具不会注册它；0.4 原生工作台使用自己的持久服务与定时器。只有另行实现并验收发送/业务执行及其强制权限门后，再由用户明确启用持续服务。休眠、退出及认证失效期间的停服边界须如实记录。

## 官方市场功能与本包索引

[官方插件市场功能](https://deepseek-harness.github.io/deepseek-harness/guide/plugin-market)已提供实验性的“发现”页和自定义JSON索引，默认没有索引源。`plugin_market` 只能列出用户已配置的索引、搜索插件及版本，安装仍经 `plugin_manager`。当前官方文档没有统一商店的提交审核API。

仓库的 `market/index.json` 按format1准备本包条目；新版本的实际40位commit与发布时间填入并通过官方校验后，才可发布静态索引。source采用固定commit的Git仓库；现有tgz下载地址仍用于直接安装。准备索引不等于已发布索引、已添加到用户Harness或已获任何市场收录。GitHub Release 预发布与官方市场收录是不同状态；发布安装包不会自动添加用户的市场索引。

## 隔离验证

源码验证只使用临时合成目录，不访问日常 profile、工作项目、模型密钥或消息渠道：

```sh
npm install --ignore-scripts
npm test
npm pack --ignore-scripts
```

需要验证正式安装管理器时，使用全新的 `DSH_HOME`，不要复制日常 profile 或挂载真实项目。以下命令仅作隔离测试示例，包路径须指向刚刚打出的实际安装包：

```sh
trial_home="$(mktemp -d)"
DSH_HOME="$trial_home" npx --yes @deepseek-ai/dsh@0.2.1-rc.2 plugin --profile web add ./dsh-agent-twin-0.4.0-preview.1.tgz
```

隔离 CLI 安装只证明包管理路径；工具/SDK测试只证明适配逻辑。二者均不证明真实 Desktop 中已加载、模型已调用、渠道已收到或工作流已持续运行。真实验收须分别登记，不通过操作微信客户端来核对收件。
