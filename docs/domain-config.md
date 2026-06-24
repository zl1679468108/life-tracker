# 域名配置指南

本文档指导如何为 LifeTracker 配置域名和 SSL。

## 1. 购买域名

推荐域名注册商：
- **阿里云**: https://www.aliyun.com/product/domain
- **腾讯云**: https://cloud.tencent.com/product/domain
- **Cloudflare**: https://www.cloudflare.com/products/registrar/
- **Namecheap**: https://www.namecheap.com/

建议域名格式：`lifetracker.xxx` 或 `life-tracker.xxx`

## 2. 部署架构

```
lifetracker.com (主域名)
├── app.lifetracker.com      → 前端 Web (PWA) - Vercel/Netlify
├── api.lifetracker.com      → 后端 API - Railway/Render
└── www.lifetracker.com      → 重定向到 app.lifetracker.com
```

## 3. DNS 配置

### 3.1 前端部署 (Vercel)

1. 在 Vercel 项目设置中添加自定义域名：`app.lifetracker.com`
2. Vercel 会提供 CNAME 记录值：`cname.vercel-dns.com`
3. 在域名注册商 DNS 设置中添加：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| CNAME | app | cname.vercel-dns.com |
| CNAME | www | cname.vercel-dns.com |

### 3.2 后端部署 (Railway)

1. 在 Railway 项目设置中添加自定义域名：`api.lifetracker.com`
2. Railway 会提供域名或 CNAME 记录值
3. 在域名注册商 DNS 设置中添加：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| CNAME | api | <railway-provided-domain> |

### 3.3 根域名重定向

将根域名重定向到 www：

| 类型 | 主机记录 | 记录值 |
|------|---------|--------|
| A | @ | 76.76.21.21 (Vercel IP) |

## 4. SSL 配置

### 4.1 Vercel (自动)

Vercel 自动为自定义域名配置 SSL：
- 使用 Let's Encrypt 证书
- 自动续期
- 强制 HTTPS

### 4.2 Railway (自动)

Railway 同样自动配置 SSL：
- 使用 Let's Encrypt 证书
- 自动续期
- 强制 HTTPS

### 4.3 Cloudflare (可选)

如果使用 Cloudflare 作为 DNS 提供商：

1. 添加站点到 Cloudflare
2. 修改域名 NS 记录指向 Cloudflare
3. 在 Cloudflare 设置中：
   - SSL/TLS → 加密模式选择 "Full (strict)"
   - Edge Certificates → 开启 "Always Use HTTPS"
   - Page Rules → 添加重定向规则

## 5. 环境变量更新

部署后需要更新前端环境变量：

### 前端 (.env.production)

```bash
# API 地址
EXPO_PUBLIC_API_BASE_URL=https://api.lifetracker.com

# 环境标识
EXPO_PUBLIC_ENV=production
```

### 后端 (.env.production)

```bash
# Supabase 配置
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 微信开放平台配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_REDIRECT_URI=https://api.lifetracker.com/api/auth/wechat/callback

# 服务器配置
PORT=3020
CORS_ORIGIN=https://app.lifetracker.com
ENV=production

# 前端地址（用于 OAuth 回调）
FRONTEND_URL=https://app.lifetracker.com
```

## 6. Supabase 配置

在 Supabase Dashboard 中更新：

1. **Authentication → URL Configuration**
   - Site URL: `https://app.lifetracker.com`
   - Redirect URLs: 
     - `https://app.lifetracker.com/auth/callback`
     - `https://app.lifetracker.com/auth/reset-password`

2. **Storage → Policies**
   - 确保 storage bucket 的 RLS 策略正确配置

## 7. 微信开放平台配置

在微信开放平台更新：

1. **网站应用 → 应用详情**
   - 授权回调域名：`api.lifetracker.com`

2. **unionID 获取**
   - 确保已开通 unionID 权限

## 8. 验证配置

### 8.1 DNS 验证

```bash
# 检查 DNS 解析
nslookup app.lifetracker.com
nslookup api.lifetracker.com

# 检查 SSL 证书
curl -I https://app.lifetracker.com
curl -I https://api.lifetracker.com
```

### 8.2 功能验证

1. **前端访问**
   - 访问 `https://app.lifetracker.com`
   - 验证页面加载正常
   - 验证 PWA 功能（添加到主屏幕）

2. **后端 API**
   - 访问 `https://api.lifetracker.com/api/health`
   - 验证返回正常

3. **跨域请求**
   - 在前端页面测试 API 调用
   - 验证 CORS 配置正确

4. **OAuth 登录**
   - 测试微信登录流程
   - 验证回调地址正确

## 9. 常见问题

### Q: DNS 解析不生效？

A: DNS 传播可能需要 24-48 小时。可以使用 https://dnschecker.org/ 检查全球 DNS 传播状态。

### Q: SSL 证书未生效？

A: 
- Vercel/Railway 自动配置 SSL，通常需要 5-10 分钟
- 如果使用 Cloudflare，确保 SSL 模式为 "Full (strict)"

### Q: CORS 错误？

A: 检查后端 `CORS_ORIGIN` 环境变量是否包含前端域名

### Q: OAuth 回调失败？

A: 
- 检查微信开放平台的授权回调域名配置
- 检查 Supabase 的 Redirect URLs 配置
- 检查后端 `FRONTEND_URL` 环境变量

## 10. 监控和维护

### 10.1 域名监控

- 设置域名到期提醒
- 定期检查 SSL 证书有效期

### 10.2 性能监控

- 使用 Vercel Analytics 监控前端性能
- 使用 Railway Metrics 监控后端性能
- 配置 UptimeRobot 监控网站可用性

### 10.3 备份策略

- 定期备份 Supabase 数据库
- 备份环境变量配置
