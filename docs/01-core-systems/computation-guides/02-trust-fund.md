# How Trust Fund Numbers Work

> **URL:** `https://localhost:3000/dashboard/trust-fund`  
> **Audience:** Clients who want to understand Trust Fund calculations  
> **Reading Level:** 5th Grade (Simple & Fun!)

---

## The Big Picture: Like a Piggy Bank!

Imagine a **Trust Fund** is like a special piggy bank for a specific project:

```
TRUST FUND (The Piggy Bank)
│
├── Money Received: 1,000,000 (dropped in the bank)
├── Money Utilized: 600,000 (spent already)
├── Money Obligated: 800,000 (promised to spend)
├── Balance: 400,000 (still in the bank)
│
└── BREAKDOWNS (Individual Purchases)
    ├── Breakdown 1: "Buy Computers" - 300,000 spent
    ├── Breakdown 2: "Hire Trainer" - 200,000 spent
    └── Breakdown 3: "Print Materials" - 100,000 spent
```

---

## The 5 Key Numbers

### 1. Received - "What We Got"

This is the total money that was put into the trust fund.

```
Example: The province received 1,000,000 for a training project
```

| Field Name | Meaning |
|------------|---------|
| `received` | Total money received for this fund |

---

### 2. Utilized - "What We Spent"

This is the money that has actually been spent or used.

```
Example: We spent 600,000 on computers, trainers, and materials
```

| Field Name | Meaning |
|------------|---------|
| `utilized` | Money actually spent |

**How it's calculated:**
- **Auto-Calculate ON**: System adds up all breakdowns automatically
- **Auto-Calculate OFF**: You type the number manually

---

### 3. Obligated PR - "What We Promised"

PR = Purchase Request. This is money you've committed to spend (like a promise).

```
Example: We signed contracts for 800,000 worth of goods
```

| Field Name | Meaning |
|------------|---------|
| `obligatedPR` | Money committed via purchase requests |

---

### 4. Balance - "What's Left"

The money still available in the fund.

```
Received: 1,000,000
- Utilized: 600,000
= Balance: 400,000
```

| Field Name | Formula |
|------------|---------|
| `balance` | `Received - Utilized` |

---

### 5. Utilization Rate - "How Much Used (%)"

The percentage of received money that has been spent.

```
Utilization Rate = (Utilized / Received) x 100

Example: (600,000 / 1,000,000) x 100 = 60%
```

| Field Name | Formula |
|------------|---------|
| `utilizationRate` | `(utilized / received) x 100` |

---

## Breakdowns: The Small Pieces

Each Trust Fund can have multiple **Breakdowns** - these are like individual receipts:

```
Trust Fund: "Computer Training Project"
Received: 1,000,000
│
├── Breakdown 1: "Buy 10 Laptops"
│   ├── Budget: 400,000
│   ├── Utilized: 350,000
│   ├── Obligated: 400,000
│   └── Status: Completed
│
├── Breakdown 2: "Hire IT Trainer"
│   ├── Budget: 200,000
│   ├── Utilized: 150,000
│   ├── Obligated: 200,000
│   └── Status: Ongoing
│
└── Breakdown 3: "Training Room Setup"
    ├── Budget: 400,000
    ├── Utilized: 100,000
    ├── Obligated: 200,000
    └── Status: Delayed
```

### How Breakdowns Affect the Fund

When you add or change a breakdown, the fund automatically updates:

```
All Active Breakdowns              Trust Fund Result
────────────────────────────────────────────────────
Utilized: 350K + 150K + 100K  -->  utilized: 600,000
Obligated: 400K + 200K + 200K -->  obligatedPR: 800,000
Completed: 1                  -->  projectCompleted: 1
Ongoing: 1                    -->  projectsOngoing: 1
Delayed: 1                    -->  projectDelayed: 1

Balance: 1,000,000 - 600,000 = 400,000
Rate: (600,000 / 1,000,000) x 100 = 60%
```

---

## Auto-Calculate Mode

### When ON (Automatic)

The system does the math for you:

```
Breakdown 1 utilized: 100,000
Breakdown 2 utilized: 200,000
Breakdown 3 utilized: 300,000
                              ↓
Fund utilized: 600,000 (auto-calculated!)
```

**What updates automatically:**
- `utilized` - Sum of all breakdown utilized amounts
- `obligatedPR` - Sum of all breakdown obligated amounts
- `balance` - Received minus utilized
- `utilizationRate` - Percentage calculated
- Status counts - Completed, Ongoing, Delayed

### When OFF (Manual)

You type the numbers yourself:

```
Breakdowns say: 600,000 total
But you type: 550,000 in the fund
                              ↓
Fund shows: 550,000 (your manual entry)
```

**What YOU control:**
- `utilized` - You enter this manually
- `obligatedPR` - You enter this manually
- `balance` - Still auto-calculated (Received - Your Utilized)
- `utilizationRate` - Calculated from your numbers

