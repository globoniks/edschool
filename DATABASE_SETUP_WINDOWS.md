# Database Setup Guide for Windows

## Issue
The application can't connect to PostgreSQL at `localhost:5432`. This guide will help you set up PostgreSQL on Windows.

## Option 1: Install PostgreSQL (Recommended)

### Step 1: Download and Install PostgreSQL
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Or use the installer: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
3. Run the installer and follow these steps:
   - Choose installation directory (default is fine)
   - Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Set data directory (default is fine)
   - **Set password for `postgres` user**: Use `postgres` (or remember what you set)
   - Set port: `5432` (default)
   - Set locale: Default locale

### Step 2: Verify Installation
Open PowerShell and check if PostgreSQL is running:
```powershell
Get-Service -Name "*postgresql*"
```

If the service exists but is stopped, start it:
```powershell
Start-Service postgresql-x64-XX  # Replace XX with your version number
```

### Step 3: Create Database
Open pgAdmin 4 (installed with PostgreSQL) or use psql:

**Using pgAdmin 4:**
1. Open pgAdmin 4
2. Connect to server (password: `postgres` or what you set)
3. Right-click "Databases" → Create → Database
4. Name: `edschool`
5. Click Save

**Using Command Line:**
```powershell
# Add PostgreSQL bin to PATH (replace XX with version)
$env:Path += ";C:\Program Files\PostgreSQL\XX\bin"

# Create database
psql -U postgres -c "CREATE DATABASE edschool;"
```

### Step 4: Update .env File
Your `.env` file in `backend/` should have:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edschool?schema=public"
```

**Important:** If you set a different password during installation, update it in the `.env` file.

### Step 5: Run Migrations and Seed
```powershell
cd "D:\globoniks projects\edschool\backend"
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

---

## Option 2: Use Docker (Alternative)

If you have Docker installed, you can run PostgreSQL in a container:

### Step 1: Run PostgreSQL Container
```powershell
docker run --name edschool-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=edschool `
  -p 5432:5432 `
  -d postgres:15
```

### Step 2: Verify Container is Running
```powershell
docker ps
```

### Step 3: Run Migrations
```powershell
cd "D:\globoniks projects\edschool\backend"
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

---

## Option 3: Use SQLite for Development (Quick Start)

If you want to quickly test without PostgreSQL, you can temporarily use SQLite:

### Step 1: Update Prisma Schema
Edit `backend/prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

### Step 2: Update .env
```env
DATABASE_URL="file:./dev.db"
```

### Step 3: Run Migrations
```powershell
cd "D:\globoniks projects\edschool\backend"
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

**Note:** SQLite has limitations. Use PostgreSQL for production.

---

## Troubleshooting

### PostgreSQL Service Not Found
If you can't find the PostgreSQL service:
1. Check if PostgreSQL is installed: Look in `C:\Program Files\PostgreSQL\`
2. If installed, add bin to PATH:
   ```powershell
   $env:Path += ";C:\Program Files\PostgreSQL\XX\bin"
   ```

### Connection Refused
- Check if PostgreSQL is running: `Get-Service postgresql*`
- Check if port 5432 is in use: `netstat -an | findstr 5432`
- Verify firewall isn't blocking port 5432

### Wrong Password
- If you forgot the password, you can reset it:
  1. Stop PostgreSQL service
  2. Edit `pg_hba.conf` (usually in `C:\Program Files\PostgreSQL\XX\data\`)
  3. Change `md5` to `trust` for local connections
  4. Start PostgreSQL
  5. Connect and change password: `ALTER USER postgres WITH PASSWORD 'newpassword';`
  6. Revert `pg_hba.conf` changes

### Database Doesn't Exist
Create it manually:
```powershell
psql -U postgres -c "CREATE DATABASE edschool;"
```

---

## Quick Test Connection

After setup, test the connection:
```powershell
cd "D:\globoniks projects\edschool\backend"
npx prisma db pull
```

If this works, your connection is good!





