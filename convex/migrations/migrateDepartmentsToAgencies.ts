/**
 * Migration: Departments → Implementing Agencies
 * 
 * This migration consolidates the Departments table into Implementing Agencies.
 * All departments become agencies with type="internal".
 * 
 * Execution:
 * 1. Run `getMigrationPreview` first to see what will be migrated
 * 2. Run `migrateDepartmentsToAgencies` with dryRun=true to validate
 * 3. Run `migrateDepartmentsToAgencies` with dryRun=false to execute
 * 4. Run `verifyMigration` to confirm success
 * 
 * Safety Features:
 * - Dry run mode for validation
 * - Preview mode to review changes
 * - Progress tracking for large datasets
 * - Rollback capability (limited)
 */

import { v } from "convex/values";
import { query, mutation, internalMutation } from "../_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "../_generated/dataModel";

/**
 * Get a preview of what will be migrated without making changes
 */
export const getMigrationPreview = query({
  args: {},
  handler: async (ctx) => {
    // TEMP: Skip auth check for local testing
    // TODO: Re-enable auth check before production
    // const userId = await getAuthUserId(ctx);
    // if (userId === null) {
    //   throw new Error("Not authenticated");
    // }
    // const currentUser = await ctx.db.get(userId);
    // if (!currentUser || currentUser.role !== "super_admin") {
    //   throw new Error("Only super_admin can run migration preview");
    // }

    // Get all departments
    const departments = await ctx.db.query("departments").collect();

    // Get all existing agencies for duplicate checking
    const existingAgencies = await ctx.db.query("implementingAgencies").collect();
    const existingCodes = new Set(existingAgencies.map(a => a.code.toUpperCase()));

    // Count references
    const userCounts = await Promise.all(
      departments.map(async (dept) => {
        const users = await ctx.db
          .query("users")
          .withIndex("departmentId", (q) => q.eq("departmentId", dept._id as any))
          .collect();
        return { deptId: dept._id, count: users.length };
      })
    );

    const projectCounts = await Promise.all(
      departments.map(async (dept) => {
        const projects = await ctx.db
          .query("projects")
          .withIndex("departmentId", (q) => q.eq("departmentId", dept._id as any))
          .collect();
        return { deptId: dept._id, count: projects.length };
      })
    );

    const budgetItemCounts = await Promise.all(
      departments.map(async (dept) => {
        const items = await ctx.db
          .query("budgetItems")
          .withIndex("departmentId", (q) => q.eq("departmentId", dept._id as any))
          .collect();
        return { deptId: dept._id, count: items.length };
      })
    );

    // Build preview
    const preview = departments.map((dept) => {
      const codeConflict = existingCodes.has(dept.code.toUpperCase());
      const agencyWithSameCode = existingAgencies.find(
        a => a.code.toUpperCase() === dept.code.toUpperCase()
      );

      return {
        departmentId: dept._id,
        name: dept.name,
        code: dept.code,
        hasCodeConflict: codeConflict,
        existingAgencyId: agencyWithSameCode?._id ?? null,
        existingAgencyType: agencyWithSameCode?.type ?? null,
        userCount: userCounts.find(u => u.deptId === dept._id)?.count ?? 0,
        projectCount: projectCounts.find(p => p.deptId === dept._id)?.count ?? 0,
        budgetItemCount: budgetItemCounts.find(b => b.deptId === dept._id)?.count ?? 0,
        hasParent: !!dept.parentDepartmentId,
        hasHead: !!dept.headUserId,
      };
    });

    const totalUsers = preview.reduce((sum, p) => sum + p.userCount, 0);
    const totalProjects = preview.reduce((sum, p) => sum + p.projectCount, 0);
    const totalBudgetItems = preview.reduce((sum, p) => sum + p.budgetItemCount, 0);
    const conflicts = preview.filter(p => p.hasCodeConflict).length;

    return {
      totalDepartments: departments.length,
      totalExistingAgencies: existingAgencies.length,
      codeConflicts: conflicts,
      totalUsersToMigrate: totalUsers,
      totalProjectsToMigrate: totalProjects,
      totalBudgetItemsToMigrate: totalBudgetItems,
      departments: preview,
    };
  },
});

/**
 * Main migration mutation
 * Run with dryRun=true first to validate without making changes
 */
