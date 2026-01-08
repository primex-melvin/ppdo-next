// app/dashboard/components/sidebar/Sidebar.tsx

"use client";

import { useState } from "react";
import { useSidebar } from "../../contexts/SidebarContext";
import { useAccentColor } from "../../contexts/AccentColorContext";
import { groupItemsByCategory } from "./utils";
import { defaultNavItems } from "./navConfig";
import { SidebarProps } from "./types";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNav } from "./SidebarNav";
import { SidebarFooter } from "./SidebarFooter";
import { MobileMenuButton } from "./MobileMenuButton";

/**
 * Main Sidebar Component
 * 
 * A responsive sidebar navigation component that supports:
 * - Mobile and desktop views with different behaviors
 * - Minimized/expanded states (desktop only)
 * - Categorized navigation items
 * - Active route highlighting with accent colors
 * - Submenu expansion
 * 
 * @param navItems - Optional custom navigation items (defaults to defaultNavItems)
 */
export function Sidebar({ navItems = defaultNavItems }: SidebarProps) {
  // Mobile sidebar overlay state
  const [isOpen, setIsOpen] = useState(true);
  
  // Desktop minimized state from context
  const { isMinimized } = useSidebar();
  
  // Accent color for active states
  const { accentColorValue } = useAccentColor();

  // Group navigation items by category
  const groupedCategories = groupItemsByCategory(navItems);

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50
          h-dvh
          bg-[#f8f8f8]/95 dark:bg-zinc-900/95 backdrop-blur-sm
          border-r border-zinc-200 dark:border-zinc-800
          transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isMinimized ? "md:w-20" : "md:w-64"}
          w-64
          flex flex-col
        `}
      >
        <SidebarHeader
          isMinimized={isMinimized}
          onClose={handleClose}
          showCloseButton={true}
        />

        <SidebarNav
          categories={groupedCategories}
          isMinimized={isMinimized}
          accentColor={accentColorValue}
        />

        <SidebarFooter isMinimized={isMinimized} />
      </aside>

      {/* Mobile menu toggle button */}
      <MobileMenuButton isOpen={isOpen} onClick={handleOpen} />
    </>
  );
}
