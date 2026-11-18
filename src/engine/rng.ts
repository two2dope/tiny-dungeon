/**
 * Mulberry32 deterministic PRNG so dice pools and runs are reproducible from a seed.
 */
export function createSeededRng(seed: number): () => number {
  let state = (seed >>> 0) || 1;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let fallbackCounter = 1;

export function getNextFallbackSeed(): number {
  fallbackCounter = (fallbackCounter + 1) >>> 0;
  return ((Date.now() ^ (fallbackCounter * 2654435761)) >>> 0) || 1337;
}

export function deriveRoundSeed(baseSeed: number, round: number, mapId: number = 1): number {
  const mixed = ((baseSeed >>> 0) ^ Math.imul(round + 17, 0x9e3779b1) ^ Math.imul(mapId + 31, 0x85ebca6b)) >>> 0;
  return mixed || 1;
}

export function parseSeedFromUrl(search?: string): number {
  const query = search ?? (typeof window !== 'undefined' ? window.location.search : '');
  if (!query) return getNextFallbackSeed();
  const params = new URLSearchParams(query);
  const raw = params.get('seed');
  if (!raw) return getNextFallbackSeed();
  const parsed = Number.parseInt(raw, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed >>> 0;
  }
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1337;
}
