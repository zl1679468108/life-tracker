# LifeTracker 任务看板

> 任务状态唯一来源。产品需求和路线见 [PRD.md](./PRD.md)，原型方案见 [PROTOTYPE.md](./PROTOTYPE.md)。

## 状态规则

| 状态 | 含义 |
|---|---|
| `todo` | 尚未开始 |
| `in_progress` | 正在处理 |
| `done` | 已完成并验证 |
| `blocked` | 被外部条件阻塞 |

维护规则：

- 新需求先更新 `PRD.md`，再拆任务到本文件。
- 完成任务时记录完成日期和关键验证。
- 之前版本已完成的里程碑不再保留在本看板中，可查看 PRD 附录路线或 git 历史。

---

## 2026-07-03 消息与首页体验优化

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T81.1 | P1 | 首页增加可视化内容 | frontend | done | 增加问候语、今天要看行动区、最近待办列表；`tsc --noEmit` + `build:web` 通过 |
| T81.2 | P1 | 消息列表移除系统对话入口 | frontend | done | 系统通知不再作为聊天会话打开，待处理好友申请以横幅形式展示 |
| T81.3 | P1 | 实现消息已读状态 | frontend/backend/db | done | 新增 `life_conversation_reads` 表，后端 `markAsRead` 持久化，未读数按最后已读计算；进入聊天页自动标记已读 |
| T81.4 | P2 | 修复对话列表用户名显示 | backend | done | `findConversations` 中 `other_user.display_name` 补充 email 前缀 fallback |
| T81.5 | P1 | 重新设计聊天页 | frontend | done | 去掉 "X 对 Y 说" 前缀、左右气泡增加头像、移除 awkward hero 区；`tsc --noEmit` + `build:web` 通过 |

## 2026-07-04 反馈修复

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T81.6 | P1 | 缩小首页问候语视觉层级 | frontend | done | 问候语字号从 22px 粗体降到 17px semiBold，颜色改为 textSecondary，不抢夺 "今日总览" 标题焦点 |
| T81.7 | P1 | 修复用户名仍显示未知用户 | backend | done | `findConversations` / `findMessages` / `enrichFriendship` 统一批量查 `life_profiles` + `auth.users` 补 email，兜底显示邮箱前缀 |
| T81.8 | P1 | 修复已读未生效 | backend | done | 将已读状态从 `maybeSingle` 改为按 `conversation_id` 批量 `in` 查询；`tsc` + `build` 通过 |
| T81.9 | P1 | 修复返回按钮跳到首页 | frontend | done | `_layout.tsx` 的 `headerLeft` 增加 `window.history.back()` 回退；`message/[id]` 聊天页返回也加兜底回到 `/(tabs)/messages` |

## 2026-07-04 后续反馈修复

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T82.1 | P1 | 首页问候语替换标题 | frontend | done | 去掉 AppHeader 的 "今日总览"，把 "夜深了，" / "今天也要加油哦" 放到顶部标题区 |
| T82.2 | P1 | 消息列表只展示已通过好友 | frontend | done | `chatConversations` 过滤为 accepted friends 的对话，并用好友列表 display_name 兜底显示；`tsc --noEmit` + `build:web` 通过 |

## 2026-07-04 物品列表筛选器优化

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T82.3 | P1 | 物品筛选栏改为 Picker 单选 | frontend | done | 分类/位置/状态改为 Select 触发器 + 底部单选弹窗，默认全部；同步更新 PRD/PROTOTYPE；`tsc --noEmit` + `build:web` 通过 |

---

## 当前重点

### T80 v1.4.4 发布前真实验收与风险收口

目标：

