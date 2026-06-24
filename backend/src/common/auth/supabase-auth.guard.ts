import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SUPABASE_ADMIN_CLIENT } from '../supabase/supabase.module';
import { Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(@Inject(SUPABASE_ADMIN_CLIENT) private adminClient: SupabaseClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('缺少认证令牌');
    }

    const token = authHeader.substring(7);

    try {
      // 使用 admin client 验证 JWT token
      const { data, error } = await this.adminClient.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('无效的认证令牌');
      }

      // 将用户信息附加到请求对象
      (request as any).user = data.user;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('认证失败');
    }
  }
}
