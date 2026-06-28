const spriteUrl = './lifetracker-v1.4-icons.svg';

const icon = (name) => `<svg class="icon"><use href="#${name}"/></svg>`;
const mark = (entry, accent = '#ff8754') => `
  <span class="mark" style="--accent:${accent}">
    ${entry.icon ? icon(entry.icon) : `<span class="letter">${entry.letter || ''}</span>`}
  </span>`;

const row = (entry) => `
  <div class="ui-row">
    ${mark(entry, entry.accent)}
    <div class="row-main"><strong>${entry.title}</strong><span>${entry.desc || ''}</span></div>
    ${entry.dot ? '<span class="unread-dot"></span>' : `<span class="chev">${entry.meta ?? '›'}</span>`}
  </div>`;

const action = (iconId, label, className = '') => `<div class="icon-btn ${className}" aria-label="${label}">${icon(iconId)}</div>`;
const actionGroup = (items = []) => `<div class="header-actions">${items.map((item) => action(item.icon, item.label)).join('')}</div>`;
const segmented = (items, active = 0) => `<div class="segmented">${items.map((item, i) => `<span class="pill ${i === active ? 'active' : ''}">${item}</span>`).join('')}</div>`;
const filters = segmented;
const field = (label, value, error = '') => `
  <div class="field ${error ? 'error' : ''}">
    <label>${label}</label>
    <div class="box">${value}</div>
    ${error ? `<small>${error}</small>` : ''}
  </div>`;
const actions = (buttons, single = false) => `<div class="actions ${single ? 'single' : ''}">${buttons.map((b) => `<div class="btn ${b.kind || ''}">${b.label}</div>`).join('')}</div>`;
const list = (items) => `<div class="row-list">${items.map(row).join('')}</div>`;
const section = (label) => `<div class="section-label">${label}</div>`;
const commonForm = (fields, saveLabel = '保存') => `<div class="form">${fields.map(([l, v, e]) => field(l, v, e)).join('')}</div>${actions([{label:'取消'}, {label: saveLabel, kind:'primary'}])}`;
const swipeDeleteSpec = (title = '列表项') => `<div class="swipe-spec"><div class="swipe-front">${mark({ icon: 'i-box' })}<div><strong>${title}</strong><span>左滑露出删除</span></div></div><div class="swipe-action">${icon('i-trash')}删除</div></div>`;
const chatComposer = () => `<div class="chat-composer"><div class="chat-input">输入消息...</div><div class="send-btn">发送</div></div>`;
const bottomTab = (active) => `
  <div class="bottom-tab">
    ${['首页','工作台','消息','我的'].map((name) => `<div class="tab ${name === active ? 'active' : ''}">${name}</div>`).join('')}
  </div>`;

function phone(screen) {
  const tone = screen.tone || 'dark';
  return `
    <article class="screen-wrap" data-screen="${screen.id}">
      <div class="screen-caption"><strong>${screen.caption}</strong><span>${screen.note || ''}</span></div>
      <div class="phone ${tone}">
        <div class="phone-inner">
          <div class="status-bar"><span>9:41</span><span class="status-dots"><i></i><i></i><i></i>100%</span></div>
          <header class="phone-header ${screen.action?.icon === 'i-back' ? 'has-back' : ''}">
            ${screen.action?.icon === 'i-back' ? action(screen.action.icon, screen.action.label, 'back-btn') : ''}
            <div class="phone-title"><h3>${screen.title}</h3></div>
            ${screen.actions ? actionGroup(screen.actions) : ''}
            ${screen.extraActions ? actionGroup(screen.extraActions) : ''}
            ${screen.action && screen.action.icon !== 'i-back' ? action(screen.action.icon, screen.action.label) : ''}
          </header>
          ${screen.body}
        </div>
        ${screen.tab ? bottomTab(screen.tab) : ''}
      </div>
    </article>`;
}

