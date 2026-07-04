-- ============================================================
-- LifeTracker Supabase 数据库初始化脚本
-- ============================================================
-- 用途:
--   1. 创建/补齐 LifeTracker 业务表、索引、触发器和系统预设数据。
--   2. 作为当前数据库结构的可读基线文档。
--
-- 执行位置:
--   Supabase Dashboard -> SQL Editor。
--
-- 执行约束:
--   - 脚本尽量保持幂等，使用 IF NOT EXISTS / ON CONFLICT 安全重复执行。
--   - 开发和生产目前共用 Supabase 表，改表前必须确认影响面。
--   - 所有业务表使用 life_ 前缀。
--   - user_id 为 NULL 的分类/位置表示系统预设，所有用户可见不可删改。
--
-- 变更同步:
--   - 修改表结构后，同步更新 frontend/types、后端 service/controller、
--     frontend/lib/api.ts 和相关 store。
--   - 新增字段涉及时间时，遵守 AGENTS.md 中的时间处理规范。
-- ============================================================

-- ============================================================
-- 1. 用户资料表 (life_profiles)
-- 扩展 Supabase Auth 自带的 auth.users，一个用户对应一条资料
-- ============================================================
CREATE TABLE IF NOT EXISTS life_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 用 auth.users 回填已有用户邮箱
UPDATE life_profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.email = '');

-- 自动创建用户资料（注册时触发）
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.life_profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. 分类表 (life_categories)
-- user_id 为 NULL = 系统预设，所有用户可见不可删改
-- 支持 type 区分物品/待办分类，parent_id 实现层级
-- icon 存储 MaterialCommunityIcons 名称，color 存储颜色值
-- ============================================================
CREATE TABLE IF NOT EXISTS life_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  parent_id UUID REFERENCES life_categories(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('item', 'todo')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_type ON life_categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON life_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON life_categories(parent_id);

-- ============================================================
-- 3. 位置表 (life_locations)
-- user_id 为 NULL = 系统预设，所有用户可见不可删改
-- parent_id + level 实现位置层级（如 书房 → 书架 → 第三层）
-- ============================================================
CREATE TABLE IF NOT EXISTS life_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  parent_id UUID REFERENCES life_locations(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON life_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON life_locations(parent_id);

-- ============================================================
-- 4. 物品表 (life_items)
-- 核心业务表，记录物品的名称、位置、分类、图片、条码、价值、AI 建议等信息
-- ============================================================
CREATE TABLE IF NOT EXISTS life_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location_id UUID REFERENCES life_locations(id) ON DELETE SET NULL,
  category_id UUID REFERENCES life_categories(id) ON DELETE SET NULL,
  images TEXT[],
  barcode TEXT,
  expiry_date TIMESTAMPTZ,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_days_before INTEGER DEFAULT 7,
  -- 借用状态（由借用模块维护）
  is_borrowed BOOLEAN DEFAULT FALSE,
  borrowed_by TEXT,
  -- 价值追踪字段 (T47)
  purchase_price DECIMAL(10, 2),
  purchase_date TIMESTAMPTZ,
  current_value DECIMAL(10, 2),
  currency TEXT DEFAULT 'CNY',
  depreciation_rate DECIMAL(5, 2) DEFAULT 0,
  -- AI 识别字段 (T48，当前为模拟建议)
  ai_suggestions JSONB,
  ai_confidence DECIMAL(5, 2),
  -- 所有者
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_user_id ON life_items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON life_items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_location_id ON life_items(location_id);
CREATE INDEX IF NOT EXISTS idx_items_expiry_date ON life_items(expiry_date) WHERE expiry_date IS NOT NULL;

-- ============================================================
-- 5. 待办表 (life_todos)
-- 记录待办事项的标题、优先级、截止时间、提醒、排序和完成状态
-- ============================================================
CREATE TABLE IF NOT EXISTS life_todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority IN (1, 2, 3)),
  due_date TIMESTAMPTZ,
  reminder_date TIMESTAMPTZ,
  notification_id TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES life_categories(id) ON DELETE SET NULL,
  images TEXT[],
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON life_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_category_id ON life_todos(category_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON life_todos(completed);

-- ============================================================
-- 6. 提醒日志表 (life_reminder_logs)
-- 追踪已发送的提醒，通过 reminder_key 防重复推送
-- ============================================================
CREATE TABLE IF NOT EXISTS life_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('item', 'todo')),
  resource_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('expiry', 'due_date', 'custom')),
  reminder_key TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_resource ON life_reminder_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user ON life_reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON life_reminder_logs(sent_at);

-- 兼容已有表：补充分组添加 reminder_key 列（表已创建但旧版本无此列）
ALTER TABLE life_reminder_logs ADD COLUMN IF NOT EXISTS reminder_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_logs_key ON life_reminder_logs(reminder_key) WHERE reminder_key IS NOT NULL;

