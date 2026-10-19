# Agent Twin Starter

把你日常工作的 Agent 配成可以接待、分流和交办的在线分身。

复用你自己的上下文、工具、消息授权与调度能力。这个项目提供通用配置、运行规程和初始化器；同一份包也可作为 DeepSeek Harness 插件安装。MIT，作者：牛村木木山。

## 给 Agent 的一句话

其他 Agent：

> 阅读 https://github.com/piggy00544/ai-twin-starter 的 SETUP.md，下载项目，按说明帮我的现有 Agent 配置在线分身，带我完成渠道授权、权限设置和试运行。

DeepSeek Harness（在支持原生 `plugin_manager` 的版本中）：

> 安装并启用 https://github.com/piggy00544/ai-twin-starter/releases/download/v0.1.0/dsh-agent-twin-0.1.0.tgz ，再用 agent_twin 运行手册带我完成分身配置。

免开发指不需要自己写代码。首次仍要提供自己的 context、授权消息渠道、指定本人和服务对象；Agent 或宿主必须已有消息工具与持久调度。缺少任一能力时，安装说明会要求明确停在未就绪状态。

## 安装后有什么

在你选定的工作目录创建 `.agent-twin/`，内含空白配置、默认拒绝的权限模板、取单规程、请求台账、人工决策和日报模板。初始化默认关闭，不读取你的原项目文件，不联网、不发消息、不注册调度、不覆盖已有目录。

它不会附带作者的工作数据、记忆、内部工具、平台凭据或业务能力。安装插件本身也不会创建一个常驻机器人。

## 在终端初始化

要求 Node.js 22 或更新版本。只运行通用初始化器不需要安装任何 npm 依赖。

```sh
git clone https://github.com/piggy00544/ai-twin-starter.git
cd ai-twin-starter
node bin/agent-twin.mjs init --cwd /absolute/path/to/your/workspace
node bin/agent-twin.mjs status --cwd /absolute/path/to/your/workspace
node bin/agent-twin.mjs runbook --cwd /absolute/path/to/your/workspace
```

选已有项目目录即可。命令只在其中创建 `.agent-twin/`，不会把其他文件打包上传。不要将此配置目录或任何凭据提交到公开仓库。完整设置见 [SETUP.md](SETUP.md)，DSH 入口见 [插件安装说明](docs/dsh-install.md)。

## 三层设计

| 层 | 你提供 | 配置包提供 |
|---|---|---|
| 能力和上下文 | 已有 Agent、项目规则、可核实的背景、工作流、工具 | 明确的 context 入口和能力检查 |
| 消息入口 | 平台官方连接器、授权、允许读取的收件范围 | 输入/输出目的地与身份核验规程 |
| 服务机制 | 宿主调度、实际工具权限、本人决策 | 按人按事分流、去重台账、交付回执、人工队列、日报规程 |

权限模板是 Agent 的行为约定。要限制真实访问，仍须在连接器和执行工具层配置最小权限；本包不是安全沙箱，不提供已验证的强制 ACL。锁、lease、去重与 outbox 目前写在规程中，**不是本包实现的可靠队列服务**。宿主若不能原子领取或查询发送结果，应使用单一 worker 并将不确定结果交本人核查。

## 什么时候算可用

分别检查：安装成功、初始化成功、配置完成、渠道已授权、dry-run 通过、调度已注册、真实线程交付有回执。逐项留证据；生成文件不能代替后面几项。`status` 只检查本地配置，不会把它标成真实在线。平台发送回执也不代表对方已读。

首版验证范围与限制见 [验收记录](docs/verification.md)。设计细节见 [架构](docs/architecture.md)，公开边界见 [隐私与打包](docs/privacy.md)。
