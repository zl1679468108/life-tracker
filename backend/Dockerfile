FROM node:22-alpine AS builder

WORKDIR /app

# 先装全部依赖（包括 devDependencies，用于构建）
COPY package*.json ./
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# 生产阶段
FROM node:22-alpine

WORKDIR /app

# 只安装生产依赖
COPY package*.json ./
RUN npm ci --omit=dev

# 从构建阶段复制编译产物
COPY --from=builder /app/dist ./dist

# 构建参数（在 docker build 时传入，不会保存在镜像中）
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG CORS_ORIGIN

# 注入环境变量（这些值来自构建参数）
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV NODE_ENV=production
ENV CORS_ORIGIN=$CORS_ORIGIN

EXPOSE 3020

CMD ["node", "dist/main.js"]
