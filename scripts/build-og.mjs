import sharp from 'sharp';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const W = 1200;
const H = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#faf7f2"/>
      <stop offset="100%" stop-color="#f3ede4"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="14" height="${H}" fill="#1d5448"/>

  <text x="80" y="180" font-family="Georgia, 'Times New Roman', serif" font-size="44" fill="#1d5448" font-style="italic">prax<tspan font-weight="700" font-style="normal">note</tspan></text>

  <text x="80" y="320" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="600" fill="#2a2620">Notes in minutes.</text>
  <text x="80" y="410" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="400" font-style="italic" fill="#4a3f33">Nuance intact.</text>
  <text x="80" y="500" font-family="Georgia, 'Times New Roman', serif" font-size="76" font-weight="600" fill="#1d5448">Control yours.</text>

  <text x="80" y="568" font-family="-apple-system, 'Helvetica Neue', sans-serif" font-size="24" fill="#7a6f63">HIPAA-grade · GDPR · PIPEDA</text>
</svg>`;

const out = resolve('public/og.png');
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(out);
console.log(`Wrote ${out}`);
