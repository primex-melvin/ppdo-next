# Extracted Learnings from Completed Tasks

> **Knowledge Base for Future Developers**  
> **Compiled from:** Completed implementation plans, bug fixes, and system cleanups

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [Component Architecture](#component-architecture)
3. [Search System](#search-system)
4. [Code Cleanup](#code-cleanup)
5. [Testing](#testing)
6. [Environment & Deployment](#environment--deployment)
7. [Search Engine V2 Learnings (Not Implemented)](#search-engine-v2-learnings-not-implemented)
8. [Quick Reference Patterns](#quick-reference-patterns)

---

## Authentication & Security

### Password Reset Bug Fix (v2)

**Problem:** `lucia` package caused environment-specific bundling issues in Convex serverless functions.

**Root Cause:**
- Scrypt implementation in `lucia` relied on Node.js `crypto` module
- Convex's serverless environment has different bundling behavior
- Worked locally but failed in staging/production

**Solution:**
- Created self-contained Scrypt implementation using Web Crypto API
- No external dependencies on Node.js crypto
- Consistent behavior across all environments

**Key Lesson:**
> For serverless environments (Convex, Vercel Edge, etc.), prefer Web Crypto API over Node.js crypto modules to avoid bundling issues.

### Environment-Specific Feature Toggles

**Pattern Used:**
```typescript
// Use Convex environment variables for feature flags
const isFeatureEnabled = await ctx.runQuery(api.featureFlags.isEnabled, {
  flag: "newSearchSystem"
});
```

**Benefits:**
- Toggle features without redeployment
- Gradual rollout capability
- Instant rollback if issues occur

---

## Component Architecture

### Toolbar Centralization (DRY Principle)

**Challenge:** 5 different toolbars across the app with duplicated logic

**Solution: Adapter Pattern + Re-exports**

```typescript
// Adapter pattern allows migration without breaking changes
const TableToolbarAdapter = ({ tableType, ...props }) => {
  const config = getToolbarConfig(tableType);
  return <UnifiedToolbar config={config} {...props} />;
};

// Re-export maintains backward compatibility
export { TableToolbarAdapter as ProjectsTableToolbar };
export { TableToolbarAdapter as FundsTableToolbar };
```

**Migration Strategy:**
1. Document existing toolbars and their features (feature matrix)
2. Build unified toolbar with adapter pattern
3. Migrate one toolbar at a time
4. Keep old exports working during transition
5. Remove old implementations after validation

**Key Lesson:**
> Zero-breaking-change migrations are possible with adapter patterns and strategic re-exports. Always document the feature matrix before consolidation.

### Feature Matrix Documentation

**Before consolidation, document:**
| Feature | Toolbar A | Toolbar B | Toolbar C |
|---------|-----------|-----------|-----------|
| Column visibility | ✅ | ✅ | ❌ |
| Export | ✅ | ❌ | ✅ |
| Search | ❌ | ✅ | ✅ |

This identifies gaps and ensures no features are lost during consolidation.

---

## Search System

### 7-Phase Implementation Approach

**Phases:**
1. **Foundation** - Schema, queries, mutations
2. **Index Management** - Reindexing, sync triggers
3. **Frontend State** - URL-first state management
4. **UI Components** - Result cards, filters
5. **Category Cards** - Type-specific displays
6. **Ranking** - TF-IDF + business context algorithm
7. **Error Handling** - Fallbacks, empty states

**Key Decision: URL-First State**
- All search state in URL parameters
- Shareable search URLs
- Back button works naturally
- No state synchronization issues

### Ranking Algorithm

**Formula:**
```
Final Score = (TF-IDF Score × 0.5) + 
              (Organizational Proximity × 0.3) + 
              (Recency × 0.2)
```

**Components:**
- **TF-IDF (50%)** - Text relevance
- **Organizational Proximity (30%)** - Same dept/office boost
- **Recency (20%)** - Newer items rank higher

### Critical Bug: Missing Search Results

**Causes:**
1. Index not updated after data creation
2. Filtering logic too strict
3. Case-sensitive matching

**Fixes:**
- Always normalize text (lowercase) for indexing and queries
- Trigger reindex on all data mutations
- Test search immediately after creating test data

---

## Code Cleanup

### Systematic Cleanup Process

**Steps:**
1. **Identify** - List all files to be removed
2. **Verify** - Confirm no active imports
3. **Archive** - Move to backup (or git history)
4. **Remove** - Delete files
5. **Update** - Fix any import references
6. **Test** - Full test suite run
7. **Rollback Plan** - Document how to restore if needed

### Breaking Change Communication

**When cleanup affects other developers:**
- Announce in team chat before cleanup
- Provide migration guide if imports change
- Keep old exports working during transition period
- Use deprecation warnings: `console.warn("X is deprecated, use Y instead")`

---

## Testing

### E2E Testing with Playwright

**Search System Test Coverage:**
- 16 Playwright tests covering all scenarios
- Tests for each entity type (budget, projects, funds)
- Error state testing
- Mobile responsive testing

**Test Data Strategy:**
```typescript
// Create test data with known values
const testProject = await createTestProject({
  title: "UNIQUE_SEARCH_TEST_PROJECT",
  // ...
});

// Search for unique term
await page.fill('[data-testid="search-input"]', "UNIQUE_SEARCH_TEST");
await expect(page.locator("text=UNIQUE_SEARCH_TEST_PROJECT")).toBeVisible();

// Cleanup after test
await deleteTestProject(testProject.id);
```

### Verification Checklist

Before marking search system complete:
- [ ] All entity types searchable
- [ ] Results ranked by relevance
- [ ] Empty state handled
- [ ] Loading state shown
- [ ] Error state handled
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

---

## Environment & Deployment

### Serverless Considerations

**Node.js Module Bundling:**
- Some Node.js built-ins don't work in serverless
- Test in staging, not just locally
- Prefer Web APIs over Node APIs when possible

**Environment Variables:**
- Use Convex environment variables for secrets
- Use build-time env vars for non-secrets
- Never commit `.env.local` files

### Staging Verification

**Before production deployment:**
1. Deploy to staging
2. Run full test suite
3. Manual smoke tests
4. Verify data migration scripts (if any)
5. Check error monitoring (Sentry, etc.)
6. Performance check (Lighthouse, etc.)

### User Data Migration

**When schema changes:**
- Always backup before migration
- Test migration on copy of production data
- Provide rollback script
- Run migration during low-traffic period
- Monitor error rates post-migration

---

## Search Engine V2 Learnings (Not Implemented)

> **Note:** This section documents learnings from a planned but never implemented Search Engine V2. These are architectural insights that may be useful for future development.

### Indexing Architecture Patterns

#### Denormalization vs. Join Decision

**Scenario:** Including author data in search results

**Option A: Store in Index (Denormalize)**
- Pros: Faster queries
- Cons: Stale data risk when author profile changes

**Option B: Join During Search**
- Pros: Always fresh data
- Cons: Extra DB lookups (N+1 query cost)

**Decision Framework:**
- Use Option A for rarely changing data (creation date, entity type)
- Use Option B for frequently changing data (user names, avatars)

### Deep Linking & Auto-Scroll Pattern

**URL Structure:**
```
/dashboard/project/2026?highlight={entityId}
```

**Implementation Pattern:**
```typescript
const useAutoScrollHighlight = () => {
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlight = params.get("highlight");
    if (highlight) {
      setHighlightedId(highlight);
      // Scroll into view after data loads
      setTimeout(() => {
        document.getElementById(highlight)?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }, 500);
      // Remove highlight after 3 seconds
      setTimeout(() => setHighlightedId(null), 3000);
    }
  }, []);
  
  return { highlightedId };
};
```

### UI/UX Patterns

#### Input Debounce Fix

**Problem:** Parent prop updates overwrite local input state during typing

**Solution:**
```typescript
const SearchInput = ({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const isTypingRef = useRef(false);
  
  useEffect(() => {
    if (!isTypingRef.current) {
      setLocalValue(value);
    }
  }, [value]);
  
  const handleChange = (e) => {
    isTypingRef.current = true;
    setLocalValue(e.target.value);
    onChange(e.target.value);
    setTimeout(() => { isTypingRef.current = false; }, 100);
  };
  
  return <input value={localValue} onChange={handleChange} />;
};
```

#### Cascade Animation

**Stagger delay for list items:**
```typescript
{items.map((item, index) => (
  <div 
    key={item.id}
    className="animate-fade-in-up"
    style={{ animationDelay: `${index * 100}ms` }}
  >
    {item.content}
  </div>
))}
```

### Why V2 Wasn't Implemented

**Planned but never executed because:**
1. Scope creep: Started as bug fixes, expanded to full redesign
2. Breaking changes: Required full reindexing
3. Time estimate: 6-9 hours (likely underestimated)
4. Value vs. effort: Incremental fixes were more practical

**Lesson:**
> When planning improvements, distinguish between "bug fixes" and "enhancements." Fix bugs incrementally, plan enhancements separately.

---

## Quick Reference Patterns

### Adapter Pattern for Migration

```typescript
// Old component (to be deprecated)
export const OldToolbar = (props) => { /* ... */ };

// New unified component
export const UnifiedToolbar = (props) => { /* ... */ };

// Adapter (maintains compatibility)
export const OldToolbar = (props) => {
  console.warn("OldToolbar is deprecated, use UnifiedToolbar");
  return <UnifiedToolbar adapter="old" {...props} />;
};
```

### Self-Contained Utility (Serverless-Safe)

```typescript
// Instead of importing from 'crypto'
import { scrypt } from "crypto"; // ❌ May break in serverless

// Use Web Crypto API
const scrypt = async (password, salt) => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 10000,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
}; // ✅ Works everywhere
```

### Feature Toggle Hook

```typescript
const useFeatureFlag = (flagName: string) => {
  const [enabled, setEnabled] = useState(false);
  
  useEffect(() => {
    const checkFlag = async () => {
      const result = await fetch(`/api/feature-flags/${flagName}`);
      setEnabled(await result.json());
    };
    checkFlag();
  }, [flagName]);
  
  return enabled;
};

// Usage
const NewFeature = () => {
  const isEnabled = useFeatureFlag("newFeature");
  if (!isEnabled) return null;
  return <NewComponent />;
};
```

### Page Depth Utility

```typescript
function getOrdinalSuffix(n: number): string {
  const suffixes = { 1: "st", 2: "nd", 3: "rd" };
  if (n >= 11 && n <= 13) return `${n}th`;
  return `${n}${suffixes[n % 10] || "th"}`;
}

// Usage: getOrdinalSuffix(1) → "1st"
// Usage: getOrdinalSuffix(2) → "2nd"
// Usage: getOrdinalSuffix(3) → "3rd"
// Usage: getOrdinalSuffix(11) → "11th"
```

---

## Summary

### Key Principles

1. **Zero-Breaking-Change Migrations** - Use adapter patterns
2. **URL-First State** - For shareable, bookmarkable features
3. **Web Crypto API** - For serverless compatibility
4. **Normalize Text** - For search indexing (lowercase)
5. **Test in Staging** - Not just locally for serverless
6. **Feature Flags** - For gradual rollouts
7. **Incremental over Big-Bang** - Smaller, safer changes

### When Starting New Features

1. Document the feature matrix first
2. Plan the migration strategy (if replacing existing)
3. Set up feature toggle for gradual rollout
4. Write E2E tests before implementation
5. Plan the cleanup of old code

---

*This document contains distilled learnings from completed tasks. For full context, see git history of the original implementation plans and bug fixes.*
