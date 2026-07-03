#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const marker = `T79-${runId}`;

const config = {
  apiBase: process.env.API_BASE || 'http://localhost:3020',
  emailA: process.env.QA_USER_A_EMAIL,
  passwordA: process.env.QA_USER_A_PASSWORD,
  emailB: process.env.QA_USER_B_EMAIL,
  passwordB: process.env.QA_USER_B_PASSWORD,
  keepData: process.env.QA_KEEP_DATA === '1',
  outputRoot: process.env.QA_OUTPUT_DIR || path.resolve(process.cwd(), 'docs/qa'),
};

const state = {
  createdItems: [],
  createdTodos: [],
  createdCategories: [],
  createdLocations: [],
  createdBorrowings: [],
  shareId: null,
  friendshipId: null,
  report: {
    run_id: marker,
    api_base: config.apiBase,
    started_at: new Date().toISOString(),
    finished_at: null,
    status: 'running',
    steps: [],
    cleanup_warnings: [],
  },
};

function usage() {
  console.log(`
LifeTracker T79 real smoke test

Required env:
  QA_USER_A_EMAIL       primary QA account email
  QA_USER_A_PASSWORD    primary QA account password
  QA_USER_B_EMAIL       secondary QA account email for sharing
  QA_USER_B_PASSWORD    secondary QA account password

Optional env:
  API_BASE              default http://localhost:3020
  QA_OUTPUT_DIR         default docs/qa
  QA_KEEP_DATA=1        keep records created by this run

Run:
  QA_USER_A_EMAIL=... QA_USER_A_PASSWORD=... \\
  QA_USER_B_EMAIL=... QA_USER_B_PASSWORD=... \\
  node scripts/qa/t79-real-smoke.mjs
`);
}

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing ${name}.`);
}

function assert(condition, message, detail) {
  if (!condition) {
    const suffix = detail ? `\n${JSON.stringify(detail, null, 2)}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

function getPayloadData(payload) {
  return payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
}