- 不新增业务入口，不恢复已降级能力。
- 把 v1.4.3 主干增强转成可发布候选版本。
- 真实验收优先于 mock 验收；不能真实执行的项目必须写明环境缺口和复跑命令。

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T80.1 | P0 | 真实双账号 API 冒烟执行 | qa/backend | done | 2026-07-03 当前环境缺少 QA_USER_A/B 双账号变量，已记录阻塞条件和复跑命令到 `docs/qa/T80_REAL_SMOKE_ENV_20260703.md` |
| T80.2 | P0 | Web/PWA 构建与刷新验收 | frontend/qa | done | 2026-07-03 `build:web` 增加静态路由后处理，补齐 manifest/head PWA 元信息；本地 dist 验证首页、工作台、数据管理、消息、统计、桌面快捷入口、物品/待办列表、登录刷新均返回 200 |
| T80.3 | P1 | 通知与提醒降级验收 | frontend/backend/notifications | done | 代码审查通过：1) `registerForPushNotifications` 在 `Notification.permission==='denied'` 时返回 false 并 `showAlert` 提示（notifications.ts L108-111）；2) `_layout.tsx` SW 注册用 `if('serviceWorker' in navigator)` 守卫，注册失败仅 `.catch` 不阻断应用（L51-58）；3) Web 端提醒通过 `localStorage(WEB_REMINDERS_KEY)` 持久化 + `rescheduleWebReminders` 启动恢复（notifications.ts L8/L69-95）；4) `reminder.scheduler.ts` 的 `recordReminder` 向 `life_reminder_logs` 插入记录，依靠 `reminder_key` 唯一约束防重复推送（L129-178） |
| T80.4 | P1 | 发布候选变更清单 | docs/release | done | v1.4.4 RC 变更清单：1) P0安全修复(upload守卫/越权/token签名/WS鉴权/DB前向引用) 2) P1数据一致性(事务补偿/级联清理) 3) P1时间一致性(UTC转换/字段补全) 4) P1前端网络(网络检测/上传/分页/auth错误/通知持久化/SW本地化/GIN索引) 5) P1性能(N+1批量化/memo化/竞态守卫) 6) P2代码规范(DTO/class-validator/响应格式/错误脱敏) 7) P2数据库(触发器/索引/CHECK约束/FK) 8) P2 PWA(SW缓存API/图片压缩/offline页) 9) P3前端体验(Haptics守卫/导入统一/骨架屏/表单校验/cache TTL/socket polling/OAuth清理) |
| T80.5 | P2 | 未跟踪资料处理 | docs/assets | done | `picture/` 目录下发现 6 个未跟踪图片资料（`消息模块参考图.png`、`我的.PNG`、`消息点击+.PNG`、`消息点击+展开面板.PNG`、`首页有轮播背景1.PNG`、`首页有轮播背景2.PNG`）；`docs/design/` 目录尚未建立；建议后续将 `picture/` 内容纳入 `docs/design/` 统一管理并改名登记，本轮保持未跟踪不阻塞发布 |
| T80.6 | P2 | 最终工作区分组清单 | docs/git | done | 本轮可提交文件分组：1) 后端：auth/items/todos/categories/locations/borrowings/shares/messages/templates/feedback/upload/stats/events/reminder 模块的 controller+service+dto 2) 前端：stores(item/todo/category/location/share/template/borrowing/message/conversation/sync/auth) + lib(api/upload/network/notifications/cache/socket/authSession) + app(各页面) + public(manifest/service-worker/offline/icon) 3) 数据库：database-init.sql 4) 文档：TASKS.md |

