export const socketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  removeAllListeners: jest.fn(),

  onItemCreated: jest.fn(),
  offItemCreated: jest.fn(),
  onItemUpdated: jest.fn(),
  offItemUpdated: jest.fn(),
  onItemDeleted: jest.fn(),
  offItemDeleted: jest.fn(),

  onTodoCreated: jest.fn(),
  offTodoCreated: jest.fn(),
  onTodoUpdated: jest.fn(),
  offTodoUpdated: jest.fn(),
  onTodoDeleted: jest.fn(),
  offTodoDeleted: jest.fn(),

  onCategoryCreated: jest.fn(),
  offCategoryCreated: jest.fn(),
  onCategoryUpdated: jest.fn(),
  offCategoryUpdated: jest.fn(),
  onCategoryDeleted: jest.fn(),
  offCategoryDeleted: jest.fn(),

  onLocationCreated: jest.fn(),
  offLocationCreated: jest.fn(),
  onLocationUpdated: jest.fn(),
  offLocationUpdated: jest.fn(),
  onLocationDeleted: jest.fn(),
  offLocationDeleted: jest.fn(),

  onReminderFired: jest.fn(),
  offReminderFired: jest.fn(),

  onMessageCreated: jest.fn(),
  offMessageCreated: jest.fn(),
  onConversationUpdated: jest.fn(),
  offConversationUpdated: jest.fn(),

  onFriendRequestUpdated: jest.fn(),
  offFriendRequestUpdated: jest.fn(),
};
