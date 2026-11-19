import * as THREE from 'three';
import { ThemeId } from '../../engine/types';

const slabCache = new Map<ThemeId, THREE.CanvasTexture>();
const wallCache = new Map<ThemeId, THREE.CanvasTexture>();
const panoramaCache = new Map<ThemeId, THREE.CanvasTexture>();
const tabletopCache = new Map<ThemeId, THREE.CanvasTexture>();
const courtyardGroundCache = new Map<ThemeId, THREE.CanvasTexture>();
const courtyardFadeCache = new Map<ThemeId, THREE.CanvasTexture>();
const lacquerWoodCache = new Map<ThemeId, THREE.CanvasTexture>();
const mistRingCache = new Map<ThemeId, THREE.CanvasTexture>();
const glowPoolCache = new Map<ThemeId, THREE.CanvasTexture>();
const warBannerClothCache = new Map<ThemeId, THREE.CanvasTexture>();

function createCanvasSurface(
  width: number,
  height: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  } catch {
    return null;
  }
}

type WrapMode = 'repeat' | 'panorama' | 'clamp';

function configureTexture(
  canvas: HTMLCanvasElement,
  wrapMode: WrapMode = 'repeat',
  repeatX = 1,
  repeatY = 1
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (wrapMode === 'repeat') {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    if (repeatX !== 1 || repeatY !== 1) {
      tex.repeat.set(repeatX, repeatY);
    }
  } else if (wrapMode === 'panorama') {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  } else {
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}

function drawInkCrack(
  ctx: CanvasRenderingContext2D,
  points: readonly [number, number][],
  strokeStyle: string,
  lineWidth: number
): void {
  if (points.length < 2) return;
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
}

export function getSlabTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = slabCache.get(theme);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  // Neutral-bright multiplier base so material tint shows rich carved stonework + tatami weave
  ctx.fillStyle = isSengoku ? '#e2d2b9' : '#d5dfed';
  ctx.fillRect(0, 0, size, size);

  // 3x3 carved masonry tiles with varied stone tone, bevels, and subtle cross-grain
  const cell = size / 3;
  const toneOffsets = [-18, 12, -10, 14, -5, 18, -12, 10, -16];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      const x = col * cell;
      const y = row * cell;
      const delta = toneOffsets[idx];
      ctx.fillStyle =
        delta >= 0
          ? `rgba(255,255,255,${delta / 90})`
          : `rgba(18,14,12,${Math.abs(delta) / 62})`;
      ctx.fillRect(x + 4, y + 4, cell - 8, cell - 8);

      // Aged tatami / fine brushed stone cross-grain lines inside each tile
      ctx.strokeStyle = isSengoku ? 'rgba(66, 48, 30, 0.12)' : 'rgba(30, 41, 59, 0.14)';
      ctx.lineWidth = 1;
      const horizontalWeave = (row + col) % 2 === 0;
      for (let step = 14; step < cell - 14; step += 12) {
        ctx.beginPath();
        if (horizontalWeave) {
          ctx.moveTo(x + 8, y + step);
          ctx.lineTo(x + cell - 8, y + step);
        } else {
          ctx.moveTo(x + step, y + 8);
          ctx.lineTo(x + step, y + cell - 8);
        }
        ctx.stroke();
      }

      // Top/Left stone bevel highlight
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.42)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + cell - 8);
      ctx.lineTo(x + 6, y + 6);
      ctx.lineTo(x + cell - 8, y + 6);
      ctx.stroke();

      // Bottom/Right stone bevel shadow
      ctx.strokeStyle = isSengoku ? 'rgba(32, 20, 12, 0.48)' : 'rgba(15, 23, 42, 0.52)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + cell - 6, y + 8);
      ctx.lineTo(x + cell - 6, y + cell - 6);
      ctx.lineTo(x + 8, y + cell - 6);
      ctx.stroke();
    }
  }

  // Mineral grain & weathering speckles
  for (let i = 0; i < 2400; i++) {
    const px = (i * 173 + 29) % size;
    const py = (i * 293 + 53) % size;
    const w = (i % 3) + 2;
    ctx.fillStyle =
      i % 2 === 0
        ? isSengoku
          ? 'rgba(48, 33, 20, 0.24)'
          : 'rgba(15, 23, 42, 0.26)'
        : 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(px, py, w, w);
  }

  // Moss patina (Sengoku) or frosted mineral veins (Vesperfall) along mortar corners
  for (let i = 0; i < 42; i++) {
    const fx = ((i * 137 + 19) % 440) + 36;
    const fy = ((i * 211 + 43) % 440) + 36;
    const r = 4 + (i % 6);
    ctx.fillStyle = isSengoku
      ? `rgba(74, 102, 52, ${0.14 + (i % 3) * 0.05})`
      : `rgba(125, 211, 252, ${0.09 + (i % 3) * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(fx, fy, r * 1.4, r, (i * 0.7) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Deepened sumi-e ink mortar grooves
  ctx.strokeStyle = isSengoku ? 'rgba(22, 14, 9, 0.85)' : 'rgba(10, 15, 28, 0.88)';
  ctx.lineWidth = 7;
  ctx.strokeRect(4, 4, size - 8, size - 8);
  for (let n = 1; n <= 2; n++) {
    const pos = Math.round(n * cell);
    ctx.beginPath();
    ctx.moveTo(pos, 6);
    ctx.lineTo(pos, size - 6);
    ctx.moveTo(6, pos);
    ctx.lineTo(size - 6, pos);
    ctx.stroke();
  }

  // Carved tactical diamond emblem in slab center
  ctx.strokeStyle = isSengoku ? 'rgba(110, 62, 24, 0.44)' : 'rgba(56, 189, 248, 0.28)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 178);
  ctx.lineTo(334, 256);
  ctx.lineTo(256, 334);
  ctx.lineTo(178, 256);
  ctx.closePath();
  ctx.stroke();

  // Organic sumi-e ink weathering cracks across multiple corners
  const crackInk = isSengoku ? 'rgba(20, 12, 8, 0.62)' : 'rgba(10, 16, 30, 0.65)';
  drawInkCrack(ctx, [[34, 48], [76, 86], [104, 78], [134, 114]], crackInk, 2.5);
  drawInkCrack(ctx, [[458, 52], [412, 92], [428, 122]], crackInk, 2.2);
  drawInkCrack(ctx, [[48, 456], [96, 412], [132, 424]], crackInk, 2.2);
  drawInkCrack(ctx, [[352, 378], [418, 426], [460, 404]], crackInk, 2.6);

  // Corner metal studs
  ctx.fillStyle = isSengoku ? 'rgba(146, 64, 14, 0.58)' : 'rgba(100, 116, 139, 0.58)';
  for (const [bx, by] of [
    [22, 22],
    [size - 22, 22],
    [22, size - 22],
    [size - 22, size - 22],
  ]) {
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = configureTexture(canvas, 'repeat');
  slabCache.set(theme, tex);
  return tex;
}

export function getWallTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = wallCache.get(theme);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = isSengoku ? '#d9c4aa' : '#aebccf';
  ctx.fillRect(0, 0, size, size);

  const rows = 6;
  const rowH = size / rows;
  for (let row = 0; row < rows; row++) {
    const y = row * rowH;
    const offset = row % 2 === 0 ? 0 : 64;
    for (let x = -64 + offset; x < size; x += 128) {
      const shade = ((row * 3 + Math.round(x / 64)) % 3) - 1;
      if (shade !== 0) {
        ctx.fillStyle = shade > 0 ? 'rgba(255,255,255,0.12)' : 'rgba(15,12,10,0.18)';
        ctx.fillRect(x + 3, y + 3, 122, rowH - 6);
      }

      // Top highlight on masonry course
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x + 4, y + 3, 120, 4);

      // Sumi-e mortar border
      ctx.strokeStyle = isSengoku ? 'rgba(26, 16, 10, 0.78)' : 'rgba(12, 18, 34, 0.8)';
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, 128, rowH);
    }
  }

  // Iron/timber beam band & rivets along upper wall crest
  ctx.fillStyle = isSengoku ? 'rgba(56, 28, 14, 0.48)' : 'rgba(24, 34, 52, 0.5)';
  ctx.fillRect(0, 0, size, 32);
  ctx.fillStyle = isSengoku ? 'rgba(217, 119, 6, 0.55)' : 'rgba(148, 163, 184, 0.58)';
  for (let rx = 32; rx < size; rx += 64) {
    ctx.beginPath();
    ctx.arc(rx, 16, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = configureTexture(canvas, 'repeat');
  wallCache.set(theme, tex);
  return tex;
}

export function getTabletopMatTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = tabletopCache.get(theme);
  if (existing) return existing;

  const size = 1024;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';
  const cx = size / 2;
  const cy = size / 2;

  // Dressed temple stone courtyard plaza base
  const baseGrad = ctx.createRadialGradient(cx, cy, 80, cx, cy, 520);
  if (isSengoku) {
    baseGrad.addColorStop(0, '#3a3028');
    baseGrad.addColorStop(0.65, '#2b2420');
    baseGrad.addColorStop(1, '#1c1817');
  } else {
    baseGrad.addColorStop(0, '#273549');
    baseGrad.addColorStop(0.65, '#1b2434');
    baseGrad.addColorStop(1, '#111724');
  }
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Concentric dressed stone block rings with tonal variation + ink outlines
  const ringRadii = [160, 235, 315, 395, 475];
  for (let rIdx = 0; rIdx < ringRadii.length; rIdx++) {
    const innerR = rIdx === 0 ? 78 : ringRadii[rIdx - 1];
    const outerR = ringRadii[rIdx];
    const segments = 12 + rIdx * 6;
    const step = (Math.PI * 2) / segments;
    const phase = (rIdx % 2) * (step * 0.5);

    for (let s = 0; s < segments; s++) {
      const a0 = phase + s * step;
      const a1 = a0 + step;
      const tone = ((s * 7 + rIdx * 11) % 5) - 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, a0, a1);
      ctx.arc(cx, cy, innerR, a1, a0, true);
      ctx.closePath();

      if (tone > 0) {
        ctx.fillStyle = `rgba(255, 245, 225, ${tone * 0.032})`;
        ctx.fill();
      } else if (tone < 0) {
        ctx.fillStyle = `rgba(10, 10, 12, ${Math.abs(tone) * 0.055})`;
        ctx.fill();
      }

      // Moss / frosted patina inside selected joints
      if ((s + rIdx * 3) % 7 === 0) {
        ctx.fillStyle = isSengoku ? 'rgba(72, 104, 52, 0.22)' : 'rgba(56, 189, 248, 0.14)';
        ctx.fill();
      }

      ctx.strokeStyle = isSengoku ? 'rgba(14, 10, 8, 0.72)' : 'rgba(9, 14, 24, 0.78)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }
  }

  // Stone grain speckles & scorched ember patina near corners
  for (let i = 0; i < 3200; i++) {
    const px = (i * 251 + 43) % size;
    const py = (i * 389 + 71) % size;
    const s = (i % 3) + 1;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(8,8,10,0.22)';
    ctx.fillRect(px, py, s, s);
  }

  for (const [bx, by] of [
    [220, 220],
    [size - 220, 220],
    [220, size - 220],
    [size - 220, size - 220],
  ]) {
    const emberGlow = ctx.createRadialGradient(bx, by, 8, bx, by, 130);
    emberGlow.addColorStop(0, isSengoku ? 'rgba(234, 88, 12, 0.16)' : 'rgba(56, 189, 248, 0.14)');
    emberGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = emberGlow;
    ctx.beginPath();
    ctx.arc(bx, by, 130, 0, Math.PI * 2);
    ctx.fill();
  }

  // Subdued antique-brass (Sengoku) / frosted-cyan (Vesperfall) engraved compass crest
  for (const [r, alpha, lw] of [
    [462, 0.34, 5],
    [392, 0.24, 3],
    [260, 0.22, 3],
  ] as const) {
    ctx.strokeStyle = isSengoku ? `rgba(184, 134, 62, ${alpha})` : `rgba(96, 165, 250, ${alpha})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = isSengoku ? 'rgba(184, 134, 62, 0.3)' : 'rgba(96, 165, 250, 0.28)';
  ctx.lineWidth = 4;
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 392, cy + Math.sin(ang) * 392);
    ctx.lineTo(cx + Math.cos(ang) * 462, cy + Math.sin(ang) * 462);
    ctx.stroke();
  }

  const tex = configureTexture(canvas, 'clamp');
  tabletopCache.set(theme, tex);
  return tex;
}