-- ============================================================
-- 7. 借用记录表 (life_borrowings)
-- 记录物品的借出/归还情况，关联 life_items
-- ============================================================
CREATE TABLE IF NOT EXISTS life_borrowings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES life_items(id) ON DELETE CASCADE,
  borrower_name TEXT NOT NULL,
  borrower_contact TEXT,
  borrow_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_return_date TIMESTAMPTZ,
  actual_return_date TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('borrowed', 'returned', 'overdue')) DEFAULT 'borrowed',
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borrowings_item ON life_borrowings(item_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_user ON life_borrowings(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON life_borrowings(status);
CREATE INDEX IF NOT EXISTS idx_borrowings_expected_return ON life_borrowings(expected_return_date);

-- ============================================================
-- 8. 共享关系表 (life_shares)
-- 记录用户之间的资源（物品/待办）共享关系，支持 view/edit 权限
-- 共享入口收拢到消息好友操作和资源编辑上下文
-- ============================================================
CREATE TABLE IF NOT EXISTS life_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('item', 'todo')),
  resource_id UUID NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')) DEFAULT 'view',
  conversation_id UUID REFERENCES life_conversations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, shared_with_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_shares_owner ON life_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON life_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shares_resource ON life_shares(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_shares_conversation ON life_shares(conversation_id);

-- ============================================================
-- 9. 模板表 (life_templates)
-- 用户自定义的物品/待办模板，支持从当前记录保存和套用预填
-- ============================================================
CREATE TABLE IF NOT EXISTS life_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  template_type TEXT NOT NULL CHECK (template_type IN ('item', 'todo')),
  data JSONB NOT NULL,
  icon TEXT,
  color TEXT,
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON life_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON life_templates(template_type);

-- ============================================================
-- 10. 价值历史记录表 (life_value_history)
-- 记录物品估值的变化历史，用于资产页展示价值趋势
-- ============================================================
CREATE TABLE IF NOT EXISTS life_value_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES life_items(id) ON DELETE CASCADE,
  value DECIMAL(10, 2) NOT NULL,
  reason TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_value_history_item ON life_value_history(item_id);
CREATE INDEX IF NOT EXISTS idx_value_history_user ON life_value_history(user_id);

-- ============================================================
-- 11. 反馈表 (life_feedback)
-- 用户提交的反馈建议
-- ============================================================
CREATE TABLE IF NOT EXISTS life_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  contact TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. 对话表 (life_conversations)
-- 双人对话，参与者为两个用户
-- ============================================================
CREATE TABLE IF NOT EXISTS life_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids UUID[] NOT NULL,
  last_message_type VARCHAR(20),
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (array_length(participant_ids, 1) = 2)
);

CREATE INDEX IF NOT EXISTS idx_conversations_participant ON life_conversations(participant_ids);

-- ============================================================
-- 13. 消息表 (life_messages)
-- 聊天消息，支持文字、物品卡片、待办卡片和系统通知四种类型
-- ============================================================
CREATE TABLE IF NOT EXISTS life_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES life_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('item', 'todo', 'text', 'system')),
  resource_type VARCHAR(20) CHECK (resource_type IN ('item', 'todo')),
  resource_id UUID,
  content TEXT,
  card_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON life_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON life_messages(sender_id);

-- ============================================================
-- 13.5 消息已读追踪表 (life_conversation_reads)
-- 记录每个用户在每个对话中最后已读的时间点
-- ============================================================
CREATE TABLE IF NOT EXISTS life_conversation_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES life_conversations(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_reads_user ON life_conversation_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_reads_conversation ON life_conversation_reads(conversation_id);

-- 自动更新 updated_at 触发器
DROP TRIGGER IF EXISTS update_conversation_reads_updated_at ON life_conversation_reads;
CREATE TRIGGER update_conversation_reads_updated_at
  BEFORE UPDATE ON life_conversation_reads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- 14. 好友关系与申请表 (life_friendships)
-- 一个关系记录表示双向好友申请/关系，status 区分 pending/accepted/rejected
-- 双方独立控制置顶，同意好友后才能建立对话和配置共享权限
-- ============================================================
CREATE TABLE IF NOT EXISTS life_friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  request_message TEXT,
  requester_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  addressee_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON life_friendships(requester_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON life_friendships(addressee_id, status);

-- ============================================================
-- 15. 系统预设数据
-- ============================================================

-- 15.1 预设物品分类（5 个，user_id 为 NULL）
INSERT INTO life_categories (id, name, icon, color, type, user_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', '电子产品', 'laptop',          '#3B82F6', 'item', NULL),
  ('a0000000-0000-0000-0000-000000000002', '书籍',     'book',            '#10B981', 'item', NULL),
  ('a0000000-0000-0000-0000-000000000003', '日用品',   'shopping',        '#F59E0B', 'item', NULL),
  ('a0000000-0000-0000-0000-000000000004', '衣物',     'tshirt-crew',     '#8B5CF6', 'item', NULL),
  ('a0000000-0000-0000-0000-000000000005', '其他',     'dots-horizontal', '#6B7280', 'item', NULL)
ON CONFLICT (id) DO NOTHING;

-- 15.2 预设位置（5 个，user_id 为 NULL）
INSERT INTO life_locations (id, name, icon, level, user_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', '书房', 'book-open-variant',    0, NULL),
  ('b0000000-0000-0000-0000-000000000002', '卧室', 'bed',                  0, NULL),
  ('b0000000-0000-0000-0000-000000000003', '客厅', 'sofa',                 0, NULL),
  ('b0000000-0000-0000-0000-000000000004', '厨房', 'pot-steam',            0, NULL),
  ('b0000000-0000-0000-0000-000000000005', '随身', 'bag-personal-outline', 0, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. Storage Bucket（图片上传）
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('items-images', 'items-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. 禁用 RLS（后端使用 service_role 鉴权，不依赖行级安全）
-- ============================================================
ALTER TABLE life_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_todos DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_reminder_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_borrowings DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_shares DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_value_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE life_conversation_reads DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 18. 自动更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- life_conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON life_conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON life_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- life_friendships
DROP TRIGGER IF EXISTS update_friendships_updated_at ON life_friendships;
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON life_friendships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
