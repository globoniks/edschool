/**
 * Brand icon generator — renders every PNG/ICO app icon from the source
 * brand SVGs in public/brand. Run after changing the logo:
 *
 *   node generate-icons.js
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const brandDir = path.join(publicDir, 'brand');
const repoRoot = path.join(__dirname, '..');

const logo = fs.readFileSync(path.join(brandDir, 'logo.svg'));
const maskable = fs.readFileSync(path.join(brandDir, 'logo-maskable.svg'));

/** PNG targets: [source svg, output file, pixel size] */
const targets = [
  [logo, 'pwa-192x192.png', 192],
  [logo, 'pwa-512x512.png', 512],
  [maskable, 'pwa-maskable-512x512.png', 512],
  [logo, 'apple-touch-icon.png', 180],
  [logo, 'favicon-16.png', 16],
  [logo, 'favicon-32.png', 32],
  [logo, 'favicon-48.png', 48],
];

const render = (svg, size) =>
  sharp(svg, { density: 384 }).resize(size, size, { fit: 'contain' }).png().toBuffer();

/** Pack PNG buffers into an .ico container (PNG-in-ICO, universally supported). */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dir = entries.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // width
    e.writeUInt8(size >= 256 ? 0 : size, 1); // height
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });

  return Buffer.concat([header, ...dir, ...entries.map((e) => e.data)]);
}

async function main() {
  for (const [svg, name, size] of targets) {
    const out = await render(svg, size);
    fs.writeFileSync(path.join(publicDir, name), out);
    console.log(`✓ ${name} (${size}x${size})`);
  }

  const icoSizes = [16, 32, 48];
  const icoEntries = await Promise.all(
    icoSizes.map(async (size) => ({ size, data: await render(logo, size) }))
  );
  const ico = buildIco(icoEntries);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
  fs.writeFileSync(path.join(repoRoot, 'favicon.ico'), ico);
  console.log(`✓ favicon.ico (${icoSizes.join(', ')})`);

  // Intermediate PNGs only exist to build the .ico
  for (const size of icoSizes) fs.unlinkSync(path.join(publicDir, `favicon-${size}.png`));

  console.log('\nAll brand icons regenerated from public/brand/logo.svg');
}

main().catch((error) => {
  console.error('Icon generation failed:', error);
  process.exit(1);
});
