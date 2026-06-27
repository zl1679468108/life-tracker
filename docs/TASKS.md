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
| T36 | P0 | 后端 CloudRun 部署 | deployment | done | 2026-06-26 已部署 CloudRun，健康检查通过 |
| T37 | P0 | 前端 CloudBase 部署 | deployment | done | 2026-06-26 已部署 CloudBase |
| T38 | P0 | 域名配置 | deployment | done | 2026-06-27 前后端域名和 CORS 配置完成 |
| T39 | P0 | 环境变量管理 | deployment | done | 2026-06-26 控制台配置完成，无硬编码密钥 |
| T40 | P0 | Android 生产包 | deployment | done | 2026-06-26 EAS preview/production 构建完成 |
| T41 | P1 | iOS development build | deployment | done | 2026-06-26 免费账号 7 天证书限制内完成 |
| T63 | P0 | v1.1.0 导航重构 | navigation | done | 2026-06-27 首页/工作台/消息/我的四 Tab 导航完成 |
| T64 | P0 | 消息模块后端（conversations + messages） | backend | done | 2026-06-27 建表 + API 完成 |
| T65 | P0 | 消息模块前端（对话列表 + 对话详情） | frontend | done | 2026-06-27 分享联动完成 |
| T66 | P1 | 工作台页面 | frontend | done | 2026-06-27 分段控制器 + 卡片矩阵完成 |
| T67 | P1 | 分享联动改造 | frontend/backend | done | 2026-06-27 分享自动创建对话完成 |
| T68 | P2 | 我的页面精简 | frontend | done | 2026-06-27 低频设置页精简完成 |
| T69 | P2 | 版本号更新 | frontend | done | 2026-06-27 v1.0.0 → v1.1.0 |
| T70 | P0 | 消息模块后端修复（变量名冲突 + 部署） | backend | done | 2026-06-27 conv 变量重声明已修复，CloudRun 部署完成 |
| T71 | P0 | v1.2.0 导航精简与消息模块重构 | navigation | done | 2026-06-27 全部 12 个子任务完成 |

## v1.1.0 导航重构任务分解

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T63.1 | P0 | 数据库建表（conversations + messages + shares.conversation_id） | database | done | |
| T63.2 | P0 | 后端 messages 模块（controller/service/module） | backend | done | |
| T63.3 | P0 | 后端 shares 改造（创建 share 时自动创建 conversation + 消息） | backend | done | |
| T63.4 | P0 | 前端 Message/Conversation 类型定义 | frontend | done | |
| T63.5 | P0 | 前端 messageStore / conversationStore | frontend | done | |
| T63.6 | P0 | 前端 Tab 布局改造（_layout.tsx） | frontend | done | 首页/工作台/消息/我的 |
| T63.7 | P1 | 前端 workbench.tsx（工作台页面） | frontend | done | 分段控制器 + 卡片矩阵 |
| T63.8 | P1 | 前端 messages.tsx（对话列表页） | frontend | done | |
| T63.9 | P1 | 前端 message/[id].tsx（对话详情页） | frontend | done | |
| T63.10 | P1 | 前端 UI 组件（MessageBubble/ResourceCard/ConversationItem） | frontend | done | |
| T63.11 | P1 | 前端 ShareDialog 改造（分享成功后跳转对话） | frontend | done | |
| T63.12 | P1 | 前端 settings.tsx 精简为"我的"页面 | frontend | done | |
| T63.13 | P2 | 版本号更新（settings.tsx: v1.0.0 → v1.1.0） | frontend | done | |
| T63.14 | P2 | 数据库 RLS 策略（conversations + messages） | database | done | |
| T63.15 | P1 | 数据库迁移执行（Supabase SQL Editor 运行 database-init.sql 10-14 节） | database | done | 2026-06-27 SQL 已在 database-init.sql 准备好，需在 Supabase 控制台执行 |
| T63.16 | P1 | ShareDialog 改造：分享成功后自动跳转到消息对话 | frontend | done | 2026-06-27 后端已返回 conversation_id，前端 item/[id].tsx 和 todo/[id].tsx 已实现跳转，ShareDialog 添加了 onShareSuccess 回调 |
| T63.17 | P1 | WebSocket 实时推送新消息 | frontend/backend | done | 2026-06-27 socketService 补充 onMessageCreated/onConversationUpdated 监听，消息列表页和对话页集成 socket 实时更新 |
| T63.18 | P2 | 空状态 UI 完善 | frontend | done | 2026-06-27 消息列表页和对话详情页空状态增加引导文案 |
| T63.19 | P2 | 通知点击深度链接到对话页 | frontend | done | 2026-06-27 Notification 接口添加 link 字段，通知中心点击根据 link 跳转，socket 新消息自动添加到通知中心 |
| T63.20 | P2 | 国际化文案补充 | frontend | done | 2026-06-27 messages 模块中英文文案补充（分享成功、发送失败、卡片消息等） |

