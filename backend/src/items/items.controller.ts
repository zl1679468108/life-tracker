import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ItemsService } from './items.service';
import { BorrowingsService } from '../borrowings/borrowings.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/items')
@UseGuards(SupabaseAuthGuard)
export class ItemsController {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly borrowingsService: BorrowingsService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: SupabaseUser) {
    return this.itemsService.findAll(user.id);
  }

  @Get('expiring')
  async findExpiring(@CurrentUser() user: SupabaseUser, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.itemsService.findExpiring(user.id, daysNum);
  }

  @Get('total-value')
  async getTotalValue(@CurrentUser() user: SupabaseUser) {
    return this.itemsService.getTotalValue(user.id);
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

  @Get(':id/borrowings')
  async findBorrowings(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.findByItemId(id, user.id);
  }

  // T47: 价值追踪端点
  @Put(':id/value')
  async updateValue(@Param('id') id: string, @Body() body: any, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.updateValue(id, user.id, body);
  }

  @Get(':id/value-history')
  async getValueHistory(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.getValueHistory(id, user.id);
  }

  @Post(':id/value-history')
  async recordValueHistory(@Param('id') id: string, @Body() body: any, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.recordValueHistory(id, user.id, body);
  }
}
