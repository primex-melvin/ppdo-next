"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TableActionButtonProps {
  /**
   * Lucide icon component to display
   */
  icon: LucideIcon;

  /**
   * Button label text (hidden on mobile via sm:inline)
   */
  label: string;

  /**
   * Click handler
   */
  onClick: () => void;

  /**
   * Button variant style
   * - 'default': Outline style
   * - 'primary': Colored style
   * @default 'default'
   */
  variant?: 'default' | 'primary';

  /**
   * Accent color for 'primary' variant
   */
  accentColor?: string;

  /**
   * Optional title attribute for accessibility
   */
  title?: string;

  /**
   * Additional className
   */
  className?: string;

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;

  /**
   * Whether to hide text on certain breakpoints
   * @default true (hides on <sm)
   */
  hideLabelOnMobile?: boolean;
}

/**
 * TableActionButton - Enhanced action button with Tooltip support
 */
export function TableActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  accentColor,
  title,
  className = "",
  disabled = false,
  hideLabelOnMobile = true,
}: TableActionButtonProps) {
  const labelContent = (
    <span className={hideLabelOnMobile ? "hidden sm:inline" : ""}>
      {label}
    </span>
  );

  const buttonElement = (
    <Button
      onClick={onClick}
      variant={variant === 'default' ? 'outline' : 'default'}
      size="sm"
      className={`gap-2 ${className}`}
      style={variant === 'primary' && accentColor ? { backgroundColor: accentColor, color: 'white' } : {}}
      disabled={disabled}
    >
      <Icon className="w-3.5 h-3.5" />
      {labelContent}
    </Button>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {buttonElement}
        </TooltipTrigger>
        <TooltipContent>
          <p>{title || label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
