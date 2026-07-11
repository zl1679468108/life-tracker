import { Injectable, Inject, InternalServerErrorException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { toUtcIso, convertTimesToBeijing } from '../common/utils/time';
import { SharesService } from '../shares/shares.service';

@Injectable()
export class TodosService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
    private readonly sharesService: SharesService,
  ) {}

  private withAccessMeta(todo: any, userId: string, permission: 'owner' | 'view' | 'edit') {
    return {
      ...convertTimesToBeijing(todo),
      is_shared_resource: todo.user_id !== userId,
      share_permission: permission,
      can_edit: permission === 'owner' || permission === 'edit',
    };
  }

  private async getAccessibleTodo(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_todos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new BadRequestException('待办不存在');
      console.error('待办操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    if (data.user_id === userId) {
      return { todo: data, permission: 'owner' as const };
    }

    const access = await this.sharesService.checkPermission(userId, 'todo', id);
    if (!access.hasAccess || !access.permission) {
      throw new ForbiddenException('无权访问该待办');
    }

    return { todo: data, permission: access.permission };
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .from('life_todos')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('待办操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    const ownTodos = (data || []).map((todo) => this.withAccessMeta(todo, userId, 'owner'));

    const { data: shares, error: sharesError } = await this.supabase
      .from('life_shares')
      .select('resource_id, permission')
      .eq('shared_with_id', userId)
      .eq('resource_type', 'todo');

    if (sharesError) { console.error('查询共享待办失败:', sharesError); throw new InternalServerErrorException('操作失败，请稍后重试'); }

    const resourceIds = Array.from(new Set((shares || []).map((share) => share.resource_id)));
    if (resourceIds.length === 0) return ownTodos;

    const { data: sharedTodos, error: sharedError } = await this.supabase
      .from('life_todos')
      .select('*')
      .in('id', resourceIds);

    if (sharedError) { console.error('查询共享待办列表失败:', sharedError); throw new InternalServerErrorException('操作失败，请稍后重试'); }

    const permissionById = new Map((shares || []).map((share) => [share.resource_id, share.permission as 'view' | 'edit']));
    const visibleSharedTodos = (sharedTodos || []).map((todo) => this.withAccessMeta(todo, userId, permissionById.get(todo.id) || 'view'));
    return [...ownTodos, ...visibleSharedTodos];
  }

  async findOne(id: string, userId: string) {
    const { todo, permission } = await this.getAccessibleTodo(id, userId);
    return this.withAccessMeta(todo, userId, permission);
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

    if (error) {
      console.error('待办操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    this.eventsGateway.emitTodoCreated(todo.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any, userId: string) {
    const { permission } = await this.getAccessibleTodo(id, userId);
    if (permission === 'view') {
      throw new ForbiddenException('只有查看权限，不能编辑该待办');
    }

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
      console.error('待办操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (data) this.eventsGateway.emitTodoUpdated(data.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    const { todo } = await this.getAccessibleTodo(id, userId);
    if (todo.user_id !== userId) {
      throw new ForbiddenException('只有所有者可以删除该待办');
    }

    // 先查出 user_id 用于广播
    const { data: existing } = await this.supabase
      .from('life_todos')
      .select('user_id')
      .eq('id', id)
      .single();

    // 清理该待办的共享记录（life_shares 对 resource_id 是多态引用，无 FK 级联）
    const { error: sharesCleanupError } = await this.supabase
      .from('life_shares')
      .delete()
      .eq('resource_type', 'todo')
      .eq('resource_id', id);
    if (sharesCleanupError) {
      console.error('清理待办共享记录失败:', sharesCleanupError.message);
    }

    const { error } = await this.supabase
      .from('life_todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('待办操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (existing) this.eventsGateway.emitTodoDeleted(existing.user_id, id);
    return { code: 200, data: null, message: '删除成功' };
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
      return { code: 200, data: null, message: '排序成功' };
    } catch (error) {
      throw new InternalServerErrorException('排序更新失败');
    }
  }
}