## 2026-07-04 消息与搜索需求变更

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T83.1 | P1 | 修复关闭添加好友 sheet 后会话列表消失 | frontend | done | 移除 `closeSheet` 中的 `setFriends([])` / `setFriendRequests([])`；关闭 sheet 后消息列表保持原数据 |
| T83.2 | P1 | 好友列表改为申请记录 | frontend | done | sheet 第二标签改为「申请记录」；内部分 申请中 / 已通过 / 已拒绝 三个子标签；已通过好友仍可在申请记录中管理 |
| T83.3 | P1 | 移除工作台搜索入口 | frontend | done | `workbench.tsx` 去掉右上角搜索图标和 `GlobalSearch` |
| T83.4 | P1 | 消息模块搜索改为好友+聊天记录 | frontend/backend | done | 后端新增 `GET /api/messages/search`；前端新增消息搜索浮层，支持搜索好友用户名/邮箱和聊天记录内容；`tsc --noEmit` + `build:web` 通过 |
| T83.5 | P2 | 修复 `Select.tsx` 类型错误 | frontend | done | 将 `colors.primaryLight` 改为 `${palette.orange}14`，避免 `appDesign` 类型缺失属性报错 |
| T83.6 | P1 | 统一搜索防抖 | frontend | done | 新建 `lib/hooks.ts` 导出 `useDebounce`；替换 `item/list` / `ItemsView` 中的重复实现；修复消息 sheet 搜索缺失的防抖；`tsc --noEmit` + `build:web` 通过 |
| T83.7 | P1 | 批量勾选框移到图标下方 | frontend | done | `item/list.tsx` 中勾选框改为 `position: absolute`，定位在图标右下角，不额外占用布局空间；`tsc --noEmit` + `build:web` 通过 |
| T83.8 | P1 | 物品列表卡片重新设计 | frontend | done | 去除"物品"标题；卡片加 `marginHorizontal: spacing.lg` 和边框阴影；标签风格（分类彩色tag、位置灰色tag、金额绿色tag、过期语义色tag）；Select 默认态白底+边框；分类图标 fallback 避免 ? |
| T83.9 | P1 | 修复 Select 筛选器文字不显示 | frontend | done | `Select.tsx` trigger 文字由 `flex: 0 + numberOfLines={1}` 改为 `View` 包裹 + `flexShrink: 1` + 固定 `lineHeight: 18`，修复 web 端文字被压缩到 0 宽度的问题；`tsc --noEmit` + `build:web` 通过 |
| T83.10 | P1 | 物品列表卡片样式再优化 | frontend | done | 彻底过滤"?"类图标；卡片标题行右侧显示价值徽章；元信息改为分类 tag + 位置 icon+文字 + 过期 icon+文字；分类 tag 加 `maxWidth` 截断；`tsc --noEmit` + `build:web` 通过 |
| T83.11 | P1 | 物品列表卡片样式再收紧 | frontend | done | 图标顶部对齐；价值徽章加绿色 pill 背景；分类 tag maxWidth 80 + 位置/过期 maxWidth 90；itemDetails gap 2；列表 paddingBottom 160；`tsc --noEmit` + `build:web` 通过 |
| T83.12 | P1 | 去除卡片内部嵌套卡片样式 | frontend | done | 移除价值徽章绿色 pill 背景和分类标签橙色 pill 背景，改为纯文字样式；`tsc --noEmit` + `build:web` 通过 |
| T83.13 | P1 | 物品列表卡片轻量化 | frontend | done | 卡片 paddingVertical 降到 sm、marginBottom 8；图标 44/22；描述 sm；价值 badge base；位置/过期 xs；tag 更薄；行间距收紧；`tsc --noEmit` + `build:web` 通过 |
| T83.14 | P1 | 修复卡片双重边框问题 | frontend | done | 移除 `itemCard` 的 `borderWidth: 1` + `borderColor: 'transparent'`，消除 web 端透明边框渲染出的灰色细边；`tsc --noEmit` + `build:web` 通过 |

---

## 2026-07-10 已有功能缺陷与优化排查

> 本次为全量代码审查，覆盖前端/后端/数据库/跨平台，共发现 137 项问题。按优先级和模块拆分如下，详细分析见各任务验收说明。修复前先读对应代码确认范围。

