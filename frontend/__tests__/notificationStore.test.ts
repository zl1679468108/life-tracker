jest.mock('../lib/notifications', () => ({
  showWebNotification: jest.fn(),
  scheduleTodoReminder: jest.fn(),
  cancelReminder: jest.fn(),
}));

import { useNotificationStore } from '../stores/notificationStore';

jest.mock('../stores/todoStore', () => ({
  useTodoStore: {
    getState: jest.fn(() => ({ todos: [] })),
    subscribe: jest.fn(),
    setState: jest.fn(),
  },
}));

jest.mock('../stores/itemStore', () => ({
  useItemStore: {
    getState: jest.fn(() => ({ items: [] })),
    subscribe: jest.fn(),
    setState: jest.fn(),
  },
}));

describe('notificationStore', () => {
  beforeEach(() => {
    useNotificationStore.setState({
      notifications: [],
      readIds: [],
      loaded: false,
      pushTrigger: 0,
    });
  });

  it('marks notification as read', async () => {
    useNotificationStore.setState({
      notifications: [
        { id: 'todo-1', icon: 'check', iconBg: '#000', title: 'A', desc: 'B', time: 'now' },
      ],
    });

    await useNotificationStore.getState().markAsRead('todo-1');

    expect(useNotificationStore.getState().isRead('todo-1')).toBe(true);
  });
});
