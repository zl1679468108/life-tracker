// i18n 国际化配置
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 语言包
const translations = {
  'zh-CN': {
    common: {
      loading: '加载中...',
      success: '成功',
      error: '错误',
      cancel: '取消',
      confirm: '确认',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      search: '搜索',
      back: '返回',
      close: '关闭',
      yes: '是',
      no: '否',
      ok: '确定',
      retry: '重试',
      refresh: '刷新',
      noData: '暂无数据',
      all: '全部',
      networkError: '网络错误，请检查网络连接',
      requestFailed: '请求失败，请稍后重试',
    },
    auth: {
      login: '登录',
      register: '注册',
      logout: '退出登录',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      forgotPassword: '忘记密码？',
      resetPassword: '重置密码',
      loginSuccess: '登录成功',
      loginFailed: '登录失败，请检查邮箱和密码',
      registerSuccess: '注册成功',
      registerFailed: '注册失败',
      logoutConfirm: '确认退出？退出后需要重新登录',
      logoutSuccess: '已退出登录',
      emailRequired: '请输入邮箱',
      passwordRequired: '请输入密码',
      passwordLength: '密码长度至少6位',
      passwordMismatch: '两次输入的密码不一致',
      invalidEmail: '请输入有效的邮箱地址',
    },
    home: {
      greeting: {
        morning: '早上好',
        afternoon: '下午好',
        evening: '晚上好',
      },
      subtitle: '今天也要加油哦',
      stats: {
        items: '物品',
        todos: '待办',
        completed: '完成',
      },
      quickActions: {
        title: '快捷操作',
        addItem: '添加物品',
        addItemDesc: '记录你的物品',
        addTodo: '添加待办',
        addTodoDesc: '管理你的任务',
        stats: '数据统计',
        statsDesc: '查看数据统计',
        notifications: '通知中心',
        notificationsDesc: '查看通知',
      },
      recentTodos: '最近待办',
      viewAll: '查看全部',
    },
    items: {
      title: '物品',
      add: '添加物品',
      edit: '编辑物品',
      detail: '物品详情',
      name: '物品名称',
      nameRequired: '请输入物品名称',
      category: '分类',
      categoryRequired: '请选择分类',
      location: '位置',
      locationRequired: '请选择存放位置',
      description: '描述',
      images: '图片',
      imageLimit: '最多 5 张',
      createdAt: '添加时间',
      updatedAt: '更新时间',
      deleteConfirm: '确认删除此物品？',
      deleteSuccess: '物品已删除',
      saveSuccess: '保存成功',
      search: '搜索物品',
      filter: '筛选',
      sort: '排序',
      sortByTime: '按时间',
      sortByName: '按名称',
      sortByCategory: '按分类',
      batchMode: '批量模式',
      selectAll: '全选',
      selected: '已选',
      batchDelete: '批量删除',
      batchDeleteConfirm: '确认删除选中的物品？',
      empty: '暂无物品',
      emptyDesc: '点击右下角按钮添加第一个物品',
    },
    todos: {
      title: '待办',
      add: '添加待办',
      edit: '编辑待办',
      detail: '待办详情',
      titleRequired: '请输入待办标题',
      priority: '优先级',
      priorityHigh: '紧急',
      priorityNormal: '普通',
      priorityLow: '低',
      dueDate: '截止日期',
      reminder: '提醒时间',
      completed: '已完成',
      pending: '待完成',
      all: '全部',
      deleteConfirm: '确认删除此待办？',
      deleteSuccess: '待办已删除',
      saveSuccess: '保存成功',
      search: '搜索待办',
      sort: '排序',
      sortByTime: '按时间',
      sortByPriority: '按优先级',
      sortByName: '按名称',
      empty: '暂无待办',
      emptyDesc: '点击右下角按钮添加第一个待办',
      dragMode: '拖拽排序',
    },
    categories: {
      title: '分类管理',
      itemCategories: '物品分类',
      todoCategories: '待办分类',
      add: '添加分类',
      name: '分类名称',
      nameRequired: '请输入分类名称',
      type: '分类类型',
      typeItem: '物品',
      typeTodo: '待办',
      color: '颜色',
      deleteConfirm: '确认删除此分类？',
      deleteSuccess: '分类已删除',
      systemPreset: '系统预设',
      custom: '自定义',
      empty: '暂无分类',
    },
    locations: {
      title: '位置管理',
      add: '添加位置',
      name: '位置名称',
      nameRequired: '请输入位置名称',
      parent: '父位置',
      noParent: '无（顶级位置）',
      deleteConfirm: '确认删除此位置？',
      deleteSuccess: '位置已删除',
      systemPreset: '系统预设',
      custom: '自定义',
      empty: '暂无位置',
    },
    settings: {
      title: '设置',
      account: '账号管理',
      profile: '个人资料',
      username: '用户名',
      email: '邮箱',
      avatar: '头像',
      changePassword: '修改密码',
      currentPassword: '当前密码',
      newPassword: '新密码',
      confirmNewPassword: '确认新密码',
      passwordChangeSuccess: '密码修改成功，请重新登录',
      theme: '主题',
      themeLight: '浅色',
      themeDark: '深色',
      themeSystem: '跟随系统',
      language: '语言',
      languageZh: '中文',
      languageEn: 'English',
      notifications: '通知',
      dataSync: '数据同步',
      lastSync: '上次同步',
      syncNow: '立即同步',
      syncSuccess: '同步成功',
      syncFailed: '同步失败',
      exportData: '导出数据',
      exportJSON: '导出 JSON',
      exportCSV: '导出 CSV',
      exportSuccess: '导出成功',
      about: '关于',
      version: '版本',
      feedback: '反馈建议',
      logout: '退出登录',
    },
    notifications: {
      title: '通知中心',
      all: '全部',
      unread: '未读',
      read: '已读',
      markAllRead: '全部标记已读',
      empty: '暂无通知',
      emptyUnread: '暂无未读通知',
      emptyRead: '暂无已读通知',
      todoReminder: '待办提醒',
      systemNotification: '系统通知',
      itemStats: '物品统计',
    },
    stats: {
      title: '数据统计',
      thisWeek: '本周',
      thisMonth: '本月',
      thisYear: '本年',
      totalItems: '物品总数',
      completedTodos: '完成待办',
      completionRate: '完成率',
      pendingTodos: '待完成',
      todoTrend: '待办完成趋势',
      categoryDistribution: '物品分类分布',
      itemCount: '物品数量统计',
      noData: '暂无数据',
    },
    feedback: {
      title: '反馈建议',
      content: '反馈内容',
      contentRequired: '请输入反馈内容',
      contact: '联系方式',
      contactPlaceholder: '选填，方便我们联系您',
      submit: '提交反馈',
      submitSuccess: '反馈已提交，感谢您的建议',
      submitFailed: '提交失败，请稍后重试',
    },
    share: {
      item: '分享物品',
      todo: '分享待办',
      copied: '内容已复制到剪贴板',
      shareFailed: '分享失败，请重试',
    },
  },
  en: {
    common: {
      loading: 'Loading...',
      success: 'Success',
      error: 'Error',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      back: 'Back',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      retry: 'Retry',
      refresh: 'Refresh',
      noData: 'No data',
      all: 'All',
      networkError: 'Network error, please check your connection',
      requestFailed: 'Request failed, please try again later',
    },
    auth: {
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      loginSuccess: 'Login successful',
      loginFailed: 'Login failed, please check your email and password',
      registerSuccess: 'Registration successful',
      registerFailed: 'Registration failed',
      logoutConfirm: 'Confirm logout? You will need to login again',
      logoutSuccess: 'Logged out',
      emailRequired: 'Please enter your email',
      passwordRequired: 'Please enter your password',
      passwordLength: 'Password must be at least 6 characters',
      passwordMismatch: 'Passwords do not match',
      invalidEmail: 'Please enter a valid email address',
    },
    home: {
      greeting: {
        morning: 'Good Morning',
        afternoon: 'Good Afternoon',
        evening: 'Good Evening',
      },
      subtitle: 'Have a great day',
      stats: {
        items: 'Items',
        todos: 'Todos',
        completed: 'Completed',
      },
      quickActions: {
        title: 'Quick Actions',
        addItem: 'Add Item',
        addItemDesc: 'Record your items',
        addTodo: 'Add Todo',
        addTodoDesc: 'Manage your tasks',
        stats: 'Statistics',
        statsDesc: 'View statistics',
        notifications: 'Notifications',
        notificationsDesc: 'View notifications',
      },
      recentTodos: 'Recent Todos',
      viewAll: 'View All',
    },
    items: {
      title: 'Items',
      add: 'Add Item',
      edit: 'Edit Item',
      detail: 'Item Detail',
      name: 'Item Name',
      nameRequired: 'Please enter item name',
      category: 'Category',
      categoryRequired: 'Please select category',
      location: 'Location',
      locationRequired: 'Please select location',
      description: 'Description',
      images: 'Images',
      imageLimit: 'Max 5 images',
      createdAt: 'Created At',
      updatedAt: 'Updated At',
      deleteConfirm: 'Delete this item?',
      deleteSuccess: 'Item deleted',
      saveSuccess: 'Saved successfully',
      search: 'Search items',
      filter: 'Filter',
      sort: 'Sort',
      sortByTime: 'By Time',
      sortByName: 'By Name',
      sortByCategory: 'By Category',
      batchMode: 'Batch Mode',
      selectAll: 'Select All',
      selected: 'Selected',
      batchDelete: 'Batch Delete',
      batchDeleteConfirm: 'Delete selected items?',
      empty: 'No items',
      emptyDesc: 'Tap the button below to add your first item',
    },
    todos: {
      title: 'Todos',
      add: 'Add Todo',
      edit: 'Edit Todo',
      detail: 'Todo Detail',
      titleRequired: 'Please enter todo title',
      priority: 'Priority',
      priorityHigh: 'High',
      priorityNormal: 'Normal',
      priorityLow: 'Low',
      dueDate: 'Due Date',
      reminder: 'Reminder',
      completed: 'Completed',
      pending: 'Pending',
      all: 'All',
      deleteConfirm: 'Delete this todo?',
      deleteSuccess: 'Todo deleted',
      saveSuccess: 'Saved successfully',
      search: 'Search todos',
      sort: 'Sort',
      sortByTime: 'By Time',
      sortByPriority: 'By Priority',
      sortByName: 'By Name',
      empty: 'No todos',
      emptyDesc: 'Tap the button below to add your first todo',
      dragMode: 'Drag to Reorder',
    },
    categories: {
      title: 'Categories',
      itemCategories: 'Item Categories',
      todoCategories: 'Todo Categories',
      add: 'Add Category',
      name: 'Category Name',
      nameRequired: 'Please enter category name',
      type: 'Type',
      typeItem: 'Item',
      typeTodo: 'Todo',
      color: 'Color',
      deleteConfirm: 'Delete this category?',
      deleteSuccess: 'Category deleted',
      systemPreset: 'System Preset',
      custom: 'Custom',
      empty: 'No categories',
    },
    locations: {
      title: 'Locations',
      add: 'Add Location',
      name: 'Location Name',
      nameRequired: 'Please enter location name',
      parent: 'Parent Location',
      noParent: 'None (Top Level)',
      deleteConfirm: 'Delete this location?',
      deleteSuccess: 'Location deleted',
      systemPreset: 'System Preset',
      custom: 'Custom',
      empty: 'No locations',
    },
    settings: {
      title: 'Settings',
      account: 'Account',
      profile: 'Profile',
      username: 'Username',
      email: 'Email',
      avatar: 'Avatar',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',
      passwordChangeSuccess: 'Password changed, please login again',
      theme: 'Theme',
      themeLight: 'Light',
      themeDark: 'Dark',
      themeSystem: 'System',
      language: 'Language',
      languageZh: '中文',
      languageEn: 'English',
      notifications: 'Notifications',
      dataSync: 'Data Sync',
      lastSync: 'Last Sync',
      syncNow: 'Sync Now',
      syncSuccess: 'Sync successful',
      syncFailed: 'Sync failed',
      exportData: 'Export Data',
      exportJSON: 'Export JSON',
      exportCSV: 'Export CSV',
      exportSuccess: 'Export successful',
      about: 'About',
      version: 'Version',
      feedback: 'Feedback',
      logout: 'Logout',
    },
    notifications: {
      title: 'Notifications',
      all: 'All',
      unread: 'Unread',
      read: 'Read',
      markAllRead: 'Mark All Read',
      empty: 'No notifications',
      emptyUnread: 'No unread notifications',
      emptyRead: 'No read notifications',
      todoReminder: 'Todo Reminder',
      systemNotification: 'System Notification',
      itemStats: 'Item Statistics',
    },
    stats: {
      title: 'Statistics',
      thisWeek: 'This Week',
      thisMonth: 'This Month',
      thisYear: 'This Year',
      totalItems: 'Total Items',
      completedTodos: 'Completed Todos',
      completionRate: 'Completion Rate',
      pendingTodos: 'Pending Todos',
      todoTrend: 'Todo Completion Trend',
      categoryDistribution: 'Category Distribution',
      itemCount: 'Item Count',
      noData: 'No data',
    },
    feedback: {
      title: 'Feedback',
      content: 'Content',
      contentRequired: 'Please enter feedback content',
      contact: 'Contact',
      contactPlaceholder: 'Optional, for us to contact you',
      submit: 'Submit Feedback',
      submitSuccess: 'Feedback submitted, thank you',
      submitFailed: 'Submission failed, please try again',
    },
    share: {
      item: 'Share Item',
      todo: 'Share Todo',
      copied: 'Copied to clipboard',
      shareFailed: 'Share failed, please try again',
    },
  },
};

