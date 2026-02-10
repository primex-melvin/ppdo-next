# Development & Production Setup Guide

> Complete guide for setting up PPDO Next in development and production environments

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Setup](#development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Node.js | 18.x or higher | [nodejs.org](https://nodejs.org) |
| npm | 9.x or higher | Included with Node.js |
| Git | 2.x or higher | [git-scm.com](https://git-scm.com) |
| PowerShell | 7.x (recommended) | [microsoft.com](https://docs.microsoft.com/powershell) |

### Required Accounts

- **GitHub Account** - For repository access
- **Convex Account** - For backend database ([convex.dev](https://convex.dev))
- **Vercel Account** (optional) - For hosting ([vercel.com](https://vercel.com))

---

## Development Setup

### Step 1: Clone the Repository

```powershell
# Navigate to your projects folder
cd C:\ppdo

# Clone the repository
git clone https://github.com/mviner000/ppdo-next.git

# Enter the project folder
cd ppdo-next
```

---

### Step 2: Install Dependencies

```powershell
# Install all dependencies
npm install
```

This will install:
- Next.js 16
- React 19
- Convex SDK
- Tailwind CSS
- shadcn/ui components
- And all other project dependencies

---

### Step 3: Environment Variables

Create a `.env.local` file in the root folder:

```bash
# Copy from example
copy .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# Application Environment
NEXT_PUBLIC_APP_ENV=development

# Optional: Analytics, Error Tracking, etc.
# NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

---

### Step 4: Convex Setup

#### 4.1 Install Convex CLI

```powershell
npm install -g convex
```

#### 4.2 Initialize Convex

```powershell
npx convex dev
```

This will:
- Deploy your Convex functions
- Start the Convex dev server
- Provide you with a Convex URL

#### 4.3 Set Environment Variables in Convex

```powershell
# Set development environment
npx convex env set APP_ENV development

# Optional: Set other environment variables
npx convex env set FEATURE_FLAGS onboarding=false
```

---

### Step 5: Start Development Server

```powershell
# Start both frontend and backend
npm run dev
```

This runs:
- Next.js dev server on [http://localhost:3000](http://localhost:3000)
- Convex dev server for real-time updates

---

### Step 6: Verify Setup

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the PPDO landing page
3. Navigate to `/signin` to test authentication
4. Sign in with your credentials
5. You should see the dashboard

---

## Environment Configuration

### Convex Environment Variables

We use Convex environment variables to control which features show up in different environments.

| Variable | Development | Staging | Production |
|----------|-------------|---------|------------|
| `APP_ENV` | `development` | `staging` | `production` |

### What This Controls

- **Development**: Hides the onboarding modal so you can work without distractions
- **Staging**: Same as development - clean testing environment
- **Production**: Shows all features including the onboarding modal for real users

### Setting Environment Variables

```powershell
# For Local Development
npx convex env set APP_ENV development

# For Staging
npx convex env set APP_ENV staging --prod

# For Production
npx convex env set APP_ENV production --prod
```

### Verify Environment

```powershell
# List all environment variables
npx convex env list
```

---

## Production Deployment

### Option 1: Deploy to Vercel (Recommended)

#### Step 1: Prepare for Production

```powershell
# Build the application
npm run build

# Test the production build locally
npm start
```

#### Step 2: Deploy to Vercel

```powershell
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Step 3: Configure Production Environment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following:
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_APP_ENV=production`

#### Step 4: Set Convex to Production

```powershell
npx convex env set APP_ENV production --prod
```

---

### Option 2: Deploy to Custom Server

#### Build for Production

```powershell
# Build the application
npm run build

# The output will be in the .next/ folder
```

#### Server Requirements

- Node.js 18+
- PM2 or similar process manager (recommended)

#### Deploy Script Example

```bash
#!/bin/bash
# deploy.sh

cd /var/www/ppdo-next

# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Build application
npm run build

# Restart with PM2
pm2 restart ppdo-next
```

---

## Post-Deployment Checklist

### Verify Production Setup

- [ ] Application loads without errors
- [ ] Authentication works correctly
- [ ] Database connections are working
- [ ] Environment variables are set correctly
- [ ] SSL/HTTPS is enabled
- [ ] Error tracking is configured (optional)
- [ ] Analytics is configured (optional)

### Security Checklist

- [ ] Remove `.env.local` from version control
- [ ] Set strong passwords for all accounts
- [ ] Enable two-factor authentication
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable audit logging

---

## Troubleshooting

### Common Issues

#### Issue: "Cannot find module 'convex'"

**Solution:**
```powershell
# Reinstall dependencies
npm install

# Or install convex specifically
npm install convex
```

#### Issue: "Convex URL not found"

**Solution:**
```powershell
# Check your .env.local file
cat .env.local

# Verify Convex is running
npx convex dev

# Get your Convex URL from the dashboard
# https://dashboard.convex.dev
```

#### Issue: "Module not found" errors

**Solution:**
```powershell
# Clear Next.js cache
rmdir /s /q .next

# Reinstall dependencies
npm install

# Restart dev server
npm run dev
```

#### Issue: "Port 3000 already in use"

**Solution:**
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F

# Or use a different port
npm run dev -- --port 3001
```

#### Issue: "Convex mutation failed"

**Solution:**
```powershell
# Check Convex logs
npx convex logs

# Verify schema is deployed
npx convex dev

# Check environment variables
npx convex env list
```

---

### Getting Help

1. Check the [Main Documentation](../README.md)
2. Review [Component Documentation](../components/ppdo/docs/README.md)
3. Check [Dashboard Documentation](../app/dashboard/docs/README.md)
4. Convex Docs: [docs.convex.dev](https://docs.convex.dev)
5. Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)

---

## Quick Reference

### Common Commands

```powershell
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Convex
npx convex dev       # Start Convex dev server
npx convex deploy    # Deploy to production
npx convex logs      # View Convex logs
npx convex env list  # List environment variables

# Git
git status           # Check status
git add .            # Stage changes
git commit -m "msg"  # Commit changes
git push             # Push to remote
```

### File Locations

| File/Folder | Purpose |
|-------------|---------|
| `.env.local` | Local environment variables |
| `convex/` | Backend functions |
| `app/` | Next.js App Router pages |
| `components/ppdo/` | PPDO components |
| `components/ui/` | shadcn/ui components |
| `docs/` | Documentation |

---

## Related Documentation

- [PowerShell Automation](./POWERSHELL_AUTOMATION.md)
- [Main README](../README.md)
- [Git Commit Convention](../README.md#-git-commit-convention)
