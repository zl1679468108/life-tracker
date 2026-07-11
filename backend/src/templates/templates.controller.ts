import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import { CreateTemplateDto, UpdateTemplateDto, UseTemplateDto } from './dto/templates.dto';

@Controller('api/templates')
@UseGuards(SupabaseAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll(
    @CurrentUser() user: SupabaseUser,
    @Query('type') type?: 'item' | 'todo',
  ) {
    return this.templatesService.findAll(user.id, type);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.templatesService.findOne(id, user.id);
  }

  @Post()
  async create(@Body() body: CreateTemplateDto, @CurrentUser() user: SupabaseUser) {
    return this.templatesService.create(user.id, body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTemplateDto, @CurrentUser() user: SupabaseUser) {
    return this.templatesService.update(id, user.id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.templatesService.remove(id, user.id);
  }

  @Post(':id/use')
  async useTemplate(
    @Param('id') id: string,
    @Body() body: UseTemplateDto,
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.templatesService.useTemplate(id, user.id, body?.overrides);
  }
}
