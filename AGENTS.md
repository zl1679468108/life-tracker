# LifeTracker - 生活追踪应用

## 产品需求文档 (PRD)

**详细的产品需求、功能规划、迭代路线请查看**: [docs/PRD.md](./docs/PRD.md)

> 功能方向迭代以 PRD 为准，新增功能请先参考 PRD 中的产品路线规划章节。

## 项目概述

LifeTracker 是一个生活管理应用，帮助用户追踪物品、待办事项、分类和位置。采用前后端分离架构，前端使用 Expo React Native 开发小程序，后端使用 NestJS 提供 RESTful API，数据库使用 Supabase。

## 技术栈

### 前端
- **框架**: React Native + Expo SDK 54
- **路由**: expo-router v6 (文件系统路由)
- **状态管理**: Zustand v5
- **UI 组件**: react-native-paper v5
- **图标**: @expo/vector-icons (MaterialCommunityIcons)
- **动画**: react-native-reanimated v4 + react-native-gesture-handler v3
- **数据库客户端**: @supabase/supabase-js v2
- **样式**: React Native StyleSheet
- **类型**: TypeScript v6

### 后端
- **框架**: NestJS v11
- **数据库客户端**: @supabase/supabase-js v2
- **验证**: class-validator + class-transformer
- **配置**: @nestjs/config
- **类型**: TypeScript v5.7

### 数据库
- **服务**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage (图片上传)

## 项目结构

```
life-tracker/
├── frontend/                    # 小程序端
│   ├── app/                     # 页面路由 (文件系统路由)
│   │   ├── (tabs)/             # Tab 导航页面
│   │   │   ├── _layout.tsx     # Tab 布局配置
│   │   │   ├── index.tsx       # 首页
│   │   │   ├── items.tsx       # 物品列表
│   │   │   ├── todos.tsx       # 待办列表
│   │   │   └── settings.tsx    # 设置页
│   │   ├── auth/               # 认证相关页面
│   │   │   ├── login.tsx       # 登录
│   │   │   ├── register.tsx    # 注册
│   │   │   ├── reset-password.tsx
│   │   │   └── callback.tsx    # OAuth 回调
│   │   ├── item/               # 物品详情
│   │   │   ├── [id].tsx        # 物品详情页
│   │   │   └── create.tsx      # 创建物品
│   │   ├── todo/               # 待办详情
│   │   │   ├── [id].tsx        # 待办详情页
│   │   │   └── create.tsx      # 创建待办
│   │   ├── settings/           # 设置子页面
│   │   │   ├── account.tsx     # 账户设置
│   │   │   ├── category-manage.tsx  # 分类管理
│   │   │   ├── location-manage.tsx  # 位置管理
│   │   │   ├── feedback.tsx    # 反馈
│   │   │   ├── notifications.tsx    # 通知设置
│   │   │   └── stats.tsx       # 统计
│   │   ├── _layout.tsx         # 根布局
│   │   ├── +html.tsx           # HTML 模板
│   │   └── +not-found.tsx      # 404 页面
│   ├── components/             # 组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   │   ├── Avatar.tsx      # 头像
│   │   │   ├── Badge.tsx       # 徽章
│   │   │   ├── Button.tsx      # 按钮
│   │   │   ├── Card.tsx        # 卡片
│   │   │   ├── Checkbox.tsx    # 复选框
│   │   │   ├── Chip.tsx        # 标签
│   │   │   ├── EmptyState.tsx  # 空状态
│   │   │   ├── FAB.tsx         # 浮动按钮
│   │   │   ├── FormSection.tsx # 表单分区
│   │   │   ├── ImagePicker.tsx # 图片选择器
│   │   │   ├── ImagePreview.tsx # 图片预览
│   │   │   ├── Input.tsx       # 输入框
│   │   │   ├── Loading.tsx     # 加载状态
│   │   │   ├── Skeleton.tsx    # 骨架屏
│   │   │   ├── Toast.tsx       # 提示
│   │   │   └── index.ts        # 统一导出
│   │   ├── DeleteButton.tsx    # 删除按钮
│   │   ├── SafeScreen.tsx      # 安全区域屏幕
│   │   ├── SwipeableRow.tsx    # 可滑动行
│   │   ├── Themed.tsx          # 主题组件
│   │   ├── Toast.tsx           # Toast 组件
│   │   ├── useColorScheme.ts   # 颜色方案 Hook
│   │   └── useColorScheme.web.ts
│   ├── stores/                 # Zustand 状态管理
│   │   ├── authStore.ts        # 认证状态
│   │   ├── categoryStore.ts    # 分类状态
│   │   ├── itemStore.ts        # 物品状态
│   │   ├── locationStore.ts    # 位置状态
│   │   └── todoStore.ts        # 待办状态
│   ├── lib/                    # 工具库
│   │   ├── api.ts              # API 客户端
│   │   ├── supabase.ts         # Supabase 客户端
│   │   ├── notifications.ts    # 通知服务
│   │   └── upload.ts           # 文件上传
│   ├── types/                  # TypeScript 类型
│   │   └── index.ts            # 类型定义
│   ├── constants/              # 常量
│   │   ├── Colors.ts           # 颜色常量
│   │   └── theme.ts            # 主题配置
│   ├── assets/                 # 静态资源
│   │   ├── fonts/              # 字体
│   │   └── images/             # 图片
│   ├── .env.development        # 开发环境变量
│   ├── .env.production         # 生产环境变量
│   ├── app.json                # Expo 配置
│   └── package.json            # 前端依赖
│
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── items/              # 物品模块
│   │   │   ├── items.controller.ts
│   │   │   ├── items.service.ts
│   │   │   └── items.module.ts
│   │   ├── todos/              # 待办模块
│   │   │   ├── todos.controller.ts
│   │   │   ├── todos.service.ts
│   │   │   └── todos.module.ts
│   │   ├── categories/         # 分类模块
│   │   │   ├── categories.controller.ts
│   │   │   ├── categories.service.ts
│   │   │   └── categories.module.ts
│   │   ├── locations/          # 位置模块
│   │   │   ├── locations.controller.ts
│   │   │   ├── locations.service.ts
│   │   │   └── locations.module.ts
│   │   ├── feedback/           # 反馈模块
│   │   │   ├── feedback.controller.ts
│   │   │   ├── feedback.service.ts
│   │   │   └── feedback.module.ts
│   │   ├── auth/               # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.module.ts
│   │   ├── common/             # 公共模块
│   │   │   └── supabase/
│   │   │       └── supabase.module.ts
│   │   ├── app.module.ts       # 根模块
│   │   └── main.ts             # 入口文件
│   ├── .env.development        # 开发环境变量
│   ├── .env.production         # 生产环境变量
│   ├── nest-cli.json           # NestJS CLI 配置
│   └── package.json            # 后端依赖
│
├── docs/                       # 文档
│   └── TASKS.md                # 任务清单
├── AGENTS.md                   # 本文件
├── docker-compose.yml          # Docker Compose 编排
└── ecosystem.config.js         # PM2 配置
```

