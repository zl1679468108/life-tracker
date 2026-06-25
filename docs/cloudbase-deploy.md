# CloudBase 部署指南

## 架构

- 前端：CloudBase App，静态托管 `frontend/dist`
- 后端：CloudRun 容器服务，运行 `backend/Dockerfile`
- 数据库：Supabase 云服务
- 本地：`docker-compose.yml` 双容器统一编排

## 当前部署

- CloudBase 环境：`family-bookkeeping-d7c9caa78340e`
- 前端应用：`lifetracker-web`
- 前端版本：`lifetracker-web-003`
- 前端地址：`https://lifetracker-web-family-bookkeeping-d7c9caa78340e.webapps.tcloudbase.com/`
- 后端服务：`lifetracker-api`
- 后端入口：`https://family-bookkeeping-d7c9caa78340e-1305761531.ap-shanghai.app.tcloudbase.com`
- 健康检查：`https://family-bookkeeping-d7c9caa78340e-1305761531.ap-shanghai.app.tcloudbase.com/api/health`

## 前置条件

1. 登录 CloudBase CLI：

```bash
tcb login
```

2. 在 CloudBase 控制台配置后端 CloudRun 环境变量：

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CORS_ORIGIN=https://<frontend-domain>
NODE_ENV=production
ENV=production
PORT=80
```

不要把真实密钥提交到 Git。

## 一键部署

```bash
export CLOUDBASE_ENV_ID=<your-env-id>
export API_SERVICE_NAME=lifetracker-api
export WEB_SERVICE_NAME=lifetracker-web

bash scripts/deploy-cloudbase.sh
```

## 本地双容器验证

```bash
docker compose up -d --build
curl http://localhost:3020/api/health
curl -I http://localhost/health
```

## 关键配置

- 后端容器内部监听 `80`
- 本地后端映射为 `localhost:3020`
- 前端 Nginx 通过 Docker 网络访问 `backend:80`
- CloudBase 环境变量在控制台配置，不写入仓库
- CloudBase HTTP 路由将 `/api/health` 转发到 `lifetracker-api`
