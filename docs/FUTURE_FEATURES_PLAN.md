# LifeTracker v2.x 未来功能详细执行计划

> **版本**: v2.0 规划  
> **更新日期**: 2026-06-26  
> **目标**: 将 10 个未来功能拆解为可执行的开发任务，确保开发阶段解决所有问题，避免后续返工

---

## 总体原则

### 开发流程（每个功能必须遵循）
1. **数据库设计** - 更新 `database-init.sql`，添加表和字段
2. **后端 API** - Controller + Service + Module，统一错误处理
3. **前端类型** - 更新 `types/index.ts` 和 `types/api.ts`
4. **Zustand Store** - 新增或扩展现有 store
5. **UI 组件** - 复用现有组件，新增专用组件到 `components/ui/`
6. **页面开发** - expo-router 文件系统路由
7. **测试验证** - TypeScript 编译 + 关键接口测试
8. **文档更新** - PRD.md + TASKS.md

### 质量保障
- ✅ 所有改动必须先通过 `tsc --noEmit`
- ✅ 后端 API 必须有明确的错误码和消息
- ✅ 前端必须有 loading、error、empty 状态处理
- ✅ 所有时间字段遵守 UTC/北京时间转换规范
- ✅ RLS 策略必须覆盖新表的所有操作

---

## T44: 协作共享 (P2)

### 功能描述
允许用户邀请其他用户共同管理物品和待办，实现家庭/团队场景下的数据共享。

### 数据库设计

#### 新增表：life_shares（共享关系表）
```sql
CREATE TABLE life_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- 所有者
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- 被共享者
  resource_type TEXT NOT NULL CHECK (resource_type IN ('item', 'todo')),  -- 资源类型
  resource_id UUID NOT NULL,  -- 资源 ID（物品或待办）
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')),  -- 权限级别
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, shared_with_id, resource_type, resource_id)
);

CREATE INDEX idx_shares_owner ON life_shares(owner_id);
CREATE INDEX idx_shares_shared_with ON life_shares(shared_with_id);
CREATE INDEX idx_shares_resource ON life_shares(resource_type, resource_id);
```

#### RLS 策略
```sql
-- 用户可以查看自己拥有的共享关系
CREATE POLICY "Users can view own shares" ON life_shares
  FOR SELECT USING (owner_id = auth.uid() OR shared_with_id = auth.uid());

-- 所有者可以创建共享关系
CREATE POLICY "Owners can create shares" ON life_shares
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- 所有者可以删除共享关系
CREATE POLICY "Owners can delete shares" ON life_shares
  FOR DELETE USING (owner_id = auth.uid());
```

### 后端 API

#### 新增模块：backend/src/shares/
- `shares.controller.ts` - REST API 端点
- `shares.service.ts` - 业务逻辑
- `shares.module.ts` - 模块定义

#### API 端点
```typescript
// 创建共享关系
POST /api/shares
Body: {
  shared_with_email: string;  // 通过邮箱查找用户
  resource_type: 'item' | 'todo';
  resource_id: string;
  permission: 'view' | 'edit';
}

// 查询我共享给他人的资源
GET /api/shares/outgoing?page=1&pageSize=20

// 查询他人共享给我的资源
GET /api/shares/incoming?page=1&pageSize=20

// 删除共享关系
DELETE /api/shares/:id

// 更新权限
PUT /api/shares/:id
Body: { permission: 'view' | 'edit' }
```

#### 关键逻辑
1. **权限检查中间件**：在 items/todos 的 GET/PUT/DELETE 时检查是否有访问权限
2. **邮箱查找用户**：通过 `life_profiles.email` 查找用户 ID
3. **级联删除**：删除物品/待办时自动删除相关共享关系

### 前端类型

#### types/index.ts 新增
```typescript
export interface LifeShare {
  id: string;
  owner_id: string;
  shared_with_id: string;
  resource_type: 'item' | 'todo';
  resource_id: string;
  permission: 'view' | 'edit';
  created_at: string;
  owner_name?: string;  // 所有者名称（从 profile 获取）
  resource_name?: string;  // 资源名称
}
```

#### types/api.ts 新增
```typescript
export interface CreateShareRequest {
  shared_with_email: string;
  resource_type: 'item' | 'todo';
  resource_id: string;
  permission: 'view' | 'edit';
}

export interface UpdateShareRequest {
  permission: 'view' | 'edit';
}
```

### Zustand Store

#### 新增：frontend/stores/shareStore.ts
```typescript
interface ShareState {
  outgoingShares: LifeShare[];  // 我共享出去的
  incomingShares: LifeShare[];  // 他人共享给我的
  loading: boolean;
  error: string | null;
  
  fetchOutgoingShares: () => Promise<void>;
  fetchIncomingShares: () => Promise<void>;
  createShare: (data: CreateShareRequest) => Promise<void>;
  updateShare: (id: string, data: UpdateShareRequest) => Promise<void>;
  deleteShare: (id: string) => Promise<void>;
  clearError: () => void;
}
```

### UI 组件

#### 新增组件
1. `components/ui/ShareDialog.tsx` - 共享对话框（选择用户、设置权限）
2. `components/ui/ShareList.tsx` - 共享列表（显示已共享的用户和权限）
3. `components/ui/PermissionBadge.tsx` - 权限标签（查看/编辑）

#### 复用组件
- `SwipeableRow` - 左滑删除共享关系
- `EmptyState` - 无共享数据时的引导

### 页面开发

#### 新增页面
1. `app/item/[id]/share.tsx` - 物品共享管理页
   - 显示当前共享列表
   - 添加新共享（输入邮箱、选择权限）
   - 删除/修改权限

2. `app/todo/[id]/share.tsx` - 待办共享管理页（同上）

3. `app/settings/shares.tsx` - 共享总览页
   - Tab 切换：我共享的 / 共享给我的
   - 列表显示所有共享关系

#### 路由注册
在 `app/_layout.tsx` 中注册：
```typescript
<Stack.Screen name="item/[id]/share" options={{ title: '共享管理' }} />
<Stack.Screen name="todo/[id]/share" options={{ title: '共享管理' }} />
<Stack.Screen name="settings/shares" options={{ title: '共享管理' }} />
```

