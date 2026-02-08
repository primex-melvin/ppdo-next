/**
 * 20% Development Fund Inspection Adapter
 *
 * Adapter for handling 20% development fund-specific inspection operations.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { InspectionAdapter } from "../InspectionPageContainer";

export const twentyPercentDFAdapter: InspectionAdapter = {
  // Data fetching
  useGetBreakdown: (id: string) => {
    return useQuery(
      api.twentyPercentDFBreakdowns.getBreakdown,
      id ? { id: id as Id<"twentyPercentDFBreakdowns"> } : "skip"
    );
  },

  useGetParent: (breakdown: any) => {
    return useQuery(
      api.twentyPercentDF.get,
      breakdown?.twentyPercentDFId
        ? { id: breakdown.twentyPercentDFId as Id<"twentyPercentDF"> }
        : "skip"
    );
  },

  useListInspections: (parentId: string) => {
    return useQuery(
      api.inspections.listInspectionsByTwentyPercentDF,
      parentId ? { twentyPercentDFId: parentId as Id<"twentyPercentDF"> } : "skip"
    );
  },

  // Mutations
  useCreateInspection: () => {
    return useMutation(api.inspections.createInspectionForTwentyPercentDF);
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
    return breakdown?.twentyPercentDFId;
  },

  getParentName: (parent: any) => {
    return parent?.name || parent?.fundName || "20% Development Fund";
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
      twentyPercentDFId: parent._id,
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