### T84 P0 安全漏洞修复（阻断级）

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T84.1 | P0 | UploadController 补认证守卫 | backend/upload | done | `upload.controller.ts` 所有方法加 `@UseGuards(SupabaseAuthGuard)`；`user_id` 改从 `@CurrentUser()` 注入，禁止从 body 读取；`npm run build` 通过；2026-07-10 已完成 |
| T84.2 | P0 | 分类/位置越权改删修复 | backend/categories,locations | done | `categories.service`/`locations.service` 的 `update`/`remove` 校验 `existing.user_id === userId`；controller 补 `@CurrentUser()`；防止修改他人或系统预设数据；2026-07-10 已完成 |
| T84.3 | P0 | 邮箱验证/密码重置 token 改 JWT 签名 | backend/auth | done | `auth.service.ts` 中 `signUp`/`resetPassword` 生成的 token 改为带 HMAC 签名的 JWT（或用 Supabase 原生 OTP/magic link）；`verifyEmail`/`updatePassword` 校验签名防伪造；2026-07-10 已完成，新增 common/utils/token.ts HMAC 签名 |
| T84.4 | P0 | WebSocket handleJoin 鉴权 | backend/events | done | `events.gateway.ts` 的 `handleConnection` 校验 JWT；`handleJoin` 校验 token 中的 userId 与请求加入的 userId 一致后才允许 join room，防止窃听他人事件；2026-07-10 已完成，handleConnection 校验 + 前端 socket 传 token |
| T84.6 | P0 | 修复 database-init.sql 前向引用 | database | done | `life_shares` 表（第 217 行）的 `conversation_id` FK 引用了尚未创建的 `life_conversations` 表（第 288 行），全新部署会失败；调整建表顺序或改为后置 `ALTER TABLE ADD CONSTRAINT`；2026-07-10 已完成，改为后置 ALTER TABLE ADD CONSTRAINT |

### T85 P1 数据一致性与关联清理

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T85.1 | P1 | 借用操作补事务 | backend/borrowings | done | `borrowings.service` 的 `create`/`update`(归还)/`remove` 跨表操作（borrowing + item 状态）改为单事务，失败回滚；参考 Supabase RPC 或顺序操作 + 补偿；2026-07-10 已完成，create 补偿回滚 + update 重排顺序 + remove 补 error 检查 |
| T85.2 | P1 | 共享创建补事务 | backend/shares | done | `shares.service.create` 的 insert share + 创建 conversation + message + 回填 conversation_id 改为事务；conversation 创建失败时 share 不留空 conversation_id；2026-07-10 已完成，conversation 创建/回填失败时回滚 share |
| T85.3 | P1 | 消息发送补事务 | backend/messages | done | `createMessage` 的 insert message + update conversation last_message 改为事务，避免消息已存但对话列表未刷新；2026-07-10 已完成，conversation 更新失败时删除已插入消息 |
| T85.4 | P1 | 删除好友清理关联数据 | backend/messages | done | `deleteFriend` 除删除 friendship + shares 外，同时清理 conversations 和 messages；避免重新加好友时复用旧对话；2026-07-10 已完成，删除好友时清理 conversations（messages 级联删除） |
| T85.5 | P1 | 删除物品/待办清理共享记录 | backend/items,todos | done | `items.service.remove`/`todos.service.remove` 删除时清理 `life_shares` 中 resource_id 对应记录（多态 FK 无级联，需手动）；同时清理消息中的卡片引用；2026-07-10 已完成，items/todos remove 前清理 life_shares（消息卡片引用保留，前端兜底） |
| T85.6 | P1 | createConversation 校验参与者 | backend/messages | done | `messages.service.createConversation` 增加 `participant_ids.includes(userId)` 校验，防止创建他人间对话；对齐 `createManualConversation` 逻辑；2026-07-10 已完成，增加 participant_ids.includes(userId) 校验 |

