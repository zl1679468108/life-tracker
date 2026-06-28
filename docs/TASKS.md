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
| T72 | P0 | v1.3.0 产品体验标准化与首页/工作台高保真还原 | frontend/docs | done | 2026-06-27 PRD/原型文档更新，首页/工作台/Tab Bar 按参考图重构 |
| T73 | P0 | 方案二：frontend-design + UI/UX Pro Max 核心页面美化 | frontend | done | 2026-06-27 物品列表、待办列表、消息、我的统一为深色设计系统 |
| T74 | P0 | 界面改版三阶段 Handoff | docs/frontend | done | 2026-06-28 本地完整交互地图已作为第三阶段视觉源，见 `docs/FIGMA_HANDOFF.md` |
| T75 | P0 | v1.4.1 高保真交互地图 1:1 实现 | frontend/backend | todo | 以 `docs/design/lifetracker-v1.4-complete-interaction-map.html?v=20260628-5` 和 PRD v1.4.1 为准 |

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

## 界面改版三阶段 Handoff

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T74.1 | P0 | 第一阶段：PRD 冻结与去冗余边界确认 | docs | done | 2026-06-28 已更新 `docs/PRD.md` 与 `docs/HANDOFF_STAGE_1_PRD.md` |
| T74.2 | P0 | 第二阶段：UI 设计规范、线框原型、高保真稿与 UI Handoff | design/docs | done | 2026-06-28 完整交互地图覆盖 16 个功能大类、40 个功能界面/状态 |
| T74.3 | P0 | 第三阶段：按定稿 1:1 实现前端页面 | frontend | todo | 任务拆入 T75；按完整交互地图逐屏实现，不新增产品范围 |

## v1.4.1 高保真交互地图 1:1 实现

设计源：

- PRD: [PRD.md](./PRD.md) v1.4.1
- Handoff: [FIGMA_HANDOFF.md](./FIGMA_HANDOFF.md)
- 高保真交互地图: [lifetracker-v1.4-complete-interaction-map.html](./design/lifetracker-v1.4-complete-interaction-map.html)
- 样式源: [lifetracker-v1.4-complete-interaction-map.css](./design/lifetracker-v1.4-complete-interaction-map.css)
- 图标源: [lifetracker-v1.4-icons.svg](./design/lifetracker-v1.4-icons.svg)

实现边界：

- 不新增一级 Tab；底部固定 `首页 / 工作台 / 消息 / 我的`。
- 工作台不展示 `我的` 入口，不承载业务列表、表单、统计图表或详情内容。
- 共享不再作为独立工作台入口，只存在于消息好友操作和物品/待办编辑上下文。
- 全模块默认实现 `列表 / 新增 / 编辑`，历史详情路由只做兼容复用编辑页或只读摘要。
- 搜索默认是标题栏图标，只有主动搜索态才展示输入框。
- 删除、退出登录、清理数据、删除好友、批量删除等危险动作统一使用应用内小弹窗确认。

### 设计系统与通用组件

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.1 | P0 | 对齐 v1.4.1 设计 token | frontend/theme | done | 2026-06-28 `appDesign` 已映射深浅色、字号、间距、圆角并保留 `useColors()` |
| T75.2 | P0 | 建立通用页面骨架组件 | frontend/ui | done | 2026-06-28 新增 `AppScreen`，封装 SafeArea、ScrollView、底部安全区和错误提示 |
| T75.3 | P0 | 建立标题栏动作组件 | frontend/ui | done | 2026-06-28 新增 `AppHeader`，支持返回、搜索、通知、新增等 44x44 图标按钮 |
| T75.4 | P0 | 建立通用列表行组件 | frontend/ui | done | 2026-06-28 新增 `AppListRow`，工作台和我的页已接入 |
| T75.5 | P0 | 建立通用 CRUD 表单组件 | frontend/ui | done | 2026-06-28 新增 `FormActions`，物品/待办新增编辑页已接入底部“取消 + 保存/保存修改” |
| T75.6 | P0 | 建立应用内确认弹窗 | frontend/ui | done | 2026-06-28 新增 `AppAlertHost`，`showAlert` 改为应用内弹窗，不再调用原生 Alert / Web confirm |
| T75.7 | P0 | 建立搜索触发态组件 | frontend/ui | done | 2026-06-28 首页和工作台标题栏搜索图标已打开 `GlobalSearch`，支持功能入口、搜索态、清除和回车搜索 |
| T75.8 | P0 | 统一左滑删除交互 | frontend/ui | done | 2026-06-28 `SwipeableRow` 已适配 v1.4.1 深浅色并用于物品、待办、模板、借用、分类、位置；好友删除随 T75.32 好友操作页实现 |
| T75.9 | P1 | 统一空态、加载、错误态 | frontend/ui | done | 2026-06-28 `PageLoadable`、`Loading`、`Skeleton`、`EmptyState` 已统一 v1.4.1 深浅色 token |
| T75.10 | P1 | 统一浅色模式同构样式 | frontend/theme | done | 2026-06-28 基础 UI、搜索、空态、模板卡、借用卡已统一使用 `appDesign` 深浅色 token 和边框层级 |