### 物品/待办详情页改造

#### 添加共享入口
- 物品详情页右上角添加"共享"按钮
- 待办详情页右上角添加"共享"按钮
- 点击跳转到对应的 share 页面

#### 权限控制
- 如果是他人共享的资源且权限为 `view`，隐藏编辑/删除按钮
- 显示"只读模式"提示

### 测试要点
1. ✅ 创建共享关系后，被共享者能在列表中看到该资源
2. ✅ view 权限用户不能编辑/删除
3. ✅ edit 权限用户可以编辑但不能删除（除非是所有者）
4. ✅ 删除共享关系后，被共享者看不到该资源
5. ✅ 所有者删除资源后，共享关系自动清理

### 预计工作量
- 数据库 + RLS: 2h
- 后端 API: 4h
- 前端类型 + Store: 2h
- UI 组件: 3h
- 页面开发: 4h
- 测试调试: 3h
- **总计**: ~18h (2-3 天)

---

## T45: 物品借用追踪 (P2)

### 功能描述
记录物品的借出/归还情况，包括借给谁、借出时间、预计归还时间、实际归还时间等。

### 数据库设计

#### 新增表：life_borrowings（借用记录表）
```sql
CREATE TABLE life_borrowings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES life_items(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,  -- 借用人姓名
  borrower_contact TEXT,  -- 联系方式（手机/微信）
  borrow_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- 借出时间
  expected_return_date TIMESTAMPTZ,  -- 预计归还时间
  actual_return_date TIMESTAMPTZ,  -- 实际归还时间
  status TEXT NOT NULL CHECK (status IN ('borrowed', 'returned', 'overdue')) DEFAULT 'borrowed',
  notes TEXT,  -- 备注
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_borrowings_item ON life_borrowings(item_id);
CREATE INDEX idx_borrowings_user ON life_borrowings(user_id);
CREATE INDEX idx_borrowings_status ON life_borrowings(status);
CREATE INDEX idx_borrowings_expected_return ON life_borrowings(expected_return_date);
```

#### RLS 策略
```sql
CREATE POLICY "Users can manage own borrowings" ON life_borrowings
  FOR ALL USING (user_id = auth.uid());
```

### 后端 API

#### 新增模块：backend/src/borrowings/
- `borrowings.controller.ts`
- `borrowings.service.ts`
- `borrowings.module.ts`

#### API 端点
```typescript
// 创建借用记录
POST /api/borrowings
Body: {
  item_id: string;
  borrower_name: string;
  borrower_contact?: string;
  expected_return_date?: string;
  notes?: string;
}

// 查询物品的借用历史
GET /api/items/:id/borrowings

// 查询所有未归还的借用
GET /api/borrowings/active

// 更新借用记录（归还）
PUT /api/borrowings/:id
Body: {
  actual_return_date?: string;
  status?: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
}

// 删除借用记录
DELETE /api/borrowings/:id
```

#### 关键逻辑
1. **逾期检测**：定时任务每天检查 `expected_return_date < NOW()` 且 `status = 'borrowed'` 的记录，更新为 `overdue`
2. **物品状态联动**：借出时可选标记物品为"已借出"状态（需扩展 life_items 表）

### 前端类型

#### types/index.ts 新增
```typescript
export interface LifeBorrowing {
  id: string;
  item_id: string;
  borrower_name: string;
  borrower_contact?: string;
  borrow_date: string;
  expected_return_date?: string;
  actual_return_date?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  item_name?: string;  // 物品名称（关联查询）
}
```

#### types/api.ts 新增
```typescript
export interface CreateBorrowingRequest {
  item_id: string;
  borrower_name: string;
  borrower_contact?: string;
  expected_return_date?: string;
  notes?: string;
}

export interface UpdateBorrowingRequest {
  actual_return_date?: string;
  status?: 'borrowed' | 'returned' | 'overdue';
  notes?: string;
}
```

### 扩展 life_items 表（可选）
```sql
ALTER TABLE life_items ADD COLUMN is_borrowed BOOLEAN DEFAULT FALSE;
ALTER TABLE life_items ADD COLUMN borrowed_by TEXT;  -- 当前借用人
```

### Zustand Store

#### 新增：frontend/stores/borrowingStore.ts
```typescript
interface BorrowingState {
  borrowings: LifeBorrowing[];
  activeBorrowings: LifeBorrowing[];  // 未归还的
  loading: boolean;
  error: string | null;
  
  fetchBorrowings: (itemId?: string) => Promise<void>;
  fetchActiveBorrowings: () => Promise<void>;
  createBorrowing: (data: CreateBorrowingRequest) => Promise<void>;
  updateBorrowing: (id: string, data: UpdateBorrowingRequest) => Promise<void>;
  deleteBorrowing: (id: string) => Promise<void>;
  clearError: () => void;
}
```

### UI 组件

#### 新增组件
1. `components/ui/BorrowingCard.tsx` - 借用记录卡片
   - 显示借用人、借出时间、预计归还时间
   - 状态标签（借出中/已归还/逾期）
   - 快速归还按钮

2. `components/ui/BorrowingForm.tsx` - 借用表单
   - 借用人姓名（必填）
   - 联系方式（选填）
   - 预计归还时间（日期选择器）
   - 备注（多行文本）

3. `components/ui/StatusBadge.tsx` - 状态标签
   - borrowed: 橙色
   - returned: 绿色
   - overdue: 红色

### 页面开发

#### 新增页面
1. `app/item/[id]/borrowings.tsx` - 物品借用历史页
   - 显示该物品的所有借用记录
   - 顶部"新增借用"按钮
   - 列表按时间倒序

2. `app/settings/borrowings.tsx` - 借用总览页
   - Tab 切换：全部 / 借出中 / 已归还 / 逾期
   - 显示所有物品的借用情况
   - 点击进入详情

#### 物品详情页改造
- 如果物品正在借出，显示"已借给 XXX"提示
- 添加"查看借用历史"链接