## 环境配置

### 开发环境
- **前端**: http://localhost:3021
- **后端**: http://localhost:3020
- **数据库**: Supabase 云 (开发和生产共用)

### 生产环境
- **前端**: 部署域名 (Expo 构建)
- **后端**: 部署域名 (NestJS 服务)
- **数据库**: Supabase 云 (同一张表)

### 环境变量

详见以下配置文件：
- 前端：`frontend/.env.development`、`frontend/.env.production`
- 后端：`backend/.env.development`、`backend/.env.production`

## 快速开始

### 开发模式 (EAS Development Build)

项目使用 EAS Development Build，**不使用 Expo Go**。需要先构建开发客户端，然后通过开发客户端连接开发服务器。

```bash
# 1. 首次构建开发客户端（iOS 真机）
cd frontend
eas build --platform ios --profile development

# 2. 首次构建开发客户端（Android）
cd frontend
eas build --platform android --profile development

# 3. 安装开发客户端到设备后，启动前端开发服务器
cd frontend
npm start

# 4. 在开发客户端中扫码或输入 URL 连接
```

### 启动后端

```bash
cd backend
npm run start:dev
```

### 原生依赖版本约束

以下库必须使用 EAS Development Build 兼容版本，升级时需确认兼容性：

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| react-native-gesture-handler | v3+ | 需要开发构建，Expo Go 不支持 |
| react-native-reanimated | v4+ | 依赖 gesture-handler v3 |
| react-native-draggable-flatlist | v4+ | 依赖 reanimated v4 |

### 本地构建（可选，更快）

如果不想等待 EAS 云端构建，可以在本地构建：

```bash
cd frontend

# iOS 本地构建（需要 Mac + Xcode）
npx expo run:ios --configuration Debug

# Android 本地构建
npx expo run:android --variant debug
```

### 依赖变更后的处理

