import * as THREE from 'three';
import { ThemeId } from '../../engine/types';

export type StandeeKind =
  | 'goblin'
  | 'skeleton'
  | 'orc'
  | 'troll'
  | 'manticore'
  | 'beholder'
  | 'dragon'
  | 'gem'
  | 'item'
  | 'trap'
  | 'party';

export const STANDEE_KINDS: readonly StandeeKind[] = [
  'goblin',
  'skeleton',
  'orc',
  'troll',
  'manticore',
  'beholder',
  'dragon',
  'gem',
  'item',
  'trap',
  'party',
] as const;

export const STANDEE_ASSET_URLS: Record<StandeeKind, string> = {
  goblin: '/assets/standees/minion-goblin.jpg',
  skeleton: '/assets/standees/minion-skeleton.jpg',
  orc: '/assets/standees/minion-orc.jpg',
  troll: '/assets/standees/minion-troll.jpg',
  manticore: '/assets/standees/boss-manticore.jpg',
  beholder: '/assets/standees/boss-beholder.jpg',
  dragon: '/assets/standees/boss-dragon.jpg',
  party: '/assets/standees/pawn-party.jpg',
  gem: '/assets/props/prop-gems-cluster.jpg',
  item: '/assets/props/prop-chest-artifact.jpg',
  trap: '/assets/props/prop-trap-spikes.jpg',
};

const standeeCache = new Map<string, THREE.CanvasTexture>();

