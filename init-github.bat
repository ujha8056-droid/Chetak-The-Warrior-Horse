@echo off
echo =======================================================
echo GitHub Auto-Setup for Chetak The Warrior Horse
echo =======================================================
echo.
echo Step 1: Installing Git... (Please click YES if a security prompt appears)
winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements

echo.
echo Step 2: Refreshing environment...
setx PATH "%PATH%;C:\Program Files\Git\cmd"

echo.
echo Step 3: Setting up the GitHub link...
"C:\Program Files\Git\cmd\git.exe" init
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Initial professional commit by Antigravity"
"C:\Program Files\Git\cmd\git.exe" branch -M main
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/ujha8056-droid/Chetak-The-Warrior-Horse.git

echo.
echo Step 4: Uploading to GitHub... (A browser window will open for you to login)
"C:\Program Files\Git\cmd\git.exe" push -u origin main

echo.
echo =======================================================
echo Setup Complete! 
echo Future updates can be done just by running "npm run deploy"
echo =======================================================
pause
