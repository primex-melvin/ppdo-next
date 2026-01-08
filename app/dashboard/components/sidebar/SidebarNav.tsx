// app/dashboard/components/sidebar/SidebarNav.tsx

"use client";

import { NavCategory } from "./NavCategory";
import { NavCategory as NavCategoryType } from "./types";

interface SidebarNavProps {
  categories: NavCategoryType[];
  isMinimized: boolean;
  accentColor: string;
}

export function SidebarNav({
  categories,
  isMinimized,
  accentColor,
}: SidebarNavProps) {
  return (
    <nav className="flex-1 overflow-y-auto p-4">
      <div className="space-y-6">
        {categories.map((category) => (
          <NavCategory
            key={category.name}
            category={category}
            isMinimized={isMinimized}
            accentColor={accentColor}
          />
        ))}
      </div>
    </nav>
  );
}
