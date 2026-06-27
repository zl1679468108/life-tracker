import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/messages')
@UseGuards(SupabaseAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations')
  async findConversations(@CurrentUser() user: SupabaseUser) {
    return this.messagesService.findConversations(user.id);
  }

  @Get('conversations/:id')
  async findMessages(
    @Param('id') conversationId: string,
    @CurrentUser() user: SupabaseUser,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findMessages(
      conversationId,
      user.id,
      parseInt(limit) || 50,
      before,
    );
  }

  @Post('conversations')
  async createConversation(
    @Body() body: { participant_ids: string[]; last_message_type?: string; last_message_content?: string; last_message_at?: string },
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.messagesService.createConversation(user.id, body);
  }

  @Post('conversations/:id/messages')
  async createMessage(
    @Param('id') conversationId: string,
    @Body() body: { type: string; resource_type?: string; resource_id?: string; content?: string; card_data?: any },
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.messagesService.createMessage(conversationId, user.id, body);
  }

  @Patch('conversations/:id/read')
  async markAsRead(
    @Param('id') conversationId: string,
    @CurrentUser() user: SupabaseUser,
  ) {
    return this.messagesService.markAsRead(conversationId, user.id);
  }

  /**
   * 搜索用户（通过邮箱前缀或用户名）
   */
  @Get('users/search')
  async searchUsers(
    @CurrentUser() user: SupabaseUser,
    @Query('q') q: string,
  ) {
    return this.messagesService.searchUsers(user.id, q);
  }

  /**
   * 手动创建对话（供消息模块社交化使用）
   */
  @Post('conversations/manual')
  async createManualConversation(
    @CurrentUser() user: SupabaseUser,
    @Body() body: { participant_ids: string[]; initial_message?: { type: string; content?: string; card_data?: any } },
  ) {
    return this.messagesService.createManualConversation(user.id, body);
  }
}
