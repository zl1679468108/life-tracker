import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Controller('api/feedback')
@UseGuards(SupabaseAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  async create(@Body() body: CreateFeedbackDto, @CurrentUser() user: SupabaseUser) {
    return this.feedbackService.create({ ...body, user_id: user.id });
  }
}
