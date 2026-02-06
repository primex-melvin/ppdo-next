"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout";

export function ConditionalFooter() {
  const pathname = usePathname();

  // Show footer only on authenticated dashboard pages
  const showFooter = pathname?.startsWith("/dashboard");

  if (!showFooter) {
    return null;
  }

  return <Footer />;
}
