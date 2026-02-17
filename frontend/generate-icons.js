/**
 * Simple PWA Icon Generator
 * Creates placeholder icons for PWA
 * 
 * Run: node generate-icons.js
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 }
];

const primaryColor = '#0284c7'; // Brand blue
const textColor = '#ffffff';

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, size, size);

  // Text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ES', size / 2, size / 2);

  // Save
  const buffer = canvas.toBuffer('image/png');
  const outputPath = path.join(__dirname, 'public', filename);
  fs.writeFileSync(outputPath, buffer);
  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

console.log('Generating PWA icons...\n');

try {
  sizes.forEach(({ name, size }) => {
    generateIcon(size, name);
  });
  console.log('\n✓ All icons generated successfully!');
  console.log('\nNote: These are placeholder icons. Replace with your school logo for production.');
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('\nAlternative: Use online tools like https://www.pwabuilder.com/imageGenerator');
}

