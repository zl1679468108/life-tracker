import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';

@Injectable()
export class AiService {
  constructor(
    @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient,
  ) {}

  /**
   * T48: AI 物品识别（模拟实现）
   * 实际部署时需要配置百度 AI / Google Vision 等 API
   */
  async recognize(imageBuffer: Buffer, userId: string) {
    // 模拟 AI 识别结果
    const categories = ['电子产品', '书籍', '日用品', '衣物', '食品', '家具'];
    const brands = ['Apple', 'Samsung', 'Sony', 'IKEA', 'MUJI', 'Nike'];
    const models = ['Pro', 'Plus', 'Standard', 'Mini', 'Max'];
    
    const randomIdx = Math.floor(Math.random() * categories.length);
    const confidence = 0.6 + Math.random() * 0.35; // 0.6-0.95
    
    return {
      category: categories[randomIdx],
      brand: brands[Math.floor(Math.random() * brands.length)],
      model: models[Math.floor(Math.random() * models.length)],
      confidence: Math.round(confidence * 100) / 100,
      tags: [categories[randomIdx], '识别结果'],
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
