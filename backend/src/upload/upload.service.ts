import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private bucketName = 'items-images';
  /** 单文件上限 5MB */
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024;
  private static readonly ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp']);
  private static readonly ALLOWED_MIME = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]);

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
  async uploadFile(file: Buffer, fileName: string, userId: string, mimeType?: string): Promise<string> {
    try {
      this.validateFile(file, fileName, mimeType);
      const safeName = this.sanitizeFileName(fileName);
      const filePath = `${userId}/${Date.now()}_${safeName}`;
      
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          contentType: this.getContentType(safeName),
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

  private validateFile(file: Buffer, fileName: string, mimeType?: string) {
    if (!file || file.length === 0) {
      throw new BadRequestException('文件内容为空');
    }
    if (file.length > UploadService.MAX_FILE_SIZE) {
      throw new BadRequestException('文件大小不能超过 5MB');
    }
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (!UploadService.ALLOWED_EXT.has(ext)) {
      throw new BadRequestException('仅支持 jpg/png/gif/webp 图片');
    }
    if (mimeType && !UploadService.ALLOWED_MIME.has(mimeType) && mimeType !== 'application/octet-stream') {
      throw new BadRequestException('文件类型不受支持');
    }
  }

  private sanitizeFileName(fileName: string): string {
    const base = fileName.split(/[/\\]/).pop() || 'image';
    return base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
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
    };
    return mimeTypes[ext || ''] || 'image/jpeg';
  }
}
