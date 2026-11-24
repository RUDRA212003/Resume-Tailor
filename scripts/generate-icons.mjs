import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcTarget = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(crcTarget);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, renderPixel) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with 0x00 filter byte per row
  const rowLength = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLength;
    rawData[rowOffset] = 0; // filter None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = renderPixel(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Distance to rounded rectangle
function sdRoundRect(px, py, rx, ry, rw, rh, radius) {
  const x = px - (rx + rw / 2);
  const y = py - (ry + rh / 2);
  const dx = Math.abs(x) - (rw / 2 - radius);
  const dy = Math.abs(y) - (rh / 2 - radius);
  return Math.min(Math.max(dx, dy), 0.0) + Math.hypot(Math.max(dx, 0.0), Math.max(dy, 0.0)) - radius;
}

// Draw Resume Tailor Icon
function renderResumeIcon(x, y, w, h, isMaskable = false) {
  // Center coordinates
  const cx = w / 2;
  const cy = h / 2;

  // Background rounded squircle / rect
  const pad = isMaskable ? 0 : Math.round(w * 0.08);
  const cardW = w - pad * 2;
  const cardH = h - pad * 2;
  const cardR = isMaskable ? 0 : Math.round(w * 0.22);

  const bgDist = isMaskable ? -1 : sdRoundRect(x, y, pad, pad, cardW, cardH, cardR);

  if (bgDist > 0.5) {
    return [0, 0, 0, 0]; // Transparent outside
  }

  // Gradient background: Royal Blue #0066CC (top) to #004C99 (bottom)
  const normY = y / h;
  const rBg = Math.round(0 * (1 - normY) + 0 * normY);
  const gBg = Math.round(102 * (1 - normY) + 76 * normY);
  const bBg = Math.round(204 * (1 - normY) + 153 * normY);

  // Document sheet dimensions (centered)
  const docW = Math.round(w * 0.46);
  const docH = Math.round(h * 0.60);
  const docX = Math.round(cx - docW / 2);
  const docY = Math.round(cy - docH / 2);
  const docR = Math.round(w * 0.05);

  const docDist = sdRoundRect(x, y, docX, docY, docW, docH, docR);

  // Subtle drop shadow under document
  const shadowDist = sdRoundRect(x, y, docX, docY + Math.round(h * 0.02), docW, docH, docR);
  if (docDist > 0 && shadowDist <= 4) {
    return [0, 50, 110, 255];
  }

  if (docDist <= 0) {
    // Inside white document
    // Document text lines (3 stylized lines)
    const lineX = docX + Math.round(docW * 0.2);
    const lineW1 = Math.round(docW * 0.6);
    const lineW2 = Math.round(docW * 0.45);
    const lineW3 = Math.round(docW * 0.52);
    const lineH = Math.max(2, Math.round(h * 0.03));
    const lineR = Math.round(lineH / 2);

    const l1Y = docY + Math.round(docH * 0.38);
    const l2Y = docY + Math.round(docH * 0.54);
    const l3Y = docY + Math.round(docH * 0.70);

    const d1 = sdRoundRect(x, y, lineX, l1Y, lineW1, lineH, lineR);
    const d2 = sdRoundRect(x, y, lineX, l2Y, lineW2, lineH, lineR);
    const d3 = sdRoundRect(x, y, lineX, l3Y, lineW3, lineH, lineR);

    // AI Sparkle Star near the top right of document
    const starX = docX + Math.round(docW * 0.72);
    const starY = docY + Math.round(docH * 0.22);
    const dx = Math.abs(x - starX);
    const dy = Math.abs(y - starY);
    const starR = Math.round(w * 0.07);

    // 4-pointed star curve: (dx^0.5 + dy^0.5 <= starR^0.5)
    const isStar = Math.sqrt(dx) + Math.sqrt(dy) <= Math.sqrt(starR);

    if (isStar) {
      // Golden / Electric Cyan AI star accent
      return [0, 102, 204, 255];
    }

    if (d1 <= 0 || d2 <= 0 || d3 <= 0) {
      // Soft Slate blue line
      return [180, 205, 230, 255];
    }

    // White document surface with subtle warm highlight
    return [255, 255, 255, 255];
  }

  // Antialiased border on rounded card
  if (bgDist > -0.5) {
    const alpha = Math.max(0, Math.min(1, 0.5 - bgDist));
    return [rBg, gBg, bBg, Math.round(alpha * 255)];
  }

  return [rBg, gBg, bBg, 255];
}

// Ensure public/icons directory exists
const outDir = path.resolve(process.cwd(), 'public/icons');
fs.mkdirSync(outDir, { recursive: true });

console.log('Generating PWA icons...');

const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-192.png', size: 192, maskable: true },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
  { name: 'favicon-32.png', size: 32, maskable: false },
];

for (const { name, size, maskable } of sizes) {
  const png = createPng(size, size, (x, y, w, h) => renderResumeIcon(x, y, w, h, maskable));
  fs.writeFileSync(path.join(outDir, name), png);
  console.log(` Created ${name} (${size}x${size})`);
}

// Copy 32x32 to public/favicon.ico
fs.writeFileSync(path.resolve(process.cwd(), 'public/favicon.ico'), fs.readFileSync(path.join(outDir, 'favicon-32.png')));

// Generate clean vector SVG icon as well
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0066CC" />
      <stop offset="100%" stop-color="#004C99" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#002244" flood-opacity="0.35" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <g filter="url(#shadow)">
    <rect x="138" y="102" width="236" height="308" rx="24" fill="#FFFFFF" />
    <!-- Stylized Resume Lines -->
    <rect x="180" y="210" width="152" height="16" rx="8" fill="#C8DCF0" />
    <rect x="180" y="254" width="120" height="16" rx="8" fill="#C8DCF0" />
    <rect x="180" y="298" width="138" height="16" rx="8" fill="#C8DCF0" />
    <!-- AI Star Emblem -->
    <path d="M 314 162 Q 314 178 330 178 Q 314 178 314 194 Q 314 178 298 178 Q 314 178 314 162 Z" fill="#0066CC" />
  </g>
</svg>`;

fs.writeFileSync(path.join(outDir, 'icon.svg'), svgContent);
fs.writeFileSync(path.resolve(process.cwd(), 'public/icon.svg'), svgContent);
console.log(' Generated icon.svg');
