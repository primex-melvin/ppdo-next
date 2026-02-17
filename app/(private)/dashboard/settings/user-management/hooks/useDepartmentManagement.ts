// app/dashboard/settings/user-management/hooks/useDepartmentManagement.ts

import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";

export interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
  parentDepartmentId?: Id<"departments">;
  headUserId?: Id<"users">;
  email?: string;
  phone?: string;
  location?: string;
  isActive: boolean;
  displayOrder?: number;
}

export function useDepartmentManagement() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const departments = useQuery(api.implementingAgencies.list, { type: "internal" });

  // Mutations
  const createDepartmentMutation = useMutation(api.implementingAgencies.create);
  const updateDepartmentMutation = useMutation(api.implementingAgencies.update);
  const deleteDepartmentMutation = useMutation(api.implementingAgencies.remove);

  // Create department
  const handleCreateDepartment = async (data: DepartmentFormData) => {
    try {
      setIsSubmitting(true);

      await createDepartmentMutation({
        fullName: data.name,
        code: data.code,
        type: "internal",
        description: data.description,
        category: "Department",
      });

      toast.success("Department created successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to create department");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update department
  const handleUpdateDepartment = async (
    id: Id<"implementingAgencies">,
    data: DepartmentFormData
  ) => {
    try {
      setIsSubmitting(true);

      await updateDepartmentMutation({
        id,
        fullName: data.name,
        code: data.code,
        description: data.description,
      });

      toast.success("Department updated successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update department");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete department
  const handleDeleteDepartment = async (id: Id<"implementingAgencies">) => {
    try {
      setIsSubmitting(true);

      await deleteDepartmentMutation({ id });

      toast.success("Department deleted successfully");
      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to delete department");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    departments,
    isLoading: departments === undefined,
    isSubmitting,
    createDepartment: handleCreateDepartment,
    updateDepartment: handleUpdateDepartment,
    deleteDepartment: handleDeleteDepartment,
  };
}