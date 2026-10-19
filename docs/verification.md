# 首版验证范围

版本：0.1.0。日期：2026-10-18。

`npm test`：30/30 通过。使用 Node.js 22 与真实 `@deepseek-ai/dsh-tools@0.2.1-rc.2` 的 `defineTool`；插件测试以最小宿主上下文提供 tools、workingDirectory 和 sandboxPolicy。

覆盖初始化只创建新目录、不覆盖已有数据、默认关闭、空授权、普通符号链接拒绝、并发初始化、CLI 参数、状态只读，以及宿主当前目录、缺少会话、只读/未知策略与工作区越界拒绝。初始化与状态验证均在临时合成目录完成，没有导入真实 context 或接触消息渠道。

`node --check index.js` 通过，SDK 实际解析版本已检查。发布包采用 package.json 的 files 白名单，19 个文件；包内无安装生命周期脚本、符号链接、原工程文件或运行状态。源码与 tarball 的敏感模式扫描零命中，并由独立 Agent 复核公开内容和声明边界。

已将 tarball 解压到临时空目录，直接运行包内 CLI 的 `init` 与 `status`，无需安装依赖，两者均成功且保持 disabled/ready:false。macOS 临时目录使用真实规范路径，避免系统 `/var` 软链触发预期拒绝。此验证不调用模型或消息工具。

普通路径检查和 exclusive 文件创建不是针对恶意并发文件系统修改者的完整沙箱。Host 适配测试也不能替代真实 Desktop 加载或模型使用的端到端验证。

未验证：日常 Desktop profile 安装、模型自主完成全套配置、真实 Slack 授权/接待/收件、连续十分钟调度、强制工具 ACL。生成 `.agent-twin`、安装包和调度上线分别记状态；不把前者写成后者。
