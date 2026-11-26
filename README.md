# AI 分身工作台 · `@oxmumu3/dsh-agent-twin` (v0.6.3)

在 DeepSeek Harness (`0.2.2-rc.5` / `0.2.3-alpha.2`) 内把你的本地专业工作区发布为**满血隔离 AI 分身**：**1 个满血 DSH 只读内核 + 按人与目录物理裁剪工作区（薄 Harness 边界）+ `/try` 公开扫码真体验大厅 + 0.2.3 官方飞书/企微连接器与真个人微信 iLink + 对话流与手机远程拍板 + 内置语义知识图谱**。

> 兼容 DeepSeek Harness Desktop / Web **0.2.2-rc.2 ~ 0.2.3-alpha.2**（Node.js 22+），不内置任何付费墙或商业化限制，所有通道凭据仅加密保存在本机 `0600` 凭据库 `$DSH_HOME/agent-twin/secrets.json`。

## 30 秒安装（DeepSeek Harness 创造模式）

1. 在 DeepSeek Harness 新建会话，点顶部「标准模式」下拉，切到「创造模式」。
2. 复制下面这句话发给 Agent，弹出授权时点「允许」：
请通过插件管理器，从 npm 官方源安装并启用 @oxmumu3/dsh-agent-twin@latest。完成后请核对版本和启用状态，再带我打开左侧「AI 分身」。
（也可以在「插件 -> 添加插件」直接填入 `@oxmumu3/dsh-agent-twin@latest` 安装并启用。）
开源仓库与图文说明（觉得有帮助欢迎点个 Star）：
https://github.com/oxmumu3/ai-twin-starter

---

## v0.6.3 核心架构升级

### 0. `/try` 公开扫码真体验大厅（Fail-Closed 隔离 + 匿名会话分流）
- **同一张永久二维码，每人独立隔离会话**：开启 `04 公开扫码真体验大厅（/try）` 并配合公网隧道域名（如 Cloudflare Named Tunnel `https://twin.finvo.ai/try`）后，每位扫码访客通过 `HttpOnly; SameSite=Lax` Cookie (`dsh_twin_vid`) 分配独立对话目录与独立 DSH `--session-id`，多人同时体验互不串台。
- **Fail-Closed 安全默认 + 三层防刷护栏**：未显式勾选 `capIds` 时默认不挂载任何目录、绝不继承私人项目名称或未定边界全局图谱；同时内置单访客每日轮次上限（默认 5 轮）、大厅全局每日总上限（默认 200 轮）与按 IP 滑动窗口防刷限流。
- **即点即问 + 一键部署引流**：大厅页自带 3 个可点击试问按钮、SSE 实时核查步骤流与 `#编号` 红线拦截演示，并在访客达到体验上限或想自建时给出完整 30 秒创造模式安装指令。

### 1. 满血 DSH 原生内核 × 目录级物理裁剪隔离 × 流式实时进度
- **不再用伪关键词切片糊弄同事**：当运行环境具备 DSH 凭据时，来访者提问直接在 `$DSH_HOME/agent-twin/dsh-runner-home` 隔离实例下唤醒真实只读 DSH Agent（`--profile headless --permission-mode read-only --approval-policy never`），保留每名访客独立的 `--session-id` 连续记忆，实打实使用 `read` / `grep` / `glob` / 只读计算核对 CSV、口径文档与脚本后再回答。
- **按人与按目录双层物理裁剪 (`scopePaths`)**：每次会话通过 `materializeScopedWorkspace()` 为每位来访者生成 `0700` 专属符号链接沙箱；除按能力包过滤外，支持在工作台为每项能力单独限定目录路径（如仅挂载 `docs/` 与 `README.md` 而不挂 `data/`），`.env*`、私钥凭据、`DELETE/INSERT` 写库 SQL、`.git` 与遥测日志 JSON 从物理目录里彻底消失。
- **实时流式步骤 + 3.5 秒慢响应安抚**：`/g/:token` 免装网页直连 `POST /api/guest/:token/ask-stream` SSE 事件流实时播报只读核查步骤；飞书/微信/企微/Slack 若深查超过 3.5 秒自动先回一句安抚回执。
- **语义红线 + 手机远程拍板闭环**：命中红线或资料缺口时生成带 `#编号` 的待拍板卡片，支持通过官方飞书机器人私信或本机 `dsh-wechat` 推送到负责人手机；直接在手机回复 `批准 #码` / `改 #码：最终回复` / `记规矩 #码：内容` 即可远程下发给来访对象。

