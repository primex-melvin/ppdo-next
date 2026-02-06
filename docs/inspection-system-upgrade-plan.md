# Inspection System Upgrade Plan (Simplified)
## Minimal Field Enhancements for PPDO Projects

**Version:** 2.0 - Lean Edition  
**Context:** Philippine Provincial Planning and Development Office (PPDO)  
**Focus:** Location tracking + DateTime precision only

---

## Executive Summary

This is a **minimal, focused upgrade** that adds only two critical capabilities:
1. **Precise location tracking** (GPS coordinates, barangay, site markers)
2. **Better date/time handling** (datetime precision, scheduling, reschedules)

All other fields remain as free-text in the existing `remarks` field.

---

## Proposed Schema Changes

### 1. LOCATION & GEOGRAPHY (Optional)

```typescript
// NEW: Precise geolocation
locationLatitude?: number;        // GPS coordinates (decimal degrees)
locationLongitude?: number;       // GPS coordinates (decimal degrees)
locationAccuracy?: number;        // GPS accuracy in meters (e.g., 5.0)

// NEW: Philippine location structure
barangay?: string;                // Barangay name
municipality?: string;            // Municipality or City
province?: string;                // Province name

// NEW: Site identifiers for infrastructure
siteMarkerKilometer?: number;     // For highways/roads (e.g., 125.450 = KM 125+450)
siteMarkerDescription?: string;   // "Near Shell Gas Station", "Before bridge"

// NEW: Map integration
mapUrl?: string;                  // Auto-generated Google Maps link
```

**Usage:**
- Inspector taps "Get Location" → Auto-fills all fields
- Optional manual edit for accuracy
- Map URL auto-generated from lat/long

---

### 2. DATE & TIME (Required + Optional)

```typescript
// CHANGE: inspectionDate → inspectionDateTime (more precise)
inspectionDateTime: number;       // Unix timestamp (REQUIRED, replaces inspectionDate)

// NEW: Scheduling metadata (all optional)
scheduledDate?: number;           // Originally scheduled for this date
isRescheduled?: boolean;          // Was this inspection moved?
rescheduleReason?: string;        // Why moved? (e.g., "Heavy rain", "Contractor request")
previousScheduledDate?: number;   // Audit trail of original date

// NEW: Time tracking (optional)
inspectionStartTime?: number;     // When inspection began
inspectionEndTime?: number;       // When inspection ended
durationMinutes?: number;         // Auto-calculated duration
```

**Usage:**
- `inspectionDateTime`: When the inspection actually occurred
- `scheduledDate`: When it was supposed to happen (if different)
- Track reschedules for contractor/LGU accountability

---

## Complete Updated Schema

```typescript
inspections: defineTable({
  // ============================================================================
  // REQUIRED CORE FIELDS (Unchanged)
  // ============================================================================
  projectId: v.id("projects"),
  budgetItemId: v.optional(v.id("budgetItems")),
  programNumber: v.string(),
  title: v.string(),
  category: v.string(),
  remarks: v.string(),               // Free-text for everything else
  status: v.union(
    v.literal("completed"),
    v.literal("in_progress"),
    v.literal("pending"),
    v.literal("cancelled")
  ),
  viewCount: v.number(),
  uploadSessionId: v.optional(v.id("uploadSessions")),
  
  // ============================================================================
  // CHANGED: inspectionDate → inspectionDateTime
  // ============================================================================
  inspectionDateTime: v.number(),    // REQUIRED - replaces inspectionDate
  
  // ============================================================================
  // NEW: LOCATION FIELDS (All Optional)
  // ============================================================================
  locationLatitude: v.optional(v.number()),
  locationLongitude: v.optional(v.number()),
  locationAccuracy: v.optional(v.number()),
  barangay: v.optional(v.string()),
  municipality: v.optional(v.string()),
  province: v.optional(v.string()),
  siteMarkerKilometer: v.optional(v.number()),     // KM marker for roads/highways
  siteMarkerDescription: v.optional(v.string()),   // Landmark reference
  mapUrl: v.optional(v.string()),
  
  // ============================================================================
  // NEW: SCHEDULING FIELDS (All Optional)
  // ============================================================================
  scheduledDate: v.optional(v.number()),
  isRescheduled: v.optional(v.boolean()),
  rescheduleReason: v.optional(v.string()),
  previousScheduledDate: v.optional(v.number()),
  inspectionStartTime: v.optional(v.number()),
  inspectionEndTime: v.optional(v.number()),
  durationMinutes: v.optional(v.number()),
  
  // ============================================================================
  // AUDIT FIELDS (Unchanged)
  // ============================================================================
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
  updatedBy: v.optional(v.id("users")),
  metadata: v.optional(v.string()),
})
```

---

## Indexes to Add

```typescript
// Location-based queries
.index("locationLatLng", ["locationLatitude", "locationLongitude"])
.index("municipality", ["municipality"])
.index("barangay", ["barangay"])

// Time-based queries  
.index("inspectionDateTime", ["inspectionDateTime"])
.index("scheduledDate", ["scheduledDate"])
.index("isRescheduled", ["isRescheduled"])
```

---

## UI Changes

### Inspection Form - New Fields Section

