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
--   - 脚本尽量保持幂等，使用 IF NOT EXISTS / ON CONFLICT / 条件 ALTER。
--   - 开发和生产目前共用 Supabase 表，改表前必须确认影响面。
--   - 所有业务表使用 life_ 前缀。
--   - user_id 为 NULL 的分类/位置表示系统预设。
--
-- 变更同步:
--   - 修改表结构后，同步更新 frontend/types、后端 service/controller、
--     frontend/lib/api.ts 和相关 store。
--   - 新增字段涉及时间时，遵守 AGENTS.md 中的时间处理规范。
-- ============================================================

-- ============================================================
-- 1. 用户资料表 (life_profiles)
-- Supabase Auth 自带 auth.users，此表扩展用户资料
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

-- 为已有表添加 email 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_profiles'::regclass
    AND attname = 'email'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_profiles ADD COLUMN email TEXT;
  END IF;
END $$;

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
-- user_id 为 NULL 表示系统预设，所有用户可见，不可删改
-- icon 字段存储 MaterialCommunityIcons 图标名称
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

-- 为已有表添加 icon 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_categories'::regclass
    AND attname = 'icon'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_categories ADD COLUMN icon TEXT;
  END IF;
END $$;

-- 为已有表添加 color 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_categories'::regclass
    AND attname = 'color'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_categories ADD COLUMN color TEXT;
  END IF;
END $$;

-- 为已有表添加 parent_id 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_categories'::regclass
    AND attname = 'parent_id'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_categories ADD COLUMN parent_id UUID REFERENCES life_categories(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_type ON life_categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON life_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON life_categories(parent_id);

-- ============================================================
-- 3. 位置表 (life_locations)
-- user_id 为 NULL 表示系统预设，所有用户可见，不可删改
-- icon 字段存储 MaterialCommunityIcons 图标名称
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

-- 为已有表添加 icon 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_locations'::regclass
    AND attname = 'icon'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_locations ADD COLUMN icon TEXT;
  END IF;
END $$;

-- 为已有表添加 parent_id 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_locations'::regclass
    AND attname = 'parent_id'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_locations ADD COLUMN parent_id UUID REFERENCES life_locations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_locations_user_id ON life_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_locations_parent_id ON life_locations(parent_id);

-- ============================================================
-- 4. 物品表 (life_items)
-- ============================================================
CREATE TABLE IF NOT EXISTS life_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location_id UUID REFERENCES life_locations(id) ON DELETE SET NULL,
  category_id UUID REFERENCES life_categories(id) ON DELETE SET NULL,
  images TEXT[],
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_user_id ON life_items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON life_items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_location_id ON life_items(location_id);

-- 为已有表添加 expiry_date 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_items'::regclass
    AND attname = 'expiry_date'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_items ADD COLUMN expiry_date TIMESTAMPTZ;
  END IF;
END $$;

-- 为已有表添加 reminder_enabled 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_items'::regclass
    AND attname = 'reminder_enabled'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_items ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- 为已有表添加 reminder_days_before 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_items'::regclass
    AND attname = 'reminder_days_before'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_items ADD COLUMN reminder_days_before INTEGER DEFAULT 7;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_items_expiry_date ON life_items(expiry_date) WHERE expiry_date IS NOT NULL;

-- T47: 物品价值追踪字段
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'life_items'::regclass AND attname = 'purchase_price' AND NOT attisdropped) THEN
    ALTER TABLE life_items ADD COLUMN purchase_price DECIMAL(10, 2);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'life_items'::regclass AND attname = 'purchase_date' AND NOT attisdropped) THEN
    ALTER TABLE life_items ADD COLUMN purchase_date TIMESTAMPTZ;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'life_items'::regclass AND attname = 'current_value' AND NOT attisdropped) THEN
    ALTER TABLE life_items ADD COLUMN current_value DECIMAL(10, 2);
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'life_items'::regclass AND attname = 'currency' AND NOT attisdropped) THEN
    ALTER TABLE life_items ADD COLUMN currency TEXT DEFAULT 'CNY';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'life_items'::regclass AND attname = 'depreciation_rate' AND NOT attisdropped) THEN
    ALTER TABLE life_items ADD COLUMN depreciation_rate DECIMAL(5, 2) DEFAULT 0;
  END IF;
END $$;

-- T48: AI 识别字段
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'life_items'::regclass AND attname = 'ai_suggestions' AND NOT attisdropped) THEN
    ALTER TABLE life_items ADD COLUMN ai_suggestions JSONB;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_attribute WHERE attrelid = 'life_items'::regclass AND attname = 'ai_confidence' AND NOT attisdropped) THEN
    ALTER TABLE life_items ADD COLUMN ai_confidence DECIMAL(5, 2);
  END IF;
END $$;

-- ============================================================
-- 6.8 价值历史记录表 (life_value_history)
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
-- 5. 待办表 (life_todos)
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

