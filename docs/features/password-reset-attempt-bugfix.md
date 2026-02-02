# Password Reset Attempt Counter Bug Fix

## Issue Summary

**Problem:** The attempt counter always showed "Attempts remaining today: 3 of 3" even after submitting password reset requests. The counter wasn't decrementing properly.

**Root Cause:** Email case sensitivity mismatch between frontend queries and backend storage.

---

## Changes Made

### 1. Frontend UI Improvements (`app/(auth)/forgot-password/page.tsx`)

#### Status Box Now Shows Contextual Messages:

| Status | Message | Color |
|--------|---------|-------|
| **3 attempts remaining** (fresh user) | "Ready to submit request" + "You have 3 attempts available today." | 🟢 Green |
| **1-2 attempts remaining** | "Attempts used today: X of 3" + "Remaining: Y" | 🟡 Yellow |
| **0 attempts remaining** | "Daily limit reached. Please try again tomorrow." | 🔴 Red |

#### Email Normalization:
```typescript
// Normalize email for consistent query results
const resetStatus = useQuery(
  api.passwordReset.checkResetRequestStatus,
  email ? { email: email.toLowerCase().trim() } : "skip"
);
```

### 2. Backend Email Normalization (`convex/passwordReset.ts`)

All email comparisons now use normalized (lowercase + trimmed) emails:

```typescript
// Normalize email to lowercase for consistent tracking
const normalizedEmail = args.email.toLowerCase().trim();

// Used for all database lookups and inserts:
- User lookup
- Attempt record lookup
- Pending request lookup  
- New attempt record creation
- Password reset request creation
```

---

## Why This Fixes the Bug

### Before (Broken):
1. User types: `"Admin@Gmail.com"`
2. Frontend query looks up: `"Admin@Gmail.com"`
3. Backend creates record with: `"Admin@Gmail.com"` (as-is)
4. Next time, user types: `"admin@gmail.com"`
5. Query looks up: `"admin@gmail.com"` ❌ No match found!
6. System shows: "3 of 3 remaining" (creates new record)

### After (Fixed):
1. User types: `"Admin@Gmail.com"`
2. Frontend normalizes to: `"admin@gmail.com"`
3. Backend creates record with: `"admin@gmail.com"`
4. Next time, user types: `"ADMIN@GMAIL.COM"`
5. Query normalizes to: `"admin@gmail.com"` ✅ Match found!
6. System shows correct count: "2 of 3 remaining"

---

## Testing

### Test Cases:

| Test | Steps | Expected |
|------|-------|----------|
| **Fresh user** | Enter email, don't submit | Shows green "Ready to submit" with 3 attempts |
| **First submit** | Submit request | Counter updates to show 2 remaining |
| **Case sensitivity** | Submit with "Admin@Gmail.com", then check with "admin@gmail.com" | Same counter shown (normalized) |
| **Rate limit** | Submit twice within 1 minute | Shows countdown timer |
| **Daily limit** | Submit 3 times | Shows red "Daily limit reached" |

---

## Deployment

```
✅ TypeScript compilation: PASSED
✅ Convex functions deploy: SUCCESS (23s)
✅ 16 functions ready
```

---

## Files Modified

1. `app/(auth)/forgot-password/page.tsx`
   - Enhanced status box UI with contextual messages
   - Added email normalization in query

2. `convex/passwordReset.ts`
   - Added email normalization in `submitPasswordResetRequest`
   - Added email normalization in `checkResetRequestStatus`

---

**Fix Version:** 1.1  
**Date:** 2026-02-02  
**Status:** ✅ Deployed and Ready
