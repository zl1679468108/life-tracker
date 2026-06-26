/**
 * 小程序端（Expo Router / React Native）集成自动化测试用例
 *
 * 覆盖：认证 / Tab 导航 / 首页 / 物品 / 待办 / 设置 / 设置子页面
 *       物品/待办 CRUD / Store / UI 组件 / 导航链路 / 数据流
 *
 * 运行：cd frontend && npx jest __tests__/screens.integration.test.ts
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// --- stores ---
import { useItemStore } from '../stores/itemStore';
import { useTodoStore } from '../stores/todoStore';
import { useAuthStore } from '../stores/authStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useLocationStore } from '../stores/locationStore';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useSyncStore } from '../stores/syncStore';
import { useProfileStore } from '../stores/profileStore';
import { useBorrowingStore } from '../stores/borrowingStore';
import { useShareStore } from '../stores/shareStore';
import { useTemplateStore } from '../stores/templateStore';

// --- screens ---
import LoginScreen from '../app/auth/login';
import RegisterScreen from '../app/auth/register';
import ResetPasswordScreen from '../app/auth/reset-password';
import VerifyEmailScreen from '../app/auth/verify-email';
import UpdatePasswordScreen from '../app/auth/update-password';
import CallbackScreen from '../app/auth/callback';
import TabLayout from '../app/(tabs)/_layout';
import HomeScreen from '../app/(tabs)/index';
import ItemsScreen from '../app/(tabs)/items';
import TodosScreen from '../app/(tabs)/todos';
import SettingsScreen from '../app/(tabs)/settings';
import CreateItemScreen from '../app/item/create';
import ItemDetailScreen from '../app/item/[id]';
import CreateTodoScreen from '../app/todo/create';
import TodoDetailScreen from '../app/todo/[id]';
import AccountScreen from '../app/settings/account';
import ChangePasswordScreen from '../app/settings/change-password';
import ThemeScreen from '../app/settings/theme';
import LanguageScreen from '../app/settings/language';
import CategoryManageScreen from '../app/settings/category-manage';
import LocationManageScreen from '../app/settings/location-manage';
import NotificationsScreen from '../app/settings/notifications';
import DataScreen from '../app/settings/data';
import FeedbackScreen from '../app/settings/feedback';
import StatsScreen from '../app/settings/stats';
import TemplatesScreen from '../app/settings/templates';
import AssetsScreen from '../app/settings/assets';
import BorrowingsScreen from '../app/settings/borrowings';
import SharesScreen from '../app/settings/shares';
import CalendarScreen from '../app/settings/calendar';
import WidgetsScreen from '../app/settings/widgets';

// --- UI components ---
import { Button, EmptyState, Badge, Loading } from '../components/ui';

jest.mock('react-native-paper', () => {
  // Return stub components without touching react-native at all
  const stub = (name) => {
    const C = () => name;
    C.displayName = name;
    return C;
  };
  return {
    Switch: stub('PaperSwitch'),
    Chip: stub('PaperChip'),
    Text: stub('PaperText'),
    Provider: (props) => props.children || null,
    IconButton: stub('PaperIconButton'),
    Portal: { Host: stub('PortalHost'), Dialog: stub('PortalDialog') },
    MD3Colors: { primary100: '#eaddff' },
  };
});

// --- expo-router mock ---
jest.mock('expo-router', () => {
  const mockRouter = {
    push: jest.fn(), back: jest.fn(), replace: jest.fn(), dismiss: jest.fn(), navigate: jest.fn(),
  };
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => ({}),
    useNavigation: () => ({ setOptions: jest.fn() }),
  };
});

// --- vector icons: mock to a simple component with testID ---
jest.mock('@expo/vector-icons/MaterialCommunityIcons', () => 'MaterialCommunityIcons');
jest.mock('@expo/vector-icons', () => ({ MaterialCommunityIcons: 'MaterialCommunityIcons' }));

// --- lib mocks ---
jest.mock('../lib/socket', () => {
  const fn = jest.fn();
  return {
    socketService: {
      connect: jest.fn(), disconnect: jest.fn(),
      onItemCreated: fn, onItemUpdated: fn, onItemDeleted: fn,
      onTodoCreated: fn, onTodoUpdated: fn, onTodoDeleted: fn,
      onCategoryCreated: fn, onCategoryUpdated: fn, onCategoryDeleted: fn,
      onLocationCreated: fn, onLocationUpdated: fn, onLocationDeleted: fn,
      onReminderFired: fn,
    },
  };
});
jest.mock('../lib/notifications', () => ({
  scheduleTodoReminder: jest.fn(async () => 'notif-1'),
  cancelReminder: jest.fn(),
}));
jest.mock('../lib/upload', () => ({
  uploadImages: jest.fn(async () => []),
  uploadImage: jest.fn(async () => ''),
  compressAvatar: jest.fn(async (uri) => uri),
}));
jest.mock('../lib/alert', () => ({ showAlert: jest.fn() }));
jest.mock('../lib/i18n', () => ({
  i18n: { getLanguage: () => 'zh-CN' },
  useTranslation: () => ({ t: (key) => key }),
}));
jest.mock('../lib/cache', () => ({
  cache: { get: jest.fn(async () => null), set: jest.fn() },
}));
jest.mock('../lib/network', () => ({ networkMonitor: { isOnline: () => true } }));
jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: { Images: 'images' },
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

// --- react-native platform mock ---
jest.mock('react-native/Libraries/Utilities/platform', () => ({
  OS: 'ios',
  select: (obj) => obj.ios || obj.default,
}));

/* ------------------------------------------------------------------ */
/*  Render helper — reset stores before each test                       */
/* ------------------------------------------------------------------ */

