/**
 * Project Inspection Adapter
 *
 * Adapter for handling project-specific inspection operations.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { InspectionAdapter } from "../InspectionPageContainer";

export const projectAdapter: InspectionAdapter = {
  // Data fetching
  useGetBreakdown: (id: string) => {
    return useQuery(
      api.govtProjects.getProjectBreakdown,
      id ? { breakdownId: id as Id<"govtProjectBreakdowns"> } : "skip"
    );
  },

  useGetParent: (breakdown: any) => {
    return useQuery(
      api.projects.get,
      breakdown?.projectId ? { id: breakdown.projectId as Id<"projects"> } : "skip"
    );
  },

  useListInspections: (parentId: string) => {
    return useQuery(
      api.inspections.listInspectionsByProject,
      parentId ? { projectId: parentId as Id<"projects"> } : "skip"
    );
  },

  // Mutations
  useCreateInspection: () => {
    return useMutation(api.inspections.createInspection);
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
    return breakdown?.projectId;
  },

  getParentName: (parent: any) => {
    return parent?.particulars || "Project";
  },

  getBreakdownName: (breakdown: any) => {
    return breakdown?.projectTitle || breakdown?.projectName || "Inspections";
  },

  getImplementingOffice: (parent: any) => {
    return parent?.implementingOffice;
  },

  // Create inspection payload builder
  buildCreatePayload: (parent: any, formData: any) => {
    return {
      projectId: parent._id,
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
