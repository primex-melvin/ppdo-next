// convex/departments.ts
// ============================================================================
// DEPRECATED: This file is deprecated and redirects to implementingAgencies
// ============================================================================
// 
// MIGRATION NOTICE:
// The departments table has been merged into implementingAgencies with type: "internal".
// All functions in this file now redirect to implementingAgencies for backward compatibility.
//
// PLEASE MIGRATE frontend code to use api.implementingAgencies.* instead:
//   - api.departments.list → api.implementingAgencies.list with type: "internal"
//   - api.departments.get → api.implementingAgencies.getByCode or api.implementingAgencies.get
//   - api.departments.create → api.implementingAgencies.create with type: "internal"
//   - api.departments.update → api.implementingAgencies.update
//   - api.departments.remove → api.implementingAgencies.remove
//
// Field mappings:
//   - name → fullName
//   - email → contactEmail
//   - phone → contactPhone
//   - location → address
//   - parentDepartmentId → parentAgencyId (via departmentId lookup)
// ============================================================================

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { indexEntity, removeFromIndex } from "./search/index";

/**
 * ============================================================================
 * DEPRECATED QUERIES - Redirect to implementingAgencies
 * ============================================================================
 */

/**
 * @deprecated Use api.implementingAgencies.list with type: "internal" instead
 * Get all departments (redirects to implementingAgencies with type: "internal")
 */
export const list = query({
  args: {
    includeInactive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Query implementingAgencies with type: "internal" instead of departments
    let agencies = await ctx.db
      .query("implementingAgencies")
      .withIndex("type", (q) => q.eq("type", "internal"))
      .collect();

    // Filter by isActive if needed
    if (!args.includeInactive) {
      agencies = agencies.filter(a => a.isActive);
    }

    // Sort by displayOrder, then by code
    agencies.sort((a, b) => {
      const orderA = a.displayOrder ?? 9999;
      const orderB = b.displayOrder ?? 9999;
      if (orderA !== orderB) return orderA - orderB;
      return a.fullName.localeCompare(b.fullName);
    });

    // Enrich with head user information and user counts
    const enrichedDepartments = await Promise.all(
      agencies.map(async (agency) => {
        let headUser = null;
        if (agency.headUserId) {
          headUser = await ctx.db.get(agency.headUserId);
        }

        // Count users that reference this agency by departmentId (backward compatibility)
        // Also count users that might reference by implementingAgencyCode
        const userCount = await ctx.db
          .query("users")
          .withIndex("departmentId", (q) => q.eq("departmentId", agency.departmentId as any))
          .collect()
          .then(users => users.length);

        // Return mapped data with backward-compatible field names
        return {
          _id: agency.departmentId ?? agency._id, // Use departmentId if available for compatibility
          _creationTime: agency._creationTime,
          name: agency.fullName,
          code: agency.code,
          description: agency.description,
          // Map parentAgencyId back to parentDepartmentId if exists
          parentDepartmentId: agency.parentAgencyId as any,
          headUserId: agency.headUserId,
          email: agency.contactEmail,
          phone: agency.contactPhone,
          location: agency.address,
          isActive: agency.isActive,
          displayOrder: agency.displayOrder,
          createdBy: agency.createdBy,
          createdAt: agency.createdAt,
          updatedAt: agency.updatedAt,
          updatedBy: agency.updatedBy,
          // Enriched fields
          headUserName: headUser?.name,
          headUserEmail: headUser?.email,
          userCount,
        };
      })
    );

    return enrichedDepartments;
  },
});

/**
 * @deprecated Use api.implementingAgencies.get instead
 * Get a single department by ID (redirects to implementingAgencies)
 */
