// app/dashboard/settings/user-management/components/UserFilters.tsx

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { UserFilters as UserFilterState } from "../hooks/useUserFilters";

interface UserFiltersProps {
  search: string;
  role: UserFilterState["role"];
  status: UserFilterState["status"];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserFilterState["role"]) => void;
  onStatusChange: (value: UserFilterState["status"]) => void;
}

export function UserFilters({
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
}: UserFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          type="text"
          placeholder="Search by name, email, or department..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Role Filter */}
      <Select value={role} onValueChange={onRoleChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="super_admin">Super Admin</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="inspector">Inspector</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="suspended">Suspended</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
