// app/dashboard/components/sidebar/NavItem.tsx

"use client";

import Link from "next/link";
import { useState } from "react";
import { NavItem as NavItemType } from "./types";

interface NavItemProps {
  item: NavItemType;
  isActive: boolean;
  isMinimized: boolean;
  accentColor: string;
  pathname: string;
  itemKey: string;
}

export function NavItem({
  item,
  isActive,
  isMinimized,
  accentColor,
  pathname,
  itemKey,
}: NavItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const handleToggle = () => {
    if (isMinimized || item.disabled) return;
    setIsExpanded(!isExpanded);
  };

  // Auto-expand if submenu item is active
  if (hasSubmenu && !isExpanded) {
    const hasActiveSubmenu = item.submenu?.some((sub) => pathname === sub.href);
    if (hasActiveSubmenu) {
      setIsExpanded(true);
    }
  }

  const baseStyles = `
    flex items-center rounded-xl
    transition-all duration-200 group
    ${isMinimized ? "md:justify-center md:px-3 md:py-3" : "gap-3 px-4 py-3"}
  `;

  const activeStyles = {
    backgroundColor: `${accentColor}10`,
    color: accentColor,
  };

  const inactiveStyles = `
    text-zinc-700 dark:text-zinc-300
    ${!item.disabled ? "hover:bg-zinc-100 dark:hover:bg-zinc-800" : ""}
  `;

  if (hasSubmenu) {
    return (
      <>
        <button
          onClick={handleToggle}
          disabled={item.disabled}
          className={`
            w-full ${baseStyles} justify-between
            ${
              item.disabled
                ? "cursor-not-allowed text-zinc-700 dark:text-zinc-300"
                : isActive
                ? "font-medium"
                : inactiveStyles
            }
          `}
          style={isActive ? activeStyles : undefined}
          title={isMinimized ? item.name : undefined}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span
              className={isMinimized ? "shrink-0" : ""}
              style={isActive ? { color: accentColor } : undefined}
            >
              {item.icon}
            </span>
            <span
              className={`
                transition-all duration-300 whitespace-nowrap
                ${isMinimized ? "md:hidden" : ""}
              `}
            >
              {item.name}
            </span>
          </div>
          {!isMinimized && (
            <svg
              className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                isExpanded ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </button>

        {/* Submenu */}
        {!isMinimized && isExpanded && item.submenu && (
          <ul className="ml-4 mt-1 space-y-1 border-l-2 border-zinc-200 dark:border-zinc-800 pl-4">
            {item.submenu.map((subItem) => {
              const isSubActive = pathname === subItem.href;
              return (
                <li key={subItem.href}>
                  <Link
                    href={subItem.href}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-lg
                      transition-all duration-200
                      ${
                        isSubActive
                          ? "font-medium"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      }
                    `}
                    style={isSubActive ? activeStyles : undefined}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSubActive ? "" : "bg-zinc-400 dark:bg-zinc-600"
                      }`}
                      style={
                        isSubActive ? { backgroundColor: accentColor } : undefined
                      }
                    />
                    <span>{subItem.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </>
    );
  }

  if (item.disabled) {
    return (
      <div
        className={`${baseStyles} cursor-not-allowed text-zinc-700 dark:text-zinc-300`}
        title={isMinimized ? item.name : "Coming soon"}
        onClick={(e) => e.preventDefault()}
      >
        <span className={isMinimized ? "shrink-0" : ""}>{item.icon}</span>
        <span
          className={`
            transition-all duration-300 whitespace-nowrap
            ${isMinimized ? "md:hidden" : ""}
          `}
        >
          {item.name}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className={`
        ${baseStyles}
        ${isActive ? "font-medium" : inactiveStyles}
      `}
      style={isActive ? activeStyles : undefined}
      title={isMinimized ? item.name : undefined}
    >
      <span
        className={isMinimized ? "shrink-0" : ""}
        style={isActive ? { color: accentColor } : undefined}
      >
        {item.icon}
      </span>
      <span
        className={`
          transition-all duration-300 whitespace-nowrap
          ${isMinimized ? "md:hidden" : ""}
        `}
      >
        {item.name}
      </span>
    </Link>
  );
}
