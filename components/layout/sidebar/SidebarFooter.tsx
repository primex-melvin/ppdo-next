"use client";

import React from "react";

export function SidebarFooter({ isMinimized }: { isMinimized: boolean }) {
  return (
    <div className={`p-4 border-t border-zinc-200 dark:border-zinc-800 transition-opacity duration-300 ${isMinimized ? "md:opacity-0 md:pointer-events-none" : ""}`}>
      <div className="px-4 py-3 rounded-xl bg-[#f8f8f8] dark:bg-zinc-800/50">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mb-1">Provincial Government</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">© {new Date().getFullYear()} Tarlac</p>
      </div>
    </div>
  );
}
