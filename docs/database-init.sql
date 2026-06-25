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
-- 6. 反馈表 (life_feedback)
-- ============================================================
CREATE TABLE IF NOT EXISTS life_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  contact TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. 系统预设数据
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
-- 8. Storage Bucket（图片上传）
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
