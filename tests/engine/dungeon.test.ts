import { describe, it, expect } from 'vitest';
import { getCanonicalMap1, getValidMoves, executeMove } from '../../src/engine/dungeon';

describe('Dungeon Navigation', () => {
  it('should load canonical Map 1 with 16 rooms and designated start position', () => {
    const map = getCanonicalMap1();
    expect(map.startCoord).toEqual({ x: 0, y: 0 });
    expect(map.rooms).toBeDefined();
    expect(Object.keys(map.rooms)).toHaveLength(16);
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
});
