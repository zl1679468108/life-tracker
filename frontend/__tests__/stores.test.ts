/**
 * Stores 集成测试
 * 测试 items/todos/categories/locations store 的 CRUD 操作
 */

// Mock all external dependencies
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../lib/notifications', () => ({
  showWebNotification: jest.fn(),
  scheduleTodoReminder: jest.fn(),
  cancelReminder: jest.fn(),
}));

jest.mock('../lib/api', () => {
  const mockItems = [
    { id: 'item-1', name: 'Laptop', category_id: 'cat-1', location_id: 'loc-1', user_id: 'u1', created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'item-2', name: 'Book', category_id: 'cat-2', user_id: 'u1', created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
  ];

  const mockTodos = [
    { id: 'todo-1', title: 'Buy milk', completed: false, priority: 1, user_id: 'u1', sort_order: 0, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
    { id: 'todo-2', title: 'Write docs', completed: true, priority: 2, user_id: 'u1', sort_order: 1, created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' },
  ];

  const mockCategories = [
    { id: 'cat-1', name: 'Electronics', type: 'item', user_id: null },
    { id: 'cat-2', name: 'Books', type: 'item', user_id: null },
    { id: 'cat-3', name: 'Shopping', type: 'todo', user_id: null },
  ];

  const mockLocations = [
    { id: 'loc-1', name: 'Living Room', level: 1 },
    { id: 'loc-2', name: 'Office', level: 1 },
  ];

  const mockUploadData = { url: 'https://example.com/img.jpg', path: 'img.jpg', size: 123 };

  return {
    api: {
      items: {
        list: jest.fn().mockResolvedValue({ code: 200, data: mockItems }),
        get: jest.fn().mockImplementation((id: string) => {
          const item = mockItems.find(i => i.id === id);
          return Promise.resolve({ code: item ? 200 : 404, data: item || null });
        }),
        create: jest.fn().mockImplementation((data: any) => {
          const newItem = { id: `item-${Date.now()}`, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          return Promise.resolve({ code: 200, data: newItem });
        }),
        update: jest.fn().mockImplementation((id: string, updates: any) => {
          return Promise.resolve({ code: 200, data: { id, ...updates } });
        }),
        delete: jest.fn().mockResolvedValue({ code: 200, data: { success: true } }),
      },
      todos: {
        list: jest.fn().mockResolvedValue({ code: 200, data: mockTodos }),
        get: jest.fn().mockImplementation((id: string) => {
          const todo = mockTodos.find(t => t.id === id);
          return Promise.resolve({ code: todo ? 200 : 404, data: todo || null });
        }),
        create: jest.fn().mockImplementation((data: any) => {
          const newTodo = { id: `todo-${Date.now()}`, ...data, completed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          return Promise.resolve({ code: 200, data: newTodo });
        }),
        update: jest.fn().mockImplementation((id: string, updates: any) => {
          return Promise.resolve({ code: 200, data: { id, ...updates } });
        }),
        delete: jest.fn().mockResolvedValue({ code: 200, data: { success: true } }),
        reorder: jest.fn().mockResolvedValue({ code: 200, data: ['todo-1', 'todo-2'] }),
      },
      categories: {
        list: jest.fn().mockResolvedValue({ code: 200, data: mockCategories }),
        get: jest.fn().mockImplementation((id: string) => {
          const cat = mockCategories.find(c => c.id === id);
          return Promise.resolve({ code: cat ? 200 : 404, data: cat || null });
        }),
        create: jest.fn().mockImplementation((data: any) => {
          const newCat = { id: `cat-${Date.now()}`, ...data };
          return Promise.resolve({ code: 200, data: newCat });
        }),
        update: jest.fn().mockImplementation((id: string, updates: any) => {
          return Promise.resolve({ code: 200, data: { id, ...updates } });
        }),
        delete: jest.fn().mockResolvedValue({ code: 200, data: { success: true } }),
      },
      locations: {
        list: jest.fn().mockResolvedValue({ code: 200, data: mockLocations }),
        get: jest.fn().mockImplementation((id: string) => {
          const loc = mockLocations.find(l => l.id === id);
          return Promise.resolve({ code: loc ? 200 : 404, data: loc || null });
        }),
        create: jest.fn().mockImplementation((data: any) => {
          const newLoc = { id: `loc-${Date.now()}`, ...data, level: 1 };
          return Promise.resolve({ code: 200, data: newLoc });
        }),
        update: jest.fn().mockImplementation((id: string, updates: any) => {
          return Promise.resolve({ code: 200, data: { id, ...updates } });
        }),
        delete: jest.fn().mockResolvedValue({ code: 200, data: { success: true } }),
      },
      upload: {
        single: jest.fn().mockResolvedValue({ code: 200, data: mockUploadData }),
        batch: jest.fn().mockResolvedValue({ code: 200, data: mockUploadData }),
      },
      auth: {
        signIn: jest.fn().mockResolvedValue({ code: 200, data: { token: 'test-token', user: { id: 'u1', email: 'test@test.com' } } }),
        signUp: jest.fn().mockResolvedValue({ code: 200, data: { token: 'test-token', user: { id: 'u1', email: 'test@test.com' } } }),
        getProfile: jest.fn().mockResolvedValue({ code: 200, data: { id: 'u1', display_name: 'Test' } }),
        updateProfile: jest.fn().mockImplementation((data: any) => Promise.resolve({ code: 200, data: { id: 'u1', ...data } })),
        signInWithOAuth: jest.fn().mockResolvedValue({ code: 200, data: { url: 'https://auth.provider.com/login' } }),
      },
      feedback: {
        create: jest.fn().mockResolvedValue({ code: 200, data: { id: 'fb-1' } }),
      },
    },
  };
});

jest.mock('../lib/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../lib/network', () => ({
  networkMonitor: {
    isOnline: jest.fn().mockReturnValue(true),
    addListener: jest.fn().mockReturnValue(jest.fn()),
    getStatus: jest.fn().mockReturnValue('online'),
  },
}));

jest.mock('../lib/upload', () => ({
  uploadImages: jest.fn().mockResolvedValue(['https://example.com/img.jpg']),
}));

jest.mock('../lib/socket', () => ({
  socketService: require('../__mocks__/socketMock').socketService,
}));

jest.mock('../lib/token', () => ({
  getAuthToken: jest.fn().mockResolvedValue('test-token'),
  setAuthToken: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../stores/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(() => ({ user: { id: 'u1', email: 'test@test.com' } })),
  },
}));

// Mock axios-like retry dependencies
import { useItemStore } from '../stores/itemStore';
import { useTodoStore } from '../stores/todoStore';
import { useCategoryStore } from '../stores/categoryStore';
import { useLocationStore } from '../stores/locationStore';

describe('itemStore', () => {
  beforeEach(() => {
    useItemStore.setState({ items: [], loading: false, error: null });
  });

  it('fetches items', async () => {
    await useItemStore.getState().fetchItems();
    const state = useItemStore.getState();
    expect(state.items).toHaveLength(2);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('adds an item', async () => {
    await useItemStore.getState().addItem({
      name: 'New Item',
      user_id: 'u1',
      images: [],
    } as any);
    const state = useItemStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].name).toBe('New Item');
  });

  it('updates an item', async () => {
    // First fetch items
    await useItemStore.getState().fetchItems();
    const existingId = useItemStore.getState().items[0].id;

    await useItemStore.getState().updateItem(existingId, { name: 'Updated' });
    const state = useItemStore.getState();
    expect(state.items[0].name).toBe('Updated');
  });

  it('deletes an item', async () => {
    await useItemStore.getState().fetchItems();
    await useItemStore.getState().deleteItem('item-1');
    const state = useItemStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].id).toBe('item-2');
  });

  it('clears error', () => {
    useItemStore.setState({ error: 'Some error' });
    useItemStore.getState().clearError();
    expect(useItemStore.getState().error).toBeNull();
  });
});

describe('todoStore', () => {
  beforeEach(() => {
    useTodoStore.setState({ todos: [], loading: false, error: null });
  });

  it('fetches todos', async () => {
    await useTodoStore.getState().fetchTodos();
    const state = useTodoStore.getState();
    expect(state.todos).toHaveLength(2);
  });

  it('toggles completion optimistically', async () => {
    await useTodoStore.getState().fetchTodos();
    const todo = useTodoStore.getState().todos[0];

    await useTodoStore.getState().toggleComplete(todo.id);
    expect(useTodoStore.getState().todos[0].completed).toBe(true);
  });

  it('reorders todos', async () => {
    await useTodoStore.getState().fetchTodos();
    const todos = useTodoStore.getState().todos;

    // Reverse order
    await useTodoStore.getState().reorderTodos([todos[1], todos[0]]);
    expect(useTodoStore.getState().todos[0].id).toBe('todo-2');
  });
});

describe('categoryStore', () => {
  beforeEach(() => {
    useCategoryStore.setState({ categories: [], loading: false, error: null });
  });

  it('fetches categories', async () => {
    await useCategoryStore.getState().fetchCategories();
    const state = useCategoryStore.getState();
    expect(state.categories).toHaveLength(3);
  });

  it('creates a category', async () => {
    await useCategoryStore.getState().addCategory({
      name: 'New Category',
      type: 'item',
    });
    const state = useCategoryStore.getState();
    expect(state.categories).toHaveLength(1);
    expect(state.categories[0].name).toBe('New Category');
  });
});

describe('locationStore', () => {
  beforeEach(() => {
    useLocationStore.setState({ locations: [], loading: false, error: null });
  });

  it('fetches locations', async () => {
    await useLocationStore.getState().fetchLocations();
    const state = useLocationStore.getState();
    expect(state.locations).toHaveLength(2);
  });

  it('creates a location', async () => {
    await useLocationStore.getState().addLocation({
      name: 'Garage',
    } as any);
    const state = useLocationStore.getState();
    expect(state.locations).toHaveLength(1);
    expect(state.locations[0].name).toBe('Garage');
  });
});
