// workbench.js — 工作台交互逻辑

const WorkbenchPage = {
  currentView: 'items', // 'items' | 'todos'
  currentCategory: '全部',
  currentTodoTab: 'all', // 'all' | 'pending' | 'done'
  currentSort: 'time',
  searchQuery: '',

  init() {
    this.renderChips();
    this.renderItemView();
    this.renderTodoTabs();
    this.renderTodoView();
    this.renderFeatureCards();
    this.bindEvents();
  },

  // --- 物品视图 ---
  renderItemView() {
    const container = document.getElementById('item-list');
    let filtered = [...items];
    if (this.currentCategory !== '全部') {
      filtered = filtered.filter(i => i.category === this.currentCategory);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>暂无物品</h3>
          <p>点击下方 + 添加第一个物品</p>
        </div>
      `;
      return;
    }

    const catColors = {
      '电子产品': '#3B82F6', '书籍': '#10B981', '日用品': '#F59E0B',
      '衣物': '#8B5CF6', '其他': '#6B7280',
    };
    const catIcons = {
      '电子产品': '💻', '书籍': '📖', '日用品': '🧴',
      '衣物': '👕', '其他': '📎',
    };

    container.innerHTML = filtered.map(item => `
      <div class="item-card" data-id="${item.id}">
        <div class="item-icon" style="background:${catColors[item.category]}18;color:${catColors[item.category]};border-radius:var(--radius-md)">
          ${catIcons[item.category] || '📎'}
        </div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-desc">${item.location}</div>
          <div class="item-tags">
            <span class="item-tag">${item.category}</span>
            ${item.barcode ? `<span class="item-tag">📊 ${item.barcode}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  },

  renderChips() {
    const container = document.getElementById('category-chips');
    const cats = ['全部', '电子产品', '书籍', '日用品', '衣物', '其他'];
    container.innerHTML = cats.map(c => `
      <div class="chip ${this.currentCategory === c ? 'active' : ''}" data-cat="${c}">${c}</div>
    `).join('');
  },

  // --- 待办视图 ---
  renderTodoView() {
    const container = document.getElementById('todo-list');
    let filtered = [...todos];
    if (this.currentTodoTab === 'pending') filtered = filtered.filter(t => !t.completed);
    else if (this.currentTodoTab === 'done') filtered = filtered.filter(t => t.completed);

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>暂无待办</h3>
          <p>${this.currentTodoTab === 'done' ? '还没有完成的待办' : '太棒了，所有待办都完成了！'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(todo => {
      const priorityLabel = todo.priority === 3 ? '紧急' : todo.priority === 2 ? '普通' : '低';
      const priorityCls = todo.priority === 3 ? 'danger' : todo.priority === 2 ? 'warning' : 'success';
      const priorityDot = todo.priority === 3 ? 'high' : todo.priority === 2 ? 'medium' : 'low';
      return `
        <div class="todo-card ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
          <div class="todo-check ${todo.completed ? 'checked' : ''}" data-check="${todo.id}">
            ${todo.completed ? '✓' : ''}
          </div>
          <div class="todo-info">
            <div class="todo-title">${todo.title}</div>
            ${todo.description ? `<div class="todo-desc">${todo.description}</div>` : ''}
            <div class="todo-footer">
              <span class="priority-dot ${priorityDot}"></span>
              <span class="badge badge-${priorityCls}">${priorityLabel}</span>
              ${todo.deadline ? `<span style="font-size:var(--font-xs);color:var(--text-muted)">截止 ${todo.deadline}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderTodoTabs() {
    const container = document.getElementById('todo-tabs');
    const tabs = [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待完成' },
      { key: 'done', label: '已完成' },
    ];
    container.innerHTML = tabs.map(t => `
      <button class="segment-item ${this.currentTodoTab === t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>
    `).join('');
  },

  // --- 功能卡片 ---
  renderFeatureCards() {
    const container = document.getElementById('feature-cards');
    const cards = [
      { icon: '🤝', label: '借用登记' },
      { icon: '📋', label: '模板使用' },
      { icon: '🏷️', label: '分类管理' },
      { icon: '📍', label: '位置管理' },
      { icon: '📅', label: '日历视图' },
      { icon: '📤', label: '数据导出' },
      { icon: '👥', label: '共享管理' },
      { icon: '💬', label: '消息对话' },
      { icon: '📊', label: '统计概览' },
    ];
    container.innerHTML = cards.map(c => `
      <div class="feature-card" data-feature="${c.label}">
        <div class="feature-icon">${c.icon}</div>
        <span>${c.label}</span>
      </div>
    `).join('');
  },

  // --- 排序弹窗 ---
  renderSortOptions() {
    const container = document.getElementById('sort-options');
    const isItem = this.currentView === 'items';
    const options = isItem
      ? [
          { key: 'time', label: '添加时间 (最新)' },
          { key: 'name', label: '名称 (A-Z)' },
          { key: 'category', label: '分类' },
        ]
      : [
          { key: 'time', label: '添加时间' },
          { key: 'priority', label: '优先级 (高到低)' },
          { key: 'name', label: '名称 (A-Z)' },
        ];
    container.innerHTML = options.map(o => `
      <div class="sort-option ${this.currentSort === o.key ? 'selected' : ''}" data-sort="${o.key}">
        <span>${o.label}</span>
        <span class="check">${this.currentSort === o.key ? '✓' : ''}</span>
      </div>
    `).join('');
  },

  // --- 绑定事件 ---
  bindEvents() {
    // 分段控制器 — 物品/待办视图切换
    document.getElementById('seg-controls').addEventListener('click', (e) => {
      const btn = e.target.closest('.segment-item');
      if (!btn) return;
      this.currentView = btn.dataset.view;
      document.querySelectorAll('#seg-controls .segment-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('item-view').classList.toggle('active', this.currentView === 'items');
      document.getElementById('todo-view').classList.toggle('active', this.currentView === 'todos');
    });

    // 待办筛选 Tab
    document.getElementById('todo-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      this.currentTodoTab = tab.dataset.tab;
      this.renderTodoTabs();
      this.renderTodoView();
    });

    // 分类 Chips
    document.getElementById('category-chips').addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      this.currentCategory = chip.dataset.cat;
      this.renderChips();
      this.renderItemView();
    });

    // 搜索
    document.getElementById('wb-search').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderItemView();
    });

    // 排序
    document.getElementById('sort-btn').addEventListener('click', () => {
      this.renderSortOptions();
      App.showModal('sort-modal');
    });
    document.getElementById('sort-options').addEventListener('click', (e) => {
      const opt = e.target.closest('.sort-option');
      if (!opt) return;
      this.currentSort = opt.dataset.sort;
      this.renderSortOptions();
      this.renderItemView();
      this.renderTodoView();
      App.hideModal('sort-modal');
    });

    // FAB
    document.getElementById('fab').addEventListener('click', () => {
      this.renderCreateForm();
      App.showModal('create-modal');
    });

    // 创建表单
    document.getElementById('create-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const nameField = e.target.querySelector('[name="name"]') || e.target.querySelector('[name="title"]');
      const title = nameField ? nameField.value : '';
      if (!title) {
        App.showToast('请填写名称', 'error');
        return;
      }
      App.hideModal('create-modal');
      App.showToast(`已创建: ${title}`, 'success');
      e.target.reset();
    });

    // 关闭模态框
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          App.hideModal(overlay.id);
        }
      });
    });

    // 功能卡片
    document.getElementById('feature-cards').addEventListener('click', (e) => {
      const card = e.target.closest('.feature-card');
      if (card) {
        App.showToast(`${card.dataset.feature} — 开发中`);
      }
    });

    // 物品卡片点击
    document.getElementById('item-list').addEventListener('click', (e) => {
      const card = e.target.closest('.item-card');
      if (card) {
        App.showToast(`查看物品: ${card.dataset.id}`);
      }
    });

    // 待办勾选
    document.getElementById('todo-list').addEventListener('click', (e) => {
      const check = e.target.closest('[data-check]');
      if (check) {
        const id = check.dataset.check;
        const todo = todos.find(t => t.id === id);
        if (todo) {
          todo.completed = !todo.completed;
          this.renderTodoView();
          App.showToast(todo.completed ? '已标记完成 ✓' : '已取消完成');
        }
      }
    });
  },

  renderCreateForm() {
    const container = document.getElementById('create-form');
    const isItem = this.currentView === 'items';
    document.getElementById('create-title').textContent = isItem ? '新建物品' : '新建待办';

    if (isItem) {
      const catOptions = categories.filter(c => c.type === 'item');
      container.innerHTML = `
        <div class="form-group">
          <label>名称 <span class="required">*</span></label>
          <input class="input" name="name" placeholder="输入物品名称" />
        </div>
        <div class="form-group">
          <label>分类 <span class="required">*</span></label>
          <div class="form-grid" id="cat-select">
            ${catOptions.map(c => `
              <div class="form-grid-item" data-cat="${c.name}">
                <span class="grid-icon">${c.icon === 'monitor' ? '💻' : c.icon === 'book-open' ? '📖' : c.icon === 'shopping' ? '🧴' : c.icon === 'tshirt-crest' ? '👕' : '📎'}</span>
                <span>${c.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>存放位置 <span class="required">*</span></label>
          <div class="form-grid" id="loc-select">
            ${locations.filter(l => !l.parentId).map(loc => `
              <div class="form-grid-item" data-loc="${loc.name}">
                <span class="grid-icon">${loc.icon === 'desk-lamp' ? '📚' : loc.icon === 'bed' ? '🛏️' : loc.icon === 'sofa' ? '🛋️' : loc.icon === 'pot' ? '🍳' : '👜'}</span>
                <span>${loc.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea class="input" name="desc" rows="2" placeholder="选填，添加描述..."></textarea>
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="App.hideModal('create-modal')">取消</button>
          <button class="btn btn-primary" onclick="document.getElementById('create-form').requestSubmit()">保存</button>
        </div>
      `;

      // 分类/位置选择
      setTimeout(() => {
        document.querySelectorAll('#cat-select .form-grid-item').forEach(el => {
          el.addEventListener('click', () => {
            document.querySelectorAll('#cat-select .form-grid-item').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
          });
        });
        document.querySelectorAll('#loc-select .form-grid-item').forEach(el => {
          el.addEventListener('click', () => {
            document.querySelectorAll('#loc-select .form-grid-item').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
          });
        });
      }, 0);
    } else {
      container.innerHTML = `
        <div class="form-group">
          <label>标题 <span class="required">*</span></label>
          <input class="input" name="title" placeholder="输入待办标题" />
        </div>
        <div class="form-group">
          <label>优先级</label>
          <div class="form-grid" id="priority-select">
            <div class="form-grid-item" data-priority="3">
              <span class="grid-icon">🔴</span><span>紧急</span>
            </div>
            <div class="form-grid-item" data-priority="2">
              <span class="grid-icon">🟠</span><span>普通</span>
            </div>
            <div class="form-grid-item" data-priority="1">
              <span class="grid-icon">🟢</span><span>低</span>
            </div>
          </div>
        </div>
        <div class="form-group">
          <label>描述</label>
          <textarea class="input" name="desc" rows="2" placeholder="选填..."></textarea>
        </div>
        <div class="form-group">
          <label>截止日期</label>
          <input class="input" name="deadline" type="date" />
        </div>
        <div class="form-actions">
          <button class="btn btn-secondary" onclick="App.hideModal('create-modal')">取消</button>
          <button class="btn btn-primary" onclick="document.getElementById('create-form').requestSubmit()">保存</button>
        </div>
      `;

      setTimeout(() => {
        document.querySelectorAll('#priority-select .form-grid-item').forEach(el => {
          el.addEventListener('click', () => {
            document.querySelectorAll('#priority-select .form-grid-item').forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
          });
        });
      }, 0);
    }
  },
};

window.workbenchPage = WorkbenchPage;
