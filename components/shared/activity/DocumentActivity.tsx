"use client";

interface DocumentActivity {
  id: string;
  documentName: string;
  documentType: string;
  action: "created" | "updated" | "archived" | "reviewed";
  user: string;
  timestamp: string;
  status: "completed" | "pending" | "approved";
}

interface DocumentActivityProps {
  activities?: DocumentActivity[];
}

const mockActivities: DocumentActivity[] = [
  {
    id: "1",
    documentName: "Resolution No. 2024-045",
    documentType: "Resolution",
    action: "created",
    user: "Maria Santos",
    timestamp: "5 minutes ago",
    status: "pending",
  },
  {
    id: "2",
    documentName: "Ordinance No. 2024-123",
    documentType: "Ordinance",
    action: "reviewed",
    user: "Gov. Christian Yap",
    timestamp: "1 hour ago",
    status: "approved",
  },
  {
    id: "3",
    documentName: "Executive Order No. 2024-89",
    documentType: "Executive Order",
    action: "updated",
    user: "John Reyes",
    timestamp: "2 hours ago",
    status: "completed",
  },
  {
    id: "4",
    documentName: "Municipal Budget 2024",
    documentType: "Budget Document",
    action: "archived",
    user: "Anna Cruz",
    timestamp: "3 hours ago",
    status: "completed",
  },
  {
    id: "5",
    documentName: "Meeting Minutes - Council Session",
    documentType: "Minutes",
    action: "created",
    user: "Roberto Dela Cruz",
    timestamp: "4 hours ago",
    status: "pending",
  },
];

export function DocumentActivity({ activities = mockActivities }: DocumentActivityProps) {
  const getActionColor = (action: string) => {
    switch (action) {
      case "created":
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400";
      case "updated":
        return "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400";
      case "reviewed":
        return "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400";
      case "archived":
        return "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-400";
      default:
        return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400";
      case "completed":
        return "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-400";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case "updated":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case "reviewed":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "archived":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#f8f8f8] dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1" style={{ fontFamily: 'var(--font-cinzel), serif' }}>
            Document Activity
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Recent document processing and updates
          </p>
        </div>
        <button className="text-sm font-medium text-[#15803d] hover:text-[#16a34a] transition-colors">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-4 p-3 rounded-lg hover:bg-white dark:hover:bg-zinc-800/50 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
          >
            <div className={`p-1.5 rounded-lg ${getActionColor(activity.action)}`}>
              {getActionIcon(activity.action)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {activity.documentName}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500 truncate">
                    {activity.documentType} • {activity.user}
                  </p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                <span className="flex items-center gap-1 capitalize">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {activity.timestamp}
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {activity.action}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

