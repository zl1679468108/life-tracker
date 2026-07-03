import { Module } from '@nestjs/common';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { SharesModule } from '../shares/shares.module';

@Module({
  imports: [SharesModule],
  controllers: [TodosController],
  providers: [TodosService],
})
export class TodosModule {}
