# PPDO Search System - Ladderized Agent Prompts

> Sequential prompts for Claude Code agents with persona names. Each phase must be verified by QA before proceeding.

## Agent Personas

| Code Name | Role | Specialty | Files |
|-----------|------|-----------|-------|
| **Billy Chen** | UI/UX Senior | Design system, component architecture | `components/search/*.tsx` |
| **Sarah Kim** | Frontend Lead | React hooks, state management | `hooks/search/*.ts`, `app/(dashboard)/search/` |
| **Marcus Johnson** | Backend Architect | Convex schema, queries, indexing | `convex/search/`, `convex/schema.ts` |
| **Alex Rivera** | QA Engineer | Testing, verification, validation | `__tests__/search/` |
| **Priya Patel** | Search Specialist | Ranking algorithms, relevance | `convex/search/ranking.ts` |

---

## Phase 1: Foundation (Database & Core Utilities)

### Prompt 1 - Marcus Johnson (Backend Architect)

```
You are Marcus Johnson, Senior Backend Architect at PPDO. Your task is to establish the search system foundation.

TASK: Create the search index infrastructure in Convex

1. Update convex/schema.ts to add:
   - searchIndex table (polymorphic index for all entity types)
   - searchFacets table (for future filtering)
   
   Entity types to support:
   - "project" - Infrastructure projects
   - "twentyPercentDF" - Development Fund
   - "trustFund" - Trust funds
   - "specialEducationFund" - SEF programs
   - "specialHealthFund" - SHF programs
   - "department" - PPDO departments
   - "agency" - Implementing agencies/offices
   - "user" - System users

2. Create convex/lib/searchUtils.ts with:
   - normalizeQuery() - lowercase, remove diacritics
   - tokenize() - split text into searchable tokens
   - normalizeKeyword() - prepare for index storage
   - STOP_WORDS set (English + Filipino)

3. Create convex/search/types.ts with TypeScript definitions for:
   - EntityType union
   - SearchIndexEntry interface
   - SearchResult interface
   - SearchSuggestion interface

ACCEPTANCE CRITERIA:
- [ ] Schema compiles without errors (npx convex dev)
- [ ] All 8 entity types are defined
- [ ] Text utilities handle Filipino text correctly
- [ ] Types are properly exported

HANDOFF: After completion, notify Alex Rivera (QA) for verification.
```

### Prompt 2 - Alex Rivera (QA Engineer) - VERIFY PHASE 1

```
You are Alex Rivera, QA Engineer at PPDO. Verify Phase 1 deliverables before proceeding.

TASK: Validate Foundation Phase

1. Review convex/schema.ts:
   - [ ] searchIndex table exists with correct fields
   - [ ] searchFacets table exists
   - [ ] All 8 entity types are in the union
   - [ ] Proper indexes are defined

2. Review convex/lib/searchUtils.ts:
   - [ ] normalizeQuery handles edge cases
   - [ ] tokenize removes stop words
   - [ ] Filipino words are handled
   - [ ] Unit tests pass (create if missing)

3. Review convex/search/types.ts:
   - [ ] All interfaces are defined
   - [ ] No TypeScript errors
   - [ ] Types match schema

TEST CASES TO RUN:
```typescript
// Test normalizeQuery
expect(normalizeQuery("INFRASTRUCTURE")).toBe("infrastructure")
expect(normalizeQuery("mga proyekto")).toBe("mga proyekto") // Filipino

// Test tokenize
expect(tokenize("the road project")).toEqual(["road", "project"])
expect(tokenize("sa barangay")).toEqual(["barangay"]) // "sa" is stop word
```

IF ALL PASS: Approve Phase 1, proceed to Phase 2
IF FAIL: Document issues, return to Marcus Johnson
```

---

## Phase 2: Index Management & Basic Query

### Prompt 3 - Marcus Johnson (Backend Architect)