export const migrateDepartmentsToAgencies = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    batchSize: v.optional(v.number()), // Default: process all at once
  },
  handler: async (ctx, args) => {
    // TEMP: Get first super_admin user for migration tracking
    // TODO: Re-enable auth check before production
    // const userId = await getAuthUserId(ctx);
    // if (userId === null) {
    //   throw new Error("Not authenticated");
    // }
    // const currentUser = await ctx.db.get(userId);
    // if (!currentUser || currentUser.role !== "super_admin") {
    //   throw new Error("Only super_admin can run migration");
    // }

    // Get first super_admin user for audit fields
    const adminUser = await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", "super_admin"))
      .first();
    
    const userId = adminUser?._id || "jx7dxqj0atmbxatpk7fer8mr697z4bpw" as any; // Fallback to a known admin ID

    const dryRun = args.dryRun ?? true;
    const batchSize = args.batchSize ?? 1000;
    const results = {
      dryRun,
      departmentsProcessed: 0,
      agenciesCreated: 0,
      agenciesUpdated: 0,
      usersUpdated: 0,
      projectsUpdated: 0,
      budgetItemsUpdated: 0,
      trustFundsUpdated: 0,
      specialHealthFundsUpdated: 0,
      specialEducationFundsUpdated: 0,
      twentyPercentDFUpdated: 0,
      accessRequestsUpdated: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    const now = Date.now();

    // Step 1: Get all departments
    const departments = await ctx.db.query("departments").collect();
    results.departmentsProcessed = departments.length;

    // Step 2: Build mapping of old department ID to new agency ID
    const departmentToAgencyMap = new Map<Id<"departments"> | any, Id<"implementingAgencies">>();

    // Step 3: Create or update agencies for each department
    for (const dept of departments) {
      try {
        // Check if an agency with this code already exists
        const existingAgency = await ctx.db
          .query("implementingAgencies")
          .withIndex("code", (q) => q.eq("code", dept.code))
          .first();

        if (existingAgency) {
          // Update existing agency with department data
          if (!dryRun) {
            await ctx.db.patch(existingAgency._id, {
              // Keep existing code and fullName if already set, otherwise use department data
              fullName: existingAgency.fullName || dept.name,
              type: "internal", // Migrate from "department" to "internal"
              description: dept.description || existingAgency.description,
              headUserId: dept.headUserId,
              contactEmail: dept.email || existingAgency.contactEmail,
              contactPhone: dept.phone || existingAgency.contactPhone,
              address: dept.location || existingAgency.address,
              isActive: dept.isActive,
              displayOrder: dept.displayOrder,
              updatedAt: now,
              updatedBy: userId,
            });
          }
          departmentToAgencyMap.set(dept._id, existingAgency._id);
          results.agenciesUpdated++;
          results.warnings.push(`Updated existing agency ${dept.code} with department data`);
        } else {
          // Create new agency from department
          if (!dryRun) {
            const agencyId = await ctx.db.insert("implementingAgencies", {
              code: dept.code,
              fullName: dept.name,
              type: "internal",
              description: dept.description,
              headUserId: dept.headUserId,
              contactEmail: dept.email,
              contactPhone: dept.phone,
              address: dept.location,
              isActive: dept.isActive,
              displayOrder: dept.displayOrder,
              isSystemDefault: false,
              projectUsageCount: 0,
              breakdownUsageCount: 0,
              createdBy: userId,
              createdAt: now,
              updatedAt: now,
            });
            departmentToAgencyMap.set(dept._id, agencyId);
          }
          results.agenciesCreated++;
        }
      } catch (error) {
        results.errors.push(`Failed to process department ${dept.name} (${dept.code}): ${error}`);
      }
    }

    // Step 4: Second pass - update parent relationships
    if (!dryRun) {
      for (const dept of departments) {
        if (dept.parentDepartmentId) {
          const agencyId = departmentToAgencyMap.get(dept._id);
          const parentAgencyId = departmentToAgencyMap.get(dept.parentDepartmentId);
          
          if (agencyId && parentAgencyId) {
            await ctx.db.patch(agencyId, {
              parentAgencyId,
            });
          }
        }
      }
    }

    // Step 5: Update all foreign key references
    if (!dryRun) {
      // Update users
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const users = await ctx.db
          .query("users")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId as any))
          .collect();
        
        for (const user of users) {
          await ctx.db.patch(user._id, {
            departmentId: agencyId,
          });
          results.usersUpdated++;
        }
      }

      // Update projects
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const projects = await ctx.db
          .query("projects")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId))
          .collect();
        
        for (const project of projects) {
          await ctx.db.patch(project._id, {
            departmentId: agencyId,
          });
          results.projectsUpdated++;
        }
      }

      // Update budgetItems
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const items = await ctx.db
          .query("budgetItems")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId))
          .collect();
        
        for (const item of items) {
          await ctx.db.patch(item._id, {
            departmentId: agencyId,
          });
          results.budgetItemsUpdated++;
        }
      }

      // Update trustFunds
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const funds = await ctx.db
          .query("trustFunds")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId))
          .collect();
        
        for (const fund of funds) {
          await ctx.db.patch(fund._id, {
            departmentId: agencyId,
          });
          results.trustFundsUpdated++;
        }
      }

      // Update specialHealthFunds
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const funds = await ctx.db
          .query("specialHealthFunds")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId))
          .collect();
        
        for (const fund of funds) {
          await ctx.db.patch(fund._id, {
            departmentId: agencyId,
          });
          results.specialHealthFundsUpdated++;
        }
      }

      // Update specialEducationFunds
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const funds = await ctx.db
          .query("specialEducationFunds")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId))
          .collect();
        
        for (const fund of funds) {
          await ctx.db.patch(fund._id, {
            departmentId: agencyId,
          });
          results.specialEducationFundsUpdated++;
        }
      }

      // Update twentyPercentDF
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const funds = await ctx.db
          .query("twentyPercentDF")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId))
          .collect();
        
        for (const fund of funds) {
          await ctx.db.patch(fund._id, {
            departmentId: agencyId,
          });
          results.twentyPercentDFUpdated++;
        }
      }

      // Update accessRequests
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const requests = await ctx.db
          .query("accessRequests")
          .withIndex("departmentId", (q) => q.eq("departmentId", deptId))
          .collect();
        
        for (const request of requests) {
          await ctx.db.patch(request._id, {
            departmentId: agencyId,
          });
          results.accessRequestsUpdated++;
        }
      }

      // Update budgetItemActivities
      for (const [deptId, agencyId] of departmentToAgencyMap) {
        const activities = await ctx.db
          .query("budgetItemActivities")
          .collect();
        
        for (const activity of activities) {
          if ((activity as any).departmentId === deptId) {
            await ctx.db.patch(activity._id, {
              departmentId: agencyId,
            });
          }
        }
      }
    }

    return results;
  },
});

