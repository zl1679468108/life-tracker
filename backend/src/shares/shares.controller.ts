import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { SharesService } from './shares.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import { CreateShareDto, UpdateShareDto } from './dto/shares.dto';

@Controller('api/shares')
@UseGuards(SupabaseAuthGuard)
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Get('outgoing')
  async findOutgoing(@CurrentUser() user: SupabaseUser) {
    return this.sharesService.findOutgoing(user.id);
  }

  @Get('incoming')
  async findIncoming(@CurrentUser() user: SupabaseUser) {
    return this.sharesService.findIncoming(user.id);
  }

  @Get('resource/:type/:id')
  async findByResource(
    @Param('type') type: string,
    @Param('id') id: string,
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.sharesService.findByResource(id, type, user.id);
  }

  @Post()
  async create(@Body() body: CreateShareDto, @CurrentUser() user: SupabaseUser) {
    const sharedWithId = body.shared_with_id || await this.sharesService.findUserByEmail(body.shared_with_email);
    if (!sharedWithId) {
      throw new BadRequestException('找不到该邮箱对应的用户');
    }

    return this.sharesService.create({
      owner_id: user.id,
      shared_with_id: sharedWithId,
      resource_type: body.resource_type as 'item' | 'todo',
      resource_id: body.resource_id,
      permission: (body.permission as 'view' | 'edit') || 'view',
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateShareDto,
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.sharesService.update(id, user.id, body.permission as 'view' | 'edit');
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: SupabaseUser) {
    return this.sharesService.remove(id, user.id);
  }
}
