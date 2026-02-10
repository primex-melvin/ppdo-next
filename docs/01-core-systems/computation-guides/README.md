# 📚 How Computation Works - Complete Guide

> **Understanding the Numbers in PPDO Dashboard**  
> **Reading Level:** 5th Grade (Simple & Fun!)  
> **Last Updated:** 2026-02-02

---

## 🎯 What's This All About?

This folder contains easy-to-understand guides that explain **how the system calculates numbers** for different parts of the PPDO Dashboard. Think of it as a "behind the scenes" look at the math magic! ✨

---

## 📖 Available Guides

### 1️⃣ Budget, Project & Breakdown
**File:** [`01-budget-project-breakdown.md`](./01-budget-project-breakdown.md)  
**URL:** `https://localhost:3000/dashboard/project/2025`

The main module that tracks government projects from top-level budget down to tiny task details.

**What's Inside:**
- How Budget Items → Projects → Breakdowns work together
- Auto-calculate vs Manual mode
- Status tracking (Completed, Ongoing, Delayed)
- Trash and restore with all scenarios

---

### 2️⃣ Trust Fund
**File:** [`02-trust-fund.md`](./02-trust-fund.md)  
**URL:** `https://localhost:3000/dashboard/trust-fund`

Tracks special trust funds for specific projects.

**What's Inside:**
- Received vs Utilized vs Balance calculations
- Fund → Breakdown aggregation
- Six different status types
- Auto-calculation toggle

---

### 3️⃣ Special Health Fund
**File:** [`03-special-health-fund.md`](./03-special-health-fund.md)  
**URL:** `https://localhost:3000/dashboard/special-health-fund`

Manages health-related special funds.

**What's Inside:**
- Health fund tracking logic
- Breakdown aggregation
- Status workflows
- Financial calculations

---

### 4️⃣ Special Education Fund
**File:** [`04-special-education-fund.md`](./04-special-education-fund.md)  
**URL:** `https://localhost:3000/dashboard/special-education-fund`

Handles education-focused special funds.

**What's Inside:**
- Education fund calculations
- Project breakdown tracking
- Fund utilization formulas
- Status management

---

### 5️⃣ 20% Development Fund
**File:** [`05-twenty-percent-df.md`](./05-twenty-percent-df.md)  
**URL:** `https://localhost:3000/dashboard/twenty-percent-df`

The 20% Development Fund (DF) for priority projects.

**What's Inside:**
- Similar to Budget/Project structure
- Breakdown aggregation
- Status tracking (3 types)
- Auto-calculate features

---

## 🧮 Common Concepts Across All Funds

No matter which fund you're looking at, these rules always apply:

### The "Bubble Up" Rule 🫧
```
Breakdown → Project/Fund → Budget Item
(Small)     (Medium)      (Big)
```
Numbers always flow from the smallest piece up to the biggest!

### The "Trash" Rule 🗑️
- **Active items** = Counted in totals ✅
- **Trashed items** = NOT counted in totals ❌
- **Restored items** = Counted again ✅

### The "Auto-Calculate" Rule 🤖
- **ON** = System adds up numbers for you
- **OFF** = You type numbers manually
- Can be toggled anytime!

### The "Status Priority" Rule 🚦
```
1. Ongoing (highest priority)
2. Delayed
3. Completed
```
If ANY piece is "ongoing", the parent shows "ongoing"!

---

## 📊 Quick Formula Reference

| What You Want | Formula |
|---------------|---------|
| **Utilization Rate** | `(Utilized ÷ Allocated) × 100` |
| **Balance** | `Received - Utilized` |
| **Remaining Budget** | `Allocated - Utilized` |
| **Average Rate** | `Sum of all rates ÷ Number of items` |

---

## 🎓 Reading Tips

1. **Start with Budget/Project guide** - It has the most detail
2. **Look for emoji markers** - They highlight important concepts
3. **Check the scenarios** - Real examples help understanding
4. **Use the tables** - Quick reference for field meanings

---

## 🆘 Need Help?

If something doesn't make sense:

1. Check the specific fund guide above
2. Look at the "All Scenarios" section
3. Ask your system administrator
4. Check the code comments in `convex/` folder

---

## 📝 Document Versions

| Document | Version | Last Updated |
|----------|---------|--------------|
| Budget, Project & Breakdown | 1.0 | 2026-02-02 |
| Trust Fund | 1.0 | 2026-02-02 |
| Special Health Fund | 1.0 | 2026-02-02 |
| Special Education Fund | 1.0 | 2026-02-02 |
| 20% Development Fund | 1.0 | 2026-02-02 |

---

*Happy Learning! 🎉*
