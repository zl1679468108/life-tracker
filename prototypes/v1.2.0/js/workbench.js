// workbench.js — v1.2.0 Redesigned: 精简功能分组

const WorkbenchPage = {
  // 精简后的功能分组（移除重复的物品/待办管理，统一为独立列表页）
  groups: [
    {
      title: '核心管理',
      cards: [
        { id: 'item-list', label: '物品管理', icon: 'package', colorClass: 'icon-primary' },
        { id: 'todo-list', label: '待办管理', icon: 'check-square', colorClass: 'icon-success' },
        { id: 'borrow', label: '借用登记', icon: 'git-pull-request', colorClass: 'icon-warning' },
      ],
    },
    {
      title: '组织工具',
      cards: [
        { id: 'categories', label: '分类管理', icon: 'tag', colorClass: 'icon-primary' },
        { id: 'locations', label: '位置管理', icon: 'map-pin', colorClass: 'icon-secondary' },
        { id: 'templates', label: '模板使用', icon: 'copy', colorClass: 'icon-info' },
      ],
    },
    {
      title: '数据分析',
      cards: [
        { id: 'calendar', label: '日历视图', icon: 'calendar', colorClass: 'icon-secondary' },
        { id: 'statistics', label: '统计概览', icon: 'bar-chart-2', colorClass: 'icon-secondary' },
        { id: 'export', label: '数据导出', icon: 'download', colorClass: 'icon-success' },
      ],
    },
    {
      title: '协作',
      cards: [
        { id: 'sharing', label: '共享管理', icon: 'users', colorClass: 'icon-secondary' },
        { id: 'notifications', label: '通知中心', icon: 'bell', colorClass: 'icon-warning' },
      ],
    },
  ],

  // 线性图标 SVG 模板
  icons: {
    'package': '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    'check-square': '<svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    'git-pull-request': '<svg viewBox="0 0 24 24"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/></svg>',
    'tag': '<svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
    'map-pin': '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    'copy': '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    'calendar': '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    'bar-chart-2': '<svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    'download': '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    'users': '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    'bell': '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    'list': '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    'search': '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    'arrow-left': '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    'plus': '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    'x': '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    'sort-asc': '<svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="8" y2="18"/></svg>',
    'check-square': '<svg viewBox="0 0 24 24"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
    'book-open': '<svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    'shopping': '<svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    'shirt': '<svg viewBox="0 0 24 24"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/></svg>',
    'box': '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
  },

  _currentCategory: '全部',
  _currentTodoTab: 'all',

  init() {
    this.renderFeatureCards();
    this.bindEvents();
  },

  renderFeatureCards() {
    const container = document.getElementById('workbench-content');
    container.innerHTML = this.groups.map(group => `
      <div class="workbench-group">
        <div class="workbench-group-title">${group.title}</div>
        <div class="feature-grid">
          ${group.cards.map(card => `
            <div class="feature-card" data-sheet="${card.id}">
              <div class="feature-icon ${card.colorClass}">${this.icons[card.icon] || this.icons['list']}</div>
              <span>${card.label}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  bindEvents() {
    document.getElementById('workbench-content').addEventListener('click', (e) => {
      const card = e.target.closest('.feature-card');
      if (!card) return;
      const sheetId = card.dataset.sheet;
      this.pushSheet(sheetId);
    });
  },

  pushSheet(sheetId) {
    const sheetContainer = document.getElementById('sheet-page');
    const sheetMap = {
      'item-list': this.renderItemListSheet.bind(this),
      'todo-list': this.renderTodoListSheet.bind(this),
      'borrow': () => this.renderEmptySheet('借用登记', '借用登记功能开发中'),
      'categories': () => this.renderCategoriesSheet(),
      'locations': () => this.renderLocationsSheet(),
      'templates': () => this.renderEmptySheet('模板使用', '模板功能开发中'),
      'calendar': () => this.renderEmptySheet('日历视图', '日历视图功能开发中'),
      'statistics': () => this.renderStatisticsSheet(),
      'export': () => this.renderEmptySheet('数据导出', '导出功能开发中'),
      'sharing': () => this.renderEmptySheet('共享管理', '共享管理功能开发中'),
      'notifications': () => {
        App.switchTab('settings');
        App.hideSheet();
      },
    };

    const renderFn = sheetMap[sheetId];
    if (renderFn) {
      sheetContainer.innerHTML = renderFn();
      sheetContainer.classList.add('show');
      sheetContainer.querySelector('.sheet-back-btn')?.addEventListener('click', () => {
        App.hideSheet();
      });
    }
  },

  renderEmptySheet(title, msg) {
    return `
      <div class="sheet-page-header">
        <button class="back-btn sheet-back-btn" aria-label="返回">${this.icons['arrow-left']}</button>
        <h3>${title}</h3>
      </div>
      <div class="sheet-page-body">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>${title}</h3>
          <p>${msg}</p>
        </div>
      </div>
    `;
  },

  renderItemListView() {
    this.icons['book-open'] = this.icons['book-open'];
    this.icons['shopping'] = this.icons['shopping'];
    this.icons['shirt'] = this.icons['shirt'];
    this.icons['box'] = this.icons['box'];

    const catColors = {
      '电子产品': '#3B82F6', '书籍': '#10B981', '日用品': '#F59E0B',
      '衣物': '#8B5CF6', '其他': '#6B7280',
    };
    const catIcons = {
      '电子产品': 'package', '书籍': 'book-open', '日用品': 'shopping',
      '衣物': 'shirt', '其他': 'box',
    };

    const currentCat = this._currentCategory || '全部';
    const chips = ['全部', '电子产品', '书籍', '日用品', '衣物', '其他'];
    const filtered = currentCat === '全部' ? items : items.filter(i => i.category === currentCat);

    return `
      <div class="sheet-page-header">
        <button class="back-btn sheet-back-btn" aria-label="返回">${this.icons['arrow-left']}</button>
        <h3>物品管理</h3>
        <button class="btn-icon" aria-label="批量" onclick="App.showToast('批量模式开发中')">
          ${this.icons['check-square']}
        </button>
      </div>
      <div class="sheet-page-body">
        <div class="sheet-toolbar">
          <div class="search-bar" style="position:relative;flex:1">
            <span class="search-icon">${this.icons['search']}</span>
            <input type="text" class="input" id="wb-search" placeholder="搜索物品..." style="padding-left:36px">
          </div>
          <button class="sort-btn" id="sort-btn" aria-label="排序">${this.icons['sort-asc']}</button>
        </div>
        <div class="chips-row" id="category-chips">
          ${chips.map(c => `<div class="chip ${currentCat === c ? 'active' : ''}" data-cat="${c}">${c}</div>`).join('')}
        </div>
        <div id="item-list-container">
          ${filtered.length === 0
            ? `<div class="empty-state"><h3>暂无物品</h3><p>点击下方 + 添加第一个物品</p></div>`
            : filtered.map(item => {
                const color = catColors[item.category] || '#6B7280';
                const iconSvg = this.icons[catIcons[item.category]] || this.icons['box'];
                return `
                  <div class="item-card" data-id="${item.id}">
                    <div class="item-icon" style="background:${color}18;color:${color}">${iconSvg}</div>
                    <div class="item-info">
                      <div class="item-name">${item.name}</div>
                      <div class="item-desc">${item.location}</div>
                      <div class="item-tags">
                        <span class="item-tag">${item.category}</span>
                        ${item.barcode ? `<span class="item-tag">📊 ${item.barcode}</span>` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>
    `;
  },

  renderTodoListView() {
    const currentTab = this._currentTodoTab || 'all';
    const tabs = [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待完成' },
      { key: 'done', label: '已完成' },
    ];
    let filtered = [...todos];
    if (currentTab === 'pending') filtered = filtered.filter(t => !t.completed);
    else if (currentTab === 'done') filtered = filtered.filter(t => t.completed);

    return `
      <div class="sheet-page-header">
        <button class="back-btn sheet-back-btn" aria-label="返回">${this.icons['arrow-left']}</button>
        <h3>待办管理</h3>
        <button class="btn-icon" aria-label="排序">${this.icons['sort-asc']}</button>
      </div>
      <div class="sheet-page-body">
        <div class="segment-control" id="todo-tabs" style="margin-bottom:var(--space-lg)">
          ${tabs.map(t => `<button class="segment-item ${currentTab === t.key ? 'active' : ''}" data-tab="${t.key}">${t.label}</button>`).join('')}
        </div>
        <div id="todo-list-container">
          ${filtered.length === 0
            ? `<div class="empty-state"><h3>暂无待办</h3><p>${currentTab === 'done' ? '还没有完成的待办' : '太棒了，所有待办都完成了！'}</p></div>`
            : filtered.map(todo => {
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
              }).join('')
          }
        </div>
      </div>
    `;
  },

  renderCategoriesSheet() {
    const presetCats = categories.filter(c => c.preset);
    const userCats = categories.filter(c => !c.preset);

    return `
      <div class="sheet-page-header">
        <button class="back-btn sheet-back-btn" aria-label="返回">${this.icons['arrow-left']}</button>
        <h3>分类管理</h3>
        <button class="btn-icon sheet-add-btn" aria-label="添加">${this.icons['plus']}</button>
      </div>
      <div class="sheet-page-body">
        <div class="section-label" style="margin-bottom:var(--space-sm)">预设分类</div>
        ${presetCats.map(cat => `
          <div class="list-item">
            <div class="icon-line primary">${this.icons['tag']}</div>
            <div style="flex:1">
              <div style="font-weight:500">${cat.name}</div>
              <div style="font-size:var(--font-sm);color:var(--text-muted)">${cat.type === 'item' ? '物品分类' : '待办分类'}</div>
            </div>
            <span class="badge badge-info">预设</span>
          </div>
        `).join('')}
        ${userCats.length > 0 ? `
          <div class="section-label" style="margin:var(--space-lg) 0 var(--space-sm)">自定义分类</div>
          ${userCats.map(cat => `
            <div class="list-item">
              <div class="icon-line">${this.icons['tag']}</div>
              <div style="flex:1">
                <div style="font-weight:500">${cat.name}</div>
                <div style="font-size:var(--font-sm);color:var(--text-muted)">${cat.type === 'item' ? '物品分类' : '待办分类'}</div>
              </div>
            </div>
          `).join('')}
        ` : ''}
      </div>
    `;
  },

  renderLocationsSheet() {
    const presets = locations.filter(l => l.preset);

    return `
      <div class="sheet-page-header">
        <button class="back-btn sheet-back-btn" aria-label="返回">${this.icons['arrow-left']}</button>
        <h3>位置管理</h3>
        <button class="btn-icon sheet-add-btn" aria-label="添加">${this.icons['plus']}</button>
      </div>
      <div class="sheet-page-body">
        ${presets.map(loc => `
          <div class="list-item">
            <div class="icon-line">${this.icons['map-pin']}</div>
            <div style="flex:1">
              <div style="font-weight:500">${loc.name}</div>
              ${loc.parentId ? `<div style="font-size:var(--font-sm);color:var(--text-muted)">子位置</div>` : '<div style="font-size:var(--font-sm);color:var(--text-muted)">一级位置</div>'}
            </div>
            <span class="badge badge-info">预设</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderStatisticsSheet() {
    return `
      <div class="sheet-page-header">
        <button class="back-btn sheet-back-btn" aria-label="返回">${this.icons['arrow-left']}</button>
        <h3>统计概览</h3>
      </div>
      <div class="sheet-page-body">
        <div class="stats-row" style="margin-bottom:var(--space-xl)">
          <div class="stat-card primary">
            <div class="stat-icon">📦</div>
            <div class="stat-number">${stats.totalItems}</div>
            <div class="stat-label">物品总数</div>
          </div>
          <div class="stat-card secondary">
            <div class="stat-icon">📋</div>
            <div class="stat-number">${stats.pendingTodos}</div>
            <div class="stat-label">待完成</div>
          </div>
          <div class="stat-card success">
            <div class="stat-icon">✅</div>
            <div class="stat-number">${stats.completionRate}%</div>
            <div class="stat-label">完成率</div>
          </div>
        </div>
        <div class="section-label">物品分类分布</div>
        <div style="margin-top:var(--space-md)">
          ${Object.entries(stats.itemsByCategory).map(([cat, count]) => {
            const pct = Math.round((count / stats.totalItems) * 100);
            return `
              <div style="margin-bottom:var(--space-sm)">
                <div style="display:flex;justify-content:space-between;font-size:var(--font-sm);margin-bottom:4px">
                  <span>${cat}</span><span>${count} (${pct}%)</span>
                </div>
                <div style="height:8px;background:var(--gray-100);border-radius:var(--radius-full);overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:var(--radius-full);transition:width 0.5s ease"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderItemListSheet() {
    return this.renderItemListListView();
  },

  renderTodoListSheet() {
    return this.renderTodoListView();
  },
};

window.workbenchPage = WorkbenchPage;