当修改了 `package.json` 中的原生依赖时：

```bash
# 1. 重新安装依赖
cd frontend && npm install

# 2. 重新构建开发客户端
eas build --platform ios --profile development

# 3. 安装新的开发客户端到设备
```

**注意**: 纯 JS/TS 代码修改不需要重新构建，HMR 会自动生效。

## 数据库设计

共 6 张表（`life_profiles`、`life_categories`、`life_locations`、`life_items`、`life_todos`、`life_feedback`），所有表使用 `life_` 前缀，开发和生产连接同一张表。

详见 [docs/database-init.sql](./docs/database-init.sql)

## 类型定义

详见 [frontend/types/index.ts](./frontend/types/index.ts)

## API 规范

### 基础信息
- **基础路径**: `/api`
- **数据格式**: JSON
- **认证**: 通过 Supabase Auth Token

### 端点列表

每个资源模块遵循统一的 CRUD 路由模式：

- `GET /api/{resource}?user_id=xxx` - 获取列表
- `GET /api/{resource}/:id` - 获取单条
- `POST /api/{resource}` - 创建
- `PUT /api/{resource}/:id` - 更新
- `DELETE /api/{resource}/:id` - 删除

适用模块：items、todos、categories、locations

特殊端点：
- `POST /api/feedback` - 提交反馈
- `POST /api/auth/signin` - 登录
- `POST /api/auth/signup` - 注册
- `PUT /api/auth/profile/:userId` - 更新用户资料
- `POST /api/auth/oauth` - OAuth 登录
- `POST /api/upload/single` - 上传单个文件
- `POST /api/upload/batch` - 批量上传文件 (最多10个)

## 前端开发规范

### 路由规范
- 使用 expo-router 文件系统路由
- 动态路由使用 `[id].tsx` 格式
- Tab 页面放在 `(tabs)/` 目录下
- 布局文件使用 `_layout.tsx`

### 组件规范
- 基础 UI 组件放在 `components/ui/` 目录
- 使用 React Native StyleSheet 定义样式
- 组件使用函数式组件 + Hooks
- 导出组件时在 `components/ui/index.ts` 中统一导出

### 状态管理规范
- 使用 Zustand 进行状态管理
- 每个功能模块对应一个 store (authStore, itemStore, todoStore 等)
- Store 放在 `stores/` 目录

### 主题规范
- 颜色、间距、字体等主题常量定义在 `constants/theme.ts`
- 使用主题常量而非硬编码值
- 主要颜色: `#FF6B35` (橙色)

### API 调用规范
- 使用 `lib/api.ts` 中封装的 API 方法
- API 方法返回 Promise
- 错误处理在 store 或组件中进行

### 图片处理
- 使用 `lib/upload.ts` 上传图片到 Supabase Storage
- 使用 `expo-image-picker` 选择图片
- 使用 `expo-image-manipulator` 压缩图片

### 跨平台兼容性 (Android & Web PWA)

项目需同时部署到 Android 和 Web (PWA)，开发时必须注意以下兼容性问题：

#### 1. 平台检测与条件渲染
- 使用 `Platform.OS` 或 `Platform.select` 区分平台逻辑
- 使用 `.web.ts` 和 `.native.ts` 后缀文件实现平台特定代码（如 `useColorScheme.web.ts`）
- 避免在 Web 端使用仅原生平台支持的 API

#### 2. 样式兼容性
- **Flexbox**: Web 默认 `flexDirection: 'column'`，与 React Native 一致，但注意 `flex` 属性在 Web 上的差异
- **阴影**: Android 使用 `elevation`，Web 使用 `boxShadow`，iOS 使用 `shadow*` 属性
- **溢出**: Web 支持 `overflow` 所有值，Android 对 `overflow: 'visible'` 支持有限
- **单位**: React Native 使用无单位数字（逻辑像素），Web 端会自动转换为 px
- **安全区域**: 使用 `react-native-safe-area-context` 处理刘海屏，Web 端需适配视口高度

#### 3. API 兼容性检查
以下 API 在 Web 端需要特殊处理或 polyfill：
- **存储**: `AsyncStorage` 在 Web 端使用 `localStorage`，注意容量限制（5-10MB）
- **安全存储**: `expo-secure-store` 在 Web 端不可用，需降级为 `localStorage` 或使用 Web Crypto API
- **文件系统**: `expo-file-system` 在 Web 端受限，使用 `fetch` + Blob 处理
- **相机**: `expo-camera` 在 Web 端使用 `getUserMedia` API，需要 HTTPS 和用户权限
- **通知**: 
  - Android: 使用 `expo-notifications` (FCM)
  - Web PWA: 使用 Service Worker + `Notification API`，需要用户授权
