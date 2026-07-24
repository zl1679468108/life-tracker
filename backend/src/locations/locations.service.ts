import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { convertTimesToBeijing } from '../common/utils/time';
import { throwOnSupabaseError } from '../common/utils/supabase-error';
import { assertUserOwnedResource } from '../common/utils/owned-resource';

const LOCATION_LABELS = {
  notFound: '位置不存在',
  systemForbidden: '不能修改系统预设位置',
  forbidden: '无权修改该位置',
};

const LOCATION_DELETE_LABELS = {
  notFound: '位置不存在',
  systemForbidden: '不能删除系统预设位置',
  forbidden: '无权删除该位置',
};

@Injectable()
export class LocationsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(userId: string) {
    // 查询系统预设（user_id 为 NULL）和用户自己的位置
    const { data, error } = await this.supabase
      .from('life_locations')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${userId}`)
      .order('name');

    throwOnSupabaseError(error, '位置操作失败:');
    return (data || []).map(convertTimesToBeijing);
  }

  async create(name: string, icon: string | undefined, level: number, parentId: string | undefined, userId: string) {
    const { data, error } = await this.supabase
      .from('life_locations')
      .insert({ name, icon, level, parent_id: parentId, user_id: userId })
      .select()
      .single();

    throwOnSupabaseError(error, '位置操作失败:');
    this.eventsGateway.emitLocationCreated(userId, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any, userId: string) {
    // 不能更新系统预设（user_id 为 NULL），且只能更新自己的位置
    const { data: existing, error: findError } = await this.supabase
      .from('life_locations')
      .select('user_id')
      .eq('id', id)
      .single();

    throwOnSupabaseError(findError, '查询位置失败:', {
      notFoundMessage: LOCATION_LABELS.notFound,
      notFoundAs: 'bad_request',
    });
    assertUserOwnedResource(existing, userId, LOCATION_LABELS);

    const { data, error } = await this.supabase
      .from('life_locations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    throwOnSupabaseError(error, '位置操作失败:', {
      notFoundMessage: LOCATION_LABELS.notFound,
      notFoundAs: 'bad_request',
    });
    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    // 不能删除系统预设（user_id 为 NULL），且只能删除自己的位置
    const { data: existing } = await this.supabase
      .from('life_locations')
      .select('user_id')
      .eq('id', id)
      .single();

    assertUserOwnedResource(existing, userId, LOCATION_DELETE_LABELS);

    const { error } = await this.supabase
      .from('life_locations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    throwOnSupabaseError(error, '位置操作失败:');
    this.eventsGateway.emitLocationDeleted(userId, id);
    return { code: 200, data: null, message: '删除成功' };
  }
}
