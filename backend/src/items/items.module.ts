import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { BorrowingsModule } from '../borrowings/borrowings.module';
import { SharesModule } from '../shares/shares.module';

@Module({
  imports: [BorrowingsModule, SharesModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
