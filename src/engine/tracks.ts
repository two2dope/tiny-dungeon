export const POTION_TRACK_MAX = 12;

export const MINION_GLORY_CURVE: readonly number[] = [
  0, 2, 4, 7, 10, 14, 18, 22, 27, 32, 38, 44, 50,
];

export const GEM_GLORY_CURVE: readonly number[] = [
  0, 2, 5, 9, 14, 20, 27, 34, 42, 50, 58,
];

export type PotionMilestoneKind = 'choose-hero-level' | 'choose-relic-step' | 'choose-any';
export type GemMilestoneKind =
  | 'choose-relic-step'
  | 'choose-hero-level'
  | 'instant-potions-and-relic';

export interface TrackMilestone<K extends string> {
  threshold: number;
  kind: K;
  label: string;
}

export const POTION_MILESTONES: readonly TrackMilestone<PotionMilestoneKind>[] = [
  { threshold: 4, kind: 'choose-hero-level', label: 'Upgrade de Herói' },
  { threshold: 8, kind: 'choose-relic-step', label: 'Forja Gratuita (+1 casa)' },
  { threshold: 12, kind: 'choose-any', label: 'Escolha do Alquimista (Herói / Forja / +2 Gemas)' },
];

export const GEM_MILESTONES: readonly TrackMilestone<GemMilestoneKind>[] = [
  { threshold: 3, kind: 'choose-relic-step', label: 'Forja Gratuita (+1 casa)' },
  { threshold: 6, kind: 'choose-hero-level', label: 'Upgrade de Herói' },
  { threshold: 9, kind: 'instant-potions-and-relic', label: '+2 Poções e +1 Casa de Forja' },
];

export function getMinionTrackGlory(count: number): number {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount < MINION_GLORY_CURVE.length) {
    return MINION_GLORY_CURVE[safeCount];
  }
  const last = MINION_GLORY_CURVE[MINION_GLORY_CURVE.length - 1];
  return last + (safeCount - (MINION_GLORY_CURVE.length - 1)) * 3;
}

export function getGemTrackGlory(count: number): number {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount < GEM_GLORY_CURVE.length) {
    return GEM_GLORY_CURVE[safeCount];
  }
  const last = GEM_GLORY_CURVE[GEM_GLORY_CURVE.length - 1];
  return last + (safeCount - (GEM_GLORY_CURVE.length - 1)) * 5;
}

export function getNewlyReachedPotionMilestones(
  prevBrewed: number,
  nextBrewed: number,
  claimed: readonly number[] = []
): TrackMilestone<PotionMilestoneKind>[] {
  return POTION_MILESTONES.filter(
    (m) => nextBrewed >= m.threshold && nextBrewed > prevBrewed && !claimed.includes(m.threshold)
  );
}

export function getNewlyReachedGemMilestones(
  prevGems: number,
  nextGems: number,
  claimed: readonly number[] = []
): TrackMilestone<GemMilestoneKind>[] {
  return GEM_MILESTONES.filter(
    (m) => nextGems >= m.threshold && nextGems > prevGems && !claimed.includes(m.threshold)
  );
}
