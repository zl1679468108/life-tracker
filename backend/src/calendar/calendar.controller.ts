import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/calendar')
@UseGuards(SupabaseAuthGuard)
export class CalendarController {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // T50: 查询某月日历数据
  @Get()
  async getMonthData(
    @CurrentUser() user: SupabaseUser,
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    const y = parseInt(year);
    const m = parseInt(month) - 1; // 0-indexed
    const startDate = new Date(y, m, 1);
    const endDate = new Date(y, m + 1, 0, 23, 59, 59);

    // 查询该月待办
    const { data: todos } = await this.supabase
      .from('life_todos')
      .select('id, title, priority, completed, due_date')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', startDate.toISOString())
      .lte('due_date', endDate.toISOString());

    // 查询该月过期物品
    const { data: expiringItems } = await this.supabase
      .from('life_items')
      .select('id, name, expiry_date')
      .eq('user_id', user.id)
      .eq('reminder_enabled', true)
      .not('expiry_date', 'is', null)
      .gte('expiry_date', startDate.toISOString())
      .lte('expiry_date', endDate.toISOString());

    // 查询该月借用归还
    const { data: borrowings } = await this.supabase
      .from('life_borrowings')
      .select('id, item_id, borrower_name, expected_return_date, status')
      .eq('user_id', user.id)
      .not('expected_return_date', 'is', null)
      .gte('expected_return_date', startDate.toISOString())
      .lte('expected_return_date', endDate.toISOString());

    // 获取物品名称（用于借用记录）
    const itemIds = [...new Set((borrowings || []).map(b => b.item_id))];
    let itemNames: Record<string, string> = {};
    if (itemIds.length > 0) {
      const { data: items } = await this.supabase
        .from('life_items')
        .select('id, name')
        .in('id', itemIds);
      (items || []).forEach((i: any) => { itemNames[i.id] = i.name; });
    }

    // 按日期分组
    const dayMap: Record<string, any> = {};
    
    // 填充待办
    (todos || []).forEach((todo: any) => {
      if (!todo.due_date) return;
      const date = new Date(todo.due_date).toISOString().split('T')[0];
      if (!dayMap[date]) dayMap[date] = { date, todos: [], events: [] };
      dayMap[date].todos.push({
        id: todo.id,
        title: todo.title,
        priority: todo.priority,
        completed: todo.completed,
      });
    });

    // 填充过期事件
    (expiringItems || []).forEach((item: any) => {
      if (!item.expiry_date) return;
      const date = new Date(item.expiry_date).toISOString().split('T')[0];
      if (!dayMap[date]) dayMap[date] = { date, todos: [], events: [] };
      dayMap[date].events.push({
        type: 'expiry',
        item_id: item.id,
        item_name: item.name,
        description: `${item.name} 过期`,
      });
    });

    // 填充借用归还事件
    (borrowings || []).forEach((b: any) => {
      if (!b.expected_return_date) return;
      const date = new Date(b.expected_return_date).toISOString().split('T')[0];
      if (!dayMap[date]) dayMap[date] = { date, todos: [], events: [] };
      dayMap[date].events.push({
        type: 'borrow_return',
        item_id: b.item_id,
        item_name: itemNames[b.item_id] || '物品',
        description: `${b.borrower_name} 应归还 ${itemNames[b.item_id] || '物品'}`,
      });
    });

    return { days: Object.values(dayMap) };
  }
}
