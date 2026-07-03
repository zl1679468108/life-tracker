import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';

@Injectable()
export class AiService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  /**
   * T48: 智能录入建议（实验）
   * 当前仅返回演示建议，不作为真实图像识别结论。
   */
  async recognize(imageBuffer: Buffer, userId: string) {
    const categories = ['电子产品', '书籍', '日用品', '衣物', '食品', '家具'];
    const brands = ['Apple', 'Samsung', 'Sony', 'IKEA', 'MUJI', 'Nike'];
    const models = ['Pro', 'Plus', 'Standard', 'Mini', 'Max'];
    
    const randomIdx = Math.floor(Math.random() * categories.length);
    const confidence = 0.45 + Math.random() * 0.25;
    
    return {
      experimental: true,
      source: 'mock_suggestion',
      notice: '当前为模拟建议，请人工确认后再保存。',
      category: categories[randomIdx],
      brand: brands[Math.floor(Math.random() * brands.length)],
      model: models[Math.floor(Math.random() * models.length)],
      confidence: Math.round(confidence * 100) / 100,
      tags: [categories[randomIdx], '录入建议'],
    };
  }

  async recognizeBatch(files: Buffer[], userId: string) {
    const results = [];
    for (const file of files.slice(0, 5)) {
      const result = await this.recognize(file, userId);
      results.push(result);
    }
    return results;
  }
}
