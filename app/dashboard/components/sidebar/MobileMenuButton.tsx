// app/dashboard/components/sidebar/MobileMenuButton.tsx

"use client";

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function MobileMenuButton({ isOpen, onClick }: MobileMenuButtonProps) {
  if (isOpen) return null;

  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-[#f8f8f8] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
