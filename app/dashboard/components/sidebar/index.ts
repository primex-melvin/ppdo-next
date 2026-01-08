// app/dashboard/components/sidebar/index.ts

/**
 * Sidebar Module Exports
 * 
 * This barrel file provides a clean, organized way to import sidebar components.
 * Only export the main Sidebar component and types for external use.
 */

export { Sidebar } from "./Sidebar";
export type { SidebarProps, NavItem, SubMenuItem, NavCategory } from "./types";
export { defaultNavItems } from "./navConfig";
