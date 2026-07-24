# 数据库增量迁移

> **同步**: 2026-07-24  
> **权威基准**: 始终以 [`../database-init.sql`](../database-init.sql) 为准。

## 用途

- 线上 / 已有实例**幂等补齐**（`IF NOT EXISTS`）。  
- 新环境优先整跑 `database-init.sql`，不必重复执行已合入 init 的补丁。

## 清单

| 文件 | 内容 | 状态 |
|---|---|---|
| [2026-07-24-add-life-items-barcode.sql](./2026-07-24-add-life-items-barcode.sql) | `life_items.barcode` | ✅ 已合入 `database-init.sql` §23；仅旧实例缺列时执行 |

## 约定

1. 改表先改 `database-init.sql`，再视需要新增本目录补丁。  
2. 补丁必须可重复执行。  
3. 合入 init 后在本 README 标记状态，避免重复维护两套真相。
