export type DieSymbol = 'boot' | 'sword' | 'magic' | 'rogue' | 'shield' | 'skull';
export type DieColor = 'white' | 'black';

export interface Die {
  id: string;
  color: DieColor;
  symbol: DieSymbol;
  value: number;
}

export interface DicePool {
  dice: Die[];
  draftedIds: string[];
}

export interface HazardResult {
  hazardTriggered: boolean;
  wounds: number;
}

export type HeroClass = 'warrior' | 'mage' | 'cleric' | 'rogue';

export interface HeroState {
  classType: HeroClass;
  level: number;
  maxLevel: number;
}

export interface HeroParty {
  heroes: Record<HeroClass, HeroState>;
  currentHealth: number;
  maxHealth: number;
  resurrections: number;
  potions: number;
  magicItems: number;
  gems: number;
}

export interface DungeonCoord {
  x: number;
  y: number;
}

export type RoomContentType = 'empty' | 'start' | 'minion' | 'trap' | 'gem' | 'item' | 'boss';

export interface Minion {
  id: string;
  name: string;
  reqLevel: number;
  glory: number;
  damage: number;
  classAffinity?: HeroClass;
}

export interface Villain {
  id: string;
  name: string;
  round: 3 | 6 | 8;
  tier1Power: number;
  tier1Glory: number;
  tier2Power: number;
  tier2Glory: number;
  defeatDamage: number;
}

export interface RoomState {
  coord: DungeonCoord;
  type: RoomContentType;
  revealed: boolean;
  cleared: boolean;
  minion?: Minion;
  villain?: Villain;
  trapDamage?: number;
  gemsCount?: number;
}

export interface Wall {
  from: DungeonCoord;
  to: DungeonCoord;
  blocks: (a: DungeonCoord, b: DungeonCoord) => boolean;
}

export interface DungeonMap {
  startCoord: DungeonCoord;
  currentCoord: DungeonCoord;
  rooms: Record<string, RoomState>;
  walls: Wall[];
  visitedCoords: DungeonCoord[];
}

export interface FinalScoreBreakdown {
  minionsGlory: number;
  bossesGlory: number;
  gemsGlory: number;
  itemsGlory: number;
  heroLevelsGlory: number;
  resurrectionPenalties: number;
  netGlory: number;
}
