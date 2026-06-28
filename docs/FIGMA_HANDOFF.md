# LifeTracker UI Handoff

> 状态: Figma 流程暂停；当前以本地 HTML/CSS/JS/SVG 高保真设计源为准 / 第三阶段编码暂停  
> 日期: 2026-06-28  
> Figma 文件: https://www.figma.com/design/5Jf46ubRueu1vhNkmgoyNK  
> 文件名: LifeTracker v1.4 UI Redesign Handoff
> 高清设计板参考: [lifetracker-v1.4-design-board.html](./design/lifetracker-v1.4-design-board.html)
> PRD 覆盖补齐板: [lifetracker-v1.4-figma-coverage-board.html](./design/lifetracker-v1.4-figma-coverage-board.html)
> v2 完整交互地图: [lifetracker-v1.4-complete-interaction-map.html](./design/lifetracker-v1.4-complete-interaction-map.html)
> 视觉 QA 优化计划: [FIGMA_VISUAL_QA.md](./FIGMA_VISUAL_QA.md)

## 交付原则

- 第三阶段前端实现以 `docs/design/lifetracker-v1.4-complete-interaction-map.html` 及其 CSS/JS/SVG 为视觉源。
- `docs/PRD.md` 仍是业务范围与入口边界的唯一来源。
- `docs/UI_REDESIGN_STAGE_2.md` 记录 token、布局、组件和交互参数。
- 早期生成图片只保留为风格参考，不作为 1:1 还原依据。
- 所有模块按列表、新增、编辑表达；不输出独立详情页效果。
- 图标区域必须使用线性 SVG/线性图标；没有合适图标时，使用模块名称中的单字作为文字图标，不使用含糊的装饰色块代替图标。
- 通用管理模块共享同一套列表、标题栏搜索图标、新增、编辑、左滑删除确认交互；字段可以不同，布局和按钮规则保持一致。
- 所有页面主标题下方不展示描述性副标题；说明性文案只留在 Handoff。

## 当前 Figma 状态

Figma MCP Starter 调用额度和工具暴露不稳定，当前不再继续依赖 Figma 作为交付源。历史 Figma 文件仅作为早期参考，不作为第三阶段 1:1 还原依据。当前确认前的唯一高保真设计源为本地完整交互地图。

- `00 Handoff`
- `01 Foundations & Components`
- `02 Screens & Interactions`

最近一次 Figma 写入返回的顶层节点已记录在“关键节点”中。用户审查导出截图后确认当前 Figma 设计源仍偏覆盖说明，缺少按功能大类排列的完整交互页。当前已改为本地 HTML/CSS/JS/SVG 交付 `Complete Interaction Map`，补齐每个功能的列表、新增、编辑和必要特殊交互；确认前暂停第三阶段编码。

## Figma 页面

| Page | 内容 |
|---|---|
| `00 Handoff` | 改版目标、阶段说明、入口规则 |
| `01 Foundations & Components` | 深浅色 token、字体、间距、圆角、基础组件参考 |
| `02 Screens & Interactions` | 深色整体、浅色整体、列表/新增/编辑交互页 |

## 关键节点

| 节点 | Node ID | 用途 |
|---|---|---|
| Cover | `11:2` | 阶段说明、入口规则、Handoff 门禁 |
| Foundations & Components | `12:2` | 深浅色 token、字体、间距、圆角、组件规格 |
| Screens & Interactions | `15:2` | 深色整体、浅色整体、列表/新增/编辑交互稿 |
| PRD Full Coverage Supplement | `30:2` | PRD 全模块覆盖矩阵、工作台全量入口、我的全量入口、低频模块页面模板 |
| Workbench Full Entries / Dark | `30:272` | 工作台深色全量入口效果图 |
| Management Template / Light | `30:313` | 分类/位置/模板等管理模块列表、新增、编辑模板 |
| Life Records Template / Dark | `30:349` | 借用、日历、共享等生活记录模块模板 |
| Data Reminder Screens / Light | `30:380` | 统计、通知、数据管理、资产、小组件模板 |
| Profile Settings / Dark | `30:417` | 我的外层账号、偏好、数据与支持入口模板 |

## 本地高清设计板参考

本地设计板仍保留为离线参考，但不再作为第三阶段实现源：

- [lifetracker-v1.4-design-board.html](./design/lifetracker-v1.4-design-board.html)

覆盖范围：

- 深色整体：首页、工作台、消息、我的。
- 浅色整体：首页、工作台、列表、我的。
- 交互页：物品列表、新增物品、编辑物品。
- 管理页：分类管理列表、借用编辑。
- 特殊页：数据统计概览。
- 入口规则：工作台平铺所有模块，我的外层平铺账号/偏好/数据与支持。
- 页面规则：默认 `列表 / 新增 / 编辑`，不新增独立详情页视觉。

## PRD 覆盖补齐

