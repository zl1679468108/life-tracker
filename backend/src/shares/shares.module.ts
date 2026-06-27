import { Module } from '@nestjs/common';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { SupabaseModule } from '../common/supabase/supabase.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [SupabaseModule, MessagesModule],
  controllers: [SharesController],
  providers: [SharesService],
  exports: [SharesService],
})
export class SharesModule {}
