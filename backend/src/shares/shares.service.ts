import { Injectable, Inject, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing } from '../common/utils/time';

@Injectable()
export class SharesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
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
   * 创建共享关系
   */
  async create(data: {
    owner_id: string;
    shared_with_id: string;
    resource_type: 'item' | 'todo';
    resource_id: string;
    permission: 'view' | 'edit';
  }) {
    // 验证资源所有权
    const table = data.resource_type === 'item' ? 'life_items' : 'life_todos';
    const { data: resource } = await this.supabase
      .from(table)
      .select('user_id')
      .eq('id', data.resource_id)
      .single();

    if (!resource || resource.user_id !== data.owner_id) {
      throw new BadRequestException('您不是该资源的所有者');
    }

    // 不能共享给自己
    if (data.owner_id === data.shared_with_id) {
      throw new BadRequestException('不能共享给自己');
    }

    const { data: share, error } = await this.supabase
      .from('life_shares')
      .insert(data)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestException('该共享关系已存在');
      }
      throw new InternalServerErrorException(error.message);
    }

    return convertTimesToBeijing(share);
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
      .select('permission')
      .eq('shared_with_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .single();

    if (share) {
      return { hasAccess: true, permission: share.permission };
    }

    return { hasAccess: false };
  }
}