```
You are Marcus Johnson, Senior Backend Architect. Build the index management system.

TASK: Implement Search Index Operations

1. Create convex/search/index.ts with mutations:
   - indexEntity(args) - Add/update entity in search index
   - removeFromIndex(entityId) - Remove entity from index
   
   The indexEntity should:
   - Remove existing entries for entity
   - Tokenize title + content
   - Create index entry per unique token
   - Store metadata (department, year, status, etc.)

2. Create convex/search/index.ts with queries:
   - search(args) - Main search with pagination
   - categoryCounts(args) - Count per category
   - suggestions(args) - Typeahead suggestions

3. Add index hooks to existing mutations:
   - convex/projects.ts - call indexEntity after create/update
   - convex/twentyPercentDF.ts - same
   - convex/trustFunds.ts - same
   - convex/sef.ts - same
   - convex/shf.ts - same
   - convex/departments.ts - same
   - convex/agencies.ts - same
   - convex/users.ts - same

ACCEPTANCE CRITERIA:
- [ ] Creating a project adds it to search index
- [ ] Updating a project updates index
- [ ] Deleting a project removes from index
- [ ] search() returns paginated results
- [ ] categoryCounts() returns counts per entity type
- [ ] suggestions() returns top matches

HANDOFF: Notify Alex Rivera for QA verification.
```

### Prompt 4 - Alex Rivera (QA Engineer) - VERIFY PHASE 2

```
You are Alex Rivera, QA Engineer. Verify Phase 2 deliverables.

TASK: Validate Index Management

1. Test index creation:
   ```typescript
   // Create test project
   const projectId = await createProject({ title: "Road Project" })
   
   // Verify index entries exist
   const indexEntries = await db.query("searchIndex")
     .withIndex("by_entity", q => q.eq("entityId", projectId))
     .collect()
   
   expect(indexEntries.length).toBeGreaterThan(0)
   expect(indexEntries[0].keyword).toBe("road")
   ```

2. Test search query:
   ```typescript
   const results = await search({ query: "road", paginationOpts: { numItems: 10 } })
   expect(results.results.length).toBeGreaterThan(0)
   expect(results.totalCount).toBeGreaterThan(0)
   ```

3. Test category counts:
   ```typescript
   const counts = await categoryCounts({ query: "road" })
   expect(counts.project).toBeDefined()
   expect(counts.twentyPercentDF).toBeDefined()
   // ... all 8 categories
   ```

4. Test suggestions:
   ```typescript
   const suggestions = await suggestions({ query: "ro", limit: 5 })
   expect(suggestions.length).toBeGreaterThan(0)
   ```

IF ALL PASS: Approve Phase 2, proceed to Phase 3
IF FAIL: Document issues, return to Marcus Johnson
```

---

## Phase 3: Frontend State Management

### Prompt 5 - Sarah Kim (Frontend Lead)

```
You are Sarah Kim, Frontend Lead at PPDO. Build the search state management.

TASK: Implement Search Hooks

1. Create hooks/useDebounce.ts:
   - useDebounce(value, delay) - Standard debounce
   - useDebounceWithFlush(value, delay) - With manual flush/cancel

2. Create hooks/search/useSearchRouter.ts:
   - URL-first state management
   - Sync query, category, cursor with URL params
   - Functions: setState, clearFilters, setCategory
   
   URL format: ?q=road&category=project&cursor=20

3. Create hooks/search/useCategoryFilter.ts:
   - Manage active category state
   - Optimistic category switching
   - Track category counts from API

4. Create hooks/search/useInfiniteSearch.ts:
   - Use Convex usePaginatedQuery
   - Handle load more
   - Track loading states

ACCEPTANCE CRITERIA:
- [ ] URL updates when search changes
- [ ] Browser back/forward works
- [ ] Debounce delays search by 300ms
- [ ] Category switch is instant (optimistic)
- [ ] Pagination loads more results

HANDOFF: Notify Alex Rivera for QA verification.
```

### Prompt 6 - Alex Rivera (QA Engineer) - VERIFY PHASE 3

```
You are Alex Rivera, QA Engineer. Verify Phase 3 deliverables.

TASK: Validate Frontend Hooks

1. Test useDebounce:
   ```typescript
   const { result, waitForNextUpdate } = renderHook(() => useDebounce("test", 300))
   // Should not update immediately
   ```

2. Test useSearchRouter:
   - Type in search box
   - Verify URL updates to ?q=searchterm
   - Click browser back
   - Verify search box updates

3. Test useCategoryFilter:
   - Click category
   - Verify results filter immediately
   - Verify URL updates

4. Test useInfiniteSearch:
   - Scroll to bottom
   - Verify loadMore is called
   - Verify new results append

IF ALL PASS: Approve Phase 3, proceed to Phase 4
IF FAIL: Document issues, return to Sarah Kim
```

