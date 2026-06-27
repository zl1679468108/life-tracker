// app.js — SPA 路由、Tab 切换、全局状态管理

const App = {
  currentPage: 'home',
  unreadCount: 0,

  // 初始化
  init() {
    this.unreadCount = notifications.filter(n => !n.read).length;
    this.updateNotificationBadge();
    this.setupTabs();
    this.setupSearch();
    this.updateGreeting();
    // 启动铃铛抖动
    if (this.unreadCount > 0) {
      setTimeout(() => this.shakeBell(), 500);
    }
    // 加载各页面
    window.homePage.init();
    window.workbenchPage.init();
    window.messagePage.init();
    window.settingsPage.init();
  },

  // Tab 切换
  setupTabs() {
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', () => {
        const page = tab.dataset.page;
        this.switchTab(page);
      });
    });
  },

  switchTab(pageName) {
    this.currentPage = pageName;
    // 更新 Tab 状态
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab-item[data-page="${pageName}"]`).classList.add('active');
    // 切换页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');
    // 关闭对话详情页
    document.getElementById('detail-page').classList.remove('show');
    // 滚动到顶部
    const container = document.getElementById('page-container');
    container.scrollTop = 0;
  },

  // 通知铃铛
  shakeBell() {
    const btn = document.getElementById('bell-btn');
    if (btn) {
      btn.classList.remove('shake');
      void btn.offsetWidth; // 强制回流
      btn.classList.add('shake');
      setTimeout(() => btn.classList.remove('shake'), 800);
    }
  },

  updateNotificationBadge() {
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
    }
    // 消息 Tab 未读徽章
    const msgBadge = document.getElementById('msg-badge');
    if (msgBadge) {
      const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      msgBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
      msgBadge.textContent = totalUnread > 9 ? '9+' : totalUnread;
    }
  },

  // 问候语
  updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = '早上好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';
    const el = document.getElementById('greeting-text');
    if (el) el.textContent = greeting;
  },

  // 搜索框
  setupSearch() {
    const searchInput = document.getElementById('global-search');
    const clearBtn = document.getElementById('search-clear');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
      clearBtn.classList.toggle('show', searchInput.value.length > 0);
    });
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.classList.remove('show');
      searchInput.focus();
    });
  },

  // Toast
  showToast(msg, type = '') {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = 'toast show' + (type ? ` ${type}` : '');
    setTimeout(() => toast.classList.remove('show'), 2000);
  },

  // 模态框
  showModal(id) {
    document.getElementById(id).classList.add('show');
  },
  hideModal(id) {
    document.getElementById(id).classList.remove('show');
  },
};

// 全局暴露
window.App = App;
