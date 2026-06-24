# 前端 Web (PWA) 部署指南

本文档指导如何将 LifeTracker 前端部署为 PWA 应用。

## 1. 部署平台选择

推荐使用 **Vercel**，已配置好 `vercel.json`。

备选方案：
- Netlify
- Cloudflare Pages
- GitHub Pages

## 2. 本地构建测试

在有 npm 的环境执行：

```bash
cd frontend

# 安装依赖
npm install

# 构建 Web 版本
npx expo export:web

# 本地预览构建结果
npx serve dist
```

构建产物在 `dist/` 目录。

## 3. 部署到 Vercel

### 3.1 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel

# 生产环境部署
vercel --prod
```

### 3.2 通过 Vercel Dashboard

1. 访问 https://vercel.com
2. 导入 Git 仓库
3. 选择 `frontend` 目录
4. 框架预设选择 "Create React App"
5. 构建命令：`npx expo export:web`
6. 输出目录：`dist`
7. 点击部署

## 4. 配置自定义域名

1. 在 Vercel 项目设置中添加域名：`app.lifetracker.com`
2. 获取 CNAME 记录：`cname.vercel-dns.com`
3. 在域名注册商配置 DNS（参考 `docs/domain-config.md`）

## 5. PWA 功能验证

### 5.1 离线访问

1. 打开应用后，断开网络
2. 刷新页面，应能正常显示
3. 验证离线缓存是否生效

### 5.2 添加到主屏幕

**Chrome (桌面)**:
1. 打开应用
2. 点击地址栏右侧的安装图标
3. 确认安装

**Android**:
1. 打开应用
2. 点击菜单 → "添加到主屏幕"
3. 确认添加

**iOS**:
1. 打开 Safari 访问应用
2. 点击分享按钮
3. 选择"添加到主屏幕"

### 5.3 推送通知

1. 在设置中开启通知权限
2. 创建带提醒的待办
3. 验证通知是否正常显示

## 6. 环境变量配置

部署后需要更新环境变量：

### Vercel 环境变量设置

在 Vercel Dashboard → Settings → Environment Variables 添加：

```bash
# API 地址（生产环境）
EXPO_PUBLIC_API_BASE_URL=https://api.lifetracker.com

# 环境标识
EXPO_PUBLIC_ENV=production
```

## 7. HTTPS 配置

Vercel 自动提供 HTTPS：
- 使用 Let's Encrypt 证书
- 自动续期
- 强制 HTTPS 重定向

## 8. 性能优化

### 8.1 缓存策略

`vercel.json` 已配置：
- 静态资源：1年缓存
- Service Worker：不缓存
- Manifest：不缓存

### 8.2 CDN 加速

Vercel 自动使用全球 CDN，无需额外配置。

## 9. 监控和分析

### 9.1 Vercel Analytics

在 Vercel Dashboard 启用 Analytics，监控：
- 页面加载速度
- Core Web Vitals
- 用户访问情况

### 9.2 错误追踪

建议集成 Sentry（参考 T-14 错误监控任务）。

## 10. 常见问题

### Q: 构建失败？

A: 检查：
- Node.js 版本 >= 18
- 所有依赖已安装
- 环境变量已配置

### Q: PWA 无法安装？

A: 检查：
- 是否通过 HTTPS 访问
- manifest.json 是否正确生成
- Service Worker 是否注册成功

### Q: 离线访问失败？

A: 检查：
- Service Worker 是否正确注册
- 缓存策略是否正确配置
- 浏览器控制台是否有错误

### Q: 推送通知不显示？

A: 检查：
- 是否请求通知权限
- 浏览器是否支持 Web Notification API
- 后端是否正确发送通知

## 11. 部署后验证清单

- [ ] 访问 `https://app.lifetracker.com` 正常
- [ ] HTTPS 证书有效
- [ ] 登录/注册功能正常
- [ ] 物品 CRUD 功能正常
- [ ] 待办 CRUD 功能正常
- [ ] 图片上传正常
- [ ] 离线访问正常
- [ ] 可添加到主屏幕
- [ ] 推送通知正常
- [ ] 深色模式正常
- [ ] 响应式布局正常

## 12. 更新部署

```bash
# 修改代码后
git add .
git commit -m "update: xxx"
git push

# Vercel 自动部署
# 或手动触发
vercel --prod
```

## 13. 回滚

在 Vercel Dashboard → Deployments，可以回滚到之前的版本。
