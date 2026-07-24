import { Injectable, Inject, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing } from '../common/utils/time';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class SharesService {
  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT) private supabase: SupabaseClient,
    private readonly messagesService: MessagesService,
  ) {}

  /**
   * 通过邮箱查找用户 ID
   */
  async findUserByEmail(email: string): Promise<string | null> {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) return null;

    const { data: profile } = await this.supabase
      .from('life_profiles')
      .select('id')
      .ilike('email', normalized)
      .maybeSingle();

    return profile?.id || null;
  }

  /**
   * 批量获取用户资料名称，返回 user_id -> display_name 的映射
   * life_profiles 主键为 id（= auth.users.id），展示字段为 display_name
   */
  private async getProfileNameMap(userIds: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(userIds.filter(Boolean))];
    const map = new Map<string, string>();
    if (uniqueIds.length === 0) return map;

    const { data: profiles } = await this.supabase
      .from('life_profiles')
      .select('id, display_name, email')
      .in('id', uniqueIds);

    for (const profile of profiles || []) {
      const name =
        profile.display_name ||
        (profile.email ? String(profile.email).split('@')[0] : '') ||
        '未知用户';
      map.set(profile.id, name);
    }
    return map;
  }

  /**
   * 批量获取资源名称，返回 resource_id -> name 的映射
   */
  private async getResourceNameMap(
    resourceIds: string[],
    resourceType: 'item' | 'todo',
  ): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(resourceIds.filter(Boolean))];
    const map = new Map<string, string>();
    if (uniqueIds.length === 0) return map;

    if (resourceType === 'item') {
      const { data: items } = await this.supabase
        .from('life_items')
        .select('id, name')
        .in('id', uniqueIds);
      for (const item of items || []) {
        map.set(item.id, item.name || '未知物品');
      }
    } else {
      const { data: todos } = await this.supabase
        .from('life_todos')
        .select('id, title')
        .in('id', uniqueIds);
      for (const todo of todos || []) {
        map.set(todo.id, todo.title || '未知待办');
      }
    }
    return map;
  }

  /**
   * 查询我共享出去的资源
   */
  async findOutgoing(userId: string) {
    const { data, error } = await this.supabase
      .from('life_shares')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('共享操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (!data || data.length === 0) return [];

    // 批量获取被共享者资料
    const profileMap = await this.getProfileNameMap(data.map((s) => s.shared_with_id));

    // 批量获取资源名称（按类型分组查询）
    const itemIds = data.filter((s) => s.resource_type === 'item').map((s) => s.resource_id);
    const todoIds = data.filter((s) => s.resource_type === 'todo').map((s) => s.resource_id);
    const itemNameMap = await this.getResourceNameMap(itemIds, 'item');
    const todoNameMap = await this.getResourceNameMap(todoIds, 'todo');

    // 在内存中 join 组装结果
    return data.map((share) => {
      const resourceName = share.resource_type === 'item'
        ? itemNameMap.get(share.resource_id) || '未知物品'
        : todoNameMap.get(share.resource_id) || '未知待办';
      return {
        ...convertTimesToBeijing(share),
        shared_with_name: profileMap.get(share.shared_with_id) || '未知用户',
        resource_name: resourceName,
      };
    });
  }

  /**
   * 查询他人共享给我的资源
   */
  async findIncoming(userId: string) {
    const { data, error } = await this.supabase
      .from('life_shares')
      .select('*')
      .eq('shared_with_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('共享操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (!data || data.length === 0) return [];

    // 批量获取所有者资料
    const profileMap = await this.getProfileNameMap(data.map((s) => s.owner_id));

    // 批量获取资源名称（按类型分组查询）
    const itemIds = data.filter((s) => s.resource_type === 'item').map((s) => s.resource_id);
    const todoIds = data.filter((s) => s.resource_type === 'todo').map((s) => s.resource_id);
    const itemNameMap = await this.getResourceNameMap(itemIds, 'item');
    const todoNameMap = await this.getResourceNameMap(todoIds, 'todo');

    // 在内存中 join 组装结果
    return data.map((share) => {
      const resourceName = share.resource_type === 'item'
        ? itemNameMap.get(share.resource_id) || '未知物品'
        : todoNameMap.get(share.resource_id) || '未知待办';
      return {
        ...convertTimesToBeijing(share),
        owner_name: profileMap.get(share.owner_id) || '未知用户',
        resource_name: resourceName,
      };
    });
  }

  /**
   * 查询特定资源的共享关系
   */
  async findByResource(resourceId: string, resourceType: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_shares')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('resource_type', resourceType)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('共享操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (!data || data.length === 0) return [];

    // 批量获取被共享者资料
    const profileMap = await this.getProfileNameMap(data.map((s) => s.shared_with_id));

    // 在内存中 join 组装结果
    return data.map((share) => ({
      ...convertTimesToBeijing(share),
      shared_with_name: profileMap.get(share.shared_with_id) || '未知用户',
    }));
  }

  /**
   * 创建共享关系，同时自动创建对话
   */
  async create(data: {
    owner_id: string;
    shared_with_id: string;
    resource_type: 'item' | 'todo';
    resource_id: string;
    permission: 'view' | 'edit';
  }) {
    // 验证资源所有权
    const resourceQuery = data.resource_type === 'item'
      ? this.supabase
          .from('life_items')
          .select('user_id, name')
          .eq('id', data.resource_id)
          .single()
      : this.supabase
          .from('life_todos')
          .select('user_id, title')
          .eq('id', data.resource_id)
          .single();

    const { data: resource, error: resourceError } = await resourceQuery;

    if (resourceError) {
      if (resourceError.code === 'PGRST116') {
        throw new NotFoundException('资源不存在');
      }
      console.error('查询资源失败:', resourceError); throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    if (!resource || resource.user_id !== data.owner_id) {
      throw new BadRequestException('您不是该资源的所有者');
    }

    // 不能共享给自己
    if (data.owner_id === data.shared_with_id) {
      throw new BadRequestException('不能共享给自己');
    }

    const { data: friendship, error: friendshipError } = await this.supabase
      .from('life_friendships')
      .select('id')
      .or(`and(requester_id.eq.${data.owner_id},addressee_id.eq.${data.shared_with_id}),and(requester_id.eq.${data.shared_with_id},addressee_id.eq.${data.owner_id})`)
      .eq('status', 'accepted')
      .maybeSingle();

    if (friendshipError) { console.error('查询好友关系失败:', friendshipError); throw new InternalServerErrorException('操作失败，请稍后重试'); }
    if (!friendship) {
      throw new BadRequestException('只能共享给已通过好友');
    }

    // 获取资源名称
    const resourceName = data.resource_type === 'item'
      ? (resource as any).name || '未知物品'
      : (resource as any).title || '未知待办';

    // 1. 创建 share 记录
    const { data: share, error } = await this.supabase
      .from('life_shares')
      .insert({
        owner_id: data.owner_id,
        shared_with_id: data.shared_with_id,
        resource_type: data.resource_type,
        resource_id: data.resource_id,
        permission: data.permission || 'view',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('该共享关系已存在');
      }
      console.error('共享操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    // 2. 自动创建对话 + 卡片消息（与 share 插入构成逻辑事务：失败则回滚 share）
    let conversation = null;
    try {
      const result = await this.messagesService.createFromShare(
        data.owner_id,
        data.shared_with_id,
        data.resource_type,
        data.resource_id,
        resourceName,
      );
      conversation = result.conversation;

      // 3. 将 conversation_id 写入 share 记录
      const { error: linkError } = await this.supabase
        .from('life_shares')
        .update({ conversation_id: conversation.id })
        .eq('id', share.id);

      if (linkError) {
        // conversation_id 回填失败：补偿回滚 share，避免 share 留空 conversation_id
        await this.supabase
          .from('life_shares')
          .delete()
          .eq('id', share.id);
        throw new InternalServerErrorException('关联对话失败，共享记录已回滚');
      }
    } catch (err) {
      // createFromShare 失败或回填失败：若 share 仍存在则回滚，避免遗留空 conversation_id
      if (err instanceof InternalServerErrorException) throw err;
      console.error('Failed to create conversation for share, rolling back share:', err);
      await this.supabase
        .from('life_shares')
        .delete()
        .eq('id', share.id);
      throw new InternalServerErrorException('创建对话失败，共享记录已回滚');
    }

    const enrichedShare = convertTimesToBeijing(share);
    return {
      ...enrichedShare,
      conversation_id: conversation?.id || null,
    };
  }

  /**
   * 更新共享权限
   */
  async update(id: string, userId: string, permission: 'view' | 'edit') {
    const { data, error } = await this.supabase
      .from('life_shares')
      .update({ permission })
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('共享关系不存在');
      console.error('共享操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    return convertTimesToBeijing(data);
  }

  /**
   * 删除共享关系
   */
  async remove(id: string, userId: string) {
    const { error } = await this.supabase
      .from('life_shares')
      .delete()
      .eq('id', id)
      .eq('owner_id', userId);

    if (error) {
      console.error('共享操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    return { code: 200, data: null, message: '删除成功' };
  }

  /**
   * 检查用户是否有权限访问资源
   */
  async checkPermission(
    userId: string,
    resourceType: 'item' | 'todo',
    resourceId: string,
  ): Promise<{ hasAccess: boolean; permission?: 'view' | 'edit' }> {
    const { data: share } = await this.supabase
      .from('life_shares')
      .select('permission, owner_id')
      .eq('shared_with_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .single();

    if (share) {
      const { data: friendship, error: friendshipError } = await this.supabase
        .from('life_friendships')
        .select('id')
        .or(`and(requester_id.eq.${share.owner_id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${share.owner_id})`)
        .eq('status', 'accepted')
        .maybeSingle();

      if (friendshipError) { console.error('查询好友关系失败:', friendshipError); throw new InternalServerErrorException('操作失败，请稍后重试'); }
      if (!friendship) return { hasAccess: false };

      return { hasAccess: true, permission: share.permission };
    }

    return { hasAccess: false };
  }
}
