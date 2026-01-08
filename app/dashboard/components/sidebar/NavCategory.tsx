// app/dashboard/components/sidebar/NavCategory.tsx

"use client";

import { usePathname } from "next/navigation";
import { NavCategory as NavCategoryType } from "./types";
import { NavItem } from "./NavItem";

interface NavCategoryProps {
  category: NavCategoryType;
  isMinimized: boolean;
  accentColor: string;
}

export function NavCategory({
  category,
  isMinimized,
  accentColor,
}: NavCategoryProps) {
  const pathname = usePathname();

  return (
    <div className="space-y-2">
      {/* Category Header */}
      {!isMinimized && (
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {category.name}
          </h3>
        </div>
      )}

      {/* Category Items */}
      <ul className="space-y-2">
        {category.items.map((item, itemIndex) => {
          const itemKey = item.href || `nav-item-${category.name}-${itemIndex}`;
          const isActive = item.href
            ? pathname === item.href
            : item.submenu?.some((sub) => pathname === sub.href);

          return (
            <li key={itemKey}>
              <NavItem
                item={item}
                isActive={!!isActive}
                isMinimized={isMinimized}
                accentColor={accentColor}
                pathname={pathname}
                itemKey={itemKey}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
