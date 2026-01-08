import type React from "react";

export interface SubMenuItem {
  name: string;
  href: string;
}

export interface NavItem {
  name: string;
  href?: string;
  icon: React.ReactNode;
  submenu?: SubMenuItem[];
  category?: string;
  disabled?: boolean;
}

export interface NavCategory {
  name: string;
  items: NavItem[];
}

export interface SidebarProps {
  navItems?: NavItem[];
}
