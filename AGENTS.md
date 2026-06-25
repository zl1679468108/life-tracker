# LifeTracker Agent Guide

新对话开始时，先读取本文件。

## 1. 优先级

1. **产品方向**: 以 [docs/PRD.md](./docs/PRD.md) 为准。
2. **任务状态**: 以 [docs/TASKS.md](./docs/TASKS.md) 为准。
3. **数据库结构**: 以 [docs/database-init.sql](./docs/database-init.sql) 为准。
4. **实现细节**: 以当前代码为准，先读代码再改。

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
    (tabs)/            首页、物品、待办、设置
    auth/              登录、注册、重置密码、OAuth 回调
    item/              物品创建和详情
    todo/              待办创建和详情
    settings/          设置二级页
  components/          通用组件
  components/ui/       基础 UI 组件
  stores/              Zustand stores
  lib/                 API、上传、通知、缓存、分享等工具
  types/               类型定义
  constants/theme.ts   主题、颜色、间距、字体

backend/
  src/
    auth/
    items/
    todos/
    categories/
    locations/
    feedback/
    common/

docs/
  PRD.md               产品需求和路线
  TASKS.md             任务状态
  database-init.sql    Supabase 初始化脚本
```

## 5. 前端规则

- 路由使用 `expo-router` 文件系统路由；二级页必须在 `frontend/app/_layout.tsx` 注册 `Stack.Screen`，避免默认标题显示路径。
- Tab 页放在 `frontend/app/(tabs)/`；详情页使用 `[id].tsx`。
- 状态管理使用 Zustand，每个领域维护独立 store：`authStore`、`itemStore`、`todoStore`、`categoryStore`、`locationStore` 等。
- API 调用统一经过 `frontend/lib/api.ts`；不要在页面里散落 `fetch`。
- 主题统一使用 `useColors()` 和 `frontend/constants/theme.ts`。页面背景使用 `colors.gray[50]`，卡片/弹窗表面使用 `colors.white`。
- 图标使用 `@expo/vector-icons/MaterialCommunityIcons`。
- 基础组件放在 `frontend/components/ui/`，并在 `frontend/components/ui/index.ts` 导出。
- 图片选择、压缩、上传走 `frontend/lib/upload.ts` 和现有图片组件。

## 6. 跨平台规则

项目同时面向 Android 和 Web PWA：

- 使用 `Platform.OS`、`Platform.select` 或 `.web.ts` / `.native.ts` 处理平台差异。
- Web 端不要直接使用仅原生可用的 API；需要降级或封装。
- 存储、通知、分享、文件、相机、剪贴板等能力必须考虑 Web 兼容。
- 页面底色、SafeArea、ScrollView、KeyboardAvoidingView 需要在暗黑模式下保持一致，避免底部露白。
- Web 端需要支持浏览器 URL 和刷新后的状态恢复。

## 7. 后端规则

- REST API 基础路径为 `/api`。
- 资源模块遵循统一 CRUD：
  - `GET /api/{resource}`
  - `GET /api/{resource}/:id`
  - `POST /api/{resource}`
  - `PUT /api/{resource}/:id`
  - `DELETE /api/{resource}/:id`
- 每个模块保持三件套：`controller`、`service`、`module`。
- 数据验证使用 `class-validator` 和全局 `ValidationPipe`。
- Supabase 错误要转换为明确的 HTTP 异常。
- 数据库表统一使用 `life_` 前缀。

## 8. 时间规则

项目所有时间字段遵循同一规则：

- 前端发送北京时间字符串。
- 后端入库统一转 UTC ISO：`new Date(value).toISOString()`。
- 后端返回统一转北京时间字符串，例如 `2026-06-23T20:42:00+08:00`。
- 公共转换函数在 `backend/src/common/utils/time.ts`。
- 调度器比较时间时使用 UTC。

## 9. 数据库规则

- 开发和生产目前共用 Supabase 表，修改表结构必须谨慎。
- 初始化和迁移参考 [docs/database-init.sql](./docs/database-init.sql)。
- 系统预设分类/位置使用 `user_id IS NULL`。
- 用户自定义数据必须带 `user_id`。
- 修改表结构时，同步更新：
  - `docs/database-init.sql`
  - `frontend/types/`
  - 后端 service/controller
  - 前端 API 和 store

## 10. 常见开发流程

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

新增设置二级页：

1. 在 `frontend/app/settings/` 新增页面。
2. 在 `frontend/app/_layout.tsx` 注册 `Stack.Screen`。
3. 使用统一 `subPageOptions`。
4. 页面背景使用 `colors.gray[50]`。

## 11. 验证要求

改动完成后按风险选择验证：

- TypeScript：`cd frontend && npx tsc --noEmit`
- 前端构建：`cd frontend && npm run build:web`
- 后端构建：`cd backend && npm run build`
- 关键接口：用浏览器 Network 或 `curl` 验证请求次数和响应结构。

如果验证失败，说明是本次改动导致还是项目已有问题。

## 12. 注意事项

- 敏感信息只放环境变量，不要硬编码。
- 保持代码简洁，能用现有模式就不要造新抽象。
- 不要重构无关文件。
- 修改共享 store、API 响应结构、主题、路由布局时要检查影响面。
- 文档职责分明：产品写 PRD，任务写 TASKS，数据库写 SQL，本文件只写 agent 必读规则。
