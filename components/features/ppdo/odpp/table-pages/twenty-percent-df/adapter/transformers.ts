/**
 * Type Transformers for 20% Development Fund
 * 
 * Converts between 20% DF types and generic Project types
 */

import { Project, ProjectFormData } from "@/components/features/ppdo/odpp/table-pages/projects/types";
import { TwentyPercentDF, TwentyPercentDFFormData } from "../types";

/**
 * Transform TwentyPercentDF to generic Project
 */
export function toProject(twentyPercentDF: TwentyPercentDF): Project {
    return {
        id: twentyPercentDF.id,
        particulars: twentyPercentDF.particulars,
        implementingOffice: twentyPercentDF.implementingOffice,
        categoryId: twentyPercentDF.categoryId,
        departmentId: twentyPercentDF.departmentId,
        totalBudgetAllocated: twentyPercentDF.totalBudgetAllocated,
        obligatedBudget: twentyPercentDF.obligatedBudget,
        totalBudgetUtilized: twentyPercentDF.totalBudgetUtilized,
        utilizationRate: twentyPercentDF.utilizationRate,
        projectCompleted: twentyPercentDF.projectCompleted,
        projectDelayed: twentyPercentDF.projectDelayed,
        projectsOngoing: twentyPercentDF.projectsOngoing,
        remarks: twentyPercentDF.remarks,
        year: twentyPercentDF.year,
        status: twentyPercentDF.status,
        targetDateCompletion: twentyPercentDF.targetDateCompletion,
        isPinned: twentyPercentDF.isPinned,
        pinnedAt: twentyPercentDF.pinnedAt,
        pinnedBy: twentyPercentDF.pinnedBy,
        projectManagerId: twentyPercentDF.projectManagerId,
        _creationTime: twentyPercentDF._creationTime,
        autoCalculateBudgetUtilized: twentyPercentDF.autoCalculateBudgetUtilized,
        twentyPercentDFId: twentyPercentDF.id,
    };
}

/**
 * Transform array of TwentyPercentDF to array of Projects
 */
export function toProjects(twentyPercentDFs: TwentyPercentDF[]): Project[] {
    return twentyPercentDFs.map(toProject);
}

/**
 * Transform generic ProjectFormData to TwentyPercentDFFormData
 */
export function fromProjectFormData(
    formData: ProjectFormData
): TwentyPercentDFFormData {
    return {
        particulars: formData.particulars,
        implementingOffice: formData.implementingOffice,
        categoryId: formData.categoryId as any,
        departmentId: formData.departmentId as any,
        totalBudgetAllocated: formData.totalBudgetAllocated,
        obligatedBudget: formData.obligatedBudget,
        totalBudgetUtilized: formData.totalBudgetUtilized,
        remarks: formData.remarks,
        year: formData.year,
        targetDateCompletion: formData.targetDateCompletion,
        isPinned: formData.isPinned,
        pinnedAt: formData.pinnedAt,
        pinnedBy: formData.pinnedBy as any,
        projectManagerId: formData.projectManagerId as any,
        _creationTime: formData._creationTime,
        autoCalculateBudgetUtilized: formData.autoCalculateBudgetUtilized,
    };
}

/**
 * Transform TwentyPercentDFFormData to generic ProjectFormData
 */
export function toProjectFormData(
    formData: TwentyPercentDFFormData
): ProjectFormData {
    return {
        particulars: formData.particulars,
        implementingOffice: formData.implementingOffice,
        categoryId: formData.categoryId,
        departmentId: formData.departmentId,
        totalBudgetAllocated: formData.totalBudgetAllocated,
        obligatedBudget: formData.obligatedBudget,
        totalBudgetUtilized: formData.totalBudgetUtilized,
        remarks: formData.remarks,
        year: formData.year,
        targetDateCompletion: formData.targetDateCompletion,
        isPinned: formData.isPinned,
        pinnedAt: formData.pinnedAt,
        pinnedBy: formData.pinnedBy,
        projectManagerId: formData.projectManagerId,
        _creationTime: formData._creationTime,
        autoCalculateBudgetUtilized: formData.autoCalculateBudgetUtilized,
        twentyPercentDFId: undefined, // Will be set by caller if needed
    };
}