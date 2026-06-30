#!/usr/bin/env node

import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const config = {
  appUrl: process.env.QA_APP_URL || 'http://localhost:3021',
  realApi: process.env.QA_UI_REAL === '1',
  mutateRealApi: process.env.QA_UI_MUTATE === '1',
  email: process.env.QA_USER_A_EMAIL || 'qa-ui@example.com',
  password: process.env.QA_USER_A_PASSWORD || 'Password123!',
  headed: process.env.QA_HEADED === '1',
  slowMo: Number(process.env.QA_SLOW_MO || 0),
  outputRoot: process.env.QA_UI_OUTPUT || path.resolve(process.cwd(), '../docs/qa'),
};

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const outputDir = path.join(config.outputRoot, `ui-integration-${runId}`);
const screenshotsDir = path.join(outputDir, 'screenshots');
const apiCalls = [];
const pageResults = [];
const formResults = [];
let currentStep = 'bootstrap';

const nowIso = () => new Date().toISOString();

function assert(condition, message, detail) {
  if (!condition) {
    const suffix = detail ? `\n${JSON.stringify(detail, null, 2)}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

function getPayloadData(payload) {
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

function apiLogEntry(method, pathname, status, source, requestBody) {
  apiCalls.push({
    at: nowIso(),
    step: currentStep,
    method,
    path: pathname,
    status,
    source,
    requestBody,
  });
}

function response(data, status = 200, message = 'OK') {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify({ code: status, data, message }),
  };
}

function ok(data, status = 200) {
  return response(data, status);
}

function deleted() {
  return ok({ success: true });
}

function makeDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString();
}

function createMockDb() {
  const user = {
    id: 'qa-user-1',
    email: config.email,
    display_name: 'QA 自动化用户',
    avatar_url: null,
  };

  const categories = [
    { id: 'cat-system-item', name: '电子设备', type: 'item', icon: 'laptop', color: '#F36F3C', user_id: null, created_at: makeDate(-12) },
    { id: 'cat-system-todo', name: '日常任务', type: 'todo', icon: 'check-circle-outline', color: '#7C5CFC', user_id: null, created_at: makeDate(-12) },
    { id: 'cat-item-qa', name: 'QA 物品分类', type: 'item', icon: 'package-variant', color: '#F36F3C', user_id: user.id, created_at: makeDate(-8) },
    { id: 'cat-todo-qa', name: 'QA 待办分类', type: 'todo', icon: 'checkbox-marked-circle-outline', color: '#10A66E', user_id: user.id, created_at: makeDate(-8) },
  ];

  const locations = [
    { id: 'loc-system-home', name: '家', icon: 'home', level: 0, parent_id: null, user_id: null },
    { id: 'loc-qa-room', name: 'QA 客厅', icon: 'sofa', level: 0, parent_id: null, user_id: user.id },
  ];

  const items = [
    {
      id: 'item-qa-1',
      name: 'QA 露营灯',
      description: '自动化种子物品',
      category_id: 'cat-item-qa',
      location_id: 'loc-qa-room',
      images: [],
      current_value: 320,
      purchase_price: 399,
      currency: 'CNY',
      reminder_enabled: false,
      created_at: makeDate(-3),
      updated_at: makeDate(-2),
      user_id: user.id,
    },
  ];

  const todos = [
    {
      id: 'todo-qa-1',
      title: 'QA 补充药箱',
      description: '自动化种子待办',
      category_id: 'cat-todo-qa',
      priority: 3,
      completed: false,
      due_date: makeDate(2),
      created_at: makeDate(-2),
      updated_at: makeDate(-1),
      user_id: user.id,
    },
    {
      id: 'todo-qa-2',
      title: 'QA 清洁露营箱',
      description: '已完成种子待办',
      category_id: 'cat-todo-qa',
      priority: 2,
      completed: true,
      due_date: makeDate(-1),
      created_at: makeDate(-4),
      updated_at: makeDate(-1),
      user_id: user.id,
    },
  ];

  const borrowings = [
    {
      id: 'borrowing-qa-1',
      item_id: 'item-qa-1',
      item_name: 'QA 露营灯',
      borrower_name: 'QA Lin',
      borrower_contact: '13800000000',
      status: 'borrowed',
      borrow_date: makeDate(-1),
      expected_return_date: makeDate(5),
      notes: '自动化种子借用',
      created_at: makeDate(-1),
      updated_at: makeDate(-1),
    },
  ];

  const templates = [
    {
      id: 'tpl-item-qa',
      name: 'QA 物品模板',
      description: '自动化物品模板',
      template_type: 'item',
      icon: 'package-variant',
      color: '#F36F3C',
      usage_count: 1,
      data: { name: '模板物品', category_id: 'cat-item-qa', location_id: 'loc-qa-room' },
      created_at: makeDate(-4),
    },
    {
      id: 'tpl-todo-qa',
      name: 'QA 待办模板',
      description: '自动化待办模板',
      template_type: 'todo',
      icon: 'check-circle-outline',
      color: '#10A66E',
      usage_count: 2,
      data: { title: '模板待办', category_id: 'cat-todo-qa', priority: 2 },
      created_at: makeDate(-4),
    },
  ];

  const conversations = [
    {
      id: 'conv-qa-1',
      participant_ids: [user.id, 'qa-friend-1'],
      other_user: { user_id: 'qa-friend-1', display_name: 'QA 好友', email: 'qa-friend@example.com', avatar_url: null },
      last_message: { id: 'msg-qa-1', type: 'text', content: '自动化验收消息', created_at: makeDate(-1) },
      last_message_type: 'text',
      unread_count: 1,
      updated_at: makeDate(-1),
      created_at: makeDate(-2),
    },
  ];

  const messages = [
    {
      id: 'msg-qa-1',
      conversation_id: 'conv-qa-1',
      sender_id: 'qa-friend-1',
      type: 'text',
      content: '自动化验收消息',
      created_at: makeDate(-1),
    },
  ];

  const friends = [
    {
      id: 'friendship-qa-1',
      status: 'accepted',
      pinned: false,
      friend: { id: 'qa-friend-1', display_name: 'QA 好友', email: 'qa-friend@example.com', avatar_url: null },
      created_at: makeDate(-6),
    },
  ];

  return {
    user,
    categories,
    locations,
    items,
    todos,
    borrowings,
    templates,
    conversations,
    messages,
    friends,
    shares: [],
    feedback: [],
  };
}

const db = createMockDb();

function parseBody(request) {
  try {
    return request.postDataJSON();
  } catch {
    return null;
  }
}

function nextId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function withTimestamps(entity) {
  const date = new Date().toISOString();
  return { ...entity, created_at: entity.created_at || date, updated_at: date };
}

function routeMockApi(pathname, method, body, search = '') {
  if (pathname === '/api/auth/signin' && method === 'POST') {
    return ok({ token: 'qa-token', user: db.user });
  }
  if (pathname === '/api/auth/signup' && method === 'POST') {
    return ok({ token: 'qa-token', user: { ...db.user, email: body?.email || db.user.email } });
  }
  if (pathname === '/api/auth/reset-password' && method === 'POST') return ok({ success: true });
  if (pathname === '/api/auth/update-password' && method === 'POST') return ok({ success: true });
  if (pathname === '/api/auth/change-password' && method === 'POST') return ok({ success: true });
  if (pathname === '/api/auth/profile' && method === 'GET') return ok(db.user);
  if (pathname === '/api/auth/profile' && method === 'PUT') {
    Object.assign(db.user, body || {});
    return ok(db.user);
  }

  if (pathname === '/api/items/expiring' && method === 'GET') return ok(db.items.filter((item) => item.expiry_date));
  if (pathname === '/api/items/total-value' && method === 'GET') {
    const totalPurchase = db.items.reduce((sum, item) => sum + Number(item.purchase_price || 0), 0);
    const totalCurrent = db.items.reduce((sum, item) => sum + Number(item.current_value || 0), 0);
    return ok({
      total_purchase_price: totalPurchase,
      total_current_value: totalCurrent,
      total_depreciation: Math.max(0, totalPurchase - totalCurrent),
      by_category: [
        { category_id: 'cat-item-qa', category_name: 'QA 物品分类', total_value: totalCurrent || 320 },
      ],
    });
  }
  if (pathname === '/api/items' && method === 'GET') return ok(db.items);
  if (pathname === '/api/items' && method === 'POST') {
    const item = withTimestamps({ id: nextId('item'), images: [], currency: 'CNY', ...body });
    db.items.unshift(item);
    return ok(item, 201);
  }
  const itemMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
  if (itemMatch) {
    const id = itemMatch[1];
    const index = db.items.findIndex((item) => item.id === id);
    if (method === 'GET') return ok(db.items[index] || null);
    if (method === 'PUT') {
      db.items[index] = withTimestamps({ ...db.items[index], ...body, id });
      return ok(db.items[index]);
    }
    if (method === 'DELETE') {
      db.items = db.items.filter((item) => item.id !== id);
      return deleted();
    }
  }
  const itemBorrowingMatch = pathname.match(/^\/api\/items\/([^/]+)\/borrowings$/);
  if (itemBorrowingMatch && method === 'GET') {
    return ok(db.borrowings.filter((borrowing) => borrowing.item_id === itemBorrowingMatch[1]));
  }

  if (pathname === '/api/todos' && method === 'GET') return ok(db.todos);
  if (pathname === '/api/todos' && method === 'POST') {
    const todo = withTimestamps({ id: nextId('todo'), completed: false, images: [], ...body });
    db.todos.unshift(todo);
    return ok(todo, 201);
  }
  if (pathname === '/api/todos/reorder' && method === 'POST') return ok((body || []).map((item) => item.id));
  const todoMatch = pathname.match(/^\/api\/todos\/([^/]+)$/);
  if (todoMatch) {
    const id = todoMatch[1];
    const index = db.todos.findIndex((todo) => todo.id === id);
    if (method === 'GET') return ok(db.todos[index] || null);
    if (method === 'PUT') {
      db.todos[index] = withTimestamps({ ...db.todos[index], ...body, id });
      return ok(db.todos[index]);
    }
    if (method === 'DELETE') {
      db.todos = db.todos.filter((todo) => todo.id !== id);
      return deleted();
    }
  }

  if (pathname === '/api/categories' && method === 'GET') return ok(db.categories);
  if (pathname === '/api/categories' && method === 'POST') {
    const category = withTimestamps({ id: nextId('cat'), user_id: db.user.id, ...body });
    db.categories.push(category);
    return ok(category, 201);
  }
  const categoryMatch = pathname.match(/^\/api\/categories\/([^/]+)$/);
  if (categoryMatch) {
    const id = categoryMatch[1];
    const index = db.categories.findIndex((category) => category.id === id);
    if (method === 'GET') return ok(db.categories[index] || null);
    if (method === 'PUT') {
      db.categories[index] = withTimestamps({ ...db.categories[index], ...body, id });
      return ok(db.categories[index]);
    }
    if (method === 'DELETE') {
      db.categories = db.categories.filter((category) => category.id !== id);
      return deleted();
    }
  }

  if (pathname === '/api/locations' && method === 'GET') return ok(db.locations);
  if (pathname === '/api/locations' && method === 'POST') {
    const location = withTimestamps({ id: nextId('loc'), user_id: db.user.id, ...body });
    db.locations.push(location);
    return ok(location, 201);
  }
  const locationMatch = pathname.match(/^\/api\/locations\/([^/]+)$/);
  if (locationMatch) {
    const id = locationMatch[1];
    const index = db.locations.findIndex((location) => location.id === id);
    if (method === 'GET') return ok(db.locations[index] || null);
    if (method === 'PUT') {
      db.locations[index] = withTimestamps({ ...db.locations[index], ...body, id });
      return ok(db.locations[index]);
    }
    if (method === 'DELETE') {
      db.locations = db.locations.filter((location) => location.id !== id);
      return deleted();
    }
  }

  if (pathname === '/api/feedback' && method === 'POST') {
    const item = { id: nextId('feedback'), ...body, created_at: new Date().toISOString() };
    db.feedback.push(item);
    return ok(item, 201);
  }

  if (pathname === '/api/templates' && method === 'GET') return ok(db.templates);
  const templateUseMatch = pathname.match(/^\/api\/templates\/([^/]+)\/use$/);
  if (templateUseMatch && method === 'POST') {
    const template = db.templates.find((item) => item.id === templateUseMatch[1]);
    if (template?.template_type === 'item') {
      const item = withTimestamps({ id: nextId('item'), images: [], ...template.data });
      db.items.unshift(item);
      return ok(item, 201);
    }
    const todo = withTimestamps({ id: nextId('todo'), completed: false, ...template?.data });
    db.todos.unshift(todo);
    return ok(todo, 201);
  }

  if (pathname === '/api/borrowings' && method === 'GET') return ok(db.borrowings);
  if (pathname === '/api/borrowings/active' && method === 'GET') return ok(db.borrowings.filter((item) => item.status !== 'returned'));
  if (pathname === '/api/borrowings' && method === 'POST') {
    const item = db.items.find((candidate) => candidate.id === body?.item_id);
    const borrowing = withTimestamps({
      id: nextId('borrowing'),
      status: 'borrowed',
      borrow_date: new Date().toISOString(),
      item_name: item?.name,
      ...body,
    });
    db.borrowings.unshift(borrowing);
    if (item) item.is_borrowed = true;
    return ok(borrowing, 201);
  }
  const borrowingMatch = pathname.match(/^\/api\/borrowings\/([^/]+)$/);
  if (borrowingMatch) {
    const id = borrowingMatch[1];
    const index = db.borrowings.findIndex((borrowing) => borrowing.id === id);
    if (method === 'GET') return ok(db.borrowings[index] || null);
    if (method === 'PUT') {
      db.borrowings[index] = withTimestamps({ ...db.borrowings[index], ...body, id });
      return ok(db.borrowings[index]);
    }
    if (method === 'DELETE') {
      db.borrowings = db.borrowings.filter((borrowing) => borrowing.id !== id);
      return deleted();
    }
  }

  if (pathname === '/api/shares/outgoing' && method === 'GET') return ok(db.shares.filter((share) => share.owner_id === db.user.id));
  if (pathname === '/api/shares/incoming' && method === 'GET') return ok(db.shares.filter((share) => share.shared_with_id === db.user.id));
  const resourceShareMatch = pathname.match(/^\/api\/shares\/resource\/([^/]+)\/([^/]+)$/);
  if (resourceShareMatch && method === 'GET') {
    return ok(db.shares.filter((share) => share.resource_type === resourceShareMatch[1] && share.resource_id === resourceShareMatch[2]));
  }
  if (pathname === '/api/shares' && method === 'POST') {
    const share = withTimestamps({ id: nextId('share'), owner_id: db.user.id, ...body });
    db.shares.unshift(share);
    return ok(share, 201);
  }

  if (pathname === '/api/calendar' && method === 'GET') {
    const urlMonth = Number(new URL(`http://qa.local${pathname}${search}`).searchParams.get('month')) || new Date().getMonth() + 1;
    return ok({
      year: new Date().getFullYear(),
      month: urlMonth,
      days: [
        { date: new Date().toISOString().split('T')[0], todos: db.todos.slice(0, 1), events: [] },
      ],
    });
  }
  if (pathname === '/api/widgets/stats' && method === 'GET') {
    return ok({
      items_count: db.items.length,
      todos_pending: db.todos.filter((todo) => !todo.completed).length,
      todos_completed: db.todos.filter((todo) => todo.completed).length,
    });
  }
  if (pathname === '/api/widgets/todos' && method === 'GET') return ok({ todos: db.todos.slice(0, 5) });
  if (pathname.startsWith('/api/stats/') && method === 'GET') return ok({});

  if (pathname === '/api/messages/conversations' && method === 'GET') return ok(db.conversations);
  if (pathname === '/api/messages/conversations/manual' && method === 'POST') {
    const conversation = withTimestamps({
      id: nextId('conv'),
      participant_ids: body?.participant_ids || [db.user.id],
      other_user: { user_id: 'qa-friend-1', display_name: 'QA 好友' },
      unread_count: 0,
    });
    db.conversations.unshift(conversation);
    return ok({ conversation, message: null }, 201);
  }
  const conversationMessagesMatch = pathname.match(/^\/api\/messages\/conversations\/([^/]+)$/);
  if (conversationMessagesMatch && method === 'GET') {
    return ok(db.messages.filter((message) => message.conversation_id === conversationMessagesMatch[1]));
  }
  const sendMessageMatch = pathname.match(/^\/api\/messages\/conversations\/([^/]+)\/messages$/);
  if (sendMessageMatch && method === 'POST') {
    const message = withTimestamps({
      id: nextId('msg'),
      conversation_id: sendMessageMatch[1],
      sender_id: db.user.id,
      type: body?.type || 'text',
      content: body?.content || '',
    });
    db.messages.push(message);
    return ok(message, 201);
  }
  const markReadMatch = pathname.match(/^\/api\/messages\/conversations\/([^/]+)\/read$/);
  if (markReadMatch && method === 'PATCH') return ok({ success: true });
  if (pathname === '/api/messages/users/search' && method === 'GET') {
    return ok([{ id: 'qa-friend-1', email: 'qa-friend@example.com', display_name: 'QA 好友', avatar_url: null }]);
  }
  if (pathname === '/api/messages/friends' && method === 'GET') return ok(db.friends);
  if (pathname === '/api/messages/friends/requests' && method === 'GET') return ok([]);
  if (pathname === '/api/messages/friends/requests' && method === 'POST') {
    const request = withTimestamps({
      id: nextId('friend-request'),
      status: 'pending',
      direction: 'outgoing',
      friend: { id: body?.target_user_id, display_name: 'QA 好友' },
    });
    return ok(request, 201);
  }

  if (pathname.startsWith('/api/upload/') && method === 'POST') {
    return ok({ urls: [], url: '' }, 201);
  }

  return ok(null);
}