export function getCourtyardGroundTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = courtyardGroundCache.get(theme);
  if (existing) return existing;

  const size = 1024;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = isSengoku ? '#262426' : '#182132';
  ctx.fillRect(0, 0, size, size);

  // Irregular weathered courtyard flagstones across 8 rows
  const rows = 8;
  const rowH = size / rows;
  const widths = [128, 192, 96, 160, 128, 192, 128];

  for (let row = 0; row < rows; row++) {
    const y = row * rowH;
    let x = -((row * 73) % 128);
    let col = 0;
    while (x < size) {
      const bw = widths[(row + col) % widths.length];
      const tone = ((row * 5 + col * 11) % 7) - 3;

      ctx.fillStyle =
        tone > 0
          ? `rgba(215, 210, 200, ${tone * 0.03})`
          : `rgba(8, 10, 14, ${Math.abs(tone) * 0.055})`;
      ctx.fillRect(x + 4, y + 4, bw - 8, rowH - 8);

      // Stone slab top bevel highlight
      ctx.strokeStyle = isSengoku ? 'rgba(205, 196, 182, 0.16)' : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + rowH - 7);
      ctx.lineTo(x + 6, y + 6);
      ctx.lineTo(x + bw - 7, y + 6);
      ctx.stroke();

      // Deep dark mortar joints + outline
      ctx.strokeStyle = isSengoku ? 'rgba(10, 12, 16, 0.85)' : 'rgba(6, 10, 20, 0.88)';
      ctx.lineWidth = 5.5;
      ctx.strokeRect(x, y, bw, rowH);

      // Scattered stone fractures inside selected slabs
      if ((row + col) % 3 === 0) {
        drawInkCrack(
          ctx,
          [
            [x + 18, y + 18],
            [x + bw * 0.45, y + rowH * 0.52],
            [x + bw * 0.68, y + rowH * 0.38],
          ],
          'rgba(10, 12, 16, 0.5)',
          2
        );
      }

      x += bw;
      col++;
    }
  }

  // Moss patches (Sengoku) or icy arcane seams (Vesperfall)
  for (let i = 0; i < 65; i++) {
    const mx = (i * 197 + 31) % size;
    const my = (i * 313 + 67) % size;
    const r = 10 + (i % 16);
    ctx.fillStyle = isSengoku
      ? `rgba(62, 88, 48, ${0.14 + (i % 3) * 0.06})`
      : `rgba(56, 189, 248, ${0.07 + (i % 3) * 0.04})`;
    ctx.beginPath();
    ctx.ellipse(mx, my, r * 1.4, r * 0.9, (i * 0.9) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mineral grain speckles
  for (let i = 0; i < 3600; i++) {
    const px = (i * 239 + 17) % size;
    const py = (i * 409 + 61) % size;
    const w = (i % 3) + 1;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(10, 10, 14, 0.25)' : 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(px, py, w, w);
  }

  // Scattered autumn maple leaves (Sengoku) or faint magma fissures (Vesperfall)
  if (isSengoku) {
    const leafColors = ['rgba(180, 56, 36, 0.62)', 'rgba(204, 118, 38, 0.58)', 'rgba(138, 38, 28, 0.55)'];
    for (let i = 0; i < 54; i++) {
      const lx = (i * 283 + 57) % size;
      const ly = (i * 179 + 93) % size;
      const angle = (i * 1.1) % (Math.PI * 2);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      ctx.fillStyle = leafColors[i % leafColors.length];
      ctx.beginPath();
      ctx.ellipse(0, 0, 7 + (i % 4), 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else {
    for (let i = 0; i < 16; i++) {
      const sx = (i * 191 + 44) % size;
      const sy = (i * 277 + 88) % size;
      drawInkCrack(
        ctx,
        [
          [sx, sy],
          [sx + 28, sy + 18],
          [sx + 52, sy + 6],
        ],
        'rgba(249, 115, 22, 0.28)',
        2.5
      );
    }
  }

  const tex = configureTexture(canvas, 'repeat', 5, 5);
  courtyardGroundCache.set(theme, tex);
  return tex;
}

export function getCourtyardFadeTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = courtyardFadeCache.get(theme);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;

  ctx.clearRect(0, 0, size, size);
  const fadeRgb = isSengoku ? '20, 24, 34' : '15, 23, 42';
  const grad = ctx.createRadialGradient(cx, cy, rOuter * 0.42, cx, cy, rOuter);
  grad.addColorStop(0, `rgba(${fadeRgb}, 0)`);
  grad.addColorStop(0.36, `rgba(${fadeRgb}, 0.28)`);
  grad.addColorStop(0.7, `rgba(${fadeRgb}, 0.86)`);
  grad.addColorStop(0.84, `rgba(${fadeRgb}, 1)`);
  grad.addColorStop(1, `rgba(${fadeRgb}, 1)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = configureTexture(canvas, 'clamp');
  courtyardFadeCache.set(theme, tex);
  return tex;
}

export function getLacquerWoodTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = lacquerWoodCache.get(theme);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = isSengoku ? '#a62d22' : '#3b4776';
  ctx.fillRect(0, 0, size, size);

  // Sumi-e vertical wood grain streaks & aged knots
  for (let i = 0; i < 160; i++) {
    const gx = (i * 19 + 7) % size;
    const dark = i % 3 !== 0;
    ctx.strokeStyle = dark
      ? isSengoku
        ? `rgba(38, 10, 8, ${0.18 + (i % 4) * 0.06})`
        : `rgba(12, 16, 36, ${0.22 + (i % 4) * 0.06})`
      : 'rgba(255, 215, 180, 0.1)';
    ctx.lineWidth = 1.5 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.bezierCurveTo(
      gx + ((i % 5) - 2) * 5,
      size * 0.33,
      gx - ((i % 4) - 1) * 6,
      size * 0.66,
      gx + ((i % 3) - 1) * 4,
      size
    );
    ctx.stroke();
  }

  // Chipped lacquer patina patches
  for (let i = 0; i < 36; i++) {
    const px = (i * 149 + 23) % size;
    const py = (i * 263 + 41) % size;
    ctx.fillStyle = isSengoku ? 'rgba(64, 38, 22, 0.34)' : 'rgba(22, 28, 52, 0.38)';
    ctx.fillRect(px, py, 6 + (i % 10), 14 + (i % 18));
  }

  // Subtle dark iron strap bands with forged rivets
  for (const bandY of [72, 248, 412]) {
    ctx.fillStyle = 'rgba(18, 18, 22, 0.56)';
    ctx.fillRect(0, bandY, size, 22);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, bandY, size, 22);

    ctx.fillStyle = isSengoku ? 'rgba(212, 164, 92, 0.65)' : 'rgba(148, 163, 184, 0.65)';
    for (let rx = 28; rx < size; rx += 64) {
      ctx.beginPath();
      ctx.arc(rx, bandY + 11, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = configureTexture(canvas, 'repeat');
  lacquerWoodCache.set(theme, tex);
  return tex;
}

export function getMistRingTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = mistRingCache.get(theme);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);
  const mistRgb = isSengoku ? '110, 138, 178' : '96, 165, 250';

  // Soft overlapping clouds around r = 32%..96%, completely clear over board center
  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2 + (i % 3) * 0.19;
    const dist = 104 + (i % 5) * 26;
    const wx = cx + Math.cos(angle) * dist;
    const wy = cy + Math.sin(angle) * dist;
    const wispR = 54 + (i % 4) * 18;
    const alpha = 0.14 + (i % 3) * 0.05;

    const grad = ctx.createRadialGradient(wx, wy, 4, wx, wy, wispR);
    grad.addColorStop(0, `rgba(${mistRgb}, ${alpha})`);
    grad.addColorStop(0.55, `rgba(${mistRgb}, ${alpha * 0.45})`);
    grad.addColorStop(1, `rgba(${mistRgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(wx, wy, wispR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mask out central board window (r < 30%) and smooth outer rim via destination-in / destination-out
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  const innerHole = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.19);
  innerHole.addColorStop(0, 'rgba(0,0,0,1)');
  innerHole.addColorStop(0.72, 'rgba(0,0,0,0.88)');
  innerHole.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = innerHole;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = configureTexture(canvas, 'clamp');
  mistRingCache.set(theme, tex);
  return tex;
}

export function getGlowPoolTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = glowPoolCache.get(theme);
  if (existing) return existing;

  const size = 256;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
  if (isSengoku) {
    grad.addColorStop(0, 'rgba(255, 186, 82, 0.56)');
    grad.addColorStop(0.35, 'rgba(255, 148, 42, 0.34)');
    grad.addColorStop(0.7, 'rgba(217, 95, 20, 0.12)');
    grad.addColorStop(1, 'rgba(217, 95, 20, 0)');
  } else {
    grad.addColorStop(0, 'rgba(125, 211, 252, 0.48)');
    grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.26)');
    grad.addColorStop(0.75, 'rgba(37, 99, 235, 0.08)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0)');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = configureTexture(canvas, 'clamp');
  glowPoolCache.set(theme, tex);
  return tex;
}

export function getWarBannerClothTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = warBannerClothCache.get(theme);
  if (existing) return existing;

  const w = 256;
  const h = 512;
  const surface = createCanvasSurface(w, h);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  ctx.clearRect(0, 0, w, h);

  // Tattered Sengoku banner silhouette with jagged battle-torn bottom hem
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(20, 14);
  ctx.lineTo(w - 20, 14);
  ctx.lineTo(w - 22, 430);
  ctx.lineTo(w - 48, 392);
  ctx.lineTo(w - 72, 466);
  ctx.lineTo(w - 102, 412);
  ctx.lineTo(w / 2, 492);
  ctx.lineTo(98, 418);
  ctx.lineTo(68, 472);
  ctx.lineTo(44, 398);
  ctx.lineTo(22, 442);
  ctx.closePath();
  ctx.clip();

  // Vertical parchment / crimson split
  ctx.fillStyle = isSengoku ? '#d9cab0' : '#cbd5e1';
  ctx.fillRect(0, 0, w / 2, h);
  ctx.fillStyle = isSengoku ? '#8a231c' : '#26355e';
  ctx.fillRect(w / 2, 0, w / 2, h);

  // Subtle cloth weave & ink aging folds
  for (let y = 24; y < h; y += 26) {
    ctx.strokeStyle = 'rgba(20, 14, 10, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.quadraticCurveTo(w / 2, y + (y % 52 === 0 ? 10 : -8), w - 16, y + 4);
    ctx.stroke();
  }

  // Golden diamond clan mon emblem in center
  ctx.save();
  ctx.translate(w / 2, 186);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = isSengoku ? '#d9a441' : '#60a5fa';
  ctx.strokeStyle = '#1c120b';
  ctx.lineWidth = 6;
  ctx.fillRect(-38, -38, 76, 76);
  ctx.strokeRect(-38, -38, 76, 76);
  ctx.strokeStyle = isSengoku ? '#5c3114' : '#0f172a';
  ctx.lineWidth = 5;
  ctx.strokeRect(-22, -22, 44, 44);
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 14);
  ctx.moveTo(-14, 0);
  ctx.lineTo(14, 0);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // Bold outer sumi-e ink outline along banner perimeter
  ctx.strokeStyle = '#18100c';
  ctx.lineWidth = 7;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(20, 14);
  ctx.lineTo(w - 20, 14);
  ctx.lineTo(w - 22, 430);
  ctx.lineTo(w - 48, 392);
  ctx.lineTo(w - 72, 466);
  ctx.lineTo(w - 102, 412);
  ctx.lineTo(w / 2, 492);
  ctx.lineTo(98, 418);
  ctx.lineTo(68, 472);
  ctx.lineTo(44, 398);
  ctx.lineTo(22, 442);
  ctx.closePath();
  ctx.stroke();

  // Hanging cloth mounting loops along top rod
  for (const lx of [42, 128, 214]) {
    ctx.fillStyle = isSengoku ? '#e2d4bc' : '#e2e8f0';
    ctx.fillRect(lx - 10, 4, 20, 22);
    ctx.strokeStyle = '#18100c';
    ctx.lineWidth = 4;
    ctx.strokeRect(lx - 10, 4, 20, 22);
  }

  const tex = configureTexture(canvas, 'clamp');
  warBannerClothCache.set(theme, tex);
  return tex;
}

export function getPanoramaTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = panoramaCache.get(theme);
  if (existing) return existing;

  const w = 1024;
  const h = 512;
  const surface = createCanvasSurface(w, h);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  // Moody twilight gradient calibrated for 45 deg isometric downward camera (lower hemisphere y = 240..480)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (isSengoku) {
    skyGrad.addColorStop(0, '#0d1220');
    skyGrad.addColorStop(0.36, '#1b2438');
    skyGrad.addColorStop(0.5, '#3d2824');
    skyGrad.addColorStop(0.64, '#1b2438');
    skyGrad.addColorStop(0.82, '#141822');
    skyGrad.addColorStop(1, '#10141c');
  } else {
    skyGrad.addColorStop(0, '#070b14');
    skyGrad.addColorStop(0.38, '#131d33');
    skyGrad.addColorStop(0.52, '#223254');
    skyGrad.addColorStop(0.66, '#151f33');
    skyGrad.addColorStop(0.84, '#0f172a');
    skyGrad.addColorStop(1, '#090d16');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Stars / dust across mid & upper sky
  for (let i = 0; i < 180; i++) {
    const sx = (i * 199 + 41) % w;
    const sy = 20 + ((i * 89) % 235);
    const radius = (i % 3) * 0.55 + 0.65;
    ctx.fillStyle = isSengoku
      ? `rgba(254, 215, 170, ${0.14 + (i % 4) * 0.1})`
      : `rgba(186, 230, 253, ${0.18 + (i % 4) * 0.12})`;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Luminous celestial moon in twilight dome
  const moonX = isSengoku ? 260 : 760;
  const moonY = 165;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 108);
  moonGlow.addColorStop(0, isSengoku ? 'rgba(253, 186, 116, 0.85)' : 'rgba(147, 197, 253, 0.72)');
  moonGlow.addColorStop(0.45, isSengoku ? 'rgba(234, 88, 12, 0.24)' : 'rgba(99, 102, 241, 0.22)');
  moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 108, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isSengoku ? '#ffedd5' : '#e0f2fe';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 24, 0, Math.PI * 2);
  ctx.fill();

  // Seamless periodic 360 jagged horizon ridge helper placed in camera-visible lower band (y = 220..440)
  const drawMountainLayer = (
    baseY: number,
    amp1: number,
    amp2: number,
    freq1: number,
    freq2: number,
    fill: string
  ) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      const theta = (x / w) * Math.PI * 2;
      const y =
        baseY -
        Math.sin(theta * freq1 + 0.5) * amp1 -
        Math.cos(theta * freq2 - 0.8) * amp2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  };

  if (isSengoku) {
    drawMountainLayer(268, 36, 20, 3, 7, '#1d2233');
    drawMountainLayer(312, 30, 16, 4, 9, '#171b29');
    drawMountainLayer(362, 22, 12, 5, 11, '#121622');

    // Distant silhouette pagodas around the 360 horizon
    ctx.fillStyle = '#0d1018';
    for (const px of [140, 540, 880]) {
      ctx.fillRect(px - 10, 272, 20, 48);
      for (let tier = 0; tier < 3; tier++) {
        const ty = 272 + tier * 13;
        const tw = 30 + tier * 9;
        ctx.beginPath();
        ctx.moveTo(px - tw / 2, ty + 4);
        ctx.lineTo(px, ty - 8);
        ctx.lineTo(px + tw / 2, ty + 4);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else {
    drawMountainLayer(264, 40, 24, 4, 8, '#18223a');
    drawMountainLayer(314, 30, 18, 5, 10, '#111829');
    drawMountainLayer(362, 22, 13, 6, 13, '#0b101d');
  }

  // Drifting twilight mist wisps & soft dusk embers visible around lower 45 deg band (y = 220..440)
  for (let i = 0; i < 28; i++) {
    const mx = (i * 157 + 28) % w;
    const my = 248 + ((i * 47) % 176);
    const rx = 56 + (i % 4) * 26;
    const ry = 18 + (i % 3) * 8;
    const mistGrad = ctx.createRadialGradient(mx, my, 4, mx, my, rx);
    mistGrad.addColorStop(
      0,
      isSengoku ? 'rgba(110, 138, 178, 0.14)' : 'rgba(96, 165, 250, 0.12)'
    );
    mistGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(1, ry / rx);
    ctx.fillStyle = mistGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Soft glowing dusk embers / lantern haze spots in lower band
  for (let i = 0; i < 36; i++) {
    const ex = (i * 211 + 61) % w;
    const ey = 230 + ((i * 59) % 190);
    const glowR = 14 + (i % 3) * 10;
    const emberGrad = ctx.createRadialGradient(ex, ey, 1, ex, ey, glowR);
    emberGrad.addColorStop(
      0,
      isSengoku ? 'rgba(251, 146, 60, 0.34)' : 'rgba(56, 189, 248, 0.28)'
    );
    emberGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = emberGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft horizon dusk mist band
  const mistGrad = ctx.createLinearGradient(0, 290, 0, 410);
  mistGrad.addColorStop(0, 'rgba(0,0,0,0)');
  mistGrad.addColorStop(
    0.5,
    isSengoku ? 'rgba(130, 152, 186, 0.12)' : 'rgba(56, 189, 248, 0.12)'
  );
  mistGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, 290, w, 120);

  const tex = configureTexture(canvas, 'panorama');
  panoramaCache.set(theme, tex);
  return tex;
}
