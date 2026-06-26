export const socketService = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  onItemCreated: jest.fn(),
  onItemUpdated: jest.fn(),
  onItemDeleted: jest.fn(),
  onTodoCreated: jest.fn(),
  onTodoUpdated: jest.fn(),
  onTodoDeleted: jest.fn(),
};
