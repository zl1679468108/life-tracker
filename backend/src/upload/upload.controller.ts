import { Controller, Post, UploadedFiles, UseInterceptors, BadRequestException, UseGuards } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/upload')
@UseGuards(SupabaseAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传单个文件
   */
  @Post('single')
  @UseInterceptors(FilesInterceptor('files', 1))
  async uploadSingle(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: SupabaseUser,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file uploaded');
    }

    const file = files[0];
    const url = await this.uploadService.uploadFile(file.buffer, file.originalname, user.id);

    return {
      code: 200,
      data: {
        url,
        fileName: file.originalname,
      },
      message: '上传成功',
    };
  }

  /**
   * 批量上传文件
   */
  @Post('batch')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: SupabaseUser,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const fileNames = files.map(f => f.originalname);
    const buffers = files.map(f => f.buffer);

    const urls = await this.uploadService.uploadFiles(buffers, fileNames, user.id);

    return {
      code: 200,
      data: {
        urls,
        files: files.map((f, i) => ({
          fileName: f.originalname,
          url: urls[i],
        })),
      },
      message: '批量上传成功',
    };
  }
}