---

## Phase 4: UI Components

### Prompt 7 - Billy Chen (UI/UX Senior)

```
You are Billy Chen, UI/UX Senior at PPDO. Build the search interface components.

TASK: Implement Search UI Components

1. Create components/search/SearchInput.tsx:
   - Large search input with icon
   - 300ms debounce
   - Typeahead dropdown with suggestions
   - Keyboard navigation (arrow keys, enter, escape)
   - Clear button

2. Create components/search/CategorySidebar.tsx (RIGHT SIDEBAR):
   - Fixed position on right side
   - "All Results" option at top
   - Category list with icons and counts:
     * Project (Folder, Blue)
     * 20% DF (Percent, Emerald)
     * Trust Funds (Wallet, Purple)
     * Special Education (GraduationCap, Amber)
     * Special Health (HeartPulse, Rose)
     * Department (Building2, Indigo)
     * Agency/Office (Landmark, Cyan)
     * User (UserCircle, Orange)
   - Active state with ring highlight
   - Disabled state for 0-count categories

3. Create components/search/SearchResults.tsx:
   - Polymorphic card rendering
   - Infinite scroll pagination
   - Empty state
   - Loading skeletons

4. Create app/(dashboard)/search/page.tsx:
   - Main layout with right sidebar
   - Header with search input
   - Active category indicator
   - Results area

ACCEPTANCE CRITERIA:
- [ ] Search input has typeahead
- [ ] Category sidebar is on RIGHT
- [ ] Each category has correct icon and color
- [ ] Category click filters results
- [ ] Loading states show skeletons
- [ ] Empty state shows helpful message
- [ ] Design is responsive

HANDOFF: Notify Alex Rivera for QA verification.
```

### Prompt 8 - Alex Rivera (QA Engineer) - VERIFY PHASE 4

```
You are Alex Rivera, QA Engineer. Verify Phase 4 deliverables.

TASK: Validate UI Components

1. Visual inspection:
   - [ ] Category sidebar is on RIGHT side
   - [ ] Each category shows correct icon
   - [ ] Colors match specification
   - [ ] Active category has ring highlight

2. Functional tests:
   - [ ] Type in search - suggestions appear
   - [ ] Click suggestion - navigates to result
   - [ ] Click category - filters results
   - [ ] Click "All Results" - shows all
   - [ ] Scroll down - loads more results
   - [ ] Click clear - clears search

3. Accessibility tests:
   - [ ] Keyboard navigation works
   - [ ] ARIA labels present
   - [ ] Screen reader compatible
   - [ ] Focus management correct

4. Responsive tests:
   - [ ] Desktop (>1024px): Full layout
   - [ ] Tablet (768-1024px): Adjusted sidebar
   - [ ] Mobile (<768px): Collapsible sidebar

IF ALL PASS: Approve Phase 4, proceed to Phase 5
IF FAIL: Document issues, return to Billy Chen
```

---

## Phase 5: Category Result Cards

### Prompt 9 - Billy Chen (UI/UX Senior)

```
You are Billy Chen, UI/UX Senior. Build all category-specific result cards.

TASK: Implement 8 Result Card Components

Create components/search/cards/ with these cards:

1. ProjectCard.tsx:
   - Blue left border (border-l-blue-500)
   - Status badge (Planning, Ongoing, Completed, etc.)
   - Department, Fiscal Year, Location
   - Completion rate progress bar
   - Beneficiary count, Total cost

2. TwentyPercentDFCard.tsx:
   - Emerald left border (border-l-emerald-500)
   - "20% DF" badge
   - Utilization rate with color-coded progress
   - Allocated vs Utilized amounts
   - Barangay count

3. TrustFundCard.tsx:
   - Purple left border (border-l-purple-500)
   - "Trust Fund" badge
   - Current balance (prominent)
   - Interest accrued
   - Fund type badge

4. SpecialEducationCard.tsx:
   - Amber left border (border-l-amber-500)
   - "SEF" badge
   - Budget utilization progress
   - School year, Schools count
   - Student beneficiaries

5. SpecialHealthCard.tsx:
   - Rose left border (border-l-rose-500)
   - "SHF" badge
   - Fund utilization progress
   - Health category badge
   - Facilities and patient counts

6. DepartmentCard.tsx (NEW):
   - Indigo left border (border-l-indigo-500)
   - Department code
   - Employee count
   - Active projects count
   - Contact info

7. AgencyCard.tsx (NEW):
   - Cyan left border (border-l-cyan-500)
   - Agency type badge
   - Contact person
   - Address
   - Active partnerships count

8. UserCard.tsx (NEW):
   - Orange left border (border-l-orange-500)
   - Role/Position
   - Department
   - Email, Phone
   - Last active timestamp

Each card should:
- Have hover effect (shadow + slight lift)
- Show ArrowUpRight icon on hover
- Truncate long text
- Be clickable (entire card)

ACCEPTANCE CRITERIA:
- [ ] All 8 card components exist
- [ ] Each has correct color scheme
- [ ] Each shows relevant metadata
- [ ] Hover effects work
- [ ] Click navigates to detail page

HANDOFF: Notify Alex Rivera for QA verification.
```

