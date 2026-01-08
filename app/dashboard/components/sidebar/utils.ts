import { NavCategory, NavItem } from "./types";

export function groupItemsByCategory(items: NavItem[]): NavCategory[] {
  const categories: { [key: string]: NavItem[] } = {};

  items.forEach((item) => {
    const category = item.category || "Uncategorized";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });

  const order = ["My Workspace", "Department", "Cross Department", "Control Panel"];
  return order.filter((c) => categories[c]).map((c) => ({ name: c, items: categories[c] }));
}
