import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { BorrowingsService } from './borrowings.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import { CreateBorrowingDto, UpdateBorrowingDto } from './dto/borrowings.dto';

@Controller('api/borrowings')
@UseGuards(SupabaseAuthGuard)
export class BorrowingsController {
  constructor(private readonly borrowingsService: BorrowingsService) {}

  @Get()
  async findAll(@CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.findAll(user.id);
  }

  @Get('active')
  async findActive(@CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.findActive(user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.findOne(id, user.id);
  }

  @Post()
  async create(@Body() body: CreateBorrowingDto, @CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.create({ ...body, user_id: user.id });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateBorrowingDto, @CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.update(id, body, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.borrowingsService.remove(id, user.id);
  }
}
