# ⚡ Quick Deploy - Hostinger VPS (PostgreSQL Installed)

## One-Command Setup Script

Copy and paste this entire block into your SSH terminal:

```bash
# Clone and setup
cd /var/www && \
git clone https://github.com/your-username/edschool.git && \
cd edschool && \
npm install && \
cd backend && npm install && \
cd ../frontend && npm install && \
cd .. && \
mkdir -p logs

# Create database (replace password)
sudo -u postgres psql << EOF
CREATE DATABASE edschool_db;
CREATE USER edschool_user WITH PASSWORD 'CHANGE_THIS_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE edschool_db TO edschool_user;
\q
EOF

# Grant schema permissions (IMPORTANT - fixes permission denied error)
sudo -u postgres psql -d edschool_db -c "GRANT ALL ON SCHEMA public TO edschool_user;"
sudo -u postgres psql -d edschool_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edschool_user;"
sudo -u postgres psql -d edschool_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edschool_user;"

# Setup backend .env
cd backend
cat > .env << 'ENVEOF'
DATABASE_URL="postgresql://edschool_user:CHANGE_THIS_PASSWORD@localhost:5432/edschool_db?schema=public"
JWT_SECRET="$(openssl rand -base64 32)"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN=""
ENVEOF

# Setup frontend .env
cd ../frontend
echo 'VITE_API_URL=""' > .env

# Setup database
cd ../backend
npx prisma generate
npx prisma migrate deploy

# Build
npm run build
cd ../frontend
npm run build

# Start with PM2
cd ..
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo "✅ Setup complete! Now configure Nginx (see DEPLOYMENT.md Step 10)"
```

**Important:** Replace `CHANGE_THIS_PASSWORD` with your actual database password in two places!

---

## Manual Step-by-Step (If Script Fails)

### 1. Clone Repository
```bash
cd /var/www
git clone https://github.com/your-username/edschool.git
cd edschool
```

### 2. Install Dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Create Database
```bash
sudo -u postgres psql
# Then in psql:
CREATE DATABASE edschool_db;
CREATE USER edschool_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edschool_db TO edschool_user;
\q

# Grant schema permissions (IMPORTANT - fixes permission denied error)
sudo -u postgres psql -d edschool_db -c "GRANT ALL ON SCHEMA public TO edschool_user;"
sudo -u postgres psql -d edschool_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO edschool_user;"
sudo -u postgres psql -d edschool_db -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO edschool_user;"
```

### 4. Setup Environment Files

**Backend:**
```bash
cd backend
nano .env
# Paste content from ENV_SETUP.md, replace password
```

**Frontend:**
```bash
cd ../frontend
echo 'VITE_API_URL=""' > .env
```

### 5. Setup & Build
```bash
cd ../backend
npx prisma generate
npx prisma migrate deploy
npm run build
cd ../frontend
npm run build
```

### 6. Start with PM2
```bash
cd ..
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 7. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/default
# Add location blocks from DEPLOYMENT.md Step 10
sudo nginx -t && sudo systemctl reload nginx
```

---

## Verify Everything Works

```bash
# Check PM2
pm2 list

# Test backend
curl http://localhost:3001/health

# Check database
psql -U edschool_user -d edschool_db -h localhost
```

**Access:** `http://your-server-ip/edschool`

---

## Quick Commands Reference

```bash
# Restart backend
pm2 restart edschool-backend

# View logs
pm2 logs edschool-backend

# Rebuild after changes
cd /var/www/edschool/backend && npm run build && \
cd ../frontend && npm run build && \
cd .. && pm2 restart edschool-backend
```

