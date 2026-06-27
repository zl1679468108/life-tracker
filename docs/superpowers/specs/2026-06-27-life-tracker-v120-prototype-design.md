---
name: life-tracker-v1.2.0-html-prototype
description: 交互式 HTML 原型设计 — SPA 架构，覆盖首页/工作台/消息/我的四大 Tab
metadata:
  type: project
  version: 1.2.0
  format: react-style-multi-file-spa
---

## 概述
构建 LifeTracker v1.2.0 的交互式 HTML 原型，采用单页应用 (SPA) 架构。

## 文件结构
```
prototypes/v1.2.0/
├── index.html              # SPA 入口，底部 Tab 导航壳
├── css/
│   ├── main.css            # 全局样式（色彩/字体/间距）
│   ├── tabs.css            # Tab 页面通用布局
│   ├── home.css            # 首页专属
│   ├── workbench.css       # 工作台专属
│   ├── messages.css        # 消息页专属
│   └── settings.css        # 设置页专属
├── js/
│   ├── app.js              # 路由/Tab 切换/全局状态
│   ├── home.js             # 首页交互
│   ├── workbench.js        # 工作台交互
│   ├── messages.js         # 消息页交互
│   └── settings.js         # 设置页交互
└── data/
    └── mock.js             # Mock 数据
```

## 核心页面
1. **首页**: 问候语 + 统计卡片(纯展示) + 快捷操作 + 最近待办
2. **工作台**: 分段控制器(物品/待办) + 搜索/筛选/排序 + 列表 + FAB + 功能卡片矩阵
3. **消息**: 对话列表 + 对话详情(卡片消息/文字气泡) + 新建对话
4. **我的**: 个人信息 + 分组设置列表

## 交互
- 底部 Tab 切换 + 过渡动画
- 工作台分段控制器
- 搜索框聚焦高亮 + 清除
- 分类 Chips 横向滚动
- 待办快速勾选
- FAB 弹出表单模态框
- 对话详情页面推入动画
- 通知铃铛抖动

## 视觉规范 (来自 PRD §7)
- 主色: #FF6B35
- 辅助色: #7C5CFC
- 成功: #10B981, 警告: #F59E0B, 危险: #EF4444
- 字体: 10px-28px 分级
- 圆角: 8px-28px