```
┌─────────────────────────────────────────┐
│  REQUIRED FIELDS                        │
│  • Title*                               │
│  • Program Number*                      │
│  • Category*                            │
│  • Date & Time*                         │
│  • Status*                              │
│  • Remarks*                             │
├─────────────────────────────────────────┤
│  📍 LOCATION (Optional)                 │
│  [📍 Get GPS Location]                  │
│  Latitude: [________]                   │
│  Longitude: [________]                  │
│  Accuracy: [________] meters            │
│  Barangay: [________]                   │
│  Municipality: [________]               │
│  Province: [________]                   │
│  KM Marker: [________] (for roads)      │
│  Landmark: [________]                   │
│  [🔗 View on Map]                       │
├─────────────────────────────────────────┤
│  📅 SCHEDULING (Optional)               │
│  Scheduled Date: [________]             │
│  [✓] Was Rescheduled                    │
│  Reason: [________]                     │
│  Start Time: [________]                 │
│  End Time: [________]                   │
│  Duration: [__] minutes (auto)          │
├─────────────────────────────────────────┤
│  📸 PHOTOS                              │
│  [Upload images...]                     │
└─────────────────────────────────────────┘
```

---

## API Updates

### Mutations to Update

#### `createInspection`
```typescript
args: {
  // ... existing args ...
  
  // CHANGED: inspectionDate → inspectionDateTime
  inspectionDateTime: v.number(),
  
  // NEW: Location (all optional)
  locationLatitude: v.optional(v.number()),
  locationLongitude: v.optional(v.number()),
  locationAccuracy: v.optional(v.number()),
  barangay: v.optional(v.string()),
  municipality: v.optional(v.string()),
  province: v.optional(v.string()),
  siteMarkerKilometer: v.optional(v.number()),
  siteMarkerDescription: v.optional(v.string()),
  mapUrl: v.optional(v.string()),
  
  // NEW: Scheduling (all optional)
  scheduledDate: v.optional(v.number()),
  isRescheduled: v.optional(v.boolean()),
  rescheduleReason: v.optional(v.string()),
  previousScheduledDate: v.optional(v.number()),
  inspectionStartTime: v.optional(v.number()),
  inspectionEndTime: v.optional(v.number()),
  durationMinutes: v.optional(v.number()),
}
```

#### `updateInspection`
Same new args as above, all optional for partial updates.

---

## Migration Plan

### Step 1: Schema Update
```typescript
// convex/schema/inspections.ts
// Add new fields, keep inspectionDate temporarily
```

### Step 2: Data Migration
```typescript
// Migrate existing inspections
for each inspection:
  - inspectionDateTime = inspectionDate (set to midnight)
  - isRescheduled = false
  - All location fields = undefined
```

### Step 3: Code Updates
- Update all `createInspection` calls to use `inspectionDateTime`
- Update all `updateInspection` calls
- Update queries that filter by date

### Step 4: Frontend Update
- Update inspection form with new fields
- Add "Get Location" button with GPS capture
- Auto-generate mapUrl from lat/long

### Step 5: Cleanup (30 days later)
- Remove old `inspectionDate` field
- Update all queries to use `inspectionDateTime`

---

## Implementation Checklist

### Backend (convex/)
- [ ] Update `convex/schema/inspections.ts` with new fields
- [ ] Update `convex/inspections.ts` mutations
- [ ] Add migration script
- [ ] Run `npx convex dev` to regenerate types

### Frontend (components/)
- [ ] Update inspection form with Location section
- [ ] Add GPS capture button
- [ ] Update inspection form with Scheduling section
- [ ] Add map link component
- [ ] Update inspection detail view

### Migration
- [ ] Run migration on dev environment
- [ ] Test all existing inspections still work
- [ ] Deploy to production
- [ ] Run migration on production
- [ ] Verify all data migrated correctly

---

## Benefits

| Stakeholder | Benefit |
|-------------|---------|
| **Inspector** | One-tap GPS capture, map link generation |
| **Boss** | See exact inspection locations on map |
| **COA** | GPS proof that inspection happened at site |
| **Public** | Transparency on where public funds are spent |

---

## What Goes in "Remarks" Field?

Since we're keeping this minimal, put everything else in the free-text remarks:

```
REMARKS EXAMPLE:
================
Weather: Light rain, ground was damp
Contractor Rep: Engr. Juan Santos was present
Progress: Approximately 65% complete
Deficiencies: 
- Pothole at KM 12+450, ~2m diameter
- Faded lane markings need repainting
Action Items:
- Contractor to patch pothole within 48 hours
- Submit concrete test results
Next Inspection: Re-inspect pothole fix on Feb 15
```

Future enhancement: If structured data is needed later, we can parse remarks or add fields then.

---

## Summary

**Adding Only:**
1. ✅ GPS Location (lat, long, accuracy, barangay, municipality, province, KM marker)
2. ✅ DateTime precision + scheduling tracking

**NOT Adding:**
- ❌ Weather data
- ❌ Personnel tracking  
- ❌ Contractor info
- ❌ Structured deficiencies
- ❌ Measurements/testing
- ❌ Follow-up workflow
- ❌ Document references
- ❌ Financial observations

**Keep it simple. Keep it fast. Keep it working.**

---

Ready to implement? Just say go and I'll update the schema, mutations, and frontend.
