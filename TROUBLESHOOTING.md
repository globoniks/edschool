# 🔧 Troubleshooting Guide - Backend Not Starting

## Quick Diagnostic Commands

Run these commands to diagnose the issue:

```bash
# 1. Check PM2 status
pm2 list

# 2. Check backend logs (most important!)
pm2 logs edschool-backend --lines 50

# 3. Check if backend process is running
ps aux | grep "edschool-backend"

# 4. Check if port 3001 is in use
netstat -tulpn | grep 3001

# 5. Check if dist folder exists
ls -la /var/www/edschool/backend/dist/

# 6. Check if .env file exists
ls -la /var/www/edschool/backend/.env

# 7. Test backend directly (without PM2)
cd /var/www/edschool/backend
node dist/index.js
```

---

## Common Issues & Solutions

### Issue 1: Backend shows "errored" or "stopped" in PM2

**Check logs:**
```bash
pm2 logs edschool-backend --lines 100
```

**Common causes:**
- Missing `.env` file
- Database connection error
- Port already in use
- Build failed (no `dist` folder)

**Solution:**
```bash
# Stop the process
pm2 stop edschool-backend
pm2 delete edschool-backend

# Verify .env exists and has correct values
cat /var/www/edschool/backend/.env

# Verify build exists
ls -la /var/www/edschool/backend/dist/index.js

# Restart
cd /var/www/edschool
pm2 start ecosystem.config.js
pm2 logs edschool-backend
```

---

### Issue 2: "Cannot find module" or "dist/index.js not found"

**Problem:** Backend wasn't built or build failed.

**Solution:**
```bash
cd /var/www/edschool/backend
npm run build

# Verify build
ls -la dist/index.js

# Restart PM2
cd ..
pm2 restart edschool-backend
```

---

### Issue 3: Database Connection Error

**Error in logs:** `Can't reach database server` or `Connection refused`

**Solution:**
```bash
# 1. Check .env file has correct DATABASE_URL
cat /var/www/edschool/backend/.env | grep DATABASE_URL

# 2. Test database connection
psql -U edschool_user -d edschool_db -h localhost

# 3. If connection fails, check PostgreSQL is running
sudo systemctl status postgresql

# 4. Verify database exists
sudo -u postgres psql -c "\l" | grep edschool_db
```

---

### Issue 4: Port 3001 Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Find what's using port 3001
sudo lsof -i :3001
# or
netstat -tulpn | grep 3001

# Kill the process if needed
sudo kill -9 <PID>

# Or use a different port in .env
nano /var/www/edschool/backend/.env
# Change PORT=3001 to PORT=3002
# Update ecosystem.config.js too
pm2 restart edschool-backend
```

---

### Issue 5: Missing .env File

**Solution:**
```bash
cd /var/www/edschool/backend

# Create .env file
nano .env

# Paste this (update with your actual values):
DATABASE_URL="postgresql://edschool_user:root@localhost:5432/edschool_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN=""

# Save and restart
cd ..
pm2 restart edschool-backend
```

---

### Issue 6: Permission Denied Errors

**Solution:**
```bash
# Check file permissions
ls -la /var/www/edschool/backend/dist/index.js

# Fix permissions if needed
chmod +x /var/www/edschool/backend/dist/index.js
chown -R $USER:$USER /var/www/edschool

# Check logs directory
mkdir -p /var/www/edschool/logs
chmod 755 /var/www/edschool/logs
```

---

### Issue 7: PM2 Process Shows "online" but Backend Not Responding

**Test backend directly:**
```bash
# Test health endpoint
curl http://localhost:3001/health

# If curl fails, check if process is actually running
ps aux | grep node

# Check PM2 logs for errors
pm2 logs edschool-backend --lines 50
```

---

## Step-by-Step Recovery

If backend is completely down, follow these steps:

```bash
# 1. Stop and remove from PM2
pm2 stop edschool-backend
pm2 delete edschool-backend

# 2. Verify environment
cd /var/www/edschool/backend
cat .env  # Should show your database URL and JWT secret

# 3. Verify build
ls -la dist/index.js  # Should exist

# 4. Test database connection
psql -U edschool_user -d edschool_db -h localhost -c "SELECT 1;"

# 5. Test backend manually
node dist/index.js
# Press Ctrl+C after seeing "Server running on port 3001"

# 6. Start with PM2
cd /var/www/edschool
pm2 start ecosystem.config.js

# 7. Check status
pm2 status
pm2 logs edschool-backend

# 8. Test health endpoint
curl http://localhost:3001/health
```

---

## Quick Fix Script

Run this to automatically diagnose and fix common issues:

```bash
cd /var/www/edschool

# Check and create .env if missing
if [ ! -f backend/.env ]; then
    echo "⚠️  .env file missing! Creating template..."
    cat > backend/.env << 'EOF'
DATABASE_URL="postgresql://edschool_user:root@localhost:5432/edschool_db?schema=public"
JWT_SECRET="change-this-to-a-random-32-character-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN=""
EOF
    echo "✅ Created .env file - PLEASE UPDATE WITH YOUR ACTUAL VALUES!"
fi

# Check and create logs directory
mkdir -p logs

# Check if dist exists
if [ ! -f backend/dist/index.js ]; then
    echo "⚠️  Build missing! Building backend..."
    cd backend
    npm run build
    cd ..
fi

# Restart PM2
pm2 restart edschool-backend || pm2 start ecosystem.config.js

# Show status
pm2 status
echo ""
echo "📋 Recent logs:"
pm2 logs edschool-backend --lines 20 --nostream
```

---

## Still Not Working?

1. **Check full error logs:**
   ```bash
   pm2 logs edschool-backend --err --lines 100
   cat /var/www/edschool/logs/backend-error.log
   ```

2. **Check system resources:**
   ```bash
   free -h
   df -h
   ```

3. **Check Node.js version:**
   ```bash
   node --version  # Should be 18+
   ```

4. **Verify all dependencies installed:**
   ```bash
   cd /var/www/edschool/backend
   npm install
   ```

---

## Success Indicators

When backend is working correctly, you should see:

```bash
# PM2 status shows "online"
pm2 list
# Should show: edschool-backend | online | 1 | 0 | 0% | 50mb

# Health endpoint responds
curl http://localhost:3001/health
# Should return: {"status":"ok","timestamp":"..."}

# Logs show server started
pm2 logs edschool-backend --lines 5
# Should show: 🚀 Server running on port 3001
```






