# LifeTracker 文档索引

> **最后同步**: 2026-07-24  
> **文档状态**: ✅ 闭环（v1.4.4 主线收口，无开放任务）  
> **任务来源**: [TASKS.md](./TASKS.md)（仅未完成）

## 1. 当前状态

| 项 | 状态 |
|---|---|
| 产品版本 | v1.4.4 |
| 主线开发 | ✅ 收口 |
| 可执行任务 | 无 |
| 权威建表 | [database-init.sql](./database-init.sql) |
| 发布说明（归档） | [release/v1.4.4-rc.md](./release/v1.4.4-rc.md) |

新需求入口：**先改 PRD → 再写 TASKS → 再改代码 → 回写 PROTOTYPE/SQL/README 状态**。

## 2. 决策优先级

| 优先级 | 文档 | 职责 | 不写什么 |
|---|---|---|---|
| 1 | [PRD.md](./PRD.md) | 做什么、为什么、边界、入口矩阵、交互/视觉规范 | 实现细节、任务勾选 |
| 2 | [PROTOTYPE.md](./PROTOTYPE.md) | 页面布局、路由、交互流、异常态 | 产品路线长文 |
| 3 | [TASKS.md](./TASKS.md) | **仅**未完成待办 | 已完成任务长历史 |
| 4 | [database-init.sql](./database-init.sql) | 权威表结构 / 幂等补齐 | 业务文案 |
| 5 | 当前代码 | 最终实现 | — |

Agent 规则：[AGENTS.md](../AGENTS.md)

## 3. 文档地图

| 文档 | 类型 | 状态 |
|---|---|---|
| [PRD.md](./PRD.md) | 现行产品规范 | 现行 |
| [PROTOTYPE.md](./PROTOTYPE.md) | 现行原型/路由 | 现行 |
| [TASKS.md](./TASKS.md) | 任务看板 | 现行（空） |
| [database-init.sql](./database-init.sql) | 数据库基准 | 现行 |
| [migrations/](./migrations/) | 线上增量 SQL | 现行（已合入 init 的补丁可仅作历史执行记录） |
| [QA_ACCOUNTS.md](./QA_ACCOUNTS.md) | QA 账号（敏感） | 现行 |
| [release/v1.4.4-rc.md](./release/v1.4.4-rc.md) | v1.4.4 RC 归档 | 归档 |
| 仓库 `picture/` | 设计参考图 | 现行（非 docs 内） |
| 仓库 `scripts/qa/` | 冒烟脚本 | 现行 |

**已移除/不存在（勿再引用）**: `docs/qa/`、`docs/design/`（历史路径已废弃）。

## 4. 闭环维护约定

1. **需求变更** → 更新 PRD 对应章节，再拆 TASKS。  
2. **页面/路由变更** → 同步 PROTOTYPE。  
3. **表结构变更** → 先改 `database-init.sql`；线上补齐再加 `migrations/*.sql`。  
4. **任务完成** → 从 TASKS 删除或只留空表；不在 TASKS 堆叠长完成日志。  
5. **发布/里程碑** → 写入 `release/` 后标记归档，正文状态回写 README + PRD §5。  
6. **完成一轮后** → 更新本文件「最后同步」与「当前状态」。

## 5. 常用验证

```bash
cd frontend && npx tsc --noEmit
cd frontend && npm run build:web
cd backend && npm run build
# 可选：scripts/qa/* 或真实 API 冒烟（见 QA_ACCOUNTS.md）
```
