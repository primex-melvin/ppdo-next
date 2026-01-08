"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { SidebarFooter } from "./SidebarFooter";
import { SidebarProps } from "./types";
import { groupItemsByCategory } from "./utils";
import { defaultNavItems } from "./navItems";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAccentColor } from "../../contexts/AccentColorContext";

export function Sidebar({ navItems = defaultNavItems }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { isMinimized } = useSidebar();
  const pathname = usePathname();
  const { accentColorValue } = useAccentColor();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const grouped = groupItemsByCategory(navItems);

  useEffect(() => {
    navItems.forEach((item, index) => {
      if (item.submenu && item.submenu.length > 0) {
        const itemKey = item.href || `nav-item-${index}`;
        const hasActiveSubmenu = item.submenu.some((sub) => pathname === sub.href);
        if (hasActiveSubmenu) setExpandedItems((prev) => new Set(prev).add(itemKey));
      }
    });
  }, [pathname, navItems]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsOpen(false)} />}

      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-dvh bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm border-r border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${isMinimized ? "md:w-20" : "md:w-64"} w-64 flex flex-col`}
      >
        <SidebarHeader isMinimized={isMinimized} onCloseMobile={() => setIsOpen(false)} />
        <SidebarNav
          categories={grouped}
          isMinimized={isMinimized}
          pathname={pathname}
          accentColor={accentColorValue}
          expanded={expandedItems}
          setExpanded={setExpandedItems}
        />
        <SidebarFooter isMinimized={isMinimized} />
      </aside>

      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#f8f8f8] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
}
