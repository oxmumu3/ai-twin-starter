# 在 DeepSeek Harness 中安装

这是把已有工作 Agent 接成在线分身的起步包。插件提供当前项目的初始化、状态检查和运行手册。它不会替你获得原本没有的业务能力，也不包含常驻消息机器人。

本版面向官方 DeepSeek Harness `0.2.1-rc.2`、Node.js 22+。以下工具和参数已从该版本官方 Desktop 安装包的代码核对；其他版本需重新验证。插件安装、项目初始化、渠道接通和后台运行是四个独立状态。

## 给 Harness 的一句话

本版预定固定下载地址如下；只有对应 Release 及校验和实际发布并核验后，安装口令才可对外使用：

```text
https://github.com/piggy00544/ai-twin-starter/releases/download/v0.1.0/dsh-agent-twin-0.1.0.tgz
```

> 请阅读 https://github.com/piggy00544/ai-twin-starter 的 README，安装并启用 https://github.com/piggy00544/ai-twin-starter/releases/download/v0.1.0/dsh-agent-twin-0.1.0.tgz 。先回读现有插件，使用正式 plugin_manager 工具安装。只在宿主确认 applied 且再次回读已启用后报告装好，然后在我当前项目调用 agent_twin 的 init 和 status，按运行手册引导我完成自己的渠道授权、owner 和权限配置。暂不启动定时任务或对外发送。

宿主的正式工具调用如下。先 `list_bundles` 取得已安装的准确包名，避免重复安装或擅自卸载旧版。

```json
{"action":"list_bundles","limit":100}
```

```json
{"action":"install_bundle","target":"https://github.com/piggy00544/ai-twin-starter/releases/download/v0.1.0/dsh-agent-twin-0.1.0.tgz","enabled":true}
```

以上是 `plugin_manager` 的参数。当前宿主接受 npm 包、Git 地址、HTTP(S) `.tgz` 及本地绝对路径。推荐固定版本 Release 的预构建 `.tgz`，同时核对 Release 中的 `SHA256SUMS`；本包没有安装时脚本。正式包名可从同一 Release 的 `package.json` 核对。

该工具要求宿主的 `danger-full-access` 权限或本次调用的批准；安装的 Host 代码运行在工作区沙箱之外。用户需要在 Harness 自己的批准流程中授权，插件不修改权限模式，也不绕过审批。若宿主报告 `pendingBuilds`，须先解释具体包的安装脚本并取得批准，不能自行传 `approvedBuilds` 放行。版本不兼容时换兼容版，不自动加版本豁免。

安装返回后，再调用 `plugin_manager` 的 `list_bundles` 和 `list_plugins`。只有变更结果的 `application` 为 `applied`，且回读该包及其组件已启用、没有失败，才报告安装成功。`restart-required` 按宿主 `nextStep` 处理；保存、下载、登记为 dependency 或关闭安装框都不代表已启用。不要为了这一步打断正在运行的任务。

核查依据：[官方插件管理工具](https://github.com/deepseek-ai/deepseek-harness/blob/332895e0f7c9d4dbfb29729f5eb367fa263ff986/packages/boot/plugin-manager/src/tools.ts)、[官方安装地址解析](https://github.com/deepseek-ai/deepseek-harness/blob/332895e0f7c9d4dbfb29729f5eb367fa263ff986/packages/boot/plugin-manager/src/install-spec.ts)。核对版本的 Desktop build commit 为 `332895e0f7c9d4dbfb29729f5eb367fa263ff986`。

## 在当前项目初始化

插件启用后，由模型调用工具 `agent_twin`：

```json
{"operation":"init"}
```

```json
{"operation":"status"}
```

```json
{"operation":"runbook"}
```

工具从宿主 `workingDirectory.get(agent.session)` 获取当前目录，不接受模型指定的路径，不根据历史 header 猜目录。宿主没有有效本地会话或当前目录时直接报错。初始化尊重宿主 `sandboxPolicy.resolve({session})`：只读、缺失或未知策略直接拒绝；`workspace-write` 仅允许当前目录处于宿主工作区根目录以内，`danger-full-access` 仍只初始化当前目录。初始化只向已存在的当前项目创建全新的 `.agent-twin`；已有同名目录时拒绝覆盖。不要为重试删除已有工作。

初始配置 `enabled:false`；状态会明确返回 `ready:false`，并标明连接器、调度器和后台运行都没有注册。`status` 不回传配置正文、渠道 ID 或凭据。当前项目里文件创建成功不等于在线工作流可用。

## 首次配置与实跑

1. 继续使用自己日常工作的 Agent、已有项目记忆和工具。只声明允许读取的项目范围；不要把真实 context 或凭据上传到 GitHub。
2. 使用自己的渠道连接器完成授权，指定 owner 和可接待人员，并按人员定义工具、动作、项目、金额或外发范围等权限。权限内的自动执行也需要事先定义；超出范围进入 owner 队列。
3. 按 `.agent-twin` 里的运行手册，用合成消息做 dry run：普通查询、权限内动作、越权请求、重复消息、发送失败和结果不确定分别检查。确认路由目标及实际收件，再单独启用定时触发或事件入口。

宿主 `0.2.1-rc.2` 已有正式 `schedule_create` 工具，`every_seconds:600` 可每十分钟向当前会话送一次指令；它要求 `prompt` 和 `title`。这只是定时唤起当前 Agent。渠道拉取、去重、身份核验、权限执行和 owner 回传仍须由已授权工具及运行规程完成。宿主退出或电脑休眠期间不能执行；崩溃后的提醒可能重复，业务去重仍要保留。本起步插件不会自动注册该日程。

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
DSH_HOME="$trial_home" npx --yes @deepseek-ai/dsh@0.2.1-rc.2 plugin --profile web add /ABSOLUTE_PATH/dsh-agent-twin-0.1.0.tgz
```

隔离 CLI 安装只证明包管理路径；工具/SDK测试只证明适配逻辑。二者均不证明真实 Desktop 中已加载、模型已调用、渠道已收到或工作流已持续运行。真实验收须分别登记，不通过操作微信客户端来核对收件。
