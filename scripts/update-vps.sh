#!/usr/bin/env bash
# Run this on the VPS after pushing new code to update the deployed app.
# Usage: ./scripts/update-vps.sh [project-dir]
# Example: ./scripts/update-vps.sh
#          ./scripts/update-vps.sh /var/www/edschool

set -e

PROJECT_DIR="${1:-/var/www/edschool}"
cd "$PROJECT_DIR"

echo "==> Updating EdSchool at $PROJECT_DIR"

echo "==> 1. Pull latest code"
git pull

echo "==> 2. Install dependencies"
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

echo "==> 3. Prisma: generate + migrate"
cd backend
npx prisma generate
npx prisma migrate deploy
# Uncomment next line if you need to re-seed (e.g. new seed users)
# npx prisma db seed
cd ..

echo "==> 4. Build backend and frontend"
cd backend && npm run build && cd ..
cd frontend && npm run build && cd ..

echo "==> 5. Restart backend"
pm2 restart edschool-backend

echo "==> Done. Check: pm2 list && pm2 logs edschool-backend"
