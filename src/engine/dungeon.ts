import { DungeonCoord, DungeonMap, RoomState, Wall, Minion, Villain } from './types';

export interface DungeonEvent {
  type: 'visit' | 'minion' | 'trap' | 'gem' | 'item' | 'boss';
  description: string;
  payload?: any;
}

export interface CanonicalMapMeta {
  id: number;
  name: string;
  subtitle: string;
  cols: number;
  rows: number;
  sizeLabel: string;
}

export const CANONICAL_MAPS: CanonicalMapMeta[] = [
  { id: 1, name: 'Cripta da Mantícora', subtitle: 'Mapa Canônico 1', cols: 4, rows: 4, sizeLabel: '4×4' },
  { id: 2, name: 'Pátio de Sengoku', subtitle: 'Fortaleza Outonal', cols: 4, rows: 4, sizeLabel: '4×4' },
  { id: 3, name: 'Forja de Obsidiana', subtitle: 'Câmaras Vulcânicas', cols: 4, rows: 4, sizeLabel: '4×4' },
  { id: 4, name: 'Santuário Abissal', subtitle: 'Ruínas Submersas', cols: 4, rows: 4, sizeLabel: '4×4' },
  { id: 5, name: 'Castelo de Nijō', subtitle: 'Fortaleza Expandida', cols: 5, rows: 5, sizeLabel: '5×5' },
  { id: 6, name: 'Labirinto Clássico', subtitle: 'Formato Paper Dungeons', cols: 6, rows: 5, sizeLabel: '6×5' },
  { id: 7, name: 'Cidadela Imperial', subtitle: 'Campanha Épica', cols: 6, rows: 6, sizeLabel: '6×6' },
];

export function getMapDimensions(map: DungeonMap): { cols: number; rows: number } {
  return {
    cols: map.cols ?? 4,
    rows: map.rows ?? 4,
  };
}

export function formatCoordLabel(coord: DungeonCoord): string {
  const row = String.fromCharCode(65 + Math.max(0, Math.min(7, coord.y)));
  return `${row}${coord.x + 1}`;
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

export function isWallBlocking(wall: Wall, a: DungeonCoord, b: DungeonCoord): boolean {
  if (typeof wall.blocks === 'function') {
    return wall.blocks(a, b);
  }
  return (
    (coordEq(a, wall.from) && coordEq(b, wall.to)) ||
    (coordEq(a, wall.to) && coordEq(b, wall.from))
  );
}

export function rehydrateWalls(walls: Wall[]): Wall[] {
  return walls.map((w) => createWall(w.from.x, w.from.y, w.to.x, w.to.y));
}

function buildEmptyGrid(cols = 4, rows = 4): Record<string, RoomState> {
  const rooms: Record<string, RoomState> = {};
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const coord: DungeonCoord = { x, y };
      rooms[coordKey(coord)] = {
        coord,
        type: 'empty',
        revealed: false,
        cleared: false,
      };
    }
  }
  return rooms;
}

type RoomEntrySpec = Omit<RoomState, 'coord' | 'revealed' | 'cleared'> & {
  revealed?: boolean;
  cleared?: boolean;
};

function populateRooms(
  cols: number,
  rows: number,
  entries: Record<string, RoomEntrySpec>
): Record<string, RoomState> {
  const rooms = buildEmptyGrid(cols, rows);
  for (const [key, spec] of Object.entries(entries)) {
    const [xs, ys] = key.split(',').map(Number);
    rooms[key] = {
      coord: { x: xs, y: ys },
      revealed: spec.revealed ?? false,
      cleared: spec.cleared ?? false,
      type: spec.type,
      minion: spec.minion,
      villain: spec.villain,
      trapDamage: spec.trapDamage,
      gemsCount: spec.gemsCount,
    };
  }
  return rooms;
}

