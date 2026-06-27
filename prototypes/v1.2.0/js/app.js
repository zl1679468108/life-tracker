// app.js — v1.2.0 Redesigned: SPA 路由 + Tab 切换 + 全局状态管理

const App = {
  currentPage: 'home',
  unreadCount: 0,

  init() {
    this.unreadCount = notifications.filter(n => !n.read).length;
    this.updateNotificationBadge();
    this.setupTabs();
    this.setupSearch();
    this.updateGreeting();
    if (this.unreadCount > 0) {
      setTimeout(() => this.shakeBell(), 500);
    }
    window.homePage.init();
    window.workbenchPage.init();
    window.messagePage.init();
    window.settingsPage.init();
  },

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
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab-item[data-page="${pageName}"]`)?.classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageName}`)?.classList.add('active');
    document.getElementById('detail-page').classList.remove('show');
    this.hideSheet();
    const container = document.getElementById('page-container');
    container.scrollTop = 0;
  },

  hideSheet() {
    const sheet = document.getElementById('sheet-page');
    if (sheet) sheet.classList.remove('show');
  },

  shakeBell() {
    const btn = document.getElementById('bell-btn');
    if (btn) {
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
      setTimeout(() => btn.classList.remove('shake'), 800);
    }
  },

  updateNotificationBadge() {
    const badge = document.getElementById('notif-badge');
    if (badge) {
      badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
    }
    const msgBadge = document.getElementById('msg-badge');
    if (msgBadge) {
      const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      msgBadge.style.display = totalUnread > 0 ? 'flex' : 'none';
      msgBadge.textContent = totalUnread > 9 ? '9+' : totalUnread;
    }
  },

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting;
    if (hour < 12) greeting = '早上好';
    else if (hour < 18) greeting = '下午好';
    else greeting = '晚上好';
    const el = document.getElementById('greeting-text');
    if (el) el.textContent = greeting;
  },

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

  showModal(id) {
    document.getElementById(id)?.classList.add('show');
  },
  hideModal(id) {
    document.getElementById(id)?.classList.remove('show');
  },
};

window.App = App;
