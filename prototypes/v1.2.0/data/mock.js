// Mock Data — v1.2.0 Redesigned: 社交化消息模块 + 丰富好友数据

const currentUser = {
  id: 'user-001',
  email: 'zhaolong@example.com',
  display_name: '赵龙',
  avatar_url: null,
};

// ========== 分类 ==========
const categories = [
  { id: 'cat-1', name: '电子产品', color: '#3B82F6', icon: 'monitor', type: 'item', preset: true },
  { id: 'cat-2', name: '书籍', color: '#10B981', icon: 'book-open', type: 'item', preset: true },
  { id: 'cat-3', name: '日用品', color: '#F59E0B', icon: 'shopping', type: 'item', preset: true },
  { id: 'cat-4', name: '衣物', color: '#8B5CF6', icon: 'tshirt-crest', type: 'item', preset: true },
  { id: 'cat-5', name: '其他', color: '#6B7280', icon: 'dots-circle', type: 'item', preset: true },
  { id: 'cat-6', name: '工作', color: '#EF4444', icon: 'briefcase', type: 'todo', preset: false },
  { id: 'cat-7', name: '学习', color: '#06B6D4', icon: 'school', type: 'todo', preset: false },
];

// ========== 位置 ==========
const locations = [
  { id: 'loc-1', name: '书房', icon: 'desk-lamp', parentId: null, preset: true },
  { id: 'loc-2', name: '卧室', icon: 'bed', parentId: null, preset: true },
  { id: 'loc-3', name: '客厅', icon: 'sofa', parentId: null, preset: true },
  { id: 'loc-4', name: '厨房', icon: 'pot', parentId: null, preset: true },
  { id: 'loc-5', name: '随身', icon: 'watch-vanish', parentId: null, preset: true },
  { id: 'loc-6', name: '书桌', icon: 'table-chair', parentId: 'loc-1', preset: false },
  { id: 'loc-7', name: '衣柜', icon: 'wardrobe', parentId: 'loc-2', preset: false },
];

// ========== 物品 ==========
const items = [
  {
    id: 'item-1', name: 'MacBook Pro 14"', category: '电子产品', location: '书房 > 书桌',
    description: '2024 款 M3 Pro, 18GB/512GB, 深空黑色',
    images: [], createdAt: '2026-05-10T08:30:00Z', updatedAt: '2026-06-20T14:00:00Z',
    barcode: null,
  },
  {
    id: 'item-2', name: 'Sony WH-1000XM5', category: '电子产品', location: '随身',
    description: '降噪耳机，黑色，2023 年购入',
    images: [], createdAt: '2026-04-15T10:00:00Z', updatedAt: '2026-04-15T10:00:00Z',
    barcode: '1234567890',
  },
  {
    id: 'item-3', name: '《设计模式》', category: '书籍', location: '书房 > 书桌',
    description: 'GoF 著，中文版，第 2 版',
    images: [], createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-03-20T09:00:00Z',
    barcode: null,
  },
  {
    id: 'item-4', name: '雨伞', category: '日用品', location: '客厅',
    description: '全自动折叠伞，放在玄关柜子上',
    images: [], createdAt: '2026-06-01T07:00:00Z', updatedAt: '2026-06-01T07:00:00Z',
    barcode: null,
  },
  {
    id: 'item-5', name: '冬季羽绒服', category: '衣物', location: '卧室 > 衣柜',
    description: '北面 1996 款，黑色 M 码',
    images: [], createdAt: '2026-01-15T12:00:00Z', updatedAt: '2026-01-15T12:00:00Z',
    barcode: null,
  },
  {
    id: 'item-6', name: 'iPad Air', category: '电子产品', location: '书房 > 书桌',
    description: 'M2 芯片, 256GB, 星光色',
    images: [], createdAt: '2026-05-20T16:00:00Z', updatedAt: '2026-05-20T16:00:00Z',
    barcode: null,
  },
  {
    id: 'item-7', name: '充电宝', category: '日用品', location: '随身',
    description: '小米 20000mAh, 白色',
    images: [], createdAt: '2026-06-10T11:00:00Z', updatedAt: '2026-06-10T11:00:00Z',
    barcode: null,
  },
];