export function getCanonicalMap1(): DungeonMap {
  const rooms = buildEmptyGrid();

  const goblin: Minion = { id: 'm_goblin', name: 'Goblin Batedor', reqLevel: 1, glory: 2, damage: 1, classAffinity: 'rogue' };
  const skeleton: Minion = { id: 'm_skeleton', name: 'Esqueleto Guerreiro', reqLevel: 2, glory: 3, damage: 2, classAffinity: 'cleric' };
  const orc: Minion = { id: 'm_orc', name: 'Orc Berserker', reqLevel: 3, glory: 4, damage: 2, classAffinity: 'warrior' };
  const troll: Minion = { id: 'm_troll', name: 'Troll das Cavernas', reqLevel: 4, glory: 5, damage: 3, classAffinity: 'mage' };

  const manticore: Villain = { id: 'v_manticore', name: 'Mantícora', round: 3, tier1Power: 6, tier1Glory: 8, tier2Power: 4, tier2Glory: 4, defeatDamage: 2 };
  const beholder: Villain = { id: 'v_beholder', name: 'Tirano Ocular', round: 6, tier1Power: 10, tier1Glory: 12, tier2Power: 7, tier2Glory: 6, defeatDamage: 3 };
  const dragon: Villain = { id: 'v_dragon', name: 'Dragão Vermelho Ancião', round: 8, tier1Power: 14, tier1Glory: 16, tier2Power: 10, tier2Glory: 8, defeatDamage: 4 };

  rooms['0,0'] = { coord: { x: 0, y: 0 }, type: 'start', revealed: true, cleared: true };
  rooms['1,0'] = { coord: { x: 1, y: 0 }, type: 'minion', minion: goblin, revealed: false, cleared: false };
  rooms['2,0'] = { coord: { x: 2, y: 0 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };
  rooms['3,0'] = { coord: { x: 3, y: 0 }, type: 'item', revealed: false, cleared: false };

  rooms['0,1'] = { coord: { x: 0, y: 1 }, type: 'trap', trapDamage: 1, revealed: false, cleared: false };
  rooms['1,1'] = { coord: { x: 1, y: 1 }, type: 'minion', minion: skeleton, revealed: false, cleared: false };
  rooms['2,1'] = { coord: { x: 2, y: 1 }, type: 'empty', revealed: false, cleared: false };
  rooms['3,1'] = { coord: { x: 3, y: 1 }, type: 'boss', villain: manticore, revealed: false, cleared: false };

  rooms['0,2'] = { coord: { x: 0, y: 2 }, type: 'gem', gemsCount: 1, revealed: false, cleared: false };
  rooms['1,2'] = { coord: { x: 1, y: 2 }, type: 'boss', villain: beholder, revealed: false, cleared: false };
  rooms['2,2'] = { coord: { x: 2, y: 2 }, type: 'minion', minion: orc, revealed: false, cleared: false };
  rooms['3,2'] = { coord: { x: 3, y: 2 }, type: 'trap', trapDamage: 2, revealed: false, cleared: false };

  rooms['0,3'] = { coord: { x: 0, y: 3 }, type: 'minion', minion: troll, revealed: false, cleared: false };
  rooms['1,3'] = { coord: { x: 1, y: 3 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };
  rooms['2,3'] = { coord: { x: 2, y: 3 }, type: 'empty', revealed: false, cleared: false };
  rooms['3,3'] = { coord: { x: 3, y: 3 }, type: 'boss', villain: dragon, revealed: false, cleared: false };

  const walls: Wall[] = [
    createWall(0, 0, 0, 1),
    createWall(1, 1, 2, 1),
    createWall(2, 2, 3, 2),
    createWall(1, 2, 1, 3),
  ];

  return {
    mapId: 1,
    mapName: 'Cripta da Mantícora',
    cols: 4,
    rows: 4,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

function getCanonicalMap2(): DungeonMap {
  const rooms = buildEmptyGrid();
  const ashigaru: Minion = { id: 'm_goblin', name: 'Ashigaru Sombrio', reqLevel: 1, glory: 2, damage: 1, classAffinity: 'warrior' };
  const ronin: Minion = { id: 'm_skeleton', name: 'Ronin Renegado', reqLevel: 2, glory: 3, damage: 2, classAffinity: 'rogue' };
  const oni: Minion = { id: 'm_orc', name: 'Oni da Lanterna', reqLevel: 3, glory: 4, damage: 2, classAffinity: 'cleric' };
  const tengu: Minion = { id: 'm_troll', name: 'Tengu da Tempestade', reqLevel: 4, glory: 5, damage: 3, classAffinity: 'mage' };

  const nue: Villain = { id: 'v_manticore', name: 'Nue do Pátio', round: 3, tier1Power: 6, tier1Glory: 8, tier2Power: 4, tier2Glory: 4, defeatDamage: 2 };
  const shogun: Villain = { id: 'v_beholder', name: 'Xogum Espectral', round: 6, tier1Power: 10, tier1Glory: 12, tier2Power: 7, tier2Glory: 6, defeatDamage: 3 };
  const orochi: Villain = { id: 'v_dragon', name: 'Dragão de Nanquim', round: 8, tier1Power: 14, tier1Glory: 16, tier2Power: 10, tier2Glory: 8, defeatDamage: 4 };

  rooms['0,0'] = { coord: { x: 0, y: 0 }, type: 'start', revealed: true, cleared: true };
  rooms['1,0'] = { coord: { x: 1, y: 0 }, type: 'gem', gemsCount: 1, revealed: false, cleared: false };
  rooms['2,0'] = { coord: { x: 2, y: 0 }, type: 'minion', minion: ronin, revealed: false, cleared: false };
  rooms['3,0'] = { coord: { x: 3, y: 0 }, type: 'boss', villain: nue, revealed: false, cleared: false };

  rooms['0,1'] = { coord: { x: 0, y: 1 }, type: 'minion', minion: ashigaru, revealed: false, cleared: false };
  rooms['1,1'] = { coord: { x: 1, y: 1 }, type: 'trap', trapDamage: 1, revealed: false, cleared: false };
  rooms['2,1'] = { coord: { x: 2, y: 1 }, type: 'item', revealed: false, cleared: false };
  rooms['3,1'] = { coord: { x: 3, y: 1 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };

  rooms['0,2'] = { coord: { x: 0, y: 2 }, type: 'item', revealed: false, cleared: false };
  rooms['1,2'] = { coord: { x: 1, y: 2 }, type: 'minion', minion: oni, revealed: false, cleared: false };
  rooms['2,2'] = { coord: { x: 2, y: 2 }, type: 'boss', villain: shogun, revealed: false, cleared: false };
  rooms['3,2'] = { coord: { x: 3, y: 2 }, type: 'trap', trapDamage: 2, revealed: false, cleared: false };

  rooms['0,3'] = { coord: { x: 0, y: 3 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };
  rooms['1,3'] = { coord: { x: 1, y: 3 }, type: 'trap', trapDamage: 1, revealed: false, cleared: false };
  rooms['2,3'] = { coord: { x: 2, y: 3 }, type: 'minion', minion: tengu, revealed: false, cleared: false };
  rooms['3,3'] = { coord: { x: 3, y: 3 }, type: 'boss', villain: orochi, revealed: false, cleared: false };

  const walls: Wall[] = [
    createWall(1, 0, 1, 1),
    createWall(2, 1, 3, 1),
    createWall(0, 2, 1, 2),
    createWall(2, 2, 2, 3),
  ];

  return {
    mapId: 2,
    mapName: 'Pátio de Sengoku',
    cols: 4,
    rows: 4,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

function getCanonicalMap3(): DungeonMap {
  const rooms = buildEmptyGrid();
  const imp: Minion = { id: 'm_goblin', name: 'Diabrete de Fuligem', reqLevel: 1, glory: 2, damage: 1, classAffinity: 'mage' };
  const hound: Minion = { id: 'm_skeleton', name: 'Cão de Ferro', reqLevel: 2, glory: 3, damage: 2, classAffinity: 'warrior' };
  const golem: Minion = { id: 'm_orc', name: 'Golem de Brasa', reqLevel: 3, glory: 4, damage: 2, classAffinity: 'cleric' };
  const drake: Minion = { id: 'm_troll', name: 'Draconato da Forja', reqLevel: 4, glory: 5, damage: 3, classAffinity: 'rogue' };

  const salamander: Villain = { id: 'v_manticore', name: 'Salamandra Real', round: 3, tier1Power: 6, tier1Glory: 8, tier2Power: 4, tier2Glory: 4, defeatDamage: 2 };
  const colossus: Villain = { id: 'v_beholder', name: 'Colosso de Magma', round: 6, tier1Power: 10, tier1Glory: 12, tier2Power: 7, tier2Glory: 6, defeatDamage: 3 };
  const titan: Villain = { id: 'v_dragon', name: 'Titã de Cinzas', round: 8, tier1Power: 14, tier1Glory: 16, tier2Power: 10, tier2Glory: 8, defeatDamage: 4 };

  rooms['0,0'] = { coord: { x: 0, y: 0 }, type: 'start', revealed: true, cleared: true };
  rooms['1,0'] = { coord: { x: 1, y: 0 }, type: 'minion', minion: imp, revealed: false, cleared: false };
  rooms['2,0'] = { coord: { x: 2, y: 0 }, type: 'trap', trapDamage: 1, revealed: false, cleared: false };
  rooms['3,0'] = { coord: { x: 3, y: 0 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };

  rooms['0,1'] = { coord: { x: 0, y: 1 }, type: 'gem', gemsCount: 1, revealed: false, cleared: false };
  rooms['1,1'] = { coord: { x: 1, y: 1 }, type: 'item', revealed: false, cleared: false };
  rooms['2,1'] = { coord: { x: 2, y: 1 }, type: 'minion', minion: hound, revealed: false, cleared: false };
  rooms['3,1'] = { coord: { x: 3, y: 1 }, type: 'boss', villain: salamander, revealed: false, cleared: false };

  rooms['0,2'] = { coord: { x: 0, y: 2 }, type: 'minion', minion: golem, revealed: false, cleared: false };
  rooms['1,2'] = { coord: { x: 1, y: 2 }, type: 'trap', trapDamage: 2, revealed: false, cleared: false };
  rooms['2,2'] = { coord: { x: 2, y: 2 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };
  rooms['3,2'] = { coord: { x: 3, y: 2 }, type: 'item', revealed: false, cleared: false };

  rooms['0,3'] = { coord: { x: 0, y: 3 }, type: 'boss', villain: colossus, revealed: false, cleared: false };
  rooms['1,3'] = { coord: { x: 1, y: 3 }, type: 'minion', minion: drake, revealed: false, cleared: false };
  rooms['2,3'] = { coord: { x: 2, y: 3 }, type: 'empty', revealed: false, cleared: false };
  rooms['3,3'] = { coord: { x: 3, y: 3 }, type: 'boss', villain: titan, revealed: false, cleared: false };

  const walls: Wall[] = [
    createWall(2, 0, 2, 1),
    createWall(0, 1, 1, 1),
    createWall(1, 2, 2, 2),
    createWall(3, 1, 3, 2),
  ];

  return {
    mapId: 3,
    mapName: 'Forja de Obsidiana',
    cols: 4,
    rows: 4,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

function getCanonicalMap4(): DungeonMap {
  const rooms = buildEmptyGrid();
  const stalker: Minion = { id: 'm_goblin', name: 'Saqueador Abissal', reqLevel: 1, glory: 2, damage: 1, classAffinity: 'rogue' };
  const priest: Minion = { id: 'm_skeleton', name: 'Sacerdote Sombrio', reqLevel: 2, glory: 3, damage: 2, classAffinity: 'cleric' };
  const guardian: Minion = { id: 'm_orc', name: 'Guardião Rúnico', reqLevel: 3, glory: 4, damage: 2, classAffinity: 'warrior' };
  const leviathan: Minion = { id: 'm_troll', name: 'Cria do Leviatã', reqLevel: 4, glory: 5, damage: 3, classAffinity: 'mage' };

  const siren: Villain = { id: 'v_manticore', name: 'Sereia de Obsidiana', round: 3, tier1Power: 6, tier1Glory: 8, tier2Power: 4, tier2Glory: 4, defeatDamage: 2 };
  const warden: Villain = { id: 'v_beholder', name: 'Carcereiro Abissal', round: 6, tier1Power: 10, tier1Glory: 12, tier2Power: 7, tier2Glory: 6, defeatDamage: 3 };
  const hydra: Villain = { id: 'v_dragon', name: 'Hidra Ancestral', round: 8, tier1Power: 14, tier1Glory: 16, tier2Power: 10, tier2Glory: 8, defeatDamage: 4 };

  rooms['0,0'] = { coord: { x: 0, y: 0 }, type: 'start', revealed: true, cleared: true };
  rooms['1,0'] = { coord: { x: 1, y: 0 }, type: 'trap', trapDamage: 1, revealed: false, cleared: false };
  rooms['2,0'] = { coord: { x: 2, y: 0 }, type: 'item', revealed: false, cleared: false };
  rooms['3,0'] = { coord: { x: 3, y: 0 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };

  rooms['0,1'] = { coord: { x: 0, y: 1 }, type: 'minion', minion: stalker, revealed: false, cleared: false };
  rooms['1,1'] = { coord: { x: 1, y: 1 }, type: 'gem', gemsCount: 2, revealed: false, cleared: false };
  rooms['2,1'] = { coord: { x: 2, y: 1 }, type: 'minion', minion: priest, revealed: false, cleared: false };
  rooms['3,1'] = { coord: { x: 3, y: 1 }, type: 'boss', villain: siren, revealed: false, cleared: false };

  rooms['0,2'] = { coord: { x: 0, y: 2 }, type: 'trap', trapDamage: 2, revealed: false, cleared: false };
  rooms['1,2'] = { coord: { x: 1, y: 2 }, type: 'boss', villain: warden, revealed: false, cleared: false };
  rooms['2,2'] = { coord: { x: 2, y: 2 }, type: 'item', revealed: false, cleared: false };
  rooms['3,2'] = { coord: { x: 3, y: 2 }, type: 'minion', minion: guardian, revealed: false, cleared: false };

  rooms['0,3'] = { coord: { x: 0, y: 3 }, type: 'gem', gemsCount: 1, revealed: false, cleared: false };
  rooms['1,3'] = { coord: { x: 1, y: 3 }, type: 'minion', minion: leviathan, revealed: false, cleared: false };
  rooms['2,3'] = { coord: { x: 2, y: 3 }, type: 'empty', revealed: false, cleared: false };
  rooms['3,3'] = { coord: { x: 3, y: 3 }, type: 'boss', villain: hydra, revealed: false, cleared: false };

  const walls: Wall[] = [
    createWall(1, 0, 2, 0),
    createWall(0, 1, 0, 2),
    createWall(2, 1, 2, 2),
    createWall(1, 3, 2, 3),
  ];

  return {
    mapId: 4,
    mapName: 'Santuário Abissal',
    cols: 4,
    rows: 4,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

function getCanonicalMap5(): DungeonMap {
  const cols = 5;
  const rows = 5;
  const ashigaru: Minion = { id: 'm_goblin', name: 'Ashigaru da Muralha', reqLevel: 1, glory: 2, damage: 1, classAffinity: 'rogue' };
  const yari: Minion = { id: 'm_skeleton', name: 'Lanceiro Yari', reqLevel: 2, glory: 3, damage: 2, classAffinity: 'cleric' };
  const samurai: Minion = { id: 'm_orc', name: 'Samurai Blindado', reqLevel: 3, glory: 4, damage: 2, classAffinity: 'warrior' };
  const oni: Minion = { id: 'm_troll', name: 'Oni Guardião', reqLevel: 4, glory: 5, damage: 3, classAffinity: 'mage' };

  const kitsune: Villain = { id: 'v_manticore', name: 'Kitsune Carmesim', round: 3, tier1Power: 6, tier1Glory: 8, tier2Power: 4, tier2Glory: 4, defeatDamage: 2 };
  const tenguGeneral: Villain = { id: 'v_beholder', name: 'General Tengu', round: 6, tier1Power: 10, tier1Glory: 12, tier2Power: 7, tier2Glory: 6, defeatDamage: 3 };
  const emperorDragon: Villain = { id: 'v_dragon', name: 'Imperador Dragão', round: 8, tier1Power: 14, tier1Glory: 16, tier2Power: 10, tier2Glory: 8, defeatDamage: 4 };

  const rooms = populateRooms(cols, rows, {
    '0,0': { type: 'start', revealed: true, cleared: true },
    '1,0': { type: 'minion', minion: ashigaru },
    '2,0': { type: 'gem', gemsCount: 1 },
    '3,0': { type: 'item' },
    '4,0': { type: 'minion', minion: yari },
    '0,1': { type: 'trap', trapDamage: 1 },
    '1,1': { type: 'gem', gemsCount: 2 },
    '2,1': { type: 'minion', minion: yari },
    '3,1': { type: 'trap', trapDamage: 1 },
    '4,1': { type: 'boss', villain: kitsune },
    '0,2': { type: 'minion', minion: ashigaru },
    '1,2': { type: 'item' },
    '2,2': { type: 'minion', minion: samurai },
    '3,2': { type: 'gem', gemsCount: 2 },
    '4,2': { type: 'trap', trapDamage: 2 },
    '0,3': { type: 'gem', gemsCount: 2 },
    '1,3': { type: 'trap', trapDamage: 2 },
    '2,3': { type: 'boss', villain: tenguGeneral },
    '3,3': { type: 'minion', minion: oni },
    '4,3': { type: 'item' },
    '0,4': { type: 'minion', minion: samurai },
    '1,4': { type: 'gem', gemsCount: 2 },
    '2,4': { type: 'minion', minion: oni },
    '3,4': { type: 'trap', trapDamage: 2 },
    '4,4': { type: 'boss', villain: emperorDragon },
  });

  const walls: Wall[] = [
    createWall(0, 0, 0, 1),
    createWall(2, 0, 2, 1),
    createWall(1, 2, 2, 2),
    createWall(3, 1, 3, 2),
    createWall(2, 3, 2, 4),
    createWall(3, 3, 4, 3),
  ];

  return {
    mapId: 5,
    mapName: 'Castelo de Nijō',
    cols,
    rows,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

function getCanonicalMap6(): DungeonMap {
  const cols = 6;
  const rows = 5;
  const goblin: Minion = { id: 'm_goblin', name: 'Goblin Ladino', reqLevel: 1, glory: 2, damage: 1, classAffinity: 'rogue' };
  const skeleton: Minion = { id: 'm_skeleton', name: 'Esqueleto Sentinela', reqLevel: 2, glory: 3, damage: 2, classAffinity: 'cleric' };
  const orc: Minion = { id: 'm_orc', name: 'Orc Saqueador', reqLevel: 3, glory: 4, damage: 2, classAffinity: 'warrior' };
  const troll: Minion = { id: 'm_troll', name: 'Troll de Pedra', reqLevel: 4, glory: 5, damage: 3, classAffinity: 'mage' };

  const manticore: Villain = { id: 'v_manticore', name: 'Mantícora da Galeria', round: 3, tier1Power: 6, tier1Glory: 8, tier2Power: 4, tier2Glory: 4, defeatDamage: 2 };
  const beholder: Villain = { id: 'v_beholder', name: 'Tirano Ocular', round: 6, tier1Power: 10, tier1Glory: 12, tier2Power: 7, tier2Glory: 6, defeatDamage: 3 };
  const dragon: Villain = { id: 'v_dragon', name: 'Dragão Vermelho Ancião', round: 8, tier1Power: 14, tier1Glory: 16, tier2Power: 10, tier2Glory: 8, defeatDamage: 4 };

  const rooms = populateRooms(cols, rows, {
    '0,0': { type: 'start', revealed: true, cleared: true },
    '1,0': { type: 'minion', minion: goblin },
    '2,0': { type: 'gem', gemsCount: 1 },
    '3,0': { type: 'trap', trapDamage: 1 },
    '4,0': { type: 'item' },
    '5,0': { type: 'gem', gemsCount: 2 },
    '0,1': { type: 'trap', trapDamage: 1 },
    '1,1': { type: 'item' },
    '2,1': { type: 'minion', minion: skeleton },
    '3,1': { type: 'gem', gemsCount: 2 },
    '4,1': { type: 'boss', villain: manticore },
    '5,1': { type: 'minion', minion: skeleton },
    '0,2': { type: 'minion', minion: goblin },
    '1,2': { type: 'gem', gemsCount: 2 },
    '2,2': { type: 'trap', trapDamage: 2 },
    '3,2': { type: 'minion', minion: orc },
    '4,2': { type: 'gem', gemsCount: 1 },
    '5,2': { type: 'item' },
    '0,3': { type: 'item' },
    '1,3': { type: 'minion', minion: skeleton },
    '2,3': { type: 'boss', villain: beholder },
    '3,3': { type: 'trap', trapDamage: 2 },
    '4,3': { type: 'minion', minion: troll },
    '5,3': { type: 'gem', gemsCount: 2 },
    '0,4': { type: 'gem', gemsCount: 2 },
    '1,4': { type: 'minion', minion: orc },
    '2,4': { type: 'trap', trapDamage: 2 },
    '3,4': { type: 'minion', minion: troll },
    '4,4': { type: 'item' },
    '5,4': { type: 'boss', villain: dragon },
  });

  const walls: Wall[] = [
    createWall(1, 0, 1, 1),
    createWall(3, 0, 3, 1),
    createWall(0, 2, 1, 2),
    createWall(2, 2, 3, 2),
    createWall(4, 1, 4, 2),
    createWall(1, 3, 2, 3),
    createWall(3, 3, 3, 4),
    createWall(4, 3, 5, 3),
  ];

  return {
    mapId: 6,
    mapName: 'Labirinto Clássico',
    cols,
    rows,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

function getCanonicalMap7(): DungeonMap {
  const cols = 6;
  const rows = 6;
  const scout: Minion = { id: 'm_goblin', name: 'Batedor da Cidadela', reqLevel: 1, glory: 2, damage: 1, classAffinity: 'rogue' };
  const sentinel: Minion = { id: 'm_skeleton', name: 'Sentinela Ósseo', reqLevel: 2, glory: 3, damage: 2, classAffinity: 'cleric' };
  const brute: Minion = { id: 'm_orc', name: 'Oni da Vanguarda', reqLevel: 3, glory: 4, damage: 2, classAffinity: 'warrior' };
  const colossusMinion: Minion = { id: 'm_troll', name: 'Guardião Colossal', reqLevel: 4, glory: 5, damage: 3, classAffinity: 'mage' };

  const chimera: Villain = { id: 'v_manticore', name: 'Quimera da Guarita', round: 3, tier1Power: 6, tier1Glory: 8, tier2Power: 4, tier2Glory: 4, defeatDamage: 2 };
  const archon: Villain = { id: 'v_beholder', name: 'Arconte Abissal', round: 6, tier1Power: 10, tier1Glory: 12, tier2Power: 7, tier2Glory: 6, defeatDamage: 3 };
  const celestialDragon: Villain = { id: 'v_dragon', name: 'Dragão Celestial de Brasas', round: 8, tier1Power: 14, tier1Glory: 16, tier2Power: 10, tier2Glory: 8, defeatDamage: 4 };

  const rooms = populateRooms(cols, rows, {
    '0,0': { type: 'start', revealed: true, cleared: true },
    '1,0': { type: 'minion', minion: scout },
    '2,0': { type: 'gem', gemsCount: 1 },
    '3,0': { type: 'minion', minion: sentinel },
    '4,0': { type: 'item' },
    '5,0': { type: 'gem', gemsCount: 2 },
    '0,1': { type: 'trap', trapDamage: 1 },
    '1,1': { type: 'gem', gemsCount: 2 },
    '2,1': { type: 'item' },
    '3,1': { type: 'trap', trapDamage: 1 },
    '4,1': { type: 'boss', villain: chimera },
    '5,1': { type: 'minion', minion: sentinel },
    '0,2': { type: 'minion', minion: scout },
    '1,2': { type: 'trap', trapDamage: 2 },
    '2,2': { type: 'minion', minion: brute },
    '3,2': { type: 'gem', gemsCount: 2 },
    '4,2': { type: 'minion', minion: brute },
    '5,2': { type: 'item' },
    '0,3': { type: 'gem', gemsCount: 2 },
    '1,3': { type: 'minion', minion: sentinel },
    '2,3': { type: 'boss', villain: archon },
    '3,3': { type: 'item' },
    '4,3': { type: 'trap', trapDamage: 2 },
    '5,3': { type: 'minion', minion: colossusMinion },
    '0,4': { type: 'minion', minion: brute },
    '1,4': { type: 'item' },
    '2,4': { type: 'trap', trapDamage: 2 },
    '3,4': { type: 'gem', gemsCount: 2 },
    '4,4': { type: 'minion', minion: colossusMinion },
    '5,4': { type: 'trap', trapDamage: 2 },
    '0,5': { type: 'trap', trapDamage: 2 },
    '1,5': { type: 'gem', gemsCount: 2 },
    '2,5': { type: 'minion', minion: colossusMinion },
    '3,5': { type: 'item' },
    '4,5': { type: 'gem', gemsCount: 2 },
    '5,5': { type: 'boss', villain: celestialDragon },
  });

  const walls: Wall[] = [
    createWall(0, 0, 0, 1),
    createWall(2, 0, 2, 1),
    createWall(4, 0, 4, 1),
    createWall(1, 2, 2, 2),
    createWall(3, 1, 3, 2),
    createWall(2, 3, 2, 4),
    createWall(4, 2, 5, 2),
    createWall(0, 4, 1, 4),
    createWall(3, 4, 4, 4),
    createWall(4, 4, 4, 5),
  ];

  return {
    mapId: 7,
    mapName: 'Cidadela Imperial',
    cols,
    rows,
    startCoord: { x: 0, y: 0 },
    currentCoord: { x: 0, y: 0 },
    rooms,
    walls,
    visitedCoords: [{ x: 0, y: 0 }],
  };
}

export function getCanonicalMap(mapId: number): DungeonMap {
  switch (mapId) {
    case 2:
      return getCanonicalMap2();
    case 3:
      return getCanonicalMap3();
    case 4:
      return getCanonicalMap4();
    case 5:
      return getCanonicalMap5();
    case 6:
      return getCanonicalMap6();
    case 7:
      return getCanonicalMap7();
    default:
      return getCanonicalMap1();
  }
}

export function getValidMoves(map: DungeonMap, from: DungeonCoord, maxSteps: number = 2): DungeonCoord[] {
  const { cols, rows } = getMapDimensions(map);
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

      if (nextCoord.x < 0 || nextCoord.x >= cols || nextCoord.y < 0 || nextCoord.y >= rows) {
        continue;
      }

      const isBlocked = map.walls.some((w) => isWallBlocking(w, coord, nextCoord));
      if (isBlocked) {
        continue;
      }

      const nextKey = coordKey(nextCoord);
      const nextSteps = steps + 1;

      if (!visited.has(nextKey) || visited.get(nextKey)! > nextSteps) {
        visited.set(nextKey, nextSteps);
        queue.push({ coord: nextCoord, steps: nextSteps });

        if (!coordEq(nextCoord, from) && !validMoves.some((c) => coordEq(c, nextCoord))) {
          validMoves.push(nextCoord);
        }
      }
    }
  }

  return validMoves;
}

export function getShortestPath(
  map: DungeonMap,
  from: DungeonCoord,
  to: DungeonCoord,
  maxSteps: number = 2
): DungeonCoord[] {
  if (coordEq(from, to)) return [from];

  const { cols, rows } = getMapDimensions(map);
  const queue: { coord: DungeonCoord; path: DungeonCoord[] }[] = [
    { coord: from, path: [from] },
  ];
  const visited = new Set<string>([coordKey(from)]);
  const directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  while (queue.length > 0) {
    const { coord, path } = queue.shift()!;
    if (path.length - 1 >= maxSteps) continue;

    for (const dir of directions) {
      const nextCoord: DungeonCoord = { x: coord.x + dir.dx, y: coord.y + dir.dy };
      if (nextCoord.x < 0 || nextCoord.x >= cols || nextCoord.y < 0 || nextCoord.y >= rows) {
        continue;
      }
      if (map.walls.some((w) => isWallBlocking(w, coord, nextCoord))) {
        continue;
      }
      const nextKey = coordKey(nextCoord);
      if (visited.has(nextKey)) continue;

      const nextPath = [...path, nextCoord];
      if (coordEq(nextCoord, to)) {
        return nextPath;
      }
      visited.add(nextKey);
      queue.push({ coord: nextCoord, path: nextPath });
    }
  }

  return [];
}

export function executeMove(
  map: DungeonMap,
  target: DungeonCoord
): { updatedMap: DungeonMap; events: DungeonEvent[] } {
  const events: DungeonEvent[] = [];
  const key = coordKey(target);
  const room = map.rooms[key];
  const label = formatCoordLabel(target);

  const updatedRooms = { ...map.rooms };
  const updatedVisited = [...map.visitedCoords];

  if (!updatedVisited.some((c) => coordEq(c, target))) {
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
          description: `[${label}] Encontro com ${room.minion.name}!`,
          payload: room.minion,
        });
      } else if (room.type === 'trap' && room.trapDamage) {
        events.push({
          type: 'trap',
          description: `[${label}] Armadilha acionada! Sofreu ${room.trapDamage} de dano!`,
          payload: room.trapDamage,
        });
      } else if (room.type === 'gem' && room.gemsCount) {
        events.push({
          type: 'gem',
          description: `[${label}] Veio de gemas encontrado (+${room.gemsCount} gemas)!`,
          payload: room.gemsCount,
        });
      } else if (room.type === 'item') {
        events.push({
          type: 'item',
          description: `[${label}] Artefato arcano encontrado (+2 glória)!`,
        });
      } else if (room.type === 'boss' && room.villain) {
        events.push({
          type: 'boss',
          description: `[${label}] Covil do Chefe: ${room.villain.name}!`,
          payload: room.villain,
        });
      } else {
        events.push({
          type: 'visit',
          description: `[${label}] Câmara explorada com segurança.`,
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
