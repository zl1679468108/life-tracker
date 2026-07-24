import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

type SupabaseLikeError = {
  code?: string;
  message?: string;
} | null | undefined;

export type ThrowOnSupabaseErrorOptions = {
  /** PGRST116 时抛出的文案；不传则按通用 500 处理 */
  notFoundMessage?: string;
  /** 默认 not_found → 404；部分模块历史行为用 bad_request → 400 */
  notFoundAs?: 'not_found' | 'bad_request';
};

/**
 * 统一处理 Supabase 返回的 error。
 * 无 error 时直接返回，便于写成 throwOnSupabaseError(error, '上下文')
 */
export function throwOnSupabaseError(
  error: SupabaseLikeError,
  context: string,
  options?: ThrowOnSupabaseErrorOptions,
): void {
  if (!error) return;

  if (error.code === 'PGRST116' && options?.notFoundMessage) {
    if (options.notFoundAs === 'bad_request') {
      throw new BadRequestException(options.notFoundMessage);
    }
    throw new NotFoundException(options.notFoundMessage);
  }

  console.error(context, error);
  throw new InternalServerErrorException('操作失败，请稍后重试');
}
