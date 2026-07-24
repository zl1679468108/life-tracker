import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { convertTimesToBeijing } from '../common/utils/time';
import { throwOnSupabaseError } from '../common/utils/supabase-error';

@Injectable()
export class FeedbackService {
  constructor(@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient) {}

  async create(feedback: any) {
    const { data, error } = await this.supabase
      .from('life_feedback')
      .insert(feedback)
      .select()
      .single();

    throwOnSupabaseError(error, '创建反馈失败:');
    return convertTimesToBeijing(data);
  }
}
