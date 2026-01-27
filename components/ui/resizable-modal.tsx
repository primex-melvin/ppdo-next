// components/ui/resizable-modal.tsx

'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResizableModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface ResizableModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  width?: string | number;
  height?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  onCloseClick?: () => void;
  preventOutsideClick?: boolean;
  allowOverflow?: boolean; // NEW PROP: Control overflow behavior
}

interface ResizableModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface ResizableModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

interface ResizableModalTitleProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  children?: React.ReactNode;
}

interface ResizableModalDescriptionProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description> {
  children?: React.ReactNode;
}

const toCSSValue = (value: string | number | undefined): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'number') return `${value}px`;
  return value;
};

const ResizableModal = DialogPrimitive.Root;
const ResizableModalTrigger = DialogPrimitive.Trigger;
const ResizableModalPortal = DialogPrimitive.Portal;

const ResizableModalOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      'data-[state=open]:duration-200 data-[state=closed]:duration-200',
      className
    )}
    {...props}
  />
));
ResizableModalOverlay.displayName = 'ResizableModalOverlay';

const ResizableModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ResizableModalContentProps
>(({
  className,
  children,
  width = 'auto',
  height = 'auto',
  maxWidth = '95vw',
  maxHeight = '90vh',
  onCloseClick,
  preventOutsideClick = false,
  allowOverflow = false, // NEW PROP: Default to false for backward compatibility
  ...props
}, ref) => {
  const styleOverrides = {
    width: toCSSValue(width),
    height: toCSSValue(height),
    maxWidth: toCSSValue(maxWidth),
    maxHeight: toCSSValue(maxHeight),
  };

  return (
    <ResizableModalPortal>
      <ResizableModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Base positioning
          'fixed left-[50%] top-[50%] z-[1001] translate-x-[-50%] translate-y-[-50%]',
          // Styling
          'bg-white dark:bg-stone-900 rounded-lg shadow-2xl',
          'border border-stone-200 dark:border-stone-800',
          // Layout
          'flex flex-col',
          // Overflow handling - CONDITIONAL based on allowOverflow prop
          allowOverflow ? 'overflow-visible' : 'overflow-hidden',
          // Animation
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]',
          // Duration
          'data-[state=open]:duration-250 data-[state=closed]:duration-200',
          // Focus
          'focus:outline-none',
          // Responsive
          'max-sm:w-screen max-sm:h-screen max-sm:max-w-none max-sm:max-h-none max-sm:rounded-none',
          className
        )}
        style={styleOverrides}
        onPointerDownOutside={(e) => {
          if (preventOutsideClick) {
            e.preventDefault();
          }
        }}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          onClick={onCloseClick}
          className={cn(
            'absolute right-4 top-4 z-10',
            'rounded-sm opacity-70 ring-offset-white',
            'transition-opacity hover:opacity-100',
            'focus:outline-none focus:ring-2 focus:ring-stone-950 focus:ring-offset-2',
            'disabled:pointer-events-none',
            'dark:ring-offset-stone-950 dark:focus:ring-stone-300',
            'p-2 -m-2'
          )}
        >
          <X className="h-5 w-5 text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </ResizableModalPortal>
  );
});
ResizableModalContent.displayName = 'ResizableModalContent';

const ResizableModalHeader = ({
  className,
  ...props
}: ResizableModalHeaderProps) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 px-6 py-4 border-b border-stone-200 dark:border-stone-800',
      'shrink-0',
      className
    )}
    {...props}
  />
);
ResizableModalHeader.displayName = 'ResizableModalHeader';

const ResizableModalFooter = ({
  className,
  ...props
}: ResizableModalFooterProps) => (
  <div
    className={cn(
      'flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 dark:border-stone-800',
      'shrink-0',
      className
    )}
    {...props}
  />
);
ResizableModalFooter.displayName = 'ResizableModalFooter';

const ResizableModalTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  ResizableModalTitleProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-none tracking-tight text-stone-900 dark:text-stone-100',
      className
    )}
    {...props}
  />
));
ResizableModalTitle.displayName = 'ResizableModalTitle';

const ResizableModalDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  ResizableModalDescriptionProps
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      'text-sm text-stone-500 dark:text-stone-400',
      className
    )}
    {...props}
  />
));
ResizableModalDescription.displayName = 'ResizableModalDescription';

const ResizableModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex-1 overflow-y-auto overflow-x-hidden',
      'scrollbar-thin scrollbar-thumb-stone-300 dark:scrollbar-thumb-stone-700',
      'scrollbar-track-transparent',
      className
    )}
    {...props}
  />
));
ResizableModalBody.displayName = 'ResizableModalBody';

export {
  ResizableModal,
  ResizableModalTrigger,
  ResizableModalPortal,
  ResizableModalOverlay,
  ResizableModalContent,
  ResizableModalHeader,
  ResizableModalFooter,
  ResizableModalTitle,
  ResizableModalDescription,
  ResizableModalBody,
};
export type {
  ResizableModalProps,
  ResizableModalContentProps,
  ResizableModalHeaderProps,
  ResizableModalFooterProps,
  ResizableModalTitleProps,
  ResizableModalDescriptionProps,
};