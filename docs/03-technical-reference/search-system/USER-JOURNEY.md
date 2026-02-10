# PPDO Search System - User Journey

> How app_users interact with the global search feature

## Entry Points

### 1. Global Search Input (Navbar)

```
┌─────────────────────────────────────────────────────────────────┐
│  PPDO Logo    🔍 Search projects, budgets, users...    [👤 User] │
│              ↑                                                  │
│       Global Search Input (always visible in navbar)            │
└─────────────────────────────────────────────────────────────────┘
```

**User Action:** Click the search input in the top navigation bar

**What Happens:**
1. Input expands/focuses
2. User types query (e.g., "road infrastructure")
3. Typeahead suggestions appear after 300ms
4. User presses **Enter** or clicks a suggestion

---

## The Search Results Page

### Step 1: Landing on Results Page

```
┌──────────┬───────────────────────────────────────┬──────────────────┐
│          │                                       │  CATEGORIES      │
│  NAV     │  🔍 road infrastructure               │                  │
│  SIDEBAR │                                       │  ○ All Results   │
│  (left)  │  ┌─────────────────────────────────┐  │     (24 items)   │
│          │  │ 📋 Road Improvement Project     │  │                  │
│  Dashboard    Status: Ongoing               │  │  ● Project       │
│  Projects  │  │   Dept: Planning & Development  │  │     (11 items)   │
│  Budgets   │  │   Updated: 2 days ago           │  │     ← active     │
│  ...       │  └─────────────────────────────────┘  │                  │
│          │                                       │  ○ 20% DF        │
│          │  ┌─────────────────────────────────┐  │     (0 items)    │
│          │  │ 🏛️ Planning & Development       │  │                  │
│          │  │    Department                   │  │  ○ Trust Funds   │
│          │  │    Employees: 45                │  │     (2 items)    │
│          │  └─────────────────────────────────┘  │                  │
│          │                                       │  ○ Special Ed    │
│          │  ┌─────────────────────────────────┐  │     (3 items)    │
│          │  │ 👤 Maria Santos                 │  │                  │
│          │  │    Budget Officer               │  │  ○ Special Health│
│          │  │    Dept: Budget Division        │  │     (0 items)    │
│          │  └─────────────────────────────────┘  │                  │
│          │                                       │  ○ Department    │
│          │  [Load More...]                       │     (4 items)    │
│          │                                       │                  │
│          │                                       │  ○ Agency/Office │
│          │                                       │     (2 items)    │
│          │                                       │                  │
│          │                                       │  ○ User          │
│          │                                       │     (2 items)    │
└──────────┴───────────────────────────────────────┴──────────────────┘
```

---

## User Flow Scenarios

### Scenario 1: Finding a Project

```
User Goal: Find the "Road Infrastructure 2024" project

Step 1: Type "road" in navbar search
        ↓
Step 2: See typeahead suggestions:
        - 📋 Road Infrastructure 2024 (Project)
        - 📋 Road Maintenance Program (Project)  
        - 🔍 Search for "road" (Keyword)
        ↓
Step 3: Press Enter (or click first suggestion)
        ↓
Step 4: Land on /search?q=road
        - See 24 total results across all categories
        - See Project category has 11 items
        ↓
Step 5: Click "Project (11 items)" in right sidebar
        - Results filter to show only Projects
        - Active category highlighted
        ↓
Step 6: Click on "Road Infrastructure 2024" card
        - Navigate to project detail page
```

### Scenario 2: Finding a Person

```
User Goal: Find contact info for Budget Officer

Step 1: Type "budget officer" in navbar search
        ↓
Step 2: Press Enter
        ↓
Step 3: Land on /search?q=budget+officer
        ↓
Step 4: Click "User (2 items)" in right sidebar
        - Filter to show only users
        ↓
Step 5: See user cards with:
        - Name, position, department
        - Email, phone number
        - Last active timestamp
        ↓
Step 6: Click on user card
        - Navigate to user profile
        - Or directly see contact info on card
```

### Scenario 3: Finding an Agency

```
User Goal: Find implementing agency "Green Earth NGO"

Step 1: Type "green earth" in navbar search
        ↓
Step 2: Press Enter
        ↓
Step 3: Land on /search?q=green+earth
        ↓
Step 4: Click "Agency/Office (1 item)" in right sidebar
        - Filter to show only agencies
        ↓
Step 5: See agency card with:
        - Agency name and type (NGO)
        - Contact person: "John Doe, Director"
        - Phone: 0917-XXX-XXXX
        - Email: contact@greenearth.org
        - Address: [full address]
        - Active partnerships: 3
```

### Scenario 4: Cross-Category Discovery

```
User Goal: See everything related to "2024"

Step 1: Type "2024" in navbar search
        ↓
Step 2: Press Enter
        ↓
Step 3: Stay on "All Results" (don't filter)
        ↓
Step 4: See mixed results:
        - 📋 Projects from 2024
        - 💰 20% DF allocations for 2024
        - 🎓 Special Education programs SY 2024
        - 💊 Special Health programs FY 2024
        - 📁 Trust funds established 2024
        ↓
Step 5: Use right sidebar to quickly filter
        if looking for specific category
```

---

## Interactive Elements

### Typeahead Dropdown

