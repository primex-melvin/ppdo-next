// app/changelog/page.tsx

"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Package, Sparkles } from "lucide-react";
import {
  CHANGELOG_DATA,
  getCategoryBadgeColor,
  getCategoryDisplayName,
  type ChangelogEntry,
  type ChangelogItem,
} from "@/data/changelog-data";

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Changelog
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Track all updates, improvements, and fixes to the PPDO system
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {CHANGELOG_DATA.map((entry, index) => (
            <ChangelogCard key={entry.version} entry={entry} isLatest={index === 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChangelogCard({ entry, isLatest }: { entry: ChangelogEntry; isLatest: boolean }) {
  return (
    <Card className={isLatest ? "border-green-200 dark:border-green-800" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="text-sm font-mono font-semibold bg-green-50 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
              >
                {entry.version}
              </Badge>
              {isLatest && (
                <Badge className="bg-green-600 text-white">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Latest
                </Badge>
              )}
            </div>
            <CardTitle className="text-2xl mb-2">{entry.title}</CardTitle>
            {entry.description && (
              <CardDescription className="text-base">{entry.description}</CardDescription>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{entry.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>{entry.author}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {entry.changes.map((change, index) => (
            <div key={index}>
              {index > 0 && <Separator className="mb-6" />}
              <ChangelogSection change={change} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ChangelogSection({ change }: { change: ChangelogItem }) {
  return (
    <div>
      <div className="flex items-start gap-3 mb-3">
        <Badge
          variant="outline"
          className={`${getCategoryBadgeColor(change.category)} text-xs font-semibold`}
        >
          {getCategoryDisplayName(change.category)}
        </Badge>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {change.title}
          </h3>
          {change.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {change.description}
            </p>
          )}
        </div>
      </div>

      {change.items && change.items.length > 0 && (
        <ul className="space-y-2 ml-3">
          {change.items.map((item, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-1.5 shrink-0">•</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}