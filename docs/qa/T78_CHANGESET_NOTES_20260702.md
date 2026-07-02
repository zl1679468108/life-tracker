# T78 收尾变更分组

日期：2026-07-02

## 本轮 T78 收尾直接相关

- `frontend/stores/locationStore.ts`：位置新增、更新、删除补齐错误处理；新增结果和 socket 创建事件按 `id` upsert，修复真实 Web 新增位置后重复回显。
- `backend/src/borrowings/borrowings.service.ts`：创建借用前检查同一用户同一物品是否已有 `borrowed` / `overdue` 记录，避免未归还物品重复借出。
- `docs/qa/T78_REAL_CRUD_20260702.md`：记录位置、模板、借用真实浏览器冒烟结果和残留事项。
- `docs/qa/t78-real-crud-20260702/`：保存位置修复和借用归还截图。
- `docs/TASKS.md`：将 T78、T78.4、T78.5 收口为 `done`，补充三项验证命令。
- `frontend/__tests__/screens.integration.test.ts`：补齐当前 RN/Jest mock，移除过期页面文案断言，改为当前页面渲染烟测并恢复通过。
- `frontend/__mocks__/socketMock.ts`、`frontend/__tests__/stores.test.ts`：复用完整 socket mock，补齐分类、位置、消息、提醒等回调桩。
- `frontend/app/settings/calendar.tsx`：日历网格前后补位日期改为本地日期格式化，避免东八区 `toISOString()` 把下月日期回退到当月最后一天并造成重复 key。
- `frontend/lib/network.ts`：测试环境下跳过真实网络监听和外网 HEAD 检测，避免 Jest 被 `setInterval` 与 TCP 句柄挂住。

## 进入本轮前已存在的 T77/T78 相关改动

这些文件在本轮开始时已经处于修改状态，本轮未做系统性重构，只在现有基础上继续验证和收口：

- `backend/src/items/items.service.ts`
- `docs/database-init.sql`
- `frontend/app/(tabs)/index.tsx`
- `frontend/app/(tabs)/messages.tsx`
- `frontend/app/(tabs)/settings.tsx`
- `frontend/app/(tabs)/workbench.tsx`
- `frontend/app/item/create.tsx`
- `frontend/app/item/list.tsx`
- `frontend/app/settings/account.tsx`
- `frontend/app/settings/category-manage.tsx`
- `frontend/app/settings/language.tsx`
- `frontend/app/settings/theme.tsx`
- `frontend/app/todo/create.tsx`
- `frontend/app/todo/list.tsx`
- `frontend/components/GlobalSearch.tsx`
- `frontend/components/ui/AppHeader.tsx`
- `frontend/components/ui/DatePicker.tsx`
- `frontend/scripts/qa/ui-integration.mjs`
- `frontend/stores/categoryStore.ts`
- `frontend/stores/itemStore.ts`
- `frontend/stores/todoStore.ts`

## 未跟踪文件提醒

- `消息模块参考图.png`：当前未跟踪，未纳入 T78 QA 记录；提交前需确认是否要加入版本库。

## 提交范围建议

建议本次 T78 收尾提交包含：

- 本文档和 `docs/qa/T78_REAL_CRUD_20260702.md`。
- `docs/qa/t78-real-crud-20260702/location-after-fix.png`。
- `docs/qa/t78-real-crud-20260702/borrowings-after-return.png`。
- “本轮 T78 收尾直接相关”一节列出的代码与 `docs/TASKS.md`。

建议暂不默认纳入：

- 进入本轮前已存在的 T77/T78 相关改动，除非确认要和本轮一起提交。
- `docs/qa/UI_EXECUTION_CHECKLIST_20260701.md` 及 `docs/qa/ui-integration-*` 旧截图目录，除非确认要补交旧 QA 证据。
- `消息模块参考图.png`，除非确认该参考图属于产品资料并需要入库。

## 追加测试记录

- 已补跑 `cd frontend && npx jest __tests__/screens.integration.test.ts --runInBand`：1/1 suite、46/46 tests 通过。
- 已补跑 `cd frontend && npx jest --runInBand --detectOpenHandles __tests__/screens.integration.test.ts`：1/1 suite、46/46 tests 通过并正常退出，输出已无 OAuth 缺 token、React act 或重复 key 警告。
- 已补跑 `cd frontend && npx jest --runInBand --detectOpenHandles`：11/11 suites、95/95 tests 通过并正常退出，未再报告 open handle。
- 已补跑 `cd frontend && npx tsc --noEmit`：通过。
- 已补跑 `cd frontend && npm run build:web`：通过，Expo Web 导出到 `frontend/dist`。
- 已补跑 `cd backend && npm run build`：通过。