### How to Toggle

1. Go to Trust Fund page
2. Find the "Auto-Calculate" switch
3. Click to turn ON or OFF
4. If turning ON, system recalculates immediately!

---

## Status Types (6 Options!)

Trust Funds have more status options than regular projects:

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `active` | Fund is active | Legacy - still works |
| `ongoing` | Work in progress | Currently spending |
| `on_process` | Processing paperwork | Waiting for approvals |
| `completed` | All done | Finished spending |
| `delayed` | Behind schedule | Taking longer than planned |
| `not_available` | Can't use yet | Fund not accessible |
| `not_yet_started` | Haven't begun | Will start later |

### How Status is Determined

For Trust Funds, status is **manually set** by users (not auto-calculated from breakdowns). But breakdowns still track their own status for reporting!

---

## Trash System for Trust Funds

### Moving to Trash

When you move a Trust Fund to trash:

```
Trust Fund "Computer Project"
│
├── Click: "Move to Trash"
├── Fund gets: isDeleted = true
├── All Breakdowns also go to trash (cascade)
└── Fund disappears from main list

Statistics Update:
- Total Received: Decreases by fund's received amount
- Total Utilized: Decreases by fund's utilized amount
- Total Projects: Count decreases by 1
```

**Important:**
- The fund is NOT deleted forever (just hidden)
- Found in Trash/Recycle Bin page
- Can be restored anytime

### Restoring from Trash

When you restore a Trust Fund:

```
Trust Fund "Computer Project" (in trash)
│
├── Click: "Restore"
├── Fund gets: isDeleted = false
├── All Breakdowns also restore
└── Fund appears in main list again

Statistics Update:
- Total Received: Increases by fund's received amount
- Total Utilized: Increases by fund's utilized amount
- Total Projects: Count increases by 1
```

### Permanent Delete

**DANGER ZONE!** This is forever!

```
Trust Fund "Computer Project" (in trash)
│
├── Click: "Delete Forever"
├── Fund is permanently deleted from database
├── All Breakdowns permanently deleted
└── Data is GONE forever

Statistics Update:
- Numbers stay decreased (no change on delete)
- CANNOT be undone!
```

**Who can do this?**
- Only Super Admin OR the person who created the fund

---

## All Possible Scenarios

### Scenario 1: Creating New Trust Fund

```
1. User clicks "Add Trust Fund"
2. User enters:
   - projectTitle: "Computer Training"
   - officeInCharge: "IT Department"
   - received: 1,000,000
   - utilized: 0 (or manual amount)
   - obligatedPR: 0 (or manual amount)
   - status: "ongoing"

3. System calculates:
   - balance = 1,000,000 - 0 = 1,000,000
   - utilizationRate = (0 / 1,000,000) x 100 = 0%

4. Fund appears in the list!
```

### Scenario 2: Adding Breakdown (Auto-Calculate ON)

```
Before:
Fund utilized: 0
Fund obligatedPR: 0
Fund balance: 1,000,000

User adds Breakdown:
  - budgetUtilized: 300,000
  - obligatedBudget: 400,000
  - status: "ongoing"

After Auto-Calculation:
Fund utilized: 300,000 (+300,000)
Fund obligatedPR: 400,000 (+400,000)
Fund balance: 700,000 (1,000,000 - 300,000)
Fund utilizationRate: 30%
Fund projectsOngoing: 1
```

### Scenario 3: Adding Breakdown (Auto-Calculate OFF)

```
Before:
Fund utilized: 100,000 (manually entered)
Fund balance: 900,000

User adds Breakdown:
  - budgetUtilized: 300,000
  - status: "completed"

After (Manual Mode):
Fund utilized: 100,000 (UNCHANGED - you set this!)
Fund balance: 900,000 (UNCHANGED)

But system tracks:
Breakdown status: completed
Fund projectCompleted: 1 (status counts always update)
```

### Scenario 4: Updating Breakdown Amounts

```
Before:
Breakdown utilized: 200,000
Fund utilized: 600,000 (sum of 3 breakdowns)

User changes Breakdown to:
  - budgetUtilized: 250,000 (+50,000)

After (Auto-Calculate ON):
Fund utilized: 650,000 (+50,000)
Fund balance: 350,000 (decreased by 50,000)
Fund utilizationRate: 65% (was 60%)
```

### Scenario 5: Changing Breakdown Status

```
Before:
Breakdown 1: status = "ongoing"
Breakdown 2: status = "ongoing"
Fund projectsOngoing: 2

User changes Breakdown 1:
  - status: "completed"

After:
Fund projectsOngoing: 1 (decreased)
Fund projectCompleted: 1 (increased)

Note: Financial numbers don't change, only status counts!
```

### Scenario 6: Moving Fund to Trash

