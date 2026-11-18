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

  it('exposes all 11 tabletop standee kinds mapped to Google Flow assets', () => {
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
      'party',
    ]);

    for (const kind of STANDEE_KINDS) {
      expect(STANDEE_ASSET_URLS[kind]).toMatch(/^\/assets\/(standees|props)\/.*\.jpg$/);
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

  it('preserves dark steel pixels (rgb 58, 60, 64) at the image perimeter under threshold 48', () => {
    const width = 3;
    const height = 3;
    const data = new Uint8ClampedArray(width * height * 4);

    // Fill with dark steel RGB(58, 60, 64)
    for (let i = 0; i < width * height; i++) {
      data[i * 4] = 58;
      data[i * 4 + 1] = 60;
      data[i * 4 + 2] = 64;
      data[i * 4 + 3] = 255;
    }

    // Set top-left corner to charcoal studio backdrop RGB(24, 24, 26)
    data[0] = 24;
    data[1] = 24;
    data[2] = 26;

    removeDarkStudioBackdrop({ data, width, height }, 48);

    // Backdrop pixel is removed; dark steel perimeter pixels remain intact
    expect(data[3]).toBe(0);
    expect(data[1 * 4 + 3]).toBeGreaterThan(0);
    expect(data[(width + 1) * 4 + 3]).toBe(255);
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
  });
});
