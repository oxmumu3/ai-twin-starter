# Agent Twin

用已有工作 Agent，按三个步骤搭分身：**蒸馏分身 → 连接通道 → 设定权限**。

## 三步分别做什么

1. **蒸馏分身**：实际读取你指定的项目资料，由当前 Agent 提炼知识、判断、工作流与工具四类内容；工具校验来源和行号，生成本地私有知识包。源资料变化后识别失效卡片，保留历史，交 Agent 更新。
2. **连接通道**：当前提供 Slack 只读适配器，实际查询认证身份、本人账号、频道、本人回传目的地及少量入站消息。凭据留在本地环境，不进入聊天、项目资料或公开仓库。
3. **设定权限**：按平台真实 sender、tenant、频道、scope、action 和 destination 做代码路由验收。重复请求保留同一 ID，越权或意图不明确的请求交本人；dry-run 不执行业务动作、不发送消息。

现有 Agent 负责理解和提炼，代码负责读取边界、来源核验、知识落盘、通道探测与权限检查。无需另外购买模型 API；你的项目、工具和渠道仍由你授权。

## 给 Agent 的一句话

其他 Agent：

> 阅读 https://github.com/piggy00544/ai-twin-starter ，下载项目，按 SETUP.md 帮我蒸馏分身、连接 Slack、设定权限，先完成只读 dry-run，不发送消息。

DeepSeek Harness：

> 安装并启用 https://github.com/piggy00544/ai-twin-starter/releases/download/v0.2.0/dsh-agent-twin-0.2.0.tgz ，按运行手册带我完成蒸馏分身、连接 Slack 和权限 dry-run。

首次需要选择允许读取的材料，并完成自己的 Slack 授权、账号和范围设置。不要在对话中粘贴 token。没有凭据或权限时，通道探测返回 blocked，不会宣称已连接。

## 一个有内容的例子

[脱敏工作方法示例](examples/synthetic-operations/README.md)取材于作者的实际工作机制，所有实体、路径、材料与证据均独立重写为合成内容。它演示如何从四份资料提炼出：正式来源的权威边界、数字对平后的判断、处理数据请求的工作流、只读查询工具契约。

真实用户资料和来源映射只留在本地；本项目不提供把任意私有分身包一键公开的导出功能。

## 终端入口

要求 Node.js 22+。通用 CLI 只使用 Node 内置模块，不需要 npm install。

```sh
git clone https://github.com/piggy00544/ai-twin-starter.git
cd ai-twin-starter
node bin/agent-twin.mjs init --cwd /absolute/path/to/your/project
node bin/agent-twin.mjs distill-prepare --cwd /absolute/path/to/your/project --entry rules.md --entry workflows.md
```

让当前 Agent 根据 prepare 返回的真实资料提取卡片，再调用 `distill-apply --batch <batchId> --cards <proposal.json>`；工具会验证而后真正落包。完整命令和结构见 [蒸馏说明](docs/distill.md)。[通道说明](docs/channel.md)包含 Slack 无代码授权和 probe/tick 的实际行为。

## DSH 与市场

DSH 插件提供上述同一套 API，使用宿主当前项目目录并尊重只读/工作区权限。[安装说明](docs/dsh-install.md)列出操作和验证范围。

DSH 已有官方提供的[自定义插件市场功能](https://deepseek-harness.github.io/deepseek-harness/guide/plugin-market)，官方文档说明没有内置索引源。本项目的[自托管索引](https://raw.githubusercontent.com/piggy00544/ai-twin-starter/main/market/index.json)可以添加到该发现页；这不代表官方统一收录或审核。直接安装 `.tgz` 也不需要先添加市场。

## 当前范围

0.1.0 只做了模板初始化，未实现前两步；此前把它描述成完整免开发搭建入口的范围不准确。

0.2.0 增加项目内容蒸馏、来源刷新、Slack 只读探测和代码权限 dry-run。持续调度、正式业务执行与对外回复仍由原 Agent 及其授权工具承担。本包没有新建常驻机器人服务，也不能用安装或合成测试代替真实账号收发验收。`status` 不会把配置齐全标成已在线。

MIT，作者：牛村木木山。详见 [SETUP.md](SETUP.md)、[验收记录](docs/verification.md)、[隐私边界](docs/privacy.md)。
