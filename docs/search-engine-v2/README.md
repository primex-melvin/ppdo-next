# Search Engine V2 - Documentation Hub

## 📚 Documentation Index

| Document | Purpose | Audience |
|----------|---------|----------|
| [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) | Complete upgrade plan with code samples | Developers |
| [COMPONENT_SPEC.md](./COMPONENT_SPEC.md) | SearchResultCard specifications | UI Developers |
| [SOURCE_URL_MAPPING.md](./SOURCE_URL_MAPPING.md) | Entity type → URL mapping | Backend Developers |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Debug "BOOM" not appearing issue | QA/DevOps |

## 🎯 Quick Start

### Current Status
- ✅ Text highlighting implemented
- ✅ Category filtering working
- 🔴 **Critical Bug**: Some items (e.g., "BOOM") not appearing in search

### Priority Tasks
1. **Fix Missing Results** - Debug why "BOOM" isn't searchable
2. **Add Source Links** - Navigate to original pages
3. **Add Animations** - Cascade effect on card load
4. **Mobile Responsive** - Optimize for mobile

### Team Resources

**Google Search Retired Team** (Expert Consultants):
- @TEAM_LEAD - Architecture decisions
- @BACKEND_ARCHITECT - Indexing fixes
- @UX_SEARCH_DESIGNER - Card design
- @QA_SEARCH_SPECIALIST - Testing strategy

**PPDO Original Team**:
- @backend-convex-architect - Convex integration
- @frontend-react-specialist - Component implementation
- @ui-ux-designer - Visual design
- @qa-testing-agent - Test cases
- @product-documentation-lead - Documentation

## 🔗 Key Links

### Code Locations
- Search Query: `convex/search/index.ts`
- Search Results: `components/search/SearchResults.tsx`
- Search Result Card: `components/search/SearchResultCard.tsx` (to be created)
- Admin Dashboard: `app/(dashboard)/admin/search/page.tsx`

### Shadcn Components Used
- [Card](https://ui.shadcn.com/docs/components/card)
- [Badge](https://ui.shadcn.com/docs/components/badge)
- [Button](https://ui.shadcn.com/docs/components/button)
- [Skeleton](https://ui.shadcn.com/docs/components/skeleton)

### Design System
- **Primary Color**: `#15803D` (green-700)
- **Highlight Color**: `#fef08a` (yellow-200)
- **Animation**: 100ms stagger, 400ms duration
- **Responsive**: Mobile-first, breakpoint at 1024px

## 🐛 Known Issues

### Issue #1: "BOOM" Not Searchable
**Status**: 🔴 Critical  
**Impact**: Users can't find existing data  
**Solution**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Issue #2: Missing Source Navigation
**Status**: 🟡 Medium  
**Impact**: Users can't click through to records  
**Solution**: Add sourceUrl to search results (see [SOURCE_URL_MAPPING.md](./SOURCE_URL_MAPPING.md))

## ✅ Definition of Done

- [ ] Search "BOOM" returns the project
- [ ] Search "LJ" returns the project  
- [ ] Search "NICE" returns Special Education/Health funds
- [ ] Clicking result navigates to correct page
- [ ] Loading state shows during navigation
- [ ] Highlight appears on matched text
- [ ] Date metadata displays
- [ ] Mobile layout works
- [ ] Dark mode supported
- [ ] Cascade animation on load

---

**Last Updated**: 2026-02-08  
**Status**: Planning Complete - Awaiting Execution Approval
