# PowerShell Automation Guide

> **[Official Repo of script here)](https://github.com/primex-melvin/primex-script.git)**

> Automate deployment from `ppdo-next` to `ppdo-staging`

---

## Overview

The `push-staging` PowerShell command streamlines moving code from `ppdo-next` (development) to `ppdo-staging` without manually deleting and copying folders.

---

## Features

- **Smart Sync**: Wipes the `ppdo-staging` folder but preserves `.git` (history), `.env*` (configs), and `node_modules` (dependencies)
- **Automatic Copy**: Transfers all new code from `ppdo-next`
- **Dependency Check**: Automatically runs `npm install` in the staging folder if `package.json` changed
- **Git Remote Configuration**: Automatically configures the correct remote URL and branch
- **Review Before Push**: Shows you a summary of changes and asks for confirmation before pushing
- **Git Integration**: Captures the last commit message from `ppdo-next` and automatically commits/pushes to the staging repository
- **Execution Logs**: Displays success/error messages and a timer showing how long the sync took

---

## Prerequisites

### Required Folder Structure

```
C:\ppdo\
├── ppdo-next\      (development branch)
└── ppdo-staging\   (staging branch)
```

---

## Setup Instructions

### Step 1: Open PowerShell Profile

1. Open PowerShell and type:
```powershell
notepad $PROFILE
```

2. If you get a message that the file doesn't exist, click **Yes** to create it

---

### Step 2: Add the Function

Paste the following function into the Notepad file:

```powershell
function push-staging {
    # 1. Configuration
    $rootPath    = "C:\ppdo"
    $stagingPath = "$rootPath\ppdo-staging"
    $sourcePath  = "$rootPath\ppdo-next"
    $protectedItems = @(".git", "node_modules")
    $remoteUrl = "https://github.com/mviner000/ppdo-staging.git"
    $targetBranch = "main"
    
    # --- ASK TO CHANGE REMOTE ORIGIN ---
    Write-Host "`n=== GIT REMOTE CONFIGURATION ===" -ForegroundColor Cyan
    Write-Host "Current repo origin url: " -ForegroundColor Yellow -NoNewline
    Write-Host "$remoteUrl" -ForegroundColor Gray
    $changeRemote = Read-Host "Do you want to change the git remote origin? (Y/N, default: N)"
    
    if ($changeRemote -eq 'Y' -or $changeRemote -eq 'y') {
        $newRemoteUrl = Read-Host "Enter new remote URL"
        if (![string]::IsNullOrWhiteSpace($newRemoteUrl)) {
            # Update the remote URL in this session
            $remoteUrl = $newRemoteUrl
            Write-Host "Remote URL updated to: $remoteUrl" -ForegroundColor Green
            
            # Auto-update the script itself with the new URL
            $profilePath = $PROFILE
            if (Test-Path $profilePath) {
                try {
                    $profileContent = Get-Content -Path $profilePath -Raw
                    # Replace the remoteUrl line with the new value
                    $pattern = '\$remoteUrl\s*=\s*"[^"]+"'
                    $replacement = '$remoteUrl = "' + $newRemoteUrl + '"'
                    $updatedContent = $profileContent -replace $pattern, $replacement
                    
                    if ($updatedContent -ne $profileContent) {
                        Set-Content -Path $profilePath -Value $updatedContent -NoNewline
                        Write-Host "Script updated with new remote URL (saved to profile)." -ForegroundColor Green
                    }
                } catch {
                    Write-Host "Note: Could not auto-update script file: $($_.Exception.Message)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "Empty URL entered. Keeping current remote: $remoteUrl" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Keeping current remote origin." -ForegroundColor Gray
    }
    
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    Write-Host "`n--- Starting Sync & Deploy: next -> staging ---" -ForegroundColor Cyan
    if (!(Test-Path $stagingPath) -or !(Test-Path $sourcePath)) {
        Write-Host "ERROR: Folder paths not found." -ForegroundColor Red
        Write-Host "Expected paths:" -ForegroundColor Yellow
        Write-Host "  Source: $sourcePath" -ForegroundColor Gray
        Write-Host "  Staging: $stagingPath" -ForegroundColor Gray
        return
    }
    try {
        # --- STEP 1: CAPTURE COLLEAGUE'S MESSAGE ---
        Write-Host "Step 1: Capturing last commit message from next..." -ForegroundColor Yellow
        Set-Location $sourcePath
        
        # Capture as string and trim whitespace
        $lastMessage = (git log -1 --pretty=%B 2>&1 | Out-String).Trim()
        
        # Check if message is empty or git command failed
        if ([string]::IsNullOrWhiteSpace($lastMessage) -or $LASTEXITCODE -ne 0) {
            throw "Could not capture git message from ppdo-next."
        }
        
        Write-Host "Captured Message: '$($lastMessage.Split("`n")[0])...'" -ForegroundColor Gray
        
        # --- STEP 2: CLEANING STAGING ---
        Write-Host "Step 2: Cleaning staging (preserving .git/modules)..." -ForegroundColor Yellow
        $itemsToDelete = Get-ChildItem -Path $stagingPath -Force | Where-Object {
            $name = $_.Name
            ($protectedItems -notcontains $name) -and ($name -notlike ".env*")
        }
        $itemsToDelete | ForEach-Object {
            Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction Stop
        }
        
        # --- STEP 3: COPYING FILES ---
        Write-Host "Step 3: Copying updated files..." -ForegroundColor Yellow
        $itemsToCopy = Get-ChildItem -Path $sourcePath -Force | Where-Object {
            $name = $_.Name
            ($protectedItems -notcontains $name) -and ($name -notlike ".env*")
        }
        $itemsToCopy | ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination $stagingPath -Recurse -Force -ErrorAction Stop
        }
        
        # --- STEP 4: NPM INSTALL ---
        Set-Location $stagingPath
        if (Test-Path "package.json") {
            Write-Host "Step 4: Running 'npm install'..." -ForegroundColor Yellow
            cmd /c "npm install"
            if ($LASTEXITCODE -ne 0) { throw "npm install failed." }
        }
        
        # --- STEP 5: CONFIGURE GIT REMOTE & BRANCH ---
        Write-Host "Step 5: Configuring git remote and branch..." -ForegroundColor Yellow
        
        # Check if origin exists
        $remoteExists = git remote get-url origin 2>$null
        
        if ($remoteExists) {
            # Update existing remote
            git remote set-url origin $remoteUrl
            Write-Host "Remote 'origin' updated to: $remoteUrl" -ForegroundColor Gray
        } else {
            # Add new remote
            git remote add origin $remoteUrl
            Write-Host "Remote 'origin' added: $remoteUrl" -ForegroundColor Gray
        }
        
        # Ensure we're on the correct branch
        $currentBranch = git branch --show-current
        if ($currentBranch -ne $targetBranch) {
            # Check if main branch exists
            $branchExists = git rev-parse --verify $targetBranch 2>$null
            if ($branchExists) {
                # Switch to existing main branch
                git checkout $targetBranch
                Write-Host "Switched to existing branch: $targetBranch" -ForegroundColor Gray
            } else {
                # Create and switch to new main branch
                git checkout -b $targetBranch
                Write-Host "Created and switched to new branch: $targetBranch" -ForegroundColor Gray
            }
        } else {
            Write-Host "Already on branch: $targetBranch" -ForegroundColor Gray
        }
        
        # --- STEP 6: GIT STATUS & REVIEW ---
        Write-Host "`nStep 6: Reviewing changes to be committed..." -ForegroundColor Yellow
        git add .
        
        # Show git status
        Write-Host "`n=== GIT STATUS ===" -ForegroundColor Cyan
        git status --short
        
        # Show commit summary
        Write-Host "`n=== COMMIT SUMMARY ===" -ForegroundColor Cyan
        Write-Host "Branch: $targetBranch" -ForegroundColor White
        Write-Host "Remote: $remoteUrl" -ForegroundColor White
        Write-Host "Commit Message: $lastMessage" -ForegroundColor White
        
        # Count changes
        $statusOutput = git status --short
        if ($statusOutput) {
            $fileCount = ($statusOutput | Measure-Object).Count
            Write-Host "Files Changed: $fileCount" -ForegroundColor White
        } else {
            Write-Host "Files Changed: 0 (No changes detected)" -ForegroundColor Gray
        }
        
        # --- STEP 7: CONFIRMATION PROMPT ---
        Write-Host "`n=== CONFIRMATION ===" -ForegroundColor Yellow
        Write-Host "Ready to commit and push to staging repository." -ForegroundColor White
        $confirmation = Read-Host "Proceed with push? (Y/N)"
        
        if ($confirmation -ne 'Y' -and $confirmation -ne 'y') {
            Write-Host "`nPush cancelled by user." -ForegroundColor Yellow
            $sw.Stop()
            Write-Host "Time: $($sw.Elapsed.TotalSeconds.ToString('N2'))s" -ForegroundColor Cyan
            return
        }
        
        # --- STEP 8: GIT COMMIT & PUSH ---
        Write-Host "`nStep 7: Committing and Pushing to staging..." -ForegroundColor Yellow
        
        # We use the captured message exactly as it was
        git commit -m "$lastMessage"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Pushing to origin/$targetBranch..." -ForegroundColor Yellow
            
            # Set upstream and push to main
            git push --set-upstream origin $targetBranch
            
            if ($LASTEXITCODE -ne 0) { throw "git push failed." }
            Write-Host "Success: Code pushed to staging repository on $targetBranch branch." -ForegroundColor Green
        } else {
            Write-Host "Note: No changes detected to commit." -ForegroundColor Gray
        }
        
        $sw.Stop()
        Write-Host "`nTOTAL SUCCESS: Sync, Install, and Push complete!" -ForegroundColor Green
        Write-Host "Time: $($sw.Elapsed.TotalSeconds.ToString('N2'))s" -ForegroundColor Cyan
        
    } catch {
        $sw.Stop()
        Write-Host "`nFATAL ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Process halted." -ForegroundColor DarkRed
    }
}
```

---

### Step 3: Save and Reload

1. Save the file and close Notepad (`Ctrl+S`, then close)
2. Restart PowerShell **OR** run this command to reload your profile:

```powershell
. $PROFILE
```

---

## Usage

Simply type the command from anywhere in your terminal:

```powershell
push-staging
```

The script will:
1. Capture the last commit message from `ppdo-next`
2. Clean the staging folder (keeping `.git`, `node_modules`, and `.env*` files)
3. Copy all updated files from `ppdo-next`
4. Run `npm install` if needed
5. Configure git remote and branch
6. Show you a summary of changes
7. Ask for confirmation before pushing
8. Commit and push to the staging repository

---

## Troubleshooting

### Error: "Folder paths not found"
- Make sure you have both `C:\ppdo\ppdo-next` and `C:\ppdo\ppdo-staging` folders
- The script will show you which paths it's looking for

### Error: "Could not capture git message"
- Make sure you have at least one commit in your `ppdo-next` repository
- Navigate to `ppdo-next` and run `git log` to verify commits exist

### Error: "npm install failed"
- Check your internet connection
- Verify Node.js and npm are properly installed
- Try running `npm install` manually in the staging folder

### Error: "git push failed"
- Check your internet connection
- Verify you have write access to the staging repository
- Check if the remote URL is correct

---

## Customization

To customize the script for your setup, edit these variables at the top of the function:

```powershell
$rootPath    = "C:\ppdo"                                    # Root folder
$stagingPath = "$rootPath\ppdo-staging"                    # Staging folder
$sourcePath  = "$rootPath\ppdo-next"                       # Source folder
$remoteUrl   = "https://github.com/USER/REPO.git"         # Git remote URL
$targetBranch = "main"                                      # Target branch
```

---

## Related Documentation

- [Development & Production Setup](./SETUP_GUIDE.md)
- [Main README](../README.md)
