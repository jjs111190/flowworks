import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const outDir = path.resolve("public/icons");
fs.mkdirSync(outDir, { recursive: true });

function crc32(buffer) {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function makePng(size) {
  const rows = [];
  const radius = Math.floor(size * 0.22);
  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = 1 + x * 4;
      const cornerX = x < radius ? radius : x > size - radius ? size - radius : x;
      const cornerY = y < radius ? radius : y > size - radius ? size - radius : y;
      const distance = Math.hypot(x - cornerX, y - cornerY);
      const inside = distance <= radius;
      const t = Math.max(0, Math.min(1, (x + y) / (size * 2)));
      const bg = [
        Math.round(251 * (1 - t) + 232 * t),
        Math.round(252 * (1 - t) + 238 * t),
        Math.round(255 * (1 - t) + 247 * t),
        255
      ];
      const cardLeft = size * 0.265;
      const cardRight = size * 0.735;
      const cardTop = size * 0.2;
      const cardBottom = size * 0.8;
      const cardRadius = size * 0.09;
      const cardCornerX = x < cardLeft + cardRadius ? cardLeft + cardRadius : x > cardRight - cardRadius ? cardRight - cardRadius : x;
      const cardCornerY = y < cardTop + cardRadius ? cardTop + cardRadius : y > cardBottom - cardRadius ? cardBottom - cardRadius : y;
      const card = x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom && Math.hypot(x - cardCornerX, y - cardCornerY) <= cardRadius;
      const lineHeight = size * 0.062;
      const lineRadius = lineHeight / 2;
      const pill = (x1, x2, cy) => x >= x1 && x <= x2 && Math.abs(y - cy) <= lineRadius && (x < x1 + lineRadius ? Math.hypot(x - (x1 + lineRadius), y - cy) <= lineRadius : x > x2 - lineRadius ? Math.hypot(x - (x2 - lineRadius), y - cy) <= lineRadius : true);
      const line1 = card && pill(size * 0.365, size * 0.635, size * 0.375);
      const line2 = card && pill(size * 0.365, size * 0.555, size * 0.5);
      const line3 = card && pill(size * 0.365, size * 0.635, size * 0.625);
      const dot1 = card && Math.hypot(x - size * 0.665, y - size * 0.5) < size * 0.031;
      const dot2 = card && Math.hypot(x - size * 0.665, y - size * 0.625) < size * 0.031;
      let rgba = inside ? bg : [0, 0, 0, 0];
      if (card) rgba = [255, 255, 255, 255];
      if (line1 || line2 || line3) rgba = [15, 23, 42, 255];
      if (dot1) rgba = [59, 130, 246, 255];
      if (dot2) rgba = [148, 163, 184, 255];
      row[offset] = rgba[0];
      row[offset + 1] = rgba[1];
      row[offset + 2] = rgba[2];
      row[offset + 3] = rgba[3];
    }
    rows.push(row);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(Buffer.concat(rows))),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const size of [180, 192, 512]) {
  const name = size === 180 ? "apple-touch-icon.png" : `icon-${size}.png`;
  fs.writeFileSync(path.join(outDir, name), makePng(size));
}

const iosIconDir = path.resolve("ios/App/App/Assets.xcassets/AppIcon.appiconset");
if (fs.existsSync(iosIconDir)) {
  fs.writeFileSync(path.join(iosIconDir, "AppIcon-512@2x.png"), makePng(1024));
}

const androidMipmaps = [
  ["mipmap-mdpi", 48],
  ["mipmap-hdpi", 72],
  ["mipmap-xhdpi", 96],
  ["mipmap-xxhdpi", 144],
  ["mipmap-xxxhdpi", 192]
];

for (const [folder, size] of androidMipmaps) {
  const dir = path.resolve("android/app/src/main/res", folder);
  if (!fs.existsSync(dir)) continue;
  const png = makePng(size);
  fs.writeFileSync(path.join(dir, "ic_launcher.png"), png);
  fs.writeFileSync(path.join(dir, "ic_launcher_round.png"), png);
  fs.writeFileSync(path.join(dir, "ic_launcher_foreground.png"), makePng(Math.max(size, 108)));
}
