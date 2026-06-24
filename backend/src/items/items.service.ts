import { Injectable, Inject, InternalServerErrorException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { convertTimesToBeijing } from '../common/utils/time';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .from('life_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map(convertTimesToBeijing);
  }

  async findOne(id: string) {
    const { data, error } = await this.supabase
      .from('life_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('物品不存在');
      throw new InternalServerErrorException(error.message);
    }
    return convertTimesToBeijing(data);
  }

  async create(item: any) {
    const { data, error } = await this.supabase
      .from('life_items')
      .insert(item)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    this.eventsGateway.emitItemCreated(item.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('life_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('物品不存在');
      throw new InternalServerErrorException(error.message);
    }
    if (data) this.eventsGateway.emitItemUpdated(data.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async remove(id: string) {
    // 先查出物品的完整信息，包括图片和 user_id
    const { data: existing } = await this.supabase
      .from('life_items')
      .select('user_id, images')
      .eq('id', id)
      .single();

    // 删除 Storage 中的图片
    if (existing?.images && existing.images.length > 0) {
      const imagePaths = existing.images.map((imageUrl: string) => {
        // 从 URL 中提取路径：{user_id}/{timestamp}_{filename}
        const urlParts = imageUrl.split('/storage/v1/object/public/items-images/');
        if (urlParts.length > 1) {
          return urlParts[1];
        }
        return null;
      }).filter((path: string | null) => path !== null);

      if (imagePaths.length > 0) {
        await this.supabase.storage
          .from('items-images')
          .remove(imagePaths);
      }
    }

    const { error } = await this.supabase
      .from('life_items')
      .delete()
      .eq('id', id);

    if (error) throw new InternalServerErrorException(error.message);
    if (existing) this.eventsGateway.emitItemDeleted(existing.user_id, id);
    return { success: true };
  }
}
