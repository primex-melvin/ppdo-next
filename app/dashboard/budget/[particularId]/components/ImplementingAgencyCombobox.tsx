"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useDebounce } from "@/app/hooks/use-debounce";

interface ImplementingAgencyComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

const ITEMS_PER_PAGE = 20;

export function ImplementingAgencyCombobox({
  value,
  onChange,
  disabled,
  error,
}: ImplementingAgencyComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [displayedCount, setDisplayedCount] = React.useState(ITEMS_PER_PAGE);

  // Debounce search query for validation
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch all implementing agencies
  const allAgencies = useQuery(api.implementingAgencies.list, {
    includeInactive: false,
  });

  // Check if code is available (for validation)
  const isCodeAvailable = useQuery(
    api.implementingAgencies.isCodeAvailable,
    debouncedSearch && debouncedSearch.length > 0
      ? { code: debouncedSearch.toUpperCase() }
      : "skip"
  );

  // Create mutation
  const createAgency = useMutation(api.implementingAgencies.create);

  // Filter agencies based on search
  const filteredAgencies = React.useMemo(() => {
    if (!allAgencies) return [];

    if (!searchQuery) return allAgencies;

    const query = searchQuery.toLowerCase();
    return allAgencies.filter(
      (a) =>
        a.code.toLowerCase().includes(query) ||
        a.fullName.toLowerCase().includes(query) ||
        (a.category && a.category.toLowerCase().includes(query))
    );
  }, [allAgencies, searchQuery]);

  // Display only a subset for performance
  const displayedAgencies = filteredAgencies.slice(0, displayedCount);
  const hasMore = displayedCount < filteredAgencies.length;

  // Get selected agency details
  const selectedAgency = React.useMemo(() => {
    return allAgencies?.find((a) => a.code === value);
  }, [allAgencies, value]);

  // Validate if search query can be a new code
  const canCreateNew = React.useMemo(() => {
    if (!searchQuery || searchQuery.length === 0) return false;

    const upperSearch = searchQuery.toUpperCase();

    // Check format (uppercase alphanumeric, spaces, and underscores only)
    const validFormat = /^[A-Z0-9_ ]+$/.test(upperSearch);
    if (!validFormat) return false;

    // Check if already exists in list
    const exists = allAgencies?.some(
      (a) => a.code.toUpperCase() === upperSearch
    );
    if (exists) return false;

    return true;
  }, [searchQuery, allAgencies]);

  // Handle creating new agency
  const handleCreateNew = async () => {
    if (!canCreateNew) return;
    const code = searchQuery.toUpperCase();

    try {
      setIsCreating(true);
      // Create with code as both code and full name initially
      await createAgency({
        code,
        fullName: code, // User can edit this later in admin panel
        type: "external", // Default to external, user can change later
        description: `Custom implementing agency: ${code}`,
        category: "Custom",
      });

      toast.success("Implementing agency created!", {
        description: `"${code}" has been added. You can edit details in Settings.`,
      });

      // Select the newly created item
      onChange(code);
      setSearchQuery("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating agency:", error);
      toast.error("Failed to create implementing agency", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Load more items
  const loadMore = () => {
    setDisplayedCount((prev) => prev + ITEMS_PER_PAGE);
  };

  // Handle select
  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue);
    setOpen(false);
    setSearchQuery("");
    setDisplayedCount(ITEMS_PER_PAGE);
  };

  // Reset display count when search changes
  React.useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100",
              !value && "text-zinc-500 dark:text-zinc-400",
              error && "border-red-500 dark:border-red-500"
            )}
          >
            {value ? (
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {value}
                </span>
                {selectedAgency && (
                  <span className="text-sm truncate">
                    {selectedAgency.fullName}
                  </span>
                )}
              </span>
            ) : (
              "Select implementing agency..."
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search implementing agencies..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {allAgencies === undefined ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  <span className="ml-2 text-sm text-zinc-500">Loading...</span>
                </div>
              ) : filteredAgencies.length === 0 ? (
                <CommandEmpty>
                  <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                    <AlertCircle className="h-8 w-8 text-zinc-400 mb-2" />
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      No agencies found
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Try a different search term or create a new one
                    </p>
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  <CommandGroup>
                    {displayedAgencies.map((agency) => (
                      <CommandItem
                        key={agency._id}
                        value={agency.code}
                        onSelect={() => handleSelect(agency.code)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === agency.code
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded shrink-0">
                            {agency.code}
                          </span>
                          <span className="text-sm truncate flex-1">
                            {agency.fullName}
                          </span>
                          {agency.type && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                              ({agency.type === "department" ? "Dept" : "Ext"})
                            </span>
                          )}
                          {((agency as any).usageCount !== undefined && (agency as any).usageCount > 0) && (
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                              ({(agency as any).usageCount})
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  {hasMore && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={loadMore}
                      >
                        Load more ({filteredAgencies.length - displayedCount}{" "}
                        remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* Create New Section */}
              {searchQuery.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    {canCreateNew && isCodeAvailable ? (
                      <CommandItem
                        onSelect={handleCreateNew}
                        disabled={isCreating}
                        className="cursor-pointer bg-blue-50 dark:bg-blue-950/20 aria-selected:bg-blue-100 dark:aria-selected:bg-blue-950/40"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            <span className="text-sm">Creating...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            <div className="flex flex-col flex-1">
                              <span className="text-sm font-medium">
                                Create "{searchQuery.toUpperCase()}"
                              </span>
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                Add as new implementing agency
                              </span>
                            </div>
                          </>
                        )}
                      </CommandItem>
                    ) : (
                      !canCreateNew && (
                        <div className="px-2 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                          {!/^[A-Z0-9_ ]+$/.test(searchQuery.toUpperCase()) ? (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">Invalid format</p>
                                <p className="mt-0.5">
                                  Code must contain only uppercase letters, numbers,
                                  spaces, and underscores
                                </p>
                              </div>
                            </div>
                          ) : allAgencies?.some(
                              (a) => a.code.toUpperCase() === searchQuery.toUpperCase()
                            ) ? (
                            <div className="flex items-start gap-2">
                              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium">Already exists</p>
                                <p className="mt-0.5">
                                  This agency is already in the list above
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )
                    )}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected agency info */}
      {selectedAgency && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
          <span className="font-medium">Type:</span>
          <span>{selectedAgency.type === "department" ? "Department" : "External Agency"}</span>
          {selectedAgency.category && (
            <>
              <span className="mx-1">•</span>
              <span>{selectedAgency.category}</span>
            </>
          )}
          {((selectedAgency as any).usageCount !== undefined && (selectedAgency as any).usageCount > 0) && (
            <>
              <span className="mx-1">•</span>
              <span>Used in {(selectedAgency as any).usageCount} project(s)</span>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}