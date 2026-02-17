# PWA Setup Guide

EdSchool is configured as a Progressive Web App (PWA) that can be installed on devices.

## ✅ What's Already Configured

- ✅ `vite-plugin-pwa` plugin configured
- ✅ Service worker with offline caching
- ✅ Web app manifest
- ✅ Install prompt component
- ✅ PWA meta tags in HTML

## 📦 Installation Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install `vite-plugin-pwa` which is required for PWA functionality.

### 2. Generate PWA Icons

You need to create the required icons. Choose one method:

#### Option A: Using Node.js Script (Recommended)
```bash
# Install sharp for image processing
npm install sharp --save-dev

# Generate icons
node ../scripts/generate-pwa-icons.js
```

#### Option B: Using ImageMagick
```bash
# Windows
scripts\generate-pwa-icons.bat

# Linux/Mac
magick frontend/public/pwa-192x192.png -resize 512x512 frontend/public/pwa-512x512.png
magick frontend/public/pwa-192x192.png -resize 180x180 frontend/public/apple-touch-icon.png
```

#### Option C: Manual Creation
1. Open `frontend/public/pwa-192x192.png` in an image editor
2. Resize to 512x512 pixels → Save as `pwa-512x512.png`
3. Resize to 180x180 pixels → Save as `apple-touch-icon.png`

### 3. Build the Application

```bash
cd frontend
npm run build
```

The build process will:
- Generate the service worker
- Create the web app manifest
- Bundle all assets for offline use

### 4. Test PWA Installation

#### Desktop (Chrome/Edge)
1. Open the built app in a browser
2. Look for the install icon in the address bar
3. Or use the install prompt that appears
4. Click "Install" to add to desktop

#### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen" or "Install app"
4. Or use the install prompt

#### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

## 🔧 Configuration

### Manifest Settings

The PWA manifest is configured in `frontend/vite.config.ts`:

- **Name**: EdSchool - School Management System
- **Short Name**: EdSchool
- **Theme Color**: #0284c7 (blue)
- **Display Mode**: Standalone (app-like experience)
- **Orientation**: Portrait

### Service Worker

The service worker is automatically generated and includes:
- **Offline caching** for static assets
- **Network-first** strategy for API calls
- **Cache-first** strategy for images
- **Auto-update** when new version is available

### Install Prompt

The install prompt (`PWAInstallPrompt` component) automatically:
- Shows on supported browsers after 3-5 seconds
- Detects iOS and shows manual instructions
- Remembers if user dismissed it
- Only shows if app is not already installed

## 🚀 Features

### Offline Support
- Static assets are cached
- App works offline (with cached data)
- API calls use network-first strategy

### App Shortcuts
Quick access shortcuts configured:
- Dashboard
- Attendance

### Auto-Updates
- Service worker checks for updates automatically
- New version installs in background
- User is notified when update is ready

## 🐛 Troubleshooting

### Icons Not Showing
- Ensure all icon files exist in `frontend/public/`
- Check file names match exactly (case-sensitive)
- Verify icons are valid PNG files

### Install Prompt Not Appearing
- Ensure app is served over HTTPS (or localhost)
- Check browser console for errors
- Verify manifest is generated correctly
- Clear browser cache and try again

### Service Worker Not Registering
- Check browser console for errors
- Verify `vite-plugin-pwa` is installed
- Ensure build completed successfully
- Check network tab for service worker requests

### iOS Installation Issues
- iOS requires manual installation (no automatic prompt)
- Must use Safari browser
- Follow the manual instructions shown in the prompt

## 📱 Testing Checklist

- [ ] Icons display correctly in browser tab
- [ ] Install prompt appears (desktop/Android)
- [ ] App installs successfully
- [ ] App opens in standalone mode (no browser UI)
- [ ] Offline mode works (disable network, reload)
- [ ] Service worker registers correctly
- [ ] Updates are detected automatically

## 🔗 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