### 导航与入口边界

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.11 | P0 | 审计现有路由与 PRD 入口矩阵 | frontend/navigation | done | 2026-06-28 已对照 PRD §3.5、§3.6 核对工作台和我的外层入口；`settings/shares` 注册但重定向，不再作为独立入口 |
| T75.12 | P0 | 注册 v1.4.1 所需 Stack.Screen | frontend/navigation | done | 2026-06-28 分类、位置、模板、借用、日历、统计、通知、数据、资产、小组件、账号、密码、主题、语言、反馈及 auth 子页已注册 |
| T75.13 | P0 | 工作台入口按交互地图重排 | frontend/workbench | done | 2026-06-28 已移除工作台“我的”和独立共享管理入口，保留核心/管理/生活记录/数据与提醒分组 |
| T75.14 | P0 | 我的页入口按 PRD 外层平铺 | frontend/profile | done | 2026-06-28 我的页外层保留账号与安全、偏好设置、数据与支持，移除标题副文案 |
| T75.15 | P1 | 历史详情路由兼容降级 | frontend/navigation | done | 2026-06-28 `/item/[id]`、`/todo/[id]` 均直接复用 create/edit 页面，Stack 标题为编辑语义，不新增详情页视觉 |
| T75.16 | P1 | 全局搜索入口收口 | frontend/search | done | 2026-06-28 首页/工作台标题栏搜索进入 `GlobalSearch`，支持物品、待办和工作台功能入口 |

### 首页与核心业务页

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.17 | P0 | 首页按第 1 排第 1 列还原 | frontend/home | done | 2026-06-28 首页已对齐今日总览、标题栏搜索、问候语、3 个统计卡、2 个快捷动作、最近 3 条待办和下拉刷新 |
| T75.18 | P0 | 首页通知入口联动通知中心 | frontend/home | done | 2026-06-28 首页通知铃铛支持未读红点、推送触发抖动、点击进入 `/settings/notifications` |
| T75.19 | P0 | 物品列表按交互地图还原 | frontend/items | todo | 标题栏搜索/新增、筛选 chips、列表卡、左滑删除、下拉刷新、批量删除确认 |
| T75.20 | P0 | 物品新增页按通用表单还原 | frontend/items | todo | 名称、分类、位置、图片、描述、AI 识别上下文、底部取消/保存 |
| T75.21 | P0 | 物品编辑页按通用表单还原 | frontend/items | todo | 复用新增结构，支持保存修改、共享入口、借用入口、价值上下文、只读摘要判断 |
| T75.22 | P0 | 待办列表按交互地图还原 | frontend/todos | todo | 分段筛选、搜索/新增、优先级、截止时间、完成态、左滑删除、快速完成 |
| T75.23 | P0 | 待办新增页按通用表单还原 | frontend/todos | todo | 标题、优先级、描述、图片、截止时间、提醒时间、关联物品 |
| T75.24 | P0 | 待办编辑页按通用表单还原 | frontend/todos | todo | 状态切换、提醒更新、通知取消/重建、只读摘要判断 |
| T75.25 | P1 | 物品/待办排序 Sheet 视觉统一 | frontend/items/todos | todo | 选中态高亮；物品支持添加时间/名称/分类，待办支持添加时间/优先级/名称 |

