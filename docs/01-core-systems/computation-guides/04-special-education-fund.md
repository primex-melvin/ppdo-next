# How Special Education Fund Numbers Work

> URL: `https://localhost:3000/dashboard/special-education-fund`  
> Audience: Clients who want to understand Special Education Fund calculations  
> Reading Level: 5th Grade

---

## Overview

Special Education Fund works exactly the same as Trust Fund. Same calculations, same features, just focused on education projects.

---

## The 5 Key Numbers

### 1. Received
Total money received for education programs.
- Example: Province received 1,500,000 for school building

### 2. Utilized
Money actually spent on education items.
- Example: Spent 900,000 on construction materials

### 3. Obligated PR
Money committed for education purchases.
- Example: Signed contracts for 1,200,000

### 4. Balance
Money still available.
- Formula: Balance = Received - Utilized
- Example: 1,500,000 - 900,000 = 600,000

### 5. Utilization Rate
Percentage of funds used.
- Formula: (Utilized / Received) x 100
- Example: (900,000 / 1,500,000) x 100 = 60%

---

## Status Types (6 Options)

| Status | Meaning | Example |
|--------|---------|---------|
| active | Fund active | Being used |
| ongoing | In progress | Construction ongoing |
| on_process | Processing | Waiting for permits |
| completed | Done | School built |
| delayed | Late | Construction delayed |
| not_available | Cannot use | Fund frozen |
| not_yet_started | Not started | Starts next semester |

---

## Auto-Calculate Mode

ON: System adds breakdowns automatically.
OFF: You type numbers manually.

---

## Trash System

Move to Trash: Fund hidden, not counted in statistics.
Restore: Fund visible again, counted in statistics.
Permanent Delete: Forever gone (Super Admin only).

---

## Scenarios

### Scenario 1: Create Education Fund
1. Enter: projectTitle, officeInCharge, received, utilized, status
2. System calculates: balance, utilizationRate
3. Fund appears in list

### Scenario 2: Add Breakdown (Auto-Calculate ON)
- Before: utilized=0, balance=1,500,000
- Add breakdown with utilized=400,000
- After: utilized=400,000, balance=1,100,000

### Scenario 3: Move to Trash
- Statistics decrease by fund amounts
- Fund not visible

### Scenario 4: Restore
- Statistics increase by fund amounts
- Fund visible again

---

Version 1.0 - 2026-02-02
