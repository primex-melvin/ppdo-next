# 🎯 How the Numbers Work: A Simple Guide to Budget, Project & Breakdown

> **URL:** `https://localhost:3000/dashboard/project/2025`  
> **Audience:** Clients who want to understand how the system calculates numbers  
> **Reading Level:** 5th Grade (Simple & Fun!)

---

## 🏗️ The Big Picture: It's Like a Family Tree!

Imagine the government budget is like a **big pizza** 🍕 that gets sliced into smaller pieces:

```
🍕 THE BIG PICTURE (2025 Budget)
│
├── 💰 Budget Item (like "Road Projects")
│   ├── Money Set Aside: ₱10,000,000
│   │
│   └── 🚧 Project (like "National Highway Fix")
│       ├── Money Set Aside: ₱5,000,000
│       │
│       └── 🔧 Breakdown (like "Fix Potholes in Barangay A")
│           ├── Money Spent: ₱500,000
│           └── Status: ✅ Done!
```

---

## 📊 The 3 Main Pieces You Need to Know

### 1️⃣ 💰 Budget Items - The "Pizza Slices"

Think of **Budget Items** as the big slices of pizza. Each slice has:

| What It Means | Emoji | Example |
|--------------|-------|---------|
| **Allocated** 🎯 | Money planned to spend | "We set aside ₱10M for roads" |
| **Utilized** 💸 | Money actually spent | "We spent ₱6M so far" |
| **Obligated** 📋 | Money committed (like a promise) | "We promised ₱8M to contractors" |
| **Utilization Rate** 📈 | Percentage spent | "60% used up!" |

**The Magic Formula:**
```
📈 Utilization Rate = (Utilized ÷ Allocated) × 100

Example: If you have ₱10 and spent ₱6:
(6 ÷ 10) × 100 = 60% 
```

---

### 2️⃣ 🚧 Projects - The "Toppings on Each Slice"

Each Budget Item can have many **Projects**. Projects track:

| Status | Emoji | What It Means |
|--------|-------|---------------|
| **Completed** ✅ | Green check | Project is DONE! |
| **Ongoing** 🔄 | Blue arrows | Project is happening now |
| **Delayed** ⏰ | Red clock | Project is running late |

**Important:** A Project's status comes from its **Breakdowns** (the smallest pieces)!

---

### 3️⃣ 🔧 Breakdowns - The "Tiny Bites"

**Breakdowns** are the smallest pieces - like individual tasks:

```
🚧 Project: "Build New School"
│
├── 🔧 Breakdown 1: "Pour Foundation" 
│   ├── Budget: ₱1,000,000
│   ├── Spent: ₱1,000,000
│   └── Status: ✅ Completed
│
├── 🔧 Breakdown 2: "Build Walls"
│   ├── Budget: ₱2,000,000
│   ├── Spent: ₱1,500,000
│   └── Status: 🔄 Ongoing
│
└── 🔧 Breakdown 3: "Install Roof"
│   ├── Budget: ₱1,000,000
│   ├── Spent: ₱0
│   └── Status: ⏰ Delayed
```

---

## 🧮 How Numbers Bubble UP! (The Magic Trick)

The system is like a **bubble machine** 🫧 - numbers float UP from the bottom!

### Step 1: Breakdowns → Project

When breakdowns update, the project automatically recalculates:

```
🔧 Breakdowns                      🚧 Project Result
─────────────────────────────────────────────────────────
✅ Completed: 1                    projectCompleted: 1
🔄 Ongoing: 1         ───────▶     projectsOngoing: 1  
⏰ Delayed: 1                      projectDelayed: 1

💰 Budget:                        💰 Budget:
Allocated: ₱4M                    totalBudgetAllocated: ₱4M
Utilized: ₱2.5M   ───────▶        totalBudgetUtilized: ₱2.5M
Obligated: ₱3M                    obligatedBudget: ₱3M

📈 Utilization Rate: 62.5%
```

### Step 2: Project → Budget Item

Then the project numbers bubble up to the Budget Item:

```
🚧 Projects                        💰 Budget Item Result
─────────────────────────────────────────────────────────
Project A:                        Total Projects: 3
  ✅ 1 Complete                    Completed: 1
  🔄 1 Ongoing      ───────▶      Ongoing: 1  
  ⏰ 1 Delayed                     Delayed: 1

Budget A:                          Budget Totals:
Allocated: ₱5M                     Allocated: ₱5M
Utilized: ₱3M     ───────▶         Utilized: ₱3M
Obligated: ₱4M                     Obligated: ₱4M
```