const modules = {
  itemRows: [
    { icon: 'i-box', title: '露营装备箱', desc: '储藏室 / 户外用品 · 12 件', accent: '#ff8754' },
    { letter: '证', title: '护照与证件袋', desc: '书房 / 证件 · 3 件', accent: '#8b68f5' },
    { letter: '药', title: '家庭药箱', desc: '客厅 / 药品 · 18 件', accent: '#32d296' },
  ],
  todoRows: [
    { letter: '○', title: '整理客厅收纳箱', desc: '今天 18:00 · 普通', meta: '', accent: '#8c98aa' },
    { icon: 'i-check', title: '更新证件到期提醒', desc: '已完成 · 昨天', meta: '', accent: '#32d296' },
    { icon: 'i-alert', title: '补充药箱清单', desc: '明天 10:00 · 紧急', meta: '', accent: '#ff6b7a' },
  ],
  messages: [
    { icon: 'i-chat', title: '张三', desc: '已置顶 · 露营装备箱权限待确认', accent: '#8b68f5', dot: true },
    { icon: 'i-bell', title: '系统通知', desc: '家庭药箱 2 件物品即将过期', accent: '#ff8754', dot: true },
    { icon: 'i-chat', title: '李四', desc: '好友 · 明天归还充电器', accent: '#32d296' },
  ],
};

const workbenchLifeRows = [
  { icon: 'i-borrow', title: '借用管理', desc: '列表 / 新增 / 编辑', accent: '#ff8754' },
  { icon: 'i-calendar', title: '日历视图', desc: '月视图 / 提醒编辑', accent: '#32d296' },
];

const workbenchDataRows = [
  { icon: 'i-stats', title: '数据统计', desc: 'KPI / 趋势 / 分类', accent: '#f36f3c' },
  { icon: 'i-bell', title: '通知中心', desc: '全部 / 未读 / 设置', accent: '#7c5cfc' },
  { icon: 'i-data', title: '数据管理', desc: '导出 / 导入 / 清理', accent: '#10a66e' },
  { icon: 'i-asset', title: '资产总览', desc: '估值 / 分类资产', accent: '#fbb329' },
  { icon: 'i-widget', title: '桌面小组件', desc: 'PWA / 快捷入口', accent: '#8b68f5' },
];

const crudRow = ({ id, group, index, title, desc, listTitle, iconId, accent, items, createFields, editFields }) => ({
  id, group, index, title, desc,
  screens: [
    {
      id: `${id}-list`, caption: `${listTitle} / 列表`, note: '列表、搜索、筛选', title: listTitle, actions: [{ icon: 'i-search', label: '搜索' }, { icon: 'i-plus', label: '新增' }],
      body: `${items.length ? list(items) : `<div class="empty-state">${icon(iconId)}<strong>暂无${listTitle}</strong><span>空状态统一使用线性图标、短标题和主操作。</span></div>`}`
    },
    {
      id: `${id}-create`, caption: `${listTitle} / 新增`, note: '新增表单', title: `新增${listTitle}`, action: { icon: 'i-back', label: '返回' },
      body: commonForm(createFields)
    },
    {
      id: `${id}-edit`, caption: `${listTitle} / 编辑`, note: '编辑表单', title: `编辑${listTitle}`, action: { icon: 'i-back', label: '返回' },
      body: commonForm(editFields, '保存修改')
    }
  ]
});

