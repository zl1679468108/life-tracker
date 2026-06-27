// home.js — 首页交互逻辑

const HomePage = {
  init() {
    this.renderStats();
    this.renderQuickActions();
    this.renderRecentTodos();
    this.bindEvents();
  },

  renderStats() {
    document.getElementById('stat-items').textContent = stats.totalItems;
    document.getElementById('stat-todos').textContent = stats.pendingTodos;
    document.getElementById('stat-completed').textContent = stats.completedTodos;
  },

  renderQuickActions() {
    const actions = document.getElementById('quick-actions');
    const items = [
      { icon: '📦', cls: 'orange', label: '添加物品' },
      { icon: '✅', cls: 'purple', label: '添加待办' },
      { icon: '📊', cls: 'green', label: '数据统计' },
      { icon: '🔔', cls: 'blue', label: '通知中心' },
    ];
    actions.innerHTML = items.map(a => `
      <div class="action-item" data-action="${a.label}">
        <div class="action-icon ${a.cls}">${a.icon}</div>
        <span>${a.label}</span>
      </div>
    `).join('');
  },

  renderRecentTodos() {
    const container = document.getElementById('recent-todos');
    const recent = todos.slice(0, 3);
    container.innerHTML = recent.map(todo => {
      const priorityLabel = todo.priority === 3 ? '紧急' : todo.priority === 2 ? '普通' : '低';
      const priorityColor = todo.priority === 3 ? 'danger' : todo.priority === 2 ? 'warning' : 'success';
      return `
        <div class="todo-item" data-id="${todo.id}">
          <div class="todo-checkbox ${todo.completed ? 'checked' : ''}" data-check="${todo.id}">
            ${todo.completed ? '✓' : ''}
          </div>
          <div class="todo-content">
            <div class="todo-title">${todo.title}</div>
            <div class="todo-meta">
              <span class="badge badge-${priorityColor}">${priorityLabel}</span>
              ${todo.deadline ? `<span>截止 ${todo.deadline}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    // 快捷操作点击
    document.getElementById('quick-actions').addEventListener('click', (e) => {
      const actionItem = e.target.closest('.action-item');
      if (!actionItem) return;
      const action = actionItem.dataset.action;
      if (action === '添加物品' || action === '添加待办') {
        App.switchTab('workbench');
        App.showToast(`已切换到工作台 — ${action}`);
      } else if (action === '数据统计') {
        App.showToast('数据统计页面开发中');
      } else if (action === '通知中心') {
        App.switchTab('settings');
        App.showToast('通知中心在设置页');
      }
    });

    // 最近待办勾选
    document.getElementById('recent-todos').addEventListener('click', (e) => {
      const check = e.target.closest('[data-check]');
      if (check) {
        const id = check.dataset.check;
        const todo = todos.find(t => t.id === id);
        if (todo) {
          todo.completed = !todo.completed;
          this.renderRecentTodos();
          App.showToast(todo.completed ? '已标记完成 ✓' : '已取消完成');
          if (todo.completed) {
            check.classList.add('shake');
            setTimeout(() => check.classList.remove('shake'), 800);
          }
        }
      }
    });

    // 铃铛抖动
    document.getElementById('bell-btn').addEventListener('click', () => {
      App.shakeBell();
      App.showToast(`你有 ${this.getUnreadCount()} 条未读通知`);
    });
  },

  getUnreadCount() {
    return notifications.filter(n => !n.read).length;
  },
};

window.homePage = HomePage;
