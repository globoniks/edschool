/**
 * Script to generate PWA icons from existing 192x192 icon
 * 
 * Requirements:
 * - Node.js with sharp package: npm install sharp --save-dev
 * - Or use ImageMagick: magick frontend/public/pwa-192x192.png -resize 512x512 frontend/public/pwa-512x512.png
 * 
 * Usage:
 * node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../frontend/public');
const sourceIcon = path.join(publicDir, 'pwa-192x192.png');
const target512 = path.join(publicDir, 'pwa-512x512.png');
const target180 = path.join(publicDir, 'apple-touch-icon.png');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('Sharp not found. Install it with: npm install sharp --save-dev');
  console.log('\nAlternatively, use ImageMagick:');
  console.log(`magick "${sourceIcon}" -resize 512x512 "${target512}"`);
  console.log(`magick "${sourceIcon}" -resize 180x180 "${target180}"`);
  process.exit(1);
}

async function createPlaceholderIcon(size, outputPath, label) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0284c7"/>
      <text 
        x="50%" 
        y="50%" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.3}" 
        font-weight="bold" 
        fill="white" 
        text-anchor="middle" 
        dominant-baseline="middle"
      >${label}</text>
    </svg>
  `;
  
  return sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);
}

async function generateIcons() {
  try {
    let sourceExists = false;
    let sourceIsValid = false;

    // Check if source exists and is valid
    if (fs.existsSync(sourceIcon)) {
      try {
        const metadata = await sharp(sourceIcon).metadata();
        if (metadata.format === 'png' || metadata.format === 'jpeg' || metadata.format === 'webp') {
          sourceIsValid = true;
          sourceExists = true;
        }
      } catch (e) {
        // File exists but is not a valid image
        console.log('⚠️  Source icon file exists but is not a valid image format');
      }
    }

    if (!sourceExists || !sourceIsValid) {
      console.log('📝 Creating placeholder icons...');
      console.log('   (You can replace these with your actual logo later)');
      
      // Create placeholder 192x192 first
      await createPlaceholderIcon(192, sourceIcon, 'ES');
      console.log(`✅ Created placeholder: ${sourceIcon}`);
    }

    console.log('Generating PWA icons...');

    // Generate 512x512 icon
    await sharp(sourceIcon)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 2, g: 132, b: 199, alpha: 1 } // #0284c7
      })
      .png()
      .toFile(target512);
    console.log(`✅ Created: ${target512}`);

    // Generate 180x180 apple-touch-icon
    await sharp(sourceIcon)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 2, g: 132, b: 199, alpha: 1 } // #0284c7
      })
      .png()
      .toFile(target180);
    console.log(`✅ Created: ${target180}`);

    console.log('\n🎉 All PWA icons generated successfully!');
    if (!sourceIsValid) {
      console.log('\n💡 Tip: Replace pwa-192x192.png with your actual logo for better branding');
    }
  } catch (error) {
    console.error('Error generating icons:', error.message);
    process.exit(1);
  }
}

generateIcons();
