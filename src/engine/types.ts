export type DieSymbol = 'boot' | 'sword' | 'magic' | 'rogue' | 'shield' | 'skull';
export type DieColor = 'white' | 'black';
export type ThemeId = 'sengoku' | 'vesperfall';

export interface Die {
  id: string;
  color: DieColor;
  symbol: DieSymbol;
  value: number;
}

export interface DicePool {
  dice: Die[];
  draftedIds: string[];
  usedIds?: string[];
}

export interface HazardResult {
  hazardTriggered: boolean;
  wounds: number;
}

export type HeroClass = 'warrior' | 'mage' | 'cleric' | 'rogue';

export type RelicId =
  | 'katana-masamune'
  | 'selo-onmyo'
  | 'amuleto-omamori'
  | 'gancho-kaginawa'
  | 'sandalias-waraji'
  | 'armadura-yoroi'
  | 'cabaca-elixir'
  | 'espelho-yata';

export interface RelicRecipeSlot {
  color: DieColor | 'any';
  symbol?: DieSymbol;
}

export type RelicEffectKind = 'permanent' | 'instant' | 'ability';

export type BossOutcome = 'defeated' | 'victorious';

export type PendingRewardKind = 'choose-hero-level' | 'choose-relic-step' | 'choose-any';

export interface PendingReward {
  id: string;
  source: string;
  title: string;
  kind: PendingRewardKind;
}

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
  potionsBrewed?: number;
  magicItems: number;
  gems: number;
  craftedRelics?: RelicId[];
  relicProgress?: Partial<Record<RelicId, boolean[]>>;
}

export interface DungeonCoord {
  x: number;
  y: number;
}

export type EdgeSide = 'north' | 'south' | 'east' | 'west';

export interface EdgePortal {
  id: string;
  a: DungeonCoord;
  aSide: EdgeSide;
  b: DungeonCoord;
  bSide: EdgeSide;
}

export type RoomContentType =
  | 'empty'
  | 'start'
  | 'minion'
  | 'trap'
  | 'gem'
  | 'item'
  | 'potion'
  | 'boss';

export type RoomContentItem =
  | { kind: 'minion'; minion: Minion }
  | { kind: 'trap'; damage: number }
  | { kind: 'gem'; count: number }
  | { kind: 'item' }
  | { kind: 'potion'; count: number }
  | { kind: 'boss'; villain: Villain };

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
  contents?: RoomContentItem[];
  locked?: boolean;
}

export interface Wall {
  from: DungeonCoord;
  to: DungeonCoord;
  sealed?: boolean;
  blocks: (a: DungeonCoord, b: DungeonCoord) => boolean;
}

export interface DungeonMap {
  mapId?: number;
  mapName?: string;
  cols?: number;
  rows?: number;
  startCoord: DungeonCoord;
  currentCoord: DungeonCoord;
  rooms: Record<string, RoomState>;
  walls: Wall[];
  portals?: EdgePortal[];
  visitedCoords: DungeonCoord[];
}

export interface MissionCard {
  id: string;
  title: string;
  description: string;
  rewardGlory: number;
  completed: boolean;
}

export interface FinalScoreBreakdown {
  minionsGlory: number;
  bossesGlory: number;
  gemsGlory: number;
  itemsGlory: number;
  heroLevelsGlory: number;
  missionsGlory?: number;
  masteryGlory?: number;
  resurrectionPenalties: number;
  netGlory: number;
  minionsCount?: number;
  gemsCount?: number;
  itemsCount?: number;
}