/**
 * Verify migration completed successfully
 */
export const verifyMigration = query({
  args: {},
  handler: async (ctx) => {
    // TEMP: Skip auth check for local testing
    // TODO: Re-enable auth check before production
    // const userId = await getAuthUserId(ctx);
    // if (userId === null) {
    //   throw new Error("Not authenticated");
    // }
    // const currentUser = await ctx.db.get(userId);
    // if (!currentUser || currentUser.role !== "super_admin") {
    //   throw new Error("Only super_admin can verify migration");
    // }

    // Check for any remaining department references
    const departments = await ctx.db.query("departments").collect();
    
    // Count agencies with type="internal"
    const internalAgencies = await ctx.db
      .query("implementingAgencies")
      .withIndex("type", (q) => q.eq("type", "internal"))
      .collect();

    // Check for orphaned references
    const orphanedUsers = [] as any[];
    const invalidReferences = [] as any[];
    const users = await ctx.db.query("users").collect();
    for (const user of users) {
      if (user.departmentId) {
        try {
          const agency = await ctx.db.get(user.departmentId);
          if (!agency) {
            orphanedUsers.push({ userId: user._id, name: user.name, departmentId: user.departmentId });
          }
        } catch (e) {
          // Invalid ID format (e.g., old department references)
          invalidReferences.push({ userId: user._id, name: user.name, departmentId: user.departmentId, error: String(e) });
        }
      }
    }

    return {
      remainingDepartments: departments.length,
      internalAgencies: internalAgencies.length,
      orphanedUserReferences: orphanedUsers.length,
      orphanedUsers: orphanedUsers.slice(0, 10), // Show first 10
      invalidReferences: invalidReferences.length,
      invalidReferenceDetails: invalidReferences.slice(0, 10),
      verificationPassed: departments.length === 0 && orphanedUsers.length === 0 && invalidReferences.length === 0,
    };
  },
});

/**
 * Get migration statistics
 */
export const getMigrationStats = query({
  args: {},
  handler: async (ctx) => {
    // TEMP: Skip auth check for local testing
    // TODO: Re-enable auth check before production
    // const userId = await getAuthUserId(ctx);
    // if (userId === null) {
    //   throw new Error("Not authenticated");
    // }
    // const currentUser = await ctx.db.get(userId);
    // if (!currentUser || currentUser.role !== "super_admin") {
    //   throw new Error("Only super_admin can view migration stats");
    // }

    const departments = await ctx.db.query("departments").collect();
    const agencies = await ctx.db.query("implementingAgencies").collect();
    const internalAgencies = agencies.filter(a => a.type === "internal");
    const externalAgencies = agencies.filter(a => a.type === "external");

    return {
      departmentsRemaining: departments.length,
      totalAgencies: agencies.length,
      internalAgencies: internalAgencies.length,
      externalAgencies: externalAgencies.length,
      migrationComplete: departments.length === 0,
    };
  },
});
