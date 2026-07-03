# QA 测试账号

> 自动化测试脚本专用的测试账号，由 AI 按需创建。
> Supabase 实例: `https://fvggqgeiwewsjojargxe.supabase.co`
> 后端 API: `http://localhost:3020` | 前端: `http://localhost:3021`

## 现有账号

| 账号 | 密码 | 说明 |
|---|---|---|
| `1679468108@qq.com` | `zl123456` | 项目所有者真实账号，含真实数据 |
| `qa-t78-real@example.com` | — | T78 遗留测试账号（密码未知） |
| `qa-a-1782646063680@lifetracker.local` | — | 早期 QA 双账号中的 A（密码未知） |
| `qa-b-1782646063680@lifetracker.local` | — | 早期 QA 双账号中的 B（密码未知） |

## 自动化测试临时账号

以下账号由 `chat-smoke.mjs` 最新一次运行自动创建，均已通过 Supabase admin API 确认邮箱：

| 账号 | 密码 | 角色 |
|---|---|---|
| `qa-chat-b-1783091828202@test.com` | `ChatPassB!` | 聊天测试——账号 B（与 A 和 C 均有好友关系） |
| `qa-chat-c-1783091828202@test.com` | `ChatPassC!` | 聊天测试——账号 C（与 A 和 B 均有好友关系） |

### 账号关系

```
A (1679468108@qq.com) ←→ B (qa-chat-b-...)
A (1679468108@qq.com) ←→ C (qa-chat-c-...)
C (qa-chat-c-...)      ←→ B (qa-chat-b-...)
```

### 对话数据 (A 视角)

| 对话 | 方向 | 消息数 | 内容 |
|---|---|---|---|
| A↔B | A → B | 4 条 | "A 对 B 说：你好！..." 等 4 条连续消息 |
| C↔A | C↔A 双向 | 5 条 | C 发 3 条 + A 回 2 条 |

---

## 冒烟测试脚本

| 脚本 | 说明 | 最后运行 |
|---|---|---|
| `scripts/qa/qa-smoke-v2.mjs` | 全功能冒烟（API 种数据 + 浏览器验证） | 2026-07-03 |
| `scripts/qa/chat-smoke.mjs` | 多账号聊天专项测试（3 账号 36/36 通过） | 2026-07-03 |
| `scripts/qa/ui-audit-seed.mjs` | UI 审查种子数据（需 QA_USER_A_EMAIL 环境变量） | 2026-06-29 |
| `scripts/qa/t79-real-smoke.mjs` | v1.4.3 真实冒烟脚本（需 QA_USER_A/B 双账号环境变量） | 2026-07-03 |
| `scripts/qa/v141-social-flow.mjs` | v1.4.1 社交流验证 | 2026-06-28 |

> 提示：每次运行 `chat-smoke.mjs` 或 `qa-smoke-v2.mjs` 会自动创建新临时账号。  
> 旧账号的对话/消息数据仍保留在 Supabase 中，无需手动清理。
