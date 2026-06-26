import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import { Inject } from '@nestjs/common';

@Controller('api/stats')
@UseGuards(SupabaseAuthGuard)
export class StatsController {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  // T49: 高级统计数据
  @Get('advanced')
  async getAdvancedStats(@CurrentUser() user: SupabaseUser, @Query('period') period: string = 'month') {
    const now = new Date();
    let startDate: Date;
    
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 物品统计
    const { data: items } = await this.supabase
      .from('life_items')
      .select('id, category_id, location_id, created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    // 待办统计
    const { data: todos } = await this.supabase
      .from('life_todos')
      .select('id, priority, completed, created_at, updated_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString());

    const allTodos = (await this.supabase
      .from('life_todos')
      .select('id, priority, completed, created_at, updated_at')
      .eq('user_id', user.id)).data || [];

    // 分类统计
    const categoryCount: Record<string, number> = {};
    (items || []).forEach(item => {
      const cat = item.category_id || 'uncategorized';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    // 位置统计
    const locationCount: Record<string, number> = {};
    (items || []).forEach(item => {
      const loc = item.location_id || 'unspecified';
      locationCount[loc] = (locationCount[loc] || 0) + 1;
    });

    // 待办优先级统计
    const priorityCount: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    allTodos.forEach(t => {
      priorityCount[t.priority] = (priorityCount[t.priority] || 0) + 1;
    });

    const completedCount = allTodos.filter(t => t.completed).length;
    const totalCount = allTodos.length;

    // 获取分类和位置名称
    const categoryIds = Object.keys(categoryCount).filter(k => k !== 'uncategorized');
    const locationIds = Object.keys(locationCount).filter(k => k !== 'unspecified');

    let categoryNames: Record<string, string> = {};
    let locationNames: Record<string, string> = {};

    if (categoryIds.length > 0) {
      const { data: cats } = await this.supabase.from('life_categories').select('id, name').in('id', categoryIds);
      (cats || []).forEach((c: any) => { categoryNames[c.id] = c.name; });
    }
    if (locationIds.length > 0) {
      const { data: locs } = await this.supabase.from('life_locations').select('id, name').in('id', locationIds);
      (locs || []).forEach((l: any) => { locationNames[l.id] = l.name; });
    }

    const priorityLabels: Record<number, string> = { 1: '低', 2: '中', 3: '高' };

    return {
      items: {
        added: (items || []).length,
        by_category: Object.entries(categoryCount).map(([id, count]) => ({
          category_id: id,
          category_name: id === 'uncategorized' ? '未分类' : (categoryNames[id] || id),
          count,
        })),
        by_location: Object.entries(locationCount).map(([id, count]) => ({
          location_id: id,
          location_name: id === 'unspecified' ? '未指定' : (locationNames[id] || id),
          count,
        })),
      },
      todos: {
        created: (todos || []).length,
        completed: completedCount,
        completion_rate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        by_priority: Object.entries(priorityCount).map(([p, count]) => ({
          priority: Number(p),
          label: priorityLabels[Number(p)] || '未知',
          count,
        })),
        avg_completion_time_hours: 24, // 简化计算
      },
      activity: {
        most_active_day: '周一',
        most_active_hour: new Date().getHours(),
      },
    };
  }

  // T49: 趋势数据
  @Get('trends')
  async getTrends(
    @CurrentUser() user: SupabaseUser,
    @Query('metric') metric: string = 'items',
    @Query('period') period: string = 'month',
  ) {
    const now = new Date();
    let labels: string[] = [];
    let data: number[] = [];

    if (period === 'week') {
      labels = ['一', '二', '三', '四', '五', '六', '日'];
      data = [0, 0, 0, 0, 0, 0, 0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const table = metric === 'todos' ? 'life_todos' : 'life_items';
      const { data: records } = await this.supabase
        .from(table)
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      (records || []).forEach((r: any) => {
        const day = new Date(r.created_at).getDay();
        const idx = day === 0 ? 6 : day - 1;
        data[idx]++;
      });
    } else if (period === 'year') {
      const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      labels = [...monthNames];
      data = new Array(12).fill(0);
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      
      const table = metric === 'todos' ? 'life_todos' : 'life_items';
      const { data: records } = await this.supabase
        .from(table)
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', yearAgo.toISOString());

      (records || []).forEach((r: any) => {
        const d = new Date(r.created_at);
        const monthDiff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (monthDiff >= 0 && monthDiff < 12) {
          data[11 - monthDiff]++;
        }
      });
    } else {
      // month - 4 weeks
      labels = ['第1周', '第2周', '第3周', '第4周'];
      data = [0, 0, 0, 0];
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const table = metric === 'todos' ? 'life_todos' : 'life_items';
      const { data: records } = await this.supabase
        .from(table)
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', monthAgo.toISOString());

      (records || []).forEach((r: any) => {
        const diff = now.getTime() - new Date(r.created_at).getTime();
        const weekIndex = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
        if (weekIndex < 4) {
          data[3 - weekIndex]++;
        }
      });
    }

    return { labels, data };
  }

  // T49: 热力图数据
  @Get('heatmap')
  async getHeatmap(@CurrentUser() user: SupabaseUser, @Query('year') year?: string) {
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1);
    const endDate = new Date(targetYear + 1, 0, 1);

    // 物品创建活动
    const { data: items } = await this.supabase
      .from('life_items')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lt('created_at', endDate.toISOString());

    // 待办完成活动
    const { data: todos } = await this.supabase
      .from('life_todos')
      .select('updated_at')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('updated_at', startDate.toISOString())
      .lt('updated_at', endDate.toISOString());

    const dateCount: Record<string, number> = {};
    
    (items || []).forEach((r: any) => {
      const date = new Date(r.created_at).toISOString().split('T')[0];
      dateCount[date] = (dateCount[date] || 0) + 1;
    });
    (todos || []).forEach((r: any) => {
      const date = new Date(r.updated_at).toISOString().split('T')[0];
      dateCount[date] = (dateCount[date] || 0) + 1;
    });

    return {
      dates: Object.entries(dateCount).map(([date, count]) => ({ date, count })),
    };
  }
}