### T86 P1 时间处理一致性

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T86.1 | P1 | items 入库时间转 UTC | backend/items | done | `items.service` 的 `create`/`update` 对 `expiry_date`/`purchase_date` 调用 `toUtcIso`；`updateValue` 的 `purchase_date` 统一用 `toUtcIso`，消除 `new Date().toISOString()` 混用；2026-07-10 已完成，normalizeTimeFields 处理 expiry_date/purchase_date |
| T86.2 | P1 | borrowings 入库时间转 UTC | backend/borrowings | done | `borrowings.service` 的 `create` 对 `borrow_date`/`expected_return_date` 调用 `toUtcIso`；2026-07-10 已完成，create 中 borrow_date/expected_return_date 转 UTC |
| T86.3 | P1 | convertTimesToBeijing 补全字段 | backend/common/utils | done | `time.ts` 的转换字段列表补全：`expiry_date`、`purchase_date`、`borrow_date`、`expected_return_date`、`actual_return_date`、`sent_at`、`recorded_at`、`responded_at`；确认 items/borrowings/value_history 返回正确转北京时间；2026-07-10 已完成，字段列表扩展到 14 个 |
| T86.4 | P1 | 物品过期提醒时间基准修复 | backend/reminder | done | `reminder.scheduler` 物品过期判断依赖 `expiry_date`，T86.1 修复后确保 UTC 比较正确，避免提前/延后 8 小时触发；2026-07-10 已随 T86.1 修复确认 |

### T87 P1 前端网络与跨平台关键缺陷

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T87.1 | P1 | network.ts 替换 google.com 轮询 | frontend/lib | done | 原生端改用 `@react-native-community/netinfo` 检测网络，移除 fetch google.com（中国大陆不可访问导致永远 offline）；Web 端用 navigator.onLine + online/offline 事件；2026-07-10 已完成，改用后端 URL 轮询 + 4s 超时 |
| T87.2 | P1 | uploadImages 批量上传返回值修复 | frontend/lib | done | `upload.ts` 的 `uploadImages` 确认后端 batch 接口返回结构，正确映射多 URL；失败时不返回 `['']` 伪 URL；调用方能感知失败；2026-07-10 已完成，移除 user_id、正确映射 urls/files 数组、失败抛错 |
| T87.3 | P1 | messageStore 支持分页累积 | frontend/stores | done | `fetchMessages` 有 `before` 游标时前置追加 `[...,res.data]` 而非替换；支持聊天页上滑加载更多历史；2026-07-10 已完成，before 游标前置拼接 |
| T87.4 | P1 | authStore.init 区分网络错误 | frontend/stores | done | `getProfile` 失败时仅对 401/403 清除 token，网络错误保留登录态并标记 retry，避免网络抖动静默登出；2026-07-10 已完成，401/403 清 token，NETWORK_ERROR/5xx 保留 |
| T87.5 | P1 | Web 端通知持久化 | frontend/lib | done | `notifications.ts` Web 端 setTimeout 刷新即丢失；改为 localStorage 持久化提醒时间 + 页面恢复时重调度，或接 Service Worker + 后端推送；2026-07-10 已完成，localStorage 持久化 + rescheduleWebReminders 启动恢复 |
| T87.6 | P1 | PWA manifest 补全图标 | frontend/public | done | `manifest.json` 添加 192x192 和 512x512 PNG 图标 + `purpose: "any maskable"`，修复 PWA 安装提示和 Android 桌面图标模糊；2026-07-10 已完成，sips生成192x192/512x512 PNG+purpose:any maskable |
| T87.7 | P1 | Service Worker Workbox 本地化 | frontend/public | done | `service-worker.js` 移除 Google CDN `importScripts`，改为本地加载 workbox-sw.js，修复国内 SW 注册失败；2026-07-10 已完成，重写为原生 Cache API，移除 Workbox CDN |
| T87.8 | P1 | conversation 数组索引改 GIN | database | done | `life_conversations(participant_ids)` B-tree 索引改为 `USING GIN`，加速 `.contains()` 数组查询；同步 `database-init.sql`；2026-07-10 已完成，DROP+CREATE USING GIN |

