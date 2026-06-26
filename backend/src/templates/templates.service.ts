import { Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing } from '../common/utils/time';

@Injectable()
export class TemplatesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async findAll(userId: string, type?: 'item' | 'todo') {
    let query = this.supabase
      .from('life_templates')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (type) {
      query = query.eq('template_type', type);
    }

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map(convertTimesToBeijing);
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('模板不存在');
      throw new InternalServerErrorException(error.message);
    }
    return convertTimesToBeijing(data);
  }

  async create(userId: string, body: {
    name: string;
    description?: string;
    template_type: 'item' | 'todo';
    data: Record<string, any>;
    icon?: string;
    color?: string;
  }) {
    const { data, error } = await this.supabase
      .from('life_templates')
      .insert({ ...body, user_id: userId })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return convertTimesToBeijing(data);
  }

  async update(id: string, userId: string, body: {
    name?: string;
    description?: string;
    data?: Record<string, any>;
    icon?: string;
    color?: string;
  }) {
    const { data, error } = await this.supabase
      .from('life_templates')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('模板不存在');
      throw new InternalServerErrorException(error.message);
    }
    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase
      .from('life_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(error.message);
    return { success: true };
  }

  /**
   * 使用模板创建物品或待办
   */
  async useTemplate(id: string, userId: string, overrides?: Record<string, any>) {
    // 获取模板
    const { data: template, error: templateError } = await this.supabase
      .from('life_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (templateError || !template) {
      throw new NotFoundException('模板不存在');
    }

    // 合并模板数据和覆盖项
    const templateData = { ...template.data, ...overrides };
    const table = template.template_type === 'item' ? 'life_items' : 'life_todos';

    // 插入新记录
    const insertData = {
      ...templateData,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from(table)
      .insert(insertData)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    // 更新使用次数
    await this.supabase
      .from('life_templates')
      .update({ usage_count: (template.usage_count || 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', id);

    return {
      id: data.id,
      type: template.template_type,
      ...convertTimesToBeijing(data),
    };
  }
}
