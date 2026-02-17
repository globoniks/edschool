# PWA Installation Troubleshooting

## Why Installation Option Might Not Appear

### Common Reasons:

1. **Running in Development Mode**
   - PWA install prompt works best in production builds
   - Service worker may not register properly in dev mode
   - **Solution**: Build and test with `npm run build && npm run preview`

2. **Not Served Over HTTPS**
   - PWAs require HTTPS (except localhost)
   - **Solution**: Deploy to a server with HTTPS or use localhost

3. **Browser Requirements Not Met**
   - Chrome/Edge: Full support
   - Firefox: Limited support
   - Safari: iOS only, requires manual installation
   - **Solution**: Use Chrome/Edge for best experience

4. **Service Worker Not Registered**
   - Check DevTools → Application → Service Workers
   - Should see "activated and running"
   - **Solution**: Clear cache, rebuild, and reload

5. **Manifest Not Found**
   - Check DevTools → Application → Manifest
   - Should show manifest details
   - **Solution**: Verify `dist/manifest.webmanifest` exists after build

## Quick Fixes

### 1. Check Service Worker Registration

Open browser DevTools (F12):
- Go to **Application** tab
- Click **Service Workers** in left sidebar
- Should see: `sw.js` with status "activated and running"

If not registered:
```bash
cd frontend
npm run build
npm run preview
# Clear browser cache (Ctrl+Shift+Delete)
# Reload page
```

### 2. Check Manifest

In DevTools → Application → Manifest:
- Should show app name, icons, theme color
- Icons should be green (loaded successfully)

If icons are red:
- Verify `pwa-192x192.png` and `pwa-512x512.png` exist in `frontend/public/`
- Rebuild the app

### 3. Manual Installation Methods

**Chrome/Edge Desktop:**
1. Look for install icon (⊕) in address bar
2. Or: Menu (⋮) → "Install EdSchool"
3. Or: Settings → Apps → "Install app"

**Chrome Android:**
1. Menu (⋮) → "Install app" or "Add to Home screen"
2. Or: Browser will show banner at bottom

**Safari iOS:**
1. Tap Share button (square with arrow)
2. Scroll down → "Add to Home Screen"
3. Tap "Add"

### 4. Force Show Install Prompt

The install prompt should appear automatically, but if it doesn't:

1. **Clear localStorage:**
   ```javascript
   localStorage.removeItem('pwa-install-dismissed');
   ```

2. **Check if already installed:**
   - If running in standalone mode, install option won't show
   - Check: `window.matchMedia('(display-mode: standalone)').matches`

3. **Rebuild and test:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

## Testing Checklist

- [ ] Built with `npm run build` (not just `npm run dev`)
- [ ] Testing with `npm run preview` or deployed build
- [ ] Using Chrome/Edge browser
- [ ] Service worker registered (DevTools → Application)
- [ ] Manifest loaded (DevTools → Application)
- [ ] Icons exist and are valid PNG files
- [ ] Not already installed (not in standalone mode)
- [ ] localStorage not blocking prompt

## Debug Commands

Open browser console and run:

```javascript
// Check if service worker is registered
navigator.serviceWorker.getRegistrations().then(regs => console.log('SW registrations:', regs));

// Check if manifest is loaded
fetch('/manifest.webmanifest').then(r => r.json()).then(m => console.log('Manifest:', m));

// Check if in standalone mode
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);

// Clear install prompt dismissal
localStorage.removeItem('pwa-install-dismissed');
location.reload();
```

## Still Not Working?

1. **Verify build output:**
   - Check `dist/manifest.webmanifest` exists
   - Check `dist/sw.js` exists
   - Check icons in `dist/` folder

2. **Check browser console:**
   - Look for errors related to service worker
   - Look for manifest loading errors

3. **Try different browser:**
   - Chrome/Edge have best PWA support
   - Firefox has limited support
   - Safari (desktop) doesn't support PWA installation

4. **Verify HTTPS:**
   - PWAs require HTTPS (except localhost)
   - Check URL starts with `https://` or `http://localhost`
