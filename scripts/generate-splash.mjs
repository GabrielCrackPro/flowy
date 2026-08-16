/**
 * Generates iOS PWA splash screens (apple-touch-startup-image) into
 * `public/splash/` so installed PWAs show a branded launch screen instead of
 * the default white one.
 *
 * The images reproduce the app's real first paint (see `src/app/layout.tsx` and
 * `src/app/globals.css`): the light `--background` (hsl(210 40% 97%) = #f4f7fa)
 * with the subtle primary radial gradient from the top-left corner, plus the
 * app icon centered.
 *
 * iOS matches a splash by the `<link media>` query in
 * `src/components/shared/apple-startup-links.tsx`; the files themselves must be
 * the device's physical pixel size. When the design tokens change (background
 * color, gradient), regenerate with:
 *
 *   pnpm generate:splash
 */

import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "splash");
const ICON_PATH = join(ROOT, "public", "icons", "icon-512.png");

// Design tokens — keep in sync with src/app/globals.css + src/app/layout.tsx.
const BG = { r: 244, g: 247, b: 250 }; // hsl(210 40% 97%) light --background
const PRIMARY = { r: 59, g: 130, b: 246 }; // hsl(221.2 83.2% 53.3%) light --primary
const GRADIENT_ALPHA = 0.08; // layout: hsl(var(--primary)/0.08)
const GRADIENT_STOP = 0.38; // layout: `transparent 38%` of farthest-corner
const ICON_SCALE = 0.24; // icon width as a fraction of the splash width

/**
 * [physicalWidth, physicalHeight, cssWidth, cssHeight, pixelRatio]
 * Current + recent devices; iOS picks the matching media query.
 */
const DEVICES = [
  [1290, 2796, 430, 932, 3], // iPhone 16 Pro Max, 15 Pro Max, 14 Pro Max
  [1179, 2556, 393, 852, 3], // iPhone 16 Pro, 15 Pro, 14 Pro, 15, 14
  [1284, 2778, 428, 926, 3], // iPhone 15 Plus, 14 Plus, 13 Pro Max, 12 Pro Max
  [1170, 2532, 390, 844, 3], // iPhone 14, 13, 13 Pro, 12, 12 Pro
  [1125, 2436, 375, 812, 3], // iPhone 13 mini, 12 mini, 11 Pro, X, XS
  [828, 1792, 414, 896, 2], // iPhone 11, XR
  [750, 1334, 375, 667, 2], // iPhone SE (2nd/3rd), 8, 7, 6s
  [640, 1136, 320, 568, 2], // iPhone SE (1st), 5s, 5c
  [2048, 2732, 1024, 1366, 2], // iPad Pro 12.9" (3rd gen+)
  [1668, 2388, 834, 1194, 2], // iPad Pro 11" (1st gen+), iPad Air (4th/5th)
  [1620, 2160, 810, 1080, 2], // iPad 10.2" (7th gen+), iPad (10th gen)
  [1536, 2048, 768, 1024, 2], // iPad 9.7", iPad Air (1st/2nd), iPad mini (2nd-5th)
  [1488, 2266, 744, 1133, 2], // iPad mini (6th gen)
  [1640, 2360, 820, 1180, 2], // iPad Pro 13" (M4), iPad Air 13" (M2)
];

function createBackground(width, height) {
  // CSS radial-gradient(circle at top left, hsl(primary/8%), transparent 38%)
  // — farthest-corner ending shape, so the radius is the diagonal.
  const radius = Math.hypot(width, height);
  const buffer = Buffer.alloc(width * height * 3);
  const stop = GRADIENT_STOP * radius;

  let offset = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const distance = Math.hypot(x, y);
      const alpha =
        distance >= stop ? 0 : GRADIENT_ALPHA * (1 - distance / stop);
      buffer[offset] = BG.r * (1 - alpha) + PRIMARY.r * alpha;
      buffer[offset + 1] = BG.g * (1 - alpha) + PRIMARY.g * alpha;
      buffer[offset + 2] = BG.b * (1 - alpha) + PRIMARY.b * alpha;
      offset += 3;
    }
  }
  return buffer;
}

async function generate() {
  mkdirSync(OUT_DIR, { recursive: true });

  const iconBuffer = await sharp(ICON_PATH).png().toBuffer();

  for (const [width, height, , , ratio] of DEVICES) {
    const iconSize = Math.round(ICON_SCALE * width);
    const icon = await sharp(iconBuffer)
      .resize(iconSize, iconSize, { fit: "inside" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Center the icon on the background, alpha-composited.
    const { data: iconData, info } = icon;
    const bg = createBackground(width, height);
    const left = Math.round((width - info.width) / 2);
    const top = Math.round((height - info.height) / 2);

    for (let iy = 0; iy < info.height; iy += 1) {
      for (let ix = 0; ix < info.width; ix += 1) {
        const src = (iy * info.width + ix) * 4;
        const alpha = iconData[src + 3] / 255;
        if (alpha === 0) continue;

        const dst = ((top + iy) * width + (left + ix)) * 3;
        bg[dst] = bg[dst] * (1 - alpha) + iconData[src] * alpha;
        bg[dst + 1] = bg[dst + 1] * (1 - alpha) + iconData[src + 1] * alpha;
        bg[dst + 2] = bg[dst + 2] * (1 - alpha) + iconData[src + 2] * alpha;
      }
    }

    const filename = `splash-${width}x${height}.png`;
    await sharp(bg, { raw: { width, height, channels: 3 } })
      .png({ compressionLevel: 9 })
      .toFile(join(OUT_DIR, filename));
    console.log(`✓ ${filename} (${ratio}x, ${Math.round(iconSize)}px icon)`);
  }

  console.log(`\nDone — ${DEVICES.length} splash screens in public/splash/`);
}

generate().catch((error) => {
  console.error("Failed to generate splash screens:", error);
  process.exit(1);
});