### 2. 官方办公连接器一键复用 + 真个人微信 iLink
- **飞书 (`@deepseek-ai/dsh-feishu`)**：一键检测并复用 DSH 0.2.3 官方插件 OAuth（零 App Secret 落盘），自动挂载 `lark-cli event consume im.message.receive_v1 --as bot` 实时事件流，识别本人在群聊 15 分钟内发言自动收声，并在私聊支持远程拍板指令，批准草稿时通过 `im +messages-reply / +messages-send` 回传。
- **企业微信 (`@deepseek-ai/dsh-wecom`)**：一键复用官方 `wecom-cli` 出站回传，同时保留智能机器人长连接实时接入。
- **个人微信（真实 iLink 协议）**：接入 `weixin-ilink` 真实扫码二维码生成（SVG）、状态轮询、长轮询入站与 `-2` 异常自动重恢复，零公众号认证门槛。
- **免装试用网页 & Slack Socket Mode**：按人签发独立沙箱网页链接，无须安装任何客户端即可试跑验证；所有已启用通道在插件重启后自动重连。

### 3. DSH 原生度拉满 + 内置语义知识图谱
- 收敛冗长单一工具为四枚职责清晰的原子工具：
  - `twin_status`：查看值班状态、切换 `shadow / live / off`、刷新官方连接器探测或本地只读自测；
  - `twin_publish_workspace`：从本地目录提炼能力包并可选一键挂载官方飞书；
  - `twin_grant_access`：为指定同事或合作方开通网页/微信/飞书/企微/Slack 隔离授权；
  - `twin_inbox`：查看待拍板草稿与红线拦截，并直接在主对话内批准或忽略。
- 接入 **`tool.call.toolview` (`@deepseek-ai/dsh-client-ui-tool`)**：在主对话里直接编辑草稿文本、点击「批准发出」「发出并记为规矩」「忽略」或切换值班模式，无需来回跳转左侧面板。
- 内置 **`graph-provider` 语义图谱提供器 + `ctx.get('agentTwin')`**：开箱即自动读取项目内 `graph/*.json` / `knowledge/*.json` / `*.graph.json` 与工作台自定义节点（按 `allowedModes` 过滤并做 1 跳公式/异常/边界联想），同时保持 **0.2.2-rc.5 + 0.2.3-alpha.2 单包双兼容**。

---

## 脱敏实战案例：`examples/growth-bi-desk/`

仓库内置完整的脱敏「增长与 BI 协同工作区」实战样本（全部指标与成本已重构脱敏）：
- `docs/attribution-and-roi-handbook.md`：D7 净回本 ROI 公式、自然量剔除规则与 Q1 未定稿返点边界；
- `docs/anomaly-playbook.md`：退款率/苹果延迟入账排查步骤；
- `data/channel_weekly_metrics.csv` + `scripts/calc_roi_summary.py`：4 渠道 3 周 12 行投放数据；
- `graph/growth-semantic-graph.json`：增长与 BI 语义知识图谱示范（串联指标公式、W03 延迟事件与 Q1 返点权限边界）；
- 刻意混入 `.env.production`（假数仓私钥哨兵）与 `scripts/export_raw_user_phones.sql`（假写库/导出手机号 SQL），供端到端验收分身隔离边界。

---

## 开发者 / CI 验证说明

```sh
npm install
npm run build
npm run check:client
npm test
```

> 通用 CLI 兼容路径与底层设计参见 [SETUP.md](SETUP.md) 与 [docs/architecture.md](docs/architecture.md)。MIT License · 作者：牛村木木山 (`oxmumu3`)。
