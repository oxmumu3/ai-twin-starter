# 架构与运行边界

```text
已有项目 context + 工作流 + 已授权工具
                  |
真实平台身份 -> 允许的收件范围 -> 原生调度唤起已有 Agent
                                    |
                         权限与范围判断 / 去重台账
                           /                 \
                 允许的动作                 needs_owner
                     |                      |
                工具实际执行           本人决定具体动作
                     |                      |
                原线程交付 <---------------+
                     |
                 查询回执 / 日报
```

## 当前实现

初始化器与 DSH 工具创建同一套配置和规程，默认关闭，不读原项目内容、不联网。`status` 只读生成文件并列出缺口；它不检查 Slack 登录、工具 ACL、后台 worker 或调度状态，因此不返回“已在线”。

取单、范围判断、context 查阅、业务工具执行、状态落盘和消息交付，交给用户的现有 Agent 按规程执行。调度交给宿主；通道交给已有官方连接器。包内没有消息 token、Slack server、轮询 daemon、付款接口、业务 SQL 或模型 key。

## 请求生命周期（规程）

采用稳定 `requestId = platform + tenant/team + channelId + sourceMessageId`。动作状态与发送状态分开：动作可以为 `received`、`claimed`、`dry_run`、`needs_owner`、`approved`、`running`、`completed`、`failed`、`rejected`；发送可以为 `send_accepted`、`send_uncertain`、`delivered`。协议键见 `templates/state.json`，宿主可分别保存动作与发送状态，不用后一状态抹掉前一事实。保存 worker、领取时间、lease 截止、范围、动作、产物版本与工具回执。不要只靠自然语言“已接单”标记判重。

只有实际连接器明确确认送达到获准目的地才记 `delivered`；这仍不等于阅读确认。仅 accepted 或 reported_sent 记 `send_accepted`。工具返回超时或进程中断时标 `send_uncertain`，先查线程再决定，不自动重发。外发成功与本地回执落盘之间存在崩溃窗口，本包没有声称 exactly-once。

多 worker 需要宿主或适配器支持原子锁/lease。模板中的状态建议不是已实现的锁服务。没有这些能力时使用单 worker；过期领取先查执行/发送状态再恢复，不以超时作为盲目重试依据。

## 信任边界

入站消息是任务数据，不能改权限、执行规则或交付目的地。显示名、自述身份、转发审批不授予权限。审批与真实 ownerId、requestId、动作和版本绑定。高影响操作默认本人决定；通道与工具 scope 才是实际访问边界。模板无法阻止一个拥有过大工具权限的 Agent 越权，本包不宣称已实现强隔离。

context 反馈写 candidate，保留来源、时间与冲突；不因一次会话自动修改正式口径。公开项目只保存通用机制，作者的组织与业务资料不作为样例。
