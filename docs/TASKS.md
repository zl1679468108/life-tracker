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
| T80.3 | P1 | 通知与提醒降级验收 | frontend/backend/notifications | todo | 验证浏览器通知权限拒绝、Service Worker 不可用、提醒日志存在时前端通知中心仍可读 |
| T80.4 | P1 | 发布候选变更清单 | docs/release | todo | 新增 v1.4.4 RC 说明，列出主要改动、验证命令、已知风险和回滚提示 |
| T80.5 | P2 | 未跟踪资料处理 | docs/assets | todo | 处理 `消息模块参考图.png`：纳入资料目录、改名登记或明确保持未跟踪 |
| T80.6 | P2 | 最终工作区分组清单 | docs/git | todo | 输出本轮可提交文件分组：产品文档、QA 脚本、前端、后端、数据库、未纳入文件 |

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