async function http(pathname, { method = 'GET', token, body, expected = [200, 201] } = {}) {
  const response = await fetch(`${config.apiBase}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { raw: text };
    }
  }

  if (!expected.includes(response.status)) {
    const message = payload?.message || payload?.error || response.statusText;
    throw new Error(`${method} ${pathname} failed with ${response.status}: ${message}\n${JSON.stringify(payload, null, 2)}`);
  }

  return { response, payload, data: getPayloadData(payload) };
}

async function step(name, fn) {
  process.stdout.write(`- ${name} ... `);
  const startedAt = new Date().toISOString();
  try {
    const result = await fn();
    state.report.steps.push({ name, status: 'pass', started_at: startedAt, finished_at: new Date().toISOString() });
    console.log('PASS');
    return result;
  } catch (error) {
    state.report.steps.push({
      name,
      status: 'fail',
      started_at: startedAt,
      finished_at: new Date().toISOString(),
      error: error?.message || String(error),
    });
    console.log('FAIL');
    throw error;
  }
}

async function signIn(email, password) {
  const { data } = await http('/api/auth/signin', {
    method: 'POST',
    body: { email, password },
  });
  const token = data?.session?.access_token || data?.token;
  const user = data?.user || data?.session?.user;
  assert(token, `Signin did not return token for ${email}`, data);
  assert(user?.id, `Signin did not return user id for ${email}`, data);
  return { token, user };
}

async function list(pathname, token) {
  const { data } = await http(pathname, { token });
  return Array.isArray(data) ? data : [];
}

async function createCategory(token, name, type) {
  const { data } = await http('/api/categories', {
    method: 'POST',
    token,
    body: { name, type, icon: type === 'item' ? 'package-variant' : 'check-circle-outline', color: '#F36F3C' },
  });
  assert(data?.id, 'Category creation did not return id', data);
  state.createdCategories.push(data.id);
  return data;
}

async function createLocation(token, name) {
  const { data } = await http('/api/locations', {
    method: 'POST',
    token,
    body: { name, icon: 'map-marker-outline', level: 0 },
  });
  assert(data?.id, 'Location creation did not return id', data);
  state.createdLocations.push(data.id);
  return data;
}

async function createItem(token, overrides = {}) {
  const { data } = await http('/api/items', {
    method: 'POST',
    token,
    body: {
      name: `QA 主流程物品 ${marker}`,
      description: 'T79 real smoke item',
      images: [],
      reminder_enabled: false,
      current_value: 12,
      purchase_price: 15,
      currency: 'CNY',
      ...overrides,
    },
  });
  assert(data?.id, 'Item creation did not return id', data);
  state.createdItems.push(data.id);
  return data;
}

async function createTodo(token, overrides = {}) {
  const due = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await http('/api/todos', {
    method: 'POST',
    token,
    body: {
      title: `QA 主流程待办 ${marker}`,
      description: 'T79 real smoke todo',
      priority: 2,
      completed: false,
      due_date: due,
      images: [],
      ...overrides,
    },
  });
  assert(data?.id, 'Todo creation did not return id', data);
  state.createdTodos.push(data.id);
  return data;
}

async function updateTodo(token, todoId, body) {
  const { data } = await http(`/api/todos/${todoId}`, { method: 'PUT', token, body });
  assert(data?.id === todoId, 'Todo update did not return updated todo', data);
  return data;
}

async function exportSnapshot(token) {
  const [items, todos, categories, locations, borrowings] = await Promise.all([
    list('/api/items', token),
    list('/api/todos', token),
    list('/api/categories', token),
    list('/api/locations', token),
    list('/api/borrowings', token),
  ]);
  return {
    version: 't79-smoke',
    exported_at: new Date().toISOString(),
    items,
    todos,
    categories,
    locations,
    borrowings,
  };
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function itemKey(item, categoryId, locationId) {
  return `${normalizeText(item.name)}:${categoryId || ''}:${locationId || ''}:${normalizeText(item.barcode)}`;
}

function todoKey(todo, categoryId) {
  return `${normalizeText(todo.title)}:${categoryId || ''}:${todo.due_date || ''}`;
}

async function importBackup(token, backup) {
  const result = {
    imported_items: 0,
    imported_todos: 0,
    imported_categories: 0,
    imported_locations: 0,
    skipped_items: 0,
    skipped_todos: 0,
    skipped_categories: 0,
    skipped_locations: 0,
  };

  const currentCategories = await list('/api/categories', token);
  const currentLocations = await list('/api/locations', token);
  const categoryMap = new Map();
  const locationMap = new Map();

  for (const category of backup.categories || []) {
    const existing = currentCategories.find((entry) => entry.type === category.type && normalizeText(entry.name) === normalizeText(category.name));
    if (existing) {
      categoryMap.set(category.id, existing.id);
      result.skipped_categories += 1;
    } else {
      const created = await createCategory(token, category.name, category.type);
      categoryMap.set(category.id, created.id);
      currentCategories.push(created);
      result.imported_categories += 1;
    }
  }

  for (const location of backup.locations || []) {
    const existing = currentLocations.find((entry) => normalizeText(entry.name) === normalizeText(location.name) && !entry.parent_id);
    if (existing) {
      locationMap.set(location.id, existing.id);
      result.skipped_locations += 1;
    } else {
      const created = await createLocation(token, location.name);
      locationMap.set(location.id, created.id);
      currentLocations.push(created);
      result.imported_locations += 1;
    }
  }

  const currentItems = await list('/api/items', token);
  const currentTodos = await list('/api/todos', token);
  const existingItemKeys = new Set(currentItems.map((item) => itemKey(item, item.category_id, item.location_id)));
  const existingTodoKeys = new Set(currentTodos.map((todo) => todoKey(todo, todo.category_id)));

  for (const item of backup.items || []) {
    const categoryId = item.category_id ? categoryMap.get(item.category_id) || item.category_id : undefined;
    const locationId = item.location_id ? locationMap.get(item.location_id) || item.location_id : undefined;
    const key = itemKey(item, categoryId, locationId);
    if (existingItemKeys.has(key)) {
      result.skipped_items += 1;
      continue;
    }
    await createItem(token, {
      name: item.name,
      description: item.description,
      category_id: categoryId,
      location_id: locationId,
      barcode: item.barcode,
      images: item.images || [],
      current_value: item.current_value,
      purchase_price: item.purchase_price,
      currency: item.currency,
      reminder_enabled: item.reminder_enabled || false,
    });
    existingItemKeys.add(key);
    result.imported_items += 1;
  }

  for (const todo of backup.todos || []) {
    const categoryId = todo.category_id ? categoryMap.get(todo.category_id) || todo.category_id : undefined;
    const key = todoKey(todo, categoryId);
    if (existingTodoKeys.has(key)) {
      result.skipped_todos += 1;
      continue;
    }
    await createTodo(token, {
      title: todo.title,
      description: todo.description,
      priority: todo.priority || 1,
      completed: Boolean(todo.completed),
      due_date: todo.due_date,
      reminder_date: todo.reminder_date,
      category_id: categoryId,
      images: todo.images || [],
    });
    existingTodoKeys.add(key);
    result.imported_todos += 1;
  }

  return result;
}

async function findUserByEmail(token, email) {
  const { data } = await http(`/api/messages/users/search?q=${encodeURIComponent(email)}`, { token });
  const users = Array.isArray(data) ? data : [];
  const user = users.find((candidate) => candidate.email === email) || users[0];
  assert(user?.id, `Could not find target user ${email}`, data);
  return user;
}

async function listFriends(token) {
  return list('/api/messages/friends', token);
}

async function listFriendRequests(token) {
  return list('/api/messages/friends/requests', token);
}

async function cleanupExistingFriendship(tokenA, tokenB, userAId, userBId) {
  const pendingA = await listFriendRequests(tokenA);
  const incomingToA = pendingA.find((friendship) => friendship.direction === 'incoming' && friendship.friend?.id === userBId);
  if (incomingToA?.id) {
    const { data } = await http(`/api/messages/friends/requests/${incomingToA.id}`, {
      method: 'PATCH',
      token: tokenA,
      body: { action: 'accept' },
      expected: [200, 404],
    });
    if (data?.id) {
      await http(`/api/messages/friends/${data.id}/delete`, { method: 'PATCH', token: tokenA, expected: [200, 404] });
    }
  }

  const pendingB = await listFriendRequests(tokenB);
  const incomingToB = pendingB.find((friendship) => friendship.direction === 'incoming' && friendship.friend?.id === userAId);
  if (incomingToB?.id) {
    const { data } = await http(`/api/messages/friends/requests/${incomingToB.id}`, {
      method: 'PATCH',
      token: tokenB,
      body: { action: 'accept' },
      expected: [200, 404],
    });
    if (data?.id) {
      await http(`/api/messages/friends/${data.id}/delete`, { method: 'PATCH', token: tokenB, expected: [200, 404] });
    }
  }

  for (const token of [tokenA, tokenB]) {
    const friends = await listFriends(token);
    const existing = friends.find((friendship) => {
      const otherId = friendship.friend?.id;
      return otherId === userAId || otherId === userBId;
    });
    if (existing?.id) {
      await http(`/api/messages/friends/${existing.id}/delete`, { method: 'PATCH', token, expected: [200, 404] });
      return;
    }
  }
}

async function createFriendship(tokenA, tokenB, userBId) {
  const { data: request } = await http('/api/messages/friends/requests', {
    method: 'POST',
    token: tokenA,
    body: { target_user_id: userBId, message: 'T79 主流程冒烟好友申请' },
  });
  assert(request?.id, 'Friend request did not return id', request);

  const { data: accepted } = await http(`/api/messages/friends/requests/${request.id}`, {
    method: 'PATCH',
    token: tokenB,
    body: { action: 'accept' },
  });
  assert(accepted?.status === 'accepted', 'Friend request was not accepted', accepted);
  state.friendshipId = accepted.id;
  return accepted;
}

async function createShare(token, resourceType, resourceId, sharedWithId) {
  const { data } = await http('/api/shares', {
    method: 'POST',
    token,
    body: {
      resource_type: resourceType,
      resource_id: resourceId,
      shared_with_id: sharedWithId,
      permission: 'view',
    },
  });
  assert(data?.id, 'Share creation did not return id', data);
  state.shareId = data.id;
  return data;
}

async function createBorrowing(token, itemId) {
  const expectedReturnDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await http('/api/borrowings', {
    method: 'POST',
    token,
    body: {
      item_id: itemId,
      borrower_name: `QA 借用人 ${marker}`,
      borrower_contact: 'qa@example.com',
      borrow_date: new Date().toISOString(),
      expected_return_date: expectedReturnDate,
      status: 'borrowed',
      notes: 'T79 real smoke borrowing',
    },
  });
  assert(data?.id, 'Borrowing creation did not return id', data);
  state.createdBorrowings.push(data.id);
  return data;
}

async function cleanup(tokenA) {
  if (config.keepData) return;

  const operations = [];
  if (state.shareId) operations.push(http(`/api/shares/${state.shareId}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  if (state.friendshipId) operations.push(http(`/api/messages/friends/${state.friendshipId}/delete`, { method: 'PATCH', token: tokenA, expected: [200, 404] }));
  for (const id of state.createdBorrowings) operations.push(http(`/api/borrowings/${id}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  for (const id of state.createdTodos) operations.push(http(`/api/todos/${id}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  for (const id of state.createdItems) operations.push(http(`/api/items/${id}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  for (const id of state.createdCategories) operations.push(http(`/api/categories/${id}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));
  for (const id of state.createdLocations) operations.push(http(`/api/locations/${id}`, { method: 'DELETE', token: tokenA, expected: [200, 404] }));

  const results = await Promise.allSettled(operations);
  for (const result of results) {
    if (result.status === 'rejected') {
      state.report.cleanup_warnings.push(result.reason?.message || String(result.reason));
    }
  }
}

async function writeReport() {
  state.report.finished_at = new Date().toISOString();
  const dir = path.join(config.outputRoot, `t79-real-smoke-${runId}`);
  await fs.mkdir(dir, { recursive: true });
  const jsonPath = path.join(dir, 'report.json');
  const mdPath = path.join(dir, 'README.md');
  await fs.writeFile(jsonPath, JSON.stringify(state.report, null, 2));
  await fs.writeFile(mdPath, `# T79 Real Smoke Report

- Run ID: ${state.report.run_id}
- API: ${state.report.api_base}
- Status: ${state.report.status}
- Started: ${state.report.started_at}
- Finished: ${state.report.finished_at}
- Cleanup warnings: ${state.report.cleanup_warnings.length}

| Step | Status |
|---|---|
${state.report.steps.map((entry) => `| ${entry.name} | ${entry.status} |`).join('\n')}
`);
  console.log(`\nReport written to ${mdPath}`);
}

async function main() {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    return;
  }

  let userA;
  try {
    requireEnv('QA_USER_A_EMAIL', config.emailA);
    requireEnv('QA_USER_A_PASSWORD', config.passwordA);
    requireEnv('QA_USER_B_EMAIL', config.emailB);
    requireEnv('QA_USER_B_PASSWORD', config.passwordB);

    console.log('LifeTracker T79 real smoke test');
    console.log(`API: ${config.apiBase}`);

    userA = await step('用户 A 登录', () => signIn(config.emailA, config.passwordA));
    const userB = await step('用户 B 登录', () => signIn(config.emailB, config.passwordB));

    await step('A 创建物品并读取详情', async () => {
      const item = await createItem(userA.token);
      const { data } = await http(`/api/items/${item.id}`, { token: userA.token });
      assert(data?.id === item.id, 'Created item was not readable', data);
      return item;
    });

    await step('A 创建待办并完成', async () => {
      const todo = await createTodo(userA.token);
      const updated = await updateTodo(userA.token, todo.id, { completed: true });
      assert(updated.completed === true, 'Todo was not marked completed', updated);
      return updated;
    });

    const snapshot = await step('A 导出当前数据快照', async () => {
      const data = await exportSnapshot(userA.token);
      assert(data.items.length >= 1 && data.todos.length >= 1, 'Export snapshot should contain items and todos', data);
      return data;
    });

    await step('A 导入备份并验证重复跳过', async () => {
      const backup = {
        version: 't79-smoke-import',
        exported_at: snapshot.exported_at,
        categories: [{ id: `cat-${marker}`, name: `QA 导入分类 ${marker}`, type: 'item' }],
        locations: [{ id: `loc-${marker}`, name: `QA 导入位置 ${marker}`, level: 0 }],
        items: [{
          id: `item-${marker}`,
          name: `QA 导入物品 ${marker}`,
          description: 'import smoke item',
          category_id: `cat-${marker}`,
          location_id: `loc-${marker}`,
          images: [],
          barcode: `T79-${runId}`,
          current_value: 8,
          purchase_price: 10,
          currency: 'CNY',
        }],
        todos: [{
          id: `todo-${marker}`,
          title: `QA 导入待办 ${marker}`,
          description: 'import smoke todo',
          category_id: undefined,
          priority: 1,
          completed: false,
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          images: [],
        }],
      };
      const first = await importBackup(userA.token, backup);
      assert(first.imported_items === 1 && first.imported_todos === 1, 'First import should create item and todo', first);
      const second = await importBackup(userA.token, backup);
      assert(second.skipped_items === 1 && second.skipped_todos === 1, 'Second import should skip duplicate item and todo', second);
      return { first, second };
    });

    await step('A/B 建立好友关系并共享物品', async () => {
      await cleanupExistingFriendship(userA.token, userB.token, userA.user.id, userB.user.id);
      const target = await findUserByEmail(userA.token, config.emailB);
      assert(target.id === userB.user.id, 'Search result did not match user B', target);
      await createFriendship(userA.token, userB.token, userB.user.id);
      const itemId = state.createdItems[0];
      const share = await createShare(userA.token, 'item', itemId, userB.user.id);
      const { data: sharedItem } = await http(`/api/items/${itemId}`, { token: userB.token });
      assert(sharedItem?.share_permission === 'view', 'Shared item should be visible to user B with view permission', sharedItem);
      assert(share.conversation_id, 'Share should create or reuse a conversation', share);
      return share;
    });

    await step('A 创建借用并归还', async () => {
      const borrowing = await createBorrowing(userA.token, state.createdItems[0]);
      const active = await list('/api/borrowings/active', userA.token);
      assert(active.some((entry) => entry.id === borrowing.id), 'Active borrowings should include new borrowing', active);
      const { data: returned } = await http(`/api/borrowings/${borrowing.id}`, {
        method: 'PUT',
        token: userA.token,
        body: { status: 'returned' },
      });
      assert(returned?.status === 'returned', 'Borrowing was not returned', returned);
      return returned;
    });

    await step('清理本轮测试数据', () => cleanup(userA.token));
    state.report.status = 'passed';
    console.log('\nAll T79 real smoke checks passed.');
  } catch (error) {
    state.report.status = 'failed';
    console.error('\nFAILED');
    console.error(error?.message || error);
    if (userA?.token) {
      await cleanup(userA.token).catch((cleanupError) => {
        state.report.cleanup_warnings.push(cleanupError?.message || String(cleanupError));
      });
    }
    process.exitCode = 1;
  } finally {
    await writeReport().catch((error) => {
      console.warn(`Could not write QA report: ${error?.message || error}`);
    });
  }
}

main();
