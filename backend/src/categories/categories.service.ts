import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { convertTimesToBeijing } from '../common/utils/time';
import { throwOnSupabaseError } from '../common/utils/supabase-error';
import { assertUserOwnedResource } from '../common/utils/owned-resource';

const CATEGORY_LABELS = {
  notFound: '分类不存在',
  systemForbidden: '不能修改系统预设分类',
  forbidden: '无权修改该分类',
};

const CATEGORY_DELETE_LABELS = {
  notFound: '分类不存在',
  systemForbidden: '不能删除系统预设分类',
  forbidden: '无权删除该分类',
};

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(userId: string) {
    // 查询系统预设（user_id 为 NULL）和用户自己的分类
    const { data, error } = await this.supabase
      .from('life_categories')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name');

    throwOnSupabaseError(error, '分类操作失败:');
    return (data || []).map(convertTimesToBeijing);
  }

  async create(name: string, type: string, icon: string | undefined, color: string | undefined, parentId: string | undefined, userId: string) {
    const { data, error } = await this.supabase
      .from('life_categories')
      .insert({ name, type, icon, color, parent_id: parentId, user_id: userId })
      .select()
      .single();

    throwOnSupabaseError(error, '分类操作失败:');
    this.eventsGateway.emitCategoryCreated(userId, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any, userId: string) {
    // 不能更新系统预设（user_id 为 NULL），且只能更新自己的分类
    const { data: existing, error: findError } = await this.supabase
      .from('life_categories')
      .select('user_id')
      .eq('id', id)
      .single();

    throwOnSupabaseError(findError, '查询分类失败:', {
      notFoundMessage: CATEGORY_LABELS.notFound,
      notFoundAs: 'bad_request',
    });
    assertUserOwnedResource(existing, userId, CATEGORY_LABELS);

    const { data, error } = await this.supabase
      .from('life_categories')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    throwOnSupabaseError(error, '分类操作失败:', {
      notFoundMessage: CATEGORY_LABELS.notFound,
      notFoundAs: 'bad_request',
    });
    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    // 不能删除系统预设（user_id 为 NULL），且只能删除自己的分类
    const { data: existing } = await this.supabase
      .from('life_categories')
      .select('user_id')
      .eq('id', id)
      .single();

    assertUserOwnedResource(existing, userId, CATEGORY_DELETE_LABELS);

    const { error } = await this.supabase
      .from('life_categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    throwOnSupabaseError(error, '分类操作失败:');
    this.eventsGateway.emitCategoryDeleted(userId, id);
    return { code: 200, data: null, message: '删除成功' };
  }
}
