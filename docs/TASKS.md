# LifeTracker 任务看板

> 仅保留未完成任务。

## 当前状态（2026-07-24）

主线已收口。T95–T99 优化/缺陷修复与共享抽象收口已完成。

**当前可执行任务：无。**

## 待办任务

| ID | 优先级 | 任务 | 模块 | 状态 | 验收 |
|---|---|---|---|---|---|
| — | — | （暂无） | — | — | — |

## 本轮已完成（T99 共享抽象，不入待办）

- `usePalette` / `useAppTheme` / `AppPalette` 统一主题色板访问
- `formatDateZh` / `formatChatListTime` / `formatMessageTime` / `formatRelativeActive` / `getMessageSummary`
- `avatarColor` / `avatarInitial` + `UserAvatar`
- `SegmentedTabs` / `SortPickerModal` / `ListSkeleton` 列表页复用
- 通知页 SegmentedTabs 残留 JSX 修复；列表页死样式清理
- 物品列表可选列 schema 漂移降级 + `barcode` 幂等补齐迁移
