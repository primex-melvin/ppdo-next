// app/dashboard/settings/user-management/components/DepartmentModal.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Id } from "../../../../../../convex/_generated/dataModel";
import { Loader2, Pencil, Trash2, Plus, Building2 } from "lucide-react";
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

interface Department {
  _id: string;
  fullName: string;
  code: string;
  description?: string;
  parentAgencyId?: string;
  headUserId?: string;
  headUserName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string | null;
  isActive: boolean;
  displayOrder?: number;
  userCount?: number;
}

interface User {
  _id: string;
  name?: string;
  email?: string;
}

interface DepartmentFormData {
  name: string;
  code: string;
  description?: string;
  parentAgencyId?: Id<"implementingAgencies">;
  headUserId?: Id<"users">;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  location?: string;  // Alias for address, backward compatibility
  isActive: boolean;
  displayOrder?: number;
}

interface DepartmentModalProps {
  open: boolean;
  onClose: () => void;
  departments?: Department[];
  users?: User[];
  onCreate: (data: DepartmentFormData) => Promise<boolean>;
  onUpdate: (id: Id<"implementingAgencies">, data: DepartmentFormData) => Promise<boolean>;
  onDelete: (id: Id<"implementingAgencies">) => Promise<boolean>;
  isSubmitting?: boolean;
  accentColor: string;
}

export function DepartmentModal({
  open,
  onClose,
  departments = [],
  users = [],
  onCreate,
  onUpdate,
  onDelete,
  isSubmitting = false,
  accentColor,
}: DepartmentModalProps) {
  const [view, setView] = useState<"list" | "form">("list");
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState<Department | null>(null);

  const [formData, setFormData] = useState<DepartmentFormData>({
    name: "",
    code: "",
    description: "",
    parentAgencyId: undefined,
    headUserId: undefined,
    contactEmail: "",
    contactPhone: "",
    address: "",
    isActive: true,
    displayOrder: undefined,
  });

  useEffect(() => {
    if (!open) {
      setView("list");
      setSelectedDepartment(null);
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      parentAgencyId: undefined,
      headUserId: undefined,
      contactEmail: "",
      contactPhone: "",
      address: "",
      isActive: true,
      displayOrder: undefined,
    });
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.fullName,
      code: department.code,
      description: department.description || "",
      parentAgencyId: department.parentAgencyId as Id<"implementingAgencies"> | undefined,
      headUserId: department.headUserId as Id<"users"> | undefined,
      contactEmail: department.contactEmail || "",
      contactPhone: department.contactPhone || "",
      address: department.address || "",
      isActive: department.isActive,
      displayOrder: department.displayOrder,
    });
    setView("form");
  };

  const handleAdd = () => {
    setSelectedDepartment(null);
    resetForm();
    setView("form");
  };

  const handleDeleteClick = (department: Department) => {
    setDepartmentToDelete(department);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!departmentToDelete) return;

    const success = await onDelete(departmentToDelete._id as Id<"implementingAgencies">);

    if (success) {
      setShowDeleteDialog(false);
      setDepartmentToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let success = false;

    if (selectedDepartment) {
      success = await onUpdate(selectedDepartment._id as Id<"implementingAgencies">, formData);
    } else {
      success = await onCreate(formData);
    }

    if (success) {
      setView("list");
      setSelectedDepartment(null);
      resetForm();
    }
  };

  const handleCancel = () => {
    setView("list");
    setSelectedDepartment(null);
    resetForm();
  };

  const updateField = <K extends keyof DepartmentFormData>(
    key: K,
    value: DepartmentFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" style={{ color: accentColor }} />
              {view === "list" ? "Manage Departments" : selectedDepartment ? "Edit Department" : "Add New Department"}
            </DialogTitle>
            <DialogDescription>
              {view === "list"
                ? "View, create, edit, or delete organizational departments."
                : selectedDepartment
                  ? "Update department information and settings."
                  : "Create a new department with organizational details."}
            </DialogDescription>
          </DialogHeader>

          {view === "list" ? (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="mb-4">
                <Button
                  onClick={handleAdd}
                  style={{ backgroundColor: accentColor }}
                  className="text-white hover:opacity-90 w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
                {departments.length > 0 ? (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {departments.map((dept) => (
                      <div
                        key={dept._id}
                        className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                {dept.fullName}
                              </h4>
                              <span className="text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                {dept.code}
                              </span>
                              {!dept.isActive && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400">
                                  Inactive
                                </span>
                              )}
                            </div>

                            {dept.description && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2 line-clamp-2">
                                {dept.description}
                              </p>
                            )}

                            <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-500">
                              {dept.headUserName && (
                                <span>Head: {dept.headUserName}</span>
                              )}
                              {dept.address && (
                                <span>📍 {dept.address}</span>
                              )}
                              {dept.userCount !== undefined && (
                                <span>👥 {dept.userCount} users</span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(dept)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(dept)}
                              className="h-8 w-8 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-zinc-400" />
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No departments yet. Create your first department.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="space-y-4 pb-4">
                {/* Name and Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      placeholder="e.g., Finance Department"
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Department Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => updateField("code", e.target.value.toUpperCase())}
                      placeholder="e.g., FIN"
                      required
                      disabled={isSubmitting}
                      maxLength={10}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Brief description of department responsibilities..."
                    rows={3}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Parent Department and Head User */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentDepartment">Parent Department</Label>
                    <Select
                      value={formData.parentAgencyId || "none"}
                      onValueChange={(value) =>
                        updateField(
                          "parentAgencyId",
                          value === "none" ? undefined : (value as Id<"implementingAgencies">)
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Parent</SelectItem>
                        {departments
                          .filter((d) => d._id !== selectedDepartment?._id)
                          .map((dept) => (
                            <SelectItem key={dept._id} value={dept._id}>
                              {dept.fullName} ({dept.code})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headUser">Department Head</Label>
                    <Select
                      value={formData.headUserId || "none"}
                      onValueChange={(value) =>
                        updateField(
                          "headUserId",
                          value === "none" ? undefined : (value as Id<"users">)
                        )
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select head" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Head</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => updateField("contactEmail", e.target.value)}
                      placeholder="department@tarlac.gov.ph"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.contactPhone}
                      onChange={(e) => updateField("contactPhone", e.target.value)}
                      placeholder="+63 XXX XXX XXXX"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.address}
                    onChange={(e) => updateField("address", e.target.value)}
                    placeholder="e.g., Building A, 3rd Floor"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Display Order and Active Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Display Order</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder || ""}
                      onChange={(e) =>
                        updateField(
                          "displayOrder",
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      placeholder="e.g., 1"
                      disabled={isSubmitting}
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                    <div className="flex items-center space-x-2 h-10">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => updateField("isActive", checked)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor="isActive" className="cursor-pointer">
                        {formData.isActive ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  style={{ backgroundColor: accentColor }}
                  className="text-white hover:opacity-90"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : selectedDepartment ? (
                    "Save Changes"
                  ) : (
                    "Create Department"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{departmentToDelete?.fullName}</span>? This
              action cannot be undone.
              {departmentToDelete?.userCount && departmentToDelete.userCount > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400">
                  Warning: This department has {departmentToDelete.userCount} user(s).
                  You must reassign them first.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Department"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}