### 测试要点
1. ✅ 创建借用记录后，物品详情页显示借出状态
2. ✅ 归还后，状态变为 returned，记录实际归还时间
3. ✅ 逾期未还的物品，状态自动变为 overdue
4. ✅ 删除借用记录不影响物品本身
5. ✅ 借用历史按时间正确排序

### 预计工作量
- 数据库 + RLS: 2h
- 后端 API: 4h
- 前端类型 + Store: 2h
- UI 组件: 3h
- 页面开发: 3h
- 测试调试: 2h
- **总计**: ~16h (2 天)

---

## T46: 智能提醒 (P2)

### 功能描述
基于物品保质期、待办截止日期等，自动生成智能提醒通知。

### 数据库设计

#### 扩展 life_items 表
```sql
ALTER TABLE life_items ADD COLUMN expiry_date TIMESTAMPTZ;  -- 保质期/过期时间
ALTER TABLE life_items ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE;  -- 是否启用提醒
ALTER TABLE life_items ADD COLUMN reminder_days_before INTEGER DEFAULT 7;  -- 提前几天提醒
```

#### 扩展 life_todos 表（已有 reminder_date，无需改动）

#### 新增表：life_reminder_logs（提醒日志表，用于追踪已发送的提醒）
```sql
CREATE TABLE life_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('item', 'todo')),
  resource_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('expiry', 'due_date', 'custom')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reminder_logs_resource ON life_reminder_logs(resource_type, resource_id);
CREATE INDEX idx_reminder_logs_user ON life_reminder_logs(user_id);
```

### 后端 API

#### 扩展现有模块
1. **items.service.ts** - 添加 expiry_date 字段支持
2. **ReminderScheduler** - 扩展现有的提醒调度器

#### 新增 API 端点
```typescript
// 启用/禁用物品提醒
PUT /api/items/:id/reminder
Body: {
  enabled: boolean;
  reminder_days_before?: number;
}

// 查询即将过期的物品
GET /api/items/expiring?days=7

// 手动触发提醒测试
POST /api/reminders/test
Body: {
  resource_type: 'item' | 'todo';
  resource_id: string;
}
```

#### 关键逻辑
1. **调度器扩展**：
   - 每分钟检查一次 `life_items` 中 `expiry_date` 即将到来且 `reminder_enabled = true` 的物品
   - 计算 `(expiry_date - NOW()) <= reminder_days_before`
   - 检查 `life_reminder_logs` 避免重复发送

2. **提醒内容生成**：
   - 物品过期："⚠️ [物品名] 将在 X 天后过期"
   - 待办到期：" [待办标题] 即将到期"

3. **Socket 推送**：复用现有的 `reminders:fired` 事件

### 前端类型

#### types/index.ts 扩展
```typescript
export interface LifeItem {
  // ... 现有字段
  expiry_date?: string;
  reminder_enabled?: boolean;
  reminder_days_before?: number;
}
```

#### types/api.ts 新增
```typescript
export interface UpdateItemReminderRequest {
  enabled: boolean;
  reminder_days_before?: number;
}
```

### Zustand Store

#### 扩展 itemStore.ts
```typescript
// 新增方法
updateItemReminder: (id: string, data: UpdateItemReminderRequest) => Promise<void>;
fetchExpiringItems: (days: number) => Promise<LifeItem[]>;
```

### UI 组件

#### 新增组件
1. `components/ui/ReminderToggle.tsx` - 提醒开关组件
   - Switch 开关
   - 提前天数选择器（1/3/7/14/30 天）

2. `components/ui/ExpiryWarning.tsx` - 过期警告卡片
   - 显示即将过期的物品列表
   - 按剩余天数排序
   - 红色高亮已过期物品

### 页面开发

#### 物品创建/编辑页改造
- 新增"保质期提醒"区域
  - 过期时间（日期选择器）
  - 启用提醒（Switch）
  - 提前天数（下拉选择）

#### 新增页面
1. `app/settings/reminders.tsx` - 提醒设置总览
   - Tab 切换：物品过期 / 待办到期
   - 显示所有启用了提醒的项目
   - 快速关闭/修改提醒

2. `app/home/expiring.tsx` - 即将过期物品页
   - 显示未来 7/14/30 天内过期的物品
   - 按剩余天数分组
   - 一键跳转到物品详情

### 测试要点
1. ✅ 设置物品过期时间和提醒后，到期前收到通知
2. ✅ 同一物品不会重复发送提醒
3. ✅ 禁用提醒后不再收到通知
4. ✅ 待办到期提醒正常工作（已有功能，需回归测试）
5. ✅ 提醒日志正确记录

### 预计工作量
- 数据库扩展: 1h
- 后端 API + 调度器: 4h
- 前端类型 + Store: 1h
- UI 组件: 2h
- 页面开发: 3h
- 测试调试: 2h
- **总计**: ~13h (1.5 天)

---

## T47: 物品价值追踪 (P3)

### 功能描述
记录物品的购买价格、当前估值、折旧信息，帮助用户了解资产总值。

### 数据库设计

#### 扩展 life_items 表
```sql
ALTER TABLE life_items ADD COLUMN purchase_price DECIMAL(10, 2);  -- 购买价格
ALTER TABLE life_items ADD COLUMN purchase_date TIMESTAMPTZ;  -- 购买日期
ALTER TABLE life_items ADD COLUMN current_value DECIMAL(10, 2);  -- 当前估值
ALTER TABLE life_items ADD COLUMN currency TEXT DEFAULT 'CNY';  -- 货币单位
ALTER TABLE life_items ADD COLUMN depreciation_rate DECIMAL(5, 2) DEFAULT 0;  -- 年折旧率（%）
```

#### 新增表：life_value_history（价值历史记录表）
```sql
CREATE TABLE life_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES life_items(id) ON DELETE CASCADE,
  value DECIMAL(10, 2) NOT NULL,
  reason TEXT,  -- 变更原因（手动调整/折旧计算/市场变化）
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_value_history_item ON life_value_history(item_id);
CREATE INDEX idx_value_history_recorded ON life_value_history(recorded_at);
```

### 后端 API

#### 扩展现有模块
1. **items.service.ts** - 添加价值相关字段
2. **新增服务**：ValueCalculationService - 自动计算折旧

