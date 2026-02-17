# PWA Icon Generation Instructions

## Required Icons

To complete the PWA setup, generate the following icons:

### Required Files:
1. `pwa-192x192.png` - 192x192px
2. `pwa-512x512.png` - 512x512px  
3. `apple-touch-icon.png` - 180x180px
4. Splash screens for iOS (optional but recommended)

## Quick Icon Generation

### Option 1: Online Tools
- Visit: https://www.pwabuilder.com/imageGenerator
- Upload your logo (square, at least 512x512px)
- Download the generated icons
- Place them in `frontend/public/` directory

### Option 2: Using a Logo
If you have a logo file:
```bash
# Install sharp (image processing)
npm install -D sharp

# Create a script to generate icons
node generate-icons.js
```

### Option 3: Temporary Placeholder
For testing, create a simple colored square:
- Open any image editor
- Create 512x512px canvas with school's brand color (#0284c7 - blue)
- Add "ES" text in white
- Export as PNG
- Resize to create other sizes

## Brand Colors
- Primary: #0284c7 (Blue)
- Background: #ffffff (White)
- Theme: #0284c7

## Icon Design Tips
- Use simple, recognizable design
- Ensure it works at small sizes
- Use high contrast
- Avoid text smaller than 24px
- Use school logo or "ES" monogram

