# How Special Health Fund Numbers Work

> URL: `https://localhost:3000/dashboard/special-health-fund`  
> Audience: Clients who want to understand Special Health Fund calculations  
> Reading Level: 5th Grade

---

## Overview

Special Health Fund works exactly the same as Trust Fund. Same calculations, same features, just focused on health projects.

---

## The 5 Key Numbers

### 1. Received
Total money received for health programs.
- Example: Province received 2,000,000 for vaccination program

### 2. Utilized  
Money actually spent on health items.
- Example: Spent 1,200,000 on vaccines and equipment

### 3. Obligated PR
Money committed for health purchases.
- Example: Ordered 1,500,000 worth of medical supplies

### 4. Balance
Money still available.
- Formula: Balance = Received - Utilized
- Example: 2,000,000 - 1,200,000 = 800,000

### 5. Utilization Rate
Percentage of funds used.
- Formula: (Utilized / Received) x 100
- Example: (1,200,000 / 2,000,000) x 100 = 60%

---

## Status Types (6 Options)

| Status | Meaning | Example |
|--------|---------|---------|
| active | Fund active | Being used |
| ongoing | In progress | Vaccination ongoing |
| on_process | Processing | Waiting for delivery |
| completed | Done | Program finished |
| delayed | Late | Delivery delayed |
| not_available | Cannot use | Fund frozen |
| not_yet_started | Not started | Starts next month |

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

### Scenario 1: Create Health Fund
1. Enter: projectTitle, officeInCharge, received, utilized, status
2. System calculates: balance, utilizationRate
3. Fund appears in list

### Scenario 2: Add Breakdown (Auto-Calculate ON)
- Before: utilized=0, balance=2,000,000
- Add breakdown with utilized=500,000
- After: utilized=500,000, balance=1,500,000

### Scenario 3: Move to Trash
- Statistics decrease by fund amounts
- Fund not visible

### Scenario 4: Restore
- Statistics increase by fund amounts
- Fund visible again

---

Version 1.0 - 2026-02-02