```
Dashboard Statistics Before:
- Total Received: 5,000,000
- Total Utilized: 3,000,000
- Total Projects: 5

User moves Fund to trash:
- Received: 1,000,000
- Utilized: 600,000

Dashboard Statistics After:
- Total Received: 4,000,000 (down 1,000,000)
- Total Utilized: 2,400,000 (down 600,000)
- Total Projects: 4 (down 1)

Fund not visible in main list!
```

### Scenario 7: Restoring Fund from Trash

```
Dashboard Statistics Before:
- Total Received: 4,000,000
- Total Utilized: 2,400,000
- Total Projects: 4

User restores Fund from trash:
- Received: 1,000,000
- Utilized: 600,000

Dashboard Statistics After:
- Total Received: 5,000,000 (up 1,000,000)
- Total Utilized: 3,000,000 (up 600,000)
- Total Projects: 5 (up 1)

Fund visible again!
```

### Scenario 8: Bulk Move to Trash

```
User selects 3 Trust Funds and clicks "Move to Trash"

For EACH Fund:
  1. Fund.isDeleted = true
  2. Its Breakdowns.isDeleted = true
  3. Activity logged

Statistics recalculate once:
- Total Received: Decreases by sum of 3 funds
- Total Utilized: Decreases by sum of 3 funds
- Total Projects: Decreases by 3
```

### Scenario 9: Toggling Auto-Calculate ON

```
Before (Manual Mode):
Fund received: 1,000,000
Fund utilized: 500,000 (manually entered)
Breakdowns total utilized: 700,000

User toggles: Auto-Calculate = ON

After:
Fund utilized: 700,000 (now from breakdowns!)
Fund balance: 300,000 (1,000,000 - 700,000)
Fund utilizationRate: 70%

System message: "Auto-calculation enabled. Numbers updated!"
```

### Scenario 10: Toggling Auto-Calculate OFF

```
Before (Auto Mode):
Fund utilized: 700,000 (from breakdowns)

User toggles: Auto-Calculate = OFF

After:
Fund utilized: 700,000 (keeps current value)
Fund balance: 300,000

Now user can manually edit "utilized" field!
Next time breakdowns change, fund numbers stay the same.
```

### Scenario 11: Editing Received Amount

```
Before:
Fund received: 1,000,000
Fund utilized: 600,000
Fund balance: 400,000
Fund rate: 60%

User changes:
- received: 1,200,000 (+200,000)

After:
Fund balance: 600,000 (1,200,000 - 600,000)
Fund utilizationRate: 50% (600K / 1,200K)

Note: Utilized doesn't change, but balance and rate do!
```

### Scenario 12: Status Update Only

```
Before:
Fund status: "ongoing"

User updates status:
- status: "completed"

After:
Fund status: "completed"

Note: No financial numbers change!
Status is independent of breakdown statuses for Trust Funds.
```

---

## Quick Reference: Field Meanings

### Trust Fund Fields

| Field | Type | Meaning | Auto/Manual |
|-------|------|---------|-------------|
| `projectTitle` | Text | Name of the project | Manual |
| `officeInCharge` | Text | Department handling it | Manual |
| `received` | Number | Total money received | Manual |
| `utilized` | Number | Money spent | Auto or Manual |
| `obligatedPR` | Number | Money committed | Auto or Manual |
| `balance` | Number | Money remaining | Auto |
| `utilizationRate` | Number | Percentage used | Auto |
| `status` | Text | Project status | Manual |
| `projectCompleted` | Number | Count of completed breakdowns | Auto |
| `projectDelayed` | Number | Count of delayed breakdowns | Auto |
| `projectsOngoing` | Number | Count of ongoing breakdowns | Auto |
| `isDeleted` | Boolean | In trash? | Auto |

### Breakdown Fields

| Field | Type | Meaning | Auto/Manual |
|-------|------|---------|-------------|
| `projectName` | Text | Task name | Manual |
| `allocatedBudget` | Number | Budget for task | Manual |
| `budgetUtilized` | Number | Money spent on task | Manual |
| `obligatedBudget` | Number | Money committed | Manual |
| `balance` | Number | Remaining budget | Auto |
| `utilizationRate` | Number | Task percentage | Auto |
| `status` | Text | Task status | Manual |

---

## Golden Rules for Trust Funds

1. **Received is the Base** - Everything calculates from "received" amount
2. **Balance Auto-Calculates** - Always `Received - Utilized`
3. **Breakdowns Feed Up** - When auto-calculate is ON, breakdowns control the fund
4. **Status is Manual** - You pick the fund status, not the system
5. **Trash Hides Everything** - Trashed funds don't count in statistics
6. **Restore Brings Back** - Restored funds reappear with all data

---

*Document Version: 1.0*  
*Last Updated: 2026-02-02*  
*For: PPDO Dashboard - Trust Fund Module*
