// convex/loginTrail.ts

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Record a login attempt (success or failure)
 * Called during authentication process
 */
export const recordLoginAttempt = mutation({
  args: {
    userId: v.optional(v.id("users")),
    identifier: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("failed"),
      v.literal("suspicious"),
      v.literal("blocked")
    ),
    failureReason: v.optional(v.string()),
    ipAddress: v.string(),
    geoLocation: v.optional(v.string()), // JSON: { city, region, country, coordinates }
    deviceInfo: v.optional(v.string()), // JSON: { type, os, osVersion, brand, model }
    browserInfo: v.optional(v.string()), // JSON: { browser, browserVersion, userAgent }
    sessionId: v.optional(v.id("authSessions")),
    riskScore: v.optional(v.number()),
    riskFactors: v.optional(v.string()), // JSON array
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Determine if this should be flagged for review
    const flaggedForReview = 
      args.status === "suspicious" || 
      args.status === "blocked" ||
      (args.riskScore !== undefined && args.riskScore > 70);

    const loginAttemptId = await ctx.db.insert("loginAttempts", {
      userId: args.userId,
      identifier: args.identifier,
      status: args.status,
      failureReason: args.failureReason,
      ipAddress: args.ipAddress,
      geoLocation: args.geoLocation,
      deviceInfo: args.deviceInfo,
      browserInfo: args.browserInfo,
      sessionId: args.sessionId,
      timestamp: now,
      riskScore: args.riskScore,
      riskFactors: args.riskFactors,
      flaggedForReview,
    });

    // Update user's failed login count
    if (args.userId) {
      const user = await ctx.db.get(args.userId);
      if (user) {
        if (args.status === "success") {
          // Reset failed attempts on successful login
          await ctx.db.patch(args.userId, {
            failedLoginAttempts: 0,
            lastLogin: now,
            updatedAt: now,
          });
        } else if (args.status === "failed") {
          // Increment failed attempts
          const failedCount = (user.failedLoginAttempts || 0) + 1;
          await ctx.db.patch(args.userId, {
            failedLoginAttempts: failedCount,
            lastFailedLogin: now,
            updatedAt: now,
          });

          // Lock account if too many failed attempts
          if (failedCount >= 5) {
            await ctx.db.patch(args.userId, {
              isLocked: true,
              lockReason: `Account locked after ${failedCount} failed login attempts`,
              lockedAt: now,
            });

            // Create security alert
            await ctx.db.insert("securityAlerts", {
              type: "account_locked",
              severity: "high",
              userId: args.userId,
              loginAttemptId,
              title: "Account Locked - Multiple Failed Attempts",
              description: `Account ${args.identifier} has been locked after ${failedCount} failed login attempts.`,
              status: "open",
              createdAt: now,
            });
          }
        }
      }
    }

    // Create security alert for suspicious/blocked attempts
    if (flaggedForReview && args.userId) {
      await ctx.db.insert("securityAlerts", {
        type: args.status === "blocked" ? "brute_force_attempt" : "suspicious_login",
        severity: args.status === "blocked" ? "critical" : "medium",
        userId: args.userId,
        loginAttemptId,
        title: args.status === "blocked" ? "Login Blocked" : "Suspicious Login Detected",
        description: `Login attempt from ${args.ipAddress} was flagged as ${args.status}. Risk score: ${args.riskScore || 0}`,
        metadata: JSON.stringify({
          geoLocation: args.geoLocation,
          deviceInfo: args.deviceInfo,
          riskFactors: args.riskFactors,
        }),
        status: "open",
        createdAt: now,
      });
    }

    return loginAttemptId;
  },
});

/**
 * Get recent login attempts for display in dashboard
 * Admin/Super Admin can see all, regular users see their own
 */
