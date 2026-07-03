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
    const now = new Date();
    const nowISO = now.toISOString();

    // 1. 检查待办提醒
    const { data: todos, error } = await this.supabase
      .from('life_todos')
      .select('*')
      .not('reminder_date', 'is', null)
      .lte('reminder_date', nowISO)
      .eq('completed', false);

    if (error) {
      this.logger.error('Failed to fetch todo reminders:', error);
    } else if (todos && todos.length > 0) {
      for (const todo of todos) {
        const reminderKey = `todo-${todo.id}-${todo.reminder_date}`;
        if (this.sentReminders.has(reminderKey)) continue;

        const log = await this.recordReminder({
          reminderKey,
          resourceType: 'todo',
          resourceId: todo.id,
          reminderType: 'due_date',
          userId: todo.user_id,
        });
        if (!log) continue;

        this.sentReminders.add(reminderKey);
        this.eventsGateway.emitReminderFired(todo.user_id, {
          ...todo,
          reminder_log_id: log.id,
          reminder_key: reminderKey,
          reminder_type: 'due_date',
          resource_type: 'todo',
        });
        this.logger.log(`Reminder fired for todo: ${todo.title}`);
      }
    }

    // 2. 检查物品过期提醒
    const { data: expiringItems, error: itemError } = await this.supabase
      .from('life_items')
      .select('*')
      .eq('reminder_enabled', true)
      .not('expiry_date', 'is', null);

    if (itemError) {
      this.logger.error('Failed to fetch expiry reminders:', itemError);
    } else if (expiringItems && expiringItems.length > 0) {
      for (const item of expiringItems) {
        const expiryDate = new Date(item.expiry_date);
        const daysBefore = item.reminder_days_before || 7;
        const reminderDate = new Date(expiryDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

        // 提醒时间已到，且物品还没过期
        if (reminderDate <= now && expiryDate > now) {
          const reminderKey = `item-${item.id}-${item.expiry_date}`;
          if (this.sentReminders.has(reminderKey)) continue;

          const log = await this.recordReminder({
            reminderKey,
            resourceType: 'item',
            resourceId: item.id,
            reminderType: 'expiry',
            userId: item.user_id,
          });
          if (!log) continue;

          this.sentReminders.add(reminderKey);
          this.eventsGateway.emitReminderFired(item.user_id, {
            ...item,
            reminder_log_id: log.id,
            reminder_key: reminderKey,
            resource_type: 'item',
            reminder_type: 'expiry',
            days_remaining: Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
          });
          this.logger.log(`Expiry reminder fired for item: ${item.name}`);
        }
      }
    }

    // 定期清理过期的 sentReminders 记录（每小时清理一次）
    if (now.getMinutes() === 0) {
      this.sentReminders.clear();
    }
  }

  private async recordReminder({
    reminderKey,
    resourceType,
    resourceId,
    reminderType,
    userId,
  }: {
    reminderKey: string;
    resourceType: 'item' | 'todo';
    resourceId: string;
    reminderType: 'expiry' | 'due_date' | 'custom';
    userId: string;
  }) {
    const { data: existing, error: existingError } = await this.supabase
      .from('life_reminder_logs')
      .select('id')
      .eq('reminder_key', reminderKey)
      .maybeSingle();

    if (existingError) {
      this.logger.error(`Failed to check reminder log ${reminderKey}:`, existingError);
      return null;
    }
    if (existing) {
      this.sentReminders.add(reminderKey);
      return null;
    }

    const { data, error } = await this.supabase
      .from('life_reminder_logs')
      .insert({
        reminder_key: reminderKey,
        resource_type: resourceType,
        resource_id: resourceId,
        reminder_type: reminderType,
        user_id: userId,
      })
      .select('id, sent_at')
      .single();

    if (error) {
      if (error.code !== '23505') {
        this.logger.error(`Failed to insert reminder log ${reminderKey}:`, error);
      }
      this.sentReminders.add(reminderKey);
      return null;
    }

    return data;
  }
}
