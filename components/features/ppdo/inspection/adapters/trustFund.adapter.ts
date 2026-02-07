/**
 * Trust Fund Inspection Adapter
 *
 * Adapter for handling trust fund-specific inspection operations.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { InspectionAdapter } from "../InspectionPageContainer";

export const trustFundAdapter: InspectionAdapter = {
  // Data fetching
  useGetBreakdown: (id: string) => {
    return useQuery(
      api.trustFundBreakdowns.getBreakdown,
      id ? { id: id as Id<"trustFundBreakdowns"> } : "skip"
    );
  },

  useGetParent: (breakdown: any) => {
    return useQuery(
      api.trustFunds.get,
      breakdown?.trustFundId ? { id: breakdown.trustFundId as Id<"trustFunds"> } : "skip"
    );
  },

  useListInspections: (parentId: string) => {
    return useQuery(
      api.inspections.listInspectionsByTrustFund,
      parentId ? { trustFundId: parentId as Id<"trustFunds"> } : "skip"
    );
  },

  // Mutations
  useCreateInspection: () => {
    return useMutation(api.inspections.createInspectionForTrustFund);
  },

  useUpdateInspection: () => {
    return useMutation(api.inspections.updateInspection);
  },

  useDeleteInspection: () => {
    return useMutation(api.inspections.deleteInspection);
  },

  useIncrementViewCount: () => {
    return useMutation(api.inspections.incrementViewCount);
  },

  // Data transformers
  getParentId: (breakdown: any) => {
    return breakdown?.trustFundId;
  },

  getParentName: (parent: any) => {
    return parent?.name || parent?.trustFundName || "Trust Fund";
  },

  getBreakdownName: (breakdown: any) => {
    return breakdown?.particulars || breakdown?.description || "Inspections";
  },

  getImplementingOffice: (parent: any) => {
    return parent?.implementingOffice;
  },

  // Create inspection payload builder
  buildCreatePayload: (parent: any, formData: any) => {
    return {
      trustFundId: parent._id,
      programNumber: formData.programNumber,
      title: formData.title,
      category: formData.category,
      inspectionDateTime: new Date(formData.date).getTime(),
      remarks: formData.remarks || "",
      status: "pending" as const,
      uploadSessionId: formData.uploadSessionId,
    };
  },
};
