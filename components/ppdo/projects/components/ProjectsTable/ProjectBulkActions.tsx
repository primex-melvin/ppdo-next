
"use client";

import { Layers } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { ProjectCategoryCombobox } from "../ProjectCategoryCombobox";

interface ProjectBulkActionsProps {
    selectedCount: number;
    onCategoryChange: (categoryId: Id<"projectCategories"> | undefined) => void;
}

/**
 * Bulk actions menu for selected projects
 * Currently handles category changes
 */
export function ProjectBulkActions({
    selectedCount,
    onCategoryChange,
}: ProjectBulkActionsProps) {
    const allCategories = useQuery(api.projectCategories.list, {});

    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="h-9 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 data-[state=open]:bg-blue-100 border border-blue-200 dark:border-blue-800">
                        <Layers className="w-4 h-4 mr-2" />
                        Category
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="w-[300px] p-4 gap-4 flex flex-col bg-white dark:bg-zinc-950">
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-100">
                                    Selected Projects by Category
                                </h4>

                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                        <span>{selectedCount} project(s) selected</span>
                                    </div>
                                </div>

                                <Separator className="my-2" />

                                <p className="text-xs text-zinc-500">
                                    Select a new category to move all selected projects:
                                </p>

                                <div className="no-click relative z-50">
                                    <ProjectCategoryCombobox
                                        value={undefined}
                                        onChange={(val) => onCategoryChange(val as Id<"projectCategories">)}
                                        hideInfoText={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
