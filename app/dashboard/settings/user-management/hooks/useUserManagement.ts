// app/dashboard/settings/user-management/hooks/useUserManagement.ts

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";

export interface UserFormData {
  name: string;
  email: string;
  role: "super_admin" | "admin" | "user";
  departmentId?: Id<"departments">;
  position?: string;
  employeeId?: string;
  status: "active" | "inactive" | "suspended";
  suspensionReason?: string;
}

export function useUserManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const users = useQuery(api.auth.listAllUsers, {});
  const departments = useQuery(api.departments.list, {});

  // Mutations
  const createUserMutation = useMutation(api.auth.createUser);
  const updateUserRole = useMutation(api.auth.updateUserRole);
  const updateUserStatus = useMutation(api.auth.updateUserStatus);
  const updateUserDepartment = useMutation(api.auth.updateUserDepartment);
  const updateUserProfile = useMutation(api.auth.updateUserProfile);
  const deleteUserMutation = useMutation(api.auth.deleteUser);

  // Create user
  const handleCreateUser = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      
      await createUserMutation({
        name: data.name,
        email: data.email,
        role: data.role,
        departmentId: data.departmentId,
        position: data.position,
        employeeId: data.employeeId,
        status: data.status,
      });
      
      toast.success("User created successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update role
  const handleUpdateRole = async (
    userId: Id<"users">,
    newRole: "super_admin" | "admin" | "user"
  ) => {
    try {
      setIsSubmitting(true);
      await updateUserRole({ userId, newRole });
      
      toast.success("User role updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user role");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (
    userId: Id<"users">,
    newStatus: "active" | "inactive" | "suspended",
    reason?: string
  ) => {
    try {
      setIsSubmitting(true);
      await updateUserStatus({ userId, newStatus, reason });
      
      toast.success("User status updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user status");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update department
  const handleUpdateDepartment = async (
    userId: Id<"users">,
    departmentId?: Id<"departments">
  ) => {
    try {
      setIsSubmitting(true);
      await updateUserDepartment({ userId, departmentId });
      
      toast.success("User department updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user department");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk update user
  const handleUpdateUser = async (
    userId: Id<"users">,
    data: Partial<UserFormData>
  ) => {
    try {
      setIsSubmitting(true);
      
      // Update profile fields (name, position, employeeId)
      if (data.name || data.position || data.employeeId) {
        await updateUserProfile({
          userId,
          name: data.name,
          position: data.position,
          employeeId: data.employeeId,
        });
      }
      
      // Update role if provided
      if (data.role) {
        await updateUserRole({ userId, newRole: data.role });
      }
      
      // Update status if provided
      if (data.status) {
        await updateUserStatus({
          userId,
          newStatus: data.status,
          reason: data.suspensionReason,
        });
      }
      
      // Update department if provided
      if (data.departmentId !== undefined) {
        await updateUserDepartment({ userId, departmentId: data.departmentId });
      }
      
      toast.success("User updated successfully");
      
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: Id<"users">) => {
    try {
      setIsSubmitting(true);
      
      await deleteUserMutation({ userId });
      
      toast.success("User deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    users,
    departments,
    isLoading: users === undefined || departments === undefined,
    isSubmitting,
    createUser: handleCreateUser,
    updateRole: handleUpdateRole,
    updateStatus: handleUpdateStatus,
    updateDepartment: handleUpdateDepartment,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
  };
}