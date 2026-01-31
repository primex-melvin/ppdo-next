// app/dashboard/restricted/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RestrictedPage() {
  const router = useRouter();

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Access Restricted
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          You don't have permission to access this page
        </p>
      </div>

      {/* Restricted Content Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2 text-center">
            Access Denied
          </h2>
          
          <p className="text-zinc-600 dark:text-zinc-400 text-center max-w-md mb-8">
            You don't have the necessary permissions to view this page. Please contact your administrator if you believe this is an error.
          </p>

          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </>
  );
}