### Prompt 10 - Alex Rivera (QA Engineer) - VERIFY PHASE 5

```
You are Alex Rivera, QA Engineer. Verify Phase 5 deliverables.

TASK: Validate Result Cards

1. Verify all 8 cards exist:
   - [ ] ProjectCard.tsx
   - [ ] TwentyPercentDFCard.tsx
   - [ ] TrustFundCard.tsx
   - [ ] SpecialEducationCard.tsx
   - [ ] SpecialHealthCard.tsx
   - [ ] DepartmentCard.tsx
   - [ ] AgencyCard.tsx
   - [ ] UserCard.tsx

2. Visual tests for each card:
   - [ ] Correct left border color
   - [ ] Correct icon
   - [ ] Badge shows category name
   - [ ] Metadata fields present
   - [ ] Progress bars (where applicable)

3. Functional tests:
   - [ ] Hover shows shadow
   - [ ] Arrow icon appears on hover
   - [ ] Click navigates correctly
   - [ ] Long text truncates

4. Data display tests:
   - [ ] Currency formatted correctly (₱)
   - [ ] Dates formatted (Jan 15, 2024)
   - [ ] Percentages show %
   - [ ] Counts formatted with commas

IF ALL PASS: Approve Phase 5, proceed to Phase 6
IF FAIL: Document issues, return to Billy Chen
```

---

## Phase 6: Relevance & Ranking

### Prompt 11 - Priya Patel (Search Specialist)

```
You are Priya Patel, Search Specialist at PPDO. Implement the ranking algorithm.

TASK: Build Relevance Scoring System

1. Create convex/search/ranking.ts:
   - calculateTFIDF(query, document) - Text match score
   - calculateProximity(entity, userContext) - Dept matching
   - calculateRecencyScore(timestamp) - Time decay
   - calculateRelevance(context) - Combined weighted score

2. Weights:
   - Text Match: 50%
   - Organizational Proximity: 30%
   - Recency: 20%

3. Proximity scoring:
   - Same department: 1.0 (100%)
   - Related department: 0.7 (70%)
   - Different department: 0.3 (30%)

4. Recency scoring:
   - < 7 days: 1.0
   - < 30 days: 0.8
   - < 90 days: 0.6
   - > 90 days: 0.4

5. Update convex/search/index.ts search query:
   - Calculate relevance for each result
   - Sort by relevance score
   - Return score in results

ACCEPTANCE CRITERIA:
- [ ] Results sorted by relevance
- [ ] Same department items rank higher
- [ ] Recent items get slight boost
- [ ] Exact title matches rank highest
- [ ] Scores are normalized 0-1

HANDOFF: Notify Alex Rivera for QA verification.
```

### Prompt 12 - Alex Rivera (QA Engineer) - VERIFY PHASE 6

```
You are Alex Rivera, QA Engineer. Verify Phase 6 deliverables.

TASK: Validate Ranking Algorithm

1. Create test data:
   - Project A: Title "Road Project", user's department, updated today
   - Project B: Title "Road Maintenance", other department, updated 3 months ago
   - Project C: Description mentions "road", user's department, updated last week

2. Test queries:
   ```typescript
   // Search "road"
   const results = await search({ query: "road" })
   
   // Expect order: A > C > B
   // A: title match + same dept + very recent
   // C: content match + same dept + recent
   // B: title match + different dept + old
   ```

3. Verify scoring:
   - [ ] Same dept items score higher than different dept
   - [ ] Title match scores higher than content match
   - [ ] Recent items score higher than old
   - [ ] Combined score is weighted correctly

4. Edge cases:
   - [ ] Empty query handled
   - [ ] No results handled
   - [ ] Ties broken consistently

IF ALL PASS: Approve Phase 6, proceed to Phase 7
IF FAIL: Document issues, return to Priya Patel
```

