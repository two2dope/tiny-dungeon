import { describe, it, expect } from 'vitest';
import { getMapBiome, normalizeMapId } from '../../src/components/canvas/mapBiomes';

describe('mapBiomes', () => {
  it('clamps and normalizes canonical map IDs cleanly to 1..7', () => {
    expect(normalizeMapId(undefined)).toBe(1);
    expect(normalizeMapId(0)).toBe(1);
    expect(normalizeMapId(-4)).toBe(1);
    expect(normalizeMapId(4)).toBe(4);
    expect(normalizeMapId(7)).toBe(7);
    expect(normalizeMapId(99)).toBe(7);
    expect(normalizeMapId(Number.NaN)).toBe(1);
  });

  it('gives each of the 7 Sengoku maps a distinct motif, sky clear color, and board floor style', () => {
    const biomes = [1, 2, 3, 4, 5, 6, 7].map((id) => getMapBiome('sengoku', id));

    const motifs = new Set(biomes.map((b) => b.motif));
    const clearColors = new Set(biomes.map((b) => b.clearColor));
    const floorBases = new Set(biomes.map((b) => b.floorBase));
    const gateColors = new Set(biomes.map((b) => b.gateColor));

    expect(motifs.size).toBe(7);
    expect(clearColors.size).toBe(7);
    expect(floorBases.size).toBe(7);
    expect(gateColors.size).toBe(7);
  });

  it('preserves a stable Vesperfall visual configuration regardless of mapId', () => {
    const v1 = getMapBiome('vesperfall', 1);
    const v7 = getMapBiome('vesperfall', 7);
    expect(v1.motif).toBe('vesperfall');
    expect(v7).toEqual(v1);
  });
});
