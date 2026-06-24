import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ItemsService } from './items.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/items')
@UseGuards(SupabaseAuthGuard)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async findAll(@CurrentUser() user: SupabaseUser) {
    return this.itemsService.findAll(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.itemsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.create({ ...body, user_id: user.id });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.itemsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.itemsService.remove(id);
  }
}
