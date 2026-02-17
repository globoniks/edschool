# PWA Quick Start Guide

## 🚀 Make EdSchool Installable as a PWA

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Generate Icons (Choose One Method)

**Option A - Node.js (Recommended):**
```bash
npm install sharp --save-dev
node ../scripts/generate-pwa-icons.js
```

**Option B - ImageMagick:**
```bash
# Windows
scripts\generate-pwa-icons.bat

# Linux/Mac  
magick frontend/public/pwa-192x192.png -resize 512x512 frontend/public/pwa-512x512.png
magick frontend/public/pwa-192x192.png -resize 180x180 frontend/public/apple-touch-icon.png
```

**Option C - Manual:**
1. Open `frontend/public/pwa-192x192.png` in any image editor
2. Resize to 512x512 → Save as `pwa-512x512.png`
3. Resize to 180x180 → Save as `apple-touch-icon.png`

### Step 3: Build & Test
```bash
cd frontend
npm run build
npm run preview  # Test the built version
```

### Step 4: Install the App

**Desktop (Chrome/Edge):**
- Look for install icon in address bar
- Or wait for install prompt (appears after 3 seconds)

**Android:**
- Tap menu → "Install app" or "Add to Home screen"
- Or use the install prompt

**iOS:**
- Open in Safari
- Tap Share → "Add to Home Screen"
- Follow on-screen instructions

## ✅ What's Included

- ✅ Offline support (cached assets)
- ✅ Install prompt (automatic)
- ✅ App shortcuts (Dashboard, Attendance)
- ✅ Auto-updates (service worker)
- ✅ Standalone mode (no browser UI)

## 📖 Full Documentation

See `frontend/PWA_SETUP.md` for detailed configuration and troubleshooting.
