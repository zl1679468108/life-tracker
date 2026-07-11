import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/categories.dto';

@Controller('api/categories')
@UseGuards(SupabaseAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async findAll(@CurrentUser() user: SupabaseUser) {
    return this.categoriesService.findAll(user.id);
  }

  @Post()
  async create(@Body() body: CreateCategoryDto, @CurrentUser() user: SupabaseUser) {
    return this.categoriesService.create(body.name, body.type, body.icon, body.color, body.parent_id, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCategoryDto, @CurrentUser() user: SupabaseUser) {
    return this.categoriesService.update(id, body, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.categoriesService.remove(id, user.id);
  }
}
