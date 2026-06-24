import { Injectable, Inject, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { convertTimesToBeijing } from '../common/utils/time';

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

    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map(convertTimesToBeijing);
  }

  async create(name: string, type: string, icon: string | undefined, userId: string) {
    const { data, error } = await this.supabase
      .from('life_categories')
      .insert({ name, type, icon, user_id: userId })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    this.eventsGateway.emitCategoryCreated(userId, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any) {
    // 不能更新系统预设（user_id 为 NULL）
    const { data: existing, error: findError } = await this.supabase
      .from('life_categories')
      .select('user_id')
      .eq('id', id)
      .single();

    if (findError) {
      if (findError.code === 'PGRST116') throw new BadRequestException('分类不存在');
      throw new InternalServerErrorException(findError.message);
    }
    if (!existing.user_id) {
      throw new BadRequestException('不能修改系统预设分类');
    }

    const { data, error } = await this.supabase
      .from('life_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new BadRequestException('分类不存在');
      throw new InternalServerErrorException(error.message);
    }
    return convertTimesToBeijing(data);
  }

  async remove(id: string) {
    // 不能删除系统预设（user_id 为 NULL）
    // 先查出 user_id 用于广播
    const { data: existing } = await this.supabase
      .from('life_categories')
      .select('user_id')
      .eq('id', id)
      .single();

    const { error } = await this.supabase
      .from('life_categories')
      .delete()
      .eq('id', id)
      .not('user_id', 'is', null);

    if (error) throw new InternalServerErrorException(error.message);
    if (existing && existing.user_id) this.eventsGateway.emitCategoryDeleted(existing.user_id, id);
    return { success: true };
  }
}