export type Language = 'zh-CN' | 'en';
export type TranslationKey = string;

// 获取系统语言
const getSystemLanguage = (): Language => {
  if (Platform.OS === 'web') {
    const lang = navigator.language;
    if (lang.startsWith('zh')) return 'zh-CN';
    return 'en';
  }
  // 原生平台可以后续扩展
  return 'zh-CN';
};

// i18n 管理器
class I18nManager {
  private currentLanguage: Language = 'zh-CN';
  private listeners: Set<() => void> = new Set();

  async init() {
    try {
      const stored = await AsyncStorage.getItem('language');
      if (stored === 'zh-CN' || stored === 'en') {
        this.currentLanguage = stored;
      } else {
        this.currentLanguage = getSystemLanguage();
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    }
  }

  getLanguage(): Language {
    return this.currentLanguage;
  }

  async setLanguage(language: Language) {
    this.currentLanguage = language;
    try {
      await AsyncStorage.setItem('language', language);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save language:', error);
    }
  }

  t(key: string): string {
    const keys = key.split('.');
    let value: any = translations[this.currentLanguage];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 如果找不到翻译，返回 key
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const i18n = new I18nManager();

// Hook: 使用翻译
export const useTranslation = () => {
  const [language, setLanguage] = React.useState(i18n.getLanguage());

  React.useEffect(() => {
    const unsubscribe = i18n.subscribe(() => {
      setLanguage(i18n.getLanguage());
    });
    return unsubscribe;
  }, []);

  return {
    t: (key: string) => i18n.t(key),
    language,
    setLanguage: (lang: Language) => i18n.setLanguage(lang),
  };
};