详见 [FIGMA_COVERAGE_MATRIX.md](./FIGMA_COVERAGE_MATRIX.md)。补齐范围：

- 工作台全部模块入口：分类、位置、模板、借用、日历、共享、统计、通知、数据管理、资产、桌面小组件。
- 我的全部外层入口：账号、密码、退出、主题、语言、同步、数据管理、反馈、版本。
- 低频模块页面模板：管理列表、生活记录、数据与提醒、设置表单。
- 上下文能力：AI 物品识别、模板套用、分享、借用上下文，不作为独立一级入口。
- 图标规则：线性图标或单字文字图标，不使用装饰色块冒充图标。

### 2026-06-28 Figma 写入记录

- 写入文件: `LifeTracker v1.4 UI Redesign Handoff`
- File Key: `5Jf46ubRueu1vhNkmgoyNK`
- 写入页面: `02 Screens & Interactions`
- 写入节点: `PRD Full Coverage Supplement / 2026-06-28` (`30:2`)
- 覆盖模块数: `26`
- 页面状态: MCP 写入成功；后续 `get_metadata` / `get_screenshot` 校验被 Figma Starter MCP tool call limit 阻断，需要用户在 Figma 中直接审阅。

### 2026-06-28 视觉 QA 记录

- 已按 `ui-ux-pro-max` 和 `frontend-design` 标准整理逐屏优化计划，详见 [FIGMA_VISUAL_QA.md](./FIGMA_VISUAL_QA.md)。
- 当前 Figma MCP 读写均被 Starter tool call limit 阻断，暂未能把 `Visual QA Polish` 优化板写入 Figma。
- 调用额度恢复后，优先写入高保真还原辅助内容：实现 token、交互状态、表单状态、列表状态、浅色关键屏对照。

### 2026-06-28 完整交互地图要求

- 设计源必须从“覆盖矩阵 + 模板屏”升级为“完整交互地图”。
- 排列规则: `行 = 功能大类`，`列 = 该功能产生的子页面 / 交互状态`。
- 第 1 排第 1 列: 首页。
- 第 2 排第 1 列: 工作台；第 2 排第 2 列: 搜索功能展示的列表，且管理工具全部入口必须可见。
- 第 3 排: 物品列表、物品新增、物品编辑。
- 第 4 排: 待办列表、待办新增、待办编辑。
- 第 5 排: 消息列表、添加好友、好友操作、对话页。
- 后续排依次补齐我的、分类、位置、模板、借用、日历、数据统计、通知中心、数据管理、资产总览、桌面小组件。
- 工作台不得展示 `我的` 业务入口；`我的` 只保留为底部 Tab 和账号/系统设置页。
- 标题栏图标必须使用直观线性图标或明确文字：搜索、通知、加号、返回、聊天等；搜索不在常规页面展示输入框。
- 不能只用“管理模板 / 数据模板”代替实际模块效果；消息、数据统计、通知中心等必须有独立界面效果。
- Figma 流程暂停，不再等待 MCP 恢复；后续如需要再单独迁移本地设计源。

### 2026-06-28 本地 v2 设计源

- 已生成完整高保真 HTML/CSS/JS/SVG 设计源:
  - [lifetracker-v1.4-complete-interaction-map.html](./design/lifetracker-v1.4-complete-interaction-map.html)
  - [lifetracker-v1.4-complete-interaction-map.css](./design/lifetracker-v1.4-complete-interaction-map.css)
  - [lifetracker-v1.4-complete-interaction-map.js](./design/lifetracker-v1.4-complete-interaction-map.js)
  - [lifetracker-v1.4-icons.svg](./design/lifetracker-v1.4-icons.svg)
- 覆盖 16 个功能大类、40 个功能界面/状态和 1 个 Handoff 组件库区。
- 已按评审调整：删除独立共享管理，消息改为好友验证后建聊；工作台说明中移除“我的”；全局编辑页使用标题左侧返回 + 取消/保存；删除通过列表左滑和小弹窗确认。
- 本地预览地址: `http://127.0.0.1:4177/lifetracker-v1.4-complete-interaction-map.html`
- 验证: `node --check` 通过；Playwright MCP 打开页面成功；页面内检查共享独立行为 0、主按钮区删除为 0、旧建聊文案为 false。

## 开发使用方式

1. 先读取 PRD，确认功能入口和页面边界。
2. 以本地设计源 Handoff 区和 `lifetracker-v1.4-complete-interaction-map.css` 映射 `frontend/constants/theme.ts`。
3. 用户确认完整交互地图前，不得继续第三阶段编码。
4. 按完整交互地图逐屏实现，优先复用项目已有 UI 组件。
5. 实现后用设计源截图与浏览器/移动端截图对比颜色、字号、间距、圆角、组件层级。
6. 未经确认，不新增 Tab、不新增“更多工具”、不恢复物品/待办一级 Tab、不新增详情页视觉。
