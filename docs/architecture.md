# 三步实现与边界

```text
明确选择的项目资料
       ↓ prepare：读取＋来源与行号
当前 Agent 提炼知识 / 判断 / 工作流 / 工具
       ↓ apply：校验＋私有内容卡＋版本索引
readKnowledge：排除候选、失效与缺失来源
       ↓
Slack probe：认证 → 本人 → 频道 → 本人DM → 有限入站
       ↓
代码 dry-run：真实身份＋范围＋动作＋目的地＋稳定请求ID
       ↓
允许的计划引用有效知识版本；不明确或越权则转本人
```

## 蒸馏是有内容的派生包

只读取显式选中的普通文本，当前 Agent 根据原材料提炼卡片；代码不代替语义理解。apply 校验来源 hash、行号范围、卡片结构和凭据规则后，在私有新 generation 写入内容卡、索引、manifest 与回执，再更新 current 指针。源项目保持只读，是原有知识真源。

每张卡保存内容、适用条件、限制、状态及 source/span hash。代码证明引用存在且源未变，不自动证明语义推断完全正确；材料不支持的判断应为 candidate。refresh/readKnowledge 重新核对来源，stale/missing/candidate 不能供执行使用。增量更新保留未受影响卡和历史，不用新元数据把旧卡洗成有效。

## 通道是真实只读 API

Slack adapter 从本地环境取得 token，闭包中使用固定官方域名和五种只读方法，不提供 send 方法。probe 实际调用接口，核对租户、本人、允许频道、双人本人DM与少量历史，并保存分项回执，不保存正文或凭据。

本地 status 只能读缓存，不能知道环境 token 已换成哪个账号，因此明确 cached_not_rechecked；每次 probe/tick 会重新认证。配置或账号变化使旧探测失效。首次仅支持公开频道试点，小量历史不代表全量消息覆盖或线程完整性。

## 权限验收与知识消费

tick 从真实消息取得 sender、tenant、channel、message ID；消息里的自述身份或引用批准不授予权限。明确 JSON 请求意图也只是待授权的数据，须精确匹配 grant 的 scope/action/destination。普通自然语言或范围未知时转本人。

已获授权的 dry-run 计划再调用 readKnowledge，只引用来源仍有效的 documented 卡 generation 与 ID；没有有效知识就转本人。卡片正文不落通道台账，也不向未授权请求返回。knowledge_read 是当前 Agent 的内部知识入口，并不提供卡片级来客ACL；正式回答仍需 Agent 按获准scope取用适用材料。

dry-run 账本与生产状态、游标分开。相同稳定 requestId 不重复增加记录，源失效后旧计划降级并移除旧知识引用。工具不会执行分析任务或发送消息。

## 仍由原 Agent 承担的部分

常驻运行、正式业务动作、批准消费和对外回复仍使用原 Agent 与工具授权，并按 RUNBOOK 独立验收。formal tool ACL 不是本项目的完整安全沙箱；dry-run 代码路由也不能证明无人值守执行已安全上线。发送不明时先查结果，不能盲重发；API成功不等于已读。

DSH adapter 与 CLI 共用模块；DSH 写操作从宿主当前 cwd 和 sandboxPolicy 取得范围，不接受模型输入的任意路径或 token。市场索引是本项目自托管的分发入口，不代表官方收录。
