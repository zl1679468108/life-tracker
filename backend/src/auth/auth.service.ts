import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { SupabaseClient, Provider, createClient } from '@supabase/supabase-js';
import { SUPABASE_ADMIN_CLIENT, SUPABASE_CLIENT } from '../common/supabase/supabase.module';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../common/mail/mail.service';
import { convertTimesToBeijing } from '../common/utils/time';
import { signToken, verifyToken } from '../common/utils/token';

@Injectable()
export class AuthService {
  constructor(
    @Inject(SUPABASE_ADMIN_CLIENT) private adminClient: SupabaseClient,
    @Inject(SUPABASE_CLIENT) private client: SupabaseClient,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  private createAnonClient() {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async signIn(email: string, password: string) {
    const client = this.createAnonClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  async signUp(email: string, password: string) {
    // 创建用户（禁用 Supabase 自动发送邮件）
    const { data, error } = await this.adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // 不自动确认邮箱，需要用户验证
    });

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    // 发送自定义验证邮件
    if (data.user) {
      // 生成带 HMAC 签名的验证 token，防止伪造
      const verifyToken = signToken(
        { userId: data.user.id, email: data.user.email, type: 'signup' },
        24 * 60 * 60 * 1000, // 24小时后过期
      );

      await this.mailService.sendVerificationEmail(email, verifyToken, 'signup');
    }

    return { user: data.user, session: null };
  }

  async verifyEmail(token: string) {
    try {
      // 验证签名 + 有效期 + 类型
      const decoded = verifyToken(token, 'signup');

      // 使用 admin client 确认用户邮箱
      const { data, error } = await this.adminClient.auth.admin.updateUserById(
        decoded.userId,
        { email_confirm: true }
      );

      if (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      return { message: '邮箱验证成功', user: data };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : '无效的验证链接';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async resetPassword(email: string) {
    // 检查用户是否存在
    const { data: users, error: listError } = await this.adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('查询用户列表失败:', listError); throw new HttpException('操作失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const user = (users?.users as any[])?.find((u: any) => u.email === email);
    
    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return { message: '重置密码邮件已发送' };
    }

    // 生成带 HMAC 签名的重置密码 token，防止伪造
    const resetToken = signToken(
      { userId: user.id, email: user.email, type: 'reset' },
      60 * 60 * 1000, // 1小时后过期
    );

    // 发送自定义重置密码邮件
    await this.mailService.sendVerificationEmail(email, resetToken, 'reset');

    return { message: '重置密码邮件已发送' };
  }

  async updatePassword(newPassword: string, token?: string) {
    if (!token) {
      throw new HttpException('缺少验证令牌', HttpStatus.BAD_REQUEST);
    }

    try {
      // 验证签名 + 有效期 + 类型
      const decoded = verifyToken(token, 'reset');

      // 使用 admin client 更新用户密码
      const { data, error } = await this.adminClient.auth.admin.updateUserById(
        decoded.userId,
        { password: newPassword }
      );

      if (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      return { message: '密码更新成功', user: data.user };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : '无效的重置链接';
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // 先验证当前密码是否正确
    const { data: userData, error: verifyError } = await this.adminClient.auth.admin.getUserById(userId);
    
    if (verifyError || !userData.user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    // 使用用户的邮箱和当前密码尝试登录，验证密码是否正确
    const client = this.createAnonClient();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: userData.user.email!,
      password: currentPassword,
    });

    if (signInError) {
      throw new HttpException('当前密码不正确', HttpStatus.BAD_REQUEST);
    }

    // 当前密码验证通过，更新为新密码
    const { data, error } = await this.adminClient.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return { message: '密码修改成功', user: data.user };
  }

  async getProfile(userId: string, token: string) {
    // 创建带用户 token 的客户端，使 auth.uid() 能正确识别用户
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data, error } = await userClient
      .from('life_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('查询用户资料失败:', error); throw new HttpException('操作失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    // 如果用户还没有 profile，返回一个默认对象
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError) {
      console.error('获取用户信息失败:', userError); throw new HttpException('操作失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    const email = data?.email || userData.user?.email || null;

    if (!data) {
      return { id: userId, email, display_name: null, avatar_url: null, phone: null };
    }
    
    return { ...convertTimesToBeijing(data), email };
  }

  async updateProfile(userId: string, updates: any, token: string) {
    // 创建带用户 token 的客户端，使 auth.uid() 能正确识别用户
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const allowedUpdates: Record<string, any> = {
      display_name: updates.display_name,
      avatar_url: updates.avatar_url,
      phone: updates.phone,
      email: updates.email,
    };
    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    // 先检查 profile 是否存在，不存在则创建
    const { data: existing } = await userClient
      .from('life_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    let result;
    if (!existing) {
      result = await userClient
        .from('life_profiles')
        .insert({ id: userId, ...allowedUpdates, updated_at: new Date().toISOString() })
        .select()
        .single();
    } else {
      result = await userClient
        .from('life_profiles')
        .update({ ...allowedUpdates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    return convertTimesToBeijing(data);
  }

  /**
   * 使用 refresh_token 刷新会话，返回新的 access_token 和 refresh_token
   * 使用 anon client，避免污染全局 session
   */
  async refreshSession(refreshToken: string) {
    const client = this.createAnonClient();
    const { data, error } = await client.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new HttpException(
        '刷新令牌无效或已过期',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      user: data.user,
    };
  }

  async signInWithOAuth(provider: string, redirectTo: string) {
    const { data, error } = await this.adminClient.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo,
        scopes: provider === 'wechat' ? 'snsapi_login' : undefined,
      },
    });

    if (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    return data;
  }

  /**
   * 微信 OAuth 回调处理
   * 1. 用 code 换取 access_token 和 openid
   * 2. 用 openid 查找或创建 Supabase 用户
   * 3. 返回 session
   */
  async wechatCallback(code: string) {
    const appId = this.configService.get<string>('WECHAT_APP_ID');
    const appSecret = this.configService.get<string>('WECHAT_APP_SECRET');

    if (!appId || !appSecret) {
      throw new HttpException('微信配置缺失', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 1. 用 code 换取 access_token 和 openid
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}&secret=${appSecret}&code=${code}&grant_type=authorization_code`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.errcode) {
      throw new HttpException(`微信授权失败: ${tokenData.errmsg}`, HttpStatus.BAD_REQUEST);
    }

    const { access_token, openid } = tokenData;

    // 2. 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
    const userInfoRes = await fetch(userInfoUrl);
    const userInfo = await userInfoRes.json();

    if (userInfo.errcode) {
      throw new HttpException(`获取微信用户信息失败: ${userInfo.errmsg}`, HttpStatus.BAD_REQUEST);
    }

    // 3. 在 Supabase 中查找或创建用户
    // 使用 adminClient 的 admin API 查找用户
    const { data: listData, error: listError } = await this.adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('查询用户列表失败:', listError); throw new HttpException('操作失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 查找是否已有该微信用户（通过 user_metadata 中的 wechat_openid）
    const existingUser = listData?.users.find(
      (u: any) => u.user_metadata?.wechat_openid === openid
    );

    if (existingUser) {
      // 用户已存在，生成新 session
      const { data: sessionData, error: sessionError } = await this.adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: existingUser.email!,
      });

      if (sessionError) {
        console.error('生成会话失败:', sessionError); throw new HttpException('操作失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        user: existingUser,
        session: sessionData.properties,
      };
    } else {
      // 创建新用户
      const email = `${openid}@wechat.local`;
      const { data: newUser, error: createError } = await this.adminClient.auth.admin.createUser({
        email,
        password: Math.random().toString(36).slice(-8),
        user_metadata: {
          wechat_openid: openid,
          display_name: userInfo.nickname,
          avatar_url: userInfo.headimgurl,
          provider: 'wechat',
        },
        email_confirm: true,
      });

      if (createError) {
        console.error('创建微信用户失败:', createError); throw new HttpException('操作失败，请稍后重试', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return {
        user: newUser.user,
        session: null,
      };
    }
  }

  /**
   * 登出：吊销当前 access token 对应会话（best-effort，前端仍会清本地 token）
   */
  async logout(accessToken: string) {
    if (!accessToken) {
      return { success: true };
    }
    try {
      const { error } = await this.adminClient.auth.admin.signOut(accessToken, 'global');
      if (error) {
        console.error('登出吊销会话失败:', error.message);
      }
    } catch (err) {
      console.error('登出吊销会话异常:', err);
    }
    return { success: true };
  }
}
