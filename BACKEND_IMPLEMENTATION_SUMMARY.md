# Inspection System Upgrade V2 - Backend Implementation

## ✅ Completed Changes

### 1. Schema Updates (`convex/schema/inspections.ts`)

#### Changed Fields
| Field | Change |
|-------|--------|
| `inspectionDate` → `inspectionDateTime` | More precise datetime (Unix timestamp) |

#### New Location Fields (All Optional)
| Field | Type | Description |
|-------|------|-------------|
| `locationLatitude` | number | GPS latitude (decimal degrees) |
| `locationLongitude` | number | GPS longitude (decimal degrees) |
| `locationAccuracy` | number | GPS accuracy in meters |
| `barangay` | string | Barangay name |
| `municipality` | string | Municipality or City |
| `province` | string | Province name |
| `siteMarkerKilometer` | number | KM marker for roads/highways |
| `siteMarkerDescription` | string | Landmark reference |
| `mapUrl` | string | Auto-generated Google Maps link |

#### New Scheduling Fields (All Optional)
| Field | Type | Description |
|-------|------|-------------|
| `scheduledDate` | number | Originally scheduled for this date |
| `isRescheduled` | boolean | Was this inspection moved? |
| `rescheduleReason` | string | Why moved? |
| `previousScheduledDate` | number | Audit trail of original date |
| `inspectionStartTime` | number | When inspection began |
| `inspectionEndTime` | number | When inspection ended |
| `durationMinutes` | number | Auto-calculated duration |

#### Updated Indexes
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

### 2. Mutations Updated (`convex/inspections.ts`)

#### `createInspection`
- ✅ Changed `inspectionDate` → `inspectionDateTime` (required)
- ✅ Added all location fields (optional)
- ✅ Added all scheduling fields (optional)

#### `updateInspection`
- ✅ Changed `inspectionDate` → `inspectionDateTime` (optional)
- ✅ Added all location fields (optional)
- ✅ Added all scheduling fields (optional)

#### Query Sorting Updates
- ✅ Updated all `inspectionDate` → `inspectionDateTime` references
- ✅ Sorting by datetime now uses `inspectionDateTime`

### 3. Migration Scripts (`convex/migrations/migrateInspectionsV2.ts`)

#### `migrateInspectionsV2`
Main migration mutation:
- Copies `inspectionDate` → `inspectionDateTime`
- Sets `isRescheduled: false` for existing records
- Leaves location fields empty (to be filled via GPS later)

#### `getMigrationStatus`
Check migration progress:
- Returns count of records needing migration
- Returns count of already migrated records

#### `backfillLocationFromRemarks`
Optional best-effort migration:
- Attempts to extract location from remarks text
- Patterns: municipality, barangay, KM markers
- Runs in dry-run mode by default

---

## 🚀 Deployment Steps

### Step 1: Deploy Schema
```bash
npx convex dev
# or for production:
npx convex deploy
```

### Step 2: Run Migration
```bash
# Check status first
npx convex run migrations/migrateInspectionsV2:getMigrationStatus

# Run migration
npx convex run migrations/migrateInspectionsV2:migrateInspectionsV2
```

### Step 3: Verify Migration
```bash
npx convex run migrations/migrateInspectionsV2:getMigrationStatus
# Should show: isComplete: true, needsMigration: 0
```

### Step 4: Optional - Backfill Location
```bash
# Dry run first
npx convex run migrations/migrateInspectionsV2:backfillLocationFromRemarks '{"dryRun": true}'

# Apply if results look good
npx convex run migrations/migrateInspectionsV2:backfillLocationFromRemarks '{"dryRun": false}'
```

---

## 📝 API Usage Examples

### Create Inspection with Location
```typescript
await createInspection({
  projectId: "...",
  title: "Road Inspection KM 125",
  inspectionDateTime: Date.now(), // REQUIRED
  
  // Location (optional)
  locationLatitude: 14.5995,
  locationLongitude: 120.9842,
  locationAccuracy: 5.0,
  barangay: "Poblacion",
  municipality: "San Jose",
  province: "Occidental Mindoro",
  siteMarkerKilometer: 125.450,
  siteMarkerDescription: "Near Shell Gas Station",
  mapUrl: "https://maps.google.com/?q=14.5995,120.9842",
  
  // Scheduling (optional)
  scheduledDate: Date.now(),
  inspectionStartTime: Date.now(),
  inspectionEndTime: Date.now() + 3600000, // 1 hour later
  durationMinutes: 60,
  
  // ... other fields
});
```

### Update Inspection Schedule
```typescript
await updateInspection({
  inspectionId: "...",
  isRescheduled: true,
  rescheduleReason: "Heavy rain",
  previousScheduledDate: originalDate,
  scheduledDate: newDate,
});
```

---

## 📊 Migration Status

| Item | Status |
|------|--------|
| Schema updated | ✅ Complete |
| Mutations updated | ✅ Complete |
| Migration scripts | ✅ Complete |
| Type generation | ✅ Complete |
| Data migration | ⏳ Run manually |

---

## ⚠️ Breaking Changes

1. **Frontend must update**: Change `inspectionDate` → `inspectionDateTime` in all API calls
2. **TypeScript types**: Regenerated types now use `inspectionDateTime`
3. **Sorting**: All date sorting now uses `inspectionDateTime`

---

## Next Steps

1. ✅ Backend implementation complete
2. ⏳ Run migration on dev environment
3. ⏳ Update frontend forms
4. ⏳ Test GPS capture functionality
5. ⏳ Deploy to production
6. ⏳ Run migration on production