export const get = query({
  args: {
    id: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Find the agency by departmentId (migration compatibility)
    const agency = await ctx.db
      .query("implementingAgencies")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id))
      .first();

    if (!agency) {
      return null;
    }

    // Enrich with head user and parent department information
    let headUser = null;
    let parentDepartment = null;

    if (agency.headUserId) {
      headUser = await ctx.db.get(agency.headUserId);
    }

    if (agency.parentAgencyId) {
      const parentAgency = await ctx.db.get(agency.parentAgencyId);
      if (parentAgency) {
        parentDepartment = {
          _id: parentAgency.departmentId ?? parentAgency._id,
          name: parentAgency.fullName,
        };
      }
    }

    // Get user count
    const userCount = await ctx.db
      .query("users")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id as any))
      .collect()
      .then(users => users.length);

    // Get project count (using implementingOffice index with agency code)
    const projectCount = await ctx.db
      .query("projects")
      .withIndex("implementingOffice", (q) => q.eq("implementingOffice", agency.code))
      .collect()
      .then(projects => projects.filter(p => !p.isDeleted).length);

    return {
      _id: agency.departmentId ?? agency._id,
      _creationTime: agency._creationTime,
      name: agency.fullName,
      code: agency.code,
      description: agency.description,
      parentDepartmentId: agency.parentAgencyId as any,
      headUserId: agency.headUserId,
      email: agency.contactEmail,
      phone: agency.contactPhone,
      location: agency.address,
      isActive: agency.isActive,
      displayOrder: agency.displayOrder,
      createdBy: agency.createdBy,
      createdAt: agency.createdAt,
      updatedAt: agency.updatedAt,
      updatedBy: agency.updatedBy,
      // Enriched fields
      headUserName: headUser?.name,
      headUserEmail: headUser?.email,
      parentDepartmentName: parentDepartment?.name,
      userCount,
      projectCount,
    };
  },
});

/**
 * @deprecated Use api.implementingAgencies.list with type: "internal" instead
 * Get department hierarchy (parent-child structure)
 */
export const getHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Query implementingAgencies with type: "internal" and isActive: true
    const agencies = await ctx.db
      .query("implementingAgencies")
      .withIndex("typeAndActive", (q) => q.eq("type", "internal").eq("isActive", true))
      .collect();

    // Create a map for quick lookup
    const agencyMap = new Map(
      agencies.map(a => [a._id, { ...a, children: [] as any[] }])
    );

    const rootDepartments: any[] = [];

    // Build hierarchy using parentAgencyId
    agencies.forEach(agency => {
      const agencyWithChildren = agencyMap.get(agency._id)!;
      if (agency.parentAgencyId) {
        const parent = agencyMap.get(agency.parentAgencyId);
        if (parent) {
          parent.children.push(agencyWithChildren);
        } else {
          // Parent not in active list, treat as root
          rootDepartments.push(agencyWithChildren);
        }
      } else {
        rootDepartments.push(agencyWithChildren);
      }
    });

    // Sort by displayOrder
    const sortByOrder = (arr: any[]) => {
      arr.sort((a, b) => {
        const orderA = a.displayOrder ?? 9999;
        const orderB = b.displayOrder ?? 9999;
        if (orderA !== orderB) return orderA - orderB;
        return a.fullName.localeCompare(b.fullName);
      });
      arr.forEach(item => {
        if (item.children.length > 0) {
          sortByOrder(item.children);
        }
      });
    };

    sortByOrder(rootDepartments);

    // Map back to department-like structure
    const mapToDepartment = (a: any): any => ({
      _id: a.departmentId ?? a._id,
      _creationTime: a._creationTime,
      name: a.fullName,
      code: a.code,
      description: a.description,
      parentDepartmentId: a.parentAgencyId ? (agencyMap.get(a.parentAgencyId)?.departmentId ?? a.parentAgencyId) : undefined,
      headUserId: a.headUserId,
      email: a.contactEmail,
      phone: a.contactPhone,
      location: a.address,
      isActive: a.isActive,
      displayOrder: a.displayOrder,
      createdBy: a.createdBy,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      updatedBy: a.updatedBy,
      children: a.children.map(mapToDepartment),
    });

    return rootDepartments.map(mapToDepartment);
  },
});

/**
 * ============================================================================
 * DEPRECATED MUTATIONS - Redirect to implementingAgencies
 * ============================================================================
 */

/**
 * @deprecated Use api.implementingAgencies.create with type: "internal" instead
 * Create a new department (redirects to implementingAgencies)
 */
