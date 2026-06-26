import { Module } from '@nestjs/common';
import { WidgetsController } from './widgets.controller';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [WidgetsController],
})
export class WidgetsModule {}
