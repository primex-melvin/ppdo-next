// convex/departments.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { indexEntity, removeFromIndex } from "./search/index";

/**
 * Get all departments
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

    let departments;
    
    if (args.includeInactive) {
      departments = await ctx.db
        .query("departments")
        .order("asc")
        .collect();
    } else {
      departments = await ctx.db
        .query("departments")
        .withIndex("isActive", (q) => q.eq("isActive", true))
        .collect();
    }

    // Sort by displayOrder if available
    departments.sort((a, b) => {
      if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });

    // Enrich with head user information
    const enrichedDepartments = await Promise.all(
      departments.map(async (dept) => {
        let headUser = null;
        if (dept.headUserId) {
          headUser = await ctx.db.get(dept.headUserId);
        }
        
        // Get user count for this department (backward compatibility cast)
        const userCount = await ctx.db
          .query("users")
          .withIndex("departmentId", (q) => q.eq("departmentId", dept._id as any))
          .collect()
          .then(users => users.length);
        
        return {
          ...dept,
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
 * Get a single department by ID
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

    const department = await ctx.db.get(args.id);
    
    if (!department) {
      return null;
    }
    
    // Enrich with head user and parent department information
    let headUser = null;
    let parentDepartment = null;
    
    if (department.headUserId) {
      headUser = await ctx.db.get(department.headUserId);
    }
    
    if (department.parentDepartmentId) {
      parentDepartment = await ctx.db.get(department.parentDepartmentId);
    }
    
    // Get user count (backward compatibility cast)
    const userCount = await ctx.db
      .query("users")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id as any))
      .collect()
      .then(users => users.length);
    
    // Get project count (backward compatibility cast)
    const projectCount = await ctx.db
      .query("projects")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id as any))
      .collect()
      .then(projects => projects.length);
    
    return {
      ...department,
      headUserName: headUser?.name,
      headUserEmail: headUser?.email,
      parentDepartmentName: parentDepartment?.name,
      userCount,
      projectCount,
    };
  },
});

/**
 * Create a new department (super_admin or admin only)
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

    // Check if code already exists
    const existingDept = await ctx.db
      .query("departments")
      .withIndex("code", (q) => q.eq("code", args.code))
      .first();
    
    if (existingDept) {
      throw new Error("Department code already exists");
    }

    // Verify parent department exists if provided
    if (args.parentDepartmentId) {
      const parentDept = await ctx.db.get(args.parentDepartmentId);
      if (!parentDept) {
        throw new Error("Parent department not found");
      }
    }

    // Verify head user exists if provided
    if (args.headUserId) {
      const headUser = await ctx.db.get(args.headUserId);
      if (!headUser) {
        throw new Error("Head user not found");
      }
    }

    const now = Date.now();
    
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

    // ============================================================================
    // DUAL-WRITE: Also create as implementing agency (migration compatibility)
    // ============================================================================
    try {
      // Check if agency with this code already exists
      const existingAgency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", args.code))
        .first();

      if (!existingAgency) {
        await ctx.db.insert("implementingAgencies", {
          code: args.code,
          fullName: args.name,
          type: "internal",
          departmentId: departmentId, // Link back to department
          description: args.description,
          headUserId: args.headUserId,
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
      }
    } catch (error) {
      // Log but don't fail - department is already created
      console.error("Failed to create implementing agency:", error);
    }

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

    // 🔍 Add to search index
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
 * Update a department (super_admin or admin only)
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

    const existingDept = await ctx.db.get(args.id);
    if (!existingDept) {
      throw new Error("Department not found");
    }

    // Check if code is being changed and if it conflicts
    if (args.code !== existingDept.code) {
      const conflictingDept = await ctx.db
        .query("departments")
        .withIndex("code", (q) => q.eq("code", args.code))
        .first();
      
      if (conflictingDept && conflictingDept._id !== args.id) {
        throw new Error("Department code already exists");
      }
    }

    // Prevent circular parent reference
    if (args.parentDepartmentId === args.id) {
      throw new Error("Department cannot be its own parent");
    }

    // Verify parent department exists if provided
    if (args.parentDepartmentId) {
      const parentDept = await ctx.db.get(args.parentDepartmentId);
      if (!parentDept) {
        throw new Error("Parent department not found");
      }
    }

    // Verify head user exists if provided
    if (args.headUserId) {
      const headUser = await ctx.db.get(args.headUserId);
      if (!headUser) {
        throw new Error("Head user not found");
      }
    }

    const now = Date.now();
    
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

    // ============================================================================
    // DUAL-WRITE: Also update the implementing agency (migration compatibility)
    // ============================================================================
    try {
      const agency = await ctx.db
        .query("implementingAgencies")
        .withIndex("code", (q) => q.eq("code", existingDept.code))
        .first();

      if (agency) {
        await ctx.db.patch(agency._id, {
          code: args.code,
          fullName: args.name,
          type: "internal",
          description: args.description,
          headUserId: args.headUserId,
          contactEmail: args.email,
          contactPhone: args.phone,
          address: args.location,
          isActive: args.isActive,
          displayOrder: args.displayOrder,
          updatedAt: now,
          updatedBy: userId,
        });
      }
    } catch (error) {
      // Log but don't fail - department is already updated
      console.error("Failed to update implementing agency:", error);
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

    // 🔍 Update search index
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
 * Delete a department (super_admin only)
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

    // Check if department has users (backward compatibility cast)
    const users = await ctx.db
      .query("users")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id as any))
      .collect();
    
    if (users.length > 0) {
      throw new Error(`Cannot delete department with ${users.length} user(s). Please reassign users first.`);
    }

    // Check if department has projects (backward compatibility cast)
    const projects = await ctx.db
      .query("projects")
      .withIndex("departmentId", (q) => q.eq("departmentId", args.id as any))
      .collect();
    
    if (projects.length > 0) {
      throw new Error(`Cannot delete department with ${projects.length} project(s). Please reassign projects first.`);
    }

    // Check if department has child departments
    const childDepartments = await ctx.db
      .query("departments")
      .withIndex("parentDepartmentId", (q) => q.eq("parentDepartmentId", args.id))
      .collect();
    
    if (childDepartments.length > 0) {
      throw new Error(`Cannot delete department with ${childDepartments.length} sub-department(s).`);
    }

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

    // 🔍 Remove from search index
    await removeFromIndex(ctx, {
      entityId: args.id,
    });

    return args.id;
  },
});

/**
 * Get department hierarchy (parent-child structure)
 */
export const getHierarchy = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const departments = await ctx.db
      .query("departments")
      .withIndex("isActive", (q) => q.eq("isActive", true))
      .collect();

    // Build hierarchy structure
    const departmentMap = new Map(departments.map(d => [d._id, { ...d, children: [] as any[] }]));
    const rootDepartments: any[] = [];

    departments.forEach(dept => {
      const deptWithChildren = departmentMap.get(dept._id);
      if (dept.parentDepartmentId) {
        const parent = departmentMap.get(dept.parentDepartmentId);
        if (parent) {
          parent.children.push(deptWithChildren);
        } else {
          rootDepartments.push(deptWithChildren);
        }
      } else {
        rootDepartments.push(deptWithChildren);
      }
    });

    // Sort by displayOrder
    const sortByOrder = (arr: any[]) => {
      arr.sort((a, b) => {
        if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
          return a.displayOrder - b.displayOrder;
        }
        return a.name.localeCompare(b.name);
      });
      arr.forEach(item => {
        if (item.children.length > 0) {
          sortByOrder(item.children);
        }
      });
    };

    sortByOrder(rootDepartments);

    return rootDepartments;
  },
});