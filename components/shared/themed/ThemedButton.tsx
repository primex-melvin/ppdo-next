// components/shared/themed/ThemedButton.tsx

"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAccentColor } from "@/contexts/AccentColorContext";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

/**
 * Extended button variant type that includes accent color variants
 */
type ThemedVariant = "primary" | "accent" | NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

/**
 * Props for ThemedButton component
 */
export interface ThemedButtonProps extends Omit<React.ComponentProps<typeof Button>, "variant"> {
  /** Button variant - "primary" and "accent" automatically apply accent color */
  variant?: ThemedVariant;
  /** Optional icon */
  icon?: LucideIcon;
  /** Icon position */
  iconPosition?: "left" | "right";
  /** Show loading state */
  isLoading?: boolean;
}

/**
 * Themed button component with automatic accent color integration
 *
 * Automatically applies the government-specific accent color when variant is "primary" or "accent".
 * Removes the need to manually call useAccentColor() in every component.
 *
 * @example
 * // Basic usage - automatically uses accent color:
 * <ThemedButton variant="primary">
 *   Save Changes
 * </ThemedButton>
 *
 * @example
 * // With icon:
 * <ThemedButton variant="primary" icon={Plus} iconPosition="left">
 *   Add New
 * </ThemedButton>
 *
 * @example
 * // With loading state:
 * <ThemedButton variant="primary" isLoading={isSubmitting}>
 *   {isSubmitting ? "Saving..." : "Save"}
 * </ThemedButton>
 *
 * @example
 * // Other variants work as normal:
 * <ThemedButton variant="destructive">Delete</ThemedButton>
 * <ThemedButton variant="outline">Cancel</ThemedButton>
 * <ThemedButton variant="ghost">Reset</ThemedButton>
 */
export function ThemedButton({
  variant = "default",
  icon: Icon,
  iconPosition = "left",
  isLoading = false,
  children,
  disabled,
  className = "",
  style = {},
  ...props
}: ThemedButtonProps) {
  const { accentColorValue } = useAccentColor();

  // Determine if we should apply accent color
  const shouldApplyAccent = variant === "primary" || variant === "accent";

  // Map themed variants to base button variants
  const baseVariant: VariantProps<typeof buttonVariants>["variant"] =
    shouldApplyAccent ? "default" : (variant as any);

  // Build custom styles for accent color
  const accentStyle = shouldApplyAccent
    ? {
        backgroundColor: accentColorValue,
        color: "#ffffff",
        ...style,
      }
    : style;

  // Add hover effect class for accent buttons
  const accentClass = shouldApplyAccent
    ? "hover:opacity-90 transition-opacity"
    : "";

  return (
    <Button
      variant={baseVariant}
      disabled={disabled || isLoading}
      className={`${accentClass} ${className}`}
      style={accentStyle}
      {...props}
    >
      {Icon && iconPosition === "left" && <Icon className="w-4 h-4" />}
      {children}
      {Icon && iconPosition === "right" && <Icon className="w-4 h-4" />}
    </Button>
  );
}

/**
 * Themed icon button variant
 *
 * @example
 * <ThemedIconButton variant="primary" icon={Plus} aria-label="Add item" />
 */
export function ThemedIconButton({
  variant = "default",
  icon: Icon,
  size = "icon",
  ...props
}: Omit<ThemedButtonProps, "children"> & {
  icon: LucideIcon;
  size?: "icon" | "icon-sm" | "icon-lg";
}) {
  const { accentColorValue } = useAccentColor();

  const shouldApplyAccent = variant === "primary" || variant === "accent";
  const baseVariant: VariantProps<typeof buttonVariants>["variant"] =
    shouldApplyAccent ? "default" : (variant as any);

  const accentStyle = shouldApplyAccent
    ? {
        backgroundColor: accentColorValue,
        color: "#ffffff",
      }
    : {};

  const accentClass = shouldApplyAccent
    ? "hover:opacity-90 transition-opacity"
    : "";

  return (
    <Button
      variant={baseVariant}
      size={size}
      className={accentClass}
      style={accentStyle}
      {...props}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );
}

/**
 * Themed action button for tables and toolbars
 * Compact design with optional icon and label
 *
 * @example
 * <ThemedActionButton
 *   variant="primary"
 *   icon={Plus}
 *   label="Add New"
 *   onClick={handleAdd}
 * />
 */
export function ThemedActionButton({
  variant = "default",
  icon: Icon,
  label,
  hideLabel = false,
  ...props
}: Omit<ThemedButtonProps, "children"> & {
  icon: LucideIcon;
  label: string;
  hideLabel?: boolean;
}) {
  const { accentColorValue } = useAccentColor();

  const shouldApplyAccent = variant === "primary" || variant === "accent";

  // For action buttons, we use a different style pattern
  if (shouldApplyAccent) {
    return (
      <button
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-white hover:opacity-90 transition-opacity"
        style={{
          backgroundColor: accentColorValue,
          borderRadius: "6px",
        }}
        {...props}
      >
        <Icon style={{ width: "14px", height: "14px" }} />
        {!hideLabel && <span className="hidden sm:inline">{label}</span>}
      </button>
    );
  }

  // Default/outline variant
  return (
    <button
      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
      style={{
        border: "1px solid rgb(228 228 231 / 1)",
        borderRadius: "6px",
      }}
      {...props}
    >
      <Icon style={{ width: "14px", height: "14px" }} />
      {!hideLabel && <span className="hidden sm:inline">{label}</span>}
    </button>
  );
}