---

## 🤖 Auto-Calculate Mode vs Manual Mode

The system is smart! It can **automatically calculate** OR let you type numbers yourself.

### 🔄 Auto-Calculate Mode (Recommended)

When turned ON ✅, the system:
- Adds up all breakdowns automatically
- Updates totals when anything changes
- You don't have to do math!

```
🔧 Breakdown 1 spent: ₱500,000
🔧 Breakdown 2 spent: ₱300,000  ───────▶  💰 Project Total: ₱800,000
🔧 Breakdown 3 spent: ₱200,000
```

### ✏️ Manual Mode

When turned OFF ❌, you:
- Type the total yourself
- Numbers don't change automatically
- Good for old data or special cases

```
💰 You type: ₱750,000
(The system won't change this, even if breakdowns say ₱800,000)
```

### 🎛️ How to Switch Modes

1. Go to the Project or Budget Item
2. Look for the **"Auto-Calculate"** toggle
3. Click to turn ON or OFF
4. The system will recalculate right away!

---

## 🗑️ The Trash System: What Happens When You Delete?

The system has a **Trash Bin** 🗑️ - things aren't gone forever until you say so!

### What Gets Counted?

| Where | What Gets Counted |
|-------|-------------------|
| Regular View | Only **ACTIVE** (not deleted) items |
| Trash View | Only **DELETED** items |
| Reports | Usually only **ACTIVE** items |

### 🗑️ Move to Trash (Soft Delete)

When you move something to trash:

```
🚧 Project "Road Repair" 
│
├── Click: "Move to Trash" 🗑️
├── Project now has: isDeleted = true
├── All its Breakdowns also go to trash
└── Budget Item recalculates (minus this project)
```

**What happens to the numbers?**
- ❌ Project NO LONGER counts in Budget Item totals
- ❌ Breakdowns NO LONGER count in Project totals
- ✅ Numbers automatically update (go down)

### ♻️ Restore from Trash

When you restore something:

```
🚧 Project "Road Repair" (in trash)
│
├── Click: "Restore" ♻️
├── Project now has: isDeleted = false
├── All its Breakdowns also restore
└── Budget Item recalculates (plus this project back)
```

**What happens to the numbers?**
- ✅ Project NOW counts in Budget Item totals again
- ✅ Breakdowns NOW count in Project totals again
- ✅ Numbers automatically update (go up)

### 💀 Permanent Delete (Hard Delete)

⚠️ **DANGER ZONE!** This is forever!

```
🚧 Project "Road Repair" (in trash)
│
├── Click: "Delete Forever" 💀
├── Project is GONE from database
├── All Breakdowns are GONE too
└── Budget Item recalculates (permanently minus this)
```

**Important:**
- 🔥 Cannot be undone
- 🔥 Data is lost forever
- 🔥 Usually only Super Admins can do this

---

## 📋 All Possible Scenarios

### Scenario 1: Creating New Project ✅

```
1. User clicks "Add Project"
2. System creates Project with:
   - totalBudgetAllocated: ₱5,000,000 (user entered)
   - totalBudgetUtilized: ₱0 (start at zero)
   - obligatedBudget: ₱0 (start at zero)
   - status: "ongoing" (default)
   - projectCompleted: 0
   - projectDelayed: 0
   - projectsOngoing: 0

3. System updates Budget Item:
   - Adds new project's allocated amount
   - Recalculates utilization rate
   - Updates status counts

4. Result: Budget Item shows higher totals!
```

### Scenario 2: Adding Breakdown to Project 🔧

```
1. User clicks "Add Breakdown"
2. System creates Breakdown with:
   - allocatedBudget: ₱500,000
   - budgetUtilized: ₱200,000
   - status: "ongoing"
   - obligatedBudget: ₱300,000

3. System recalculates Project:
   - IF auto-calculate ON:
     - totalBudgetUtilized += ₱200,000
     - obligatedBudget += ₱300,000
     - projectsOngoing += 1
   - IF auto-calculate OFF:
     - Only obligated and status counts update
     - Manual utilized stays the same

4. System recalculates Budget Item (same logic)

5. Result: Numbers bubble up automatically!
```

