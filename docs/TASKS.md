# LifeTracker 任务看板

> 仅保留未完成任务。产品见 [PRD.md](./PRD.md)，原型见 [PROTOTYPE.md](./PROTOTYPE.md)。

## 当前状态（2026-07-24）

| 主线 | 状态 |
|---|---|
| v1.4.4 功能主线 | 已收口 |
| T95 / T96 缺陷修复 | 已收口并提交 |
| T97 可选优化执行 | 已收口 |

### T97 本轮（摘要）

| 项 | 处理 |
|---|---|
| 设置页壳统一 | 简单页 `AppScreen`；列表/底栏页 `SafeScreen`；`AppScreen` 支持 `padded`/`refreshControl` |
| CORS 多源 | `main.ts` + WebSocket gateway 支持逗号分隔 origin |
| multer 限制 | 上传 interceptor `fileSize: 5MB` 与 service 校验双保险 |
| env 文档 | `.env.example` 补充多源说明 |

**当前可执行任务：无。**

## 待办任务

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| — | — | （暂无） | — | — | — |

历史：T80–T97 已收口。