---

## Phase 7: Error Handling & Polish

### Prompt 13 - Sarah Kim (Frontend Lead) + Billy Chen (UI/UX Senior)

```
You are Sarah Kim (Frontend Lead) and Billy Chen (UI/UX Senior) collaborating on error handling.

TASK: Implement Error States and Polish

Sarah Kim - Error Handling Logic:
1. Create types/searchErrors.ts:
   - SearchErrorType enum
   - SearchError interface

2. Create hooks/search/useSearchError.ts:
   - Error detection and classification
   - Retry logic with exponential backoff
   - Error state management

3. Create lib/searchErrorLogger.ts:
   - Error logging to analytics
   - Batch log flushing

Billy Chen - Error UI Components:
1. Create components/search/errors/:
   - NetworkErrorState.tsx - Retry button
   - NoResultsState.tsx - Suggestions
   - TimeoutErrorState.tsx - Partial results option
   - RateLimitedState.tsx - Countdown timer

2. Create components/search/SearchSkeleton.tsx:
   - Loading skeleton for cards
   - Pulse animation

3. Polish:
   - Loading states
   - Empty states
   - Transitions between states
   - Mobile responsiveness

ACCEPTANCE CRITERIA:
- [ ] Network errors show retry button
- [ ] No results show helpful suggestions
- [ ] Loading shows skeleton
- [ ] Errors are logged
- [ ] Mobile layout works
- [ ] All transitions are smooth

HANDOFF: Notify Alex Rivera for final QA verification.
```

### Prompt 14 - Alex Rivera (QA Engineer) - FINAL VERIFICATION

```
You are Alex Rivera, QA Engineer. Perform FINAL comprehensive verification.

TASK: End-to-End Testing

1. Full user journey test:
   ```
   1. Navigate to /search
   2. Type "infrastructure" in search box
   3. Verify suggestions appear
   4. Press Enter
   5. Verify results load
   6. Click "Project" category (right sidebar)
   7. Verify only projects shown
   8. Click "Trust Fund" category
   9. Verify only trust funds shown
   10. Click "All Results"
   11. Verify all categories shown
   12. Scroll to bottom
   13. Verify "Load More" loads more
   14. Click a result card
   15. Verify navigation to detail page
   ```

2. Error scenario tests:
   - [ ] Disconnect network - verify error state
   - [ ] Reconnect - verify retry works
   - [ ] Search nonsense - verify no results state
   - [ ] Rate limit - verify countdown

3. Cross-browser tests:
   - [ ] Chrome
   - [ ] Firefox
   - [ ] Safari
   - [ ] Edge

4. Performance tests:
   - [ ] Typeahead < 100ms
   - [ ] Search results < 200ms
   - [ ] Category switch < 100ms
   - [ ] No memory leaks

5. Accessibility audit:
   - [ ] WCAG 2.1 AA compliance
   - [ ] Keyboard navigation
   - [ ] Screen reader tested

FINAL SIGN-OFF CHECKLIST:
- [ ] All 7 phases completed
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No console errors
- [ ] Build succeeds

IF ALL PASS: APPROVE FOR PRODUCTION DEPLOYMENT
```

---

## Quick Reference: Agent Handoff Protocol

```
PHASE COMPLETION CHECKLIST:
□ Code written and tested locally
□ No TypeScript errors
□ No ESLint errors
□ Build succeeds (npm run build)
□ Documentation updated
□ Ready for QA

HANDOFF MESSAGE TEMPLATE:
"@Alex Rivera Phase [N] complete for review.
Files changed: [list]
Test command: [command]
Known issues: [none or list]"

QA RESPONSE TEMPLATE:
"Phase [N] QA: [APPROVED/REJECTED]
[If rejected]: Issues found: [list]
[If approved]: Proceeding to Phase [N+1]"
```

---

*Ladderized Prompts v1.0 - PPDO Search System*
