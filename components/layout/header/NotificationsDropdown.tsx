// ============================================================================
// Notifications Dropdown Component
// File: app/dashboard/components/header/NotificationsDropdown.tsx
// ============================================================================

"use client";

import { useState } from "react";
import { useAccentColor } from "@/contexts/AccentColorContext";

export function NotificationsDropdown() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const { accentColorValue } = useAccentColor();

  // Mock notification data - Replace with real data from your backend
  const notifications = [
    {
      id: 1,
      title: "New document received",
      message: "A new incoming document requires your review",
      time: "5 minutes ago",
      isRead: false,
    },
    {
      id: 2,
      title: "Approval pending",
      message: "3 documents are waiting for your approval",
      time: "1 hour ago",
      isRead: false,
    },
    {
      id: 3,
      title: "System update",
      message: "System maintenance scheduled for tonight",
      time: "2 hours ago",
      isRead: false,
    },
  ];

  return (
    <div className="relative hidden">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        title="Notifications"
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Unread indicator dot */}
        {notificationCount > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ backgroundColor: accentColorValue }}
          />
        )}
        
        {/* Unread count badge */}
        {notificationCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
            style={{ backgroundColor: accentColorValue }}
          >
            {notificationCount > 9 ? "9+" : notificationCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowNotifications(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl z-20 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Notifications
              </h3>
              {notificationCount > 0 && (
                <button
                  onClick={() => setNotificationCount(0)}
                  className="text-sm font-medium"
                  style={{ color: accentColorValue }}
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notificationCount > 0 ? (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-colors"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Unread indicator */}
                        <div
                          className="w-2 h-2 rounded-full mt-2 shrink-0"
                          style={{
                            backgroundColor: notification.isRead
                              ? "transparent"
                              : accentColorValue,
                          }}
                        />
                        
                        {/* Notification content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {notification.title}
                          </p>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            {notification.time}
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No new notifications
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}