// app/dashboard/contexts/BreadcrumbContext.tsx

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  loading?: boolean; // Show skeleton loader for this item
}

interface BreadcrumbContextType {
  customBreadcrumbs: BreadcrumbItem[] | null;
  setCustomBreadcrumbs: (items: BreadcrumbItem[] | null) => void;
  onBreadcrumbClick?: (href: string) => void;
  setOnBreadcrumbClick: (handler: ((href: string) => void) | undefined) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
  undefined
);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState<
    BreadcrumbItem[] | null
  >(null);
  const [onBreadcrumbClick, setOnBreadcrumbClick] = useState<
    ((href: string) => void) | undefined
  >(undefined);

  return (
    <BreadcrumbContext.Provider
      value={{
        customBreadcrumbs,
        setCustomBreadcrumbs,
        onBreadcrumbClick,
        setOnBreadcrumbClick,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext);
  if (context === undefined) {
    throw new Error("useBreadcrumb must be used within a BreadcrumbProvider");
  }
  return context;
}