export const getRecentLoginAttempts = query({
  args: {
    limit: v.optional(v.number()),
    userId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("success"),
        v.literal("failed"),
        v.literal("suspicious"),
        v.literal("blocked")
      )
    ),
  },
  handler: async (ctx, args) => {
    console.log("=== GET RECENT LOGIN ATTEMPTS START ===");
    console.log("Args:", args);

    const currentUserId = await getAuthUserId(ctx);
    console.log("Current User ID:", currentUserId);

    if (!currentUserId) {
      console.error("Not authenticated");
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    console.log("Current User:", {
      id: currentUser?._id,
      email: currentUser?.email,
      role: currentUser?.role,
    });

    if (!currentUser) {
      console.error("User not found");
      throw new Error("User not found");
    }

    const limit = args.limit || 50;
    console.log("Limit:", limit);

    let attempts;

    // Super admin and admin can see all login attempts
    if (currentUser.role === "super_admin" || currentUser.role === "admin") {
      console.log("User is admin/super_admin, fetching all attempts");

      if (args.userId) {
        console.log("Filtering by userId:", args.userId);
        // Filter by specific user
        attempts = await ctx.db
          .query("loginAttempts")
          .withIndex("userId", (q) => q.eq("userId", args.userId))
          .order("desc")
          .take(limit);
      } else if (args.status) {
        console.log("Filtering by status:", args.status);
        // Filter by status
        attempts = await ctx.db
          .query("loginAttempts")
          .withIndex("status", (q) => q.eq("status", args.status!))
          .order("desc")
          .take(limit);
      } else {
        console.log("Fetching all recent attempts");
        // Get all recent attempts
        attempts = await ctx.db
          .query("loginAttempts")
          .withIndex("timestamp")
          .order("desc")
          .take(limit);
      }
    } else {
      console.log("Regular user, fetching only their attempts");
      // Regular users can only see their own attempts
      attempts = await ctx.db
        .query("loginAttempts")
        .withIndex("userId", (q) => q.eq("userId", currentUserId))
        .order("desc")
        .take(limit);
    }

    console.log("Found", attempts.length, "login attempts");

    // Enrich with user information
    const enrichedAttempts = await Promise.all(
      attempts.map(async (attempt) => {
        let userName = "Unknown User";
        let userEmail = attempt.identifier;

        if (attempt.userId) {
          const user = await ctx.db.get(attempt.userId);
          if (user) {
            userName = user.name || "Unknown User";
            userEmail = user.email || attempt.identifier;
          }
        }

        // Parse JSON fields
        let geoData = null;
        let deviceData = null;
        let browserData = null;

        try {
          if (attempt.geoLocation) {
            geoData = JSON.parse(attempt.geoLocation);
          }
          if (attempt.deviceInfo) {
            deviceData = JSON.parse(attempt.deviceInfo);
          }
          if (attempt.browserInfo) {
            browserData = JSON.parse(attempt.browserInfo);
          }
        } catch (e) {
          // Ignore parse errors
        }

        return {
          id: attempt._id,
          userId: attempt.userId,
          userName,
          userEmail,
          timestamp: attempt.timestamp,
          status: attempt.status,
          ipAddress: attempt.ipAddress,
          location: geoData 
            ? `${geoData.city || "Unknown"}, ${geoData.country || "Unknown"}`
            : "Unknown Location",
          device: deviceData
            ? `${deviceData.type || "Unknown"} ${deviceData.os ? `(${deviceData.os})` : ""}`
            : "Unknown Device",
          browser: browserData
            ? `${browserData.browser || "Unknown"} ${browserData.browserVersion || ""}`
            : "Unknown",
          riskScore: attempt.riskScore,
          flaggedForReview: attempt.flaggedForReview,
          failureReason: attempt.failureReason,
        };
      })
    );

    console.log("Enriched attempts sample:", enrichedAttempts.length > 0 ? enrichedAttempts[0] : "No attempts");
    console.log("=== GET RECENT LOGIN ATTEMPTS COMPLETE ===");
    console.log("Returning", enrichedAttempts.length, "attempts");

    return enrichedAttempts;
  },
});

/**
 * Get login statistics for dashboard
 */