### 消息、好友验证与共享收拢

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.26 | P0 | 设计好友关系和申请数据表迁移 | database | todo | 新增或补齐好友关系、申请状态、置顶、共享权限所需字段；同步 `docs/database-init.sql` |
| T75.27 | P0 | 后端好友申请 API | backend/messages | todo | 搜索用户、发送申请、接受/拒绝申请、申请结果通知；同意前不得建聊 |
| T75.28 | P0 | 后端好友列表与置顶 API | backend/messages | todo | 仅返回已通过好友；支持置顶/取消置顶、删除好友、小弹窗动作由前端承接 |
| T75.29 | P0 | 后端共享权限收拢到好友上下文 | backend/shares | todo | 仅资源所有者可对已通过好友授予查看/编辑权限；共享后写入卡片消息 |
| T75.30 | P0 | 消息列表按第 5 排还原 | frontend/messages | todo | 好友/系统通知分段、未读红点、右上添加好友、下拉刷新 |
| T75.31 | P0 | 添加好友页按交互地图还原 | frontend/messages | todo | 搜索邮箱/用户名、候选用户列表、验证消息、发送申请 |
| T75.32 | P0 | 好友操作页按交互地图还原 | frontend/messages | todo | 置顶、共享设置、删除好友；删除必须左滑触发并弹窗确认 |
| T75.33 | P0 | 聊天页按交互地图还原 | frontend/messages | todo | 文字气泡、系统消息、物品/待办卡片、输入栏、发送状态 |
| T75.34 | P1 | 分享入口改为选择已通过好友 | frontend/items/todos/messages | todo | 物品/待办编辑页共享只展示好友，成功后进入或更新对应好友对话卡片 |
| T75.35 | P1 | 消息实时推送适配好友申请状态 | frontend/backend | todo | socket 事件覆盖申请、申请结果、新消息、对话更新 |

### 管理工具与生活记录

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.36 | P0 | 分类管理列表/新增/编辑还原 | frontend/categories | todo | 系统预设只读标识，自定义可左滑删除；字段含名称、类型、颜色、图标、父级 |
| T75.37 | P0 | 位置管理列表/新增/编辑还原 | frontend/locations | todo | 层级列表、父位置选择、系统预设只读、自定义左滑删除 |
| T75.38 | P0 | 模板管理列表/新增/编辑还原 | frontend/templates | todo | 物品/待办模板、套用入口、保存为模板上下文 |
| T75.39 | P0 | 借用管理列表/新增/编辑还原 | frontend/borrowings | todo | 借用人、物品、借出/归还日期、状态、逾期表达 |
| T75.40 | P1 | 日历月视图与提醒编辑还原 | frontend/calendar | todo | 今天、选中、有提醒三种状态；当天待办/提醒列表；编辑提醒表单 |
| T75.41 | P1 | 低频管理模块统一删除确认 | frontend/settings | todo | 分类、位置、模板、借用统一左滑删除 + 小弹窗 |

### 数据与提醒模块

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.42 | P0 | 数据统计页按第 12 排还原 | frontend/stats | todo | KPI、时间筛选、待办趋势、物品分类分布、空状态 |
| T75.43 | P0 | 通知中心按第 13 排还原 | frontend/notifications | todo | 全部/未读/已读、标记已读、点击深链、通知设置入口 |
| T75.44 | P1 | 数据管理页按第 14 排还原 | frontend/data | todo | 导出 JSON/CSV、导入备份、清理回收站；清理弹窗确认 |
| T75.45 | P1 | 资产总览页按第 15 排还原 | frontend/assets | todo | 总资产、分类资产分布、明细、价值编辑表单 |
| T75.46 | P1 | 桌面小组件页按第 16 排还原 | frontend/widgets | todo | PWA 说明、预览、快捷入口配置、Web/Android 降级说明 |
| T75.47 | P1 | 通知调度与持久化回归 | frontend/backend | todo | `reminders:fired`、已读状态 AsyncStorage、重复提醒防护 |

### 我的与设置

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.48 | P0 | 我的外层页按第 6 排还原 | frontend/profile | todo | 资料卡、账号、偏好、支持入口；不再隐藏常用设置 |
| T75.49 | P0 | 账号管理页按通用编辑表单还原 | frontend/account | todo | 头像、昵称、邮箱、用户 ID 只读、保存资料 |
| T75.50 | P0 | 退出登录改为应用内确认弹窗 | frontend/auth | done | 2026-06-28 外层我的页和账号管理页退出登录均走全局应用内确认弹窗 |
| T75.51 | P1 | 修改密码页补齐和视觉统一 | frontend/auth | todo | 当前密码、新密码、确认密码、错误提示、提交 loading |
| T75.52 | P1 | 主题/语言页按单选列表还原 | frontend/settings | todo | 跟随系统、深色、浅色；中文/英文；即时或保存后生效按现有 store 规则 |
| T75.53 | P1 | 数据同步和反馈入口视觉统一 | frontend/settings | todo | 同步 loading/success/error；反馈表单接现有 feedback API |

