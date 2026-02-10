# Password Reset Bug Fix Implementation Plan

## Bug Summary

**Severity:** 🔴 Critical - Users cannot sign in after password reset  
**Status:** Identified Root Cause → Ready for Fix  
**Reporter:** Development Team  
**Affected URLs:** 
- `http://localhost:3000/forgot-password`
- `http://localhost:3000/dashboard/settings/user-management/password-reset-management`

---

## Root Cause

### The Problem

When an admin sets a new password for a user via the password reset management interface, the user **cannot sign in** with the new password. The system shows "Sign In Error".

### Technical Analysis

| Component | Hashing Algorithm | Library |
|-----------|------------------|---------|
| **Convex Auth (Sign In)** | Scrypt | Lucia (`lucia/scrypt`) |
| **Current Reset Function** | SHA-256 | Native Web Crypto |

### The Mismatch

**Convex Auth uses Scrypt (line 27, 154 in Password.js):**
```javascript
import { Scrypt } from "lucia";

async hashSecret(password) {
    return await new Scrypt().hash(password);
}

async verifySecret(password, hash) {
    return await new Scrypt().verify(hash, password);
}
```

**Current buggy implementation (passwordResetManagement.ts:366-391):**
```typescript
async function hashPassword(password: string): Promise<string> {
  // ❌ WRONG: Uses SHA-256, should use Scrypt
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  return btoa(String.fromCharCode(...result));
}
```

### Why It Fails

1. Admin sets password → stored as SHA-256 hash
2. User tries to sign in → Convex Auth calls `verifySecret()` with Scrypt
3. Scrypt tries to verify against SHA-256 hash → **Invalid credentials**

---

## Solution Options

### Option A: Use Lucia's Scrypt in Password Reset (RECOMMENDED)

**Approach:** Import and use `Scrypt` from `lucia` in the password reset function.

**Pros:**
- Consistent with Convex Auth
- Industry-standard Scrypt algorithm (memory-hard, slow hashing)
- Minimal code changes

**Cons:**
- Need to ensure Lucia is available in Convex environment
- May need to install `lucia` as explicit dependency

### Option B: Use Convex Auth's `modifyAccountCredentials` API

**Approach:** Use Convex Auth's built-in password change mechanism instead of manually hashing.

**Pros:**
- Uses official API
- Most future-proof
- Handles all edge cases

**Cons:**
- Requires refactoring the entire password reset flow
- More complex implementation

### Decision: **Option A** (Immediate Fix)

---

## Implementation Plan

### Phase 1: Fix the Hashing Algorithm (30 min)

#### Step 1.1: Install Lucia Dependency

```bash
npm install lucia
```

#### Step 1.2: Update `convex/passwordResetManagement.ts`

**Replace lines 366-391:**

```typescript
// ❌ REMOVE THIS ENTIRE FUNCTION
async function hashPassword(password: string): Promise<string> {
  // ... SHA-256 implementation
}
```

**Replace with:**

```typescript
// ✅ CORRECT: Use Lucia's Scrypt (same as Convex Auth)
import { Scrypt } from "lucia";

async function hashPassword(password: string): Promise<string> {
  return await new Scrypt().hash(password);
}
```

**Update the password update logic (lines 142-166):**

```typescript
// Before (line 146):
const hashedPassword = await hashPassword(args.newPassword);

// After:
const hashedPassword = await hashPassword(args.newPassword);
// Note: The variable name stays the same, only the hash function changes
```

### Phase 2: Test the Fix (30 min)

#### Step 2.1: Test Scrypt Hashing

```typescript
// Create a test script to verify Scrypt works
import { Scrypt } from "lucia";

async function testScrypt() {
  const password = "Uw9Q*WpP";
  const hash = await new Scrypt().hash(password);
  const isValid = await new Scrypt().verify(hash, password);
  console.log("Hash:", hash);
  console.log("Valid:", isValid); // Should be true
}
```

#### Step 2.2: End-to-End Test

1. Go to `/forgot-password`
2. Submit a reset request for test user
3. As admin, approve and set new password
4. Try to sign in with new password
5. **Expected:** Sign in succeeds ✅

### Phase 3: Migration Strategy (15 min)

#### Problem
Users who already had their passwords reset with SHA-256 **still cannot log in**.

#### Solution: Re-reset Affected Users

Since this is a government system with limited users, the safest approach is:

1. Identify affected users (those with recent password resets)
2. Have admins re-reset their passwords using the fixed system
3. Communicate with affected users

**Query to identify affected users:**
```typescript
// convex/passwordResetManagement.ts - add this query
export const getRecentApprovedRequests = query({
  args: {
    since: v.number(), // timestamp
  },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("passwordResetRequests")
      .withIndex("status", (q) => q.eq("status", "approved"))
      .filter((q) => q.gt(q.field("passwordChangedAt"), args.since))
      .collect();
    
    return requests;
  },
});
```

### Phase 4: Regression Testing (30 min)

