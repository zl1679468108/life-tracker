# LifeTracker Agent Guide

新对话开始时，先读取本文件。

## 1. 文档优先级

所有 AI 开发决策按以下优先级裁决：

| 优先级 | 文档 | 用途 |
|---|---|---|
| 1 | [docs/PRD.md](./docs/PRD.md) | 产品需求规范：功能定义、模块边界、入口矩阵、交互/视觉规范 |
| 2 | [docs/PROTOTYPE.md](./docs/PROTOTYPE.md) | 原型方案：页面布局、路由映射、交互流、异常状态 |
| 3 | [docs/TASKS.md](./docs/TASKS.md) | 当前任务状态：仅包含未完成的待办任务 |
| 4 | [docs/database-init.sql](./docs/database-init.sql) | 数据库表结构：表名、字段、约束、索引 |
| — | [docs/QA_ACCOUNTS.md](./docs/QA_ACCOUNTS.md) | QA 测试账号（供 AI 记忆，新建对话时读取） |
| 5 | 当前代码 | 实现细节：以实际代码为准，先读代码再修改 |

不要把长篇部署步骤、产品说明或数据库 SQL 复制回 `AGENTS.md`。本文件只保留 agent 开发时必须遵守的规则和索引。

## 2. 项目概览

LifeTracker 是生活追踪应用，用于管理物品、待办、分类、位置、通知和账号资料。

| 层 | 技术 |
|---|---|
| 前端 | Expo React Native SDK 54, expo-router v6, Zustand v5, react-native-paper v5 |
| 后端 | NestJS v11, TypeScript, Supabase JS v2 |
| 数据库 | Supabase PostgreSQL, Supabase Auth, Supabase Storage |
| 目标平台 | Web PWA + Android，iOS development build 可用 |

开发环境端口：

| 服务 | 地址 |
|---|---|
| 前端 | `http://localhost:3021` |
| 后端 | `http://localhost:3020` |

## 3. 常用命令

前端：

```bash
cd frontend
npm start
npm run build:web
npx tsc --noEmit
```

后端：

```bash
cd backend
npm run start:dev
npm run build
```

开发客户端：

```bash
cd frontend
eas build --platform ios --profile development
eas build --platform android --profile development
```

项目使用 EAS Development Build，不使用 Expo Go。修改原生依赖后需要重新构建开发客户端；纯 JS/TS 修改不需要。

## 4. 目录索引

```text
frontend/
  app/                 expo-router 页面
    (tabs)/            首页、工作台、消息、我的
    auth/              登录、注册、重置/更新密码、邮箱验证、OAuth 回调
    item/              物品列表/创建/编辑
    todo/              待办列表/创建/编辑
    message/           聊天页 `[id]`
    settings/          二级页（分类/位置/模板/借用/日历/统计/通知/数据/资产/小组件/账号/改密/主题/语言/反馈/版本）
  components/          通用组件（SafeScreen、SwipeableRow、GlobalSearch 等）
  components/ui/       基础 UI（AppScreen/Toast/EmptyState…，在 index.ts 统一导出）
  components/message/  消息领域组件（ConversationRow、MessageBubble 等）
  stores/              Zustand（auth/item/todo/category/location/notification/message/conversation/share/template/borrowing/profile/theme/sync 等）
  lib/                 API、上传、通知、缓存、分享、format、hooks 等
  types/               类型定义（api.ts + index.ts）
  constants/           theme、icons、changelog、Colors

backend/
  src/
    auth/ items/ todos/ categories/ locations/
    borrowings/ templates/ messages/ shares/ feedback/
    calendar/ stats/ widgets/   # 无独立 service，逻辑在 controller
    upload/ ai/
    common/
      supabase/ auth/ events/ reminder/ mail/ monitoring/
      utils/           time、token、supabase-error、owned-resource

docs/
  README.md            文档索引与闭环状态（入口）
  PRD.md               产品需求和路线
  PROTOTYPE.md         原型方案（页面布局、路由、交互流）
  TASKS.md             当前任务看板（仅未完成）
  database-init.sql    数据库初始化脚本（权威建表基准）
  migrations/          幂等增量迁移（见 migrations/README.md）
  release/             发布说明归档
  QA_ACCOUNTS.md       测试账号清单

scripts/
  qa/                  QA 自动化脚本（冒烟测试、种子数据等）
```

## 5. AI 工作分工

### 5.1 跨文档协作规则

修改任何功能时，按以下顺序更新文档：

1. 先确认 `PRD.md` 中是否有该功能的定义
2. 查看 `PROTOTYPE.md` 了解页面结构和路由
3. 查看 `database-init.sql` 确认表结构
4. 查看 `TASKS.md` 确认任务状态
5. 读当前代码确认实现细节
6. 修改代码后同步更新受影响的文档

### 5.2 代码修改分工

| 改动范围 | 需要修改的文件 |
|---|---|
| 新增/修改后端 API | controller + service + module + 注册到 app.module.ts |
| 新增/修改数据库字段 | database-init.sql + frontend/types/ + 后端 service/controller + 前端 API/store |
| 新增/修改前端页面 | 页面文件 + app/_layout.tsx Stack.Screen + api.ts + store（可选） |
| 新增/修改 UI 组件 | components/ui/ + components/ui/index.ts |
| 新增/修改业务逻辑 | 对应 store + lib/api.ts 或后端 service/controller |
| 修改路由/导航 | 页面文件 + app/_layout.tsx Stack.Screen + (tabs)/_layout.tsx |

### 5.3 验证分工

| 角色 | 负责验证 |
|---|---|
| TypeScript | `cd frontend && npx tsc --noEmit`（所有前端改动） |
| Web 构建 | `cd frontend && npm run build:web`（涉及 Web 兼容性） |
| 后端构建 | `cd backend && npm run build`（所有后端改动） |
| 关键接口 | 浏览器 Network 或 `curl` 验证响应结构 |
| 数据库改动 | 先在 Supabase SQL Editor 验证 SQL 语法，再本地测试 |

