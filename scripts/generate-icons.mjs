// Generates PNG/ICO favicons from public/favicon.svg. Run: node scripts/generate-icons.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(new URL('../public/favicon.svg', import.meta.url));

// Apple touch icon / manifest icons: mark on a solid background with padding.
async function padded(size, out) {
  const inner = Math.round(size * 0.72);
  const mark = await sharp(svg, { density: 512 }).resize(inner, inner).png().toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#09090b' } })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(fileURLToPath(new URL(`../public/${out}`, import.meta.url)));
}

await padded(180, 'apple-touch-icon.png');
await padded(192, 'icon-192.png');
await padded(512, 'icon-512.png');

// favicon.ico containing 16, 32 and 48px PNGs.
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((s) => sharp(svg, { density: 512 }).resize(s, s).png().toBuffer()));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + 16 * sizes.length;
const entries = pngs.map((png, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i] % 256, 0);
  e.writeUInt8(sizes[i] % 256, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});
await writeFile(new URL('../public/favicon.ico', import.meta.url), Buffer.concat([header, ...entries, ...pngs]));
console.log('icons written');