### Scenario 3: Updating Breakdown Status 🔄

```
Before:
🔧 Breakdown: "ongoing" → Project: projectsOngoing: 1

User changes Breakdown status to "completed"

After:
🔧 Breakdown: "completed" → Project: 
  - projectsOngoing: 0 (went down)
  - projectCompleted: 1 (went up!)

Budget Item also updates:
  - projectsOngoing: -1
  - projectCompleted: +1
```

### Scenario 4: Editing Budget Amounts 💰

```
Before:
🔧 Breakdown budgetUtilized: ₱200,000
🚧 Project totalBudgetUtilized: ₱1,000,000

User changes Breakdown to: ₱300,000

After (Auto-Calculate ON):
🚧 Project totalBudgetUtilized: ₱1,100,000 (+₱100,000)
💰 Budget Item totalBudgetUtilized: ₱1,100,000 (+₱100,000)

The ₱100,000 difference bubbles all the way up!
```

### Scenario 5: Moving Project to Trash 🗑️

```
Before Trash:
💰 Budget Item:
  - Allocated: ₱10,000,000
  - Utilized: ₱6,000,000
  - Projects: 3 total

User moves 1 Project (₱3M allocated, ₱2M utilized) to trash

After Trash:
💰 Budget Item:
  - Allocated: ₱7,000,000 (down ₱3M)
  - Utilized: ₱4,000,000 (down ₱2M)
  - Projects: 2 total (down 1)
  
❌ Project and its breakdowns NO LONGER COUNT
```

### Scenario 6: Restoring Project from Trash ♻️

```
Before Restore (Project in trash):
💰 Budget Item:
  - Allocated: ₱7,000,000
  - Utilized: ₱4,000,000

User restores 1 Project (₱3M allocated, ₱2M utilized)

After Restore:
💰 Budget Item:
  - Allocated: ₱10,000,000 (up ₱3M)
  - Utilized: ₱6,000,000 (up ₱2M)
  
✅ Project and its breakdowns COUNT AGAIN!
```

### Scenario 7: Changing Parent Budget Item 🔄

```
🚧 Project "Road Fix"
├── Old Parent: Budget Item A (Infrastructure)
├── User moves to: Budget Item B (Emergency Fund)
│
Budget Item A updates:
  - Loses Project's numbers
  - Recalculates down
│
Budget Item B updates:
  - Gains Project's numbers  
  - Recalculates up
```

### Scenario 8: Bulk Trash Multiple Projects 🗑️🗑️🗑️

```
User selects 5 Projects and clicks "Move to Trash"

For EACH Project:
  1. Project goes to trash
  2. Its Breakdowns go to trash
  3. Usage counts decrease

After all 5:
💰 Budget Item recalculates once (efficient!)
Result: All 5 projects' numbers removed from totals
```

### Scenario 9: Creating Project Without Budget Item 🆓

```
🚧 New Project:
  - budgetItemId: null (not linked)
  
This project:
  ✅ Still tracks its own numbers
  ✅ Still aggregates breakdowns
  ✅ Still has status counts
  
  ❌ Does NOT bubble up to any Budget Item
  ❌ Won't show in Budget Item reports
```

### Scenario 10: Toggling Auto-Calculate Mode 🎛️

```
Project in Manual Mode:
  - totalBudgetUtilized: ₱500,000 (manually entered)
  - Breakdowns total: ₱800,000 (ignored)

User switches to Auto-Calculate:
  
Project now:
  - totalBudgetUtilized: ₱800,000 (from breakdowns)
  - Manual value overwritten

Budget Item updates with the ₱300,000 difference!
```

---

## 🎯 Status Determination Rules

### How Project Status is Decided

The system looks at ALL breakdowns and follows these rules:

```
IF any breakdown is "ongoing":
    → Project status = "ongoing" 🔄
    
ELSE IF any breakdown is "delayed":
    → Project status = "delayed" ⏰
    
ELSE IF any breakdown is "completed":
    → Project status = "completed" ✅
    
ELSE (no breakdowns):
    → Project status = "ongoing" 🔄 (default)
```

**Same rules apply:** Budget Item looks at Projects the same way!

### Examples:

