import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    Command,
    CommandInput,
    CommandList,
    CommandItem,
    CommandGroup,
    CommandEmpty
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronDown } from "lucide-react";

export function DepartmentMultiSelect({ value, onChange }: { value: string[], onChange: (value: string[]) => void }) {
    const [open, setOpen] = useState(false);
    const hierarchy = useQuery(api.dashboard.getDepartmentHierarchy, {});

    const toggleDept = (deptId: string) => {
        const newValue = value.includes(deptId)
            ? value.filter((id) => id !== deptId)
            : [...value, deptId];
        onChange(newValue);
    };

    const isSelected = (deptId: string) => value.includes(deptId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="justify-between min-w-[200px]">
                    <div className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        <span>Departments</span>
                        {value.length > 0 && (
                            <Badge variant="secondary" className="ml-2 px-1 text-[10px] h-4">
                                {value.length}
                            </Badge>
                        )}
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search departments..." />
                    <CommandList>
                        <CommandEmpty>No department found.</CommandEmpty>
                        {hierarchy?.map(dept => (
                            <CommandGroup key={dept.id} heading={dept.name}>
                                <CommandItem
                                    onSelect={() => toggleDept(dept.id)}
                                    className="cursor-pointer"
                                    value={dept.name} // Important for search
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <Checkbox
                                            checked={isSelected(dept.id)}
                                            onCheckedChange={() => toggleDept(dept.id)}
                                        />
                                        <span className="font-medium">{dept.name}</span>
                                        <span className="ml-auto text-xs text-muted-foreground font-mono">{dept.code}</span>
                                    </div>
                                </CommandItem>
                                {dept.offices?.map(office => (
                                    <CommandItem
                                        key={office.id}
                                        className="ml-4 opacity-70"
                                        onSelect={() => {/* Future: add office selection logic */ }}
                                        value={`${dept.name} ${office.name}`} // Improved search
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="size-4" /> {/* Spacer for checkbox alignment */}
                                            <span className="text-xs">{office.name}</span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
