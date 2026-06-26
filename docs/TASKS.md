# LifeTracker 任务看板

> 任务状态唯一来源。产品需求和路线见 [PRD.md](./PRD.md)。

## 状态规则

| 状态 | 含义 |
|---|---|
| `todo` | 尚未开始 |
| `in_progress` | 正在处理 |
| `done` | 已完成并验证 |
| `blocked` | 被外部条件阻塞 |

维护规则：

- 新需求先更新 `PRD.md`，再拆任务到本文件。
- 任务应尽量拆到 15-60 分钟可完成；大任务用 `Txx.1` 子任务。
- 完成任务时记录完成日期和关键验证。
- 不在本文件写长篇实现方案；方案写到 PRD 或代码注释/提交说明。

## 当前重点

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T36 | P0 | 后端 CloudRun 部署 | deployment | done | 已部署 `lifetracker-api`，健康检查通过 |
| T37 | P0 | 前端 CloudBase 部署 | deployment | done | 已部署 `lifetracker-web-003` |
| T38 | P0 | 域名配置 | deployment | todo | 前后端域名和 CORS |
| T39 | P0 | 环境变量管理 | deployment | done | 控制台配置，禁止硬编码密钥 |
| T40 | P0 | Android 生产包 | deployment | todo | EAS preview/production |
| T41 | P1 | iOS development build | deployment | todo | 免费账号 7 天证书限制 |

## 技术债与质量

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T54 | P0 | API 响应类型收敛 | frontend | done | 统一为 ApiResponse<T>，删除重复类型定义，消除 tsc 65个错误 |
| T55 | P0 | TypeScript 类型安全清理 | frontend | done | 前后端 tsc 全部通过，0 错误 |
| T56 | P1 | 统一错误处理 | frontend/backend | done | ErrorSnackbar + useErrorHandler + SafeScreen 集成 |
| T57 | P1 | 加载状态统一 | frontend | done | PageLoadable 组件 + items/todos 接入 |
| T58 | P1 | 网络重试机制 | frontend | done | withRetry + 指数退避 + 网络恢复等待 |
| T59 | P2 | Zustand 渲染优化 | frontend | done | useColors 分离订阅, selectors.ts, tab 订阅优化 |
| T60 | P2 | 图片加载优化 | frontend | done | CachedImage 组件 + 列表缩略图 + 上传进度 |
| T61 | P2 | CI/CD 优化 | deployment | todo | 自动构建与部署检查 |
| T62 | P1 | 功能测试覆盖 | testing | done | 49 个测试，覆盖 API/store/auth/retry/upload/barcode |

## 未来功能

| ID | 优先级 | 任务 | 模块 | 状态 | PRD |
|---|---|---|---|---|---|
| T44 | P2 | 协作共享 | collaboration | done | §5.4 - 已完成，含共享管理、权限控制、共享总览页 |
| T45 | P2 | 物品借用追踪 | borrowing | done | §5.4 - 已完成，含借用记录、归还、逾期状态 |
| T46 | P2 | 智能提醒 | reminders | done | §5.4 - 已完成，含保质期提醒、过期警告 |
| T47 | P3 | 物品价值追踪 | value | done | §5.4 - 已完成，含购买价格/估值/折旧/资产总览 |
| T48 | P3 | AI 物品识别 | ai | done | §5.4 - 已完成，含模拟识别 API |
| T49 | P3 | 数据看板 | analytics | done | §5.4 - 已完成，含高级统计/趋势/热力图 API |
| T50 | P3 | 日历视图 | calendar | done | §5.4 - 已完成，含日历网格/待办/事件 |
| T51 | P3 | 模板功能 | templates | done | §5.4 - 已完成，含模板管理、从模板创建、保存为模板 |
| T52 | P3 | 备份恢复 | backup | done | §5.4 - 已完成，含数据导出JSON/CSV、导入恢复、数据统计 |
| T53 | P3 | 桌面小组件 | widgets | done | §5.4 - 已完成，含 PWA 安装/统计小组件/待办列表 |

## 已完成里程碑

| ID | 任务 | 模块 | 完成日期 |
|---|---|---|---|
| T01 | 项目架构搭建 | project | 2026-06-23 |
| T02 | 前端 Expo 初始化 | frontend | 2026-06-23 |
| T03 | 后端 NestJS 初始化 | backend | 2026-06-23 |
| T04 | Supabase 集成 | database | 2026-06-23 |
| T05 | 邮箱登录注册 | auth | 2026-06-23 |
| T06 | OAuth 登录框架 | auth | 2026-06-23 |
| T07 | 密码重置 | auth | 2026-06-23 |
| T08 | 首页 | home | 2026-06-23 |
| T09 | 物品 CRUD | items | 2026-06-23 |
| T10 | 待办 CRUD | todos | 2026-06-23 |
| T11 | 分类管理 | categories | 2026-06-23 |
| T12 | 位置管理 | locations | 2026-06-23 |
| T13 | 图片上传 | upload | 2026-06-23 |
| T14 | 数据统计 | stats | 2026-06-23 |
| T15 | 通知中心 | notifications | 2026-06-23 |
| T16 | 账号管理 | account | 2026-06-23 |
| T17 | 反馈建议 | feedback | 2026-06-23 |
| T18 | 设置页 | settings | 2026-06-23 |
| T19 | 骨架屏加载 | components | 2026-06-23 |
| T20 | 左滑删除 | components | 2026-06-23 |
| T21 | PWA 配置 | pwa | 2026-06-23 |
| T22 | 微信登录 | auth | 2026-06-24 |
| T23 | 数据同步 | sync | 2026-06-24 |
| T24 | 离线模式 | offline | 2026-06-24 |
| T25 | 导出数据 | export | 2026-06-24 |
| T26 | 修改密码 | auth | 2026-06-24 |
| T27 | 深色模式 | theme | 2026-06-24 |
| T28 | 待办拖拽排序 | todos | 2026-06-24 |
| T29 | 分类颜色选择器 | categories | 2026-06-24 |
| T30 | 子位置/子分类 | hierarchy | 2026-06-24 |
| T31 | 图片管理优化 | upload | 2026-06-24 |
| T32 | Web 推送通知 | notifications | 2026-06-24 |
| T33 | 全局搜索 | search | 2026-06-24 |
| T34 | 二维码/条形码 | items | 2026-06-24 |
| T35 | 性能优化 | optimization | 2026-06-24 |
| T42 | 单元测试框架 | testing | 2026-06-24 |
| T62 | 功能测试覆盖 | testing | 2026-06-26 |
| T43 | 错误监控框架 | monitoring | 2026-06-24 |
| T36 | 后端 CloudRun 部署 | deployment | 2026-06-26 |
| T37 | 前端 CloudBase 部署 | deployment | 2026-06-26 |
| T57 | 加载状态统一 | frontend | 2026-06-26 |
| T59 | Zustand 渲染优化 | frontend | 2026-06-26 |
| T60 | 图片加载优化 | frontend | 2026-06-26 |
| T54 | API 响应类型收敛 | frontend | 2026-06-26 |
| T55 | TypeScript 类型安全清理 | frontend | 2026-06-26 |
| T56 | 统一错误处理 | frontend | 2026-06-26 |
| T39 | 环境变量管理 | deployment | 2026-06-26 |

## 统计

| 状态 | 数量 |
|---|---:|
| done | 53 |
| todo | 8 |
| in_progress | 0 |
| blocked | 0 |

最后更新：2026-06-26
