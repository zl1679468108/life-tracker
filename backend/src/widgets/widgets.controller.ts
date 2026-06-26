import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/widgets')
@UseGuards(SupabaseAuthGuard)
export class WidgetsController {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // T53: 小组件待办数据
  @Get('todos')
  async getTodos(@CurrentUser() user: SupabaseUser, @Query('limit') limit: string = '5') {
    const lim = Math.min(parseInt(limit) || 5, 20);
    const { data, error } = await this.supabase
      .from('life_todos')
      .select('id, title, priority, due_date, completed')
      .eq('user_id', user.id)
      .order('completed', { ascending: true })
      .order('priority', { ascending: false })
      .order('due_date', { ascending: true })
      .limit(lim);

    if (error) throw new Error(error.message);
    return { todos: data || [] };
  }

  // T53: 小组件统计数据
  @Get('stats')
  async getStats(@CurrentUser() user: SupabaseUser) {
    const { count: itemsCount } = await this.supabase
      .from('life_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { count: pendingCount } = await this.supabase
      .from('life_todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', false);

    const { count: completedCount } = await this.supabase
      .from('life_todos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('completed', true);

    return {
      items_count: itemsCount || 0,
      todos_pending: pendingCount || 0,
      todos_completed: completedCount || 0,
    };
  }
}
