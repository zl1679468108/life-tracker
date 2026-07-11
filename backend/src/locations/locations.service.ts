import { Injectable, Inject, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { convertTimesToBeijing } from '../common/utils/time';

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

    if (error) {
      console.error('位置操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return (data || []).map(convertTimesToBeijing);
  }

  async create(name: string, icon: string | undefined, level: number, parentId: string | undefined, userId: string) {
    const { data, error } = await this.supabase
      .from('life_locations')
      .insert({ name, icon, level, parent_id: parentId, user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('位置操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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

    if (findError) {
      if (findError.code === 'PGRST116') throw new BadRequestException('位置不存在');
      console.error('查询位置失败:', findError); throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (!existing.user_id) {
      throw new BadRequestException('不能修改系统预设位置');
    }
    if (existing.user_id !== userId) {
      throw new BadRequestException('无权修改该位置');
    }

    const { data, error } = await this.supabase
      .from('life_locations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new BadRequestException('位置不存在');
      console.error('位置操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    // 不能删除系统预设（user_id 为 NULL），且只能删除自己的位置
    // 先查出 user_id 用于广播
    const { data: existing } = await this.supabase
      .from('life_locations')
      .select('user_id')
      .eq('id', id)
      .single();

    if (existing && !existing.user_id) {
      throw new BadRequestException('不能删除系统预设位置');
    }
    if (existing && existing.user_id !== userId) {
      throw new BadRequestException('无权删除该位置');
    }

    const { error } = await this.supabase
      .from('life_locations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('位置操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    this.eventsGateway.emitLocationDeleted(userId, id);
    return { code: 200, data: null, message: '删除成功' };
  }
}
