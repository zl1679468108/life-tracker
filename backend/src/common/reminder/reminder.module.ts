import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { EventsModule } from '../events/events.module';
import { ReminderScheduler } from './reminder.scheduler';

@Module({
  imports: [SupabaseModule, EventsModule],
  providers: [ReminderScheduler],
})
export class ReminderModule {}
