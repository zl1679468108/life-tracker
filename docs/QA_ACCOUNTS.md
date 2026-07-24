# QA 测试账号

> **用途**: 自动化 / 手工回归。勿用于生产运营。  
> **同步**: 2026-07-24  
> Supabase: `https://fvggqgeiwewsjojargxe.supabase.co`  
> 后端: `http://localhost:3020` · 前端: `http://localhost:3021`

## 1. 稳定账号

| 账号 | 密码 | 说明 |
|---|---|---|
| `1679468108@qq.com` | `zl123456` | 项目所有者账号（含真实数据，冒烟慎用写操作） |
| `qa-a-1782646063680@lifetracker.local` | `Qadur7in!72` | QA 双账号 A |
| `qa-b-1782646063680@lifetracker.local` | `Qa8k44k3!44` | QA 双账号 B |
| `qa-t78-real@example.com` | `Qauxvxxt!88` | 历史真实冒烟遗留号 |

双账号脚本环境变量：

```bash
export QA_USER_A_EMAIL='qa-a-1782646063680@lifetracker.local'
export QA_USER_A_PASSWORD='Qadur7in!72'
export QA_USER_B_EMAIL='qa-b-1782646063680@lifetracker.local'
export QA_USER_B_PASSWORD='Qa8k44k3!44'
```

## 2. 临时账号策略

- `chat-smoke.mjs` / `qa-smoke-v2.mjs` 会**自动创建**临时账号，结果以当次脚本输出为准。  
- **不要**在本文档固化一次性临时邮箱（易过期且污染清单）。  
- 旧临时账号数据可留在 Supabase，无需手工清理。

## 3. 冒烟脚本索引

| 脚本 | 说明 | 备注 |
|---|---|---|
| `scripts/qa/t79-real-smoke.mjs` | 真实 API 双账号冒烟 | `npm run qa:t79-real-smoke`（backend） |
| `scripts/qa/v141-social-flow.mjs` | 社交流程 | `npm run qa:v141-social` |
| `scripts/qa/qa-smoke-v2.mjs` | API 种数据 + 浏览器 | 会创建临时账号 |
| `scripts/qa/chat-smoke.mjs` | 多账号聊天 | 会创建临时账号 |
| `scripts/qa/full-module-smoke.mjs` | 全模块 API | 按需 |
| `scripts/qa/ui-audit-seed.mjs` | UI 审查种子 | 需 `QA_USER_A_EMAIL` |

最近一次本地 API 回归（2026-07-24）：signin + 核心读接口 + 分类创建/删除通过（所有者账号）。

## 4. 登录接口

- 正确路径：`POST /api/auth/signin`（不是 `/login`）