#### 新增 API 端点
```typescript
// 更新物品价值
PUT /api/items/:id/value
Body: {
  current_value?: number;
  purchase_price?: number;
  purchase_date?: string;
  depreciation_rate?: number;
}

// 查询物品价值历史
GET /api/items/:id/value-history

// 手动记录价值变更
POST /api/items/:id/value-history
Body: {
  value: number;
  reason?: string;
}

// 查询用户资产总值
GET /api/items/total-value
Response: {
  total_purchase_price: number;
  total_current_value: number;
  total_depreciation: number;
  by_category: Array<{ category_id: string; category_name: string; total_value: number }>;
}
```

#### 关键逻辑
1. **折旧计算**：
   - 公式：`current_value = purchase_price * (1 - depreciation_rate)^years`
   - 定时任务每月重新计算一次
   - 记录到 `life_value_history`

2. **资产统计**：
   - 按分类汇总当前价值
   - 计算总折旧额

### 前端类型

#### types/index.ts 扩展
```typescript
export interface LifeItem {
  // ... 现有字段
  purchase_price?: number;
  purchase_date?: string;
  current_value?: number;
  currency?: string;
  depreciation_rate?: number;
}

export interface ValueHistory {
  id: string;
  item_id: string;
  value: number;
  reason?: string;
  recorded_at: string;
  user_id: string;
  item_name?: string;
}
```

#### types/api.ts 新增
```typescript
export interface UpdateItemValueRequest {
  current_value?: number;
  purchase_price?: number;
  purchase_date?: string;
  depreciation_rate?: number;
}

export interface RecordValueHistoryRequest {
  value: number;
  reason?: string;
}

export interface TotalValueResponse {
  total_purchase_price: number;
  total_current_value: number;
  total_depreciation: number;
  by_category: Array<{
    category_id: string;
    category_name: string;
    total_value: number;
  }>;
}
```

### Zustand Store

#### 扩展 itemStore.ts
```typescript
// 新增方法
updateItemValue: (id: string, data: UpdateItemValueRequest) => Promise<void>;
fetchValueHistory: (itemId: string) => Promise<ValueHistory[]>;
recordValueHistory: (itemId: string, data: RecordValueHistoryRequest) => Promise<void>;
fetchTotalValue: () => Promise<TotalValueResponse>;
```

### UI 组件

#### 新增组件
1. `components/ui/ValueInput.tsx` - 价值输入组件
   - 购买价格输入
   - 当前估值输入
   - 货币选择（默认 CNY）
   - 购买日期选择

2. `components/ui/DepreciationSlider.tsx` - 折旧率滑块
   - 0-100% 滑块
   - 预设档位（0%/5%/10%/20%/50%）

3. `components/ui/ValueChart.tsx` - 价值趋势图
   - 折线图显示价值变化
   - 标注每次变更原因

4. `components/ui/AssetSummary.tsx` - 资产总览卡片
   - 总资产价值
   - 总折旧额
   - 分类占比饼图

### 页面开发

#### 物品创建/编辑页改造
- 新增"价值信息"折叠区域
  - 购买价格 + 日期
  - 当前估值
  - 年折旧率

#### 新增页面
1. `app/item/[id]/value.tsx` - 物品价值详情页
   - 显示当前价值和购买信息
   - 价值历史列表
   - 价值趋势图
   - 手动调整价值按钮

2. `app/settings/assets.tsx` - 资产总览页
   - 总资产价值卡片
   - 按分类分布饼图
   - 折旧最多的物品 TOP 5
   - 最近价值变更记录

### 测试要点
1. ✅ 记录购买价格后，资产总值正确累加
2. ✅ 设置折旧率后，每月自动计算当前价值
3. ✅ 手动调整价值后，历史记录正确保存
4. ✅ 资产总览页数据准确
5. ✅ 删除物品后，价值历史和资产统计正确更新

### 预计工作量
- 数据库扩展: 1h
- 后端 API + 折旧计算: 5h
- 前端类型 + Store: 2h
- UI 组件: 4h
- 页面开发: 3h
- 测试调试: 2h
- **总计**: ~17h (2 天)

---

## T48: AI 物品识别 (P3)

### 功能描述
通过拍照或上传图片，使用 AI 自动识别物品类别、品牌、型号等信息，辅助用户快速录入。

### 技术方案选型

#### 方案 A：调用第三方 AI API（推荐）
- **服务商**：百度 AI / 阿里云视觉智能 / Google Cloud Vision
- **优点**：无需自建模型，识别准确率高
- **缺点**：按次收费，需要配置 API Key

#### 方案 B：本地部署开源模型
- **模型**：YOLOv8 / EfficientNet
- **优点**：无持续成本，数据隐私好
- **缺点**：需要 GPU 服务器，维护成本高

**本计划采用方案 A**，以百度 AI 为例（国内访问稳定）。

### 数据库设计

#### 扩展 life_items 表
```sql
ALTER TABLE life_items ADD COLUMN ai_suggestions JSONB;  -- AI 建议结果
ALTER TABLE life_items ADD COLUMN ai_confidence DECIMAL(5, 2);  -- 置信度
```

### 后端 API

#### 新增模块：backend/src/ai/
- `ai.controller.ts`
- `ai.service.ts`
- `ai.module.ts`

#### API 端点
```typescript
// AI 物品识别
POST /api/ai/recognize
Content-Type: multipart/form-data
Body: {
  image: File;  // 上传的图片
}
Response: {
  category: string;  // 建议的分类
  brand?: string;  // 识别的品牌
  model?: string;  // 识别的型号
  confidence: number;  // 置信度 0-1
  tags: string[];  // 相关标签
}

// 批量识别（最多 5 张）
POST /api/ai/recognize-batch
Body: {
  images: File[];
}
```

#### 关键逻辑
1. **图片预处理**：压缩至 1024px，转 base64
2. **调用百度 AI API**：
   ```typescript
   const result = await axios.post('https://aip.baidubce.com/rest/2.0/image-classify/v2/object_detect', {
     image: base64Image,
   }, {
     headers: {
       'Authorization': `Bearer ${BAIDU_AI_TOKEN}`,
     }
   });
   ```
