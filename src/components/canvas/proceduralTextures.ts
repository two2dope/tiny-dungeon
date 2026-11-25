import * as THREE from 'three';
import { ThemeId } from '../../engine/types';
import { getMapBiome, normalizeMapId } from './mapBiomes';

const slabCache = new Map<string, THREE.CanvasTexture>();
const wallCache = new Map<string, THREE.CanvasTexture>();
const panoramaCache = new Map<string, THREE.CanvasTexture>();
const tabletopCache = new Map<string, THREE.CanvasTexture>();
const courtyardGroundCache = new Map<string, THREE.CanvasTexture>();
const courtyardFadeCache = new Map<string, THREE.CanvasTexture>();
const lacquerWoodCache = new Map<string, THREE.CanvasTexture>();
const mistRingCache = new Map<string, THREE.CanvasTexture>();
const glowPoolCache = new Map<string, THREE.CanvasTexture>();
const warBannerClothCache = new Map<string, THREE.CanvasTexture>();
const haloCache = new Map<string, THREE.CanvasTexture>();
const flameCache = new Map<string, THREE.CanvasTexture>();
const emberBedCache = new Map<string, THREE.CanvasTexture>();
const uiTokenCache = new Map<string, THREE.CanvasTexture>();
const ofudaCache = new Map<string, THREE.CanvasTexture>();

function cacheKey(theme: ThemeId, mapId = 1): string {
  return theme === 'sengoku' ? `sengoku:${normalizeMapId(mapId)}` : 'vesperfall';
}

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

