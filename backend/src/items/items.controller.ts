import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ItemsService } from './items.service';
import { BorrowingsService } from '../borrowings/borrowings.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import {
  CreateItemDto,
  UpdateItemDto,
  UpdateValueDto,
  RecordValueHistoryDto,
} from './dto/items.dto';

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

  // 嵌套路由必须在 :id 之前注册，避免被参数路由抢先匹配
  @Get(':id/borrowings')
  async findBorrowings(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.findByItemId(id, user.id);
  }

  @Get(':id/value-history')
  async getValueHistory(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.getValueHistory(id, user.id);
  }

  @Post(':id/value-history')
  async recordValueHistory(@Param('id') id: string, @Body() body: RecordValueHistoryDto, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.recordValueHistory(id, user.id, body);
  }

  @Put(':id/value')
  async updateValue(@Param('id') id: string, @Body() body: UpdateValueDto, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.updateValue(id, user.id, body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.findOne(id, user.id);
  }

  @Post()
  async create(@Body() body: CreateItemDto, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.create({ ...body, user_id: user.id });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateItemDto, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.update(id, body, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.itemsService.remove(id, user.id);
  }
}