3. **结果映射**：将 AI 返回的类别映射到系统的分类体系
4. **缓存优化**：相同图片不重复识别（MD5 哈希）

### 环境变量
```bash
# backend/.env.production
BAIDU_AI_API_KEY=your_api_key
BAIDU_AI_SECRET_KEY=your_secret_key
```

### 前端类型

#### types/api.ts 新增
```typescript
export interface AIRecognitionResult {
  category: string;
  brand?: string;
  model?: string;
  confidence: number;
  tags: string[];
}

export interface AIRecognitionResponse {
  code: number;
  data: AIRecognitionResult;
  message?: string;
}
```

### UI 组件

#### 新增组件
1. `components/ui/AICamera.tsx` - AI 相机组件
   - 拍照按钮
   - 实时预览
   - 识别中 loading
   - 识别结果展示

2. `components/ui/AIResultCard.tsx` - AI 识别结果卡片
   - 显示建议的分类、品牌、型号
   - 置信度进度条
   - "采纳建议"按钮
   - "忽略"按钮

3. `components/ui/ImageUploaderWithAI.tsx` - 带 AI 识别的图片上传器
   - 复用现有 ImageUploader
   - 上传后自动调用 AI 识别
   - 显示识别结果

### 页面开发

#### 物品创建页改造
- 新增"AI 识别"按钮
  - 点击打开相机或选择图片
  - 识别后自动填充分类、名称字段
  - 用户可修改确认

#### 物品列表页改造
- 批量导入模式支持 AI 识别
  - 选择多张图片
  - 批量识别后生成多个物品草稿
  - 用户逐一确认后批量创建

### 测试要点
1. ✅ 拍照后能正确识别常见物品（手机、书籍、衣服等）
2. ✅ 识别结果能正确映射到系统分类
3. ✅ 低置信度结果有明显提示
4. ✅ 网络异常时有降级方案（跳过 AI，手动填写）
5. ✅ 相同图片不重复调用 API（缓存生效）

### 成本控制
- 百度 AI 免费版：每月 500 次识别
- 超出后：~0.01 元/次
- 个人使用基本够用

### 预计工作量
- 后端 AI 集成: 4h
- 前端组件: 4h
- 页面改造: 2h
- 测试调试: 2h
- **总计**: ~12h (1.5 天)

---

## T49: 数据看板 (P3)

### 功能描述
提供更丰富的数据统计和可视化图表，帮助用户了解生活模式和趋势。

### 数据库设计

#### 新增视图（简化查询）
```sql
-- 月度统计视图
CREATE VIEW monthly_stats AS
SELECT 
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) FILTER (WHERE type = 'item') AS items_added,
  COUNT(*) FILTER (WHERE type = 'todo') AS todos_created,
  COUNT(*) FILTER (WHERE type = 'todo' AND completed = true) AS todos_completed
FROM (
  SELECT created_at, 'item' AS type, false AS completed FROM life_items
  UNION ALL
  SELECT created_at, 'todo' AS type, completed FROM life_todos
) combined
GROUP BY month
ORDER BY month DESC;
```

### 后端 API

#### 扩展现有模块
1. **stats.service.ts** - 扩展现有统计服务

#### 新增 API 端点
```typescript
// 高级统计数据
GET /api/stats/advanced?period=week|month|year
Response: {
  items: {
    added: number;
    by_category: Array<{ category_id: string; count: number }>;
    by_location: Array<{ location_id: string; count: number }>;
  };
  todos: {
    created: number;
    completed: number;
    completion_rate: number;
    by_priority: Array<{ priority: number; count: number }>;
    avg_completion_time_hours: number;
  };
  activity: {
    most_active_day: string;  // 星期几
    most_active_hour: number;  // 几点
  };
}

// 趋势数据（折线图）
GET /api/stats/trends?metric=items|todos&period=week|month|year
Response: {
  labels: string[];  // 时间标签
  data: number[];  // 数值
}

// 热力图数据（日历视图）
GET /api/stats/heatmap?year=2026
Response: {
  dates: Array<{ date: string; count: number }>;
}
```

### 前端类型

#### types/api.ts 新增
```typescript
export interface AdvancedStats {
  items: {
    added: number;
    by_category: Array<{ category_id: string; category_name: string; count: number }>;
    by_location: Array<{ location_id: string; location_name: string; count: number }>;
  };
  todos: {
    created: number;
    completed: number;
    completion_rate: number;
    by_priority: Array<{ priority: number; label: string; count: number }>;
    avg_completion_time_hours: number;
  };
  activity: {
    most_active_day: string;
    most_active_hour: number;
  };
}

export interface TrendData {
  labels: string[];
  data: number[];
}

export interface HeatmapData {
  dates: Array<{ date: string; count: number }>;
}
```

### UI 组件

#### 新增组件
1. `components/ui/StatsCard.tsx` - 统计卡片
   - 大数字 + 趋势箭头
   - 对比上期数据

2. `components/ui/TrendChart.tsx` - 趋势折线图
   - 复用现有 react-native-chart-kit
   - 支持缩放、切换周期

3. `components/ui/HeatmapCalendar.tsx` - 热力图日历
   - GitHub 风格的贡献图
   - 颜色深浅表示活跃度

4. `components/ui/RankingList.tsx` - 排行榜
   - TOP 5 分类/位置
   - 条形图展示

### 页面开发

#### 扩展现有 stats 页面
`app/settings/stats.tsx` - 数据看板主页
- Tab 切换：概览 / 物品 / 待办 / 活动
- **概览 Tab**：
  - 核心指标卡片（本月新增物品、待办完成率等）
  - 活动热力图
- **物品 Tab**：
  - 按分类分布饼图
  - 按位置分布柱状图
  - 新增趋势折线图
- **待办 Tab**：
  - 完成率趋势
  - 优先级分布
  - 平均完成时间
- **活动 Tab**：
  - 最活跃时间段
  - 每日操作次数热力图

