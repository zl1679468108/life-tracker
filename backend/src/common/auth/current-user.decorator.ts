import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

export const CurrentUser = createParamDecorator<SupabaseUser>(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: SupabaseUser }>();
    return request.user;
  },
);