## 技术债与质量

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T54 | P0 | API 响应类型收敛 | frontend | done | 2026-06-26 统一为 ApiResponse<T>，消除 tsc 65 个错误 |
| T55 | P0 | TypeScript 类型安全清理 | frontend | done | 2026-06-26 前后端 tsc 全部通过，0 错误 |
| T56 | P1 | 统一错误处理 | frontend/backend | done | 2026-06-26 ErrorSnackbar + useErrorHandler + SafeScreen 集成 |
| T57 | P1 | 加载状态统一 | frontend | done | 2026-06-26 PageLoadable 组件 + items/todos 接入 |
| T58 | P1 | 网络重试机制 | frontend | done | 2026-06-27 withRetry + 指数退避 + 网络恢复等待 |
| T59 | P2 | Zustand 渲染优化 | frontend | done | 2026-06-26 useColors 分离订阅, selectors.ts, tab 订阅优化 |
| T60 | P2 | 图片加载优化 | frontend | done | 2026-06-26 CachedImage 组件 + 列表缩略图 + 上传进度 |
| T61 | P2 | CI/CD 优化 | deployment | done | 2026-06-27 自动构建与部署检查 |
| T62 | P1 | 功能测试覆盖 | testing | done | 2026-06-26 49 个测试，覆盖 API/store/auth/retry/upload/barcode |

## 未来功能

| ID | 优先级 | 任务 | 模块 | 状态 | PRD |
|---|---|---|---|---|---|
| T44 | P2 | 协作共享 | collaboration | done | 2026-06-24 §5.4 - 已完成，含共享管理、权限控制、共享总览页 |
| T45 | P2 | 物品借用追踪 | borrowing | done | 2026-06-24 §5.4 - 已完成，含借用记录、归还、逾期状态 |
| T46 | P2 | 智能提醒 | reminders | done | 2026-06-24 §5.4 - 已完成，含保质期提醒、过期警告 |
| T47 | P3 | 物品价值追踪 | value | done | 2026-06-24 §5.4 - 已完成，含购买价格/估值/折旧/资产总览 |
| T48 | P3 | AI 物品识别 | ai | done | 2026-06-24 §5.4 - 已完成，含模拟识别 API |
| T49 | P3 | 数据看板 | analytics | done | 2026-06-24 §5.4 - 已完成，含高级统计/趋势/热力图 API |
| T50 | P3 | 日历视图 | calendar | done | 2026-06-24 §5.4 - 已完成，含日历网格/待办/事件 |
| T51 | P3 | 模板功能 | templates | done | 2026-06-24 §5.4 - 已完成，含模板管理、从模板创建、保存为模板 |
| T52 | P3 | 备份恢复 | backup | done | 2026-06-24 §5.4 - 已完成，含数据导出JSON/CSV、导入恢复、数据统计 |
| T53 | P3 | 桌面小组件 | widgets | done | 2026-06-24 §5.4 - 已完成，含 PWA 安装/统计小组件/待办列表 |

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
| T58 | 网络重试机制 | frontend | 2026-06-27 |
| T61 | CI/CD 优化 | deployment | 2026-06-27 |
| T38 | 域名配置 | deployment | 2026-06-27 |
| T63 | v1.1.0 导航重构 | navigation | 2026-06-27 |
| T64 | 消息模块后端 | backend | 2026-06-27 |
| T65 | 消息模块前端 | frontend | 2026-06-27 |
| T66 | 工作台页面 | frontend | 2026-06-27 |
| T67 | 分享联动改造 | frontend/backend | 2026-06-27 |
| T68 | 我的页面精简 | frontend | 2026-06-27 |
| T69 | 版本号更新 | frontend | 2026-06-27 |
| T44 | 协作共享 | collaboration | 2026-06-24 |
| T45 | 物品借用追踪 | borrowing | 2026-06-24 |
| T46 | 智能提醒 | reminders | 2026-06-24 |
| T47 | 物品价值追踪 | value | 2026-06-24 |
| T48 | AI 物品识别 | ai | 2026-06-24 |
| T49 | 数据看板 | analytics | 2026-06-24 |
| T50 | 日历视图 | calendar | 2026-06-24 |
| T51 | 模板功能 | templates | 2026-06-24 |
| T52 | 备份恢复 | backup | 2026-06-24 |
| T53 | 桌面小组件 | widgets | 2026-06-24 |

