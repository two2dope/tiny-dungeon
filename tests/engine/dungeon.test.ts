import { describe, it, expect } from 'vitest';
import {
  formatCoordLabel,
  getCanonicalMap,
  getCanonicalMap1,
  getMapDimensions,
  getValidMoves,
  getShortestPath,
  executeMove,
  rehydrateWalls,
} from '../../src/engine/dungeon';

describe('Dungeon Navigation', () => {
  it('should load canonical Map 1 with 16 rooms and designated start position', () => {
    const map = getCanonicalMap1();
    expect(map.startCoord).toEqual({ x: 0, y: 0 });
    expect(map.rooms).toBeDefined();
    expect(Object.keys(map.rooms)).toHaveLength(16);
    expect(map.portals).toHaveLength(1);
  });

  it('should keep locked vaults blocked without barriers and reach every room across all 7 maps with barriers', () => {
    for (let mapId = 1; mapId <= 7; mapId++) {
      const m = getCanonicalMap(mapId);
      const { cols, rows } = getMapDimensions(m);
      const lockedCount = Object.values(m.rooms).filter((r) => r.locked).length;
      expect(lockedCount).toBe(1);

      const reachableNoBarriers = getValidMoves(m, m.startCoord, cols * rows, {
        canCrossBarriers: false,
      });
      expect(reachableNoBarriers).toHaveLength(cols * rows - 1 - lockedCount);

      const reachableWithKaginawa = getValidMoves(m, m.startCoord, cols * rows, {
        canCrossBarriers: true,
      });
      expect(reachableWithKaginawa).toHaveLength(cols * rows - 1);
    }

    const map6 = getCanonicalMap(6);
    expect(getMapDimensions(map6)).toEqual({ cols: 6, rows: 5 });
    expect(formatCoordLabel({ x: 5, y: 4 })).toBe('E6');

    const map7 = getCanonicalMap(7);
    expect(getMapDimensions(map7)).toEqual({ cols: 6, rows: 6 });
    expect(formatCoordLabel({ x: 5, y: 5 })).toBe('F6');
    expect(getShortestPath(map7, { x: 3, y: 5 }, { x: 5, y: 5 }, 2)).toEqual([
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
    ]);
  });

  it('supports side edge portals connecting opposite sides in 1 step', () => {
    const map = getCanonicalMap1();
    // Portal links (0,2) <-> (3,2) in 1 step
    const fromWest = getValidMoves(map, { x: 0, y: 2 }, 1);
    expect(fromWest).toContainEqual({ x: 3, y: 2 });
    expect(getShortestPath(map, { x: 0, y: 2 }, { x: 3, y: 2 }, 1)).toEqual([
      { x: 0, y: 2 },
      { x: 3, y: 2 },
    ]);
  });

  it('should calculate valid moves within 2 steps without crossing solid walls and preserve sealed walls on rehydrate', () => {
    const map = getCanonicalMap1();
    const validMoves = getValidMoves(map, { x: 0, y: 0 }, 2);
    expect(validMoves.length).toBeGreaterThan(0);
    validMoves.forEach((coord) => {
      expect(map.walls.some((w) => w.blocks(map.startCoord, coord))).toBe(false);
    });

    const cloned = JSON.parse(JSON.stringify(map.walls));
    const rehydrated = rehydrateWalls(cloned);
    expect(rehydrated.filter((w) => w.sealed).length).toBeGreaterThanOrEqual(2);
  });

  it('should resolve multi-content rooms with multiple ordered events upon entry', () => {
    const map = getCanonicalMap1();
    // Room (1,1) on Map 1 has skeleton + gem(1)
    const { updatedMap, events } = executeMove(map, { x: 1, y: 1 });
    expect(updatedMap.visitedCoords).toContainEqual({ x: 1, y: 1 });
    expect(events.map((e) => e.type)).toEqual(['minion', 'gem']);
  });

  it('should compute shortest BFS path respecting wall obstacles', () => {
    const map = getCanonicalMap1();
    expect(getShortestPath(map, { x: 0, y: 0 }, { x: 2, y: 0 }, 2)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(getShortestPath(map, { x: 0, y: 0 }, { x: 0, y: 1 }, 1)).toEqual([]);
  });
});
