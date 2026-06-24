import { Injectable, Inject, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { toUtcIso, convertTimesToBeijing } from '../common/utils/time';

@Injectable()
export class TodosService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .from('life_todos')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map(convertTimesToBeijing);
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('life_todos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new BadRequestException('待办不存在');
      throw new InternalServerErrorException(error.message);
    }
    return convertTimesToBeijing(data);
  }

  async create(todo: any) {
    // 将北京时间转为 UTC 存储
    const storeData = { ...todo };
    if (storeData.due_date) storeData.due_date = toUtcIso(storeData.due_date);
    if (storeData.reminder_date) storeData.reminder_date = toUtcIso(storeData.reminder_date);

    const { data, error } = await this.supabase
      .from('life_todos')
      .insert(storeData)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    this.eventsGateway.emitTodoCreated(todo.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any) {
    const storeUpdates = { ...updates };
    if (storeUpdates.due_date) storeUpdates.due_date = toUtcIso(storeUpdates.due_date);
    if (storeUpdates.reminder_date) storeUpdates.reminder_date = toUtcIso(storeUpdates.reminder_date);

    const { data, error } = await this.supabase
      .from('life_todos')
      .update({ ...storeUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new BadRequestException('待办不存在');
      throw new InternalServerErrorException(error.message);
    }
    if (data) this.eventsGateway.emitTodoUpdated(data.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async remove(id: string) {
    // 先查出 user_id 用于广播
    const { data: existing } = await this.supabase
      .from('life_todos')
      .select('user_id')
      .eq('id', id)
      .single();

    const { error } = await this.supabase
      .from('life_todos')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    if (existing) this.eventsGateway.emitTodoDeleted(existing.user_id, id);
    return { success: true };
  }

  async reorder(items: { id: string; sort_order: number }[], userId: string) {
    try {
      // 批量更新排序顺序
      const updates = items.map((item) =>
        this.supabase
          .from('life_todos')
          .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
          .eq('id', item.id)
          .eq('user_id', userId)
      );

      await Promise.all(updates);
      return { success: true };
    } catch (error) {
      throw new InternalServerErrorException('排序更新失败');
    }
  }
}
