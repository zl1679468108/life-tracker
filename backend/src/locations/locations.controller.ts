import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/locations')
@UseGuards(SupabaseAuthGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  async findAll(@CurrentUser() user: SupabaseUser) {
    return this.locationsService.findAll(user.id);
  }

  @Post()
  async create(@Body() body: { name: string; icon?: string; level: number; parent_id?: string }, @CurrentUser() user: SupabaseUser) {
    return this.locationsService.create(body.name, body.icon, body.level, body.parent_id, user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; icon?: string; parent_id?: string }) {
    return this.locationsService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.locationsService.remove(id);
  }
}
