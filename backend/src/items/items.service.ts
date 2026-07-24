import { Injectable, Inject, InternalServerErrorException, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { EventsGateway } from '../common/events/events.gateway';
import { convertTimesToBeijing, toUtcIso } from '../common/utils/time';
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

/** 列表页按需字段；可选列若线上库缺失会自动剥离并降级重试 */
const ITEM_LIST_FIELDS = [
  'id',
  'name',
  'description',
  'location_id',
  'category_id',
  'images',
  'barcode',
  'expiry_date',
  'reminder_enabled',
  'reminder_days_before',
  'is_borrowed',
  'borrowed_by',
  'purchase_price',
  'purchase_date',
  'current_value',
  'currency',
  'user_id',
  'created_at',
  'updated_at',
];

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
      console.error('物品操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
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

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
  }

  // 运行时探测到线上库缺失的可选列，避免 schema 漂移导致列表 500
  private unsupportedItemColumns = new Set<string>();

  /**
   * 将前端传入的北京时间字段转为 UTC ISO 后入库
   */
  private normalizeTimeFields(payload: Record<string, any>): Record<string, any> {
    const result = { ...payload };
    if (result.expiry_date) result.expiry_date = toUtcIso(result.expiry_date);
    if (result.purchase_date) result.purchase_date = toUtcIso(result.purchase_date);
    return result;
  }

  private getMissingItemColumn(error: { code?: string; message?: string } | null | undefined): string | null {
    const message = error?.message || '';
    const pgMatch = message.match(/column\s+life_items\.(\w+)\s+does not exist/i);
    if (pgMatch?.[1]) return pgMatch[1];
    const cacheMatch = message.match(/Could not find the '([^']+)' column of 'life_items'/i);
    if (cacheMatch?.[1]) return cacheMatch[1];
    return null;
  }

  private noteUnsupportedItemColumn(column: string | null): boolean {
    if (!column || !OPTIONAL_ITEM_COLUMNS.has(column) || this.unsupportedItemColumns.has(column)) {
      return Boolean(column && OPTIONAL_ITEM_COLUMNS.has(column));
    }
    this.unsupportedItemColumns.add(column);
    console.warn(
      `[ItemsService] life_items 缺少可选列 ${column}，已降级跳过。请按 docs/database-init.sql / docs/migrations/2026-07-24-add-life-items-barcode.sql 补齐列后重启服务。`,
    );
    return true;
  }

  private resolveListFields(): string {
    return ITEM_LIST_FIELDS.filter((field) => !this.unsupportedItemColumns.has(field)).join(', ');
  }

  private stripUnsupportedOptionalColumn(payload: Record<string, any>, error: { message?: string } | null | undefined) {
    const missingColumn = this.getMissingItemColumn(error);
    if (!missingColumn || !OPTIONAL_ITEM_COLUMNS.has(missingColumn) || !(missingColumn in payload)) {
      return null;
    }
    this.noteUnsupportedItemColumn(missingColumn);
    const nextPayload = { ...payload };
    delete nextPayload[missingColumn];
    return nextPayload;
  }

  private async selectItemsByFields(
    applyQuery: (query: any) => any,
  ): Promise<any[]> {
    for (let attempt = 0; attempt <= OPTIONAL_ITEM_COLUMNS.size; attempt += 1) {
      const listFields = this.resolveListFields();
      const { data, error } = await applyQuery(
        this.supabase.from('life_items').select(listFields),
      );
      if (!error) return data || [];

      const missingColumn = this.getMissingItemColumn(error);
      if (!this.noteUnsupportedItemColumn(missingColumn)) {
        console.error('物品操作失败:', error);
        throw new InternalServerErrorException('操作失败，请稍后重试');
      }
    }
    throw new InternalServerErrorException('操作失败，请稍后重试');
  }

  async findAll(userId: string) {
    const data = await this.selectItemsByFields((query) =>
      query.eq('user_id', userId).order('created_at', { ascending: false }),
    );
    const ownItems = data.map((item) => this.withAccessMeta(item, userId, 'owner'));

    const { data: shares, error: sharesError } = await this.supabase
      .from('life_shares')
      .select('resource_id, permission')
      .eq('shared_with_id', userId)
      .eq('resource_type', 'item');

    if (sharesError) { console.error('查询共享物品失败:', sharesError); throw new InternalServerErrorException('操作失败，请稍后重试'); }

    const resourceIds = Array.from(new Set((shares || []).map((share) => share.resource_id)));
    if (resourceIds.length === 0) return ownItems;

    const sharedItems = await this.selectItemsByFields((query) => query.in('id', resourceIds));

    const permissionById = new Map((shares || []).map((share) => [share.resource_id, share.permission as 'view' | 'edit']));
    const visibleSharedItems = sharedItems.map((item) => this.withAccessMeta(item, userId, permissionById.get(item.id) || 'view'));
    return [...ownItems, ...visibleSharedItems];
  }

  async findOne(id: string, userId: string) {
    const { item, permission } = await this.getAccessibleItem(id, userId);
    return this.withAccessMeta(item, userId, permission);
  }

  async create(item: any) {
    let normalizedItem = this.normalizeTimeFields(item);
    for (const column of this.unsupportedItemColumns) {
      if (column in normalizedItem) delete normalizedItem[column];
    }

    let { data, error } = await this.supabase
      .from('life_items')
      .insert(normalizedItem)
      .select()
      .single();

    if (error) {
      const fallbackItem = this.stripUnsupportedOptionalColumn(normalizedItem, error);
      if (fallbackItem) {
        normalizedItem = fallbackItem;
        ({ data, error } = await this.supabase
          .from('life_items')
          .insert(normalizedItem)
          .select()
          .single());
      }
    }

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    this.eventsGateway.emitItemCreated(item.user_id, convertTimesToBeijing(data));
    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any, userId: string) {
    const { item, permission } = await this.getAccessibleItem(id, userId);
    if (permission === 'view') {
      throw new ForbiddenException('只有查看权限，不能编辑该物品');
    }

    let normalizedUpdates = this.normalizeTimeFields(updates);
    for (const column of this.unsupportedItemColumns) {
      if (column in normalizedUpdates) delete normalizedUpdates[column];
    }
    await this.recordValueChangeIfNeeded(id, item, normalizedUpdates, '物品表单更新估值');

    let { data, error } = await this.supabase
      .from('life_items')
      .update({ ...normalizedUpdates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      const fallbackUpdates = this.stripUnsupportedOptionalColumn(normalizedUpdates, error);
      if (fallbackUpdates) {
        normalizedUpdates = fallbackUpdates;
        ({ data, error } = await this.supabase
          .from('life_items')
          .update({ ...normalizedUpdates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single());
      }
    }

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('物品不存在');
      console.error('物品操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
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

    // 清理该物品的共享记录（life_shares 对 resource_id 是多态引用，无 FK 级联）
    const { error: sharesCleanupError } = await this.supabase
      .from('life_shares')
      .delete()
      .eq('resource_type', 'item')
      .eq('resource_id', id);
    if (sharesCleanupError) {
      console.error('清理物品共享记录失败:', sharesCleanupError.message);
    }

    const { error } = await this.supabase
      .from('life_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    if (existing) this.eventsGateway.emitItemDeleted(existing.user_id, id);
    return { code: 200, data: null, message: '删除成功' };
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

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
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
    if (valueData.purchase_date !== undefined) updates.purchase_date = toUtcIso(valueData.purchase_date);
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

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return convertTimesToBeijing(data);
  }

  async getValueHistory(itemId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_value_history')
      .select('*')
      .eq('item_id', itemId)
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return (data || []).map(convertTimesToBeijing);
  }

  async recordValueHistory(itemId: string, userId: string, record: { value: number; reason?: string }) {
    const { data, error } = await this.supabase
      .from('life_value_history')
      .insert({ item_id: itemId, user_id: userId, value: record.value, reason: record.reason })
      .select()
      .single();

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return convertTimesToBeijing(data);
  }

  async getTotalValue(userId: string) {
    const { data: items, error } = await this.supabase
      .from('life_items')
      .select('id, name, purchase_price, current_value, currency, category_id')
      .eq('user_id', userId);

    if (error) {
      console.error('物品操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

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

    if (historyError) { console.error('查询价值历史失败:', historyError); throw new InternalServerErrorException('操作失败，请稍后重试'); }

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
