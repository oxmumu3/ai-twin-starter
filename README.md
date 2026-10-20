# Agent Twin

用已有工作 Agent，按四步搭分身：**准备分身材料 → 蒸馏分身 → 连接通道 → 设定权限**。

你只需指定项目范围、补充必要事实并完成自己的渠道授权。资料盘点、结构化整理、命令和 JSON 提案由当前 Agent 处理；不要求你先把项目整理成一套完美的知识库。

## 四步分别做什么

1. **准备分身材料**：先在选定项目内做有界文件元数据盘点，再由 Agent 选择明确来源并读取内容，组织项目说明、材料与缺口。材料覆盖背景、知识、判断、工作流、案例、工具和可复用大礼包；工具分为已有可用、待连接、待开发。来源和行号须可核对，缺失事实保留为缺口。工具校验后生成本地私有材料包。
2. **蒸馏分身**：从材料包已选的原始来源进入蒸馏批次，由当前 Agent 提炼知识、判断、工作流和工具四类卡片，再校验来源并生成私有知识包。材料包不等于蒸馏完成；原资料改变后须重新准备，不能拿整理稿掩盖来源变化。
3. **连接通道**：Slack 只读适配器实际查询认证身份、本人账号、允许频道、本人目的地及少量入站消息。凭据留在本地环境，不进入聊天或公开包。没有授权就报告缺口。
4. **设定权限**：按平台真实发送人、团队、频道、范围、动作和目的地做代码 dry-run。陌生身份拒绝，越权或意图不明的请求转本人；允许的计划还须引用来源有效的蒸馏卡。dry-run 不执行业务动作或发送消息。

当前 Agent 负责理解与组织内容，代码负责读取边界、来源校验、落盘、通道探测和权限检查。材料可以边工作边积累；安装不会附带作者的业务知识、工具账号或个人记忆。

## 给 Agent 的一句话

其他 Agent：

> 阅读 https://github.com/oxmumu3/ai-twin-starter ，下载项目，按 SETUP.md 带我准备材料、蒸馏分身、连接通道、设定权限，先完成只读验收，不发送消息。

DeepSeek Harness：

> 安装并启用 https://github.com/oxmumu3/ai-twin-starter/releases/download/v0.3.0/dsh-agent-twin-0.3.0.tgz ，按运行手册带我完成准备材料、蒸馏、通道和权限四步，先跑只读验收。

首次由你选定可读取范围，并完成自己的 Slack 授权和必要的身份/范围设置。不要在对话中粘贴 token。免开发指这些已实现步骤不要求你编写程序；不代表免授权、没有材料也能复制能力，或安装后自动常驻。

## 从零散项目开始

[零散项目示例](examples/messy-project/README.md)用独立编写的合成背景、笔记、旧报告和工具说明演示材料准备。待转换的 PDF 留作缺口，被排除的配置不作为知识来源；不要求先有成套规则文件。后续过程是盘点 → 选择与读取来源 → Agent 整理材料/缺口 → 校验落包 → 从原始来源蒸馏。

[工作方法示例](examples/synthetic-operations/README.md)保留既有的四类蒸馏演示。它们均不包含真实业务资料或作者私有知识包。

## Agent 使用的命令

要求 Node.js 22+。通用 CLI 使用 Node 内置模块，不需要另外购买模型 API。下面的命令由 Agent 执行，用户无需手写提案。

```sh
git clone https://github.com/oxmumu3/ai-twin-starter.git
cd ai-twin-starter
node bin/agent-twin.mjs init --cwd /absolute/path/to/your/project
node bin/agent-twin.mjs materials-inventory --cwd /absolute/path/to/your/project --root .
node bin/agent-twin.mjs materials-prepare --cwd /absolute/path/to/your/project --entry notes.md --entry reports/previous.md
```

Agent 用 prepare 返回的真实内容组织 `{project, materials, gaps}`，写本地私有提案，再运行 `materials-apply --batch <batchId> --packet <proposal.json>`。`materials-status` 核对材料包；`materials-distill` 重新读取已选原始来源，进入既有 `distill-apply` 流程。完整操作见 [SETUP.md](SETUP.md)，卡片结构见 [蒸馏说明](docs/distill.md)，授权与只读接口见 [通道说明](docs/channel.md)。

## DSH 与市场

DSH 插件提供同一组流程，使用宿主当前项目目录并尊重只读/工作区权限。[安装说明](docs/dsh-install.md)列出宿主版本和操作。

DSH 有官方提供的[自定义插件市场功能](https://deepseek-harness.github.io/deepseek-harness/guide/plugin-market)。本项目提供[自托管索引](https://raw.githubusercontent.com/oxmumu3/ai-twin-starter/main/market/index.json)，可以添加到该发现页；这不代表本项目经过官方统一审核或收录。直接安装固定版本 `.tgz` 不需要先添加市场。

## 版本与验收边界

- **0.1.0**：模板初始化；当时未实现内容蒸馏和通道连接，把它描述成完整搭建入口不准确。
- **0.2.0**：增加显式资料蒸馏、来源刷新、Slack 只读探测和代码权限 dry-run，仍默认用户已有可直接选择的材料。
- **0.3.0**：补上零散项目的材料盘点、整理、缺口与来源校验，并从已选原始来源衔接蒸馏。

0.3 通用工具中的正式业务执行、审批消费、对外回复和持续调度仍由原 Agent 与其授权工具承担，须分别验收。合成示例和测试不能证明真实 Slack 已收发或服务已全天在线；`status` 不把配置齐全标成已在线。

MIT，作者：牛村木木山。另见 [验收记录](docs/verification.md)、[架构](docs/architecture.md)与[隐私边界](docs/privacy.md)。
## 0.4 原生工作台本地候选

当前开发分支包含 DSH 原生“AI 分身”面板、首次搭建/日常管理、四个常驻模块和持久化服务，使用方法见 [原生版运行手册](docs/native.md)。该候选尚未公开发布；上文公开安装链接与通用工具说明仍对应已发布的 0.3 路径。原生服务需另行配置模型、通道、身份和规则并明确启用。