-- 为已有表添加 sort_order 列（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_todos'::regclass
    AND attname = 'sort_order'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_todos ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON life_todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_category_id ON life_todos(category_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON life_todos(completed);

-- ============================================================
-- 6. 提醒日志表 (life_reminder_logs)
-- 用于追踪已发送的提醒，避免重复推送
-- ============================================================
CREATE TABLE IF NOT EXISTS life_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('item', 'todo')),
  resource_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('expiry', 'due_date', 'custom')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_resource ON life_reminder_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user ON life_reminder_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON life_reminder_logs(sent_at);

-- ============================================================
-- 6.5 借用记录表 (life_borrowings)
-- 记录物品的借出/归还情况
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

-- 为 life_items 添加借用状态字段
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_items'::regclass
    AND attname = 'is_borrowed'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_items ADD COLUMN is_borrowed BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_items'::regclass
    AND attname = 'borrowed_by'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_items ADD COLUMN borrowed_by TEXT;
  END IF;
END $$;

-- ============================================================
-- 6.6 共享关系表 (life_shares)
-- 记录用户之间的资源共享关系
-- ============================================================
CREATE TABLE IF NOT EXISTS life_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('item', 'todo')),
  resource_id UUID NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit')) DEFAULT 'view',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, shared_with_id, resource_type, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_shares_owner ON life_shares(owner_id);
CREATE INDEX IF NOT EXISTS idx_shares_shared_with ON life_shares(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_shares_resource ON life_shares(resource_type, resource_id);

-- ============================================================
-- 6.7 模板表 (life_templates)
-- 用户自定义的物品/待办模板
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
-- 7. 反馈表 (life_feedback)
-- ============================================================
CREATE TABLE IF NOT EXISTS life_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  contact TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. 系统预设数据
-- ============================================================

-- 7.1 预设物品分类（5 个，user_id 为 NULL）
INSERT INTO life_categories (id, name, icon, type, user_id) VALUES
  ('a0000000-0000-0000-0000-000000000001', '电子产品', 'laptop',          'item', NULL),
  ('a0000000-0000-0000-0000-000000000002', '书籍',     'book',            'item', NULL),
  ('a0000000-0000-0000-0000-000000000003', '日用品',   'shopping',        'item', NULL),
  ('a0000000-0000-0000-0000-000000000004', '衣物',     'tshirt-crew',     'item', NULL),
  ('a0000000-0000-0000-0000-000000000005', '其他',     'dots-horizontal', 'item', NULL)
ON CONFLICT (id) DO NOTHING;

-- 7.2 预设位置（5 个，user_id 为 NULL）
INSERT INTO life_locations (id, name, icon, level, user_id) VALUES
  ('b0000000-0000-0000-0000-000000000001', '书房', 'book-open-variant',    0, NULL),
  ('b0000000-0000-0000-0000-000000000002', '卧室', 'bed',                  0, NULL),
  ('b0000000-0000-0000-0000-000000000003', '客厅', 'sofa',                 0, NULL),
  ('b0000000-0000-0000-0000-000000000004', '厨房', 'pot-steam',            0, NULL),
  ('b0000000-0000-0000-0000-000000000005', '随身', 'bag-personal-outline', 0, NULL)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. Storage Bucket（图片上传）
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('items-images', 'items-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
CREATE POLICY "Users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'items-images'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Public read images" ON storage.objects;
CREATE POLICY "Public read images" ON storage.objects
  FOR SELECT USING (bucket_id = 'items-images');

-- ============================================================
-- 10. 对话表 (life_conversations) — v1.1.0 新增
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
-- 11. 消息表 (life_messages) — v1.1.0 新增
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
-- 12. shares 表新增 conversation_id 关联 — v1.1.0
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'life_shares'::regclass
    AND attname = 'conversation_id'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE life_shares ADD COLUMN conversation_id UUID REFERENCES life_conversations(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_shares_conversation ON life_shares(conversation_id);

-- ============================================================
-- 13. RLS 策略 — conversations + messages
-- ============================================================

-- conversations: 参与者可以读写
DROP POLICY IF EXISTS "Participants can view conversations" ON life_conversations;
CREATE POLICY "Participants can view conversations" ON life_conversations
  FOR SELECT USING (
    auth.uid() = ANY(participant_ids)
  );

DROP POLICY IF EXISTS "Participants can update conversations" ON life_conversations;
CREATE POLICY "Participants can update conversations" ON life_conversations
  FOR UPDATE USING (
    auth.uid() = ANY(participant_ids)
  );

DROP POLICY IF EXISTS "Participants can create conversations" ON life_conversations;
CREATE POLICY "Participants can create conversations" ON life_conversations
  FOR INSERT WITH CHECK (
    auth.uid() = ANY(participant_ids)
  );

-- messages: 参与者可以读写
DROP POLICY IF EXISTS "Participants can view messages" ON life_messages;
CREATE POLICY "Participants can view messages" ON life_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM life_conversations
      WHERE id = life_messages.conversation_id
        AND auth.uid() = ANY(participant_ids)
    )
  );

DROP POLICY IF EXISTS "Participants can create messages" ON life_messages;
CREATE POLICY "Participants can create messages" ON life_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

-- ============================================================
-- 14. 自动更新 updated_at 触发器
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_conversations_updated_at ON life_conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON life_conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