export const create = mutation({
  args: {
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    parentDepartmentId: v.optional(v.id("departments")),
    headUserId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    isActive: v.boolean(),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);

    // Only super_admin and admin can create departments
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    // Check if code already exists in implementingAgencies
    const existingAgency = await ctx.db
      .query("implementingAgencies")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();

    if (existingAgency) {
      throw new Error("Department code already exists");
    }

    // Verify parent department exists if provided
    let parentAgencyId: any = undefined;
    if (args.parentDepartmentId) {
      const parentAgency = await ctx.db
        .query("implementingAgencies")
        .withIndex("departmentId", (q) => q.eq("departmentId", args.parentDepartmentId!))
        .first();
      
      if (!parentAgency) {
        throw new Error("Parent department not found");
      }
      parentAgencyId = parentAgency._id;
    }

    // Verify head user exists if provided
    if (args.headUserId) {
      const headUser = await ctx.db.get(args.headUserId);
      if (!headUser) {
        throw new Error("Head user not found");
      }
    }

    const now = Date.now();

    // Insert into departments table for backward compatibility
    const departmentId = await ctx.db.insert("departments", {
      name: args.name,
      code: args.code,
      description: args.description,
      parentDepartmentId: args.parentDepartmentId,
      headUserId: args.headUserId,
      email: args.email,
      phone: args.phone,
      location: args.location,
      isActive: args.isActive,
      displayOrder: args.displayOrder,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Also create in implementingAgencies
    const agencyId = await ctx.db.insert("implementingAgencies", {
      code: args.code,
      fullName: args.name,
      type: "internal",
      parentAgencyId: parentAgencyId,
      headUserId: args.headUserId,
      departmentId: departmentId, // Link back to departments table
      description: args.description,
      contactEmail: args.email,
      contactPhone: args.phone,
      address: args.location,
      isActive: args.isActive,
      displayOrder: args.displayOrder,
      isSystemDefault: false,
      projectUsageCount: 0,
      breakdownUsageCount: 0,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Log the action
    await ctx.db.insert("userAuditLog", {
      performedBy: userId,
      targetDepartmentId: departmentId,
      action: "department_created",
      newValues: JSON.stringify({
        name: args.name,
        code: args.code,
        isActive: args.isActive
      }),
      timestamp: now,
    });

    // Add to search index (still as department for compatibility)
    await indexEntity(ctx, {
      entityType: "department",
      entityId: departmentId,
      primaryText: args.name,
      secondaryText: args.code,
      departmentId: departmentId,
      status: args.isActive ? "active" : "inactive",
      isDeleted: false,
    });

    return departmentId;
  },
});

/**
 * @deprecated Use api.implementingAgencies.update instead
 * Update a department (redirects to implementingAgencies)
 */
export const update = mutation({
  args: {
    id: v.id("departments"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    parentDepartmentId: v.optional(v.id("departments")),
    headUserId: v.optional(v.id("users")),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    isActive: v.boolean(),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);

    // Only super_admin and admin can update departments
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    // Get existing department
    const existingDept = await ctx.db.get(args.id);
    if (!existingDept) {
      throw new Error("Department not found");
    }

    // Find corresponding implementingAgency
    const agency = await ctx.db
      .query("implementingAgencies")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id))
      .first();

    // Check if code is being changed and if it conflicts
    if (args.code !== existingDept.code) {
      const conflictingAgency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", args.code))
        .first();

      if (conflictingAgency && conflictingAgency._id !== agency?._id) {
        throw new Error("Department code already exists");
      }
    }

    // Prevent circular parent reference
    if (args.parentDepartmentId === args.id) {
      throw new Error("Department cannot be its own parent");
    }

    // Verify parent department exists if provided
    let parentAgencyId: any = undefined;
    if (args.parentDepartmentId) {
      const parentAgency = await ctx.db
        .query("implementingAgencies")
        .withIndex("departmentId", (q) => q.eq("departmentId", args.parentDepartmentId!))
        .first();
      
      if (!parentAgency) {
        throw new Error("Parent department not found");
      }
      parentAgencyId = parentAgency._id;
    }

    // Verify head user exists if provided
    if (args.headUserId) {
      const headUser = await ctx.db.get(args.headUserId);
      if (!headUser) {
        throw new Error("Head user not found");
      }
    }

    const now = Date.now();

    // Update departments table
    await ctx.db.patch(args.id, {
      name: args.name,
      code: args.code,
      description: args.description,
      parentDepartmentId: args.parentDepartmentId,
      headUserId: args.headUserId,
      email: args.email,
      phone: args.phone,
      location: args.location,
      isActive: args.isActive,
      displayOrder: args.displayOrder,
      updatedBy: userId,
      updatedAt: now,
    });

    // Update implementingAgencies table
    if (agency) {
      await ctx.db.patch(agency._id, {
        code: args.code,
        fullName: args.name,
        parentAgencyId: parentAgencyId,
        headUserId: args.headUserId,
        description: args.description,
        contactEmail: args.email,
        contactPhone: args.phone,
        address: args.location,
        isActive: args.isActive,
        displayOrder: args.displayOrder,
        updatedBy: userId,
        updatedAt: now,
      });
    }

    // Log the action
    await ctx.db.insert("userAuditLog", {
      performedBy: userId,
      targetDepartmentId: args.id,
      action: "department_updated",
      previousValues: JSON.stringify({
        name: existingDept.name,
        code: existingDept.code,
        isActive: existingDept.isActive
      }),
      newValues: JSON.stringify({
        name: args.name,
        code: args.code,
        isActive: args.isActive
      }),
      timestamp: now,
    });

    // Update search index
    await indexEntity(ctx, {
      entityType: "department",
      entityId: args.id,
      primaryText: args.name,
      secondaryText: args.code,
      departmentId: args.id,
      status: args.isActive ? "active" : "inactive",
      isDeleted: false,
    });

    return args.id;
  },
});

/**
 * @deprecated Use api.implementingAgencies.remove instead
 * Delete a department (redirects to implementingAgencies)
 */
export const remove = mutation({
  args: {
    id: v.id("departments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(userId);

    // Only super_admin can delete departments
    if (!currentUser || currentUser.role !== "super_admin") {
      throw new Error("Not authorized - super_admin access required");
    }

    const existingDept = await ctx.db.get(args.id);
    if (!existingDept) {
      throw new Error("Department not found");
    }

    // Find corresponding implementingAgency
    const agency = await ctx.db
      .query("implementingAgencies")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id))
      .first();

    // Check if department has users
    const users = await ctx.db
      .query("users")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id as any))
      .collect();

    if (users.length > 0) {
      throw new Error(`Cannot delete department with ${users.length} user(s). Please reassign users first.`);
    }

    // Check if agency is in use (if exists)
    if (agency) {
      const projectUsage = agency.projectUsageCount || 0;
      const breakdownUsage = agency.breakdownUsageCount || 0;
      const totalUsage = projectUsage + breakdownUsage;

      if (totalUsage > 0) {
        throw new Error(`Cannot delete department - it is currently used by ${projectUsage} project(s) and ${breakdownUsage} breakdown(s).`);
      }

      // Check if any child agencies exist
      const childAgencies = await ctx.db
        .query("implementingAgencies")
        .withIndex("parentAgencyId", (q) => q.eq("parentAgencyId", agency._id))
        .collect();

      if (childAgencies.length > 0) {
        throw new Error(`Cannot delete department with ${childAgencies.length} sub-agency(ies).`);
      }

      // Delete from implementingAgencies
      await ctx.db.delete(agency._id);
    }

    // Check if department has child departments
    const childDepartments = await ctx.db
      .query("departments")
      .withIndex("parentDepartmentId", (q) => q.eq("parentDepartmentId", args.id))
      .collect();

    if (childDepartments.length > 0) {
      throw new Error(`Cannot delete department with ${childDepartments.length} sub-department(s).`);
    }

    // Delete from departments table
    await ctx.db.delete(args.id);

    // Log the action
    const now = Date.now();
    await ctx.db.insert("userAuditLog", {
      performedBy: userId,
      targetDepartmentId: args.id,
      action: "department_deleted",
      previousValues: JSON.stringify({
        name: existingDept.name,
        code: existingDept.code
      }),
      timestamp: now,
    });

    // Remove from search index
    await removeFromIndex(ctx, {
      entityId: args.id,
    });

    return args.id;
  },
});
