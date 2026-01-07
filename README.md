# PPDO Next Project

## 📝 Git Commit Guide

Follow these commit message prefixes to keep our git history clean and organized!

### Common Commit Types

| Prefix   | Meaning                                                                 | Example |
|----------|-------------------------------------------------------------------------|---------|
| **feat:**    | Introduces a new feature                                               | `feat: add user profile page` |
| **fix:**     | Fixes a bug                                                            | `fix: resolve login redirect issue` |
| **docs:**    | Documentation changes only                                             | `docs: update README with setup steps` |
| **style:**   | Code style changes (formatting, missing semicolons, no logic changes) | `style: format dashboard layout` |
| **refactor:**| Rewriting code without altering behavior                               | `refactor: simplify auth logic` |
| **perf:**    | Performance improvements                                               | `perf: optimize database queries` |
| **test:**    | Adding or updating tests only                                          | `test: add unit tests for auth` |
| **build:**   | Changes to build system, dependencies, or CI pipelines                 | `build: update next.js to v14` |
| **ci:**      | CI configuration or scripts                                            | `ci: add github actions workflow` |
| **chore:**   | Maintenance tasks (e.g., cleaning files, bumps), no production code    | `chore: clean up unused imports` |
| **revert:**  | Reverts a previous commit                                              | `revert: undo feature X` |

---

## 🌍 Environment Configuration (Convex)

We use **Convex environment variables** to control which features show up in different environments (development, staging, production).

### What This Does

- **Development/Local**: Hides the onboarding modal so you can work without distractions
- **Staging**: Same as development - clean testing environment
- **Production**: Shows all features including the onboarding modal for real users

### 🚀 Quick Setup

#### Step 1: Create the Convex Config File

Create a new file: `convex/config.ts`

```typescript
import { query } from "./_generated/server";

export const getEnvironment = query({
  args: {},
  handler: async (ctx) => {
    // Get environment from Convex environment variable
    // Defaults to "production" if APP_ENV is not set
    const env = process.env.APP_ENV || "production";
    return env as "production" | "staging" | "development";
  },
});
```

#### Step 2: Set Your Environment Variable

Open your terminal and run one of these commands:

**For Local Development** (this is what you'll use most of the time):
```bash
npx convex env set APP_ENV development
```

**For Staging** (if your team has a staging environment):
```bash
npx convex env set APP_ENV staging --prod
```

**For Production** (live site):
```bash
npx convex env set APP_ENV production --prod
```

#### Step 3: Verify It's Working

1. Save your changes and restart your dev server
2. The onboarding modal should now be hidden in development
3. Check the Convex dashboard to confirm the variable is set

### 🤔 Common Questions

**Q: Do I need to set this every time I work on the project?**  
A: Nope! Once you set it, it stays until you change it.

**Q: What if I forget to set it?**  
A: No worries! It defaults to "production" mode, so everything will still work.

**Q: How do I check what environment I'm in?**  
A: Run `npx convex env list` to see all your environment variables.
