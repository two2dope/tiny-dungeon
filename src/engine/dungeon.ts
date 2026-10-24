import { DungeonCoord, DungeonMap, RoomState, Wall, Minion, Villain } from './types';

export interface DungeonEvent {
  type: 'visit' | 'minion' | 'trap' | 'gem' | 'item' | 'boss';
  description: string;
  payload?: any;
}

export function coordKey(coord: DungeonCoord): string {
  return `${coord.x},${coord.y}`;
}

export function coordEq(a: DungeonCoord, b: DungeonCoord): boolean {
  return a.x === b.x && a.y === b.y;
}

export function createWall(x1: number, y1: number, x2: number, y2: number): Wall {
  const p1: DungeonCoord = { x: x1, y: y1 };
  const p2: DungeonCoord = { x: x2, y: y2 };
  return {
    from: p1,
    to: p2,
    blocks: (a: DungeonCoord, b: DungeonCoord) =>
      (coordEq(a, p1) && coordEq(b, p2)) || (coordEq(a, p2) && coordEq(b, p1)),
  };
}

export function getCanonicalMap1(): DungeonMap {
  const rooms: Record<string, RoomState> = {};

  // Standard minions
  const goblin: Minion = { id: 'm_goblin', name: 'Goblin Scout', reqLevel: 1, glory: 2, damage: 1 };
  const skeleton: Minion = { id: 'm_skeleton', name: 'Skeleton Warrior', reqLevel: 2, glory: 3, damage: 2 };
  const orc: Minion = { id: 'm_orc', name: 'Orc Berserker', reqLevel: 3, glory: 4, damage: 2 };
  const troll: Minion = { id: 'm_troll', name: 'Cave Troll', reqLevel: 4, glory: 5, damage: 3 };

  // 3 Canonical Bosses
  const manticore: Villain = {
    id: 'v_manticore',
    name: 'Manticore',
    round: 3,
    tier1Power: 6,
    tier1Glory: 8,
    tier2Power: 4,
    tier2Glory: 4,
    defeatDamage: 2,
  };

  const beholder: Villain = {
    id: 'v_beholder',
    name: 'Eye Tyrant',
    round: 6,
    tier1Power: 10,
    tier1Glory: 12,
    tier2Power: 7,
    tier2Glory: 6,
    defeatDamage: 3,
  };

  const dragon: Villain = {
    id: 'v_dragon',
    name: 'Ancient Red Dragon',
    round: 8,
    tier1Power: 14,
    tier1Glory: 16,
    tier2Power: 10,
    tier2Glory: 8,
    defeatDamage: 4,
  };

  // Populate 4x4 matrix
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      const coord: DungeonCoord = { x, y };
      rooms[coordKey(coord)] = {
        coord,
        type: 'empty',
        revealed: false,
        cleared: false,
      };
    }
  }

  // Assign canonical rooms
  rooms[coordKey({ x: 0, y: 0 })] = {
    coord: { x: 0, y: 0 },
    type: 'start',
    revealed: true,
    cleared: true,
  };

  rooms[coordKey({ x: 1, y: 0 })] = {
    coord: { x: 1, y: 0 },
    type: 'minion',
    minion: goblin,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 2, y: 0 })] = {
    coord: { x: 2, y: 0 },
    type: 'gem',
    gemsCount: 2,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 3, y: 0 })] = {
    coord: { x: 3, y: 0 },
    type: 'item',
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 0, y: 1 })] = {
    coord: { x: 0, y: 1 },
    type: 'trap',
    trapDamage: 1,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 1, y: 1 })] = {
    coord: { x: 1, y: 1 },
    type: 'minion',
    minion: skeleton,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 2, y: 1 })] = {
    coord: { x: 2, y: 1 },
    type: 'empty',
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 3, y: 1 })] = {
    coord: { x: 3, y: 1 },
    type: 'boss',
    villain: manticore,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 0, y: 2 })] = {
    coord: { x: 0, y: 2 },
    type: 'gem',
    gemsCount: 1,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 1, y: 2 })] = {
    coord: { x: 1, y: 2 },
    type: 'boss',
    villain: beholder,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 2, y: 2 })] = {
    coord: { x: 2, y: 2 },
    type: 'minion',
    minion: orc,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 3, y: 2 })] = {
    coord: { x: 3, y: 2 },
    type: 'trap',
    trapDamage: 2,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 0, y: 3 })] = {
    coord: { x: 0, y: 3 },
    type: 'minion',
    minion: troll,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 1, y: 3 })] = {
    coord: { x: 1, y: 3 },
    type: 'gem',
    gemsCount: 2,
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 2, y: 3 })] = {
    coord: { x: 2, y: 3 },
    type: 'empty',
    revealed: false,
    cleared: false,
  };

  rooms[coordKey({ x: 3, y: 3 })] = {
    coord: { x: 3, y: 3 },
    type: 'boss',
    villain: dragon,
    revealed: false,
    cleared: false,
  };

  // Canonical walls for Map 1
  const walls: Wall[] = [
    createWall(0, 0, 0, 1),
    createWall(1, 1, 2, 1),
    createWall(2, 2, 3, 2),
    createWall(1, 2, 1, 3),
  ];

  return {
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

export function getValidMoves(map: DungeonMap, from: DungeonCoord, maxSteps: number = 2): DungeonCoord[] {
  const validMoves: DungeonCoord[] = [];
  const visited = new Map<string, number>();

  interface SearchNode {
    coord: DungeonCoord;
    steps: number;
  }

  const queue: SearchNode[] = [{ coord: from, steps: 0 }];
  visited.set(coordKey(from), 0);

  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (queue.length > 0) {
    const { coord, steps } = queue.shift()!;

    if (steps >= maxSteps) continue;

    for (const dir of directions) {
      const nextCoord: DungeonCoord = { x: coord.x + dir.dx, y: coord.y + dir.dy };

      // Boundary check
      if (nextCoord.x < 0 || nextCoord.x > 3 || nextCoord.y < 0 || nextCoord.y > 3) {
        continue;
      }

      // Wall check: direct obstruction between coord and nextCoord
      const isBlocked = map.walls.some(w => w.blocks(coord, nextCoord));
      if (isBlocked) {
        continue;
      }

      const nextKey = coordKey(nextCoord);
      const nextSteps = steps + 1;

      if (!visited.has(nextKey) || visited.get(nextKey)! > nextSteps) {
        visited.set(nextKey, nextSteps);
        queue.push({ coord: nextCoord, steps: nextSteps });

        if (!coordEq(nextCoord, from) && !validMoves.some(c => coordEq(c, nextCoord))) {
          validMoves.push(nextCoord);
        }
      }
    }
  }

  return validMoves;
}

export function executeMove(
  map: DungeonMap,
  target: DungeonCoord
): { updatedMap: DungeonMap; events: DungeonEvent[] } {
  const events: DungeonEvent[] = [];
  const key = coordKey(target);
  const room = map.rooms[key];

  const updatedRooms = { ...map.rooms };
  const updatedVisited = [...map.visitedCoords];

  if (!updatedVisited.some(c => coordEq(c, target))) {
    updatedVisited.push(target);
  }

  if (room) {
    const updatedRoom: RoomState = {
      ...room,
      revealed: true,
    };

    if (!room.cleared) {
      if (room.type === 'minion' && room.minion) {
        events.push({
          type: 'minion',
          description: `Encountered ${room.minion.name}!`,
          payload: room.minion,
        });
      } else if (room.type === 'trap' && room.trapDamage) {
        events.push({
          type: 'trap',
          description: `Spring-loaded trap sprung! Took ${room.trapDamage} damage!`,
          payload: room.trapDamage,
        });
      } else if (room.type === 'gem' && room.gemsCount) {
        events.push({
          type: 'gem',
          description: `Discovered a gem cache (+${room.gemsCount} gems)!`,
          payload: room.gemsCount,
        });
      } else if (room.type === 'item') {
        events.push({
          type: 'item',
          description: 'Discovered a mysterious magic item!',
        });
      } else if (room.type === 'boss' && room.villain) {
        events.push({
          type: 'boss',
          description: `Gated entrance to Boss lair: ${room.villain.name}!`,
          payload: room.villain,
        });
      } else {
        events.push({
          type: 'visit',
          description: `Entered chamber at (${target.x}, ${target.y}).`,
        });
      }

      updatedRoom.cleared = true;
    }

    updatedRooms[key] = updatedRoom;
  }

  const updatedMap: DungeonMap = {
    ...map,
    currentCoord: target,
    rooms: updatedRooms,
    visitedCoords: updatedVisited,
  };

  return { updatedMap, events };
}
