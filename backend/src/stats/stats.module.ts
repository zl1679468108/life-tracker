import { Module } from '@nestjs/common';
import { StatsController } from './stats.controller';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [StatsController],
})
export class StatsModule {}