```
┌────────────────────────────────────────┐
│  Search: "roa"                         │
├────────────────────────────────────────┤
│  📋 Road Infrastructure 2024           │ ← Entity match
│     Project | Dept: Planning           │
├────────────────────────────────────────┤
│  📋 Road Maintenance Schedule          │ ← Entity match
│     Project | Status: Ongoing          │
├────────────────────────────────────────┤
│  🔍 Search for "road"                  │ ← Keyword match
│     24 results across all types        │
└────────────────────────────────────────┘

Navigation:
- ↑/↓ arrow keys to navigate
- Enter to select
- Esc to close
- Click to select
```

### Category Sidebar (Right Side)

```
┌────────────────────┐
│  CATEGORIES        │
├────────────────────┤
│  ○ All Results     │ ← Click to see everything
│     (24 items)     │
├────────────────────┤
│  ● Project         │ ← Active (highlighted)
│     (11 items)     │    Click to filter
├────────────────────┤
│  ○ 20% DF          │ ← 0 items (disabled)
│     (0 items)      │    Still shown but grayed
├────────────────────┤
│  ○ Trust Funds     │ ← Click to filter
│     (2 items)      │
├────────────────────┤
│  ○ Special Ed      │
│     (3 items)      │
├────────────────────┤
│  ○ Special Health  │
│     (0 items)      │
├────────────────────┤
│  ○ Department      │
│     (4 items)      │
├────────────────────┤
│  ○ Agency/Office   │
│     (2 items)      │
├────────────────────┤
│  ○ User            │
│     (2 items)      │
└────────────────────┘
```

### Result Cards

Each card type shows different relevant info:

**Project Card:**
```
┌─────────────────────────────────────────┐
│ 📋 Road Infrastructure Project     [Status]
│    Dept: Planning & Development         │
│                                         │
│ Description excerpt...                  │
│                                         │
│ Completion: [████████░░] 80%           │
│                                         │
│ FY 2024 | 📍 Location | 👥 1,200 ben.  │
└─────────────────────────────────────────┘
```

**User Card:**
```
┌─────────────────────────────────────────┐
│ 👤 Maria Santos                    [Role]
│    Budget Officer                       │
│                                         │
│ Dept: Budget Division                   │
│ ID: EMP-2024-001                        │
│                                         │
│ 📧 maria@ppdo.gov.ph | 📱 0917-XXX-XXXX│
│                                         │
│                   Last active: Jan 15   │
└─────────────────────────────────────────┘
```

**Agency Card:**
```
┌─────────────────────────────────────────┐
│ 🏛️ Green Earth NGO               [Type]
│    www.greenearth.org                   │
│                                         │
│ Contact: John Doe, Director             │
│                                         │
│ 3 active partnerships                   │
│                                         │
│ 📍 Quezon City | 📧 contact@greenearth..│
└─────────────────────────────────────────┘
```

---

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `/` | Focus search input (global shortcut) |
| `↑/↓` | Navigate typeahead suggestions |
| `Enter` | Select highlighted suggestion |
| `Esc` | Close typeahead / clear search |
| `Tab` | Move between category filters |
| `→` | Expand category sidebar (mobile) |
| `←` | Collapse category sidebar (mobile) |

---

## Mobile Experience

```
┌─────────────────────────────┐
│  PPDO    🔍        [👤]     │
├─────────────────────────────┤
│                             │
│  Search Results for "road"  │
│                             │
│  ┌───────────────────────┐  │
│  │ 📋 Road Project       │  │
│  │    Status: Ongoing    │  │
│  └───────────────────────┘  │
│                             │
│  ┌───────────────────────┐  │
│  │ 👤 Maria Santos       │  │
│  │    Budget Officer     │  │
│  └───────────────────────┘  │
│                             │
│  [Load More...]             │
│                             │
├─────────────────────────────┤
│  [Filter ▼]                 │ ← Tap to open category drawer
└─────────────────────────────┘
```

**Mobile Category Drawer:**
```
┌─────────────────────────────┐
│        Categories     [✕]   │
├─────────────────────────────┤
│  ○ All Results (24)         │
│  ● Project (11)      ✓      │
│  ○ Trust Funds (2)          │
│  ○ Department (4)           │
│  ○ User (2)                 │
│  ...                        │
└─────────────────────────────┘
```

---

## URL States (Shareable Links)

| URL | Description |
|-----|-------------|
| `/search?q=road` | Search for "road" in all categories |
| `/search?q=road&category=project` | Search "road" filtered to Projects |
| `/search?q=budget&category=user` | Search "budget" filtered to Users |
| `/search?q=2024&category=agency` | Search "2024" filtered to Agencies |

Users can:
- Bookmark specific searches
- Share filtered views with colleagues
- Use browser back/forward to navigate search history

---

## Common User Workflows

### Workflow 1: Quick Contact Lookup
```
1. Type name in navbar
2. Press Enter
3. Click User category (if not already visible)
4. Get phone/email from card
5. Done - no page navigation needed
```

### Workflow 2: Project Status Check
```
1. Type project name
2. Press Enter
3. Find project in results
4. View status, completion %, budget on card
5. Click for full details if needed
```

### Workflow 3: Agency Partnership Review
```
1. Type agency name
2. Press Enter
3. Filter to Agency/Office category
4. See contact person, active partnerships
5. Click to view partnership history
```

---

*User Journey Documentation v1.0*
