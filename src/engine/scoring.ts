import { FinalScoreBreakdown, HeroParty, MissionCard } from './types';

export interface ScoreInput {
  party: HeroParty;
  minionsDefeatedCount?: number;
  minionsGlory: number;
  bossGlory: number;
  gemsCount: number;
  itemsCrafted: number;
  missionsGlory?: number;
  masteryGlory?: number;
}

export function createInitialMissions(): MissionCard[] {
  return [
    {
      id: 'mission_slayer',
      title: 'Caçador de Lacaios',
      description: 'Derrote 3 ou mais monstros na masmorra',
      rewardGlory: 4,
      completed: false,
    },
    {
      id: 'mission_artisan',
      title: 'Alquimista Real',
      description: 'Produza 2 ou mais poções ou artefatos',
      rewardGlory: 4,
      completed: false,
    },
    {
      id: 'mission_explorer',
      title: 'Desbravador',
      description: 'Explore 6 ou mais câmaras do mapa',
      rewardGlory: 4,
      completed: false,
    },
  ];
}

export function evaluateMissions(params: {
  missions: MissionCard[];
  minionsDefeatedCount: number;
  potionsAndItemsCount: number;
  visitedCount: number;
}): MissionCard[] {
  const { missions, minionsDefeatedCount, potionsAndItemsCount, visitedCount } = params;
  return missions.map((mission) => {
    if (mission.id === 'mission_slayer') {
      return { ...mission, completed: minionsDefeatedCount >= 3 };
    }
    if (mission.id === 'mission_artisan') {
      return { ...mission, completed: potionsAndItemsCount >= 2 };
    }
    if (mission.id === 'mission_explorer') {
      return { ...mission, completed: visitedCount >= 6 };
    }
    return mission;
  });
}

export function calculateMissionsGlory(missions: MissionCard[]): number {
  return missions.reduce((acc, m) => (m.completed ? acc + m.rewardGlory : acc), 0);
}

export function calculateFinalGloryScore(input: ScoreInput): FinalScoreBreakdown {
  const {
    party,
    minionsGlory,
    bossGlory,
    gemsCount,
    itemsCrafted,
    missionsGlory = 0,
    masteryGlory = 0,
  } = input;

  const heroLevelsGlory =
    party.heroes.warrior.level +
    party.heroes.mage.level +
    party.heroes.cleric.level +
    party.heroes.rogue.level;

  const gemsGlory = gemsCount * 2;
  const itemsGlory = itemsCrafted * 2;
  const resurrectionPenalties = party.resurrections * 9;

  const netGlory =
    minionsGlory +
    bossGlory +
    gemsGlory +
    itemsGlory +
    heroLevelsGlory +
    missionsGlory +
    masteryGlory -
    resurrectionPenalties;

  return {
    minionsGlory,
    bossesGlory: bossGlory,
    gemsGlory,
    itemsGlory,
    heroLevelsGlory,
    missionsGlory,
    masteryGlory,
    resurrectionPenalties,
    netGlory,
  };
}
