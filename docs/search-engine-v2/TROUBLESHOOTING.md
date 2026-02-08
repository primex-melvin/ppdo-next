# Search Engine Troubleshooting Guide

## 🔴 Critical Issue: "BOOM" Not Appearing in Search

### Problem
Searching for "boom" returns 0 results, but the project exists in database.

### Diagnostic Steps

#### Step 1: Check Index Status
```bash
# In Convex Dashboard, run:
npx convex dev

# Check if "BOOM" is in searchIndex table
```

Expected query:
```typescript
// convex/search/debug.ts
export const checkIndex = query({
  args: { entityId: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("searchIndex")
      .filter(q => q.eq(q.field("entityId"), args.entityId))
      .collect();
    return entries;
  }
});

// Check: checkIndex({ entityId: "boom_project_id" })
```

#### Step 2: Verify Indexing Logic
Check if `indexEntity` is called when projects are created/updated.

```typescript
// convex/projects.ts - create mutation
export const create = mutation({
  handler: async (ctx, args) => {
    // ... create project ...
    
    // MUST have this:
    await indexEntity(ctx, {
      entityType: "project",
      entityId: projectId,
      primaryText: args.particulars,  // "BOOM"
      secondaryText: args.implementingOffice,
      // ...
    });
  }
});
```

#### Step 3: Check Search Logic
Verify search is not filtering out results incorrectly.

```typescript
// In convex/search/index.ts - search query

// Problem: Case-sensitive matching
if (entry.normalizedPrimaryText.includes(normalizedQuery)) {
  // This should match "boom" in "BOOM"
}

// Debug: Log what we're comparing
console.log("Entry text:", entry.normalizedPrimaryText);
console.log("Query:", normalizedQuery);
console.log("Match:", entry.normalizedPrimaryText.includes(normalizedQuery));
```

#### Step 4: Check Reindex Status
Run reindex to ensure all data is indexed:

1. Go to `/admin/search`
2. Click "Reindex All"
3. Wait for completion
4. Check "Projects" shows indexed count

#### Step 5: Direct Database Check
```typescript
// Check if project exists
const project = await ctx.db.get(projectId);
console.log("Project:", project);

// Check if indexed
const indexEntries = await ctx.db
  .query("searchIndex")
  .withIndex("entityTypeAndId", q => 
    q.eq("entityType", "project").eq("entityId", projectId)
  )
  .collect();
console.log("Index entries:", indexEntries);
```

### Common Causes

| Cause | Symptom | Fix |
|-------|---------|-----|
| Not indexed | Index shows 0 entries | Run reindexAll mutation |
| Case mismatch | "BOOM" vs "boom" | Use normalizeText() |
| isDeleted flag | entry.isDeleted = true | Filter check |
| Wrong entityType | Indexed as "user" not "project" | Fix indexEntity call |
| Token mismatch | Query tokenized differently | Check tokenizeText() |

### Quick Fixes

#### Fix 1: Force Reindex
```typescript
// Run in Convex dashboard
await api.search.reindexAll();
```

#### Fix 2: Check Normalization
```typescript
// Both should be lowercase
normalizeText("BOOM") === "boom"
normalizeText("boom") === "boom"
```

#### Fix 3: Verify Filters
```typescript
// Remove strict filters temporarily
let results = allEntries;

// Comment out filters one by one:
// if (excludeDeleted) { ... }
// if (args.entityTypes) { ... }
// etc.
```

### Testing Queries

#### Test 1: Direct Index Query
```typescript
// Get all project index entries
const projects = await ctx.db
  .query("searchIndex")
  .filter(q => q.eq(q.field("entityType"), "project"))
  .collect();

console.log("Total projects indexed:", projects.length);
console.log("Project names:", projects.map(p => p.primaryText));
```

Expected output:
```
Total projects indexed: 2
Project names: ["LJ", "BOOM"]
```

#### Test 2: Search Debug
```typescript
// Add to search query
console.log("=== SEARCH DEBUG ===");
console.log("Query:", args.query);
console.log("Normalized:", normalizedQuery);
console.log("Tokens:", queryTokens);
console.log("Total entries:", allEntries.length);
console.log("After filters:", filtered.length);
console.log("After scoring:", rankedResults.length);
```

### Resolution

Once fixed, searching "boom" should return:
```json
{
  "results": [{
    "indexEntry": {
      "entityType": "project",
      "primaryText": "BOOM",
      "secondaryText": "..."
    },
    "relevanceScore": 1.0,
    "highlights": {
      "primaryText": "<mark>BOOM</mark>"
    }
  }],
  "totalCount": 1
}
```

### Prevention

1. **Auto-index on create/update** - Ensure indexEntity called
2. **Periodic reindexing** - Weekly cron job
3. **Index health dashboard** - Monitor coverage at /admin/search
4. **Test search** - Unit tests for each entity type
