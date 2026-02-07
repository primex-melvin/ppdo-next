/**
 * Special Education Fund Inspection Adapter
 *
 * Adapter for handling special education fund-specific inspection operations.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { InspectionAdapter } from "../InspectionPageContainer";

export const specialEducationFundAdapter: InspectionAdapter = {
  // Data fetching
  useGetBreakdown: (id: string) => {
    return useQuery(
      api.specialEducationFundBreakdowns.getBreakdown,
      id ? { id: id as Id<"specialEducationFundBreakdowns"> } : "skip"
    );
  },

  useGetParent: (breakdown: any) => {
    return useQuery(
      api.specialEducationFunds.get,
      breakdown?.specialEducationFundId
        ? { id: breakdown.specialEducationFundId as Id<"specialEducationFunds"> }
        : "skip"
    );
  },

  useListInspections: (parentId: string) => {
    return useQuery(
      api.inspections.listInspectionsBySpecialEducationFund,
      parentId ? { specialEducationFundId: parentId as Id<"specialEducationFunds"> } : "skip"
    );
  },

  // Mutations
  useCreateInspection: () => {
    return useMutation(api.inspections.createInspectionForSpecialEducationFund);
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
    return breakdown?.specialEducationFundId;
  },

  getParentName: (parent: any) => {
    return parent?.name || parent?.fundName || "Special Education Fund";
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
      specialEducationFundId: parent._id,
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
