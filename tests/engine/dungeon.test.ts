import { describe, it, expect } from 'vitest';
import {
  formatCoordLabel,
  getCanonicalMap,
  getCanonicalMap1,
  getMapDimensions,
  getValidMoves,
  getShortestPath,
  executeMove,
} from '../../src/engine/dungeon';

describe('Dungeon Navigation', () => {
  it('should load canonical Map 1 with 16 rooms and designated start position', () => {
    const map = getCanonicalMap1();
    expect(map.startCoord).toEqual({ x: 0, y: 0 });
    expect(map.rooms).toBeDefined();
    expect(Object.keys(map.rooms)).toHaveLength(16);
  });

  it('should load larger canonical maps (5x5, 6x5, 6x6) and allow BFS navigation beyond coordinate 3', () => {
    const map5 = getCanonicalMap(5);
    expect(getMapDimensions(map5)).toEqual({ cols: 5, rows: 5 });
    expect(Object.keys(map5.rooms)).toHaveLength(25);

    const map6 = getCanonicalMap(6);
    expect(getMapDimensions(map6)).toEqual({ cols: 6, rows: 5 });
    expect(Object.keys(map6.rooms)).toHaveLength(30);
    expect(formatCoordLabel({ x: 5, y: 4 })).toBe('E6');

    const map7 = getCanonicalMap(7);
    expect(getMapDimensions(map7)).toEqual({ cols: 6, rows: 6 });
    expect(Object.keys(map7.rooms)).toHaveLength(36);
    expect(formatCoordLabel({ x: 5, y: 5 })).toBe('F6');

    // Moves beyond column 3 / row 3
    const validFromEdge = getValidMoves(map6, { x: 4, y: 4 }, 2);
    expect(validFromEdge.some((c) => c.x === 5 && c.y === 4)).toBe(true);
    expect(getShortestPath(map7, { x: 3, y: 5 }, { x: 5, y: 5 }, 2)).toEqual([
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
    ]);

    // Verify all rooms in expanded maps are reachable from start (0,0)
    for (const expanded of [map5, map6, map7]) {
      const { cols, rows } = getMapDimensions(expanded);
      const reachable = getValidMoves(expanded, expanded.startCoord, cols * rows);
      expect(reachable).toHaveLength(cols * rows - 1);
    }
  });

  it('should calculate valid moves within 2 steps without crossing solid walls', () => {
    const map = getCanonicalMap1();
    const validMoves = getValidMoves(map, { x: 0, y: 0 }, 2);
    expect(validMoves.length).toBeGreaterThan(0);
    // Asserts no direct wall-blocked move is permitted
    validMoves.forEach(coord => {
      expect(map.walls.some(w => w.blocks(map.startCoord, coord))).toBe(false);
    });
  });

  it('should mark visited rooms and reveal contents upon entry', () => {
    const map = getCanonicalMap1();
    const target = getValidMoves(map, map.startCoord, 1)[0];
    const { updatedMap, events } = executeMove(map, target);
    expect(updatedMap.visitedCoords).toContainEqual(target);
    expect(events).toBeDefined();
  });

  it('should compute shortest BFS path respecting wall obstacles', () => {
    const map = getCanonicalMap1();
    expect(getShortestPath(map, { x: 0, y: 0 }, { x: 2, y: 0 }, 2)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    // Wall blocks direct vertical move (0,0) -> (0,1) in 1 step
    expect(getShortestPath(map, { x: 0, y: 0 }, { x: 0, y: 1 }, 1)).toEqual([]);
  });
});
