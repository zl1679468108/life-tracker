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
    const { data: profile } = await this.supabase
      .from('life_profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    return profile?.user_id || null;
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

    if (error) throw new InternalServerErrorException(error.message);

    // 获取被共享者名称和资源名称
    const enriched = await Promise.all(
      (data || []).map(async (share) => {
        const profile = await this.supabase
          .from('life_profiles')
          .select('full_name')
          .eq('user_id', share.shared_with_id)
          .single();

        let resourceName = '未知资源';
        if (share.resource_type === 'item') {
          const { data: item } = await this.supabase
            .from('life_items')
            .select('name')
            .eq('id', share.resource_id)
            .single();
          resourceName = item?.name || '未知物品';
        } else {
          const { data: todo } = await this.supabase
            .from('life_todos')
            .select('title')
            .eq('id', share.resource_id)
            .single();
          resourceName = todo?.title || '未知待办';
        }

        return {
          ...convertTimesToBeijing(share),
          shared_with_name: profile.data?.full_name || '未知用户',
          resource_name: resourceName,
        };
      })
    );

    return enriched;
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

    if (error) throw new InternalServerErrorException(error.message);

    // 获取所有者名称和资源名称
    const enriched = await Promise.all(
      (data || []).map(async (share) => {
        const profile = await this.supabase
          .from('life_profiles')
          .select('full_name')
          .eq('user_id', share.owner_id)
          .single();

        let resourceName = '未知资源';
        if (share.resource_type === 'item') {
          const { data: item } = await this.supabase
            .from('life_items')
            .select('name')
            .eq('id', share.resource_id)
            .single();
          resourceName = item?.name || '未知物品';
        } else {
          const { data: todo } = await this.supabase
            .from('life_todos')
            .select('title')
            .eq('id', share.resource_id)
            .single();
          resourceName = todo?.title || '未知待办';
        }

        return {
          ...convertTimesToBeijing(share),
          owner_name: profile.data?.full_name || '未知用户',
          resource_name: resourceName,
        };
      })
    );

    return enriched;
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

    if (error) throw new InternalServerErrorException(error.message);

    const enriched = await Promise.all(
      (data || []).map(async (share) => {
        const profile = await this.supabase
          .from('life_profiles')
          .select('full_name')
          .eq('user_id', share.shared_with_id)
          .single();

        return {
          ...convertTimesToBeijing(share),
          shared_with_name: profile.data?.full_name || '未知用户',
        };
      })
    );

    return enriched;
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
      throw new InternalServerErrorException(resourceError.message);
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

    if (friendshipError) throw new InternalServerErrorException(friendshipError.message);
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
      throw new InternalServerErrorException(error.message);
    }

    // 2. 自动创建对话 + 卡片消息
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
      await this.supabase
        .from('life_shares')
        .update({ conversation_id: conversation.id })
        .eq('id', share.id);
    } catch (err) {
      // 对话创建失败不影响 share 创建，记录日志即可
      console.error('Failed to create conversation for share:', err);
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
      throw new InternalServerErrorException(error.message);
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

    if (error) throw new InternalServerErrorException(error.message);

    return { success: true };
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

      if (friendshipError) throw new InternalServerErrorException(friendshipError.message);
      if (!friendship) return { hasAccess: false };

      return { hasAccess: true, permission: share.permission };
    }

    return { hasAccess: false };
  }
}
