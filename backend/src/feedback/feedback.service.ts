import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing } from '../common/utils/time';

@Injectable()
export class FeedbackService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(feedback: any) {
    const { data, error } = await this.supabase
      .from('life_feedback')
      .insert(feedback)
      .select()
      .single();

    if (error) { console.error('创建反馈失败:', error); throw new InternalServerErrorException('操作失败，请稍后重试'); }
    return convertTimesToBeijing(data);
  }
}
