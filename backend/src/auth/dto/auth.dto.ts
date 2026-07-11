import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/** 登录 DTO */
export class SignInDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  password: string;
}

/** 注册 DTO */
export class SignUpDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password: string;
}

/** 邮箱验证 DTO */
export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: '令牌不能为空' })
  token: string;
}

/** 重置密码请求 DTO */
export class ResetPasswordDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;
}

/** 更新密码 DTO */
export class UpdatePasswordDto {
  @IsString()
  @MinLength(6, { message: '密码至少 6 位' })
  password: string;

  @IsOptional()
  @IsString()
  token?: string;
}

/** 修改密码 DTO（需登录） */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '当前密码不能为空' })
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: '新密码至少 6 位' })
  newPassword: string;
}

/** 更新个人资料 DTO */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  display_name?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;
}

/** OAuth 登录 DTO */
export class OAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'provider 不能为空' })
  provider: string;

  @IsString()
  @IsNotEmpty({ message: 'redirectTo 不能为空' })
  redirectTo: string;
}