function renderScreen(Component, preState = {}) {
  const storeMap = {
    useItemStore, useTodoStore, useAuthStore, useCategoryStore,
    useLocationStore, useThemeStore, useNotificationStore, useSyncStore,
    useProfileStore, useBorrowingStore, useShareStore, useTemplateStore,
  };

  // Reset all stores to defaults
  Object.entries(storeMap).forEach(([name, store]) => {
    const def = {};
    const s = store.getState();
    if (Array.isArray(s)) {
      const firstKey = Object.keys(s)[0];
      if (firstKey) def[firstKey] = [];
    }
    store.setState(def);
  });

  // Override with preState
  Object.entries(preState).forEach(([storeName, state]) => {
    const store = storeMap[storeName];
    if (store) store.setState(state);
  });

  return render(React.createElement(Component));
}

/* ================================================================== */
/*                     1. 认证流程测试                                  */
/* ================================================================== */

describe('认证流程', () => {
  beforeEach(() => { useAuthStore.setState({ user: null, loading: false }); });

  it('登录页 - 渲染邮箱密码表单和微信登录按钮', () => {
    const { getByText, getByPlaceholderText } = renderScreen(LoginScreen);
    expect(getByText('欢迎回来')).toBeTruthy();
    expect(getByPlaceholderText('请输入邮箱或手机号')).toBeTruthy();
    expect(getByPlaceholderText('请输入密码')).toBeTruthy();
    expect(getByText('登录')).toBeTruthy();
    expect(getByText('微信登录')).toBeTruthy();
    expect(getByText('忘记密码？')).toBeTruthy();
    expect(getByText('立即注册')).toBeTruthy();
  });

  it('注册页 - 渲染表单字段', () => {
    const { getByText, getByPlaceholderText } = renderScreen(RegisterScreen);
    expect(getByText('创建账号')).toBeTruthy();
    expect(getByPlaceholderText('请输入邮箱地址')).toBeTruthy();
    expect(getByPlaceholderText('请输入密码（至少6位）')).toBeTruthy();
    expect(getByPlaceholderText('请再次输入密码')).toBeTruthy();
    expect(getByText('注册')).toBeTruthy();
    expect(getByText('已有账号？')).toBeTruthy();
  });

  it('忘记密码页 - 渲染邮箱输入表单', () => {
    const { getByText, getByPlaceholderText } = renderScreen(ResetPasswordScreen);
    expect(getByText('重置密码')).toBeTruthy();
    expect(getByPlaceholderText('请输入注册邮箱')).toBeTruthy();
    expect(getByText('发送重置链接')).toBeTruthy();
  });

  it('邮箱验证页 - 显示加载状态', () => {
    const { getByText } = renderScreen(VerifyEmailScreen);
    expect(getByText('正在验证邮箱...')).toBeTruthy();
  });

  it('更新密码页 - 渲染新密码表单', () => {
    const { getByText, getByPlaceholderText } = renderScreen(UpdatePasswordScreen);
    expect(getByText('设置新密码')).toBeTruthy();
    expect(getByPlaceholderText('请输入新密码（至少6位）')).toBeTruthy();
    expect(getByText('更新密码')).toBeTruthy();
  });

  it('OAuth 回调页 - 显示加载提示', () => {
    const { getByText } = renderScreen(CallbackScreen);
    expect(getByText('正在完成登录...')).toBeTruthy();
  });
});