export function getSlabTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = slabCache.get(key);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = biome.slabBase;
  ctx.fillRect(0, 0, size, size);

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

      // Aged tatami / fine brushed stone cross-grain lines
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

  // Biome-specific surface weathering patches
  const patchCount = biome.motif === 'moss' ? 68 : 42;
  for (let i = 0; i < patchCount; i++) {
    const fx = ((i * 137 + 19) % 440) + 36;
    const fy = ((i * 211 + 43) % 440) + 36;
    const r = (biome.motif === 'moss' ? 6 : 4) + (i % 6);
    ctx.fillStyle = `rgba(${biome.slabAccentRgb}, ${
      biome.motif === 'water' || biome.motif === 'frost'
        ? 0.14 + (i % 3) * 0.05
        : 0.12 + (i % 3) * 0.05
    })`;
    ctx.beginPath();
    ctx.ellipse(fx, fy, r * 1.45, r, (i * 0.7) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Motif-specific floor artistry
  if (biome.motif === 'water') {
    for (const [rx, ry, rr] of [
      [148, 162, 54],
      [356, 338, 62],
      [256, 256, 44],
    ] as const) {
      const puddle = ctx.createRadialGradient(rx, ry, 4, rx, ry, rr);
      puddle.addColorStop(0, 'rgba(45, 212, 191, 0.28)');
      puddle.addColorStop(0.65, 'rgba(56, 189, 248, 0.14)');
      puddle.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = puddle;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rr * 1.2, rr * 0.85, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (biome.motif === 'gold-inlay') {
    ctx.strokeStyle = 'rgba(245, 194, 72, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(18, 18, size - 36, size - 36);
    ctx.strokeRect(128, 128, size - 256, size - 256);
  } else if (biome.motif === 'frost') {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.38)';
    for (let i = 0; i < 60; i++) {
      const sx = (i * 181 + 23) % size;
      const sy = (i * 257 + 41) % size;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (biome.motif === 'sandstone') {
    ctx.strokeStyle = 'rgba(168, 118, 62, 0.18)';
    ctx.lineWidth = 2;
    for (let y = 30; y < size; y += 38) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.33, y + 8, size * 0.66, y - 8, size, y + 3);
      ctx.stroke();
    }
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

  // Magma glowing seams trace inside obsidian cracks
  if (biome.motif === 'magma') {
    const glowLine = 'rgba(249, 115, 22, 0.62)';
    drawInkCrack(ctx, [[34, 48], [76, 86], [104, 78], [134, 114]], glowLine, 5);
    drawInkCrack(ctx, [[352, 378], [418, 426], [460, 404]], glowLine, 5);
    drawInkCrack(ctx, [[cell, 16], [cell, size - 16]], 'rgba(234, 88, 12, 0.36)', 2.5);
  }

  // Carved tactical diamond emblem in slab center
  ctx.strokeStyle = biome.slabEmblem;
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
  ctx.fillStyle = biome.slabStud;
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
  slabCache.set(key, tex);
  return tex;
}

export function getWallTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = wallCache.get(key);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = biome.wallBase;
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

      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x + 4, y + 3, 120, 4);

      ctx.strokeStyle = isSengoku ? 'rgba(26, 16, 10, 0.78)' : 'rgba(12, 18, 34, 0.8)';
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, 128, rowH);
    }
  }

  if (biome.motif === 'magma') {
    drawInkCrack(ctx, [[42, 140], [120, 210], [186, 190]], 'rgba(249, 115, 22, 0.5)', 3);
    drawInkCrack(ctx, [[310, 280], [390, 360], [450, 330]], 'rgba(220, 38, 38, 0.48)', 3);
  } else if (biome.motif === 'frost') {
    ctx.fillStyle = 'rgba(241, 245, 249, 0.25)';
    ctx.fillRect(0, 32, size, 12);
  } else if (biome.motif === 'moss') {
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = 'rgba(74, 124, 58, 0.25)';
      ctx.beginPath();
      ctx.ellipse((i * 89 + 24) % size, 240 + (i % 5) * 48, 18, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Iron/timber beam band & rivets along upper wall crest
  ctx.fillStyle = biome.wallBand;
  ctx.fillRect(0, 0, size, 32);
  ctx.fillStyle = biome.wallRivet;
  for (let rx = 32; rx < size; rx += 64) {
    ctx.beginPath();
    ctx.arc(rx, 16, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = configureTexture(canvas, 'repeat');
  wallCache.set(key, tex);
  return tex;
}

export function getTabletopMatTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = tabletopCache.get(key);
  if (existing) return existing;

  const size = 1024;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const isSengoku = theme === 'sengoku';
  const cx = size / 2;
  const cy = size / 2;

  const baseGrad = ctx.createRadialGradient(cx, cy, 80, cx, cy, 520);
  baseGrad.addColorStop(0, biome.daisGrad[0]);
  baseGrad.addColorStop(0.65, biome.daisGrad[1]);
  baseGrad.addColorStop(1, biome.daisGrad[2]);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

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

      if ((s + rIdx * 3) % 7 === 0) {
        ctx.fillStyle = `rgba(${biome.courtyardDetailRgb}, 0.2)`;
        ctx.fill();
      }

      ctx.strokeStyle = isSengoku ? 'rgba(14, 10, 8, 0.72)' : 'rgba(9, 14, 24, 0.78)';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }
  }

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
    emberGlow.addColorStop(0, biome.glowPoolStops[1]);
    emberGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = emberGlow;
    ctx.beginPath();
    ctx.arc(bx, by, 130, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const [r, alpha, lw] of [
    [462, 0.36, 5],
    [392, 0.25, 3],
    [260, 0.22, 3],
  ] as const) {
    ctx.strokeStyle = `rgba(${biome.daisCrestRgb}, ${alpha})`;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(${biome.daisCrestRgb}, 0.32)`;
  ctx.lineWidth = 4;
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 392, cy + Math.sin(ang) * 392);
    ctx.lineTo(cx + Math.cos(ang) * 462, cy + Math.sin(ang) * 462);
    ctx.stroke();
  }

  const tex = configureTexture(canvas, 'clamp');
  tabletopCache.set(key, tex);
  return tex;
}

export function getCourtyardGroundTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = courtyardGroundCache.get(key);
  if (existing) return existing;

  const size = 1024;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = biome.courtyardBase;
  ctx.fillRect(0, 0, size, size);

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

      ctx.strokeStyle = isSengoku ? 'rgba(205, 196, 182, 0.16)' : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + rowH - 7);
      ctx.lineTo(x + 6, y + 6);
      ctx.lineTo(x + bw - 7, y + 6);
      ctx.stroke();

      ctx.strokeStyle = isSengoku ? 'rgba(10, 12, 16, 0.85)' : 'rgba(6, 10, 20, 0.88)';
      ctx.lineWidth = 5.5;
      ctx.strokeRect(x, y, bw, rowH);

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

  for (let i = 0; i < 65; i++) {
    const mx = (i * 197 + 31) % size;
    const my = (i * 313 + 67) % size;
    const r = 10 + (i % 16);
    ctx.fillStyle = `rgba(${biome.courtyardDetailRgb}, ${0.12 + (i % 3) * 0.05})`;
    ctx.beginPath();
    ctx.ellipse(mx, my, r * 1.4, r * 0.9, (i * 0.9) % Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 3600; i++) {
    const px = (i * 239 + 17) % size;
    const py = (i * 409 + 61) % size;
    const w = (i % 3) + 1;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(10, 10, 14, 0.25)' : 'rgba(255, 255, 255, 0.07)';
    ctx.fillRect(px, py, w, w);
  }

  // Biome-specific ground scatter details
  if (biome.motif === 'magma' || biome.motif === 'vesperfall') {
    const fissureColor =
      biome.motif === 'magma' ? 'rgba(249, 115, 22, 0.48)' : 'rgba(249, 115, 22, 0.28)';
    for (let i = 0; i < (biome.motif === 'magma' ? 28 : 16); i++) {
      const sx = (i * 191 + 44) % size;
      const sy = (i * 277 + 88) % size;
      drawInkCrack(
        ctx,
        [
          [sx, sy],
          [sx + 28, sy + 18],
          [sx + 52, sy + 6],
        ],
        fissureColor,
        biome.motif === 'magma' ? 3.2 : 2.5
      );
    }
  } else if (biome.motif === 'water') {
    for (let i = 0; i < 18; i++) {
      const rx = (i * 223 + 48) % size;
      const ry = (i * 173 + 64) % size;
      const rr = 34 + (i % 4) * 14;
      const g = ctx.createRadialGradient(rx, ry, 2, rx, ry, rr);
      g.addColorStop(0, biome.courtyardAccentColors[i % biome.courtyardAccentColors.length]);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(rx, ry, rr * 1.4, rr * 0.9, (i * 0.4) % Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    for (let i = 0; i < 58; i++) {
      const lx = (i * 283 + 57) % size;
      const ly = (i * 179 + 93) % size;
      const angle = (i * 1.1) % (Math.PI * 2);
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);
      ctx.fillStyle = biome.courtyardAccentColors[i % biome.courtyardAccentColors.length];
      ctx.beginPath();
      const rx = biome.motif === 'frost' ? 12 + (i % 8) : 7 + (i % 4);
      const ry = biome.motif === 'frost' ? 6 + (i % 4) : 3.2;
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const tex = configureTexture(canvas, 'repeat', 5, 5);
  courtyardGroundCache.set(key, tex);
  return tex;
}

export function getCourtyardFadeTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = courtyardFadeCache.get(key);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;

  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(cx, cy, rOuter * 0.42, cx, cy, rOuter);
  grad.addColorStop(0, `rgba(${biome.fadeRgb}, 0)`);
  grad.addColorStop(0.36, `rgba(${biome.fadeRgb}, 0.28)`);
  grad.addColorStop(0.7, `rgba(${biome.fadeRgb}, 0.86)`);
  grad.addColorStop(0.84, `rgba(${biome.fadeRgb}, 1)`);
  grad.addColorStop(1, `rgba(${biome.fadeRgb}, 1)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = configureTexture(canvas, 'clamp');
  courtyardFadeCache.set(key, tex);
  return tex;
}

export function getLacquerWoodTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = lacquerWoodCache.get(key);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = biome.lacquerBase;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 160; i++) {
    const gx = (i * 19 + 7) % size;
    const dark = i % 3 !== 0;
    ctx.strokeStyle = dark
      ? isSengoku
        ? `rgba(24, 10, 8, ${0.18 + (i % 4) * 0.06})`
        : `rgba(12, 16, 36, ${0.22 + (i % 4) * 0.06})`
      : 'rgba(255, 225, 190, 0.1)';
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

  for (let i = 0; i < 36; i++) {
    const px = (i * 149 + 23) % size;
    const py = (i * 263 + 41) % size;
    ctx.fillStyle = isSengoku ? 'rgba(42, 24, 16, 0.34)' : 'rgba(22, 28, 52, 0.38)';
    ctx.fillRect(px, py, 6 + (i % 10), 14 + (i % 18));
  }

  for (const bandY of [72, 248, 412]) {
    ctx.fillStyle = 'rgba(18, 18, 22, 0.56)';
    ctx.fillRect(0, bandY, size, 22);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.72)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, bandY, size, 22);

    ctx.fillStyle = isSengoku ? 'rgba(212, 164, 92, 0.68)' : 'rgba(148, 163, 184, 0.65)';
    for (let rx = 28; rx < size; rx += 64) {
      ctx.beginPath();
      ctx.arc(rx, bandY + 11, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = configureTexture(canvas, 'repeat');
  lacquerWoodCache.set(key, tex);
  return tex;
}

export function getMistRingTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = mistRingCache.get(key);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < 42; i++) {
    const angle = (i / 42) * Math.PI * 2 + (i % 3) * 0.19;
    const dist = 104 + (i % 5) * 26;
    const wx = cx + Math.cos(angle) * dist;
    const wy = cy + Math.sin(angle) * dist;
    const wispR = 54 + (i % 4) * 18;
    const alpha = 0.14 + (i % 3) * 0.05;

    const grad = ctx.createRadialGradient(wx, wy, 4, wx, wy, wispR);
    grad.addColorStop(0, `rgba(${biome.mistRgb}, ${alpha})`);
    grad.addColorStop(0.55, `rgba(${biome.mistRgb}, ${alpha * 0.45})`);
    grad.addColorStop(1, `rgba(${biome.mistRgb}, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(wx, wy, wispR, 0, Math.PI * 2);
    ctx.fill();
  }

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
  mistRingCache.set(key, tex);
  return tex;
}

export function getGlowPoolTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = glowPoolCache.get(key);
  if (existing) return existing;

  const size = 256;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  ctx.clearRect(0, 0, size, size);
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
  grad.addColorStop(0, biome.glowPoolStops[0]);
  grad.addColorStop(0.35, biome.glowPoolStops[1]);
  grad.addColorStop(0.7, biome.glowPoolStops[2]);
  grad.addColorStop(1, biome.glowPoolStops[3]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = configureTexture(canvas, 'clamp');
  glowPoolCache.set(key, tex);
  return tex;
}

export function getWarBannerClothTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = warBannerClothCache.get(key);
  if (existing) return existing;

  const w = 256;
  const h = 512;
  const surface = createCanvasSurface(w, h);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const isSengoku = theme === 'sengoku';

  ctx.clearRect(0, 0, w, h);

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

  ctx.fillStyle = biome.bannerLeft;
  ctx.fillRect(0, 0, w / 2, h);
  ctx.fillStyle = biome.bannerRight;
  ctx.fillRect(w / 2, 0, w / 2, h);

  for (let y = 24; y < h; y += 26) {
    ctx.strokeStyle = 'rgba(20, 14, 10, 0.14)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.quadraticCurveTo(w / 2, y + (y % 52 === 0 ? 10 : -8), w - 16, y + 4);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(w / 2, 186);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = biome.bannerEmblem;
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

  for (const lx of [42, 128, 214]) {
    ctx.fillStyle = biome.bannerLeft;
    ctx.fillRect(lx - 10, 4, 20, 22);
    ctx.strokeStyle = '#18100c';
    ctx.lineWidth = 4;
    ctx.strokeRect(lx - 10, 4, 20, 22);
  }

  const tex = configureTexture(canvas, 'clamp');
  warBannerClothCache.set(key, tex);
  return tex;
}

export function getPanoramaTexture(theme: ThemeId, mapId = 1): THREE.CanvasTexture | null {
  const key = cacheKey(theme, mapId);
  const existing = panoramaCache.get(key);
  if (existing) return existing;

  const w = 1024;
  const h = 512;
  const surface = createCanvasSurface(w, h);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const biome = getMapBiome(theme, mapId);
  const isSengoku = theme === 'sengoku';

  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  skyGrad.addColorStop(0, biome.skyStops[0]);
  skyGrad.addColorStop(0.36, biome.skyStops[1]);
  skyGrad.addColorStop(0.5, biome.skyStops[2]);
  skyGrad.addColorStop(0.64, biome.skyStops[3]);
  skyGrad.addColorStop(0.82, biome.skyStops[4]);
  skyGrad.addColorStop(1, biome.skyStops[5]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 180; i++) {
    const sx = (i * 199 + 41) % w;
    const sy = 20 + ((i * 89) % 235);
    const radius = (i % 3) * 0.55 + 0.65;
    ctx.fillStyle = `rgba(${biome.horizonEmberRgb}, ${0.14 + (i % 4) * 0.1})`;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const moonX = isSengoku ? 220 + ((normalizeMapId(mapId) * 97) % 620) : 760;
  const moonY = 162;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 112);
  moonGlow.addColorStop(0, biome.moonGlowInner);
  moonGlow.addColorStop(0.45, biome.moonGlowMid);
  moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 112, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = biome.moonColor;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 24, 0, Math.PI * 2);
  ctx.fill();

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

  drawMountainLayer(268, 36, 20, 3, 7, biome.mountainLayers[0]);
  drawMountainLayer(312, 30, 16, 4, 9, biome.mountainLayers[1]);
  drawMountainLayer(362, 22, 12, 5, 11, biome.mountainLayers[2]);

  if (isSengoku) {
    ctx.fillStyle = biome.pagodaColor;
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
  }

  for (let i = 0; i < 28; i++) {
    const mx = (i * 157 + 28) % w;
    const my = 248 + ((i * 47) % 176);
    const rx = 56 + (i % 4) * 26;
    const ry = 18 + (i % 3) * 8;
    const mistGrad = ctx.createRadialGradient(mx, my, 4, mx, my, rx);
    mistGrad.addColorStop(0, `rgba(${biome.mistRgb}, 0.14)`);
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

  for (let i = 0; i < 36; i++) {
    const ex = (i * 211 + 61) % w;
    const ey = 230 + ((i * 59) % 190);
    const glowR = 14 + (i % 3) * 10;
    const emberGrad = ctx.createRadialGradient(ex, ey, 1, ex, ey, glowR);
    emberGrad.addColorStop(0, `rgba(${biome.horizonEmberRgb}, 0.34)`);
    emberGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = emberGrad;
    ctx.beginPath();
    ctx.arc(ex, ey, glowR, 0, Math.PI * 2);
    ctx.fill();
  }

  const mistGrad = ctx.createLinearGradient(0, 290, 0, 410);
  mistGrad.addColorStop(0, 'rgba(0,0,0,0)');
  mistGrad.addColorStop(0.5, `rgba(${biome.mistRgb}, 0.14)`);
  mistGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, 290, w, 120);

  const tex = configureTexture(canvas, 'panorama');
  panoramaCache.set(key, tex);
  return tex;
}

export function getStandeeHaloTexture(
  accentHex: string,
  variant: 'party' | 'boss' | 'minion' | 'prop',
  theme: ThemeId = 'sengoku'
): THREE.CanvasTexture | null {
  const key = `${theme}:${variant}:${accentHex}`;
  const existing = haloCache.get(key);
  if (existing) return existing;

  const size = 256;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  // Soft dark ground ambient occlusion + contact shadow directly under standee/pedestal
  const contactGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 86);
  contactGrad.addColorStop(0, 'rgba(0, 0, 0, 0.72)');
  contactGrad.addColorStop(0.45, 'rgba(0, 0, 0, 0.42)');
  contactGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = contactGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 86, 0, Math.PI * 2);
  ctx.fill();

  // Outer ambient aura glow tinted with entity accent
  const auraGrad = ctx.createRadialGradient(cx, cy, 62, cx, cy, 122);
  auraGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  auraGrad.addColorStop(0.45, `${accentHex}55`);
  auraGrad.addColorStop(0.72, `${accentHex}33`);
  auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 122, 0, Math.PI * 2);
  ctx.fill();

  // Dark sumi-e ink brush halo backing stroke
  ctx.strokeStyle = 'rgba(12, 10, 9, 0.85)';
  ctx.lineWidth = variant === 'boss' ? 14 : 11;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, variant === 'party' ? 88 : 82, 0.12, Math.PI * 2 - 0.18);
  ctx.stroke();

  // Primary colored painterly brush ring (broken sumi-e enso arc for organic craft)
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = variant === 'boss' ? 7 : 5.5;
  ctx.beginPath();
  ctx.arc(cx, cy, variant === 'party' ? 88 : 82, 0.16, Math.PI * 2 - 0.22);
  ctx.stroke();

  // Secondary inner precision accent ring
  ctx.strokeStyle = `${accentHex}bb`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, variant === 'boss' ? 98 : 94, 0.5, Math.PI * 1.85);
  ctx.stroke();

  if (variant === 'party') {
    // Crisp 4 cardinal compass chevron ticks baked cleanly into the party halo
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2;
      ctx.save();
      ctx.translate(cx + Math.cos(ang) * 108, cy + Math.sin(ang) * 108);
      ctx.rotate(ang);
      ctx.fillStyle = '#fef08a';
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-6, -9);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-6, 9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (variant === 'boss') {
    // 8 ritual seal notch marks for imperial boss altar
    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 92, cy + Math.sin(ang) * 92);
      ctx.lineTo(cx + Math.cos(ang) * 110, cy + Math.sin(ang) * 110);
      ctx.stroke();
    }
  } else {
    // Subtle 4 ornamental studs for minion/prop pedestals
    ctx.fillStyle = theme === 'sengoku' ? '#fef3c7' : '#bae6fd';
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * 94, cy + Math.sin(ang) * 94, 4.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = configureTexture(canvas, 'clamp');
  haloCache.set(key, tex);
  return tex;
}

export function getStylizedFlameTexture(
  outerHex: string,
  midHex: string,
  coreHex: string
): THREE.CanvasTexture | null {
  const key = `${outerHex}:${midHex}:${coreHex}`;
  const existing = flameCache.get(key);
  if (existing) return existing;

  const w = 256;
  const h = 256;
  const surface = createCanvasSurface(w, h);
  if (!surface) return null;
  const { canvas, ctx } = surface;

  ctx.clearRect(0, 0, w, h);

  // Soft outer radial heat halo
  const heatGrad = ctx.createRadialGradient(128, 178, 14, 128, 152, 118);
  heatGrad.addColorStop(0, `${outerHex}cc`);
  heatGrad.addColorStop(0.55, `${outerHex}44`);
  heatGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = heatGrad;
  ctx.beginPath();
  ctx.arc(128, 156, 118, 0, Math.PI * 2);
  ctx.fill();

  const drawLick = (
    cx: number,
    baseY: number,
    topY: number,
    width: number,
    lean: number,
    fill: string | CanvasGradient
  ) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.bezierCurveTo(cx - width, baseY - 22, cx - width * 0.7 + lean, (baseY + topY) / 2, cx + lean, topY);
    ctx.bezierCurveTo(cx + width * 0.65 + lean, (baseY + topY) / 2, cx + width, baseY - 22, cx, baseY);
    ctx.closePath();
    ctx.fill();
  };

  // Side flame tongues
  drawLick(102, 232, 74, 42, -16, `${outerHex}cc`);
  drawLick(154, 232, 84, 38, 14, `${outerHex}cc`);

  // Main central outer flame
  const outerGrad = ctx.createLinearGradient(0, 236, 0, 22);
  outerGrad.addColorStop(0, outerHex);
  outerGrad.addColorStop(0.65, midHex);
  outerGrad.addColorStop(1, `${midHex}00`);
  drawLick(128, 236, 22, 68, 4, outerGrad);

  // Mid bright flame tongue
  const midGrad = ctx.createLinearGradient(0, 234, 0, 56);
  midGrad.addColorStop(0, midHex);
  midGrad.addColorStop(0.75, coreHex);
  midGrad.addColorStop(1, `${coreHex}00`);
  drawLick(128, 234, 56, 46, -5, midGrad);

  // Luminous incandescent core
  drawLick(128, 230, 116, 26, 2, coreHex);

  // Rising detached flame droplet sparks near crown
  for (const [sx, sy, sr] of [
    [108, 46, 5],
    [146, 36, 4],
    [126, 18, 3.5],
  ] as const) {
    ctx.fillStyle = coreHex;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = configureTexture(canvas, 'clamp');
  flameCache.set(key, tex);
  return tex;
}

export function getEmberBedTexture(outerHex: string, coreHex: string): THREE.CanvasTexture | null {
  const key = `${outerHex}:${coreHex}`;
  const existing = emberBedCache.get(key);
  if (existing) return existing;

  const size = 128;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);
  const bedGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 62);
  bedGrad.addColorStop(0, coreHex);
  bedGrad.addColorStop(0.45, outerHex);
  bedGrad.addColorStop(0.85, '#291512');
  bedGrad.addColorStop(1, '#140c0a');

  ctx.fillStyle = bedGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 60, 0, Math.PI * 2);
  ctx.fill();

  // Charred coal nuggets silhouette over hot ember glow
  ctx.fillStyle = 'rgba(20, 12, 10, 0.78)';
  for (let i = 0; i < 18; i++) {
    const ang = i * 2.1;
    const dist = 12 + (i % 4) * 11;
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.cos(ang) * dist,
      cy + Math.sin(ang) * dist,
      8 + (i % 4) * 2,
      5 + (i % 3) * 2,
      ang,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  const tex = configureTexture(canvas, 'clamp');
  emberBedCache.set(key, tex);
  return tex;
}

export function getUiTokenTexture(
  url: string,
  fallbackKind: 'lock' | 'portal'
): THREE.CanvasTexture | null {
  const existing = uiTokenCache.get(url);
  if (existing) return existing;

  const size = 128;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);
  if (fallbackKind === 'lock') {
    const grad = ctx.createRadialGradient(cx, cy, 8, cx, cy, 56);
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#450a0a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#fbbf24';
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx - 18, cy - 4, 36, 26);
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy - 8, 13, Math.PI, 0);
    ctx.stroke();
  } else {
    const grad = ctx.createRadialGradient(cx, cy, 6, cx, cy, 58);
    grad.addColorStop(0, '#ecfeff');
    grad.addColorStop(0.35, '#2dd4bf');
    grad.addColorStop(0.75, '#0f766e');
    grad.addColorStop(1, 'rgba(15, 118, 110, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, 58, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0.2, Math.PI * 1.7);
    ctx.stroke();
  }

  const tex = configureTexture(canvas, 'clamp');
  uiTokenCache.set(url, tex);

  if (typeof Image !== 'undefined') {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          tex.needsUpdate = true;
        } catch {
          // Keep clean procedural token fallback
        }
      };
      img.src = url;
    } catch {
      // Ignore image hydrate failures
    }
  }

  return tex;
}

export function getOfudaStripTexture(): THREE.CanvasTexture | null {
  const key = 'default';
  const existing = ofudaCache.get(key);
  if (existing) return existing;

  const w = 64;
  const h = 192;
  const surface = createCanvasSurface(w, h);
  if (!surface) return null;
  const { canvas, ctx } = surface;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#e7d7b8';
  ctx.fillRect(6, 4, w - 12, h - 10);
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 8, w - 20, h - 18);

  // Sumi-e seal stamp at top & calligraphic strokes
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(20, 18, 24, 22);
  ctx.strokeStyle = '#1c1917';
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  for (const [y0, y1] of [
    [56, 76],
    [88, 114],
    [126, 152],
  ] as const) {
    ctx.beginPath();
    ctx.moveTo(20, y0);
    ctx.lineTo(44, (y0 + y1) / 2);
    ctx.lineTo(24, y1);
    ctx.stroke();
  }

  const tex = configureTexture(canvas, 'clamp');
  ofudaCache.set(key, tex);
  return tex;
}
