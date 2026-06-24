import { Injectable, Logger, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../supabase/supabase.module';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class ReminderScheduler implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger('ReminderScheduler');
  private intervalId: NodeJS.Timeout | null = null;
  // 记录已发送的提醒，避免重复发送
  private sentReminders = new Set<string>();

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly supabase: SupabaseClient,
    private readonly eventsGateway: EventsGateway,
  ) {}

  onModuleInit() {
    // 每分钟检查一次
    this.intervalId = setInterval(() => this.checkReminders(), 60_000);
    this.logger.log('Reminder scheduler started (checking every 60s)');
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async checkReminders() {
    this.logger.debug('Checking reminders...');
    const now = new Date().toISOString();

    const { data: todos, error } = await this.supabase
      .from('life_todos')
      .select('*')
      .not('reminder_date', 'is', null)
      .lte('reminder_date', now)
      .eq('completed', false);

    if (error) {
      this.logger.error('Failed to fetch reminders:', error);
      return;
    }

    if (!todos || todos.length === 0) return;

    for (const todo of todos) {
      const reminderKey = `${todo.id}-${todo.reminder_date}`;
      if (this.sentReminders.has(reminderKey)) continue;

      this.sentReminders.add(reminderKey);
      this.eventsGateway.emitReminderFired(todo.user_id, todo);
      this.logger.log(`Reminder fired for todo: ${todo.title}`);
    }
  }
}
