import { Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing, toUtcIso } from '../common/utils/time';

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
    if (error) {
      console.error('模板操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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
      console.error('模板操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
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

    if (error) {
      console.error('模板操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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
      console.error('模板操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    const { error } = await this.supabase
      .from('life_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('模板操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return { code: 200, data: null, message: '删除成功' };
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

    const table = template.template_type === 'item' ? 'life_items' : 'life_todos';
    const merged = { ...(template.data || {}), ...(overrides || {}) };
    const insertData = this.pickTemplateInsert(template.template_type, merged, userId);

    const { data, error } = await this.supabase
      .from(table)
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('模板操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

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

  /** 仅允许业务字段写入，避免模板 data 污染系统列 */
  private pickTemplateInsert(
    type: 'item' | 'todo',
    source: Record<string, any>,
    userId: string,
  ) {
    const now = new Date().toISOString();
    if (type === 'item') {
      const item: Record<string, any> = {
        user_id: userId,
        name: String(source.name || '未命名物品').slice(0, 200),
        description: source.description ?? null,
        category_id: source.category_id ?? null,
        location_id: source.location_id ?? null,
        images: Array.isArray(source.images) ? source.images : [],
        barcode: source.barcode ?? null,
        reminder_enabled: Boolean(source.reminder_enabled),
        reminder_days_before: source.reminder_days_before ?? 7,
        value: source.value ?? null,
        created_at: now,
        updated_at: now,
      };
      if (source.expiry_date) item.expiry_date = toUtcIso(String(source.expiry_date));
      if (source.purchase_date) item.purchase_date = toUtcIso(String(source.purchase_date));
      return item;
    }

    const todo: Record<string, any> = {
      user_id: userId,
      title: String(source.title || source.name || '未命名待办').slice(0, 200),
      description: source.description ?? null,
      category_id: source.category_id ?? null,
      priority: source.priority ?? 'medium',
      completed: false,
      created_at: now,
      updated_at: now,
    };
    if (source.due_date) todo.due_date = toUtcIso(String(source.due_date));
    if (source.reminder_date) todo.reminder_date = toUtcIso(String(source.reminder_date));
    return todo;
  }
}
