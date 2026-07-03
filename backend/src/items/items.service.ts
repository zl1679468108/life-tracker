import { Injectable, Inject, InternalServerErrorException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { convertTimesToBeijing } from '../common/utils/time';
import { SharesService } from '../shares/shares.service';

const OPTIONAL_ITEM_COLUMNS = new Set([
  'barcode',
  'expiry_date',
  'reminder_enabled',
  'reminder_days_before',
  'purchase_price',
  'purchase_date',
  'current_value',
  'currency',
  'depreciation_rate',
  'ai_suggestions',
  'ai_confidence',
  'is_borrowed',
  'borrowed_by',
]);

@Injectable()
export class ItemsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
    private readonly sharesService: SharesService,
  ) {}

  private withAccessMeta(item: any, userId: string, permission: 'owner' | 'view' | 'edit') {
    return {
      ...convertTimesToBeijing(item),
      is_shared_resource: item.user_id !== userId,
      share_permission: permission,
      can_edit: permission === 'owner' || permission === 'edit',
    };
  }

  private async getAccessibleItem(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('物品不存在');
      throw new InternalServerErrorException(error.message);
    }

    if (data.user_id === userId) {
      return { item: data, permission: 'owner' as const };
    }

    const access = await this.sharesService.checkPermission(userId, 'item', id);
    if (!access.hasAccess || !access.permission) {
      throw new ForbiddenException('无权访问该物品');
    }

    return { item: data, permission: access.permission };
  }

  private async recordValueChangeIfNeeded(itemId: string, item: any, updates: any, reason: string) {
    if (updates.current_value === undefined) return;
    const previousValue = item.current_value == null ? null : Number(item.current_value);
    const nextValue = updates.current_value == null ? null : Number(updates.current_value);
    if (nextValue == null || Number.isNaN(nextValue) || previousValue === nextValue) return;

    const { error } = await this.supabase
      .from('life_value_history')
      .insert({
        item_id: itemId,
        user_id: item.user_id,
        value: nextValue,
        reason,
      });

    if (error) throw new InternalServerErrorException(error.message);
  }

  private getMissingColumn(error: { message?: string } | null | undefined, table: string) {
    const message = error?.message || '';
    const match = message.match(new RegExp(`Could not find the '([^']+)' column of '${table}' in the schema cache`));
    return match?.[1] || null;
  }

  private stripUnsupportedOptionalColumn(payload: Record<string, any>, error: { message?: string } | null | undefined, table: string) {
    const missingColumn = this.getMissingColumn(error, table);
    if (!missingColumn || !OPTIONAL_ITEM_COLUMNS.has(missingColumn) || !(missingColumn in payload)) {
      return null;
    }

    const nextPayload = { ...payload };
    delete nextPayload[missingColumn];
    return nextPayload;
  }

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .from('life_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    const ownItems = (data || []).map((item) => this.withAccessMeta(item, userId, 'owner'));

    const { data: shares, error: sharesError } = await this.supabase
      .from('life_shares')
      .select('resource_id, permission')
      .eq('shared_with_id', userId)
      .eq('resource_type', 'item');

    if (sharesError) throw new InternalServerErrorException(sharesError.message);

    const resourceIds = Array.from(new Set((shares || []).map((share) => share.resource_id)));
    if (resourceIds.length === 0) return ownItems;

    const { data: sharedItems, error: sharedError } = await this.supabase
      .from('life_items')
      .select('*')
      .in('id', resourceIds);

    if (sharedError) throw new InternalServerErrorException(sharedError.message);

    const permissionById = new Map((shares || []).map((share) => [share.resource_id, share.permission as 'view' | 'edit']));
    const visibleSharedItems = (sharedItems || []).map((item) => this.withAccessMeta(item, userId, permissionById.get(item.id) || 'view'));
    return [...ownItems, ...visibleSharedItems];
  }

  async findOne(id: string, userId: string) {
    const { item, permission } = await this.getAccessibleItem(id, userId);
    return this.withAccessMeta(item, userId, permission);
  }

  async create(item: any) {
    let { data, error } = await this.supabase
      .from('life_items')
      .insert(item)
      .select()
      .single();

    if (error) {
      const fallbackItem = this.stripUnsupportedOptionalColumn(item, error, 'life_items');
      if (fallbackItem) {
        ({ data, error } = await this.supabase
          .from('life_items')
          .insert(fallbackItem)
          .select()
          .single());
      }
    }

    if (error) throw new InternalServerErrorException(error.message);
    this.eventsGateway.emitItemCreated(item.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any, userId: string) {
    const { item, permission } = await this.getAccessibleItem(id, userId);
    if (permission === 'view') {
      throw new ForbiddenException('只有查看权限，不能编辑该物品');
    }

    await this.recordValueChangeIfNeeded(id, item, updates, '物品表单更新估值');

    let { data, error } = await this.supabase
      .from('life_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const fallbackUpdates = this.stripUnsupportedOptionalColumn(updates, error, 'life_items');
      if (fallbackUpdates) {
        ({ data, error } = await this.supabase
          .from('life_items')
          .update({ ...fallbackUpdates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single());
      }
    }

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('物品不存在');
      throw new InternalServerErrorException(error.message);
    }
    if (data) this.eventsGateway.emitItemUpdated(data.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    const { item } = await this.getAccessibleItem(id, userId);
    if (item.user_id !== userId) {
      throw new ForbiddenException('只有所有者可以删除该物品');
    }

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

  /**
   * 查询即将过期的物品
   * @param userId 用户 ID
   * @param days 提前天数（默认 7 天）
   */
  async findExpiring(userId: string, days: number = 7) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await this.supabase
      .from('life_items')
      .select('*')
      .eq('user_id', userId)
      .eq('reminder_enabled', true)
      .not('expiry_date', 'is', null)
      .lte('expiry_date', futureDate.toISOString())
      .order('expiry_date', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map(convertTimesToBeijing);
  }

  // T47: 价值追踪
  async updateValue(id: string, userId: string, valueData: any) {
    const { item } = await this.getAccessibleItem(id, userId);
    if (item.user_id !== userId) {
      throw new ForbiddenException('只有所有者可以更新资产价值');
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (valueData.current_value !== undefined) updates.current_value = valueData.current_value;
    if (valueData.purchase_price !== undefined) updates.purchase_price = valueData.purchase_price;
    if (valueData.purchase_date !== undefined) updates.purchase_date = new Date(valueData.purchase_date).toISOString();
    if (valueData.currency !== undefined) updates.currency = valueData.currency || 'CNY';
    if (valueData.depreciation_rate !== undefined) updates.depreciation_rate = valueData.depreciation_rate;

    await this.recordValueChangeIfNeeded(id, item, updates, valueData.reason || '资产页更新估值');

    const { data, error } = await this.supabase
      .from('life_items')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return convertTimesToBeijing(data);
  }

  async getValueHistory(itemId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_value_history')
      .select('*')
      .eq('item_id', itemId)
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false });

    if (error) throw new InternalServerErrorException(error.message);
    return (data || []).map(convertTimesToBeijing);
  }

  async recordValueHistory(itemId: string, userId: string, record: { value: number; reason?: string }) {
    const { data, error } = await this.supabase
      .from('life_value_history')
      .insert({ item_id: itemId, user_id: userId, value: record.value, reason: record.reason })
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return convertTimesToBeijing(data);
  }

  async getTotalValue(userId: string) {
    const { data: items, error } = await this.supabase
      .from('life_items')
      .select('id, name, purchase_price, current_value, currency, category_id')
      .eq('user_id', userId);

    if (error) throw new InternalServerErrorException(error.message);

    let totalPurchase = 0;
    let totalCurrent = 0;
    const categoryMap: Record<string, number> = {};
    const currency = (items || []).find((item) => item.currency)?.currency || 'CNY';

    for (const item of (items || [])) {
      const pp = Number(item.purchase_price) || 0;
      const cv = Number(item.current_value) || pp;
      totalPurchase += pp;
      totalCurrent += cv;
      if (item.category_id) {
        categoryMap[item.category_id] = (categoryMap[item.category_id] || 0) + cv;
      }
    }

    // 获取分类名称
    const categoryIds = Object.keys(categoryMap);
    let categoryNames: Record<string, string> = {};
    if (categoryIds.length > 0) {
      const { data: cats } = await this.supabase
        .from('life_categories')
        .select('id, name')
        .in('id', categoryIds);
      (cats || []).forEach((c: any) => { categoryNames[c.id] = c.name; });
    }

    const { data: history, error: historyError } = await this.supabase
      .from('life_value_history')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false })
      .limit(5);

    if (historyError) throw new InternalServerErrorException(historyError.message);

    const itemNameById = new Map((items || []).map((item) => [item.id, item.name || '未命名物品']));
    const recentChanges = await Promise.all((history || []).map(async (record) => {
      const { data: previous } = await this.supabase
        .from('life_value_history')
        .select('value')
        .eq('item_id', record.item_id)
        .lt('recorded_at', record.recorded_at)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const previousValue = previous?.value == null ? null : Number(previous.value);
      const value = Number(record.value);
      return {
        item_id: record.item_id,
        item_name: itemNameById.get(record.item_id) || '未知物品',
        value,
        previous_value: previousValue,
        delta: previousValue == null ? null : value - previousValue,
        reason: record.reason || null,
        recorded_at: convertTimesToBeijing(record).recorded_at,
      };
    }));

    return {
      total_purchase_price: totalPurchase,
      total_current_value: totalCurrent,
      total_depreciation: Math.max(0, totalPurchase - totalCurrent),
      currency,
      recent_changes: recentChanges,
      by_category: Object.entries(categoryMap).map(([id, value]) => ({
        category_id: id,
        category_name: categoryNames[id] || '未分类',
        total_value: value,
      })),
    };
  }
}