| Breakdown 1 | Breakdown 2 | Breakdown 3 | Project Status |
|-------------|-------------|-------------|----------------|
| ✅ Complete | 🔄 Ongoing | ⏰ Delayed | 🔄 Ongoing |
| ✅ Complete | ✅ Complete | ⏰ Delayed | ⏰ Delayed |
| ✅ Complete | ✅ Complete | ✅ Complete | ✅ Complete |
| (none) | | | 🔄 Ongoing |

---

## 📊 Quick Reference: What Each Number Means

### Budget Item Numbers

| Field | Emoji | Comes From | Meaning |
|-------|-------|------------|---------|
| `totalBudgetAllocated` | 🎯 | User input or sum of projects | Total money planned |
| `totalBudgetUtilized` | 💸 | Sum of projects (or manual) | Total money spent |
| `obligatedBudget` | 📋 | Sum of projects | Total money committed |
| `utilizationRate` | 📈 | (Utilized ÷ Allocated) × 100 | Percentage used |
| `projectCompleted` | ✅ | Count of completed projects | How many done |
| `projectDelayed` | ⏰ | Count of delayed projects | How many late |
| `projectsOngoing` | 🔄 | Count of ongoing projects | How many active |
| `status` | 🚦 | Auto-calculated from above | Overall health |

### Project Numbers

| Field | Emoji | Comes From | Meaning |
|-------|-------|------------|---------|
| `totalBudgetAllocated` | 🎯 | User input | Money planned for this project |
| `totalBudgetUtilized` | 💸 | Sum of breakdowns (or manual) | Money spent |
| `obligatedBudget` | 📋 | Sum of breakdowns | Money committed |
| `utilizationRate` | 📈 | (Utilized ÷ Allocated) × 100 | Percentage used |
| `projectCompleted` | ✅ | Count of completed breakdowns | Tasks done |
| `projectDelayed` | ⏰ | Count of delayed breakdowns | Tasks late |
| `projectsOngoing` | 🔄 | Count of ongoing breakdowns | Tasks active |
| `status` | 🚦 | Auto-calculated from above | Project health |

### Breakdown Numbers

| Field | Emoji | Comes From | Meaning |
|-------|-------|------------|---------|
| `allocatedBudget` | 🎯 | User input | Money planned for task |
| `budgetUtilized` | 💸 | User input | Money actually spent |
| `obligatedBudget` | 📋 | User input | Money committed |
| `balance` | ⚖️ | Allocated - Utilized | Money left |
| `utilizationRate` | 📈 | (Utilized ÷ Allocated) × 100 | Percentage used |
| `status` | 🚦 | User input | Task status |

---

## 🔒 Important Rules to Remember

### 1. Trashed Items Don't Count! 🗑️❌

```
❌ Trashed Breakdown → NOT counted in Project
❌ Trashed Project → NOT counted in Budget Item
❌ Trashed Budget Item → NOT counted in Reports
```

### 2. Numbers Only Go UP! ⬆️

```
Breakdown → Project → Budget Item
   (small)    (bigger)    (biggest)
```

### 3. Auto-Calculate Respects Your Choice 🎛️

```
ON = System does math for you
OFF = You control the numbers manually
```

### 4. Status is Contagious! 😷

```
One delayed breakdown → Project might be delayed
One ongoing breakdown → Project is definitely ongoing
```

### 5. Changes Cascade Like Dominoes! 🎲

```
Change Breakdown → Project updates → Budget Item updates
(One change affects everything above it!)
```

---

## 🎓 Summary: The Golden Rules

1. **💰 Money flows UP** - Breakdown → Project → Budget Item
2. **🚦 Status flows UP** - Same direction as money
3. **🗑️ Trash removes** - Trashed items don't count anywhere
4. **♻️ Restore brings back** - Restored items count again
5. **🎛️ Auto-calculate helps** - But you can turn it off if needed
6. **🔄 One change = Many updates** - The system keeps everything in sync!

---

## 🆘 Need Help?

If you see numbers that don't make sense:

1. 🔍 **Check if items are in trash** - Trashed items don't count
2. 🎛️ **Check auto-calculate setting** - Manual mode might have different numbers
3. 🧮 **Add up the breakdowns** - Do they match the project?
4. 📞 **Ask your admin** - They can check the database directly

---

*Document Version: 1.0*  
*Last Updated: 2026-02-02*  
*For: PPDO Dashboard - Project Module*
