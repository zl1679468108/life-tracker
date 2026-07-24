/**
 * 通用树形构建：按 parent_id 组装 children
 */
export type TreeNode<T> = T & { children: TreeNode<T>[] };

export function buildTree<T extends { id: string; parent_id?: string | null }>(
  items: T[],
): TreeNode<T>[] {
  const map = new Map<string, TreeNode<T>>();
  const roots: TreeNode<T>[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parent_id) {
      const parent = map.get(item.parent_id);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}