const rows = [
  {
    id: 'home', group: 'core', index: '第 1 排', title: '首页', desc: '首页只做总览、高频动作、搜索和通知入口。',
    screens: [
      {
        id: 'home-overview', caption: '首页 / 今日总览', note: '总览 + 搜索 + 高频动作', title: '今日总览', actions: [{ icon: 'i-search', label: '搜索' }, { icon: 'i-bell', label: '通知' }], tab: '首页',
        body: `<div class="stats-grid three">
            <div class="stat"><span>物品总数</span><strong>128</strong></div>
            <div class="stat"><span>待办未完成</span><strong>9</strong></div>
            <div class="stat"><span>已完成</span><strong>42</strong></div>
          </div>
          <div class="quick-grid">
            <div class="quick" style="--accent:var(--orange)"><strong>+</strong><br><span>添加物品</span></div>
            <div class="quick" style="--accent:var(--violet);background:var(--violet)"><strong>✓</strong><br><span>添加待办</span></div>
          </div>
          ${section('最近待办')}${list(modules.todoRows)}`
      },
      {
        id: 'home-notifications', caption: '首页 / 通知入口', note: '通知按钮触发通知列表', title: '通知中心', tab: '首页',
        body: `${segmented(['全部','未读','已读'])}${list([
          { icon: 'i-bell', title: '证件即将到期', desc: '身份证 · 7 天后提醒', accent: '#ff8754' },
          { icon: 'i-borrow', title: '借用即将归还', desc: '无线充电器 · 明天', accent: '#fbb329' },
          { icon: 'i-share', title: '共享申请', desc: 'Lin 请求查看家庭药箱', accent: '#32d296' },
        ])}`
      },
      {
        id: 'home-light', caption: '首页 / 浅色模式', note: '浅色同构，不只换背景', tone: 'light', title: '今日总览', actions: [{ icon: 'i-search', label: '搜索' }, { icon: 'i-bell', label: '通知' }], tab: '首页',
        body: `<div class="stats-grid three">
            <div class="stat"><span>物品总数</span><strong>128</strong></div>
            <div class="stat"><span>待办未完成</span><strong>9</strong></div>
            <div class="stat"><span>已完成</span><strong>42</strong></div>
          </div>${list(modules.todoRows.slice(0,2))}`
      }
    ]
  },
  {
    id: 'workbench', group: 'core', index: '第 2 排', title: '工作台 / 搜索结果', desc: '工作台平铺所有业务入口；搜索结果展示全部命中入口。',
    screens: [
      {
        id: 'workbench-main', caption: '工作台 / 全量入口', note: '功能入口平铺', title: '工作台', action: { icon: 'i-search', label: '搜索' }, tab: '工作台',
        body: `${section('核心功能')}${list([
            { icon: 'i-box', title: '物品', desc: '列表 / 新增 / 编辑', accent: '#ff8754' },
            { icon: 'i-todo', title: '待办', desc: '列表 / 新增 / 编辑', accent: '#8b68f5' },
            { icon: 'i-chat', title: '消息', desc: '列表 / 添加好友 / 对话', accent: '#32d296' },
          ])}
          ${section('管理工具')}${list([
            { icon: 'i-category', title: '分类管理', desc: '列表 / 新增 / 编辑', accent: '#ff8754' },
            { icon: 'i-location', title: '位置管理', desc: '列表 / 新增 / 编辑', accent: '#8b68f5' },
            { icon: 'i-template', title: '模板管理', desc: '列表 / 新增 / 编辑 / 使用', accent: '#fbb329' },
          ])}
          ${section('生活记录')}${list(workbenchLifeRows)}
          ${section('数据与提醒')}${list(workbenchDataRows)}`
      },
      {
        id: 'workbench-search', caption: '搜索功能 / 结果列表', note: '所有管理入口可搜索', tone: 'light', title: '搜索功能', action: { icon: 'i-search', label: '搜索' }, tab: '工作台',
        body: `${section('管理工具')}${list([
            { icon: 'i-category', title: '分类管理', desc: '列表 / 新增 / 编辑', accent: '#f36f3c' },
            { icon: 'i-location', title: '位置管理', desc: '列表 / 新增 / 编辑', accent: '#7c5cfc' },
            { icon: 'i-template', title: '模板管理', desc: '列表 / 新增 / 编辑 / 使用', accent: '#d89400' },
          ])}
          ${section('生活记录')}${list(workbenchLifeRows)}
          ${section('数据与提醒')}${list(workbenchDataRows)}`
      }
    ]
  },
  {
    id: 'items', group: 'core', index: '第 3 排', title: '物品', desc: '物品列表、新增、编辑；AI 识别只作为创建/编辑上下文能力。',
    screens: [
      {
        id: 'items-list', caption: '物品列表', note: '通用列表布局', title: '物品', actions: [{ icon: 'i-search', label: '搜索' }, { icon: 'i-plus', label: '新增' }],
        body: `${filters(['全部','证件','药品','户外'])}${list(modules.itemRows)}`
      },
      {
        id: 'items-create', caption: '物品列表 / 新增', note: '通用新增表单', title: '新增物品', action: { icon: 'i-back', label: '返回' },
        body: commonForm([
          ['物品名称','例：露营装备箱'], ['分类','户外用品 ›'], ['位置','储藏室 / 货架 B ›'], ['备注','记录品牌、数量、保质期等信息']
        ])
      },
      {
        id: 'items-edit', caption: '物品列表 / 编辑', note: '通用编辑表单', title: '编辑物品', action: { icon: 'i-back', label: '返回' },
        body: commonForm([
          ['物品名称','露营装备箱'], ['分类','户外用品 ›'], ['位置','储藏室 / 货架 B ›'], ['备注','帐篷、炉具、防潮垫、照明灯。']
        ], '保存修改')
      }
    ]
  },
  {
    id: 'todos', group: 'core', index: '第 4 排', title: '待办', desc: '待办列表、新增、编辑；完成态、优先级、提醒状态可见。',
    screens: [
      { id: 'todos-list', caption: '待办列表', note: '通用列表布局', title: '待办', actions: [{ icon: 'i-search', label: '搜索' }, { icon: 'i-plus', label: '新增' }], body: `${segmented(['全部','待完成','已完成'])}${list(modules.todoRows)}` },
      { id: 'todos-create', caption: '待办列表 / 新增', note: '通用新增表单', title: '新增待办', action: { icon: 'i-back', label: '返回' }, body: commonForm([['标题','补充药箱清单'],['截止时间','2026-06-29 10:00 ›'],['优先级','紧急 ›'],['提醒','提前 1 小时 ›'],['关联物品','家庭药箱 ›']]) },
      { id: 'todos-edit', caption: '待办列表 / 编辑', note: '通用编辑表单', title: '编辑待办', action: { icon: 'i-back', label: '返回' }, body: commonForm([['标题','整理客厅收纳箱'],['状态','待完成 ›'],['截止时间','今天 18:00 ›'],['优先级','普通 ›'],['关联物品','客厅收纳箱 ›']], '保存修改') },
    ]
  },
  {
    id: 'messages', group: 'core', index: '第 5 排', title: '消息', desc: '消息列表展示好友和系统通知；加号用于添加好友并发送验证申请，同意后才建立聊天。',
    screens: [
      { id: 'messages-list', caption: '消息列表', note: '好友 / 系统通知 / 未读', title: '消息', actions: [{ icon: 'i-search', label: '搜索' }, { icon: 'i-plus', label: '添加好友' }], tab: '消息', body: `${segmented(['全部','好友','系统'])}${list(modules.messages)}` },
      { id: 'messages-new', caption: '消息 / 添加好友', note: '发送验证申请', title: '添加好友', action: { icon: 'i-back', label: '返回' }, extraActions: [{ icon: 'i-search', label: '搜索' }], body: `${list([{letter:'L', title:'Lin', desc:'lin@example.com · 未添加', accent:'#ff8754'}, {letter:'M', title:'Ming', desc:'ming@example.com · 可发送申请', accent:'#8b68f5'}])}${field('验证消息','你好，我想添加你为好友')}${actions([{label:'取消'}, {label:'发送申请', kind:'primary'}])}` },
      { id: 'messages-friend', caption: '消息 / 好友操作', note: '置顶、共享设置', title: '张三', action: { icon: 'i-back', label: '返回' }, body: `${list([{icon:'i-user', title:'张三', desc:'好友 · 已通过验证', accent:'#8b68f5', meta:''}])}${section('好友操作')}${list([{icon:'i-check', title:'置顶 / 取消置顶', desc:'消息列表排序', accent:'#32d296', meta:''}, {icon:'i-share', title:'共享设置', desc:'物品 / 待办权限', accent:'#ff8754', meta:''}])}` },
      { id: 'messages-chat', caption: '消息 / 对话页', note: '文字气泡 + 资源卡片', title: '张三', action: { icon: 'i-back', label: '返回' }, body: `${list([{icon:'i-box', title:'露营装备箱', desc:'物品卡片 · 打开编辑/只读摘要', accent:'#ff8754'}])}<div style="display:grid;gap:10px;margin-top:14px"><div class="bubble">这个箱子放在哪？</div><div class="bubble mine">储藏室 B 层货架。</div></div>${chatComposer()}` },
    ]
  },
  {
    id: 'profile', group: 'settings', index: '第 6 排', title: '我的', desc: '我的只在底部 Tab 存在，外层平铺账号、偏好、数据与支持。',
    screens: [
      { id: 'profile-main', caption: '我的 / 外层平铺', note: '账号、偏好、数据与支持', title: '我的', tab: '我的', body: `<div class="profile-card"><div class="avatar">LT</div><div><strong>LifeTracker 用户</strong><span>user@example.com · ID 2048</span></div></div>${section('账号')}${list([{icon:'i-user', title:'账号管理', desc:'头像 / 昵称 / 邮箱', accent:'#ff8754'}, {icon:'i-lock', title:'修改密码', desc:'当前密码 / 新密码', accent:'#8b68f5'}, {icon:'i-trash', title:'退出登录', desc:'退出当前账号', accent:'#ff6b7a'}])}${section('偏好与支持')}${list([{icon:'i-theme', title:'主题 / 语言', desc:'深浅色 / 中文英文', accent:'#32d296'}, {icon:'i-sync', title:'同步 / 数据 / 反馈 / 版本', desc:'外层直接可见', accent:'#fbb329'}])}` },
      { id: 'profile-account', caption: '我的 / 账号管理', note: '通用编辑表单', tone: 'light', title: '账号管理', action: { icon: 'i-back', label: '返回' }, body: commonForm([['头像','当前头像 / 更换 ›'],['昵称','LifeTracker 用户'],['邮箱','user@example.com'],['用户 ID','2048（只读）']], '保存资料') },
      { id: 'profile-theme', caption: '我的 / 主题语言', note: '单选列表', tone: 'light', title: '主题 / 语言', action: { icon: 'i-back', label: '返回' }, body: `${list([{icon:'i-check', title:'跟随系统', desc:'当前选中', accent:'#10a66e', meta:''}, {icon:'i-theme', title:'深色模式', desc:'操作台深色', accent:'#7c5cfc'}, {letter:'日', title:'浅色模式', desc:'白底浅色', accent:'#f36f3c'}, {letter:'中', title:'中文', desc:'当前语言', accent:'#10a66e'}, {letter:'EN', title:'English', desc:'Language option', accent:'#7c5cfc'}])}` },
    ]
  },
  crudRow({ id:'categories', group:'manage', index:'第 7 排', title:'分类管理', desc:'分类列表、新增、编辑。', listTitle:'分类管理', iconId:'i-category', accent:'#ff8754', items:[['户外用品','18 件物品'],['证件资料','3 件物品'],['家庭事务','7 个待办']].map(([title,desc])=>({icon:'i-category', title, desc, accent:'#ff8754'})), createFields:[['名称','户外用品'],['图标','线性图标 / 户外包 ›'],['颜色','#FF8754'],['父级','无']], editFields:[['名称','户外用品'],['图标','线性图标 / 户外包 ›'],['颜色','#FF8754'],['父级','生活用品']] }),
  crudRow({ id:'locations', group:'manage', index:'第 8 排', title:'位置管理', desc:'位置列表、新增、编辑，支持层级。', listTitle:'位置管理', iconId:'i-location', accent:'#8b68f5', items:[['储藏室','货架 A / 货架 B'],['书房','抽屉 / 证件盒'],['客厅','电视柜 / 药箱']].map(([title,desc])=>({icon:'i-location', title, desc, accent:'#8b68f5'})), createFields:[['名称','储藏室'],['父级位置','无'],['备注','可放大件物品']], editFields:[['名称','货架 B'],['父级位置','储藏室'],['备注','第二层右侧']] }),
  crudRow({ id:'templates', group:'manage', index:'第 9 排', title:'模板管理', desc:'模板列表、新增、编辑/套用。', listTitle:'模板管理', iconId:'i-template', accent:'#fbb329', items:[['露营清单','物品模板 · 12 项'],['证件到期提醒','待办模板 · 3 项'],['家庭药箱','物品模板 · 18 项']].map(([title,desc])=>({icon:'i-template', title, desc, accent:'#fbb329'})), createFields:[['模板名称','家庭药箱'],['模板类型','物品'],['默认分类','药品']], editFields:[['模板名称','家庭药箱'],['套用入口','新增物品页'],['字段','名称/分类/备注']] }),
  crudRow({ id:'borrowing', group:'life', index:'第 10 排', title:'借用管理', desc:'借用列表、新增、编辑。', listTitle:'借用管理', iconId:'i-borrow', accent:'#ff8754', items:[['无线充电器','Lin · 明天归还'],['投影仪','Ming · 已逾期'],['露营灯','张三 · 已归还']].map(([title,desc])=>({icon:'i-borrow', title, desc, accent:'#ff8754'})), createFields:[['借用物品','无线充电器'],['借用人','Lin'],['归还日期','2026-07-02']], editFields:[['借用物品','无线充电器'],['状态','借出中'],['归还日期','2026-07-02']] }),
  {
    id: 'calendar', group: 'life', index: '第 11 排', title: '日历视图', desc: '日历月视图、提醒列表、提醒编辑。',
    screens: [
      { id:'calendar-month', caption:'日历 / 月视图', note:'今天、选中、有提醒三种状态', tone:'light', title:'日历视图', body:`<div class="calendar">${Array.from({length:35},(_,i)=>`<span class="day ${[4,11,18,28].includes(i + 1) ? 'event' : ''} ${i + 1 === 18 ? 'selected' : ''} ${i + 1 === 28 ? 'today' : ''}">${i+1}</span>`).join('')}</div>${section('当天提醒')}${list([{icon:'i-todo',title:'补充药箱清单',desc:'6月18日 10:00',accent:'#f36f3c'}, {icon:'i-bell',title:'证件到期提醒',desc:'6月18日 18:30',accent:'#7c5cfc'}])}` },
      { id:'calendar-edit', caption:'日历 / 编辑提醒', note:'通用编辑表单', tone:'light', title:'编辑提醒', action: { icon: 'i-back', label: '返回' }, body: commonForm([['提醒标题','证件到期提醒'],['日期','2026-07-04'],['时间','09:00'],['重复','不重复']], '保存提醒') },
    ]
  },
  {
    id: 'stats', group: 'data', index: '第 12 排', title: '数据统计', desc: '独立统计界面，不再只用模板代替。',
    screens: [
      { id:'stats-overview', caption:'数据统计 / 概览', note:'KPI / 趋势 / 分类', tone:'light', title:'数据统计', body:`${list([{icon:'i-stats', title:'本月新增', desc:'物品 24 / 待办 42', accent:'#f36f3c', meta:''}, {icon:'i-check', title:'完成率', desc:'82% · 较上周 +6%', accent:'#10a66e', meta:''}])}<div class="chart-card"><strong>待办完成趋势</strong><div class="chart-bars">${[28,44,62,36,70,88,76].map(h=>`<i style="height:${h}px"><span>${h}</span></i>`).join('')}</div></div>${list([{icon:'i-asset',title:'资产分布',desc:'电子设备 42% / 户外用品 23%',accent:'#f36f3c'}])}` },
      { id:'stats-filter', caption:'数据统计 / 筛选', note:'时间范围与类型', tone:'light', title:'统计筛选', body:`${segmented(['7 天','30 天','一年'],1)}${list([{icon:'i-box',title:'物品统计',desc:'新增、分类、位置分布',accent:'#f36f3c'}, {icon:'i-todo',title:'待办统计',desc:'完成率、逾期、优先级',accent:'#7c5cfc'}, {icon:'i-asset',title:'资产统计',desc:'估值、折旧、分类资产',accent:'#10a66e'}])}` },
    ]
  },
  {
    id: 'notifications', group: 'data', index: '第 13 排', title: '通知中心', desc: '通知列表、已读状态、通知设置。',
    screens: [
      { id:'notifications-list', caption:'通知中心 / 列表', note:'全部 / 未读 / 已读', title:'通知中心', body:`${segmented(['全部','未读','已读'])}${list([{icon:'i-bell', title:'证件即将到期', desc:'7 天后到期 · 点击查看', accent:'#ff8754'}, {icon:'i-share', title:'好友申请已通过', desc:'Lin 已接受好友申请', accent:'#32d296'}, {icon:'i-sync', title:'数据同步完成', desc:'刚刚 · 3 项变更', accent:'#8b68f5'}])}` },
      { id:'notifications-settings', caption:'通知中心 / 设置', note:'提醒偏好', title:'通知设置', action: { icon: 'i-back', label: '返回' }, body:`${list([{icon:'i-bell',title:'到期提醒',desc:'提前 7 天',accent:'#ff8754'}, {icon:'i-borrow',title:'借用提醒',desc:'归还前 1 天',accent:'#fbb329'}, {icon:'i-chat',title:'消息通知',desc:'开启',accent:'#32d296'}])}` },
    ]
  },
  {
    id: 'data', group: 'data', index: '第 14 排', title: '数据管理', desc: '导出、导入、清理和恢复。',
    screens: [
      { id:'data-manage', caption:'数据管理 / 动作列表', note:'小弹窗确认态', tone:'light', title:'数据管理', body:`${list([{icon:'i-data', title:'导出 JSON', desc:'完整备份当前数据', accent:'#f36f3c'}, {letter:'CSV', title:'导出 CSV', desc:'表格格式，便于分析', accent:'#7c5cfc'}, {icon:'i-sync', title:'导入备份', desc:'从 JSON 恢复', accent:'#10a66e'}, {icon:'i-trash', title:'清理回收站', desc:'删除已回收数据', accent:'#e84a5f'}])}<div class="modal-scrim"><div class="confirm-modal"><strong>确认清理数据？</strong><p>此操作会删除回收站中的数据，完成后无法恢复。</p><div class="modal-actions"><span>取消</span><span class="danger">确认清理</span></div></div></div>` },
    ]
  },
  {
    id: 'assets', group: 'data', index: '第 15 排', title: '资产总览', desc: '资产 KPI、分类分布、价值编辑。',
    screens: [
      { id:'assets-overview', caption:'资产总览 / 概览', note:'价值 / 折旧 / 分类', tone:'light', title:'资产总览', body:`<div class="chart-card"><strong style="font-size:28px">¥ 18,420</strong><p>当前资产估值</p></div>${list([{letter:'电',title:'电子设备',desc:'¥ 7,820 · 42%',accent:'#f36f3c'}, {letter:'户',title:'户外用品',desc:'¥ 4,230 · 23%',accent:'#7c5cfc'}, {letter:'证',title:'证件资料',desc:'不可估值 · 3 件',accent:'#10a66e'}])}` },
      { id:'assets-edit', caption:'资产总览 / 价值编辑', note:'通用编辑表单', tone:'light', title:'编辑资产值', action: { icon: 'i-back', label: '返回' }, body: commonForm([['物品','露营装备箱'],['购买价格','¥ 4,980'],['当前估值','¥ 4,230'],['折旧规则','手动估值']], '保存估值') },
    ]
  },
  {
    id: 'widgets', group: 'data', index: '第 16 排', title: '桌面小组件', desc: 'PWA 小组件说明、预览、快捷配置。',
    screens: [
      { id:'widgets-settings', caption:'桌面小组件 / 设置', note:'PWA 预览 / 快捷入口', title:'桌面小组件', body:`<div class="widget-card"><h3>今日待办</h3><strong style="font-size:32px;color:var(--orange)">3</strong><p>项待完成</p></div>${list([{icon:'i-widget', title:'小组件内容', desc:'待办列表 / 统计摘要', accent:'#8b68f5'}, {icon:'i-plus', title:'快捷入口', desc:'添加物品 / 添加待办', accent:'#ff8754'}, {letter:'PWA', title:'安装 PWA', desc:'添加到桌面说明', accent:'#32d296'}])}` },
    ]
  }
];

