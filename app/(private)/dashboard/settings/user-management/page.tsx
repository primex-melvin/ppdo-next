// app/dashboard/settings/user-management/page.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserManagement } from "./hooks/useUserManagement";
import { useUserFilters } from "./hooks/useUserFilters";
import { useDepartmentManagement } from "./hooks/useDepartmentManagement";
import { UserModal } from "./components/UserModal";
import { UserDeleteDialog } from "./components/UserDeleteDialog";
import { DepartmentModal } from "./components/DepartmentModal";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Building2, KeyRound } from "lucide-react";
import { Id } from "../../../../../convex/_generated/dataModel";
import { formatDate, getInitials } from "@/lib/utils";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useAccentColor } from "../../../../../contexts/AccentColorContext";
import { UserFilters } from "./components/UserFilters";
import { UserRoleBadge } from "./components/UserRoleBadge";
import { UserActions } from "./components/UserActions";
import { UserStatusBadge } from "./components/UserStatusBadge";
import { User, UserFormData } from "@/types/user.types";

export default function UserManagementPage() {
  const router = useRouter();
  const { accentColorValue } = useAccentColor();
  const { user: currentUser, isAdmin, isSuperAdmin } = useCurrentUser();
  const {
    users,
    departments,
    isLoading,
    isSubmitting,
    createUser,
    updateUser,
    updateStatus,
    deleteUser,
  } = useUserManagement();
  const {
    departments: allDepartments,
    isSubmitting: isDepartmentSubmitting,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartmentManagement();
  const { filters, filteredUsers, updateFilter } = useUserFilters(users);

  // Get pending password reset requests count
  const pendingResets = useQuery(
    api.passwordReset.getAllPasswordResetRequests,
    { status: "pending" }
  );
  const pendingCount = pendingResets?.length || 0;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Handlers
  const handleAddUser = () => {
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const handleModalSubmit = async (data: Partial<UserFormData>) => {
    if (selectedUser) {
      // Updating existing user
      return await updateUser(selectedUser._id as Id<"users">, data);
    } else {
      // Creating new user
      return await createUser(data as UserFormData);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    const success = await deleteUser(selectedUser._id as Id<"users">);

    if (success) {
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleUpdateStatus = async (
    user: User,
    newStatus: "active" | "inactive" | "suspended"
  ) => {
    let reason: string | null | undefined;

    if (newStatus === "suspended") {
      reason = prompt("Please provide a reason for suspension:");
      if (!reason) return;
    }

    await updateStatus(user._id as Id<"users">, newStatus, reason ?? undefined);
  };

  const handlePasswordResetManagement = () => {
    router.push("/dashboard/settings/user-management/password-reset-management");
  };

  // Authorization check
  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Access Denied
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
              style={{ fontFamily: "var(--font-cinzel), serif" }}
            >
              User Management
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage system users and access permissions
            </p>
          </div>
          <div className="flex gap-2">
            {/* Manage Departments Button - Only for Super Admin */}
            {isSuperAdmin && (
              <Button
                onClick={() => setShowDepartmentModal(true)}
                variant="outline"
                className="border-zinc-300 dark:border-zinc-700"
              >
                <Building2 className="mr-2 h-4 w-4" />
                Manage Departments
              </Button>
            )}

            {/* Password Reset Management Button - Only for Admin and Super Admin */}
            {(isAdmin || isSuperAdmin) && (
              <Button
                onClick={handlePasswordResetManagement}
                variant="outline"
                className="border-zinc-300 dark:border-zinc-700 relative"
              >
                <KeyRound className="mr-2 h-4 w-4" />
                Reset Requests
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-semibold animate-pulse">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Button>
            )}

            {/* Add User Button */}
            <Button
              onClick={handleAddUser}
              style={{ backgroundColor: accentColorValue }}
              className="text-white hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 mb-6">
        <UserFilters
          search={filters.search}
          role={filters.role}
          status={filters.status}
          onSearchChange={(value) => updateFilter("search", value)}
          onRoleChange={(value: any) => updateFilter("role", value)}
          onStatusChange={(value: any) => updateFilter("status", value)}
          accentColor={accentColorValue}
        />
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Department
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Last Login
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                          style={{ backgroundColor: accentColorValue }}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {user.name || "Unnamed User"}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <UserRoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {user.departmentName || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(user.lastLogin)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <UserActions
                        user={user}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        onUpdateStatus={handleUpdateStatus}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No users found matching your search.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)}{" "}
              of {filteredUsers.length} users
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        onSubmit={handleModalSubmit}
        user={selectedUser}
        departments={departments}
        isSubmitting={isSubmitting}
        currentUserRole={currentUser?.role}
      />

      <UserDeleteDialog
        open={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDeleteConfirm}
        user={selectedUser}
        isDeleting={isSubmitting}
      />

      <DepartmentModal
        open={showDepartmentModal}
        onClose={() => setShowDepartmentModal(false)}
        departments={allDepartments}
        users={users}
        onCreate={createDepartment}
        onUpdate={updateDepartment}
        onDelete={deleteDepartment}
        isSubmitting={isDepartmentSubmitting}
        accentColor={accentColorValue}
      />
    </>
  );
}