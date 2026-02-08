"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { EntityType } from "@/convex/search/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  BarChart3,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Entity type display names
const ENTITY_TYPE_NAMES: Record<EntityType, string> = {
  project: "Projects",
  twentyPercentDF: "20% Development Fund",
  trustFund: "Trust Funds",
  specialEducationFund: "Special Education Funds",
  specialHealthFund: "Special Health Funds",
  department: "Departments",
  agency: "Agencies/Offices",
  user: "Users",
};

// Entity type icons/colors
const ENTITY_TYPE_STYLES: Record<
  EntityType,
  { color: string; bgColor: string }
> = {
  project: { color: "text-blue-600", bgColor: "bg-blue-50" },
  twentyPercentDF: { color: "text-emerald-600", bgColor: "bg-emerald-50" },
  trustFund: { color: "text-purple-600", bgColor: "bg-purple-50" },
  specialEducationFund: { color: "text-orange-600", bgColor: "bg-orange-50" },
  specialHealthFund: { color: "text-pink-600", bgColor: "bg-pink-50" },
  department: { color: "text-cyan-600", bgColor: "bg-cyan-50" },
  agency: { color: "text-indigo-600", bgColor: "bg-indigo-50" },
  user: { color: "text-slate-600", bgColor: "bg-slate-50" },
};

interface ReindexStats {
  entityType: EntityType;
  total: number;
  indexed: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}

