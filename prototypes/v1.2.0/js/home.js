// home.js — v1.2.1 Premium

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
      { icon: '📦', title: '添加物品', desc: '记录你的物品', cls: 'primary', action: 'addItem' },
      { icon: '✅', title: '添加待办', desc: '管理你的任务', cls: 'success', action: 'addTodo' },
    ];
    actions.innerHTML = items.map(a => `
      <div class="action-item" data-action="${a.action}">
        <div class="action-icon ${a.cls}">${a.icon}</div>
        <div class="action-text">
          <div class="action-title">${a.title}</div>
          <div class="action-desc">${a.desc}</div>
        </div>
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
    document.getElementById('quick-actions').addEventListener('click', (e) => {
      const actionItem = e.target.closest('.action-item');
      if (!actionItem) return;
      const action = actionItem.dataset.action;
      if (action === 'addItem' || action === 'addTodo') {
        App.switchTab('workbench');
      }
    });

    document.getElementById('recent-todos').addEventListener('click', (e) => {
      const check = e.target.closest('[data-check]');
      if (check) {
        const id = check.dataset.check;
        const todo = todos.find(t => t.id === id);
        if (todo) {
          todo.completed = !todo.completed;
          this.renderRecentTodos();
          App.showToast(todo.completed ? '已标记完成 ✓' : '已取消完成');
        }
      }
    });

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