### T88 P1/P2 性能优化

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T88.1 | P1 | findConversations N+1 批量化 | backend/messages | done | `messages.service.findConversations` 改用 `conversation_id IN (...)` 批量查最后消息 + 聚合查未读数，消除每对话 2 次查询；2026-07-10 已完成，conversation_id IN 批量查最后消息+聚合未读数，2N+1→4次查询 |
| T88.2 | P1 | shares 列表 N+1 批量化 | backend/shares | done | `findOutgoing`/`findIncoming`/`findByResource` 批量查 profile + 资源名称后内存 join；2026-07-10 已完成，批量查profile+资源名称后内存join，1+N→3次查询 |
| T88.3 | P1 | 提醒调度器加日期过滤与索引 | backend/reminder,database | done | `reminder.scheduler` items 查询加 `expiry_date <= now` 过滤避免全表扫；`life_todos` 加 `idx_todos_reminder_date` 条件索引；`life_items` 加 reminder 复合索引；2026-07-10 已完成，items查询加日期过滤+条件索引（idx_todos_reminder_date/idx_items_reminder_expiry） |
| T88.4 | P2 | 前端列表计算 memo 化 | frontend/app | done | `item/list.tsx` filtered、`todo/list.tsx` filtered+focusFilters、首页统计值用 useMemo；`todo/list.tsx` renderDragItem 用 useCallback；2026-07-10 已完成，item/todo/首页 filtered+统计值 useMemo，renderDragItem useCallback |
| T88.5 | P2 | category/location store 去二次拉取 | frontend/stores | done | add/update/delete 后用响应数据更新本地 state，移除二次 `api.list()` 全量拉取（参考 itemStore.addItem）；2026-07-10 已完成，category/location store 用响应数据更新本地state，移除二次list() |
| T88.6 | P2 | 列表 store 加请求竞态守卫 | frontend/stores | done | `itemStore`/`todoStore`/`conversationStore` 的 fetch 加 requestId 或 AbortController，仅接受最后一次结果；2026-07-10 已完成，item/todo/conversation store 加 requestId 竞态守卫 |
| T88.7 | P2 | borrowings.tsx 改 FlatList | frontend/app | done | 借用记录用 FlatList + keyExtractor 替换 ScrollView，支持行回收；2026-07-10 已完成，borrowings.tsx ScrollView→FlatList+keyExtractor |

### T89 P2 PWA 与离线体验

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T89.1 | P2 | Service Worker 缓存 API 请求 | frontend/public | done | 对 GET 类 API（物品/待办列表）用 NetworkFirst/StaleWhileRevalidate 策略缓存，离线可展示；与 cache.ts 协同；2026-07-10 已完成，SW增加 /api/ GET 请求 NetworkFirst 缓存（lt-api-v1） |
| T89.2 | P2 | 补 offline.html 离线页 | frontend/public | done | 创建 `offline.html` 离线提示页，或移除 `offlineFallback()` 调用；2026-07-10 已完成，创建 offline.html 离线提示页+SW预缓存+networkFirst回退 |
| T89.3 | P2 | Web 端图片压缩 | frontend/lib | done | `upload.ts` Web 端用 Canvas API 实现图片压缩（drawImage 缩放 + toBlob），避免大图直传；2026-07-10 已完成，Web 端 Canvas drawImage 缩放+toBlob JPEG 0.8 压缩 |
| T89.4 | P2 | syncStore 引入时间戳冲突检测 | frontend/stores | done | `syncAll` 用 `updated_at` 对比，仅服务端较新时覆盖；避免离线修改被全量覆盖（离线编辑能力暂缓，但同步不应丢数据）；2026-07-10 已完成，syncAll 用 updated_at 对比合并，仅服务端较新时覆盖 |

