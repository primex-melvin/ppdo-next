// ============================================================================
// Email Dropdown Component
// File: app/dashboard/components/header/EmailDropdown.tsx
// ============================================================================

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAccentColor } from "@/contexts/AccentColorContext";

export function EmailDropdown() {
  const [showEmails, setShowEmails] = useState(false);
  const [emailCount, setEmailCount] = useState(5);
  const router = useRouter();
  const { accentColorValue } = useAccentColor();

  // Mock email data - Replace with real data from your backend
  const emails = [
    {
      id: 1,
      from: "provincial.office@tarlac.gov.ph",
      subject: "Monthly Report Submission",
      preview: "Please submit the monthly report by end of week...",
      time: "2 hours ago",
      isRead: false,
    },
    {
      id: 2,
      from: "hr@tarlac.gov.ph",
      subject: "Staff Meeting Reminder",
      preview: "Reminder: Staff meeting scheduled for tomorrow...",
      time: "5 hours ago",
      isRead: false,
    },
    {
      id: 3,
      from: "finance@tarlac.gov.ph",
      subject: "Budget Approval Required",
      preview: "Your department budget request needs approval...",
      time: "1 day ago",
      isRead: false,
    },
    {
      id: 4,
      from: "it@tarlac.gov.ph",
      subject: "System Maintenance Notice",
      preview: "Scheduled maintenance this weekend from 10 PM...",
      time: "2 days ago",
      isRead: true,
    },
    {
      id: 5,
      from: "admin@tarlac.gov.ph",
      subject: "Policy Update",
      preview: "New office policies have been updated...",
      time: "3 days ago",
      isRead: true,
    },
  ];

  return (
    <div className="relative hidden">
      <button
        onClick={() => setShowEmails(!showEmails)}
        className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Email"
      >
        <svg
          className="w-8 h-8 text-zinc-600 dark:text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        
        {/* Unread indicator dot */}
        {emailCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColorValue }}
          />
        )}
        
        {/* Unread count badge */}
        {emailCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: accentColorValue }}
          >
            {emailCount > 9 ? "9+" : emailCount}
          </span>
        )}
      </button>

      {/* Email Dropdown */}
      {showEmails && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowEmails(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-20 max-h-[600px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Email
              </h3>
              {emailCount > 0 && (
                <button
                  onClick={() => setEmailCount(0)}
                  className="text-sm font-medium"
                  style={{ color: accentColorValue }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
              {emailCount > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                      onClick={() => setShowEmails(false)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        <div
                          className="w-2 h-2 rounded-full mt-2 shrink-0"
                          style={{
                            backgroundColor: email.isRead
                              ? "transparent"
                              : accentColorValue,
                          }}
                        />
                        
                        {/* Email content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {email.from}
                          </p>
                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-1 truncate">
                            {email.subject}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                            {email.preview}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            {email.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <svg
                    className="w-12 h-12 mx-auto mb-3 text-zinc-400 dark:text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No new emails
                  </p>
                </div>
              )}
            </div>

            {/* Footer - View All Button */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                className="w-full py-2 px-4 rounded-lg font-medium transition-all hover:shadow-md text-center"
                style={{
                  backgroundColor: accentColorValue,
                  color: "white",
                }}
                onClick={() => {
                  setShowEmails(false);
                  router.push("/mail");
                }}
              >
                View All Emails
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}