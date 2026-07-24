# LifeTracker 任务看板

> 任务状态唯一来源。产品需求和路线见 [PRD.md](./PRD.md)，原型方案见 [PROTOTYPE.md](./PROTOTYPE.md)。
>
> **维护规则**：本文件**只保留未完成任务**。已完成记录见 git 与 release 文档。

## 状态规则

| 状态 | 含义 |
|---|---|
| `todo` | 尚未开始 |
| `in_progress` | 正在处理 |
| `done` | 完成后从本文件移除 |
| `blocked` | 被外部条件阻塞 |

---

## 当前状态（2026-07-24）

| 主线 | 状态 | 说明 |
|---|---|---|
| v1.4.4 功能主线 | 已收口 | 见 PRD §5.1 / release RC |
| T95 缺陷修复与优化 | 已收口 | 本轮 P0–P2 已落地并通过 build/tsc |

### T95 本轮已修复（摘要，非待办）

| ID | 问题 | 处理 |
|---|---|---|
| T95.1 | shares 用错误字段 `user_id`/`full_name` | 改为 `id`/`display_name`/`email` |
| T95.2 | `toUtcIso` 依赖服务器本地时区 | 无时区字符串按 `+08:00` 解析 |
| T95.3 | CORS 默认 8081 | 改为 3021 |
| T95.4 | 共享找不到用户 HTTP 200 | 改 `BadRequestException` |
| T95.5 | 搜索 query 注入 PostgREST 过滤 | `sanitizeSearchTerm` |
| T95.6 | 登出不吊销会话 | `POST /api/auth/logout` + 前端 `signOut` 调用 |
| T95.7 | 无引用 Workbench 列表组件 | 删除 `frontend/components/workbench` |

**当前可执行任务：无。**

---

## 待办任务

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| — | — | （暂无） | — | — | — |

---

## 可选后续优化（未立项，不拆任务）

| 项 | 说明 |
|---|---|
| 设置二级页统一 `AppScreen` | 部分页面仍手写容器，行为可用，视觉已大体一致 |
| 提醒调度全表扫描窗口 | 物品提醒 365 天窗口可再加索引/用户维度分片 |
| 搜索好友 PostgREST `.or` 仍用拼接 | 已清洗字符；后续可改为参数化 filter builder |
| production `CORS_ORIGIN` | `backend/.env.production` 仍为占位域名，上线前需替换 |

历史索引：T80–T94 已收口。