### 测试要点
1. ✅ 统计数据准确（与数据库直接查询对比）
2. ✅ 图表渲染流畅，大数据量不卡顿
3. ✅ 切换周期（周/月/年）数据正确更新
4. ✅ 空数据时有友好提示
5. ✅ Web 和 Android 端图表显示一致

### 预计工作量
- 后端统计 API: 4h
- 前端类型: 1h
- UI 组件: 4h
- 页面开发: 3h
- 测试调试: 2h
- **总计**: ~14h (1.5-2 天)

---

## T50: 日历视图 (P3)

### 功能描述
以日历形式展示待办事项和物品相关事件（如借用归还、过期提醒等）。

### 数据库设计

无需新增表，复用现有 `life_todos.due_date` 和 `life_items.expiry_date`。

### 后端 API

#### 新增 API 端点
```typescript
// 查询某月的日历数据
GET /api/calendar?year=2026&month=6
Response: {
  days: Array<{
    date: string;  // YYYY-MM-DD
    todos: Array<{ id: string; title: string; priority: number; completed: boolean }>;
    events: Array<{
      type: 'expiry' | 'borrow_return' | 'custom';
      item_id?: string;
      item_name?: string;
      description: string;
    }>;
  }>;
}
```

### 前端类型

#### types/api.ts 新增
```typescript
export interface CalendarDay {
  date: string;
  todos: Array<{
    id: string;
    title: string;
    priority: number;
    completed: boolean;
  }>;
  events: Array<{
    type: 'expiry' | 'borrow_return' | 'custom';
    item_id?: string;
    item_name?: string;
    description: string;
  }>;
}

export interface CalendarMonthData {
  days: CalendarDay[];
}
```

### UI 组件

#### 新增组件
1. `components/ui/CalendarGrid.tsx` - 日历网格
   - 7x6 网格布局
   - 显示日期、待办数量、事件标记
   - 点击日期展开详情

2. `components/ui/CalendarDayCell.tsx` - 单日单元格
   - 日期数字
   - 待办圆点（按优先级颜色）
   - 事件图标

3. `components/ui/CalendarEventList.tsx` - 当日事件列表
   - 底部弹出面板
   - 显示该日所有待办和事件
   - 快速完成待办

### 页面开发

#### 新增页面
1. `app/(tabs)/calendar.tsx` - 日历主页
   - 顶部月份切换器
   - 日历网格
   - 底部今日待办快捷栏

2. 修改 Tab 布局
   - 在 `(tabs)/_layout.tsx` 中添加 calendar tab
   - 或作为首页的子 Tab

### 交互设计
- 点击日期 → 底部弹出当日详情
- 长按日期 → 快速添加待办
- 左右滑动 → 切换月份
- 今日高亮显示

### 测试要点
1. ✅ 待办正确显示在对应日期
2. ✅ 物品过期事件正确显示
3. ✅ 跨月待办显示正确
4. ✅ 时区处理正确（UTC vs 本地时间）
5. ✅ 大量待办时性能良好

### 预计工作量
- 后端 API: 2h
- 前端类型: 1h
- UI 组件: 4h
- 页面开发: 3h
- 测试调试: 2h
- **总计**: ~12h (1.5 天)

---

## T51: 模板功能 (P3)

### 功能描述
允许用户创建物品/待办模板，快速复用常用配置（如搬家清单、购物清单等）。

### 数据库设计

#### 新增表：life_templates（模板表）
```sql
CREATE TABLE life_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('item', 'todo')),
  data JSONB NOT NULL,  -- 模板数据（物品或待办的字段）
  icon TEXT,
  color TEXT,
  usage_count INTEGER DEFAULT 0,  -- 使用次数
  is_public BOOLEAN DEFAULT FALSE,  -- 是否公开（未来可分享）
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_templates_user ON life_templates(user_id);
CREATE INDEX idx_templates_type ON life_templates(template_type);
```

#### RLS 策略
```sql
CREATE POLICY "Users can manage own templates" ON life_templates
  FOR ALL USING (user_id = auth.uid());
```

### 后端 API

#### 新增模块：backend/src/templates/
- `templates.controller.ts`
- `templates.service.ts`
- `templates.module.ts`

#### API 端点
```typescript
// 创建模板
POST /api/templates
Body: {
  name: string;
  description?: string;
  template_type: 'item' | 'todo';
  data: object;  // 物品或待办的完整数据
  icon?: string;
  color?: string;
}

// 查询模板列表
GET /api/templates?type=item|todo&page=1&pageSize=20

// 使用模板创建物品/待办
POST /api/templates/:id/use
Body: {
  overrides?: object;  // 覆盖部分字段
}
Response: {
  item_id?: string;  // 如果是物品模板
  todo_id?: string;  // 如果是待办模板
}

// 更新模板
PUT /api/templates/:id
Body: {
  name?: string;
  description?: string;
  data?: object;
  icon?: string;
  color?: string;
}

// 删除模板
DELETE /api/templates/:id
```

### 前端类型

#### types/index.ts 新增
```typescript
export interface LifeTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: 'item' | 'todo';
  data: any;  // 物品或待办数据
  icon?: string;
  color?: string;
  usage_count: number;
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}
```

#### types/api.ts 新增
```typescript
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  template_type: 'item' | 'todo';
  data: any;
  icon?: string;
  color?: string;
}

export interface UseTemplateRequest {
  overrides?: any;
}
```

### Zustand Store

#### 新增：frontend/stores/templateStore.ts
```typescript
interface TemplateState {
  templates: LifeTemplate[];
  loading: boolean;
  error: string | null;
  
  fetchTemplates: (type?: 'item' | 'todo') => Promise<void>;
  createTemplate: (data: CreateTemplateRequest) => Promise<void>;
  useTemplate: (id: string, overrides?: any) => Promise<string>;  // 返回创建的物品/待办 ID
  updateTemplate: (id: string, data: Partial<LifeTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  clearError: () => void;
}
```

### UI 组件

#### 新增组件
1. `components/ui/TemplateCard.tsx` - 模板卡片
   - 模板名称、图标、颜色
   - 使用次数
   - "使用此模板"按钮

2. `components/ui/TemplateSelector.tsx` - 模板选择器
   - 底部弹出面板
   - 搜索/筛选模板
   - 点击使用