// ========== 待办 ==========
const todos = [
  {
    id: 'todo-1', title: '完成 Q3 季度报告', priority: 3, completed: false,
    description: '包含上半年总结和下半年计划', deadline: '2026-07-01', categoryId: 'cat-6',
    createdAt: '2026-06-25T09:00:00Z', reminder: '2026-06-30T09:00:00Z',
  },
  {
    id: 'todo-2', title: '预约牙医', priority: 2, completed: false,
    description: '定期洗牙', deadline: '2026-07-05', categoryId: null,
    createdAt: '2026-06-20T14:00:00Z', reminder: '2026-07-04T10:00:00Z',
  },
  {
    id: 'todo-3', title: '阅读《重构》第 1-5 章', priority: 1, completed: false,
    description: '', deadline: '2026-07-10', categoryId: 'cat-7',
    createdAt: '2026-06-18T10:00:00Z', reminder: null,
  },
  {
    id: 'todo-4', title: '缴纳水电费', priority: 3, completed: true,
    description: '6 月账单已出', deadline: '2026-06-25', categoryId: null,
    createdAt: '2026-06-15T08:00:00Z', reminder: '2026-06-24T09:00:00Z',
  },
  {
    id: 'todo-5', title: '整理电脑文件', priority: 1, completed: true,
    description: '清理桌面和下载文件夹', deadline: '2026-06-28', categoryId: 'cat-6',
    createdAt: '2026-06-10T16:00:00Z', reminder: null,
  },
  {
    id: 'todo-6', title: '买生日礼物', priority: 2, completed: false,
    description: '给妈妈的生日礼物还没买', deadline: '2026-07-15', categoryId: null,
    createdAt: '2026-06-22T11:00:00Z', reminder: '2026-07-10T09:00:00Z',
  },
];

// ========== 好友数据（新增） ==========
const friends = [
  { id: 'user-002', display_name: '李明', email: 'liming@example.com', avatar: null, online: true, gradient: 'var(--primary-gradient)' },
  { id: 'user-003', display_name: '王芳', email: 'wangfang@example.com', avatar: null, online: true, gradient: 'var(--secondary-gradient)' },
  { id: 'user-004', display_name: '张伟', email: 'zhangwei@example.com', avatar: null, online: false, gradient: 'var(--success-gradient)' },
  { id: 'user-005', display_name: '刘洋', email: 'liuyang@example.com', avatar: null, online: true, gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)' },
  { id: 'user-006', display_name: '陈静', email: 'chenjing@example.com', avatar: null, online: false, gradient: 'linear-gradient(135deg, #EF4444, #F87171)' },
  { id: 'user-007', display_name: '周杰', email: 'zhoujie@example.com', avatar: null, online: true, gradient: 'linear-gradient(135deg, #3B82F6, #60A5FA)' },
];

// 推荐用户（用于搜索）
const suggestedUsers = [
  { id: 'user-008', display_name: '吴敏', email: 'wumin@example.com', avatar: null, gradient: 'linear-gradient(135deg, #EC4899, #F472B6)' },
  { id: 'user-009', display_name: '郑浩', email: 'zhenghao@example.com', avatar: null, gradient: 'linear-gradient(135deg, #14B8A6, #2DD4BF)' },
  { id: 'user-010', display_name: '孙丽', email: 'sunli@example.com', avatar: null, gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)' },
];

// ========== 对话 ==========
const conversations = [
  {
    id: 'conv-1', participantId: 'user-002', participantName: '李明',
    participantAvatar: null, lastMessageType: 'item', lastMessageContent: '分享了一个物品: MacBook Pro 14"',
    lastMessageAt: '2026-06-27T10:30:00Z', unreadCount: 2, online: true,
  },
  {
    id: 'conv-2', participantId: 'user-003', participantName: '王芳',
    participantAvatar: null, lastMessageType: 'todo', lastMessageContent: '分享了一个待办: 完成 Q3 季度报告',
    lastMessageAt: '2026-06-26T18:00:00Z', unreadCount: 0, online: true,
  },
  {
    id: 'conv-3', participantId: 'user-004', participantName: '张伟',
    participantAvatar: null, lastMessageType: 'text', lastMessageContent: '好的，谢谢！',
    lastMessageAt: '2026-06-25T14:20:00Z', unreadCount: 1, online: false,
  },
  {
    id: 'conv-4', participantId: 'user-005', participantName: '刘洋',
    participantAvatar: null, lastMessageType: 'text', lastMessageContent: '明天一起吃饭吧 🍜',
    lastMessageAt: '2026-06-24T20:00:00Z', unreadCount: 0, online: true,
  },
  {
    id: 'conv-5', participantId: 'user-006', participantName: '陈静',
    participantAvatar: null, lastMessageType: 'system', lastMessageContent: '你的物品"雨伞"即将过期',
    lastMessageAt: '2026-06-23T09:00:00Z', unreadCount: 0, online: false,
  },
];

