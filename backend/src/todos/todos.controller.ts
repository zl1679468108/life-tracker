import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TodosService } from './todos.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import { CreateTodoDto, UpdateTodoDto, ReorderItemDto } from './dto/todos.dto';
import { ParseArrayPipe } from '@nestjs/common';

@Controller('api/todos')
@UseGuards(SupabaseAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post('reorder')
  async reorder(
    @Body(new ParseArrayPipe({ items: ReorderItemDto })) body: ReorderItemDto[],
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.todosService.reorder(body, user.id);
  }

  @Get()
  async findAll(@CurrentUser() user: SupabaseUser) {
    return this.todosService.findAll(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.todosService.findOne(id, user.id);
  }

  @Post()
  async create(@Body() body: CreateTodoDto, @CurrentUser() user: SupabaseUser) {
    return this.todosService.create({ ...body, user_id: user.id });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTodoDto, @CurrentUser() user: SupabaseUser) {
    return this.todosService.update(id, body, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.todosService.remove(id, user.id);
  }
}
