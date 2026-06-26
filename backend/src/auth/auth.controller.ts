import { Controller, Get, Post, Body, Put, UseGuards, Headers, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signin')
  async signIn(@Body() body: { email: string; password: string }) {
    const data = await this.authService.signIn(body.email, body.password);
    return { code: 200, data, message: '登录成功' };
  }

  @Post('signup')
  async signUp(@Body() body: { email: string; password: string }) {
    const data = await this.authService.signUp(body.email, body.password);
    return { code: 200, data, message: '注册成功' };
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string }) {
    return this.authService.resetPassword(body.email);
  }

  @Post('update-password')
  async updatePassword(@Body() body: { password: string; token?: string }) {
    return this.authService.updatePassword(body.password, body.token);
  }

  @Get('profile')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@CurrentUser() user: SupabaseUser, @Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.getProfile(user.id, token);
  }

  @Put('profile')
  @UseGuards(SupabaseAuthGuard)
  async updateProfile(@CurrentUser() user: SupabaseUser, @Body() body: any, @Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.updateProfile(user.id, body, token);
  }

  @Post('oauth')
  async signInWithOAuth(@Body() body: { provider: string; redirectTo: string }) {
    return this.authService.signInWithOAuth(
      body.provider as any,
      body.redirectTo,
    );
  }

  @Get('wechat/callback')
  async wechatCallback(@Query('code') code: string, @Query('state') state: string) {
    const result = await this.authService.wechatCallback(code);
    
    // 重定向到前端回调页面，带上 token
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3021';
    // 使用 action_token 而不是 access_token/refresh_token
    const actionToken = (result.session as any)?.action_token || '';
    const redirectUrl = `${frontendUrl}/auth/callback?action_token=${actionToken}`;
    
    return {
      redirectUrl,
      session: result.session,
      user: result.user,
    };
  }

  @Post('change-password')
  @UseGuards(SupabaseAuthGuard)
  async changePassword(
    @CurrentUser() user: SupabaseUser,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
