# Convex Data Migration Guide
### Local vs Production Environments

This document explains **how Convex data behaves** and **how to migrate it safely**, clearly separated for **Local Development** and **Production Environments**.

---

## Key Concept (Must Know)
🚫 **Cloning a Git repository does NOT clone Convex data.**

Convex data lives in the **cloud deployment**, not in your Git repo.  
Every `npx convex dev` creates or connects to a **separate database**.

---

# 🧪 LOCAL DEVELOPMENT LEARNING

## What Happens Locally
- Each developer runs `npx convex dev`
- Convex creates a **new empty deployment** under their account
- No data is shared automatically between developers

### Local Dev Example
```bash
git clone your-repo
npm install
npx convex dev
```

✅ Result:
- Schema is loaded
- Database starts **empty**
- Safe for testing and experimentation

---

## Sharing Data Locally (Across Accounts)

Since developers are on **different Convex accounts**, you must use the **CLI export/import** flow.

### Export (Source Developer)
```bash
npx convex export --path my_data.zip
```

With file storage:
```bash
npx convex export --path my_data.zip --include-file-storage
```

### Import (Destination Developer)
```bash
npx convex import my_data.zip
```

⚠️ If test data already exists:
```bash
npx convex import --replace my_data.zip

npx convex import --replace-all my_data.zip
```

---

## Why Local Import Works
- Document `_id` values are preserved
- Relationships remain intact
- Schema validation runs automatically

---

# 🚀 PRODUCTION LEARNING

## Production Environment Rules
- Production data lives in a **separate Convex deployment**
- It is **never affected** by Git pulls or local dev commands
- You must treat production data as **critical**

---

## Production Data Migration Options

### Option 1: Same Account / Same Team
✅ Use **Snapshot Restore** in the Convex Dashboard  
Best for:
- Backups
- Rollbacks
- Environment cloning

---

### Option 2: Different Accounts / Different Teams
❌ Snapshot Restore is NOT allowed  
✅ Use **CLI Export / Import**

#### Export (Production Source)
```bash
npx convex export --path prod_data.zip --include-file-storage
```

#### Import (Production Destination)
⚠️ Overwriting production data:
```bash
npx convex import --prod --replace-all .\my_data.zip

npx convex import --prod --replace .\my_data.zip

```

🚨 **Warning:** This replaces ALL existing data.

---

## Production Safety Checklist
Before importing to prod:
- ✅ Confirm `CONVEX_DEPLOYMENT`
- ✅ Backup existing production data
- ✅ Ensure schema is up-to-date
- ✅ Notify the team

---

# 🔐 ENV VARIABLES QUICK CHECK

Always verify:
```env
CONVEX_DEPLOYMENT=correct-deployment-name
```

Mistakes here can overwrite the wrong database.

---

# 🧠 SUMMARY TABLE

| Topic | Local Dev | Production |
|-----|---------|-----------|
| Git Clone | No data | No data |
| Default DB | Empty | Existing |
| Snapshot Restore | ❌ | ✅ (same team only) |
| CLI Export/Import | ✅ | ✅ |
| Replace Flag Risk | Low | 🚨 High |

---

## Final Takeaway
- Git controls **code**
- Convex controls **data**
- Local is safe to reset
- Production must be handled carefully

✅ Follow this separation to avoid data loss.