3. `components/ui/SaveAsTemplateButton.tsx` - 保存为模板按钮
   - 从现有物品/待办创建模板
   - 输入模板名称

### 页面开发

#### 新增页面
1. `app/settings/templates.tsx` - 模板管理页
   - Tab 切换：物品模板 / 待办模板
   - 模板列表
   - 创建新模板按钮

2. `app/templates/create.tsx` - 创建模板页
   - 选择模板类型
   - 填写模板数据（复用物品/待办表单）
   - 保存

#### 物品/待办创建页改造
- 顶部添加"从模板创建"按钮
- 点击弹出模板选择器
- 选择后自动填充表单

#### 物品/待办详情页改造
- 添加"保存为模板"按钮
- 点击后弹出命名对话框

### 预设模板（可选）
系统可提供一些常用模板：
- 📦 搬家清单（多个物品模板）
- 🛒 购物清单（多个物品模板）
- 📝 日常工作待办（多个待办模板）
- ️ 旅行准备清单

### 测试要点
1. ✅ 从模板创建物品/待办后，数据正确
2. ✅ 使用 overrides 覆盖部分字段正常工作
3. ✅ 模板列表按使用次数排序
4. ✅ 删除模板不影响已创建的物品/待办
5. ✅ 保存为模板时，敏感字段（如 ID）不保存

### 预计工作量
- 数据库 + RLS: 2h
- 后端 API: 4h
- 前端类型 + Store: 2h
- UI 组件: 3h
- 页面开发: 3h
- 测试调试: 2h
- **总计**: ~16h (2 天)

---

## T52: 备份恢复 (P3)

### 功能描述
允许用户导出所有数据为 JSON/CSV 文件，并支持从备份文件恢复数据。

### 数据库设计

无需新增表，使用现有数据结构。

### 后端 API

#### 新增模块：backend/src/backup/
- `backup.controller.ts`
- `backup.service.ts`
- `backup.module.ts`

#### API 端点
```typescript
// 导出所有数据
GET /api/backup/export?format=json|csv
Response: 
  - JSON: 完整的数据对象
  - CSV: 多个 CSV 文件打包为 ZIP

// 导入数据
POST /api/backup/import
Content-Type: multipart/form-data
Body: {
  file: File;  // JSON 或 ZIP 文件
}
Response: {
  imported_items: number;
  imported_todos: number;
  imported_categories: number;
  imported_locations: number;
  errors: Array<{ row: number; message: string }>;
}

// 预览导入数据（不实际导入）
POST /api/backup/preview
Body: {
  file: File;
}
Response: {
  items_count: number;
  todos_count: number;
  categories_count: number;
  locations_count: number;
}
```

#### 关键逻辑
1. **导出 JSON**：
   ```json
   {
     "version": "1.0",
     "exported_at": "2026-06-26T10:00:00+08:00",
     "categories": [...],
     "locations": [...],
     "items": [...],
     "todos": [...]
   }
   ```

2. **导出 CSV**：
   - `categories.csv`
   - `locations.csv`
   - `items.csv`
   - `todos.csv`
   - 打包为 `lifetracker_backup_20260626.zip`

3. **导入验证**：
   - 检查文件格式
   - 检查必填字段
   - 检查外键引用（分类、位置是否存在）
   - 冲突处理策略：跳过 / 覆盖 / 创建副本

4. **事务处理**：
   - 导入过程使用数据库事务
   - 失败时回滚

### 前端类型

#### types/api.ts 新增
```typescript
export interface ExportData {
  version: string;
  exported_at: string;
  categories: LifeCategory[];
  locations: LifeLocation[];
  items: LifeItem[];
  todos: LifeTodo[];
}

export interface ImportResult {
  imported_items: number;
  imported_todos: number;
  imported_categories: number;
  imported_locations: number;
  errors: Array<{ row: number; message: string }>;
}

export interface ImportPreview {
  items_count: number;
  todos_count: number;
  categories_count: number;
  locations_count: number;
}
```

### UI 组件

#### 新增组件
1. `components/ui/ExportDialog.tsx` - 导出对话框
   - 选择格式（JSON / CSV）
   - 选择数据类型（全选 / 自定义）
   - 导出按钮

2. `components/ui/ImportDialog.tsx` - 导入对话框
   - 文件选择
   - 预览数据量
   - 冲突处理策略选择
   - 导入按钮 + 进度条

3. `components/ui/BackupStatus.tsx` - 备份状态卡片
   - 最后备份时间
   - 数据量统计
   - 快速导出按钮

### 页面开发

#### 扩展现有设置页
`app/settings/data.tsx` - 数据管理页
- **导出区域**：
  - 导出为 JSON
  - 导出为 CSV
  - 自动备份开关（未来可实现定时备份）
  
- **导入区域**：
  - 从文件恢复
  - 支持 JSON 和 ZIP
  - 显示导入结果

### 前端导出实现（纯前端方案备选）

如果后端实现复杂，可以先用纯前端方案：

```typescript
// frontend/lib/export.ts
export async function exportToJSON(): Promise<void> {
  const data = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    categories: useCategoryStore.getState().categories,
    locations: useLocationStore.getState().locations,
    items: useItemStore.getState().items,
    todos: useTodoStore.getState().todos,
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lifetracker_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
```

### 测试要点
1. ✅ 导出的 JSON 包含所有数据
2. ✅ 导出的 CSV 可以用 Excel 打开
3. ✅ 导入后数据完整，无丢失
4. ✅ 导入冲突处理正确（跳过/覆盖/副本）
5. ✅ 导入失败时事务回滚，数据不一致

### 预计工作量
- 后端 API: 6h
- 前端类型: 1h
- UI 组件: 3h
- 页面开发: 2h
- 测试调试: 3h
- **总计**: ~15h (2 天)

---

## T53: 桌面小组件 (P3)

### 功能描述
在 Android/iOS 桌面添加小组件，快速查看待办、物品统计等信息。

### 技术限制

**重要说明**：
- Expo 默认不支持原生小组件（Widget）
- 需要使用 **expo-dev-client** + 原生模块
- 或使用第三方库：**react-native-widgets**（仅 iOS）/ **androidx.glance**（仅 Android）

