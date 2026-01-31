// app/dashboard/settings/user-management/password-reset-management/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Clock, CheckCircle2, XCircle, AlertCircle, Key, RefreshCw, Copy, Eye, EyeOff } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

type RequestStatus = "pending" | "approved" | "rejected";

export default function PasswordResetManagementPage() {
  const { user: currentUser, isAdmin, isSuperAdmin } = useCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all password reset requests
  const allRequests = useQuery(
    api.passwordReset.getAllPasswordResetRequests,
    statusFilter !== "all" ? { status: statusFilter as RequestStatus } : {}
  );

  const updateStatus = useMutation(api.passwordResetManagement.updateRequestStatus);
  const setPassword = useMutation(api.passwordResetManagement.setNewPassword);

  // Authorization check
  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Access Denied
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            You don't have permission to access password reset management.
          </p>
        </div>
      </div>
    );
  }

  // Generate strong 8-character password
  const generateStrongPassword = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    // Ensure at least one character from each category
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining 4 characters randomly
    for (let i = 0; i < 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setNewPassword(password);
    toast.success("Strong password generated!");
  };

  // Copy password to clipboard
  const copyPasswordToClipboard = () => {
    if (!newPassword) return;
    
    navigator.clipboard.writeText(newPassword).then(() => {
      toast.success("Password copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy password");
    });
  };

  // Filter requests based on search
  const filteredRequests = allRequests?.filter((request) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.email.toLowerCase().includes(searchLower) ||
      request.userName?.toLowerCase().includes(searchLower) ||
      request.ipAddress.toLowerCase().includes(searchLower)
    );
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100 dark:bg-yellow-950",
        text: "text-yellow-700 dark:text-yellow-400",
        icon: Clock,
      },
      approved: {
        bg: "bg-green-100 dark:bg-green-950",
        text: "text-green-700 dark:text-green-400",
        icon: CheckCircle2,
      },
      rejected: {
        bg: "bg-red-100 dark:bg-red-950",
        text: "text-red-700 dark:text-red-400",
        icon: XCircle,
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Handle approve/reject
  const handleAction = async (request: any, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
    setShowPassword(false);
    
    // If approving, auto-generate a strong password by default
    if (action === "approve") {
      generateStrongPasswordSilent();
      toast.success("Strong password auto-generated! You can copy or regenerate it.");
    } else {
      setNewPassword("");
    }
    
    setShowModal(true);
  };

  // Generate password without showing toast (for auto-generation)
  const generateStrongPasswordSilent = () => {
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = "";
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = 0; i < 4; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setNewPassword(password);
  };

  // Validate password strength
  const validatePassword = (password: string): { isValid: boolean; message: string } => {
    if (!password) {
      return { isValid: false, message: "Password is required" };
    }
    
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters long" };
    }
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*]/.test(password);
    
    if (!hasUppercase) {
      return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    
    if (!hasLowercase) {
      return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }
    
    if (!hasNumber) {
      return { isValid: false, message: "Password must contain at least one number" };
    }
    
    if (!hasSymbol) {
      return { isValid: false, message: "Password must contain at least one symbol (!@#$%^&*)" };
    }
    
    return { isValid: true, message: "Password is strong" };
  };

  const handleSubmitAction = async () => {
    if (!selectedRequest || !actionType) return;

    // If approving, validate password
    if (actionType === "approve") {
      const validation = validatePassword(newPassword);
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (actionType === "approve") {
        // Set the new password
        await setPassword({
          requestId: selectedRequest._id as Id<"passwordResetRequests">,
          newPassword: newPassword,
        });

        toast.success(
          "Password reset completed successfully! The new password has been set.",
          { duration: 5000 }
        );
      } else {
        // Reject the request
        await updateStatus({
          requestId: selectedRequest._id as Id<"passwordResetRequests">,
          status: "rejected",
        });

        toast.success("Password reset request rejected successfully");
      }

      setShowModal(false);
      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
      setNewPassword("");
      setShowPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to process request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!allRequests) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  // Get password strength indicator
  const getPasswordStrength = (password: string): { level: number; color: string; text: string } => {
    if (!password) return { level: 0, color: "bg-zinc-200 dark:bg-zinc-800", text: "" };
    
    const validation = validatePassword(password);
    if (!validation.isValid) {
      return { level: 1, color: "bg-red-500", text: "Weak" };
    }
    
    if (password.length >= 12) {
      return { level: 3, color: "bg-green-500", text: "Strong" };
    }
    
    return { level: 2, color: "bg-yellow-500", text: "Medium" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <h1
          className="text-3xl sm:text-4xl font-semibold text-zinc-900 dark:text-zinc-100 mb-1"
          style={{ fontFamily: "var(--font-cinzel), serif" }}
        >
          Password Reset Management
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Review and manage password reset requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Pending</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {allRequests.filter((r) => r.status === "pending").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-950 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Approved</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {allRequests.filter((r) => r.status === "approved").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Rejected</p>
              <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                {allRequests.filter((r) => r.status === "rejected").length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Search by email, name, or IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full h-10 px-3 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-sm text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Request Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Requested
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRequests && filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr
                    key={request._id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {request.userName || "Unknown"}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {request.email}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          IP: {request.ipAddress}
                        </p>
                        {request.message && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-500 italic line-clamp-2">
                            "{request.message}"
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        {formatDate(request.requestedAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request, "approve")}
                            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
                          >
                            <Key className="w-3 h-3 mr-1" />
                            Set Password
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(request, "reject")}
                            className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {request.reviewedByName && (
                            <p>By: {request.reviewedByName}</p>
                          )}
                          {request.reviewedAt && (
                            <p>{formatDate(request.reviewedAt)}</p>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      No password reset requests found.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {showModal && selectedRequest && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking the backdrop
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setSelectedRequest(null);
              setActionType(null);
              setAdminNotes("");
              setNewPassword("");
              setShowPassword(false);
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                {actionType === "approve" ? (
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                    <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {actionType === "approve" ? "Set New Password" : "Reject Request"}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedRequest.email}
                  </p>
                </div>
              </div>
              {actionType === "approve" ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Set a new password for this user. You can generate a strong password or enter your own.
                </p>
              ) : (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Reject password reset request for {selectedRequest.email}?
                </p>
              )}
            </div>

            {actionType === "approve" && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    New Password *
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={generateStrongPassword}
                    className="text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Generate Strong Password
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                    className="pr-20 bg-zinc-50 dark:bg-zinc-950"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={copyPasswordToClipboard}
                      disabled={!newPassword}
                      className="h-7 w-7 p-0"
                      title="Copy password to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      className="h-7 w-7 p-0"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.level / 3) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {passwordStrength.text}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Password must contain: uppercase, lowercase, number, and symbol (!@#$%^&*)
                    </p>
                  </div>
                )}
                
                {/* Security Notice */}
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 dark:text-blue-300">
                      <p className="font-medium mb-1">Security Notice:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>A strong password has been auto-generated for security</li>
                        <li>You can show/hide or copy the password using the buttons</li>
                        <li>You can regenerate or manually enter a different password if needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRequest(null);
                  setActionType(null);
                  setAdminNotes("");
                  setNewPassword("");
                  setShowPassword(false);
                }}
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAction}
                className={`flex-1 ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                }`}
                disabled={isSubmitting || (actionType === "approve" && !newPassword)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {actionType === "approve" ? (
                      <>
                        <Key className="w-4 h-4 mr-2" />
                        Set Password
                      </>
                    ) : (
                      "Reject Request"
                    )}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}