async function setupMockRoutes(page) {
  if (config.realApi) return;

  await page.route('**/socket.io/**', async (route) => {
    apiLogEntry(route.request().method(), new URL(route.request().url()).pathname, 204, 'mock-socket');
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const body = parseBody(request);
    const result = routeMockApi(url.pathname, method, body, url.search);
    apiLogEntry(method, `${url.pathname}${url.search}`, result.status, 'mock', body);
    await route.fulfill(result);
  });
}

async function recordRealApiResponses(page) {
  if (!config.realApi) return;
  page.on('response', (res) => {
    try {
      const url = new URL(res.url());
      if (url.pathname.startsWith('/api/')) {
        apiLogEntry(res.request().method(), `${url.pathname}${url.search}`, res.status(), 'real');
      }
    } catch {}
  });
}

async function waitForApp() {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(config.appUrl);
      if (res.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Frontend dev server is not reachable: ${config.appUrl}. Run "npm start" in frontend first.`);
}

async function settle(page, ms = 700) {
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
  await page.waitForTimeout(ms);
}

async function screenshot(page, name) {
  const file = `${name}.png`;
  const filepath = path.join(screenshotsDir, file);
  await page.screenshot({ path: filepath, fullPage: true });
  return `screenshots/${file}`;
}

function callsSince(index) {
  return apiCalls.slice(index);
}

function hasCall(calls, matcher) {
  return calls.some((call) => {
    if (typeof matcher === 'string') return call.path.startsWith(matcher);
    return matcher.test(call.path);
  });
}

async function gotoAndCapture(page, name, route, expectedText, expectedApi = []) {
  currentStep = `page:${name}`;
  const start = apiCalls.length;
  await page.goto(new URL(route, config.appUrl).toString());
  await settle(page, 900);
  if (expectedText) {
    await page.getByText(expectedText, { exact: false }).first().waitFor({ timeout: 8000 });
  }
  const image = await screenshot(page, name);
  const calls = callsSince(start);
  const missingApi = expectedApi.filter((matcher) => !hasCall(calls, matcher));
  const result = {
    name,
    route,
    actualUrl: page.url(),
    screenshot: image,
    expectedApi: expectedApi.map(String),
    observedApi: calls.map((call) => `${call.method} ${call.path} -> ${call.status}`),
    missingApi: missingApi.map(String),
    status: missingApi.length ? 'WARN' : 'PASS',
  };
  pageResults.push(result);
  return result;
}

async function clickText(page, text, options = {}) {
  await page.getByText(text, { exact: options.exact ?? true }).last().click({ timeout: options.timeout || 8000 });
}

async function fillLastInput(page, value) {
  await page.locator('input, textarea').last().fill(value);
}

async function runForm(name, fn) {
  currentStep = `form:${name}`;
  const start = apiCalls.length;
  const result = { name, status: 'PASS', observedApi: [], error: null, screenshot: null };
  try {
    result.screenshot = await fn();
  } catch (error) {
    result.status = 'FAIL';
    result.error = error instanceof Error ? error.message : String(error);
  }
  result.observedApi = callsSince(start).map((call) => `${call.method} ${call.path} -> ${call.status}`);
  formResults.push(result);
  if (result.status === 'FAIL') throw new Error(`${name} failed: ${result.error}`);
}

async function login(page) {
  currentStep = 'form:login';
  await page.goto(new URL('/auth/login', config.appUrl).toString());
  await settle(page);
  await page.getByPlaceholder('请输入邮箱或手机号').fill(config.email);
  await page.getByPlaceholder('请输入密码').fill(config.password);
  await clickText(page, '登录');
  await page.waitForTimeout(1200);
  assert(!page.url().includes('/auth/login'), 'Login did not leave the login screen', { url: page.url() });
}

async function runAuthForms(browser) {
  if (config.realApi) return;

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await setupMockRoutes(page);

  await runForm('reset-password-form', async () => {
    await page.goto(new URL('/auth/reset-password', config.appUrl).toString());
    await settle(page);
    await page.getByPlaceholder('请输入注册邮箱').fill(config.email);
    await clickText(page, '发送重置链接');
    await page.waitForTimeout(500);
    return screenshot(page, 'form-reset-password');
  });

  await runForm('register-form', async () => {
    await page.goto(new URL('/auth/register', config.appUrl).toString());
    await settle(page);
    await page.getByPlaceholder('请输入邮箱地址').fill(`qa-${Date.now()}@example.com`);
    await page.getByPlaceholder('请输入密码（至少6位）').fill(config.password);
    await page.getByPlaceholder('请再次输入密码').fill(config.password);
    await clickText(page, '注册');
    await page.waitForTimeout(800);
    return screenshot(page, 'form-register');
  });

  await context.close();
}

async function runMutationForms(page) {
  if (config.realApi && !config.mutateRealApi) {
    formResults.push({
      name: 'mutation-forms',
      status: 'SKIP',
      observedApi: [],
      screenshot: null,
      error: 'Real API mutation forms are skipped unless QA_UI_MUTATE=1.',
    });
    return;
  }

  await runForm('category-create-form', async () => {
    await page.goto(new URL('/settings/category-manage', config.appUrl).toString());
    await settle(page);
    await clickText(page, '新增分类');
    await fillLastInput(page, `QA 表单分类 ${Date.now()}`);
    await clickText(page, '保存');
    await page.waitForTimeout(900);
    return screenshot(page, 'form-category-create');
  });

  await runForm('location-create-form', async () => {
    await page.goto(new URL('/settings/location-manage', config.appUrl).toString());
    await settle(page);
    await clickText(page, '新增位置');
    await fillLastInput(page, `QA 表单位置 ${Date.now()}`);
    await clickText(page, '保存');
    await page.waitForTimeout(900);
    return screenshot(page, 'form-location-create');
  });

  await runForm('item-create-form', async () => {
    await page.goto(new URL('/item/create', config.appUrl).toString());
    await settle(page);
    await page.getByPlaceholder('例如：露营装备箱').fill(`QA 表单物品 ${Date.now()}`);
    await clickText(page, '选择分类');
    await clickText(page, 'QA 物品分类');
    await clickText(page, '选择存放位置');
    await clickText(page, 'QA 客厅');
    await page.getByPlaceholder('记录品牌、数量、保质期等信息').fill('自动化表单提交物品');
    await clickText(page, '保存');
    await page.waitForTimeout(1200);
    return screenshot(page, 'form-item-create');
  });

  await runForm('todo-create-form', async () => {
    await page.goto(new URL('/todo/create', config.appUrl).toString());
    await settle(page);
    await page.getByPlaceholder('例如：补充药箱清单').fill(`QA 表单待办 ${Date.now()}`);
    await clickText(page, '选择分类');
    await clickText(page, 'QA 待办分类');
    await page.getByPlaceholder('添加详细描述...').fill('自动化表单提交待办');
    await clickText(page, '保存');
    await page.waitForTimeout(1200);
    return screenshot(page, 'form-todo-create');
  });

  await runForm('borrowing-create-form', async () => {
    await page.goto(new URL('/settings/borrowing-create', config.appUrl).toString());
    await settle(page);
    await clickText(page, '选择要借出的物品');
    await page.getByText('QA 露营灯', { exact: false }).first().click();
    await page.getByPlaceholder('例如：Lin').fill(`QA 借用人 ${Date.now()}`);
    await page.getByPlaceholder('手机号 / 微信 / 邮箱').fill('13800000000');
    await page.getByPlaceholder('例如：用于露营活动，归还前一天提醒我').fill('自动化借用记录');
    await clickText(page, '保存');
    await page.waitForTimeout(1200);
    return screenshot(page, 'form-borrowing-create');
  });

  await runForm('feedback-form', async () => {
    await page.goto(new URL('/settings/feedback', config.appUrl).toString());
    await settle(page);
    await page.getByPlaceholder('请详细描述您遇到的问题或建议...').fill(`QA 自动化反馈 ${Date.now()}`);
    await page.getByPlaceholder('选填，方便我们联系您').fill(config.email);
    await clickText(page, '提交反馈');
    await page.waitForTimeout(900);
    return screenshot(page, 'form-feedback');
  });

  if (!config.realApi) {
    await runForm('change-password-form', async () => {
      await page.goto(new URL('/settings/change-password', config.appUrl).toString());
      await settle(page);
      await page.getByPlaceholder('输入当前密码').fill(config.password);
      await page.getByPlaceholder('输入新密码（至少6位）').fill('Password456!');
      await page.getByPlaceholder('再次输入新密码').fill('Password456!');
      await clickText(page, '保存');
      await page.waitForTimeout(900);
      return screenshot(page, 'form-change-password');
    });
  }
}

async function runMessageForm(page) {
  if (config.realApi && !config.mutateRealApi) return;
  await runForm('message-send-form', async () => {
    await page.goto(new URL('/message/conv-qa-1', config.appUrl).toString());
    await settle(page);
    const input = page.getByPlaceholder('输入消息...');
    await input.fill(`QA 消息 ${Date.now()}`);
    const box = await input.boundingBox();
    assert(box, 'Could not find message input bounds');
    await page.mouse.click(box.x + box.width + 28, box.y + box.height / 2);
    await page.waitForTimeout(900);
    return screenshot(page, 'form-message-send');
  });
}

async function writeReport() {
  const reportJson = {
    runId,
    appUrl: config.appUrl,
    mode: config.realApi ? 'real-api' : 'mock-api',
    mutateRealApi: config.mutateRealApi,
    generatedAt: nowIso(),
    outputDir,
    pageResults,
    formResults,
    apiCalls,
  };
  await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(reportJson, null, 2));

  const lines = [
    '# UI Integration Automation Report',
    '',
    `- Run: ${runId}`,
    `- App: ${config.appUrl}`,
    `- Mode: ${config.realApi ? 'real API' : 'mock API'}`,
    `- Screenshots: ./screenshots`,
    '',
    '## Pages',
    '',
    '| Status | Page | Route | Screenshot | Observed API | Missing Expected API |',
    '|---|---|---|---|---|---|',
    ...pageResults.map((item) => (
      `| ${item.status} | ${item.name} | \`${item.route}\` | [png](${item.screenshot}) | ${item.observedApi.length} calls | ${item.missingApi.join('<br>') || '-'} |`
    )),
    '',
    '## Forms',
    '',
    '| Status | Form | Screenshot | Observed API | Error |',
    '|---|---|---|---|---|',
    ...formResults.map((item) => (
      `| ${item.status} | ${item.name} | ${item.screenshot ? `[png](${item.screenshot})` : '-'} | ${item.observedApi.length} calls | ${item.error || '-'} |`
    )),
    '',
    '## API Calls',
    '',
    '| Step | Method | Path | Status | Source |',
    '|---|---|---|---|---|',
    ...apiCalls.map((call) => (
      `| ${call.step} | ${call.method} | \`${call.path}\` | ${call.status} | ${call.source} |`
    )),
    '',
  ];
  await fs.writeFile(path.join(outputDir, 'report.md'), lines.join('\n'));
}

