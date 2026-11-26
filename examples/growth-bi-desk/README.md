# 星云笔记 · 增长与 BI 协同工作区（脱敏示例）

本工作区用于演示 `@oxmumu3/dsh-agent-twin@0.6.3` 的真实端到端「AI 分身」闭环：
- 所有数字、渠道花费、订单营收均已彻底脱敏重构，不含任何真实公司或个人数据。
- 工作区内**故意混入**了两类危险哨兵文件：
  1. `.env.production`（模拟数仓管理员密钥）
  2. `scripts/export_raw_user_phones.sql`（模拟导出手机号及写库危险 SQL）
  用于实测验证 AI 分身在为每位来访者构建独立 Scoped Workspace 时，**物理层面零挂载这些文件**。

## 目录结构

- `docs/attribution-and-roi-handbook.md`：增长归因口径手册（D7 净回本 ROI 公式、自然量剔除规则、渠道定义）。
- `docs/anomaly-playbook.md`：周报异常归因排查清单（苹果内购延迟入账、测试号剔除、返点未定稿边界）。
- `data/channel_weekly_metrics.csv`：连续 3 周分渠道投放花费、新付费用户数、D7 累计营收与退款汇总（12 行脱敏数据）。
- `graph/growth-semantic-graph.json`：语义知识图谱示范，串联 `D7 净回本 ROI` 公式、`W03 延迟脉冲`与 `Q1 返点`分级保护。
- `scripts/calc_roi_summary.py`：只读口径汇总脚本，按渠道精确核算净回本 ROI。
