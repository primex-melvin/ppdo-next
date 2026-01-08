// app/dashboard/components/sidebar/utils.ts

import { NavItem, NavCategory } from "./types";

/**
 * Groups navigation items by their category
 * @param items - Array of navigation items to group
 * @returns Array of categorized navigation items
 */
export function groupItemsByCategory(items: NavItem[]): NavCategory[] {
  const categories: { [key: string]: NavItem[] } = {};

  items.forEach((item) => {
    const category = item.category || "Uncategorized";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });

  // Define category order
  const categoryOrder = [
    "My Workspace",
    "Department",
    "Cross Department",
    "Control Panel",
  ];

  // Categories that should always be shown even if empty
  const alwaysShowCategories = ["Department", "Cross Department"];

  return categoryOrder
    .filter((cat) => categories[cat] || alwaysShowCategories.includes(cat))
    .map((cat) => ({
      name: cat,
      items: categories[cat] || [],
    }));
}
