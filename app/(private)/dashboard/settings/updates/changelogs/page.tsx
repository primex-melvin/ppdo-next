"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { CheckCircle2, Bug, Lightbulb } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type ChangelogItem = {
  _id: string;
  title: string;
  description: string;
  type: "bug" | "suggestion";
  date: string | number;
};

export default function ChangelogsPage() {
  const bugReports = useQuery(api.bugReports.getAll);
  const suggestions = useQuery(api.suggestions.getAll);

  const [selected, setSelected] = useState<ChangelogItem | null>(null);

  if (!bugReports || !suggestions) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
      </div>
    );
  }

  const fixedBugs: ChangelogItem[] = bugReports
    .filter((b) => b.status === "fixed")
    .map((b) => ({
      _id: b._id,
      title: b.title || "Untitled Bug Report",
      description: b.description,
      type: "bug" as const,
      date: b.updatedAt || b.submittedAt,
    }));

  const acknowledgedSuggestions: ChangelogItem[] = suggestions
    .filter((s) => s.status === "acknowledged")
    .map((s) => ({
      _id: s._id,
      title: s.title || "Untitled Suggestion",
      description: s.description,
      type: "suggestion" as const,
      date: s.updatedAt || s.submittedAt,
    }));

  const changelogs = [...fixedBugs, ...acknowledgedSuggestions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Changelogs
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Implemented features and resolved issues
        </p>
      </div>

      {changelogs.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-white dark:bg-zinc-900">
          <CheckCircle2 className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No implemented changes yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {changelogs.map((item) => (
            <div
              key={item._id}
              onClick={() => setSelected(item)}
              className="border rounded-lg bg-white dark:bg-zinc-900 p-5 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-blue-900/30">
                  {item.type === "bug" ? (
                    <Bug className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  ) : (
                    <Lightbulb className="h-5 w-5 text-blue-700 dark:text-blue-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {item.type === "bug"
                        ? "Bug Fixed"
                        : "Feature Implemented"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Dialog Modal */}
      {/* ✅ Dialog Modal */}
<Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
  <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
    {selected && (
      <>
        {/* 🔒 Fixed Header */}
        <DialogHeader className="px-6 py-5 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-gray-100 dark:bg-blue-900/30 rounded-lg">
              {selected.type === "bug" ? (
                <Bug className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              ) : (
                <Lightbulb className="w-5 h-5 text-blue-700 dark:text-blue-400" />
              )}
            </div>

            <div className="flex-1">
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {selected.title}
              </DialogTitle>

              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                Implemented on{" "}
                {new Date(selected.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 📜 Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Type
              </label>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4" />
                {selected.type === "bug"
                  ? "Bug Fixed"
                  : "Feature Implemented"}
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                Description
              </label>
              <div className="p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 max-h-80 overflow-y-auto">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap leading-relaxed break-words">
                  {selected.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    )}
  </DialogContent>
</Dialog>

    </div>
  );
}
