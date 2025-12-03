# Environment Variables Setup

## Backend Environment File

Create `backend/.env` with the following content:

```env
DATABASE_URL="postgresql://edschool_user:YOUR_PASSWORD@localhost:5432/edschool_db?schema=public"
JWT_SECRET="change-this-to-a-random-32-character-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN=""
```

**Important:**
- Replace `YOUR_PASSWORD` with your actual database password
- Replace `edschool_user` and `edschool_db` with your actual database username and database name
- Generate a strong random string for `JWT_SECRET` (minimum 32 characters)

## Frontend Environment File

Create `frontend/.env` with the following content:

```env
VITE_API_URL=""
```

**Note:** Leave empty for subdirectory deployment (recommended). The frontend will use relative paths `/api`.

---

## Quick Setup Commands

```bash
# Backend
cd backend
cat > .env << 'EOF'
DATABASE_URL="postgresql://edschool_user:YOUR_PASSWORD@localhost:5432/edschool_db?schema=public"
JWT_SECRET="change-this-to-a-random-32-character-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=production
CORS_ORIGIN=""
EOF

# Frontend
cd ../frontend
cat > .env << 'EOF'
VITE_API_URL=""
EOF
```

**Remember to replace the placeholder values with your actual credentials!**