- **剪贴板**: 使用 `@react-native-clipboard/clipboard`，Web 端需要 `navigator.clipboard` API
- **分享**: `expo-sharing` 在 Web 端使用 `Web Share API`，不支持时降级为复制链接

#### 4. 导航与路由
- **URL 支持**: Web 端必须支持浏览器 URL，使用 `expo-router` 的文件系统路由
- **深度链接**: Android App Links 和 Web URL 需统一处理
- **返回行为**: Android 物理返回键 vs 浏览器返回按钮，使用 `router.back()` 统一处理
- **状态保持**: Web 端刷新页面需保持状态，考虑使用 URL 参数或 `sessionStorage`

#### 5. 交互差异
- **悬停状态**: Web 支持 `:hover`，Android 不支持，避免依赖 hover 效果
- **右键菜单**: Web 端需禁用或自定义右键菜单
- **键盘事件**: Web 端支持键盘快捷键，Android 使用软键盘
- **手势**: 使用 `react-native-gesture-handler`，Web 端需要适配鼠标事件
- **滚动**: Web 端有滚动条，Android 使用触摸滚动，注意滚动容器的高度计算

#### 6. PWA 特性配置
- **Manifest**: 配置 `app.json` 中的 PWA manifest（名称、图标、主题色、启动画面）
- **Service Worker**: 使用 `expo-pwa` 或自定义 Service Worker 实现离线缓存
- **图标**: 提供多尺寸图标（192x192, 512x512）用于 PWA
- **主题色**: 设置 `themeColor` 和 `backgroundColor`
- **离线支持**: 关键页面和数据需要离线访问能力

#### 7. 媒体与文件
- **图片选择**: 
  - Android: 使用 `expo-image-picker` 调用系统相册
  - Web: 降级为 `<input type="file" accept="image/*">`
- **图片格式**: Web 端优先使用 WebP，Android 需兼容 JPEG/PNG
- **文件上传**: Web 端使用 `FormData`，注意大文件分片上传
- **图片预览**: 使用 `expo-image` 组件，Web 端自动降级为 `<img>`

#### 8. 性能优化
- **Bundle 大小**: Web 端使用代码分割（`React.lazy`），避免首屏加载过大
- **图片优化**: 使用 `expo-image` 的自动格式转换和懒加载
- **列表渲染**: 使用 `FlashList` 或 `FlatList`，Web 端启用虚拟滚动
- **内存管理**: Android 低端设备注意内存泄漏，及时清理定时器和订阅

#### 9. 浏览器兼容性
- **目标浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Polyfill**: 使用 `@babel/polyfill` 或 `core-js` 填补 ES6+ 特性
- **CSS 前缀**: 使用 `autoprefixer` 处理浏览器厂商前缀
- **Web API**: 检查 `caniuse.com` 确认 API 支持度

#### 10. 测试要求
- **Web 测试**: 在 Chrome、Firefox、Safari 中测试核心功能
- **响应式**: 测试不同屏幕尺寸（手机、平板、桌面）
- **PWA 测试**: 验证离线模式、安装提示、推送通知
- **Android 测试**: 测试不同 Android 版本（API 21+）和设备尺寸

#### 11. 常用工具库推荐
- **平台检测**: `Platform.OS === 'web'` 或 `Platform.select({ web: ..., default: ... })`
- **条件导入**: 使用 `.web.ts` / `.native.ts` 文件后缀
- **存储抽象**: 封装统一的 Storage API，内部根据平台选择实现
- **通知抽象**: 封装统一的通知 API，内部区分 FCM 和 Web Notification
- **分享抽象**: 封装统一的分享 API，Web 端使用 Web Share API 或降级方案

#### 12. 常见问题与解决方案
- **问题**: Web 端 `AsyncStorage` 容量限制  
  **解决**: 大数据使用 IndexedDB（`idb-keyval` 或 `localforage`）
  
- **问题**: Web 端不支持 `expo-secure-store`  
  **解决**: Token 使用 `localStorage` + HTTPS，或加密后存储
  
- **问题**: Web 端推送通知需要用户交互触发  
  **解决**: 在用户操作后（如点击按钮）请求通知权限
  
- **问题**: Android 和 Web 的键盘行为不同  
  **解决**: 使用 `KeyboardAvoidingView`，Web 端配置 `behavior="padding"`
  
