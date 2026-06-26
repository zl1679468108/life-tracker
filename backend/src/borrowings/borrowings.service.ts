import { Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing } from '../common/utils/time';

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

    if (error) throw new InternalServerErrorException(error.message);
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

    if (error) throw new InternalServerErrorException(error.message);
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

    if (error) throw new InternalServerErrorException(error.message);
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
      throw new InternalServerErrorException(error.message);
    }
    return {
      ...convertTimesToBeijing(data),
      item_name: (data as any).life_items?.name,
    };
  }

  async create(borrowing: any) {
    const { data, error } = await this.supabase
      .from('life_borrowings')
      .insert(borrowing)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);

    // 更新物品的借用状态
    await this.supabase
      .from('life_items')
      .update({ is_borrowed: true, borrowed_by: borrowing.borrower_name, updated_at: new Date().toISOString() })
      .eq('id', borrowing.item_id);

    return convertTimesToBeijing(data);
  }

  async update(id: string, updates: any, userId: string) {
    // 如果是归还操作
    if (updates.status === 'returned') {
      updates.actual_return_date = updates.actual_return_date || new Date().toISOString();
      
      // 获取当前借用记录以获取 item_id
      const { data: current } = await this.supabase
        .from('life_borrowings')
        .select('item_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (current) {
        // 检查是否还有其他未归还的借用
        const { data: otherBorrowings } = await this.supabase
          .from('life_borrowings')
          .select('id')
          .eq('item_id', current.item_id)
          .eq('user_id', userId)
          .in('status', ['borrowed', 'overdue'])
          .neq('id', id);
        
        // 如果没有其他未归还的借用，清除物品的借用状态
        if (!otherBorrowings || otherBorrowings.length === 0) {
          await this.supabase
            .from('life_items')
            .update({ is_borrowed: false, borrowed_by: null, updated_at: new Date().toISOString() })
            .eq('id', current.item_id);
        }
      }
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
      throw new InternalServerErrorException(error.message);
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

    if (error) throw new InternalServerErrorException(error.message);

    // 如果删除的是未归还的记录，检查并更新物品状态
    if (existing && ['borrowed', 'overdue'].includes(existing.status)) {
      const { data: otherBorrowings } = await this.supabase
        .from('life_borrowings')
        .select('id')
        .eq('item_id', existing.item_id)
        .in('status', ['borrowed', 'overdue']);

      if (!otherBorrowings || otherBorrowings.length === 0) {
        await this.supabase
          .from('life_items')
          .update({ is_borrowed: false, borrowed_by: null, updated_at: new Date().toISOString() })
          .eq('id', existing.item_id);
      }
    }

    return { success: true };
  }
}