#### Test Cases

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| TC1: Password Reset Flow | Request reset → Admin approve → Sign in | Success |
| TC2: Password Validation | Set weak password ("123") | Error: "Password must contain..." |
| TC3: Wrong Password | Sign in with wrong password | Error: "Incorrect Password" |
| TC4: Rate Limiting | Submit 4 reset requests | Error: "Maximum attempts reached" |
| TC5: Pending Request | Submit while pending exists | Error: "Already have pending request" |
| TC6: Admin Rejection | Reject request → Try again | Can submit new request |

---

## Code Changes

### File 1: `convex/passwordResetManagement.ts`

```typescript
// Add at the top with other imports
import { Scrypt } from "lucia";

// Replace the hashPassword function (lines 366-391)
/**
 * Hash password using Scrypt (must match Convex Auth's algorithm)
 * SECURITY: This ensures password hashes are compatible with Convex Auth's verifySecret
 */
async function hashPassword(password: string): Promise<string> {
  return await new Scrypt().hash(password);
}
```

### File 2: `package.json`

```json
{
  "dependencies": {
    // Add this if not present
    "lucia": "^3.x.x"
  }
}
```

---

## Verification Steps

### Pre-Deployment Checklist

- [ ] `npm install lucia` executed successfully
- [ ] `hashPassword` function updated to use `Scrypt`
- [ ] TypeScript compilation passes (`npm run build` or `npx tsc`)
- [ ] Convex functions deploy successfully (`npx convex dev` or `npx convex deploy`)

### Post-Deployment Verification

- [ ] Can submit password reset request
- [ ] Admin can approve and set new password
- [ ] User can sign in with new password
- [ ] Wrong password is rejected
- [ ] Rate limiting still works
- [ ] Audit logs are created

---

## Rollback Plan

If issues occur:

1. Revert `convex/passwordResetManagement.ts` to previous version
2. Redeploy Convex functions
3. Communicate with users to hold off password resets

---

## Security Considerations

### Why Scrypt is Better Than SHA-256 for Passwords

| Feature | Scrypt | SHA-256 |
|---------|--------|---------|
| **Algorithm Type** | Memory-hard KDF | Fast hash |
| **Brute Force Resistance** | High (slow + memory) | Low (fast GPUs) |
| **Password Storage** | ✅ Recommended | ❌ Not recommended |
| **Used By** | Convex Auth, modern systems | Legacy systems |

### Password Security Checklist

- [x] Passwords hashed with memory-hard algorithm (Scrypt)
- [x] Plain text passwords never stored
- [x] Old password hash permanently replaced
- [x] Audit trail maintained
- [x] Admin-only access enforced
- [x] Rate limiting prevents abuse

---

## Timeline

| Phase | Duration | Owner |
|-------|----------|-------|
| Implementation (Phase 1) | 30 min | Backend Developer |
| Testing (Phase 2) | 30 min | QA Engineer |
| Migration (Phase 3) | 15 min | System Admin |
| Regression Testing (Phase 4) | 30 min | QA Engineer |
| **Total** | **~2 hours** | - |

---

## References

- [Lucia Documentation](https://lucia-auth.com/)
- [Convex Auth Password Provider](node_modules/@convex-dev/auth/dist/providers/Password.js)
- [OWASP Password Storage Guidelines](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)

---

## Update: Staging Environment Fix (2026-02-03)

### Problem Discovered After Initial Fix

The initial fix (`import { Scrypt } from "lucia"`) worked locally but failed in staging (Vercel/Convex) with a generic "Server Error".

### Root Cause

The `lucia` package uses ESM with multiple dependencies (`@oslojs/encoding`, `@oslojs/crypto`). Convex's serverless bundler doesn't properly resolve these transitive dependencies when importing from `lucia` directly.

### Solution: Self-Contained Scrypt Implementation

Created `convex/lib/scrypt.ts` with a self-contained Scrypt implementation that:
- Has no external dependencies (uses only Web Crypto API)
- Produces hashes compatible with Lucia/Convex Auth format
- Works in all environments (local, staging, production)

### Updated Implementation

```typescript
// convex/passwordResetManagement.ts
import { Scrypt } from "./lib/scrypt";  // Local implementation

async function hashPassword(password: string): Promise<string> {
  return await new Scrypt().hash(password);
}
```

### Files Added/Modified

| File | Change |
|------|--------|
| `convex/lib/scrypt.ts` | NEW - Self-contained Scrypt class |
| `convex/passwordResetManagement.ts` | Import from `./lib/scrypt` instead of `lucia` |

### Why This Works

1. No external dependency resolution needed
2. Pure JavaScript/TypeScript code bundled directly
3. Uses Web Crypto API (available everywhere)
4. Same hash format (`salt:hash`) as Lucia

---

**Plan Version:** 2.0
**Created:** 2026-02-02
**Updated:** 2026-02-03 (Staging fix)
**Reviewers:** Security/Auth Specialist, QA Testing Agent, Backend Architect