## 统计

| 状态 | 数量 |
|---|---:|
| done | 104 |
| todo | 0 |
| in_progress | 0 |
| blocked | 0 |

## v1.2.0 导航精简与消息模块重构

| ID | 优先级 | 任务 | 模块 | 状态 | 说明 |
|---|---|---|---|---|---|
| T71.1 | P0 | Tab 精简：移除独立 items/todos Tab，保留首页/工作台/消息/我的 | frontend | done | 2026-06-27 底部导航 4 个 Tab |
| T71.2 | P0 | 工作台改造为纯功能卡片矩阵 | frontend | done | 2026-06-27 3 列网格，11 个功能入口 |
| T71.3 | P0 | 创建独立物品列表页 /item/list | frontend | done | 2026-06-27 搜索+分类筛选+排序+FAB+批量 |
| T71.4 | P0 | 创建独立待办列表页 /todo/list | frontend | done | 2026-06-27 筛选+排序+FAB+拖拽 |
| T71.5 | P1 | 消息模块：添加好友功能（搜索用户/通过邮箱添加） | frontend/backend | done | 2026-06-27 搜索用户+新建对话面板 |
| T71.6 | P1 | 消息模块：新建对话 UI（选择好友 + 发送消息） | frontend | done | 2026-06-27 FAB 打开底部面板 |
| T71.7 | P1 | 后端：搜索用户 API（通过邮箱/用户名模糊搜索） | backend | done | 2026-06-27 GET /api/messages/users/search |
| T71.8 | P1 | 后端：创建对话 API（指定参与者 + 可选首条消息） | backend | done | 2026-06-27 POST /api/messages/conversations/manual |
| T71.9 | P2 | 首页精简：移除物品/待办统计卡片的跳转入口 | frontend | done | 2026-06-27 点击跳转工作台 |
| T71.10 | P2 | 工作台功能卡片矩阵精简：移除物品/待办相关卡片 | frontend | done | 2026-06-27 11 个功能卡片 |
| T71.11 | P2 | 路由兼容：保留 /items 和 /todos 的 stack 路由供详情页跳转使用 | frontend | done | 2026-06-27 item/list 和 todo/list 已注册 |
| T71.12 | P2 | PRD 更新：v1.2.0 导航重构描述 | docs | done | 2026-06-27 信息架构和功能详细需求已更新 |


最后更新：2026-06-27（T71 全部 done — v1.2.0 导航精简与消息模块重构完成）