export default function SearchAdminPage() {
  const [isReindexing, setIsReindexing] = useState(false);
  const [reindexingType, setReindexingType] = useState<EntityType | "all" | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [clearEntityType, setClearEntityType] = useState<EntityType | null>(null);
  const [lastReindexResult, setLastReindexResult] = useState<ReindexStats[] | null>(null);

  // Fetch index statistics
  const stats = useQuery(api.search.getIndexStats);

  // Mutations
  const reindexByType = useMutation(api.search.reindexByType);
  const reindexAll = useMutation(api.search.reindexAll);
  const clearIndex = useMutation(api.search.clearIndex);

  // Handle reindex all
  const handleReindexAll = useCallback(async () => {
    setIsReindexing(true);
    setReindexingType("all");
    try {
      const result = await reindexAll();
      setLastReindexResult(result);
      toast.success("Search index rebuilt successfully", {
        description: `Indexed ${result.reduce((acc, r) => acc + r.indexed, 0)} entities across ${result.length} types`,
      });
    } catch (error) {
      toast.error("Failed to rebuild search index", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsReindexing(false);
      setReindexingType(null);
    }
  }, [reindexAll]);

  // Handle reindex by type
  const handleReindexByType = useCallback(
    async (entityType: EntityType) => {
      setIsReindexing(true);
      setReindexingType(entityType);
      try {
        const result = await reindexByType({ entityType });
        setLastReindexResult([result]);
        toast.success(`${ENTITY_TYPE_NAMES[entityType]} reindexed`, {
          description: `Indexed ${result.indexed} of ${result.total} entities`,
        });
      } catch (error) {
        toast.error(`Failed to reindex ${ENTITY_TYPE_NAMES[entityType]}`, {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsReindexing(false);
        setReindexingType(null);
      }
    },
    [reindexByType]
  );

  // Handle clear index
  const handleClearIndex = useCallback(async () => {
    try {
      const result = await clearIndex({
        entityType: clearEntityType || undefined,
      });
      toast.success("Search index cleared", {
        description: `Removed ${result.deletedCount} index entries`,
      });
      setShowClearDialog(false);
      setClearEntityType(null);
    } catch (error) {
      toast.error("Failed to clear search index", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, [clearIndex, clearEntityType]);

  // Calculate overall health
  const overallHealth = stats?.overall.coverage || 0;
  const healthStatus =
    overallHealth >= 90 ? "healthy" : overallHealth >= 50 ? "warning" : "critical";

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Search className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Search Administration</h1>
            <p className="text-muted-foreground">
              Manage and maintain the search index for optimal search performance
            </p>
          </div>
        </div>
      </div>

      {/* Overall Health Card */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="size-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-lg">Index Health</CardTitle>
                <CardDescription>
                  Overall search index coverage across all entity types
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={
                healthStatus === "healthy"
                  ? "default"
                  : healthStatus === "warning"
                  ? "secondary"
                  : "destructive"
              }
              className="text-sm px-3 py-1"
            >
              {healthStatus === "healthy" && <CheckCircle2 className="size-3.5 mr-1" />}
              {healthStatus === "warning" && <AlertTriangle className="size-3.5 mr-1" />}
              {healthStatus === "critical" && <AlertTriangle className="size-3.5 mr-1" />}
              {healthStatus === "healthy"
                ? "Healthy"
                : healthStatus === "warning"
                ? "Warning"
                : "Critical"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {stats?.overall.totalIndexed.toLocaleString()} of{" "}
                {stats?.overall.totalEntities.toLocaleString()} entities indexed
              </span>
              <span className="font-medium">{overallHealth}%</span>
            </div>
            <Progress
              value={overallHealth}
              className={cn(
                "h-2",
                healthStatus === "healthy" && "bg-green-100",
                healthStatus === "warning" && "bg-yellow-100",
                healthStatus === "critical" && "bg-red-100"
              )}
            />

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                onClick={handleReindexAll}
                disabled={isReindexing}
                className="gap-2"
              >
                {isReindexing && reindexingType === "all" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
                Reindex All
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setClearEntityType(null);
                  setShowClearDialog(true);
                }}
                disabled={isReindexing}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                Clear Index
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Type Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Database className="size-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">Entity Statistics</CardTitle>
              <CardDescription>
                Search index coverage by entity type
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.byType &&
              (Object.entries(stats.byType) as [EntityType, {
                inDatabase: number;
                indexed: number;
                coverage: number;
              }][]).map(([type, typeStats]) => {
                const styles = ENTITY_TYPE_STYLES[type];
                const isReindexingThis = reindexingType === type;

                return (
                  <div
                    key={type}
                    className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    {/* Icon/Color indicator */}
                    <div
                      className={cn(
                        "w-3 h-12 rounded-full shrink-0",
                        styles.bgColor
                      )}
                    />

                    {/* Entity info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium truncate">
                          {ENTITY_TYPE_NAMES[type]}
                        </h4>
                        <span className="text-sm font-medium">
                          {typeStats.coverage}%
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {typeStats.indexed.toLocaleString()} indexed
                        </span>
                        <span>•</span>
                        <span>
                          {typeStats.inDatabase.toLocaleString()} total
                        </span>
                      </div>
                      <Progress
                        value={typeStats.coverage}
                        className="h-1.5 mt-2"
                      />
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReindexByType(type)}
                      disabled={isReindexing}
                      className="shrink-0 gap-2"
                    >
                      {isReindexingThis ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Reindex
                    </Button>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Last Reindex Results */}
      {lastReindexResult && lastReindexResult.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Last Reindex Results</CardTitle>
            <CardDescription>
              Summary of the most recent reindexing operation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lastReindexResult.map((result) => (
                <div
                  key={result.entityType}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-green-500" />
                    <span className="font-medium">
                      {ENTITY_TYPE_NAMES[result.entityType]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      {result.indexed} indexed
                    </span>
                    {result.skipped > 0 && (
                      <span className="text-yellow-600">
                        {result.skipped} skipped
                      </span>
                    )}
                    {result.errors > 0 && (
                      <span className="text-red-600">
                        {result.errors} errors
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear Index Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Clear Search Index
            </AlertDialogTitle>
            <AlertDialogDescription>
              {clearEntityType
                ? `This will remove all search index entries for ${ENTITY_TYPE_NAMES[clearEntityType]}. This action cannot be undone.`
                : "This will remove ALL search index entries. You will need to reindex to restore search functionality. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearIndex}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear Index
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
