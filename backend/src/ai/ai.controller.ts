import { Controller, Post, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/ai')
@UseGuards(SupabaseAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('recognize')
  @UseInterceptors(FileInterceptor('image'))
  async recognize(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: SupabaseUser) {
    if (!file) throw new BadRequestException('请上传图片');
    return this.aiService.recognize(file.buffer, user.id);
  }
}
