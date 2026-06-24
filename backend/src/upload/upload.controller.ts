import { Controller, Post, UploadedFiles, UseInterceptors, BadRequestException, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('api/upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * 上传单个文件
   */
  @Post('single')
  @UseInterceptors(FilesInterceptor('files', 1))
  async uploadSingle(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('user_id') userId: string
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file uploaded');
    }
    
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    
    const file = files[0];
    const url = await this.uploadService.uploadFile(file.buffer, file.originalname, userId);
    
    return {
      success: true,
      data: {
        url,
        fileName: file.originalname,
      },
    };
  }

  /**
   * 批量上传文件
   */
  @Post('batch')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('user_id') userId: string
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }
    
    const fileNames = files.map(f => f.originalname);
    const buffers = files.map(f => f.buffer);
    
    const urls = await this.uploadService.uploadFiles(buffers, fileNames, userId);
    
    return {
      success: true,
      data: {
        urls,
        files: files.map((f, i) => ({
          fileName: f.originalname,
          url: urls[i],
        })),
      },
    };
  }
}
