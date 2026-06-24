import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter | null = null;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get<string>('MAIL_ENABLED') === 'true';
    
    if (this.enabled) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('MAIL_HOST'),
        port: this.configService.get<number>('MAIL_PORT'),
        secure: this.configService.get<string>('MAIL_SECURE') === 'true',
        auth: {
          user: this.configService.get<string>('MAIL_USER'),
          pass: this.configService.get<string>('MAIL_PASSWORD'),
        },
      });
    }
  }

  async sendVerificationEmail(email: string, token: string, type: 'signup' | 'reset') {
    if (!this.enabled || !this.transporter) {
      console.warn('邮件服务未启用,跳过发送邮件');
      return;
    }

    const from = this.configService.get<string>('MAIL_FROM');
    const siteUrl = this.configService.get<string>('SITE_URL') || 'http://localhost:3021';
    
    let subject: string;
    let html: string;
    let text: string;

    if (type === 'signup') {
      subject = 'LifeTracker - 验证您的邮箱';
      const verifyUrl = `${siteUrl}/auth/verify-email?token=${token}&type=signup`;
      
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8F6B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 40px 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FF6B35; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>欢迎加入 LifeTracker</h1>
          </div>
          <div class="content">
            <h2>验证您的邮箱</h2>
            <p>感谢您注册 LifeTracker!请点击下方按钮完成邮箱验证:</p>
            <center>
              <a href="${verifyUrl}" class="button">验证邮箱</a>
            </center>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">如果按钮无法点击,请复制以下链接到浏览器:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${verifyUrl}</p>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">此链接将在 24 小时后失效。</p>
          </div>
          <div class="footer">
            <p>LifeTracker - 让生活更有条理</p>
          </div>
        </body>
        </html>
      `;
      
      text = `欢迎加入 LifeTracker!\n\n请点击以下链接验证您的邮箱:\n${verifyUrl}\n\n此链接将在 24 小时后失效。`;
    } else {
      subject = 'LifeTracker - 重置您的密码';
      const resetUrl = `${siteUrl}/auth/update-password?token=${token}&type=reset`;
      
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FF6B35 0%, #FF8F6B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 40px 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #FF6B35; color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #999; font-size: 14px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LifeTracker</h1>
          </div>
          <div class="content">
            <h2>重置密码</h2>
            <p>您请求重置密码。请点击下方按钮设置新密码:</p>
            <center>
              <a href="${resetUrl}" class="button">重置密码</a>
            </center>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">如果按钮无法点击,请复制以下链接到浏览器:</p>
            <p style="font-size: 12px; color: #999; word-break: break-all;">${resetUrl}</p>
            <div class="warning">
              <p style="margin: 0; font-size: 14px;">如果您没有请求重置密码,请忽略此邮件。</p>
            </div>
            <p style="margin-top: 20px; font-size: 14px; color: #666;">此链接将在 1 小时后失效。</p>
          </div>
          <div class="footer">
            <p>LifeTracker - 让生活更有条理</p>
          </div>
        </body>
        </html>
      `;
      
      text = `您请求重置 LifeTracker 密码。\n\n请点击以下链接设置新密码:\n${resetUrl}\n\n如果您没有请求重置密码,请忽略此邮件。\n\n此链接将在 1 小时后失效。`;
    }

    await this.transporter.sendMail({
      from: `LifeTracker <${from}>`,
      to: email,
      subject,
      text,
      html,
    });
  }
}