export const getLoginStatistics = query({
  args: {
    timeRange: v.optional(v.union(
      v.literal("today"),
      v.literal("week"),
      v.literal("month")
    )),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    const now = Date.now();
    let startTime: number;

    switch (args.timeRange) {
      case "today":
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case "week":
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        startTime = now - 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = now - 24 * 60 * 60 * 1000;
    }

    // Get all attempts in time range
    const allAttempts = await ctx.db
      .query("loginAttempts")
      .withIndex("timestamp")
      .order("desc")
      .collect();

    const attemptsInRange = allAttempts.filter(a => a.timestamp >= startTime);

    const stats = {
      total: attemptsInRange.length,
      successful: attemptsInRange.filter(a => a.status === "success").length,
      failed: attemptsInRange.filter(a => a.status === "failed").length,
      suspicious: attemptsInRange.filter(a => a.status === "suspicious").length,
      blocked: attemptsInRange.filter(a => a.status === "blocked").length,
      flaggedForReview: attemptsInRange.filter(a => a.flaggedForReview).length,
      uniqueUsers: new Set(attemptsInRange.filter(a => a.userId).map(a => a.userId)).size,
      uniqueIPs: new Set(attemptsInRange.map(a => a.ipAddress)).size,
    };

    return stats;
  },
});

/**
 * Get security alerts
 */
export const getSecurityAlerts = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("investigating"),
        v.literal("resolved"),
        v.literal("dismissed")
      )
    ),
    severity: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    const limit = args.limit || 50;
    let alerts;

    if (args.status && args.severity) {
      alerts = await ctx.db
        .query("securityAlerts")
        .withIndex("severityAndStatus", (q) => 
          q.eq("severity", args.severity!).eq("status", args.status!)
        )
        .order("desc")
        .take(limit);
    } else if (args.status) {
      alerts = await ctx.db
        .query("securityAlerts")
        .withIndex("status", (q) => q.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else if (args.severity) {
      alerts = await ctx.db
        .query("securityAlerts")
        .withIndex("severity", (q) => q.eq("severity", args.severity!))
        .order("desc")
        .take(limit);
    } else {
      alerts = await ctx.db
        .query("securityAlerts")
        .withIndex("createdAt")
        .order("desc")
        .take(limit);
    }

    // Enrich with user information
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        let affectedUser = null;
        if (alert.userId) {
          const user = await ctx.db.get(alert.userId);
          if (user) {
            affectedUser = {
              name: user.name,
              email: user.email,
            };
          }
        }

        let assignedUser = null;
        if (alert.assignedTo) {
          const user = await ctx.db.get(alert.assignedTo);
          if (user) {
            assignedUser = {
              name: user.name,
              email: user.email,
            };
          }
        }

        return {
          ...alert,
          affectedUser,
          assignedUser,
        };
      })
    );

    return enrichedAlerts;
  },
});

/**
 * Update security alert status
 */
export const updateSecurityAlert = mutation({
  args: {
    alertId: v.id("securityAlerts"),
    status: v.union(
      v.literal("open"),
      v.literal("investigating"),
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    resolutionNotes: v.optional(v.string()),
    assignTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    const alert = await ctx.db.get(args.alertId);
    if (!alert) {
      throw new Error("Alert not found");
    }

    const now = Date.now();
    const updateData: any = {
      status: args.status,
    };

    if (args.resolutionNotes) {
      updateData.resolutionNotes = args.resolutionNotes;
    }

    if (args.assignTo) {
      updateData.assignedTo = args.assignTo;
    }

    if (args.status === "resolved" || args.status === "dismissed") {
      updateData.resolvedAt = now;
      updateData.resolvedBy = currentUserId;
    }

    await ctx.db.patch(args.alertId, updateData);

    return { success: true };
  },
});

/**
 * Review a flagged login attempt
 */
export const reviewLoginAttempt = mutation({
  args: {
    attemptId: v.id("loginAttempts"),
    notes: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || (currentUser.role !== "super_admin" && currentUser.role !== "admin")) {
      throw new Error("Not authorized - administrator access required");
    }

    const attempt = await ctx.db.get(args.attemptId);
    if (!attempt) {
      throw new Error("Login attempt not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.attemptId, {
      reviewedBy: currentUserId,
      reviewedAt: now,
      reviewNotes: args.notes,
      flaggedForReview: false,
    });

    return { success: true };
  },
});