async function injectSprite() {
  const target = document.querySelector('[data-svg-sprite]');
  const response = await fetch(spriteUrl);
  target.innerHTML = await response.text();
}

function render() {
  const map = document.getElementById('interactionMap');
  map.innerHTML = rows.map((feature) => `
    <section class="feature-row" data-group="${feature.group}" id="${feature.id}">
      <div class="row-head">
        <div><div class="row-index">${feature.index}</div><h2 class="row-title">${feature.title}</h2></div>
        <p class="row-desc">${feature.desc}</p>
      </div>
      <div class="screen-grid">${feature.screens.map(phone).join('')}</div>
    </section>`).join('');
}

function bindToolbar() {
  document.querySelectorAll('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      document.querySelectorAll('.feature-row[data-group]').forEach((rowEl) => {
        rowEl.hidden = filter !== 'all' && rowEl.dataset.group !== filter;
      });
    });
  });
  document.getElementById('expandAll').addEventListener('click', () => {
    document.querySelectorAll('.feature-row[data-group]').forEach((rowEl) => { rowEl.hidden = false; });
    document.querySelectorAll('[data-filter]').forEach((b) => b.classList.toggle('active', b.dataset.filter === 'all'));
  });
}

injectSprite().then(() => {
  render();
  bindToolbar();
});
