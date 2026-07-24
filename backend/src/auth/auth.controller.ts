import { Controller, Get, Post, Body, Put, UseGuards, Headers, Query, Req} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from '../common/auth/supabase-auth.guard';
import { CurrentUser, SupabaseUser } from '../common/auth/current-user.decorator';
import {
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  UpdateProfileDto,
  ChangePasswordDto,
  OAuthDto,
  RefreshTokenDto,
} from './dto/auth.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signin')
  async signIn(@Body() body: SignInDto) {
    const data = await this.authService.signIn(body.email, body.password);
    return { code: 200, data, message: '登录成功' };
  }

  @Post('signup')
  async signUp(@Body() body: SignUpDto) {
    const data = await this.authService.signUp(body.email, body.password);
    return { code: 200, data, message: '注册成功' };
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email);
  }

  @Post('update-password')
  async updatePassword(@Body() body: UpdatePasswordDto) {
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
  async updateProfile(@CurrentUser() user: SupabaseUser, @Body() body: UpdateProfileDto, @Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    return this.authService.updateProfile(user.id, body, token);
  }

  @Post('oauth')
  async signInWithOAuth(@Body() body: OAuthDto) {
    return this.authService.signInWithOAuth(
      body.provider as any,
      body.redirectTo,
    );
  }

  @Post('refresh')
  async refreshToken(@Body() body: RefreshTokenDto) {
    const data = await this.authService.refreshSession(body.refreshToken);
    return { code: 200, data, message: '刷新成功' };
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


  @Post('logout')
  @UseGuards(SupabaseAuthGuard)
  async logout(@Req() req: Request) {
    const authHeader = req.headers.authorization || '';
    const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const data = await this.authService.logout(accessToken);
    return { code: 200, data, message: '已登出' };
  }

  @Post('change-password')
  @UseGuards(SupabaseAuthGuard)
  async changePassword(
    @CurrentUser() user: SupabaseUser,
    @Body() body: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }
}