### 技术方案

#### 方案 A：使用 expo-config-plugin（推荐）
- 通过 Config Plugin 注入原生代码
- 优点：与 Expo 生态兼容
- 缺点：需要编写 Kotlin/Swift 代码

#### 方案 B：等待 Expo 官方支持
- Expo SDK 55+ 可能支持 Widget
- 优点：无需原生代码
- 缺点：时间不确定

**本计划采用方案 A**，先实现 Android 小组件（项目主要平台）。

### 数据库设计

无需新增表，复用现有数据。

### 后端 API

#### 新增 API 端点
```typescript
// 获取小组件数据
GET /api/widgets/todos?limit=5
Response: {
  todos: Array<{
    id: string;
    title: string;
    priority: number;
    due_date?: string;
    completed: boolean;
  }>;
}

GET /api/widgets/stats
Response: {
  items_count: number;
  todos_pending: number;
  todos_completed: number;
}
```

### 原生代码（Android）

#### 文件结构
```
android/app/src/main/java/com/lifetracker/widget/
── LifeTrackerWidget.kt          # 小组件主类
├── LifeTrackerWidgetProvider.kt  # 数据提供者
└── WidgetDataService.kt          # 数据服务（调用 API）
```

#### 关键代码示例
```kotlin
// LifeTrackerWidget.kt
class LifeTrackerWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val todos = fetchTodosFromAPI()
        
        provideContent {
            Column {
                Text("待办事项", fontSize = 18.sp)
                todos.take(5).forEach { todo ->
                    Row {
                        Checkbox(checked = todo.completed, onCheckedChange = {})
                        Text(todo.title)
                    }
                }
            }
        }
    }
}
```

### Expo Config Plugin

#### plugins/withAndroidWidget.js
```javascript
const { withAndroidManifest, withGradleProperties } = require('@expo/config-plugins');

module.exports = function withAndroidWidget(config) {
  config = withAndroidManifest(config, async (config) => {
    // 注入 widget provider 到 AndroidManifest.xml
    return config;
  });
  
  config = withGradleProperties(config, async (config) => {
    // 添加依赖
    return config;
  });
  
  return config;
};
```

### 前端集成

#### app.json 配置
```json
{
  "plugins": [
    ["./plugins/withAndroidWidget"]
  ]
}
```

### UI 组件（Web 端模拟）

虽然 Web 端不支持真正的小组件，但可以提供类似体验：

1. `components/ui/PWAInstallPrompt.tsx` - PWA 安装提示
2. `components/ui/HomeScreenShortcut.tsx` - 添加到主屏幕快捷方式

### 测试要点
1. ✅ Android 小组件正确显示待办列表
2. ✅ 点击小组件跳转到 App 对应页面
3. ✅ 数据刷新机制正常（手动刷新 / 定时刷新）
4. ✅ 不同尺寸小组件适配良好
5. ✅ 离线时显示缓存数据

### 注意事项

⚠️ **此功能复杂度较高**，建议：
1. 先实现简单的统计小组件（只显示数字）
2. 再实现待办列表小组件
3. iOS 小组件留待后续（需要 Swift 代码）

### 预计工作量
- 后端 API: 2h
- Android 原生代码: 8h
- Config Plugin: 2h
- 测试调试: 4h
- **总计**: ~16h (2 天)

---

## 总结

### 总工作量估算

| 任务 | 优先级 | 预计工时 | 预计天数 |
|------|--------|---------|---------|
| T44 协作共享 | P2 | 18h | 2-3 天 |
| T45 物品借用追踪 | P2 | 16h | 2 天 |
| T46 智能提醒 | P2 | 13h | 1.5 天 |
| T47 物品价值追踪 | P3 | 17h | 2 天 |
| T48 AI 物品识别 | P3 | 12h | 1.5 天 |
| T49 数据看板 | P3 | 14h | 1.5-2 天 |
| T50 日历视图 | P3 | 12h | 1.5 天 |
| T51 模板功能 | P3 | 16h | 2 天 |
| T52 备份恢复 | P3 | 15h | 2 天 |
| T53 桌面小组件 | P3 | 16h | 2 天 |
| **总计** | - | **149h** | **~19 天** |

### 推荐开发顺序

1. **第一阶段（P2 功能）**：
   - T46 智能提醒（1.5 天）- 最简单，扩展现有功能
   - T44 协作共享（2-3 天）- 核心价值功能
   - T45 物品借用追踪（2 天）- 实用功能

2. **第二阶段（P3 功能 - 易用性）**：
   - T51 模板功能（2 天）- 提升录入效率
   - T52 备份恢复（2 天）- 数据安全
   - T50 日历视图（1.5 天）- 可视化改进

3. **第三阶段（P3 功能 - 高级）**：
   - T49 数据看板（1.5-2 天）- 统计分析
   - T47 物品价值追踪（2 天）- 资产管理
   - T48 AI 物品识别（1.5 天）- AI 增强
   - T53 桌面小组件（2 天）- 原生集成（最复杂）

### 风险控制

1. **技术风险**：
   - T53 桌面小组件涉及原生代码，延期风险高 → 放在最后
   - T48 AI 识别依赖第三方 API → 提前申请 API Key

2. **需求风险**：
   - T44 协作共享可能需要多次迭代 → 先做 MVP（基础共享）
   - T49 数据看板图表可能性能问题 → 先实现核心指标

3. **测试风险**：
   - 每个功能完成后立即写测试 → 避免累积技术债
   - 关键接口用 Postman/curl 验证 → 确保前后端对接无误

### 下一步行动

1. **选择第一个功能开始开发**（建议 T46 智能提醒）
2. **更新 TASKS.md**，将子任务拆分为 `in_progress`
3. **按照本计划的步骤执行**，每完成一步打勾
4. **遇到问题及时记录**，调整后续计划

---

**文档维护**：
- 每完成一个功能，更新本文档的实际用时
- 记录遇到的坑和解决方案
- 根据实际情况调整后续功能的优先级

最后更新：2026-06-26
