"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { Search, FileText, Building2, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function GlobalSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    const results = useQuery(
        api.dashboard.searchAutocomplete,
        query.length >= 2
            ? {
                query,
                types: ["departments", "offices", "projects", "budgets"],
                limit: 20,
            }
            : "skip"
    );

    // Safety: Ensure results is an array or default to empty
    const items = results || [];
    const projectResults = items.filter((r: any) => r.type === "project");
    const departmentResults = items.filter((r: any) => r.type === "department");
    const budgetResults = items.filter((r: any) => r.type === "budget");
    const officeResults = items.filter((r: any) => r.type === "office");

    // Keyboard shortcut
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const handleSelect = (item: any) => {
        setOpen(false);
        // TODO: Navigate or apply filter based on item type
        console.log("Selected:", item);
    };

    return (
        <>
            <Button
                variant="outline"
                className="w-full sm:w-[300px] justify-start text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                <span>Search...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search projects, budgets, departments..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>

                    {projectResults.length > 0 && (
                        <CommandGroup heading="Projects">
                            {projectResults.map((item: any) => (
                                <CommandItem
                                    key={item.id}
                                    onSelect={() => handleSelect(item)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.subtitle}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {departmentResults.length > 0 && (
                        <CommandGroup heading="Departments">
                            {departmentResults.map((item: any) => (
                                <CommandItem
                                    key={item.id}
                                    onSelect={() => handleSelect(item)}
                                >
                                    <Building2 className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.subtitle}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {officeResults.length > 0 && (
                        <CommandGroup heading="Offices">
                            {officeResults.map((item: any) => (
                                <CommandItem
                                    key={item.id}
                                    onSelect={() => handleSelect(item)}
                                >
                                    <Building2 className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.subtitle}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {budgetResults.length > 0 && (
                        <CommandGroup heading="Budgets">
                            {budgetResults.map((item: any) => (
                                <CommandItem
                                    key={item.id}
                                    onSelect={() => handleSelect(item)}
                                >
                                    <FolderOpen className="mr-2 h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {item.subtitle}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}