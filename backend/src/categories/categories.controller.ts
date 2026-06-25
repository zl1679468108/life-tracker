import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/categories')
@UseGuards(SupabaseAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@CurrentUser() user: SupabaseUser) {
    return this.categoriesService.findAll(user.id);
  }

  @Post()
  async create(@Body() body: { name: string; type: string; icon?: string; color?: string; parent_id?: string }, @CurrentUser() user: SupabaseUser) {
    return this.categoriesService.create(body.name, body.type, body.icon, body.color, body.parent_id, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; icon?: string; color?: string; parent_id?: string }) {
    return this.categoriesService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