- **问题**: Web 端图片跨域问题  
  **解决**: 配置 Supabase Storage 的 CORS，或使用代理

## 后端开发规范

### 时间处理规范
- **适用范围**: 项目中所有模块涉及时间字段均遵循此规范（todos、items、categories、locations、feedback、auth/profiles 等）
- **前端发送**: 前端所有时间字段（如 `due_date`、`reminder_date`）发送的是北京时间（UTC+8）字符串
- **接口返回**: 后端所有时间字段返回时必须转换为北京时间字符串，格式如 `"2026-06-23T20:42:00+08:00"`
- **数据库存储**: 后端存储到 Supabase 时统一使用 UTC（ISO 8601），即 `new Date(value).toISOString()`
- **公共工具**: 时间转换统一使用 `backend/src/common/utils/time.ts` 中的 `toUtcIso()`、`toBeijingTime()`、`convertTimesToBeijing()` 方法
- **调度器比较**: 后端调度器（如 ReminderScheduler）比较时间时使用 UTC，与数据库存储格式一致

### 模块结构
每个功能模块包含三个文件：
- `xxx.controller.ts` - 控制器 (路由定义)
- `xxx.service.ts` - 服务层 (业务逻辑)
- `xxx.module.ts` - 模块定义

### 控制器规范
```typescript
@Controller('api/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  findAll(@Query('user_id') userId: string) {
    return this.itemsService.findAll(userId);
  }

  @Post()
  create(@Body() createDto: CreateItemDto) {
    return this.itemsService.create(createDto);
  }
}
```

### 服务层规范
```typescript
@Injectable()
export class ItemsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .from('life_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}
```

### 数据验证
- 使用 class-validator 装饰器定义 DTO
- 启用全局 ValidationPipe (已在 main.ts 配置)
- whitelist: true (自动剥离未定义的属性)
- forbidNonWhitelisted: false (允许未定义属性)
- transform: true (自动转换类型)

### 错误处理
- 使用 NestJS 内置异常 (HttpException, NotFoundException 等)
- Supabase 错误需要捕获并转换为 HTTP 异常

## 开发总体规范
   - 代码能精简绝不复杂
   - 能提取公共代码且高效，或者拆分模块，模块与模块之间只关注自己领域的事情

## 常见开发场景

### 添加新功能模块

1. **数据库**: 在 Supabase 创建新表 (使用 `life_` 前缀)
2. **类型**: 在 `frontend/types/index.ts` 添加类型定义
3. **后端**:
   - 创建模块: `nest g resource xxx`
   - 实现 controller, service, module
   - 在 `app.module.ts` 中导入模块
4. **前端**:
   - 创建 store: `stores/xxxStore.ts`
   - 在 `lib/api.ts` 添加 API 方法
   - 创建页面和组件

### 添加新的 UI 组件

1. 在 `components/ui/` 创建组件文件
2. 使用 StyleSheet 定义样式
3. 在 `components/ui/index.ts` 导出组件
4. 使用主题常量保持一致性

### 添加新的 API 端点

1. 在对应的 controller 中添加路由方法
2. 在 service 中实现业务逻辑
3. 如需 DTO，创建验证类
4. 测试 API 响应

### 处理图片上传

1. 前端使用 `ImagePicker` 选择图片
2. 使用 `upload.ts` 上传到 Supabase Storage
3. 获取公开 URL 并保存到数据库
4. 显示时使用 `ImagePreview` 组件

## 注意事项

1. **数据库**: 开发和生产共用同一张表，修改表结构需谨慎
2. **环境变量**: 敏感信息不要硬编码，使用环境变量
3. **类型安全**: 充分利用 TypeScript 类型系统
4. **性能**: 列表数据考虑分页和缓存
5. **错误处理**: 前端和后端都需要完善的错误处理
6. **测试**: 重要功能需要编写测试

## 部署

### CloudBase 部署（推荐）

项目已部署到腾讯云 CloudBase，前端使用 CloudBase Apps (PWA)，后端使用 CloudRun (容器)。

#### 部署架构

- **前端 PWA**: CloudBase Apps → 独立子域名 `https://<serviceName>-<envId>.webapps.tcloudbase.com`
- **后端 API**: CloudRun → 容器服务 `https://<service>-<envId>.sh.run.tcloudbase.com`
- **数据库**: Supabase 云（开发生产共用）

#### 快速部署步骤

**1. 后端部署 (CloudRun)**

