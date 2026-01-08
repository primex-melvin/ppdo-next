// app/dashboard/components/Sidebar.tsx

/**
 * Re-export the modular Sidebar component
 * 
 * This file maintains backward compatibility by re-exporting
 * the refactored Sidebar from the sidebar/ subdirectory.
 * 
 * All functionality has been preserved and moved to:
 * - sidebar/Sidebar.tsx - Main component
 * - sidebar/types.ts - Type definitions
 * - sidebar/utils.ts - Helper functions
 * - sidebar/navConfig.tsx - Navigation configuration
 * - sidebar/SidebarHeader.tsx - Header component
 * - sidebar/SidebarNav.tsx - Navigation component
 * - sidebar/SidebarFooter.tsx - Footer component
 * - sidebar/NavCategory.tsx - Category component
 * - sidebar/NavItem.tsx - Individual item component
 * - sidebar/MobileMenuButton.tsx - Mobile menu button
 */

export { Sidebar } from "./sidebar";
export type { SidebarProps, NavItem, SubMenuItem, NavCategory } from "./sidebar";
