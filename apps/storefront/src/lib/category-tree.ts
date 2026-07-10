import type { Category } from "./api";

/** Build tree from flat list when API only returns collections array */
export function buildCategoryTree(flat: Category[]): Category[] {
  const nodes = new Map<string, Category>();
  for (const cat of flat) {
    nodes.set(cat._id, { ...cat, children: [] });
  }

  const roots: Category[] = [];
  for (const cat of flat) {
    const node = nodes.get(cat._id)!;
    if (cat.parentId && nodes.has(cat.parentId)) {
      nodes.get(cat.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (list: Category[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    list.forEach((n) => n.children && sort(n.children));
  };
  sort(roots);
  return roots;
}

export function getCategoryRoots(tree: Category[]): Category[] {
  return tree.length > 0 && !tree[0].parentId ? tree : buildCategoryTree(tree);
}
