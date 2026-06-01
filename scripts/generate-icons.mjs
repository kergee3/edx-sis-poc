import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const svgContent = readFileSync(join(publicDir, 'icon.svg'), 'utf-8');

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-152.png', size: 152 },  // iPad (非Retina)
  { name: 'apple-touch-icon-167.png', size: 167 },  // iPad Pro
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-16.png', size: 16 },
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(join(publicDir, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }
  console.log('All icons generated!');
}

generateIcons().catch(console.error);
