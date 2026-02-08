# Source URL Mapping

## Entity Type → Page URL Reference

This document maps each searchable entity type to its destination URL.

| Entity Type | URL Pattern | Example |
|-------------|-------------|---------|
| `project` | `/dashboard/project/{year}` | `/dashboard/project/2026` |
| `twentyPercentDF` | `/dashboard/20_percent_df/{year}` | `/dashboard/20_percent_df/2026` |
| `trustFund` | `/dashboard/trust-funds/{year}` | `/dashboard/trust-funds/2026` |
| `specialEducationFund` | `/dashboard/special-education-funds/{year}` | `/dashboard/special-education-funds/2026` |
| `specialHealthFund` | `/dashboard/special-health-funds/{year}` | `/dashboard/special-health-funds/2026` |
| `department` | `/dashboard/departments` | `/dashboard/departments` |
| `agency` | `/dashboard/office` | `/dashboard/office` |
| `user` | `/dashboard/settings/user-management` | `/dashboard/settings/user-management` |

## URL Generation Logic

```typescript
function getEntityUrl(
  entityType: EntityType, 
  entityId: string, 
  year?: number
): string {
  const currentYear = year || new Date().getFullYear();
  
  const routes: Record<EntityType, string> = {
    project: `/dashboard/project/${currentYear}`,
    twentyPercentDF: `/dashboard/20_percent_df/${currentYear}`,
    trustFund: `/dashboard/trust-funds/${currentYear}`,
    specialEducationFund: `/dashboard/special-education-funds/${currentYear}`,
    specialHealthFund: `/dashboard/special-health-funds/${currentYear}`,
    department: `/dashboard/departments`,
    agency: `/dashboard/office`,
    user: `/dashboard/settings/user-management`
  };
  
  return routes[entityType];
}
```

## Deep Linking (Future Enhancement)

For direct navigation to specific records:

```typescript
// Future: Scroll to specific row
function getDeepLink(
  entityType: EntityType,
  entityId: string,
  year?: number
): string {
  const baseUrl = getEntityUrl(entityType, entityId, year);
  return `${baseUrl}?highlight=${entityId}`;
}

// Example: /dashboard/project/2026?highlight=k9m2p4n8
```

## Notes

- Year defaults to current year if not specified
- All fund types use year-based routing
- Users and departments are global (no year)
- Future: Add query params for filtering