// ========== 消息 ==========
const messages = {
  'conv-1': [
    { id: 'msg-1', conversationId: 'conv-1', senderId: 'user-001', type: 'text', content: '李明，我的 MacBook Pro 你借去用啦？', createdAt: '2026-06-27T09:00:00Z' },
    { id: 'msg-2', conversationId: 'conv-1', senderId: 'user-002', type: 'text', content: '对啊，这周需要用它做演示', createdAt: '2026-06-27T09:15:00Z' },
    { id: 'msg-3', conversationId: 'conv-1', senderId: 'user-001', type: 'item', resourceType: 'item', resourceId: 'item-1', cardData: { name: 'MacBook Pro 14"', location: '书房 > 书桌', category: '电子产品' }, content: '在你桌上那个就是，记得用完还我哈', createdAt: '2026-06-27T10:30:00Z' },
  ],
  'conv-2': [
    { id: 'msg-4', conversationId: 'conv-2', senderId: 'user-003', type: 'todo', resourceType: 'todo', resourceId: 'todo-1', cardData: { title: '完成 Q3 季度报告', priority: 3 }, content: '这个报告你能帮我看看吗？', createdAt: '2026-06-26T18:00:00Z' },
    { id: 'msg-5', conversationId: 'conv-2', senderId: 'user-001', type: 'text', content: '没问题，明天给你反馈', createdAt: '2026-06-26T18:30:00Z' },
  ],
  'conv-3': [
    { id: 'msg-6', conversationId: 'conv-3', senderId: 'user-004', type: 'text', content: '你好，我想借一下你的充电宝', createdAt: '2026-06-25T14:00:00Z' },
    { id: 'msg-7', conversationId: 'conv-3', senderId: 'user-001', type: 'text', content: '可以的，明天上班带给你', createdAt: '2026-06-25T14:10:00Z' },
    { id: 'msg-8', conversationId: 'conv-3', senderId: 'user-004', type: 'text', content: '好的，谢谢！', createdAt: '2026-06-25T14:20:00Z' },
  ],
  'conv-4': [
    { id: 'msg-9', conversationId: 'conv-4', senderId: 'user-005', type: 'text', content: '周末有什么安排？', createdAt: '2026-06-24T19:00:00Z' },
    { id: 'msg-10', conversationId: 'conv-4', senderId: 'user-001', type: 'text', content: '还没想好呢，你有什么建议？', createdAt: '2026-06-24T19:30:00Z' },
    { id: 'msg-11', conversationId: 'conv-4', senderId: 'user-005', type: 'text', content: '明天一起吃饭吧 🍜', createdAt: '2026-06-24T20:00:00Z' },
  ],
  'conv-5': [
    { id: 'msg-12', conversationId: 'conv-5', senderId: 'system', type: 'system', content: '你的物品"雨伞"即将过期，请及时处理。', createdAt: '2026-06-23T09:00:00Z' },
  ],
};

// ========== 通知 ==========
const notifications = [
  { id: 'n-1', type: 'todo', title: '待办提醒', content: '完成 Q3 季度报告', subtitle: '截止: 2026-07-01', read: false, createdAt: '2026-06-27T08:00:00Z', link: null },
  { id: 'n-2', type: 'todo', title: '待办提醒', content: '预约牙医', subtitle: '截止: 2026-07-05', read: false, createdAt: '2026-06-27T08:00:00Z', link: null },
  { id: 'n-3', type: 'system', title: '系统通知', content: '欢迎使用 LifeTracker v1.2.0', subtitle: '', read: true, createdAt: '2026-06-20T10:00:00Z', link: null },
  { id: 'n-4', type: 'share', title: '收到分享', content: '李明 分享了物品: MacBook Pro 14"', subtitle: '', read: false, createdAt: '2026-06-27T10:30:00Z', link: 'conv-1' },
];

// ========== 统计数据 ==========
const stats = {
  totalItems: items.length,
  totalTodos: todos.length,
  completedTodos: todos.filter(t => t.completed).length,
  pendingTodos: todos.filter(t => !t.completed).length,
  completionRate: Math.round((todos.filter(t => t.completed).length / todos.length) * 100),
  itemsByCategory: {
    '电子产品': 3, '书籍': 1, '日用品': 2, '衣物': 1, '其他': 0,
  },
  weeklyCompletion: [2, 1, 3, 0, 2, 4, 1],
};
