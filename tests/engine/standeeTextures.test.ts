import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  getStandeeTexture,
  removeDarkStudioBackdrop,
  STANDEE_ASSET_URLS,
  STANDEE_KINDS,
} from '../../src/components/canvas/standeeTextures';

describe('standeeTextures', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('exposes all 12 tabletop standee kinds mapped to Google Flow assets', () => {
    expect(STANDEE_KINDS).toEqual([
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
      'potion',
      'party',
    ]);

    for (const kind of STANDEE_KINDS) {
      expect(STANDEE_ASSET_URLS[kind]).toMatch(/^\/assets\/(standees|props|ui)\/.*\.(jpg|webp)$/);
    }
  });

  it('removes dark studio backdrop connected to image edges via BFS while preserving enclosed dark details', () => {
    const width = 5;
    const height = 5;
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill 5x5 grid with dark background RGB(20, 20, 22), A=255
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 20;
      data[i * 4 + 1] = 20;
      data[i * 4 + 2] = 22;
      data[i * 4 + 3] = 255;
    }

    // Build a bright die-cut parchment ring on the 3x3 inner perimeter (x: 1..3, y: 1..3)
    // leaving center pixel (2,2) as enclosed dark armor RGB(12, 12, 14)
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 3; x++) {
        if (x === 2 && y === 2) continue;
        const off = (y * width + x) * 4;
        data[off] = 240;
        data[off + 1] = 228;
        data[off + 2] = 200;
        data[off + 3] = 255;
      }
    }

    removeDarkStudioBackdrop({ data, width, height }, 85);

    // Corner pixel (0,0) must be transparent
    expect(data[3]).toBe(0);
    // Border ring pixel (1,1) must stay opaque
    expect(data[(1 * width + 1) * 4 + 3]).toBe(255);
    // Enclosed dark center pixel (2,2) must stay opaque (unreached by edge flood-fill)
    expect(data[(2 * width + 2) * 4 + 3]).toBe(255);
  });

  it('removes both dark (24,24,26) and medium lit studio greys (92,98,108) while preserving die-cut edges and enclosed dark pixels', () => {
    const width = 6;
    const height = 6;
    const data = new Uint8ClampedArray(width * height * 4);

    // Outer perimeter has lit slate studio gradient (92, 98, 108), corners darker (24, 24, 26)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const off = (y * width + x) * 4;
        const isCorner = (x === 0 || x === width - 1) && (y === 0 || y === height - 1);
        data[off] = isCorner ? 24 : 92;
        data[off + 1] = isCorner ? 24 : 98;
        data[off + 2] = isCorner ? 26 : 108;
        data[off + 3] = 255;
      }
    }

    // Build die-cut parchment ring around x: 1..4, y: 1..4 with enclosed dark ink center (2..3, 2..3)
    for (let y = 1; y <= 4; y++) {
      for (let x = 1; x <= 4; x++) {
        const off = (y * width + x) * 4;
        const isBorder = x === 1 || x === 4 || y === 1 || y === 4;
        if (isBorder) {
          data[off] = 240;
          data[off + 1] = 228;
          data[off + 2] = 200;
        } else {
          data[off] = 12;
          data[off + 1] = 12;
          data[off + 2] = 14;
        }
        data[off + 3] = 255;
      }
    }

    removeDarkStudioBackdrop({ data, width, height }, 128);

    // Outer dark corner and outer medium studio grey must be removed
    expect(data[3]).toBe(0);
    expect(data[2 * 4 + 3]).toBe(0);
    // Die-cut ring pixel (1,1) stays opaque
    expect(data[(1 * width + 1) * 4 + 3]).toBe(255);
    // Enclosed dark ink center pixel (2,2) stays opaque
    expect(data[(2 * width + 2) * 4 + 3]).toBe(255);
  });

  it('safely returns null when 2D canvas context is unavailable (JSDOM fallback)', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(getStandeeTexture('goblin', 'sengoku')).toBeNull();
    expect(getStandeeTexture('manticore', 'vesperfall')).toBeNull();
  });

  it('generates and caches a CanvasTexture when a 2D context is provided', () => {
    const noop = () => {};
    const mockGradient = { addColorStop: noop };
    const mockCtx = {
      clearRect: noop,
      beginPath: noop,
      moveTo: noop,
      lineTo: noop,
      arc: noop,
      quadraticCurveTo: noop,
      bezierCurveTo: noop,
      ellipse: noop,
      roundRect: noop,
      rect: noop,
      fillRect: noop,
      strokeRect: noop,
      closePath: noop,
      fill: noop,
      stroke: noop,
      clip: noop,
      save: noop,
      restore: noop,
      translate: noop,
      scale: noop,
      filter: 'none',
      createLinearGradient: () => mockGradient,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineJoin: 'round',
      lineCap: 'round',
      globalAlpha: 1,
    } as unknown as CanvasRenderingContext2D;

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);

    for (const kind of STANDEE_KINDS) {
      const texA = getStandeeTexture(kind, 'sengoku');
      const texB = getStandeeTexture(kind, 'sengoku');
      expect(texA).not.toBeNull();
      expect(texB).toBe(texA);
    }

    const dormantTex = getStandeeTexture('manticore', 'sengoku', 'dormant');
    const normalTex = getStandeeTexture('manticore', 'sengoku', 'normal');
    expect(dormantTex).not.toBeNull();
    expect(dormantTex).not.toBe(normalTex);
  });
});
