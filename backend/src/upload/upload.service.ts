import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private bucketName = 'items-images';

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration is missing');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * 上传单个文件
   */
  async uploadFile(file: Buffer, fileName: string, userId: string): Promise<string> {
    try {
      const filePath = `${userId}/${Date.now()}_${fileName}`;
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          contentType: this.getContentType(fileName),
          upsert: false,
        });
      
      if (error) {
        console.error('文件上传失败:', error); throw new BadRequestException('上传失败，请稍后重试');
      }
      
      // 获取公开 URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);
      
      return urlData.publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('文件上传失败:', error); throw new BadRequestException('上传失败，请稍后重试');
    }
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(files: Buffer[], fileNames: string[], userId: string): Promise<string[]> {
    if (files.length !== fileNames.length) {
      throw new BadRequestException('Files and fileNames length mismatch');
    }
    
    const results = await Promise.all(
      files.map((file, index) => this.uploadFile(file, fileNames[index], userId))
    );
    
    return results;
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([filePath]);
    
    if (error) {
      console.error('文件删除失败:', error); throw new BadRequestException('删除失败，请稍后重试');
    }
  }

  /**
   * 根据文件名获取 Content-Type
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