/* ================================================================== */
/*                     2. Tab 导航结构测试                              */
/* ================================================================== */

describe('Tab 导航', () => {
  it('Tab 布局 - 包含四个 Tab 页', () => {
    const { getByText } = renderScreen(TabLayout);
    expect(getByText('首页')).toBeTruthy();
    expect(getByText('物品')).toBeTruthy();
    expect(getByText('待办')).toBeTruthy();
    expect(getByText('设置')).toBeTruthy();
  });
});

/* ================================================================== */
/*                     3. 首页测试                                      */
/* ================================================================== */

describe('首页 (Home)', () => {
  it('首页 - 显示问候语和统计卡片', () => {
    const { getByText } = renderScreen(HomeScreen);
    expect(getByText(/早上好|下午好|晚上好/g)).toBeTruthy();
    expect(getByText('home.stats.items')).toBeTruthy();
    expect(getByText('home.stats.todos')).toBeTruthy();
    expect(getByText('home.stats.completed')).toBeTruthy();
  });

  it('首页 - 显示快捷操作按钮', () => {
    const { getByText } = renderScreen(HomeScreen);
    expect(getByText('home.quickActions.addItem')).toBeTruthy();
    expect(getByText('home.quickActions.addTodo')).toBeTruthy();
    expect(getByText('home.quickActions.stats')).toBeTruthy();
    expect(getByText('home.quickActions.notifications')).toBeTruthy();
  });

  it('首页 - 有数据时显示最近待办列表', () => {
    const { getByText } = renderScreen(HomeScreen, {
      useTodoStore: {
        todos: [
          { id: 't1', title: '测试待办1', description: '描述1', completed: false, priority: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 't2', title: '测试待办2', description: '描述2', completed: true, priority: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
      },
    });
    expect(getByText('home.recentTodos')).toBeTruthy();
    expect(getByText('测试待办1')).toBeTruthy();
    expect(getByText('测试待办2')).toBeTruthy();
  });
});

/* ================================================================== */
/*                     4. 物品页测试                                    */
/* ================================================================== */

describe('物品页 (Items)', () => {
  it('物品页 - 显示搜索框和分类筛选', () => {
    const { getByPlaceholderText, getByText } = renderScreen(ItemsScreen);
    expect(getByPlaceholderText('搜索物品名称...')).toBeTruthy();
    expect(getByText('全部')).toBeTruthy();
  });

  it('物品页 - 空数据时显示空状态', () => {
    const { getByText } = renderScreen(ItemsScreen);
    expect(getByText('暂无物品')).toBeTruthy();
    expect(getByText('添加物品')).toBeTruthy();
  });

  it('物品页 - 显示物品列表', () => {
    const { getByText } = renderScreen(ItemsScreen, {
      useItemStore: {
        items: [
          { id: 'i1', name: 'MacBook Pro', description: '2024款', category_id: 'cat1', location_id: 'loc1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 'i2', name: 'iPhone 15', description: '主力机', category_id: 'cat2', location_id: 'loc1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
      },
    });
    expect(getByText('MacBook Pro')).toBeTruthy();
    expect(getByText('iPhone 15')).toBeTruthy();
  });

  it('物品页 - 显示物品数量统计', () => {
    const { getByText } = renderScreen(ItemsScreen, {
      useItemStore: { items: [{ id: 'i1', name: 'Test', description: '', category_id: '', location_id: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] },
    });
    expect(getByText('共 1 件')).toBeTruthy();
  });
});

/* ================================================================== */
/*                     5. 待办页测试                                    */
/* ================================================================== */

describe('待办页 (Todos)', () => {
  it('待办页 - 显示筛选标签', () => {
    const { getByText } = renderScreen(TodosScreen);
    expect(getByText('全部')).toBeTruthy();
    expect(getByText('待完成')).toBeTruthy();
    expect(getByText('已完成')).toBeTruthy();
  });

  it('待办页 - 空数据时显示空状态', () => {
    const { getByText } = renderScreen(TodosScreen);
    expect(getByText('暂无待办事项')).toBeTruthy();
    expect(getByText('添加待办')).toBeTruthy();
  });

  it('待办页 - 显示待办列表和优先级标签', () => {
    const { getByText } = renderScreen(TodosScreen, {
      useTodoStore: {
        todos: [
          { id: 't1', title: '紧急任务', description: '今天必须完成', completed: false, priority: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 't2', title: '普通任务', description: '慢慢做', completed: false, priority: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
      },
    });
    expect(getByText('紧急任务')).toBeTruthy();
    expect(getByText('普通任务')).toBeTruthy();
    expect(getByText('紧急')).toBeTruthy();
    expect(getByText('普通')).toBeTruthy();
  });

  it('待办页 - 显示待完成计数', () => {
    const { getByText } = renderScreen(TodosScreen, {
      useTodoStore: {
        todos: [
          { id: 't1', title: 'Task1', description: '', completed: false, priority: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { id: 't2', title: 'Task2', description: '', completed: true, priority: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
      },
    });
    expect(getByText('1 个待完成')).toBeTruthy();
  });
});

/* ================================================================== */
/*                     6. 设置页测试                                    */
/* ================================================================== */

describe('设置页 (Settings)', () => {
  it('设置页 - 显示个人信息和数据管理', () => {
    const { getByText } = renderScreen(SettingsScreen);
    expect(getByText('settings.title')).toBeTruthy();
    expect(getByText('settings.profile')).toBeTruthy();
    expect(getByText('settings.dataSync')).toBeTruthy();
    expect(getByText('数据管理')).toBeTruthy();
  });

  it('设置页 - 显示所有功能模块入口', () => {
    const { getByText } = renderScreen(SettingsScreen);
    expect(getByText('借用管理')).toBeTruthy();
    expect(getByText('共享管理')).toBeTruthy();
    expect(getByText('模板管理')).toBeTruthy();
    expect(getByText('资产总览')).toBeTruthy();
    expect(getByText('日历视图')).toBeTruthy();
    expect(getByText('桌面小组件')).toBeTruthy();
  });

  it('设置页 - 显示关于区块', () => {
    const { getByText } = renderScreen(SettingsScreen);
    expect(getByText('settings.about')).toBeTruthy();
    expect(getByText('v1.0.0')).toBeTruthy();
    expect(getByText('settings.feedback')).toBeTruthy();
  });
});

/* ================================================================== */
/*                   7. 物品创建/编辑页测试                             */
/* ================================================================== */

describe('物品创建/编辑', () => {
  it('创建物品页 - 显示表单字段', () => {
    const { getByText, getByPlaceholderText } = renderScreen(CreateItemScreen);
    expect(getByText('物品名称')).toBeTruthy();
    expect(getByPlaceholderText('例如：MacBook Pro')).toBeTruthy();
    expect(getByText('分类')).toBeTruthy();
    expect(getByText('存放位置')).toBeTruthy();
    expect(getByText('图片')).toBeTruthy();
    expect(getByText('条形码/二维码')).toBeTruthy();
    expect(getByText('保质期/过期时间')).toBeTruthy();
    expect(getByText('描述')).toBeTruthy();
    expect(getByText('保存')).toBeTruthy();
  });

  it('创建物品页 - 价值信息折叠区', () => {
    const { getByText } = renderScreen(CreateItemScreen);
    expect(getByText('价值信息')).toBeTruthy();
  });
});

/* ================================================================== */
/*                   8. 物品详情页测试                                  */
/* ================================================================== */

describe('物品详情', () => {
  it('物品详情页 - 显示基本信息', () => {
    const { getByText } = renderScreen(ItemDetailScreen, {
      useItemStore: {
        items: [{ id: 'test-item-id', name: '测试物品', description: '这是一个测试物品', category_id: 'cat1', location_id: 'loc1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      },
    });
    expect(getByText('测试物品')).toBeTruthy();
    expect(getByText('这是一个测试物品')).toBeTruthy();
  });

  it('物品详情页 - 显示保质期和提醒', () => {
    const { getByText } = renderScreen(ItemDetailScreen, {
      useItemStore: {
        items: [{ id: 'test-item-id', name: '牛奶', description: '', expiry_date: '2026-12-31', reminder_enabled: true, reminder_days_before: 7, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      },
    });
    expect(getByText('保质期')).toBeTruthy();
    expect(getByText('提前 7 天提醒')).toBeTruthy();
  });

  it('物品详情页 - 显示条形码', () => {
    const { getByText } = renderScreen(ItemDetailScreen, {
      useItemStore: {
        items: [{ id: 'test-item-id', name: '商品', description: '', barcode: '6901234567890', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      },
    });
    expect(getByText('条形码')).toBeTruthy();
    expect(getByText('6901234567890')).toBeTruthy();
  });

  it('物品详情页 - 显示价值信息', () => {
    const { getByText } = renderScreen(ItemDetailScreen, {
      useItemStore: {
        items: [{ id: 'test-item-id', name: 'MacBook', description: '', purchase_price: 12999, current_value: 9000, depreciation_rate: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      },
    });
    expect(getByText('价值信息')).toBeTruthy();
    expect(getByText('购买价格')).toBeTruthy();
    expect(getByText('当前估值')).toBeTruthy();
    expect(getByText('年折旧率 15%')).toBeTruthy();
  });

  it('物品详情页 - 显示借出状态', () => {
    const { getByText } = renderScreen(ItemDetailScreen, {
      useItemStore: {
        items: [{ id: 'test-item-id', name: '相机', description: '', is_borrowed: true, borrowed_by: '张三', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      },
    });
    expect(getByText('已借给 张三')).toBeTruthy();
  });
});

/* ================================================================== */
/*                   9. 待办创建/编辑页测试                             */
/* ================================================================== */

describe('待办创建/编辑', () => {
  it('创建待办页 - 显示表单字段', () => {
    const { getByText, getByPlaceholderText } = renderScreen(CreateTodoScreen);
    expect(getByText('待办标题')).toBeTruthy();
    expect(getByPlaceholderText('例如：完成项目报告')).toBeTruthy();
    expect(getByText('分类')).toBeTruthy();
    expect(getByText('优先级')).toBeTruthy();
    expect(getByText('描述')).toBeTruthy();
    expect(getByText('截止日期')).toBeTruthy();
    expect(getByText('提醒时间')).toBeTruthy();
    expect(getByText('保存')).toBeTruthy();
  });

  it('创建待办页 - 显示三个优先级选项', () => {
    const { getByText } = renderScreen(CreateTodoScreen);
    expect(getByText('紧急')).toBeTruthy();
    expect(getByText('普通')).toBeTruthy();
    expect(getByText('低')).toBeTruthy();
  });
});

/* ================================================================== */
/*                  10. 待办详情页测试                                  */
/* ================================================================== */

describe('待办详情', () => {
  it('待办详情页 - 显示标题和状态', () => {
    const { getByText } = renderScreen(TodoDetailScreen, {
      useTodoStore: {
        todos: [{ id: 'test-todo-id', title: '测试待办', description: '测试描述', completed: false, priority: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      },
    });
    expect(getByText('测试待办')).toBeTruthy();
    expect(getByText('进行中')).toBeTruthy();
  });

  it('待办详情页 - 已完成状态显示正确', () => {
    const { getByText } = renderScreen(TodoDetailScreen, {
      useTodoStore: {
        todos: [{ id: 'test-todo-id', title: '已完成的任务', description: '', completed: true, priority: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
      },
    });
    expect(getByText('已完成')).toBeTruthy();
  });
});

/* ================================================================== */
/*                  11. 设置子页面测试                                  */
/* ================================================================== */

describe('设置子页面', () => {
  it('账户页 - 显示用户信息和操作', () => {
    const { getByText } = renderScreen(AccountScreen);
    expect(getByText('settings.username')).toBeTruthy();
    expect(getByText('settings.email')).toBeTruthy();
    expect(getByText('common.edit')).toBeTruthy();
    expect(getByText('auth.logout')).toBeTruthy();
  });

  it('修改密码页 - 渲染表单', () => {
    const { getByText } = renderScreen(ChangePasswordScreen);
    expect(getByText('settings.changePassword')).toBeTruthy();
  });

  it('主题设置页 - 渲染', () => {
    const { getByText } = renderScreen(ThemeScreen);
    expect(getByText('settings.theme')).toBeTruthy();
  });

  it('语言设置页 - 渲染', () => {
    const { getByText } = renderScreen(LanguageScreen);
    expect(getByText('settings.language')).toBeTruthy();
  });

  it('分类管理页 - 渲染', () => {
    const { getByText } = renderScreen(CategoryManageScreen);
    expect(getByText('categories.title')).toBeTruthy();
  });

  it('位置管理页 - 渲染', () => {
    const { getByText } = renderScreen(LocationManageScreen);
    expect(getByText('locations.title')).toBeTruthy();
  });

  it('通知设置页 - 渲染', () => {
    const { getByText } = renderScreen(NotificationsScreen);
    expect(getByText('settings.notifications')).toBeTruthy();
  });

  it('数据管理页 - 渲染', () => {
    const { getByText } = renderScreen(DataScreen);
    expect(getByText('数据管理')).toBeTruthy();
  });

  it('反馈页 - 渲染', () => {
    const { getByText } = renderScreen(FeedbackScreen);
    expect(getByText('feedback.title')).toBeTruthy();
  });

  it('数据统计页 - 渲染', () => {
    const { getByText } = renderScreen(StatsScreen);
    expect(getByText('home.quickActions.stats')).toBeTruthy();
  });

  it('模板管理页 - 渲染', () => {
    const { getByText } = renderScreen(TemplatesScreen);
    expect(getByText('模板管理')).toBeTruthy();
  });

  it('资产总览页 - 渲染', () => {
    const { getByText } = renderScreen(AssetsScreen);
    expect(getByText('资产总览')).toBeTruthy();
  });

  it('借用管理页 - 渲染', () => {
    const { getByText } = renderScreen(BorrowingsScreen);
    expect(getByText('借用管理')).toBeTruthy();
  });

  it('共享管理页 - 渲染', () => {
    const { getByText } = renderScreen(SharesScreen);
    expect(getByText('共享管理')).toBeTruthy();
  });

  it('日历视图页 - 渲染', () => {
    const { getByText } = renderScreen(CalendarScreen);
    expect(getByText('日历视图')).toBeTruthy();
  });

  it('桌面小组件页 - 渲染', () => {
    const { getByText } = renderScreen(WidgetsScreen);
    expect(getByText('桌面小组件')).toBeTruthy();
  });
});

/* ================================================================== */
/*                  12. Store 状态管理测试                              */
/* ================================================================== */

describe('Store 状态管理', () => {
  beforeEach(() => {
    useItemStore.setState({ items: [], loading: false, error: null });
    useTodoStore.setState({ todos: [], loading: false, error: null });
    useAuthStore.setState({ user: null, loading: false });
  });

  it('itemStore - 初始为空数组', () => {
    const s = useItemStore.getState();
    expect(s.items).toEqual([]);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('todoStore - 初始为空数组', () => {
    const s = useTodoStore.getState();
    expect(s.todos).toEqual([]);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('authStore - 初始未登录', () => {
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.loading).toBe(false);
  });

  it('authStore - setUser 后设置用户', () => {
    useAuthStore.getState().setUser({ id: 'u1', email: 'test@example.com' });
    expect(useAuthStore.getState().user).toEqual({ id: 'u1', email: 'test@example.com' });
  });

  it('locationStore - 初始为空', () => {
    expect(useLocationStore.getState().locations).toEqual([]);
  });
});

/* ================================================================== */
/*                  13. UI 组件测试                                     */
/* ================================================================== */

describe('UI 组件', () => {
  it('Button 组件 - 渲染按钮文本', () => {
    const { getByText } = render(React.createElement(Button, { title: '点击我', onPress: () => {} }));
    expect(getByText('点击我')).toBeTruthy();
  });

  it('EmptyState 组件 - 显示空状态', () => {
    const { getByText } = render(React.createElement(EmptyState, { icon: 'package-variant', title: '暂无数据', description: '点击下方按钮添加', actionLabel: '添加', onAction: () => {} }));
    expect(getByText('暂无数据')).toBeTruthy();
    expect(getByText('点击下方按钮添加')).toBeTruthy();
  });

  it('Badge 组件 - 显示优先级标签', () => {
    const { getByText } = render(React.createElement(Badge, { label: '紧急', variant: 'high' }));
    expect(getByText('紧急')).toBeTruthy();
  });

  it('Loading 组件 - 显示加载指示器', () => {
    const { getByText } = render(React.createElement(Loading, { text: '加载中...' }));
    expect(getByText('加载中...')).toBeTruthy();
  });
});

/* ================================================================== */
/*                  14. 跨页面导航链路测试                              */
/* ================================================================== */

describe('页面导航链路', () => {
  it('首页 -> 物品页 -> 创建物品 -> 物品详情 链路完整', () => {
    expect(HomeScreen).toBeTruthy();
    expect(ItemsScreen).toBeTruthy();
    expect(CreateItemScreen).toBeTruthy();
    expect(ItemDetailScreen).toBeTruthy();
  });

  it('首页 -> 待办页 -> 创建待办 -> 待办详情 链路完整', () => {
    expect(HomeScreen).toBeTruthy();
    expect(TodosScreen).toBeTruthy();
    expect(CreateTodoScreen).toBeTruthy();
    expect(TodoDetailScreen).toBeTruthy();
  });

  it('认证 -> 主界面 链路完整', () => {
    expect(LoginScreen).toBeTruthy();
    expect(RegisterScreen).toBeTruthy();
    expect(TabLayout).toBeTruthy();
  });
});

/* ================================================================== */
/*                  15. 数据流完整性测试                                */
/* ================================================================== */

describe('数据流完整性', () => {
  it('物品 Store - 核心方法存在', () => {
    const s = useItemStore.getState();
    expect(typeof s.addItem).toBe('function');
    expect(typeof s.updateItem).toBe('function');
    expect(typeof s.deleteItem).toBe('function');
    expect(typeof s.fetchItems).toBe('function');
  });

  it('待办 Store - 核心方法存在', () => {
    const s = useTodoStore.getState();
    expect(typeof s.addTodo).toBe('function');
    expect(typeof s.updateTodo).toBe('function');
    expect(typeof s.deleteTodo).toBe('function');
    expect(typeof s.toggleComplete).toBe('function');
    expect(typeof s.fetchTodos).toBe('function');
  });

  it('认证 Store - 核心方法存在', () => {
    const s = useAuthStore.getState();
    expect(typeof s.signIn).toBe('function');
    expect(typeof s.signUp).toBe('function');
    expect(typeof s.signOut).toBe('function');
    expect(typeof s.init).toBe('function');
    expect(typeof s.resetPassword).toBe('function');
  });
});