```bash
# 1.1 确保 Dockerfile 正确（多阶段构建，使用 ARG 构建参数）
# 参见 backend/Dockerfile

# 1.2 打包后端代码
cd backend
zip -r ../backend-deploy.zip . -x "node_modules/*" ".git/*" "dist/*"

# 1.3 部署到 CloudRun（使用 tcb CLI）
cd ..
yes | tcb cloudrun deploy \
  -e <envId> \
  -s lifetracker-api \
  --upload-type native \
  --path backend-deploy.zip \
  --container-port 80 \
  --cpu 1 \
  --mem 2 \
  --min-instance 0 \
  --max-instance 5

# 1.4 配置环境变量（部署后必须在控制台配置）
# 访问 CloudRun 服务详情 → 点击"修改" → 添加环境变量：
#   - SUPABASE_URL=https://xxx.supabase.co
#   - SUPABASE_ANON_KEY=xxx
#   - SUPABASE_SERVICE_ROLE_KEY=xxx
#   - CORS_ORIGIN=https://<frontend-domain>
```

**关键配置**:
- `container-port`: 必须设为 `80`（CloudRun 健康检查访问此端口）
- `main.ts`: 监听 `0.0.0.0:80`，读取 `process.env.NODE_ENV`
- `Dockerfile`: 使用 `ENV` 指令注入 Supabase 连接信息

**2. 前端部署 (CloudBase Apps)**

使用 CloudBase MCP 工具（推荐）或直接调用 `manageApps`:

```json
{
  "action": "deployApp",
  "serviceName": "lifetracker-web",
  "filePath": "/path/to/frontend",
  "framework": "static",
  "installCmd": "",
  "buildCmd": "",
  "buildPath": "dist"
}
```

**关键配置**:
- `framework`: 设为 `static`（已本地构建好）
- `installCmd`: 设为 `""`（跳过 npm install）
- `buildCmd`: 设为 `""`（跳过 npm run build）
- `buildPath`: 设为 `dist`（构建产物目录）

**3. 环境变量配置**

**后端 Dockerfile** 使用构建参数（不在镜像中硬编码密钥）:

```dockerfile
# 构建参数（在 docker build 时传入）
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG CORS_ORIGIN

# 注入环境变量
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NODE_ENV=production
ENV CORS_ORIGIN=$CORS_ORIGIN
```

**传递构建参数**（使用 `tcb` CLI）:

```bash
# 方法一：在部署时通过 --build-arg 传递（推荐）
# 注意：tcb CLI 目前不支持 --build-arg，需在 CloudRun 控制台配置

# 方法二：在 CloudRun 控制台配置环境变量
# 1. 访问 CloudRun 服务详情
# 2. 点击"修改"
# 3. 添加环境变量（Key-Value）
#    - SUPABASE_URL
#    - SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - CORS_ORIGIN
```

**前端 `frontend/.env.production`**:
```env
EXPO_PUBLIC_API_BASE_URL=https://<backend-domain>
EXPO_PUBLIC_ENV=production
```

**注意**:
- `cloudbaserc.json` 已添加到 `.gitignore`，不会提交到 Git
- 使用 `cloudbaserc.json.example` 作为配置模板
- 部署前确保 `.env.production` 中的 URL 正确

#### 常见问题与解决

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| `supabaseUrl is required` | 环境变量未配置 | 在 CloudRun 控制台配置环境变量（参见步骤 1.4） |
| 健康探针失败 | 端口不匹配 | `main.ts` 监听 80 端口，CloudRun 访问 80 |
| `your-domain.com` 出现在 API 调用 | 构建缓存 | 清除 `dist/` 和 `node_modules/.cache` 后重新构建 |
| CORS 错误 | `CORS_ORIGIN` 配置错误 | 设为前端实际域名（不含路径） |
| Socket.io 连接失败 | `socket.ts` 未读取环境变量 | 使用 `process.env.EXPO_PUBLIC_API_BASE_URL` |
| 推送代码被 GitHub 阻止 | 代码中含有密钥 | 移除硬编码密钥，使用构建参数或控制台配置 |

#### 验证部署