### 质量验证与发布准备

| ID | 优先级 | 任务 | 模块 | 状态 | 备注 |
|---|---|---|---|---|---|
| T75.54 | P0 | 跑前端 TypeScript 检查 | frontend/testing | done | 2026-06-28 `cd frontend && npx tsc --noEmit` 通过；最近验证同日通过 |
| T75.55 | P0 | 跑后端构建检查 | backend/testing | todo | 涉及好友/共享 API 后执行 `cd backend && npm run build` |
| T75.56 | P0 | 跑 Web 构建检查 | frontend/testing | done | 2026-06-28 `cd frontend && npm run build:web` 通过；最近验证同日通过 |
| T75.57 | P0 | 关键接口 curl 验证 | backend/testing | todo | 好友申请、好友列表、共享权限、消息卡片、通知深链 |
| T75.58 | P1 | Web PWA 桌面截图 QA | frontend/qa | todo | 对比首页、工作台、物品、待办、消息、我的、低频模块深浅色 |
| T75.59 | P1 | Android Development Build 冒烟 | frontend/qa | todo | 导航、键盘、SafeArea、左滑、弹窗、通知降级 |
| T75.60 | P1 | 更新任务完成记录和版本信息 | docs/frontend | todo | 完成后记录日期、验证命令、版本号和已知风险 |

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
| todo | 41 |
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

## v1.3.0 产品体验标准化

| ID | 优先级 | 任务 | 模块 | 状态 | 说明 |
|---|---|---|---|---|---|
| T72.1 | P0 | 梳理现有页面问题和去冗余原则 | docs | done | 2026-06-27 已写入 PRD v1.3.0 |
| T72.2 | P0 | 输出首页/工作台高保真原型方案 | docs | done | 2026-06-27 新增 docs/PROTOTYPE.md |
| T72.3 | P0 | 首页 1:1 还原深色原型 | frontend | done | 2026-06-27 Header/统计/快捷操作/最近待办已重构 |
| T72.4 | P0 | 工作台 1:1 还原深色入口网格 | frontend | done | 2026-06-27 3 列 11 入口矩阵已重构 |
| T72.5 | P1 | 底部 Tab Bar 视觉统一 | frontend | done | 2026-06-27 黑色背景、橙色选中态、灰色未选中态 |

## v1.3.1 核心页面设计系统统一

| ID | 优先级 | 任务 | 模块 | 状态 | 说明 |
|---|---|---|---|---|---|
| T73.1 | P0 | 使用 UI/UX Pro Max 审查页面信息架构 | ux | done | 2026-06-27 明确首页/工作台/列表/消息/我的职责边界 |
| T73.2 | P0 | 使用 frontend-design 生成核心移动端视觉概念 | design | done | 2026-06-27 概念图路径：/Users/zhaolong/.codex/generated_images/019f0965-3b22-79a2-9982-e2b341503470/ig_0424fa30fec7ccc6016a3fe66acf04819a873fcab670617e6b.png |
| T73.3 | P0 | 新增统一 appDesign 设计 token | frontend | done | 2026-06-27 深色背景、表面、文本、语义色、圆角、阴影 |
| T73.4 | P0 | 物品列表深色化和信息层级优化 | frontend | done | 2026-06-27 搜索、筛选、列表卡、批量栏、排序面板完成 |
| T73.5 | P0 | 待办列表深色化和状态表达优化 | frontend | done | 2026-06-27 筛选、拖拽、优先级、截止日期、排序面板完成 |
| T73.6 | P1 | 消息列表深色化和新建对话面板优化 | frontend | done | 2026-06-27 常联系好友、对话列表、搜索用户、好友列表完成 |
| T73.7 | P1 | 我的页面深色化和账号设置结构优化 | frontend | done | 2026-06-27 资料卡、同步状态、设置分组完成 |

最后更新：2026-06-28（T75.10 已完成，基础 UI 与低频卡片深浅色同构；前端 TypeScript 检查通过）
