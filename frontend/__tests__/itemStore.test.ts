import { useItemStore } from '../stores/itemStore';

describe('itemStore', () => {
  beforeEach(() => {
    useItemStore.setState({ items: [], loading: false, error: null });
  });

  it('starts with empty state', () => {
    expect(useItemStore.getState().items).toEqual([]);
    expect(useItemStore.getState().loading).toBe(false);
    expect(useItemStore.getState().error).toBeNull();
  });
});
