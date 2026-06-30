#!/usr/bin/env node

const config = {
  apiBase: process.env.API_BASE || 'http://localhost:3020',
  email: process.env.QA_USER_A_EMAIL,
  password: process.env.QA_USER_A_PASSWORD,
  prefix: process.env.QA_UI_PREFIX || '审查种子',
};

function requireEnv(name, value) {
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
}

function getPayloadData(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    Object.prototype.hasOwnProperty.call(payload, 'data') &&
    (Object.prototype.hasOwnProperty.call(payload, 'code') ||
      Object.prototype.hasOwnProperty.call(payload, 'message'))
  ) {
    return payload.data;
  }
  return payload;
}

function assert(condition, message, detail) {
  if (!condition) {
    const suffix = detail ? `\n${JSON.stringify(detail, null, 2)}` : '';
    throw new Error(`${message}${suffix}`);
  }
}

async function http(path, { method = 'GET', token, body, expected = [200, 201] } = {}) {
  const response = await fetch(`${config.apiBase}${path}`, {
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
    throw new Error(`${method} ${path} failed with ${response.status}: ${message}\n${JSON.stringify(payload, null, 2)}`);
  }
  return { response, payload, data: getPayloadData(payload) };
}

async function step(name, fn) {
  process.stdout.write(`- ${name} ... `);
  const result = await fn();
  console.log('PASS');
  return result;
}

async function signIn(email, password) {
  const { data } = await http('/api/auth/signin', {
    method: 'POST',
    body: { email, password },
  });
  const token = data?.session?.access_token || data?.token;
  const user = data?.user || data?.session?.user;
  assert(token, 'Signin did not return token', data);
  assert(user?.id, 'Signin did not return user id', data);
  return { token, user };
}

function buildMarker(label) {
  return `${config.prefix}-${label}`;
}

async function cleanupSeedData(token) {
  const [itemsRes, todosRes, categoriesRes, locationsRes, templatesRes, borrowingsRes] = await Promise.all([
    http('/api/items', { token }),
    http('/api/todos', { token }),
    http('/api/categories', { token }),
    http('/api/locations', { token }),
    http('/api/templates', { token }),
    http('/api/borrowings', { token }),
  ]);

  const items = Array.isArray(itemsRes.data) ? itemsRes.data : [];
  const todos = Array.isArray(todosRes.data) ? todosRes.data : [];
  const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
  const locations = Array.isArray(locationsRes.data) ? locationsRes.data : [];
  const templates = Array.isArray(templatesRes.data) ? templatesRes.data : [];
  const borrowings = Array.isArray(borrowingsRes.data) ? borrowingsRes.data : [];

  const seededBorrowings = borrowings.filter((item) => item.borrower_name?.startsWith(config.prefix) || item.notes?.includes(config.prefix));
  for (const borrowing of seededBorrowings) {
    await http(`/api/borrowings/${borrowing.id}`, { method: 'DELETE', token, expected: [200, 204] });
  }

  const seededTemplates = templates.filter((item) => item.name?.startsWith(config.prefix));
  for (const template of seededTemplates) {
    await http(`/api/templates/${template.id}`, { method: 'DELETE', token, expected: [200, 204] });
  }

  const seededTodos = todos.filter((item) => item.title?.startsWith(config.prefix));
  for (const todo of seededTodos) {
    await http(`/api/todos/${todo.id}`, { method: 'DELETE', token, expected: [200, 204] });
  }

  const seededItems = items.filter((item) => item.name?.startsWith(config.prefix));
  for (const item of seededItems) {
    await http(`/api/items/${item.id}`, { method: 'DELETE', token, expected: [200, 204] });
  }

  const seededCategories = categories.filter((item) => item.user_id && item.name?.startsWith(config.prefix));
  for (const category of seededCategories) {
    await http(`/api/categories/${category.id}`, { method: 'DELETE', token, expected: [200, 204] });
  }

  const seededLocations = locations.filter((item) => item.user_id && item.name?.startsWith(config.prefix));
  for (const location of seededLocations) {
    await http(`/api/locations/${location.id}`, { method: 'DELETE', token, expected: [200, 204] });
  }
}

async function createCategory(token, payload) {
  const { data } = await http('/api/categories', {
    method: 'POST',
    token,
    body: payload,
  });
  assert(data?.id, 'Category creation did not return id', data);
  return data;
}

async function createLocation(token, payload) {
  const { data } = await http('/api/locations', {
    method: 'POST',
    token,
    body: payload,
  });
  assert(data?.id, 'Location creation did not return id', data);
  return data;
}

async function createItem(token, payload) {
  const { data } = await http('/api/items', {
    method: 'POST',
    token,
    body: payload,
  });
  assert(data?.id, 'Item creation did not return id', data);
  return data;
}

async function createTodo(token, payload) {
  const { data } = await http('/api/todos', {
    method: 'POST',
    token,
    body: payload,
  });
  assert(data?.id, 'Todo creation did not return id', data);
  return data;
}

async function createTemplate(token, payload) {
  const { data } = await http('/api/templates', {
    method: 'POST',
    token,
    body: payload,
  });
  assert(data?.id, 'Template creation did not return id', data);
  return data;
}

async function createBorrowing(token, payload) {
  const { data } = await http('/api/borrowings', {
    method: 'POST',
    token,
    body: payload,
  });
  assert(data?.id, 'Borrowing creation did not return id', data);
  return data;
}

async function main() {
  requireEnv('QA_USER_A_EMAIL', config.email);
  requireEnv('QA_USER_A_PASSWORD', config.password);

  const { token } = await step('Sign in QA user', () => signIn(config.email, config.password));

  await step('Clean previous UI audit seed data', () => cleanupSeedData(token));

  const today = new Date();
  const dueSoon = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString();
  const overdueDate = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const expiryDate = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
  const borrowReturnDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();

  const itemCategory = await step('Create seed item category', () =>
    createCategory(token, {
      name: buildMarker('分类-露营'),
      type: 'item',
      icon: 'tent',
      color: '#F36F3C',
    })
  );

  const todoCategory = await step('Create seed todo category', () =>
    createCategory(token, {
      name: buildMarker('分类-维护'),
      type: 'todo',
      icon: 'wrench-outline',
      color: '#7C5CFC',
    })
  );

  const roomLocation = await step('Create seed room location', () =>
    createLocation(token, {
      name: buildMarker('位置-客厅'),
      icon: 'sofa',
      level: 0,
    })
  );

  const cabinetLocation = await step('Create seed child location', () =>
    createLocation(token, {
      name: buildMarker('位置-储物柜'),
      icon: 'archive-outline',
      level: 1,
      parent_id: roomLocation.id,
    })
  );

  const assetItem = await step('Create seed asset item', () =>
    createItem(token, {
      name: buildMarker('物品-露营灯'),
      description: 'UI audit seeded asset item',
      category_id: itemCategory.id,
      location_id: cabinetLocation.id,
      purchase_price: 399,
      current_value: 320,
      currency: 'CNY',
      reminder_enabled: true,
      expiry_date: expiryDate,
      images: [],
    })
  );

  const borrowedItem = await step('Create seed borrowing item', () =>
    createItem(token, {
      name: buildMarker('物品-折叠椅'),
      description: 'UI audit seeded borrowing item',
      category_id: itemCategory.id,
      location_id: roomLocation.id,
      purchase_price: 229,
      current_value: 180,
      currency: 'CNY',
      reminder_enabled: false,
      images: [],
    })
  );

  await step('Create seed pending todo', () =>
    createTodo(token, {
      title: buildMarker('待办-补充药箱'),
      description: 'UI audit pending todo',
      category_id: todoCategory.id,
      priority: 3,
      completed: false,
      due_date: dueSoon,
    })
  );

  await step('Create seed completed todo', () =>
    createTodo(token, {
      title: buildMarker('待办-清洁露营箱'),
      description: 'UI audit completed todo',
      category_id: todoCategory.id,
      priority: 2,
      completed: true,
      due_date: overdueDate,
    })
  );

  await step('Create seed item template', () =>
    createTemplate(token, {
      name: buildMarker('模板-物品'),
      description: 'UI audit item template',
      template_type: 'item',
      icon: 'package-variant-closed',
      color: '#F36F3C',
      data: {
        name: buildMarker('模板物品示例'),
        description: '来自 UI audit seed',
        category_id: itemCategory.id,
        location_id: roomLocation.id,
        purchase_price: 399,
        current_value: 320,
        currency: 'CNY',
      },
    })
  );

  await step('Create seed todo template', () =>
    createTemplate(token, {
      name: buildMarker('模板-待办'),
      description: 'UI audit todo template',
      template_type: 'todo',
      icon: 'check-circle-outline',
      color: '#7C5CFC',
      data: {
        title: buildMarker('模板待办示例'),
        description: '来自 UI audit seed',
        category_id: todoCategory.id,
        priority: 2,
        completed: false,
      },
    })
  );

  await step('Create seed borrowing record', () =>
    createBorrowing(token, {
      item_id: borrowedItem.id,
      borrower_name: buildMarker('借用人-Lin'),
      borrower_contact: '13800000000',
      expected_return_date: borrowReturnDate,
      notes: `${config.prefix} seeded borrowing`,
    })
  );

  console.log('\nUI audit seed data ready.');
  console.log(JSON.stringify({
    categoryIds: [itemCategory.id, todoCategory.id],
    locationIds: [roomLocation.id, cabinetLocation.id],
    itemIds: [assetItem.id, borrowedItem.id],
    prefix: config.prefix,
  }, null, 2));
}

main().catch((error) => {
  console.error('\nUI audit seed failed.');
  console.error(error);
  process.exit(1);
});