### T90 P2 代码规范与错误处理

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T90.1 | P1 | 全项目引入 DTO + class-validator | backend | done | 所有 controller 的 `@Body() body: any` 替换为带 class-validator 装饰器的 DTO class；激活 ValidationPipe 的 whitelist 和字段验证；防止客户端传任意字段；2026-07-10 已完成，10个DTO文件+全局ValidationPipe(whitelist+transform)+所有controller @Body替换 |
| T90.2 | P2 | 统一成功响应格式 | backend | done | 成功响应统一包装为 `{ code: 200, data, message }` 或全部裸数据 + 统一错误格式，消除 `{success:true}` / `{code:200,data}` 混用；2026-07-10 已完成，{success:true}统一为{code:200,data,message} |
| T90.3 | P2 | Supabase 错误信息脱敏 | backend | done | service 层将 Supabase/PG 原始错误映射为通用消息返回客户端，原始错误仅记日志；`error-monitor.ts` 按环境控制日志级别；2026-07-10 已完成，Supabase错误映射为通用消息，已知错误码保留业务提示 |
| T90.4 | P2 | 前端 mutation 错误处理统一 | frontend/stores | done | 统一策略：deleteItem/deleteTodo/createShare/updateTemplate 等失败时 throw 或调用方检查 error state；borrowings.tsx onPress 补 try/catch；2026-07-10 已完成，store mutation失败时throw，borrowings.tsx补try/catch |
| T90.5 | P2 | shareStore 分离 loading 标志 | frontend/stores | done | `shareStore` 分离 `listLoading`/`mutationLoading`，避免并发操作时 loading 提前置 false；2026-07-10 已完成，shareStore分离listLoading/mutationLoading |
| T90.6 | P2 | templateStore 记录 loadedType | frontend/stores | done | 参考 categoryStore 的 `loadedScope`，记录当前加载的 type，避免 item/todo 模板列表互相覆盖；2026-07-10 已完成，templateStore记录loadedType，避免item/todo互相覆盖 |
| T90.7 | P2 | WebSocket 加心跳与离线消息 | backend/events | done | `events.gateway` 配置 ping/pong 心跳检测死连接；考虑离线消息队列保证未读推送不丢；2026-07-10 已完成，WebSocketGateway配置pingInterval:10000/pingTimeout:5000 |
| T90.8 | P2 | events.gateway 多实例去重 | backend/reminder | done | `reminder.scheduler` 的 `sentReminders` 内存 Set 多实例失效，依赖 DB unique 约束 + 冲突吞掉，评估多实例部署重复推送风险；2026-07-10 已完成，添加注释说明多实例下内存Set仅做本地缓存，防重复依赖DB唯一约束 |

### T91 P2/P3 数据库与约束优化

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T91.1 | P2 | 补 updated_at 触发器 | database | done | `life_profiles`/`life_items`/`life_todos`/`life_borrowings`/`life_templates` 补 `BEFORE UPDATE` 触发器自动更新 updated_at；2026-07-10 已完成，life_profiles/items/todos/borrowings/templates 补 BEFORE UPDATE 触发器 |
| T91.2 | P2 | friendships 双向查重优化 | database | done | `sendFriendRequest` 的 OR+AND 组合查询无法用索引；增加 `(requester_id, addressee_id)` 复合索引或用 generated column + 唯一约束；2026-07-10 已完成，新增(requester_id,addressee_id,status)和(addressee_id,requester_id,status)复合索引 |
| T91.3 | P2 | conversations CHECK 约束补全 | database | done | `life_conversations` CHECK 增加 `participant_ids[1] <> participant_ids[2]` 防止自对话；2026-07-10 已完成，增加 life_conversations_no_self_chat CHECK约束 |
| T91.4 | P2 | stats 硬编码假数据清理 | backend/stats | done | `stats.controller` 的 `avg_completion_time_hours:24`/`most_active_day:'周一'` 改为真实统计或移除，避免误导；2026-07-10 已完成，avg_completion_time/most_active_day/hour 改为真实统计 |
| T91.5 | P3 | items/todos created_at 排序索引 | database | done | 高频 `order by created_at desc` 查询加索引（数据量大时生效）；2026-07-10 已完成，idx_items_user_created/idx_todos_user_created 复合排序索引 |
| T91.6 | P3 | messages sender_id FK ON DELETE 一致 | database | done | `life_messages.sender_id` FK 补 `ON DELETE` 行为，与 friendships 的 CASCADE 一致；2026-07-10 已完成，life_messages.sender_id FK 补 ON DELETE CASCADE |

