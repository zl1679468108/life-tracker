import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const SupabaseToken = createParamDecorator<string>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { supabaseToken?: string }>();
    return request.supabaseToken;
  },
);
