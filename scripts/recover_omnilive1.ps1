<# 
.SYNOPSIS
    Recovery script for omnilive1.esggo.co service on VPS
.DESCRIPTION
    This script performs automated recovery of the OmniLive service:
    1. Pulls latest code from GitHub
    2. Installs dependencies
    3. Reloads PM2 services
    4. Verifies service health

.NOTES
    Author: Hermes Agent / OA-Team
    Date: 2026-09-05
    Requires: SSH access to esggo-vps alias
#>

# Recovery logic:
# - SSH to VPS
# - git pull origin main
# - pnpm install --frozen-lockfile=false
# - pm2 reload ecosystem.config.js --env production
# - curl health check

$ErrorActionPreference = "Stop"

Write-Host "Starting OmniLive1 recovery..." -ForegroundColor Cyan

# Step 1: Pull latest on VPS
Write-Host "Step 1: Pulling latest from GitHub..." -ForegroundColor Yellow
ssh esggo-vps "cd /opt/esggo && git pull origin main 2>&1 | tail -10"

# Step 2: Install dependencies
Write-Host "Step 2: Installing dependencies..." -ForegroundColor Yellow
ssh esggo-vps "cd /opt/esggo && CI=true pnpm install --frozen-lockfile=false 2>&1 | tail -5"

# Step 3: Reload PM2 services
Write-Host "Step 3: Reloading PM2 services..." -ForegroundColor Yellow
ssh esggo-vps "cd /opt/esggo && pm2 reload ecosystem.config.js --env production 2>&1"

# Step 4: Wait and verify
Write-Host "Step 4: Waiting for services to stabilize..." -ForegroundColor Yellow
ssh esggo-vps "sleep 3 && curl -s http://localhost:8642/health"

Write-Host "Recovery complete!" -ForegroundColor Green
