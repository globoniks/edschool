# PWA Icon Setup

The PWA requires icons in multiple sizes. Currently, you have:
- ✅ `pwa-192x192.png` (exists)

## Required Icons

You need to create the following icons:

1. **pwa-512x512.png** (512x512 pixels) - Required for PWA manifest
2. **apple-touch-icon.png** (180x180 pixels) - For iOS home screen
3. **favicon.ico** (16x16, 32x32, 48x48) - Browser favicon

## Quick Setup Options

### Option 1: Use Online Tools
1. Visit https://realfavicongenerator.net/
2. Upload your logo/icon
3. Download all generated icons
4. Place them in `frontend/public/`

### Option 2: Use ImageMagick (if installed)
```bash
# Resize existing 192x192 to 512x512
magick frontend/public/pwa-192x192.png -resize 512x512 frontend/public/pwa-512x512.png

# Create apple-touch-icon
magick frontend/public/pwa-192x192.png -resize 180x180 frontend/public/apple-touch-icon.png
```

### Option 3: Manual Creation
1. Open `pwa-192x192.png` in an image editor
2. Resize to 512x512 pixels
3. Save as `pwa-512x512.png`
4. Resize to 180x180 pixels
5. Save as `apple-touch-icon.png`

## Icon Requirements

- **Format**: PNG with transparency
- **Background**: Can be transparent or solid color
- **Content**: Should be your app logo/brand
- **Maskable**: The 512x512 icon should work as a maskable icon (safe zone: 80% of icon)

## Testing

After adding icons:
1. Run `npm run build` in the frontend directory
2. Check `dist/manifest.webmanifest` to verify icons are included
3. Test PWA installation on:
   - Chrome/Edge (Desktop & Android)
   - Safari (iOS)
   - Firefox (Desktop)
