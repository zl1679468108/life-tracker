import { BadRequestException, Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing, toUtcIso } from '../common/utils/time';

@Injectable()
export class BorrowingsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  async findAll(userId: string) {
    const { data, error } = await this.supabase
      .from('life_borrowings')
      .select('*, life_items(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('借用记录操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return (data || []).map((b: any) => ({
      ...convertTimesToBeijing(b),
      item_name: b.life_items?.name,
    }));
  }

  async findActive(userId: string) {
    const { data, error } = await this.supabase
      .from('life_borrowings')
      .select('*, life_items(name)')
      .eq('user_id', userId)
      .in('status', ['borrowed', 'overdue'])
      .order('expected_return_date', { ascending: true });

    if (error) {
      console.error('借用记录操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return (data || []).map((b: any) => ({
      ...convertTimesToBeijing(b),
      item_name: b.life_items?.name,
    }));
  }

  async findByItemId(itemId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_borrowings')
      .select('*')
      .eq('item_id', itemId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('借用记录操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return (data || []).map(convertTimesToBeijing);
  }

  async findOne(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from('life_borrowings')
      .select('*, life_items(name)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('借用记录不存在');
      console.error('借用记录操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }
    return {
      ...convertTimesToBeijing(data),
      item_name: (data as any).life_items?.name,
    };
  }

  async create(borrowing: any) {
    // 入库前将北京时间字段转为 UTC
    const normalizedBorrowing = { ...borrowing };
    if (normalizedBorrowing.borrow_date) normalizedBorrowing.borrow_date = toUtcIso(normalizedBorrowing.borrow_date);
    if (normalizedBorrowing.expected_return_date) normalizedBorrowing.expected_return_date = toUtcIso(normalizedBorrowing.expected_return_date);

    const { data: activeBorrowing, error: activeError } = await this.supabase
      .from('life_borrowings')
      .select('id')
      .eq('item_id', borrowing.item_id)
      .eq('user_id', borrowing.user_id)
      .in('status', ['borrowed', 'overdue'])
      .limit(1)
      .maybeSingle();

    if (activeError) { console.error('查询活跃借用记录失败:', activeError); throw new InternalServerErrorException('操作失败，请稍后重试'); }
    if (activeBorrowing) throw new BadRequestException('该物品已有未归还的借用记录');

    const { data, error } = await this.supabase
      .from('life_borrowings')
      .insert(normalizedBorrowing)
      .select()
      .single();

    if (error) {
      console.error('借用记录操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    // 更新物品的借用状态（与借用记录插入构成逻辑事务：失败则回滚借用记录）
    const { error: itemUpdateError } = await this.supabase
      .from('life_items')
      .update({ is_borrowed: true, borrowed_by: normalizedBorrowing.borrower_name, updated_at: new Date().toISOString() })
      .eq('id', normalizedBorrowing.item_id);

    if (itemUpdateError) {
      // 补偿：删除已插入的借用记录，避免借用记录存在但物品状态未更新
      await this.supabase
        .from('life_borrowings')
        .delete()
        .eq('id', data.id);
      throw new InternalServerErrorException('更新物品借用状态失败，借用记录已回滚');
    }

    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any, userId: string) {
    // 如果是归还操作，先更新借用记录，再更新物品状态（避免借用未更新但物品已清除借用状态）
    if (updates.status === 'returned') {
      updates.actual_return_date = updates.actual_return_date || new Date().toISOString();
    }

    const { data, error } = await this.supabase
      .from('life_borrowings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundException('借用记录不存在');
      console.error('借用记录操作失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    // 归还操作：借用记录更新成功后，同步物品状态
    if (updates.status === 'returned' && data) {
      // 检查是否还有其他未归还的借用
      const { data: otherBorrowings } = await this.supabase
        .from('life_borrowings')
        .select('id')
        .eq('item_id', data.item_id)
        .in('status', ['borrowed', 'overdue'])
        .neq('id', id);

      // 如果没有其他未归还的借用，清除物品的借用状态
      if (!otherBorrowings || otherBorrowings.length === 0) {
        const { error: itemClearError } = await this.supabase
          .from('life_items')
          .update({ is_borrowed: false, borrowed_by: null, updated_at: new Date().toISOString() })
          .eq('id', data.item_id);
        if (itemClearError) {
          console.error('清除物品借用状态失败:', itemClearError.message);
        }
      }
    }

    return convertTimesToBeijing(data);
  }

  async remove(id: string, userId: string) {
    const { data: existing } = await this.supabase
      .from('life_borrowings')
      .select('item_id, status')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    const { error } = await this.supabase
      .from('life_borrowings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('借用记录操作失败:', error);
      throw new InternalServerErrorException('操作失败，请稍后重试');
    }

    // 如果删除的是未归还的记录，检查并更新物品状态
    if (existing && ['borrowed', 'overdue'].includes(existing.status)) {
      const { data: otherBorrowings } = await this.supabase
        .from('life_borrowings')
        .select('id')
        .eq('item_id', existing.item_id)
        .in('status', ['borrowed', 'overdue']);

      if (!otherBorrowings || otherBorrowings.length === 0) {
        const { error: itemClearError } = await this.supabase
          .from('life_items')
          .update({ is_borrowed: false, borrowed_by: null, updated_at: new Date().toISOString() })
          .eq('id', existing.item_id);
        if (itemClearError) {
          console.error('清除物品借用状态失败:', itemClearError.message);
        }
      }
    }

    return { code: 200, data: null, message: '删除成功' };
  }
}