export interface PixelSurfaceLike {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Remove dark neutral studio backdrop pixels connected to the image edges via BFS flood-fill,
 * preserving dark ink/lacquer details safely enclosed inside the standee die-cut silhouette.
 */
export function removeDarkStudioBackdrop(
  imageData: PixelSurfaceLike,
  threshold = 48
): void {
  const { data, width, height } = imageData;
  const total = width * height;
  if (total === 0) return;

  const visited = new Uint8Array(total);
  const removed = new Uint8Array(total);
  const queue = new Int32Array(total);
  let head = 0;
  let tail = 0;

  const isBackdropPixel = (pIdx: number): boolean => {
    const off = pIdx * 4;
    const a = data[off + 3];
    if (a === 0) return true;
    const r = data[off];
    const g = data[off + 1];
    const b = data[off + 2];
    const maxCh = Math.max(r, g, b);
    const minCh = Math.min(r, g, b);
    return r < threshold && g < threshold && b < threshold && maxCh - minCh < 22;
  };

  const enqueueIfBackdrop = (x: number, y: number) => {
    const pIdx = y * width + x;
    if (visited[pIdx]) return;
    visited[pIdx] = 1;
    if (isBackdropPixel(pIdx)) {
      queue[tail++] = pIdx;
    }
  };

  for (let x = 0; x < width; x++) {
    enqueueIfBackdrop(x, 0);
    if (height > 1) enqueueIfBackdrop(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    enqueueIfBackdrop(0, y);
    if (width > 1) enqueueIfBackdrop(width - 1, y);
  }

  while (head < tail) {
    const cur = queue[head++];
    removed[cur] = 1;
    data[cur * 4 + 3] = 0;

    const cx = cur % width;
    const cy = (cur - cx) / width;

    if (cx > 0) enqueueIfBackdrop(cx - 1, cy);
    if (cx < width - 1) enqueueIfBackdrop(cx + 1, cy);
    if (cy > 0) enqueueIfBackdrop(cx, cy - 1);
    if (cy < height - 1) enqueueIfBackdrop(cx, cy + 1);
  }

  // Soft feather on immediate perimeter neighbors to eliminate dark edge halos
  const featherCutoff = threshold + 18;
  for (let i = 0; i < total; i++) {
    if (removed[i]) continue;
    const x = i % width;
    const y = (i - x) / width;
    const touchesRemoved =
      (x > 0 && removed[i - 1]) ||
      (x < width - 1 && removed[i + 1]) ||
      (y > 0 && removed[i - width]) ||
      (y < height - 1 && removed[i + width]);

    if (!touchesRemoved) continue;

    const off = i * 4;
    const avg = (data[off] + data[off + 1] + data[off + 2]) / 3;
    const spread = Math.max(data[off], data[off + 1], data[off + 2]) - Math.min(data[off], data[off + 1], data[off + 2]);
    if (avg < featherCutoff && spread < 26) {
      data[off + 3] = Math.min(data[off + 3], 105);
    }
  }
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

function drawRoundedArchPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const r = w * 0.48;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + w / 2, y + r, r, Math.PI, 0, false);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

function getKindColors(kind: StandeeKind, isSengoku: boolean): {
  bgTop: string;
  bgBottom: string;
  rim: string;
  ink: string;
  accent: string;
} {
  switch (kind) {
    case 'goblin':
      return {
        bgTop: '#365314',
        bgBottom: '#1a2e05',
        rim: '#a3e635',
        ink: '#0f172a',
        accent: '#facc15',
      };
    case 'skeleton':
      return {
        bgTop: '#44403c',
        bgBottom: '#1c1917',
        rim: '#e7e5e4',
        ink: '#09090b',
        accent: '#f87171',
      };
    case 'orc':
      return {
        bgTop: '#7f1d1d',
        bgBottom: '#2b0909',
        rim: '#f87171',
        ink: '#18181b',
        accent: '#fbbf24',
      };
    case 'troll':
      return {
        bgTop: '#581c87',
        bgBottom: '#1e1b4b',
        rim: '#e879f9',
        ink: '#09090b',
        accent: '#fb7185',
      };
    case 'manticore':
      return {
        bgTop: '#991b1b',
        bgBottom: '#290a0a',
        rim: '#fbbf24',
        ink: '#1c1917',
        accent: '#f97316',
      };
    case 'beholder':
      return {
        bgTop: '#4c1d95',
        bgBottom: '#170a3b',
        rim: '#c084fc',
        ink: '#0f172a',
        accent: '#38bdf8',
      };
    case 'dragon':
      return {
        bgTop: '#9a3412',
        bgBottom: '#290c04',
        rim: '#fde047',
        ink: '#1c1917',
        accent: '#ef4444',
      };
    case 'gem':
      return {
        bgTop: '#065f46',
        bgBottom: '#022c22',
        rim: '#6ee7b7',
        ink: '#064e3b',
        accent: '#a7f3d0',
      };
    case 'item':
      return {
        bgTop: '#92400e',
        bgBottom: '#451a03',
        rim: '#fde68a',
        ink: '#292524',
        accent: '#f59e0b',
      };
    case 'trap':
      return {
        bgTop: '#9a3412',
        bgBottom: '#431407',
        rim: '#fdba74',
        ink: '#18181b',
        accent: '#ef4444',
      };
    case 'party':
    default:
      return {
        bgTop: isSengoku ? '#92400e' : '#1e3a8a',
        bgBottom: isSengoku ? '#451a03' : '#0f172a',
        rim: isSengoku ? '#fde68a' : '#38bdf8',
        ink: '#1c1917',
        accent: '#fbbf24',
      };
  }
}

function drawArtwork(ctx: CanvasRenderingContext2D, kind: StandeeKind, colors: ReturnType<typeof getKindColors>): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  switch (kind) {
    case 'goblin': {
      ctx.fillStyle = '#84cc16';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(86, 128);
      ctx.lineTo(42, 98);
      ctx.lineTo(74, 146);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(170, 128);
      ctx.lineTo(214, 98);
      ctx.lineTo(182, 146);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#3f6212';
      ctx.beginPath();
      ctx.moveTo(64, 282);
      ctx.quadraticCurveTo(128, 168, 192, 282);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a3e635';
      ctx.beginPath();
      ctx.arc(128, 134, 44, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(110, 128, 9, 6, -0.2, 0, Math.PI * 2);
      ctx.ellipse(146, 128, 9, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1a2e05';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(106, 154);
      ctx.quadraticCurveTo(128, 168, 150, 154);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = colors.ink;
      ctx.beginPath();
      ctx.moveTo(176, 194);
      ctx.lineTo(208, 140);
      ctx.lineTo(192, 206);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'skeleton': {
      ctx.fillStyle = '#d6d3d1';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(74, 282);
      ctx.lineTo(90, 178);
      ctx.lineTo(166, 178);
      ctx.lineTo(182, 282);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#57534e';
      ctx.lineWidth = 5;
      for (let row = 0; row < 3; row++) {
        const y = 200 + row * 22;
        ctx.beginPath();
        ctx.moveTo(96, y);
        ctx.lineTo(160, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#f5f5f4';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 118, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillRect(104, 144, 48, 28);
      ctx.strokeRect(104, 144, 48, 28);

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(110, 118, 10, 0, Math.PI * 2);
      ctx.arc(146, 118, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(110, 118, 4, 0, Math.PI * 2);
      ctx.arc(146, 118, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'orc': {
      ctx.fillStyle = '#991b1b';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(46, 282);
      ctx.lineTo(66, 168);
      ctx.lineTo(190, 168);
      ctx.lineTo(210, 282);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(84, 78, 88, 92, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.moveTo(92, 86);
      ctx.lineTo(74, 46);
      ctx.lineTo(108, 78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(164, 86);
      ctx.lineTo(182, 46);
      ctx.lineTo(148, 78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(98, 158);
      ctx.lineTo(94, 132);
      ctx.lineTo(110, 152);
      ctx.moveTo(158, 158);
      ctx.lineTo(162, 132);
      ctx.lineTo(146, 152);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(108, 118, 7, 0, Math.PI * 2);
      ctx.arc(148, 118, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'troll': {
      ctx.fillStyle = '#7e22ce';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(128, 220, 74, 74, 0, Math.PI, Math.PI * 2);
      ctx.lineTo(202, 282);
      ctx.lineTo(54, 282);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(128, 126, 46, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#78716c';
      ctx.beginPath();
      ctx.moveTo(184, 272);
      ctx.lineTo(212, 102);
      ctx.lineTo(226, 112);
      ctx.lineTo(198, 276);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.fillRect(102, 116, 18, 8);
      ctx.fillRect(136, 116, 18, 8);
      break;
    }

    case 'manticore': {
      ctx.fillStyle = '#7f1d1d';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(128, 164);
      ctx.lineTo(36, 74);
      ctx.lineTo(52, 152);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(128, 164);
      ctx.lineTo(220, 74);
      ctx.lineTo(204, 152);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(164, 250);
      ctx.bezierCurveTo(216, 210, 212, 86, 152, 62);
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(148, 60, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 146, 52, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(128, 146, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(114, 140, 7, 0, Math.PI * 2);
      ctx.arc(142, 140, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'beholder': {
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 7;
      const stalks: [number, number][] = [
        [62, 92],
        [92, 60],
        [128, 48],
        [164, 60],
        [194, 92],
      ];
      for (const [sx, sy] of stalks) {
        ctx.beginPath();
        ctx.moveTo(128, 144);
        ctx.quadraticCurveTo((128 + sx) / 2, sy + 18, sx, sy);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sx, sy, 10, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#6b21a8';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 166, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.ellipse(128, 152, 28, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(128, 152, 13, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.ellipse(128, 152, 4, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(128, 184, 24, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
      break;
    }

    case 'dragon': {
      ctx.fillStyle = '#b91c1c';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(128, 182);
      ctx.lineTo(36, 86);
      ctx.lineTo(54, 178);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(128, 182);
      ctx.lineTo(220, 86);
      ctx.lineTo(202, 178);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(86, 128);
      ctx.lineTo(128, 86);
      ctx.lineTo(170, 128);
      ctx.lineTo(148, 198);
      ctx.lineTo(108, 198);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(104, 96);
      ctx.lineTo(84, 42);
      ctx.lineTo(118, 90);
      ctx.moveTo(152, 96);
      ctx.lineTo(172, 42);
      ctx.lineTo(138, 90);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(110, 134, 7, 0, Math.PI * 2);
      ctx.arc(146, 134, 7, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'gem': {
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      const drawCrystal = (cx: number, cy: number, w: number, h: number, fill: string) => {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h);
        ctx.lineTo(cx + w, cy);
        ctx.lineTo(cx, cy + h * 0.72);
        ctx.lineTo(cx - w, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };
      drawCrystal(88, 188, 28, 56, '#10b981');
      drawCrystal(168, 192, 26, 52, '#059669');
      drawCrystal(128, 160, 44, 86, '#34d399');

      ctx.fillStyle = '#d1fae5';
      ctx.beginPath();
      ctx.moveTo(128, 88);
      ctx.lineTo(148, 152);
      ctx.lineTo(128, 140);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case 'item': {
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(62, 154, 132, 94, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.roundRect(56, 108, 144, 54, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(114, 142, 28, 34);
      ctx.strokeRect(114, 142, 28, 34);

      ctx.strokeStyle = '#fde68a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(128, 62);
      ctx.lineTo(128, 88);
      ctx.moveTo(92, 74);
      ctx.lineTo(106, 94);
      ctx.moveTo(164, 74);
      ctx.lineTo(150, 94);
      ctx.stroke();
      break;
    }

    case 'trap': {
      ctx.fillStyle = '#e2e8f0';
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;
      const spikes: [number, number, number][] = [
        [78, 118, 250],
        [128, 82, 250],
        [178, 118, 250],
      ];
      for (const [sx, topY, baseY] of spikes) {
        ctx.beginPath();
        ctx.moveTo(sx, topY);
        ctx.lineTo(sx + 24, baseY);
        ctx.lineTo(sx - 24, baseY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(56, 236, 144, 24, 8);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'party':
    default: {
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 6;

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(70, 56, 12, 224);
      ctx.strokeRect(70, 56, 12, 224);

      ctx.fillRect(70, 62, 116, 12);
      ctx.strokeRect(70, 62, 116, 12);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(86, 76);
      ctx.lineTo(176, 76);
      ctx.lineTo(176, 222);
      ctx.lineTo(131, 198);
      ctx.lineTo(86, 222);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(131, 134, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(131, 116);
      ctx.lineTo(143, 134);
      ctx.lineTo(131, 152);
      ctx.lineTo(119, 134);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

function hydrateStandeeFromFlowAsset(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  tex: THREE.CanvasTexture,
  kind: StandeeKind,
  theme: ThemeId,
  assetUrl: string
): void {
  if (typeof Image === 'undefined') return;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const w = canvas.width;
        const h = canvas.height;
        const natW = img.naturalWidth || w;
        const natH = img.naturalHeight || h;
        const isProp = kind === 'gem' || kind === 'item' || kind === 'trap';

        if (isProp) {
          const isSengoku = theme === 'sengoku';
          const colors = getKindColors(kind, isSengoku);

          ctx.clearRect(0, 0, w, h);

          // Beveled die-cut relic medallion token so dark iron/obsidian props stay solid
          drawRoundedArchPath(ctx, 18, 18, 220, 280);
          ctx.fillStyle = isSengoku ? '#f5e9d0' : '#cbd5e1';
          ctx.fill();
          ctx.lineWidth = 8;
          ctx.strokeStyle = isSengoku ? '#291d14' : '#0f172a';
          ctx.stroke();

          ctx.save();
          drawRoundedArchPath(ctx, 28, 28, 200, 260);
          ctx.clip();
          ctx.fillStyle = '#141210';
          ctx.fillRect(28, 28, 200, 260);

          const scale = Math.max(200 / natW, 200 / natH);
          const drawW = Math.max(1, Math.round(natW * scale));
          const drawH = Math.max(1, Math.round(natH * scale));
          const dx = Math.round((w - drawW) / 2);
          const dy = Math.round(158 - drawH / 2);
          ctx.drawImage(img, dx, dy, drawW, drawH);
          ctx.restore();

          drawRoundedArchPath(ctx, 28, 28, 200, 260);
          ctx.lineWidth = 5;
          ctx.strokeStyle = colors.rim;
          ctx.stroke();

          ctx.fillStyle = isSengoku ? '#451a03' : '#1e293b';
          ctx.fillRect(42, 284, 172, 18);
          ctx.strokeStyle = colors.rim;
          ctx.lineWidth = 3;
          ctx.strokeRect(42, 284, 172, 18);
        } else {
          const pad = 4;
          const availW = w - pad * 2;
          const availH = h - pad * 2;
          const scale = Math.min(availW / natW, availH / natH);
          const drawW = Math.max(1, Math.round(natW * scale));
          const drawH = Math.max(1, Math.round(natH * scale));
          const dx = Math.round((w - drawW) / 2);
          const dy = Math.round((h - drawH) / 2);

          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, dx, dy, drawW, drawH);

          const imageData = ctx.getImageData(0, 0, w, h);
          removeDarkStudioBackdrop(imageData, 48);
          ctx.putImageData(imageData, 0, 0);
        }

        tex.needsUpdate = true;
      } catch {
        // Preserve procedural standee fallback if image pixel manipulation fails
      }
    };
    img.src = assetUrl;
  } catch {
    // Preserve procedural fallback cleanly
  }
}

export function getStandeeTexture(
  kind: StandeeKind,
  theme: ThemeId = 'sengoku'
): THREE.CanvasTexture | null {
  const key = `${theme}:${kind}`;
  const cached = standeeCache.get(key);
  if (cached) return cached;

  const surface = createCanvasSurface(256, 320);
  if (!surface) return null;
  const { canvas, ctx } = surface;
  const isSengoku = theme === 'sengoku';
  const colors = getKindColors(kind, isSengoku);

  ctx.clearRect(0, 0, 256, 320);

  drawRoundedArchPath(ctx, 18, 18, 220, 280);
  ctx.fillStyle = isSengoku ? '#f5e9d0' : '#cbd5e1';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = isSengoku ? '#291d14' : '#0f172a';
  ctx.stroke();

  ctx.save();
  drawRoundedArchPath(ctx, 28, 28, 200, 260);
  ctx.clip();

  const grad = ctx.createLinearGradient(0, 28, 0, 288);
  grad.addColorStop(0, colors.bgTop);
  grad.addColorStop(1, colors.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(28, 28, 200, 260);

  ctx.strokeStyle = colors.rim;
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(128, 138, 72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;

  drawArtwork(ctx, kind, colors);
  ctx.restore();

  drawRoundedArchPath(ctx, 28, 28, 200, 260);
  ctx.lineWidth = 4;
  ctx.strokeStyle = colors.rim;
  ctx.stroke();

  ctx.fillStyle = isSengoku ? '#451a03' : '#1e293b';
  ctx.fillRect(42, 284, 172, 18);
  ctx.strokeStyle = colors.rim;
  ctx.lineWidth = 3;
  ctx.strokeRect(42, 284, 172, 18);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  standeeCache.set(key, tex);

  hydrateStandeeFromFlowAsset(canvas, ctx, tex, kind, theme, STANDEE_ASSET_URLS[kind]);
  return tex;
}
