# 四步流程与实现边界

```text
用户指定项目范围
      ↓ inventory：有界元数据盘点，不读正文
Agent 选择来源 → materials-prepare：原始内容 / hash / 行号
      ↓ Agent 组织 project / materials / gaps
materials-apply：校验来源 → 本地私有材料包
      ↓ materials-distill：重核来源，直接读取原始文件
Agent 提炼知识 / 判断 / 工作流 / 工具卡
      ↓ distill-apply：校验 → 私有知识 generation
readKnowledge：排除候选、失效与缺失来源
      ↓
Slack probe：认证 → 本人 → 频道 → 本人DM → 有限入站
      ↓
代码 dry-run：真实身份 / 范围 / 动作 / 目的地 / 稳定请求ID
      ↓
授权计划引用有效知识；意图不明、越权或知识未就绪转本人
```

## 材料准备与蒸馏分开

材料准备面向尚未整理好的项目。inventory 只盘点选定范围内的文件元数据；正文由后续显式选择决定。当前 Agent 阅读来源后组织项目背景、知识、判断、工作流、案例、工具与大礼包，保留缺口。工具状态 `available/needs_connection/needs_development` 不混用，资料记载与当前接通验证分开。

材料提案结构为 `{project,materials,gaps}`。项目说明与材料须有来源，代码校验来源身份、hash 和行范围后落私有包；gap 只记录未知，不创造新事实。metadata 盘点、prepared 批次、材料落包和知识卡落包是不同状态。

materials-distill 不把整理稿当新的事实真源，而是核对材料包已选择的原始来源，再进入既有蒸馏批次。源改变就先重新准备，不能通过改写总结让失效来源恢复有效。已有成套来源仍可走旧的直接蒸馏快捷路径。

## 知识是带证据的派生视图

当前 Agent 承担语义提炼，生成 knowledge/judgment/workflow/tool 四类卡。代码检查卡结构、source/span hash、来源行号与凭据规则后，写入私有新 generation、索引与 manifest，再更新 current 指针；不反向修改原项目。

引用存在且来源未变，不自动证明语义推断正确。材料不支持的判断保留 candidate。refresh/readKnowledge 重新核对来源，stale/missing/candidate 不供执行；增量更新保留未受影响内容与历史，不把旧卡洗成有效。

## 通道是真实只读 API

Slack adapter 从本地环境取得 token，在闭包中使用固定官方域名的五种只读方法，没有发送方法。probe 实际核对租户、本人、允许频道、双人本人 DM 和小量历史，保存分项回执，不保存消息正文或凭据。

本地 status 只读缓存，不能知道环境 token 已换成哪个账号，所以明确 `cached_not_rechecked`。每次 probe/tick 重新认证；配置或账号变化使旧探测失效。有限历史读取不代表全量消息覆盖、完整线程或长期接待。

## 权限与知识在 dry-run 中相接

真实消息提供 sender/tenant/channel/message ID，自述身份与引用同意不授权。明确 JSON 意图也只是待授权数据，须精确匹配 grant 的 scope/action/destination；自然语言或范围未知转本人。

预先通过权限匹配的请求才读取当前有效的 documented 卡。允许计划附知识 generation 与卡 ID，不存卡正文或私密源路径；缺知识或源失效时转本人，旧计划移除过期引用。knowledge_read 是当前 Agent 的内部知识入口，不是来客的卡片级 ACL；正式回答仍需 Agent 按获准 scope 取用内容。

dry-run 使用独立账本，不修改生产状态、生产游标或 Slack 已读位置。稳定 requestId 避免重复增加请求记录；同一请求仍重新核对知识时效。模块没有业务执行器、正式审批消费或发送实现。

## 原 Agent 与宿主的责任

正式业务执行、对外回复和持续调度复用原 Agent 与授权工具，按 RUNBOOK 另做实际验收。dry-run 的本地锁不是通用队列服务，代码分流也不是完整安全 sandbox。正式接待须有可证实的单一串行执行者，或多 worker 共同的原子锁；不确定副作用/发送先人工核查，不能盲重试。

DSH 与 CLI 共用模块。DSH 的写操作取当前宿主 cwd 与 sandboxPolicy，不接受模型传入任意私密路径或 token。0.3.0 使用官方市场功能的自托管索引入口，不代表官方统一收录或审核。