```bash
# 后端健康检查
curl https://<backend-domain>/api/health
# 期望: {"status":"ok","timestamp":"..."}

# 前端 PWA 访问
curl -s -o /dev/null -w "%{http_code}" https://<frontend-domain>/
# 期望: 200

# 测试注册 API
curl -X POST https://<backend-domain>/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

#### 部署检查清单

- [ ] 后端 Dockerfile 正确（多阶段构建 + ARG 构建参数）
- [ ] 后端 `main.ts` 监听 `0.0.0.0:80`
- [ ] 前端 `.env.production` 配置正确
- [ ] 前端构建前清除缓存（`rm -rf dist node_modules/.cache`）
- [ ] 后端部署后状态为 `normal`
- [ ] 前端部署后状态为 `SUCCESS`
- [ ] **后端环境变量已配置**（CloudRun 控制台）
- [ ] 健康检查端点返回 `{"status":"ok"}`
- [ ] 代码不含硬编码密钥（检查 `git log` 和 GitHub Secret Scanning）
- [ ] 前端 API 调用地址正确（非 `your-domain.com`）

---

### 部署方式选择（传统方式）

项目还支持以下传统部署方式：

1. **Docker Compose 部署**：适用于 Web PWA + 后端一体化部署
2. **PM2 部署**：适用于传统服务器部署

### Docker Compose 部署（Web PWA + 后端）

#### 前置要求
- Docker 20.10+
- Docker Compose 2.0+
- 域名和 SSL 证书（可选，用于 HTTPS）

#### 部署步骤

```bash
# 1. 配置生产环境变量
# 编辑 backend/.env.production，设置：
# - CORS_ORIGIN=https://your-domain.com
# - 其他 Supabase 配置

# 编辑 frontend/.env.production，设置：
# - EXPO_PUBLIC_API_BASE_URL=https://your-domain.com

# 2. 构建并启动服务
docker-compose up -d --build

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f

# 5. 停止服务
docker-compose down
```

#### 服务说明
- **frontend**: Nginx 容器，提供 Web PWA 静态文件，监听 80 端口
- **backend**: Node.js 容器，提供 API 服务，监听 3020 端口
- Nginx 自动将 `/api/` 请求代理到后端容器

#### 自定义端口
```yaml
# docker-compose.yml
ports:
  - "8080:80"  # 修改为 8080:80
```

### PM2 部署（后端服务）

#### 前置要求
- Node.js 20+
- PM2 (`npm install -g pm2`)

#### 部署步骤

```bash
# 1. 安装后端依赖
cd backend
npm install

# 2. 构建后端
npm run build

# 3. 配置生产环境变量
# 编辑 backend/.env.production

# 4. 使用 PM2 启动后端
pm2 start ecosystem.config.js --env production

# 5. 保存 PM2 配置
pm2 save

# 6. 设置开机自启
pm2 startup
```

#### 常用 PM2 命令
```bash
pm2 list                    # 查看所有服务
pm2 logs                    # 查看日志
pm2 restart life-tracker-backend  # 重启服务
pm2 stop life-tracker-backend     # 停止服务
pm2 delete life-tracker-backend   # 删除服务
```

### Android APK 部署

#### 前置要求
- EAS CLI (`npm install -g eas-cli`)
- Expo 账号
- Google Play 开发者账号（可选，用于发布）

#### 构建 APK

```bash
# 1. 登录 Expo
eas login

# 2. 配置构建
cd frontend
eas build:configure

# 3. 构建生产版本（AAB 格式，用于 Google Play）
eas build --platform android --profile production

# 4. 构建 APK（用于直接安装）
eas build --platform android --profile preview

# 5. 提交到 Google Play
eas submit --platform android
```

#### 构建配置说明
- **development**: 开发版本，包含调试工具
- **preview**: 预览版本，APK 格式，用于内部测试
- **production**: 生产版本，AAB 格式，用于 Google Play 发布

### iOS 部署（无需开发者账号）

使用免费 Apple ID 通过 EAS Development Build 在 iOS 真机上安装，无需付费开发者账号，不上架 App Store。

#### 限制说明
- **证书有效期**: 7 天，过期后需要重新打包安装
- **设备数量**: 免费账号最多注册 100 台设备
- **签名要求**: 每台设备都需要在 Apple 注册（通过 Xcode 或首次安装时自动注册）
- **账号要求**: 免费 Apple ID 即可，不需要 Apple Developer Program（$99/年）

#### 前置要求
- EAS CLI (`npm install -g eas-cli`)
- Expo 账号（可用免费 Apple ID 登录）
- iOS 真机（iPhone/iPad）
- 设备已登录与打包相同的 Apple ID

#### 构建 iOS Development Build

```bash
# 1. 登录 Expo（使用免费 Apple ID）
eas login

# 2. 进入前端目录
cd frontend

# 3. 首次需要配置构建（已配置跳过）
eas build:configure

