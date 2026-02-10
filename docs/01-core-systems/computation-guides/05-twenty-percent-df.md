# How 20% Development Fund Numbers Work

> URL: `https://localhost:3000/dashboard/twenty-percent-df`  
> Audience: Clients who want to understand 20% DF calculations  
> Reading Level: 5th Grade

---

## Overview

The 20% Development Fund (DF) works like the Budget/Project system. It has funds with breakdowns that aggregate up.

---

## The Structure

20% DF FUND
├── Total Budget Allocated: 5,000,000
├── Total Budget Utilized: 3,000,000
├── Obligated Budget: 4,000,000
├── Utilization Rate: 60%
│
└── BREAKDOWNS
    ├── Breakdown 1: Road repair - 2,000,000 utilized
    └── Breakdown 2: Bridge fix - 1,000,000 utilized

---

## The 6 Key Numbers

### 1. Total Budget Allocated
Money planned for this DF project.
Example: 5,000,000 allocated for infrastructure

### 2. Total Budget Utilized
Money actually spent.
Example: 3,000,000 spent on construction

### 3. Obligated Budget
Money committed via contracts.
Example: 4,000,000 obligated to contractors

### 4. Balance (Calculated)
Money remaining.
Formula: Allocated - Utilized
Example: 5,000,000 - 3,000,000 = 2,000,000

### 5. Utilization Rate (Calculated)
Percentage used.
Formula: (Utilized / Allocated) x 100
Example: (3,000,000 / 5,000,000) x 100 = 60%

### 6. Status Counts
- projectCompleted: Count of completed breakdowns
- projectDelayed: Count of delayed breakdowns  
- projectsOngoing: Count of ongoing breakdowns

---

## Status Types (3 Options)

Unlike Trust Fund (6 statuses), 20% DF uses only 3:

| Status | Meaning |
|--------|---------|
| ongoing | Work in progress |
| delayed | Behind schedule |
| completed | Finished |

---

## How Status is Determined

The fund status is calculated from breakdown statuses:

IF any breakdown is ongoing:
    fund status = ongoing
ELSE IF any breakdown is delayed:
    fund status = delayed
ELSE IF any breakdown is completed:
    fund status = completed
ELSE:
    fund status = ongoing (default)

---

## Auto-Calculate Mode

ON: 
- utilized = sum of all breakdown utilized amounts
- obligated = sum of all breakdown obligated amounts
- status counts from breakdown statuses

OFF:
- You manually enter utilized and obligated
- Status counts still update from breakdowns

---

## Trash System

Move to Trash:
- Fund gets isDeleted = true
- All breakdowns also trashed
- Not counted in statistics

Restore:
- Fund gets isDeleted = false
- All breakdowns restored
- Counted in statistics again

Permanent Delete:
- Forever gone
- Only Super Admin or Creator

---

## Scenarios

### Scenario 1: Create 20% DF Record
1. User enters: particulars, implementingOffice, allocated, utilized
2. System calculates: utilizationRate, balance
3. Record appears in list

### Scenario 2: Add Breakdown (Auto-Calculate ON)
Before: utilized=0, obligated=0
Add breakdown: utilized=500,000, obligated=600,000
After: utilized=500,000, obligated=600,000

### Scenario 3: Change Breakdown Status
Before: breakdown status = ongoing
After: breakdown status = completed
Result: fund projectCompleted increases by 1

### Scenario 4: Move to Trash
Statistics exclude this fund and its breakdowns
Fund hidden from main view

### Scenario 5: Restore from Trash
Statistics include this fund and its breakdowns again
Fund visible in main view

### Scenario 6: Toggle Auto-Calculate ON
Before: utilized = 500,000 (manual)
Breakdowns total = 700,000
After: utilized = 700,000 (auto)

### Scenario 7: Toggle Auto-Calculate OFF
Before: utilized = 700,000 (auto)
After: utilized = 700,000 (now manual, editable)

---

## Quick Reference

| Field | Auto or Manual |
|-------|----------------|
| totalBudgetAllocated | Manual |
| totalBudgetUtilized | Auto or Manual |
| obligatedBudget | Auto or Manual |
| utilizationRate | Auto |
| projectCompleted | Auto |
| projectDelayed | Auto |
| projectsOngoing | Auto |
| status | Auto |

---

Version 1.0 - 2026-02-02
