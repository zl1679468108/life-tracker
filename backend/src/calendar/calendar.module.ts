import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [CalendarController],
})
export class CalendarModule {}
