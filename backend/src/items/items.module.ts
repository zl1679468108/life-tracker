import { Module } from '@nestjs/common';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';
import { BorrowingsModule } from '../borrowings/borrowings.module';

@Module({
  imports: [BorrowingsModule],
  controllers: [ItemsController],
  providers: [ItemsService],
})
export class ItemsModule {}
