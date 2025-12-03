# 🚀 Quick Deployment Guide - EdSchool on Hostinger

## Prerequisites
- ✅ Existing project: edumapping (port 5000) - **No conflicts!**
- ✅ PostgreSQL running on port 5432
- ✅ Nginx running on ports 80/443
- ✅ EdSchool will use port **3001**

---

## Step 1: SSH into Your Server

```bash
ssh root@your-server-ip
# or
ssh username@your-server-ip
```

---

## Step 2: Clone Your Repository

```bash
cd /var/www
git clone https://github.com/your-username/edschool.git
cd edschool
```

---

## Step 3: Create PostgreSQL Database

1. **Login to hPanel** → **Databases** → **PostgreSQL Databases**
2. Click **Create Database**
3. Fill in:
   - Database name: `edschool_db`
   - Username: `edschool_user`
   - Password: (choose a strong password)
4. **Note down** the connection details

---

## Step 4: Install Dependencies

```bash
cd /var/www/edschool
npm install
cd backend && npm install
cd ../frontend && npm install
```

---

## Step 5: Setup Environment Variables

### Backend Environment

```bash
cd /var/www/edschool/backend
nano .env
```

Paste this (replace with your actual database credentials):

```env
DATABASE_URL="postgresql://edschool_user:YOUR_PASSWORD@localhost:5432/edschool_db?schema=public"
JWT_SECRET="change-this-to-a-random-32-character-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN=""
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### Frontend Environment

```bash
cd /var/www/edschool/frontend
nano .env
```

Paste this:

```env
VITE_API_URL=""
```

Save: `Ctrl+X`, then `Y`, then `Enter`

---

## Step 6: Setup Database

```bash
cd /var/www/edschool/backend
npx prisma generate
npx prisma migrate deploy
```

---

## Step 7: Build the Application

```bash
# Build backend
cd /var/www/edschool/backend
npm run build

# Build frontend
cd /var/www/edschool/frontend
npm run build
```

---

## Step 8: Create Logs Directory

```bash
cd /var/www/edschool
mkdir -p logs
```

---

## Step 9: Start Backend with PM2

```bash
cd /var/www/edschool
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Follow the instructions from `pm2 startup` to enable auto-start on reboot.

**Verify it's running:**
```bash
pm2 list
pm2 logs edschool-backend
```

**Test backend:**
```bash
curl http://localhost:3001/health
```

You should see: `{"status":"ok","timestamp":"..."}`

---

## Step 10: Configure Nginx (Subdirectory Method)

Edit your Nginx config:

```bash
sudo nano /etc/nginx/sites-available/default
```

**Find your existing server block** and add these lines inside it (before the closing `}`):

```nginx
    # EdSchool frontend - subdirectory
    location /edschool {
        alias /var/www/edschool/frontend/dist;
        try_files $uri $uri/ /edschool/index.html;
        index index.html;
    }
    
    # EdSchool API - subdirectory
    location /edschool/api {
        rewrite ^/edschool/api/(.*) /api/$1 break;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
```

**Save and test:**
```bash
sudo nginx -t
```

If test passes, reload:
```bash
sudo systemctl reload nginx
```

---

## Step 11: Test Your Application

1. **Open browser:** `http://your-server-ip/edschool`
2. **Or if you have a domain:** `http://your-domain.com/edschool`

You should see the EdSchool login page!

---

## ✅ Quick Verification Checklist

- [ ] Backend running: `pm2 list` shows `edschool-backend` as online
- [ ] Backend health: `curl http://localhost:3001/health` returns OK
- [ ] Frontend accessible: Browser shows EdSchool at `/edschool`
- [ ] No port conflicts: `netstat -tulpn | grep 3001` shows your process

---

## 🔧 Common Commands

```bash
# Restart backend
pm2 restart edschool-backend

# View logs
pm2 logs edschool-backend

# Stop backend
pm2 stop edschool-backend

# Rebuild after code changes
cd /var/www/edschool/backend && npm run build
cd /var/www/edschool/frontend && npm run build
pm2 restart edschool-backend
```

---

## 🐛 Troubleshooting

### Backend not starting?
```bash
pm2 logs edschool-backend
cd /var/www/edschool/backend
node dist/index.js  # Test directly
```

### Database connection error?
- Check `.env` file has correct `DATABASE_URL`
- Verify database exists: `psql -U edschool_user -d edschool_db`

### Frontend shows 404?
- Check Nginx config: `sudo nginx -t`
- Check files exist: `ls -la /var/www/edschool/frontend/dist`
- Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`

### Port already in use?
```bash
netstat -tulpn | grep 3001
pm2 list  # Check if process is running
```

---

## 📁 Final File Structure

```
/var/www/
├── edumapping/          # Your existing project (port 5000)
│   └── ...
└── edschool/            # New EdSchool project (port 3001)
    ├── backend/
    │   ├── .env         # Your database credentials
    │   ├── dist/        # Built backend
    │   └── ...
    ├── frontend/
    │   ├── .env         # API URL config
    │   ├── dist/        # Built frontend
    │   └── ...
    ├── ecosystem.config.js
    └── logs/
```

---

## 🎉 Done!

Your EdSchool application should now be running at:
- **Frontend:** `http://your-server-ip/edschool`
- **Backend API:** `http://your-server-ip/edschool/api`

Both projects can run simultaneously without conflicts! 🚀

