// convex/passwordReset.ts

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Submit a password reset request
 * Rate limited to 1 request per minute and 3 per day
 */
export const submitPasswordResetRequest = mutation({
  args: {
    email: v.string(),
    message: v.optional(v.string()),
    ipAddress: v.string(),
    userAgent: v.optional(v.string()),
    geoLocation: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayKey = new Date(now).toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Normalize email to lowercase for consistent tracking
    const normalizedEmail = args.email.toLowerCase().trim();
    
    // Check if user exists
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", normalizedEmail))
      .first();
    
    if (!user) {
      // Don't reveal if user exists or not for security
      throw new Error("If this email is registered, a password reset request will be submitted.");
    }

    // Check daily attempt limit
    const attemptRecord = await ctx.db
      .query("passwordResetAttempts")
      .withIndex("emailAndDate", (q) => q.eq("email", normalizedEmail).eq("dateKey", todayKey))
      .first();

    if (attemptRecord && attemptRecord.attemptCount >= 3) {
      throw new Error("You have reached the maximum number of password reset requests for today. Please try again tomorrow.");
    }

    // Check rate limit (1 minute between requests)
    if (attemptRecord && (now - attemptRecord.lastAttemptAt) < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - attemptRecord.lastAttemptAt)) / 1000);
      throw new Error(`Please wait ${remainingSeconds} seconds before submitting another request.`);
    }

    // Check for pending requests
    const pendingRequest = await ctx.db
      .query("passwordResetRequests")
      .withIndex("emailAndStatus", (q) => q.eq("email", normalizedEmail).eq("status", "pending"))
      .first();

    if (pendingRequest) {
      throw new Error("You already have a pending password reset request. Please wait for admin review.");
    }

    // Update or create attempt record
    if (attemptRecord) {
      // Update existing record
      const ipAddresses = attemptRecord.ipAddresses 
        ? JSON.parse(attemptRecord.ipAddresses) 
        : [];
      if (!ipAddresses.includes(args.ipAddress)) {
        ipAddresses.push(args.ipAddress);
      }

      await ctx.db.patch(attemptRecord._id, {
        attemptCount: attemptRecord.attemptCount + 1,
        lastAttemptAt: now,
        ipAddresses: JSON.stringify(ipAddresses),
      });
    } else {
      // Create new record
      await ctx.db.insert("passwordResetAttempts", {
        email: normalizedEmail,
        dateKey: todayKey,
        attemptCount: 1,
        lastAttemptAt: now,
        ipAddresses: JSON.stringify([args.ipAddress]),
      });
    }

    // Create password reset request
    const requestId = await ctx.db.insert("passwordResetRequests", {
      email: normalizedEmail,
      userId: user._id,
      message: args.message,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      geoLocation: args.geoLocation,
      status: "pending",
      requestedAt: now,
    });

    // Create security alert for admins
    await ctx.db.insert("securityAlerts", {
      type: "suspicious_login",
      severity: "low",
      userId: user._id,
      title: "Password Reset Requested",
      description: `Password reset requested for ${args.email} from ${args.ipAddress}`,
      metadata: JSON.stringify({
        email: normalizedEmail,
        ipAddress: args.ipAddress,
        message: args.message,
        requestId: requestId,
      }),
      status: "open",
      createdAt: now,
    });

    return { 
      success: true, 
      message: "Password reset request submitted successfully. An administrator will review your request shortly." 
    };
  },
});

/**
 * Check remaining time before next request and attempts left
 */
export const checkResetRequestStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const todayKey = new Date(now).toISOString().split('T')[0];
    
    // Normalize email to lowercase for consistent lookup
    const normalizedEmail = args.email.toLowerCase().trim();

    // Get attempt record
    const attemptRecord = await ctx.db
      .query("passwordResetAttempts")
      .withIndex("emailAndDate", (q) => q.eq("email", normalizedEmail).eq("dateKey", todayKey))
      .first();

    if (!attemptRecord) {
      return {
        canSubmit: true,
        attemptsRemaining: 3,
        remainingSeconds: 0,
      };
    }

    const attemptsRemaining = 3 - attemptRecord.attemptCount;
    const timeSinceLastAttempt = now - attemptRecord.lastAttemptAt;
    const remainingSeconds = Math.max(0, Math.ceil((60000 - timeSinceLastAttempt) / 1000));

    return {
      canSubmit: attemptsRemaining > 0 && remainingSeconds === 0,
      attemptsRemaining: Math.max(0, attemptsRemaining),
      remainingSeconds,
    };
  },
});

/**
 * Get user's password reset requests
 */
export const getUserPasswordResetRequests = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("passwordResetRequests")
      .withIndex("email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(10);

    return requests;
  },
});

/**
 * Get all pending password reset requests (admin only)
 * Note: This will be used later for admin management
 */
export const getAllPasswordResetRequests = query({
  args: {
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    )),
  },
  handler: async (ctx, args) => {
    // Note: Add authentication check here when implementing admin panel
    
    let requests;
    
    if (args.status !== undefined) {
      requests = await ctx.db
        .query("passwordResetRequests")
        .withIndex("status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else {
      requests = await ctx.db
        .query("passwordResetRequests")
        .order("desc")
        .collect();
    }

    // Enrich with user information
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        let user = null;
        if (request.userId) {
          user = await ctx.db.get(request.userId);
        }

        let reviewedByUser = null;
        if (request.reviewedBy) {
          reviewedByUser = await ctx.db.get(request.reviewedBy);
        }

        let passwordChangedByUser = null;
        if (request.passwordChangedBy) {
          passwordChangedByUser = await ctx.db.get(request.passwordChangedBy);
        }

        return {
          ...request,
          userName: user?.name,
          userDepartment: user?.departmentId,
          reviewedByName: reviewedByUser?.name,
          passwordChangedByName: passwordChangedByUser?.name,
        };
      })
    );

    return enrichedRequests;
  },
});