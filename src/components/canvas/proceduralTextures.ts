import * as THREE from 'three';
import { ThemeId } from '../../engine/types';

const slabCache = new Map<ThemeId, THREE.CanvasTexture>();
const wallCache = new Map<ThemeId, THREE.CanvasTexture>();

function createCanvas2D(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    return { canvas, ctx };
  } catch {
    return null;
  }
}

function configureTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function getSlabTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = slabCache.get(theme);
  if (existing) return existing;

  const surface = createCanvas2D(256);
  if (!surface) return null;
  const { canvas, ctx } = surface;

  const isSengoku = theme === 'sengoku';
  ctx.fillStyle = isSengoku ? '#d8cab4' : '#cbd5e1';
  ctx.fillRect(0, 0, 256, 256);

  // Subtle deterministic speckle grain
  for (let i = 0; i < 650; i++) {
    const x = (i * 73) % 256;
    const y = (i * 137) % 256;
    const shade = i % 2 === 0 ? (isSengoku ? 'rgba(92,70,48,0.16)' : 'rgba(30,41,59,0.18)') : 'rgba(255,255,255,0.18)';
    ctx.fillStyle = shade;
    ctx.fillRect(x, y, 3, 3);
  }

  // Carved bevel & tile joint lines
  ctx.strokeStyle = isSengoku ? 'rgba(74, 58, 44, 0.45)' : 'rgba(15, 23, 42, 0.5)';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 236, 236);

  ctx.strokeStyle = isSengoku ? 'rgba(120, 92, 68, 0.25)' : 'rgba(71, 85, 105, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(128, 12);
  ctx.lineTo(128, 244);
  ctx.moveTo(12, 128);
  ctx.lineTo(244, 128);
  ctx.stroke();

  // Subtle sumi-e / stone crack accents
  ctx.strokeStyle = isSengoku ? 'rgba(60, 42, 28, 0.28)' : 'rgba(15, 23, 42, 0.32)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(34, 48);
  ctx.lineTo(68, 72);
  ctx.lineTo(94, 62);
  ctx.moveTo(180, 165);
  ctx.lineTo(208, 198);
  ctx.stroke();

  const tex = configureTexture(canvas);
  slabCache.set(theme, tex);
  return tex;
}

export function getWallTexture(theme: ThemeId): THREE.CanvasTexture | null {
  const existing = wallCache.get(theme);
  if (existing) return existing;

  const surface = createCanvas2D(256);
  if (!surface) return null;
  const { canvas, ctx } = surface;

  const isSengoku = theme === 'sengoku';
  ctx.fillStyle = isSengoku ? '#cbb59c' : '#94a3b8';
  ctx.fillRect(0, 0, 256, 256);

  // Masonry brick / timber course pattern
  const rowHeight = 64;
  ctx.strokeStyle = isSengoku ? 'rgba(44, 30, 20, 0.52)' : 'rgba(15, 23, 42, 0.55)';
  ctx.lineWidth = 4;

  for (let row = 0; row < 4; row++) {
    const y = row * rowHeight;
    ctx.strokeRect(0, y, 256, rowHeight);
    const offset = row % 2 === 0 ? 0 : 64;
    for (let x = offset; x < 256; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + rowHeight);
      ctx.stroke();
    }
  }

  // Timber beam / bevel highlight on top band
  ctx.fillStyle = isSengoku ? 'rgba(133, 98, 72, 0.25)' : 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(0, 0, 256, 18);

  const tex = configureTexture(canvas);
  wallCache.set(theme, tex);
  return tex;
}
