import * as THREE from 'three';
import { ThemeId } from '../../engine/types';

const slabCache = new Map<ThemeId, THREE.CanvasTexture>();
const wallCache = new Map<ThemeId, THREE.CanvasTexture>();
const panoramaCache = new Map<ThemeId, THREE.CanvasTexture>();
const tabletopCache = new Map<ThemeId, THREE.CanvasTexture>();

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

function configureTexture(
  canvas: HTMLCanvasElement,
  repeat = true
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  } else {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
  }
  tex.needsUpdate = true;
  return tex;
}

export function getSlabTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = slabCache.get(theme);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  // Neutral-bright multiplier base so material tint shows rich stone stonework
  ctx.fillStyle = isSengoku ? '#e2d3bc' : '#dbe3ee';
  ctx.fillRect(0, 0, size, size);

  // 3x3 carved masonry tiles with varied stone tone and highlights
  const cell = size / 3;
  const toneOffsets = [-16, 10, -8, 12, -4, 16, -10, 8, -14];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const idx = row * 3 + col;
      const x = col * cell;
      const y = row * cell;
      const delta = toneOffsets[idx];
      ctx.fillStyle = delta >= 0 ? `rgba(255,255,255,${delta / 95})` : `rgba(20,16,14,${Math.abs(delta) / 68})`;
      ctx.fillRect(x + 4, y + 4, cell - 8, cell - 8);

      // Top/Left stone bevel highlight
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.38)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + cell - 8);
      ctx.lineTo(x + 6, y + 6);
      ctx.lineTo(x + cell - 8, y + 6);
      ctx.stroke();

      // Bottom/Right stone bevel shadow
      ctx.strokeStyle = isSengoku ? 'rgba(38, 25, 16, 0.42)' : 'rgba(15, 23, 42, 0.48)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + cell - 6, y + 8);
      ctx.lineTo(x + cell - 6, y + cell - 6);
      ctx.lineTo(x + 8, y + cell - 6);
      ctx.stroke();
    }
  }

  // Mineral grain & weathering speckles
  for (let i = 0; i < 2200; i++) {
    const px = (i * 173 + 29) % size;
    const py = (i * 293 + 53) % size;
    const w = (i % 3) + 2;
    ctx.fillStyle =
      i % 2 === 0
        ? isSengoku
          ? 'rgba(54, 38, 24, 0.22)'
          : 'rgba(15, 23, 42, 0.24)'
        : 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(px, py, w, w);
  }

  // Deep mortar grooves
  ctx.strokeStyle = isSengoku ? 'rgba(42, 28, 18, 0.72)' : 'rgba(15, 23, 42, 0.76)';
  ctx.lineWidth = 6;
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
  ctx.strokeStyle = isSengoku ? 'rgba(120, 72, 32, 0.42)' : 'rgba(56, 189, 248, 0.26)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 178);
  ctx.lineTo(334, 256);
  ctx.lineTo(256, 334);
  ctx.lineTo(178, 256);
  ctx.closePath();
  ctx.stroke();

  // Sumi-e / stone weathering cracks & corner brackets
  ctx.strokeStyle = isSengoku ? 'rgba(32, 20, 12, 0.45)' : 'rgba(15, 23, 42, 0.5)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(56, 74);
  ctx.lineTo(118, 124);
  ctx.lineTo(156, 108);
  ctx.moveTo(352, 378);
  ctx.lineTo(418, 426);
  ctx.lineTo(446, 410);
  ctx.stroke();

  // Corner metal studs
  ctx.fillStyle = isSengoku ? 'rgba(146, 64, 14, 0.55)' : 'rgba(100, 116, 139, 0.55)';
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

  const tex = configureTexture(canvas);
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
        ctx.fillStyle = shade > 0 ? 'rgba(255,255,255,0.12)' : 'rgba(15,12,10,0.16)';
        ctx.fillRect(x + 3, y + 3, 122, rowH - 6);
      }

      // Top highlight on masonry course
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(x + 4, y + 3, 120, 4);

      // Mortar border
      ctx.strokeStyle = isSengoku ? 'rgba(34, 22, 14, 0.68)' : 'rgba(15, 23, 42, 0.72)';
      ctx.lineWidth = 5;
      ctx.strokeRect(x, y, 128, rowH);
    }
  }

  // Iron/timber beam band & rivets along upper wall crest
  ctx.fillStyle = isSengoku ? 'rgba(69, 36, 18, 0.42)' : 'rgba(30, 41, 59, 0.45)';
  ctx.fillRect(0, 0, size, 32);
  ctx.fillStyle = isSengoku ? 'rgba(217, 119, 6, 0.5)' : 'rgba(148, 163, 184, 0.55)';
  for (let rx = 32; rx < size; rx += 64) {
    ctx.beginPath();
    ctx.arc(rx, 16, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = configureTexture(canvas);
  wallCache.set(theme, tex);
  return tex;
}

export function getTabletopMatTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = tabletopCache.get(theme);
  if (existing) return existing;

  const size = 512;
  const surface = createCanvasSurface(size, size);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';

  ctx.fillStyle = isSengoku ? '#2b1e16' : '#182234';
  ctx.fillRect(0, 0, size, size);

  // Subtle woven tatami / forged slate grid
  ctx.strokeStyle = isSengoku ? 'rgba(245, 158, 11, 0.08)' : 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 2;
  for (let p = 0; p < size; p += 32) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  // Concentric ritual compass rings around center
  const cx = size / 2;
  const cy = size / 2;
  for (const [r, alpha] of [
    [228, 0.45],
    [194, 0.25],
    [140, 0.18],
  ] as const) {
    ctx.strokeStyle = isSengoku ? `rgba(217, 119, 6, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Cardinal tick marks
  ctx.strokeStyle = isSengoku ? 'rgba(251, 191, 36, 0.42)' : 'rgba(125, 211, 252, 0.4)';
  ctx.lineWidth = 5;
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * 194, cy + Math.sin(ang) * 194);
    ctx.lineTo(cx + Math.cos(ang) * 228, cy + Math.sin(ang) * 228);
    ctx.stroke();
  }

  const tex = configureTexture(canvas, false);
  tabletopCache.set(theme, tex);
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

  // Seamless 360 horizontal sky/cavern gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (isSengoku) {
    skyGrad.addColorStop(0, '#120e16');
    skyGrad.addColorStop(0.42, '#2d1c1e');
    skyGrad.addColorStop(0.68, '#7c3a1d');
    skyGrad.addColorStop(0.84, '#241812');
    skyGrad.addColorStop(1, '#120c09');
  } else {
    skyGrad.addColorStop(0, '#070b14');
    skyGrad.addColorStop(0.45, '#131b2e');
    skyGrad.addColorStop(0.68, '#283655');
    skyGrad.addColorStop(0.84, '#111726');
    skyGrad.addColorStop(1, '#090d16');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h);

  // Stars / faint ember dust across upper dome
  for (let i = 0; i < 160; i++) {
    const sx = (i * 199 + 41) % w;
    const sy = 18 + ((i * 89) % 210);
    const radius = (i % 3) * 0.6 + 0.7;
    ctx.fillStyle = isSengoku
      ? `rgba(254, 215, 170, ${0.18 + (i % 4) * 0.14})`
      : `rgba(186, 230, 253, ${0.2 + (i % 4) * 0.16})`;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Luminous celestial orb / moon in 360 sky
  const moonX = isSengoku ? 260 : 760;
  const moonY = 148;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 12, moonX, moonY, 108);
  moonGlow.addColorStop(0, isSengoku ? 'rgba(253, 186, 116, 0.9)' : 'rgba(147, 197, 253, 0.75)');
  moonGlow.addColorStop(0.45, isSengoku ? 'rgba(234, 88, 12, 0.28)' : 'rgba(99, 102, 241, 0.25)');
  moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 108, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isSengoku ? '#ffedd5' : '#e0f2fe';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Seamless periodic 360 horizon ridge helper (multiples of 2*PI across w = 1024)
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
    drawMountainLayer(292, 42, 22, 3, 7, '#3b1e1c');
    drawMountainLayer(324, 34, 18, 4, 9, '#241413');
    drawMountainLayer(354, 24, 12, 5, 11, '#170d0c');

    // Distant silhouette pagodas around the 360 horizon
    ctx.fillStyle = '#140b09';
    for (const px of [140, 540, 880]) {
      ctx.fillRect(px - 10, 294, 20, 44);
      for (let tier = 0; tier < 3; tier++) {
        const ty = 294 + tier * 12;
        const tw = 28 + tier * 8;
        ctx.beginPath();
        ctx.moveTo(px - tw / 2, ty + 4);
        ctx.lineTo(px, ty - 7);
        ctx.lineTo(px + tw / 2, ty + 4);
        ctx.closePath();
        ctx.fill();
      }
    }
  } else {
    // Gothic underground obsidian spires & cavern horizon
    drawMountainLayer(288, 46, 26, 4, 8, '#1a243b');
    drawMountainLayer(322, 32, 20, 5, 10, '#111829');
    drawMountainLayer(352, 22, 14, 6, 13, '#0b101d');

    // Glowing magma fissures along lower abyss ring
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const theta = (x / w) * Math.PI * 2;
      const y = 398 + Math.sin(theta * 6) * 14 + Math.cos(theta * 11) * 7;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Horizon mist band
  const mistGrad = ctx.createLinearGradient(0, 315, 0, 390);
  mistGrad.addColorStop(0, 'rgba(0,0,0,0)');
  mistGrad.addColorStop(0.5, isSengoku ? 'rgba(245, 158, 11, 0.16)' : 'rgba(56, 189, 248, 0.14)');
  mistGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = mistGrad;
  ctx.fillRect(0, 315, w, 75);

  const tex = configureTexture(canvas, false);
  panoramaCache.set(theme, tex);
  return tex;
}