### 5.4 文档维护分工

| 文档 | 维护时机 | 维护内容 |
|---|---|---|
| PRD.md | 新增/修改功能后 | 同步更新功能详述、入口矩阵、附录 |
| PROTOTYPE.md | 页面/路由/交互变化后 | 同步更新页面布局、路由映射、交互流 |
| TASKS.md | 任务开始/完成/阻塞时 | 更新任务状态和验收记录 |
| database-init.sql | 表结构变化后 | 同步增删改字段、索引 |
| AGENTS.md | 项目规则/结构变化后 | 同步更新目录索引、规范、流程 |

## 6. 前端规则

- 路由使用 `expo-router` 文件系统路由；二级页必须在 `frontend/app/_layout.tsx` 注册 `Stack.Screen`，避免默认标题显示路径。
- Tab 页放在 `frontend/app/(tabs)/`；详情页使用 `[id].tsx`。
- 状态管理使用 Zustand，每个领域维护独立 store：`authStore`、`itemStore`、`todoStore`、`categoryStore`、`locationStore` 等。
- API 调用统一经过 `frontend/lib/api.ts`；不要在页面里散落 `fetch`。
- 主题统一使用 `useColors()` 和 `frontend/constants/theme.ts`。页面背景使用 `colors.gray[50]`，卡片/弹窗表面使用 `colors.white`。
- 图标使用 `@expo/vector-icons/MaterialCommunityIcons`。
- 基础组件放在 `frontend/components/ui/`，并在 `frontend/components/ui/index.ts` 导出。
- 新增页面优先使用 `AppScreen`；`Toast` 统一从 `components/ui` 引入（`components/Toast` 为兼容 re-export）。
- 分类/位置图标选项使用 `frontend/constants/icons.ts`，不要在页面内复制数组。
- 图片选择、压缩、上传走 `frontend/lib/upload.ts` 和现有图片组件。

## 7. 跨平台规则

项目同时面向 Android 和 Web PWA：

- 使用 `Platform.OS`、`Platform.select` 或 `.web.ts` / `.native.ts` 处理平台差异。
- Web 端不要直接使用仅原生可用的 API；需要降级或封装。
- 存储、通知、分享、文件、相机、剪贴板等能力必须考虑 Web 兼容。
- 页面底色、SafeArea、ScrollView、KeyboardAvoidingView 需要在暗黑模式下保持一致，避免底部露白。
- Web 端需要支持浏览器 URL 和刷新后的状态恢复。

## 8. 后端规则

- REST API 基础路径为 `/api`。
- 资源模块遵循统一 CRUD：
  - `GET /api/{resource}`
  - `GET /api/{resource}/:id`
  - `POST /api/{resource}`
  - `PUT /api/{resource}/:id`
  - `DELETE /api/{resource}/:id`
- 每个模块保持三件套：`controller`、`service`、`module`。
- 数据验证使用 `class-validator` 和全局 `ValidationPipe`。
- Supabase 错误要转换为明确的 HTTP 异常；优先使用 `common/utils/supabase-error.ts` 的 `throwOnSupabaseError`。
- 系统预设资源（`user_id IS NULL`）鉴权优先使用 `common/utils/owned-resource.ts` 的 `assertUserOwnedResource`。
- 数据库表统一使用 `life_` 前缀。

## 9. 时间规则

项目所有时间字段遵循同一规则：

- 前端发送北京时间字符串。
- 后端入库统一转 UTC ISO：`new Date(value).toISOString()`。
- 后端返回统一转北京时间字符串，例如 `2026-06-23T20:42:00+08:00`。
- 公共转换函数在 `backend/src/common/utils/time.ts`。
- 调度器比较时间时使用 UTC。

## 10. 数据库规则

- 开发和生产目前共用 Supabase 表，修改表结构必须谨慎。
- 初始化和迁移参考 [docs/database-init.sql](./docs/database-init.sql)。
- 系统预设分类/位置使用 `user_id IS NULL`。
- 用户自定义数据必须带 `user_id`。
- 修改表结构时，同步更新：
  - `docs/database-init.sql`
  - `frontend/types/`
  - 后端 service/controller
  - 前端 API 和 store

## 11. 常见开发流程

新增业务模块：

1. 更新 PRD 或确认已有需求。
2. 设计/更新数据库表。
3. 更新前端类型。
4. 后端新增 module/controller/service。
5. `frontend/lib/api.ts` 增加 API。
6. 新增 Zustand store。
7. 新增页面和组件。
8. 更新 `docs/TASKS.md`。

新增 UI 组件：

1. 放到 `frontend/components/ui/`。
2. 使用 `StyleSheet` 和主题常量。
3. 在 `components/ui/index.ts` 导出。
4. 检查浅色、深色、Web、Android。

## 12. 验证要求

改动完成后按风险选择验证：

- TypeScript：`cd frontend && npx tsc --noEmit`
- 前端构建：`cd frontend && npm run build:web`
- 后端构建：`cd backend && npm run build`
- 关键接口：用浏览器 Network 或 `curl` 验证请求次数和响应结构。

如果验证失败，说明是本次改动导致还是项目已有问题。

## 13. 注意事项

- 敏感信息只放环境变量，不要硬编码。
- 保持代码简洁，能用现有模式就不要造新抽象。
- 不要重构无关文件。
- 修改共享 store、API 响应结构、主题、路由布局时要检查影响面。
- 文档职责分明：产品写 PRD，原型写 PROTOTYPE，任务写 TASKS，数据库写 SQL，本文件只写 agent 必读规则。