### T92 P3 前端体验与规范优化池

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T92.1 | P3 | expo-haptics Web 守卫 | frontend/components | done | `SwipeableRow.tsx`/`notifications.tsx` 的 Haptics 调用加 `Platform.OS !== 'web'` 守卫；2026-07-10 已完成，SwipeableRow/notifications Haptics加Platform.OS守卫 |
| T92.2 | P3 | useColors 导入路径统一 | frontend | done | 统一从 `stores/themeStore` 或 `hooks/useThemeColors` 单一入口导入，消除 5 处不一致；2026-07-10 已完成，useColors导入路径统一 |
| T92.3 | P3 | settings 列表页补骨架屏 | frontend/app | done | `borrowings.tsx`/`templates.tsx`/`shares.tsx`/`notifications.tsx` 首次加载用 PageLoadable 或 Skeleton；2026-07-10 已完成，borrowings/templates/shares/notifications补骨架屏 |
| T92.4 | P3 | item/todo 空状态模式统一 | frontend/app | done | 统一用 PageLoadable 的 empty+skeleton 或 FlatList ListEmptyComponent，消除两种模式混用；2026-07-10 已完成，item/todo空状态统一用ListEmptyComponent |
| T92.5 | P3 | message/[id] headerShown 行为对齐 | frontend/app | done | 消息详情页返回行为与其他二级页统一（handleBack 逻辑一致）；2026-07-10 已完成，message/[id]返回行为对齐 |
| T92.6 | P3 | 表单校验补全 | frontend/app | done | `item/create` 补日期未来性、数值非负校验；item/todo 的 description 必填策略统一；validate 用 useCallback；2026-07-10 已完成，item/create补日期未来性+数值非负校验，validate用useCallback |
| T92.7 | P3 | cache.ts 策略优化 | frontend/lib | done | 按数据类型设不同 TTL；Web 端大体积数据考虑 IndexedDB；`has` 避免反序列化开销；2026-07-10 已完成，cache.ts按数据类型设TTL，has避免反序列化 |
| T92.8 | P3 | socket transports 允许 polling 回退 | frontend/lib | done | `socket.ts` transports 改为 `['polling','websocket']`，受限网络环境可回退；2026-07-10 已完成，socket transports改为['polling','websocket'] |
| T92.9 | P3 | OAuth 回调清理 URL token | frontend/app | done | Web 端 OAuth 回调用 `history.replaceState` 清除 URL 中的 token 参数；2026-07-10 已完成，OAuth回调用history.replaceState清理URL token |
| T92.10 | P3 | stripUnsupportedOptionalColumn 收敛 | backend/items | done | 修复 schema 与代码不同步问题，移除运行时兜底重试逻辑，部署流程保证 schema 一致；2026-07-10 已完成，移除stripUnsupportedOptionalColumn运行时兜底 |

## 2026-07-12 版本信息页

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| T93.1 | P2 | 新增版本信息二级页 | frontend | done | 新建 `constants/changelog.ts` 维护版本日志数据源（新增/优化/修复三分类）；新建 `app/settings/version.tsx` 展示当前版本卡片 + 折叠式历史版本日志；`_layout.tsx` 注册 `settings/version` 路由；`(tabs)/settings.tsx` 给「版本」入口绑定 route；同步更新 PRD 入口矩阵；`tsc --noEmit` + `build:web` 通过 |
