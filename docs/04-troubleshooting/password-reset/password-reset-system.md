# Password Reset System Documentation

## Overview

The Password Reset System is a secure, admin-mediated password recovery mechanism for the PPDO (Provincial Planning and Development Office) government management system. Unlike traditional automated email-based password resets, this system uses an approval workflow where administrators manually review and approve password reset requests, providing an additional layer of security for sensitive government data.

---

## Table of Contents

1. [User Flow](#user-flow)
2. [Frontend Implementation](#frontend-implementation)
3. [Backend Implementation](#backend-implementation)
4. [Security Features](#security-features)
5. [Admin Management Interface](#admin-management-interface)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Rate Limiting & Abuse Prevention](#rate-limiting--abuse-prevention)

---

## User Flow

### For End Users (Forgot Password)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User clicks   │────▶│  Enters email    │────▶│ System validates│
│ "Forgot password"│    │   and message    │     │  email exists   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
┌─────────────────┐     ┌──────────────────┐              │
│  Admin reviews  │◀────│ Request queued   │◀─────────────┘
│    request      │     │   for review     │
└─────────────────┘     └──────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Admin sets new │────▶│  User notified   │────▶│  User logs in   │
│    password     │     │  (via security   │     │  with new pass  │
└─────────────────┘     │     alert)       │     └─────────────────┘
                        └──────────────────┘
```

### Entry Points

| Route | Description | Access |
|-------|-------------|--------|
| `/forgot-password` | Public password reset request form | Public |
| `/signin` | Contains "Forgot password?" link | Public |
| `/dashboard/settings/user-management/password-reset-management` | Admin management interface | Admin/Super Admin |

---

## Frontend Implementation

### 1. Forgot Password Page (`/forgot-password`)

**File:** `app/(auth)/forgot-password/page.tsx`

#### Key Features

| Feature | Description |
|---------|-------------|
| **Location Detection** | Auto-detects user's IP and geolocation using multiple fallback services |
| **Rate Limit Display** | Shows remaining attempts and countdown timer in real-time |
| **Optional Message** | Users can add context for their reset request |
| **Security Metadata** | Captures IP, user agent, and geolocation for admin review |

#### Location Detection Flow

```typescript
// Primary: Browser Geolocation API
navigator.geolocation.getCurrentPosition()
  ↓ (fallback if denied/fails)
// Secondary: IP-based geolocation (ipapi.co)
fetch(`https://ipapi.co/${ip}/json/`)
  ↓ (fallback if fails)
// Final: "Unknown" location
```

#### UI Components

```typescript
// Real-time status display
interface ResetStatus {
  canSubmit: boolean;        // Whether form can be submitted
  attemptsRemaining: number; // 0-3 attempts left today
  remainingSeconds: number;  // Cooldown timer
}
```

#### Form Submission Data

```typescript
interface PasswordResetRequest {
  email: string;           // User's email address
  message?: string;        // Optional context message
  ipAddress: string;       // Client IP address
  userAgent?: string;      // Browser user agent
  geoLocation?: string;    // JSON string of location data
}
```

### 2. Sign In Page Integration

**File:** `app/(auth)/signin/page.tsx`

The sign-in page includes a "Forgot password?" link that redirects to `/forgot-password`:

```tsx
<Link href="/forgot-password" className="text-sm text-zinc-600 hover:text-zinc-900">
  Forgot password?
</Link>
```

### 3. Admin Management Interface

**File:** `app/(private)/dashboard/settings/user-management/password-reset-management/page.tsx`

#### Access Control

```typescript
// Only admins and super_admins can access
if (!isAdmin && !isSuperAdmin) {
  return <AccessDenied />;
}
```

#### Features

| Feature | Description |
|---------|-------------|
| **Statistics Dashboard** | Shows pending, approved, and rejected request counts |
| **Search & Filter** | Filter by email, name, IP, or status |
| **Approve Action** | Set new password with auto-generated strong password |
| **Reject Action** | Reject request with optional admin notes |
| **Password Generator** | Auto-generates 8-character strong passwords |
| **Copy to Clipboard** | One-click password copying |
| **Password Strength** | Visual indicator of password strength |

#### Password Requirements

```typescript
const requirements = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSymbol: /[!@#$%^&*]/
};
```

---

## Backend Implementation

### 1. Password Reset Requests (`convex/passwordReset.ts`)

#### Mutations

| Mutation | Description | Rate Limited |
|----------|-------------|--------------|
| `submitPasswordResetRequest` | Creates a new reset request | Yes (1 min, 3/day) |
| `checkResetRequestStatus` | Gets current rate limit status | No |
| `getUserPasswordResetRequests` | Gets user's request history | No |
| `getAllPasswordResetRequests` | Admin: lists all requests | No |

#### Rate Limiting Logic

```typescript
// Daily limit: 3 attempts per email
const MAX_DAILY_ATTEMPTS = 3;

// Rate limit: 1 minute between requests
const RATE_LIMIT_MS = 60000; // 60 seconds

// Check daily attempt limit
if (attemptRecord && attemptRecord.attemptCount >= 3) {
  throw new Error("Maximum attempts reached. Try again tomorrow.");
}

// Check rate limit
if (attemptRecord && (now - attemptRecord.lastAttemptAt) < 60000) {
  const remainingSeconds = Math.ceil((60000 - (now - attemptRecord.lastAttemptAt)) / 1000);
  throw new Error(`Please wait ${remainingSeconds} seconds.`);
}
```

#### Security Alert Creation

Every password reset request creates a security alert for admins:

```typescript
await ctx.db.insert("securityAlerts", {
  type: "suspicious_login",
  severity: "low",
  userId: user._id,
  title: "Password Reset Requested",
  description: `Password reset requested for ${email} from ${ipAddress}`,
  status: "open",
  createdAt: now,
});
```

### 2. Password Reset Management (`convex/passwordResetManagement.ts`)

#### Admin-Only Mutations

| Mutation | Description | Required Role |
|----------|-------------|---------------|
| `updateRequestStatus` | Approve or reject a request | admin/super_admin |
| `setNewPassword` | Set new password for user | admin/super_admin |
| `getRequestDetails` | Get detailed request info | admin/super_admin |
| `cleanupOldRequests` | Delete old requests | super_admin |

#### Password Hashing (Security Critical)

```typescript
async function hashPassword(password: string): Promise<string> {
  // Generate random salt (16 bytes)
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  
  // Convert password to bytes
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Combine salt and password
  const combined = new Uint8Array(saltBytes.length + passwordBytes.length);
  combined.set(saltBytes);
  combined.set(passwordBytes, saltBytes.length);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Combine salt and hash for storage
  const result = new Uint8Array(saltBytes.length + hashArray.length);
  result.set(saltBytes);
  result.set(hashArray, saltBytes.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...result));
}
```

> **Security Note:** The plain text password is NEVER stored. Only the hash is saved, and the old password hash is permanently replaced.

#### Account Unlock

When a password is reset, the user's account is automatically unlocked:

```typescript
await ctx.db.patch(request.userId, {
  failedLoginAttempts: 0,
  isLocked: false,
  lockReason: undefined,
  lockedAt: undefined,
  updatedAt: now,
});
```

---

## Security Features

### 1. Information Disclosure Prevention

```typescript
// Don't reveal if user exists or not
if (!user) {
  throw new Error("If this email is registered, a password reset request will be submitted.");
}
```

### 2. Duplicate Request Prevention

```typescript
// Check for pending requests
const pendingRequest = await ctx.db
  .query("passwordResetRequests")
  .withIndex("emailAndStatus", (q) => q.eq("email", args.email).eq("status", "pending"))
  .first();

if (pendingRequest) {
  throw new Error("You already have a pending password reset request.");
}
```

### 3. Audit Trail

All actions are logged in `userAuditLog`:

```typescript
await ctx.db.insert("userAuditLog", {
  performedBy: currentUserId,
  targetUserId: request.userId,
  action: "user_updated",
  notes: "Password reset approved by administrator",
  previousValues: JSON.stringify({ status: request.status }),
  newValues: JSON.stringify({ status: "approved", passwordChanged: true }),
  timestamp: now,
});
```

### 4. Role-Based Access Control

```typescript
// Only super_admin and admin can manage password resets
if (currentUser.role !== "super_admin" && currentUser.role !== "admin") {
  throw new Error("Not authorized - administrator access required");
}
```

---

## Admin Management Interface

### Dashboard Statistics

The admin interface displays three key metrics:

| Metric | Icon | Description |
|--------|------|-------------|
| **Pending** | ⏳ Clock | Requests awaiting review |
| **Approved** | ✅ CheckCircle | Successfully processed requests |
| **Rejected** | ❌ XCircle | Denied requests |

### Request Table Columns

| Column | Information Displayed |
|--------|----------------------|
| **User** | Name and email of requester |
| **Request Details** | IP address and optional message |
| **Status** | Pending / Approved / Rejected badge |
| **Requested** | Formatted timestamp |
| **Actions** | Set Password / Reject buttons |

### Approval Modal Features

```
┌─────────────────────────────────────┐
│  Set New Password                   │
│  user@example.com                   │
├─────────────────────────────────────┤
│                                     │
│  New Password *    [🔄 Generate]   │
│  ┌─────────────────────────────┐   │
│  │ ▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪▪    [👁][📋]│   │
│  └─────────────────────────────┘   │
│                                     │
│  Strength: ████████░░ Strong        │
│                                     │
│  ℹ️ Security Notice:                │
│  • Strong password auto-generated   │
│  • You can show/hide or copy        │
│  • Regenerate if needed             │
│                                     │
│  [Cancel]        [Set Password]     │
└─────────────────────────────────────┘
```

---

## Database Schema

### Tables

#### 1. `passwordResetRequests`

| Field | Type | Description |
|-------|------|-------------|
| `email` | `string` | Requester's email address |
| `userId` | `optional<id("users")>` | Linked user account |
| `message` | `optional<string>` | Optional user message |
| `status` | `union("pending", "approved", "rejected")` | Request status |
| `ipAddress` | `string` | Client IP address |
| `userAgent` | `optional<string>` | Browser user agent |
| `geoLocation` | `optional<string>` | JSON location data |
| `requestedAt` | `number` | Timestamp (ms) |
| `reviewedBy` | `optional<id("users")>` | Admin who processed |
| `reviewedAt` | `optional<number>` | Review timestamp |
| `adminNotes` | `optional<string>` | Admin's notes |
| `newPasswordHash` | `optional<string>` | Hash only, never plain text |
| `passwordChangedAt` | `optional<number>` | When password was set |
| `passwordChangedBy` | `optional<id("users")>` | Admin who set password |

**Indexes:**
- `email` - Lookup by email
- `userId` - Lookup by user
- `status` - Filter by status
- `requestedAt` - Sort by date
- `emailAndStatus` - Combined lookup
- `reviewedBy` - Find by reviewer

#### 2. `passwordResetAttempts`

| Field | Type | Description |
|-------|------|-------------|
| `email` | `string` | Attempting email |
| `dateKey` | `string` | Date in YYYY-MM-DD format |
| `attemptCount` | `number` | Number of attempts today |
| `lastAttemptAt` | `number` | Last attempt timestamp |
| `ipAddresses` | `optional<string>` | JSON array of IPs used |

**Indexes:**
- `emailAndDate` - Primary lookup for rate limiting
- `email` - Find all attempts by email
- `dateKey` - Cleanup old records

---

## API Reference

### Public APIs

#### `submitPasswordResetRequest`

Creates a new password reset request.

```typescript
// Args
{
  email: string;
  message?: string;
  ipAddress: string;
  userAgent?: string;
  geoLocation?: string;
}

// Returns
{
  success: true;
  message: "Password reset request submitted successfully...";
}

// Errors
- "If this email is registered, a password reset request will be submitted."
- "You have reached the maximum number of password reset requests for today."
- "Please wait X seconds before submitting another request."
- "You already have a pending password reset request."
```

#### `checkResetRequestStatus`

Checks rate limit status for an email.

```typescript
// Args
{ email: string }

// Returns
{
  canSubmit: boolean;
  attemptsRemaining: number; // 0-3
  remainingSeconds: number;  // 0-60
}
```

### Admin APIs

#### `getAllPasswordResetRequests`

Lists all password reset requests (enriched with user data).

```typescript
// Args (optional)
{ status?: "pending" | "approved" | "rejected" }

// Returns
Array<{
  ...passwordResetRequest,
  userName?: string;
  userDepartment?: string;
  reviewedByName?: string;
  passwordChangedByName?: string;
}>
```

#### `setNewPassword`

Approves request and sets new password.

```typescript
// Args
{
  requestId: Id<"passwordResetRequests">;
  newPassword: string;
  adminNotes?: string;
}

// Returns
{
  success: true;
  message: "Password reset completed successfully...";
}

// Errors
- "Authentication required"
- "Not authorized - administrator access required"
- "Password must be at least 8 characters long"
- "Password must contain at least one uppercase letter..."
```

#### `updateRequestStatus`

Rejects a request (or updates status).

```typescript
// Args
{
  requestId: Id<"passwordResetRequests">;
  status: "approved" | "rejected";
  adminNotes?: string;
}
```

---

## Rate Limiting & Abuse Prevention

### Limits

| Limit | Value | Purpose |
|-------|-------|---------|
| **Daily Attempts** | 3 per email | Prevent brute force enumeration |
| **Rate Limit** | 1 minute between requests | Prevent spam |
| **Pending Check** | 1 pending request max | Prevent queue flooding |

### Attempt Tracking

Attempts are tracked per email per day:

```typescript
// Key format: YYYY-MM-DD
const todayKey = new Date(now).toISOString().split('T')[0];

// Tracks:
// - attemptCount: Number of attempts today
// - lastAttemptAt: Timestamp of last attempt
// - ipAddresses: All IPs used (for fraud detection)
```

### Error Messages

All error messages are user-friendly and don't reveal sensitive information:

| Scenario | Error Message |
|----------|--------------|
| User not found | "If this email is registered, a password reset request will be submitted." |
| Daily limit exceeded | "You have reached the maximum number of password reset requests for today." |
| Rate limit | "Please wait X seconds before submitting another request." |
| Pending exists | "You already have a pending password reset request." |

---

## Files Reference

### Frontend

| File | Purpose |
|------|---------|
| `app/(auth)/forgot-password/page.tsx` | Public password reset request form |
| `app/(auth)/signin/page.tsx` | Sign in with forgot password link |
| `app/(private)/dashboard/settings/user-management/password-reset-management/page.tsx` | Admin management interface |

### Backend

| File | Purpose |
|------|---------|
| `convex/passwordReset.ts` | Public password reset mutations/queries |
| `convex/passwordResetManagement.ts` | Admin-only management mutations |
| `convex/schema/passwordReset.ts` | Database schema definitions |

---

## Compliance & Best Practices

### Data Privacy Act (RA 10173) Compliance

1. **Minimal Data Collection**: Only necessary metadata is collected (IP, location for security)
2. **No Password Storage**: Plain text passwords are never stored
3. **Audit Trail**: All actions are logged for accountability
4. **Access Control**: Only authorized admins can reset passwords
5. **Data Retention**: Old requests can be cleaned up (super_admin only)

### Security Best Practices

1. **Rate Limiting**: Prevents abuse and enumeration attacks
2. **Role-Based Access**: Only admins can manage resets
3. **Secure Hashing**: SHA-256 with salt for password storage
4. **Audit Logging**: All actions tracked in `userAuditLog`
5. **Security Alerts**: Admins notified of all reset requests
6. **Account Unlock**: Automatic unlock on successful reset

---

## Future Enhancements

Potential improvements for consideration:

1. **Email Notifications**: Send email to user when password is reset
2. **SMS Notifications**: Optional SMS for high-security accounts
3. **Self-Service Reset**: Optional email-based automated reset for less sensitive accounts
4. **Temporary Passwords**: Option to generate one-time temporary passwords
5. **Password History**: Prevent reuse of recent passwords

---

**Document Version:** 1.0  
**Last Updated:** 2026-02-02  
**Maintained by:** Backend/Convex Architect, Frontend/React Specialist, Product Documentation Lead