async function main() {
  await fs.mkdir(screenshotsDir, { recursive: true });
  await waitForApp();

  const browser = await chromium.launch({ headless: !config.headed, slowMo: config.slowMo });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();

  page.on('console', (message) => {
    const type = message.type();
    if (type === 'error') {
      apiCalls.push({ at: nowIso(), step: currentStep, method: 'CONSOLE', path: message.text(), status: 'error', source: 'browser' });
    }
  });

  await setupMockRoutes(page);
  await recordRealApiResponses(page);

  await login(page);
  await screenshot(page, 'form-login');
  await runAuthForms(browser);

  const pages = [
    ['home', '/', '今日总览', ['/api/items', '/api/todos', '/api/items/expiring']],
    ['workbench', '/workbench', '工作台', []],
    ['messages', '/messages', '消息', ['/api/messages/conversations']],
    ['settings', '/settings', '我的', ['/api/auth/profile']],
    ['item-list', '/item/list', '物品', ['/api/items', '/api/categories', '/api/locations']],
    ['item-create', '/item/create', '基础信息', ['/api/categories', '/api/locations', '/api/templates']],
    ['item-detail-edit', '/item/item-qa-1', 'QA 露营灯', ['/api/items/item-qa-1', '/api/categories', '/api/locations', '/api/shares/resource/item/item-qa-1']],
    ['todo-list', '/todo/list', '待办', ['/api/todos']],
    ['todo-create', '/todo/create', '基础信息', ['/api/categories']],
    ['todo-detail-edit', '/todo/todo-qa-1', 'QA 补充药箱', ['/api/todos/todo-qa-1', '/api/categories', '/api/shares/resource/todo/todo-qa-1']],
    ['category-manage', '/settings/category-manage', '分类管理', ['/api/categories']],
    ['location-manage', '/settings/location-manage', '位置管理', ['/api/locations']],
    ['account', '/settings/account', '账号', ['/api/auth/profile']],
    ['change-password', '/settings/change-password', '修改密码', []],
    ['theme', '/settings/theme', '主题设置', []],
    ['language', '/settings/language', '语言', []],
    ['notifications', '/settings/notifications', '通知中心', []],
    ['data', '/settings/data', '数据统计', []],
    ['feedback', '/settings/feedback', '反馈类型', []],
    ['stats', '/settings/stats', '数据统计', ['/api/items', '/api/todos', '/api/categories']],
    ['templates', '/settings/templates', '模板管理', ['/api/templates']],
    ['assets', '/settings/assets', '资产总览', ['/api/items/total-value']],
    ['borrowings', '/settings/borrowings', '借用管理', ['/api/borrowings', '/api/items']],
    ['borrowing-create', '/settings/borrowing-create', '新增借用', ['/api/items']],
    ['shares', '/settings/shares', '共享', ['/api/shares/outgoing', '/api/shares/incoming']],
    ['calendar', '/settings/calendar', '日历视图', ['/api/calendar']],
    ['widgets', '/settings/widgets', '桌面小组件', ['/api/widgets/stats', '/api/widgets/todos']],
    ['message-detail', '/message/conv-qa-1', '对话', ['/api/messages/conversations/conv-qa-1', '/api/messages/conversations']],
  ];

  for (const [name, route, text, expectedApi] of pages) {
    await gotoAndCapture(page, name, route, text, expectedApi);
  }

  await runMutationForms(page);
  await runMessageForm(page);

  await writeReport();
  await browser.close();

  const failures = formResults.filter((item) => item.status === 'FAIL');
  const pageWarnings = pageResults.filter((item) => item.status === 'WARN');
  console.log(`UI integration automation complete: ${outputDir}`);
  console.log(`Pages: ${pageResults.length}, forms: ${formResults.length}, API calls: ${apiCalls.length}`);
  if (pageWarnings.length) console.log(`Page API warnings: ${pageWarnings.length}`);
  if (failures.length) {
    console.error(`Form failures: ${failures.length}`);
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error(error);
  try {
    await writeReport();
  } catch {}
  process.exit(1);
});