# 4. 构建 iOS development build
eas build --platform ios --profile development

# 5. 构建完成后下载 .ipa 文件
# EAS 会提供下载链接
```

#### 安装到 iOS 设备

**方法一：通过 AirDrop（推荐）**
1. 在 Mac 上下载 .ipa 文件
2. 使用 AirDrop 发送到 iPhone
3. iPhone 上点击安装

**方法二：通过 Xcode**
1. 打开 Xcode -> Window -> Devices and Simulators
2. 连接 iPhone
3. 将 .ipa 文件拖拽到设备列表

**方法三：通过 Diawi / 蒲公英**
1. 上传 .ipa 到 Diawi.com 或 pgyer.com
2. 手机扫码下载安装

#### 首次安装信任证书

iOS 13+ 需要手动信任开发者证书：

1. 安装后打开 **设置** -> **通用** -> **VPN与设备管理**
2. 找到对应的开发者证书（Apple Development: xxx）
3. 点击 **信任**

#### 证书续签（7天后）

免费账号签发的证书 7 天后过期，需要重新打包：

```bash
# 重新构建（EAS 会自动使用新证书）
cd frontend
eas build --platform ios --profile development

# 下载新的 .ipa 并重新安装
```

**注意**: 重新安装不会丢失应用数据，但需要重新信任证书。

#### 多设备支持

每台新设备首次安装时会自动注册到 Apple：

1. 在设备上安装 .ipa
2. 系统提示"不受信任的开发者"
3. 去 **设置** -> **通用** -> **VPN与设备管理** 信任证书
4. 设备自动注册到 Apple ID

**设备管理**:
- 登录 [Apple Developer](https://developer.apple.com/account)
- 进入 **Certificates, Identifiers & Profiles** -> **Devices**
- 查看已注册设备列表
- 最多 100 台设备/年

#### 构建配置说明

`eas.json` 中 iOS 相关配置：

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false  // false: 真机, true: 模拟器
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "autoIncrement": true
      }
    }
  }
}
```

#### 常见问题

**问题**: 安装提示"不受信任的开发者"  
**解决**: 去 **设置** -> **通用** -> **VPN与设备管理** 信任证书

**问题**: 证书过期后应用无法打开  
**解决**: 重新执行 `eas build --platform ios --profile development` 并重新安装

**问题**: 设备数量超过限制  
**解决**: 登录 Apple Developer 删除不用的设备，或等待一年后自动清理

**问题**: 想用 TestFlight 简化流程  
**解决**: 需要加入 Apple Developer Program（$99/年），然后使用 `eas build --platform ios --profile production` 并提交到 TestFlight

### Web PWA 手动部署

如果不使用 Docker，可以手动部署 Web 版本：

```bash
# 1. 构建 Web 版本
cd frontend
npm run build:web

# 2. 复制 dist 目录到 Web 服务器
# 例如：Nginx、Apache、Vercel、Netlify 等

# 3. 配置反向代理
# 将 /api/ 路径代理到后端服务
```

#### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend/dist;
    index index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://localhost:3020/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 环境变量配置清单

#### 后端 (backend/.env.production)
```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 服务配置
PORT=3020
CORS_ORIGIN=https://your-domain.com
ENV=production

# 邮件服务（可选）
MAIL_ENABLED=true
MAIL_HOST=smtp.qq.com
MAIL_PORT=587
MAIL_USER=your-email@qq.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@qq.com
```

#### 前端 (frontend/.env.production)
```env
# API 地址
EXPO_PUBLIC_API_BASE_URL=https://your-domain.com

# 环境标识
EXPO_PUBLIC_ENV=production
```

### 部署检查清单

- [ ] 更新 `backend/.env.production` 中的 `CORS_ORIGIN`
- [ ] 更新 `frontend/.env.production` 中的 `EXPO_PUBLIC_API_BASE_URL`
- [ ] 确认 Supabase 生产环境配置正确
- [ ] 测试 API 健康检查端点：`/api/health`
- [ ] 测试 Web PWA 离线功能
- [ ] 测试 Android APK 安装和运行
- [ ] 配置 HTTPS（生产环境必须）
- [ ] 配置日志收集和监控

## 相关文档

- [Expo 文档](https://docs.expo.dev/)
- [NestJS 文档](https://docs.nestjs.com/)
- [Supabase 文档](https://supabase.com/docs)
- [Zustand 文档](https://github.com/pmndrs/zustand)
- [React Native 文档](https://reactnative.dev/)
