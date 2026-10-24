# Tiny Dungeon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build *Tiny Dungeon*, an atmospheric single-player webapp game faithfully adapting the *Paper Dungeons* roll-and-write board game with a 3D isometric low-poly aesthetic and luxury dark UI inspired by *ref-c* (Vesperfall).

**Architecture:** Pure TypeScript domain game engine (`@engine`) completely decoupled from graphics, managed via a reactive Zustand store with an action-stack for intra-turn Undo/Redo. A React Three Fiber (R3F) canvas renders the low-poly isometric dungeon with dynamic torch lighting, while a React/Tailwind DOM layer renders the dark serif HUD and "The Ember Measure" hero ledger.

**Tech Stack:** React 19, TypeScript, Vite, React Three Fiber (Three.js), `@react-three/drei`, Tailwind CSS, Zustand, Vitest, Lucide React.

**Spec:** `c:\Users\Thomáz\Projetos\01_dev-systems\tiny-dungeon\docs\superpowers\specs\2026-10-23-tiny-dungeon-design.md`

## Global Constraints

- Modern WebGL2 browser compatibility without requiring external heavy asset CDNs (procedural low-poly meshes).
- Deterministic game engine logic 100% testable via Vitest without DOM or Canvas dependencies.
- Official Paper Dungeons base rules fidelity across 8 rounds, 4 hero classes, dice drafting, and canonical Map 1.
- No premature permadeath: Resurrection penalty (-9 glory) applies on health depletion, allowing 8 full rounds.
- Non-destructive turn planning: Full Undo/Redo within the active round before confirming.

## Review Focus

1. **Pathfinding & Wall Collision:** Moving into an adjacent room separated by a solid wall must be strictly forbidden unless an appropriate ability/item is active.
2. **Dice Drafting Constraints:** The player may select at most 3 of the 6 available dice per round, with each die consumed for exactly one valid action (movement, leveling, or crafting).
3. **Turn Undo Integrity:** Staging an action (e.g. moving into a room, suffering a trap, drafting a die) and then clicking Undo must revert the party position, health, and drafted dice back to the exact initial round state without leakage.
4. **Boss Battle Solo Thresholds:** At rounds 3, 6, and 8, party strength must correctly evaluate against the canonical Villain card thresholds to award Tier 1, Tier 2, or defeat penalties.
5. **Autosave Recovery:** Refreshing or closing the browser mid-game must cleanly restore the round, party stats, explored dungeon tiles, and accumulated score from `localStorage`.

---

### Task 1: Project Scaffolding & Tooling Setup

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Consumes: Node.js / Vite build environment
- Produces: Runnable development server (`npm run dev`) and test runner (`npm run test`)

- [ ] **Step 1: Write the failing smoke test**

```typescript
// tests/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('Project Environment', () => {
  it('should execute tests in vitest environment', () => {
    const isReady = true;
    expect(isReady).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/smoke.test.ts`  
Expected: FAIL or command not found prior to install.

- [ ] **Step 3: Setup project configurations and install dependencies**

Install: `react`, `react-dom`, `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `lucide-react`, `tailwindcss`, `vite`, `vitest`, `typescript`. Configure `vite.config.ts` with React plugin and alias `@engine` -> `src/engine`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/smoke.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.ts tsconfig.json tailwind.config.js index.html src/ tests/
git commit -m "feat: project scaffolding with React 19, R3F, Tailwind, and Vitest"
```

---

### Task 2: Core Engine - Types & Dice Drafting System

**Files:**
- Create: `src/engine/types.ts`
- Create: `src/engine/dice.ts`
- Test: `tests/engine/dice.test.ts`

**Interfaces:**
- Consumes: None (Root engine models)
- Produces: `Die`, `DieSymbol`, `DicePool`, `rollDicePool()`, `checkHazardPhase()`, `draftDie()`

- [ ] **Step 1: Write the failing unit tests for dice rolling and drafting**

```typescript
// tests/engine/dice.test.ts
import { describe, it, expect } from 'vitest';
import { rollDicePool, checkHazardPhase, draftDie } from '../../src/engine/dice';

describe('Dice System', () => {
  it('should generate 3 white and 3 black dice', () => {
    const pool = rollDicePool(() => 0.5);
    expect(pool.dice).toHaveLength(6);
    expect(pool.dice.filter(d => d.color === 'white')).toHaveLength(3);
    expect(pool.dice.filter(d => d.color === 'black')).toHaveLength(3);
  });

  it('should trigger hazard wound when 3 or more skulls appear', () => {
    const pool = {
      dice: [
        { id: '1', color: 'black', symbol: 'skull', value: 1 },
        { id: '2', color: 'black', symbol: 'skull', value: 1 },
        { id: '3', color: 'black', symbol: 'skull', value: 1 },
        { id: '4', color: 'white', symbol: 'boot', value: 2 },
        { id: '5', color: 'white', symbol: 'sword', value: 1 },
        { id: '6', color: 'white', symbol: 'magic', value: 1 },
      ],
      draftedIds: []
    };
    expect(checkHazardPhase(pool)).toEqual({ hazardTriggered: true, wounds: 1 });
  });

  it('should allow drafting up to 3 dice', () => {
    let pool = rollDicePool();
    pool = draftDie(pool, pool.dice[0].id);
    pool = draftDie(pool, pool.dice[1].id);
    pool = draftDie(pool, pool.dice[2].id);
    expect(pool.draftedIds).toHaveLength(3);
    expect(() => draftDie(pool, pool.dice[3].id)).toThrow('Cannot draft more than 3 dice per round');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/dice.test.ts`  
Expected: FAIL with `rollDicePool is not defined`.

- [ ] **Step 3: Implement domain types and dice module in `src/engine/`**

Define `DieSymbol` ('boot' | 'sword' | 'magic' | 'rogue' | 'shield' | 'skull'), `DieColor` ('white' | 'black'), `Die` entity, and pure functions `rollDicePool(rng?)`, `checkHazardPhase(pool)`, and `draftDie(pool, dieId)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/dice.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/types.ts src/engine/dice.ts tests/engine/dice.test.ts
git commit -m "feat(engine): add types and dice drafting system with hazard check"
```

---

### Task 3: Core Engine - Heroes & Party Progression

**Files:**
- Create: `src/engine/heroes.ts`
- Test: `tests/engine/heroes.test.ts`

**Interfaces:**
- Consumes: `src/engine/types.ts`
- Produces: `HeroParty`, `createInitialParty()`, `levelUpHero()`, `applyPartyDamage()`, `brewPotion()`, `craftItem()`

- [ ] **Step 1: Write the failing tests for hero progression and resurrection penalty**

```typescript
// tests/engine/heroes.test.ts
import { describe, it, expect } from 'vitest';
import { createInitialParty, levelUpHero, applyPartyDamage } from '../../src/engine/heroes';

describe('Hero Party System', () => {
  it('should initialize with 4 heroes at level 1 and 0 damage', () => {
    const party = createInitialParty();
    expect(party.heroes.warrior.level).toBe(1);
    expect(party.heroes.mage.level).toBe(1);
    expect(party.heroes.cleric.level).toBe(1);
    expect(party.heroes.rogue.level).toBe(1);
    expect(party.currentHealth).toBe(party.maxHealth);
    expect(party.resurrections).toBe(0);
  });

  it('should advance hero level up to max level', () => {
    let party = createInitialParty();
    party = levelUpHero(party, 'warrior');
    expect(party.heroes.warrior.level).toBe(2);
  });

  it('should apply resurrection penalty on fatal damage instead of permadeath', () => {
    let party = createInitialParty();
    party = applyPartyDamage(party, party.maxHealth + 2);
    expect(party.resurrections).toBe(1);
    expect(party.currentHealth).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/heroes.test.ts`  
Expected: FAIL with `createInitialParty is not defined`.

- [ ] **Step 3: Implement party tracking, level thresholds, and resurrection recovery in `src/engine/heroes.ts`**

Implement `createInitialParty()`, `levelUpHero(party, classType)`, `applyPartyDamage(party, amount)` (with resurrection penalty counter), and inventory state.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/heroes.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/heroes.ts tests/engine/heroes.test.ts
git commit -m "feat(engine): add 4-hero party progression and resurrection penalty system"
```

---

### Task 4: Core Engine - Canonical Map 1 & Adjacency Navigation

**Files:**
- Create: `src/engine/dungeon.ts`
- Test: `tests/engine/dungeon.test.ts`

**Interfaces:**
- Consumes: `src/engine/types.ts`
- Produces: `DungeonMap`, `getCanonicalMap1()`, `getValidMoves()`, `executeMove()`

- [ ] **Step 1: Write the failing tests for dungeon movement and wall blocking**

```typescript
// tests/engine/dungeon.test.ts
import { describe, it, expect } from 'vitest';
import { getCanonicalMap1, getValidMoves, executeMove } from '../../src/engine/dungeon';

describe('Dungeon Navigation', () => {
  it('should load canonical Map 1 with 16 rooms and designated start position', () => {
    const map = getCanonicalMap1();
    expect(map.startCoord).toEqual({ x: 0, y: 0 });
    expect(map.rooms).toBeDefined();
  });

  it('should calculate valid moves within 2 steps without crossing solid walls', () => {
    const map = getCanonicalMap1();
    const validMoves = getValidMoves(map, { x: 0, y: 0 }, 2);
    expect(validMoves.length).toBeGreaterThan(0);
    // Asserts no wall-blocked room is in validMoves
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/dungeon.test.ts`  
Expected: FAIL with `getCanonicalMap1 is not defined`.

- [ ] **Step 3: Implement Map 1 layout, wall matrix, and BFS move validator in `src/engine/dungeon.ts`**

Define room grid (4x4 matrix with corridors, walls, boss rooms at B3, D2, D4), adjacency graph, and step validator.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/dungeon.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/dungeon.ts tests/engine/dungeon.test.ts
git commit -m "feat(engine): add canonical Map 1 and adjacency movement validator"
```

---

### Task 5: Core Engine - Combat, Villains & Final Glory Scoring

**Files:**
- Create: `src/engine/combat.ts`
- Create: `src/engine/scoring.ts`
- Test: `tests/engine/combat.test.ts`
- Test: `tests/engine/scoring.test.ts`

**Interfaces:**
- Consumes: `src/engine/heroes.ts`, `src/engine/dungeon.ts`
- Produces: `resolveMinionEncounter()`, `resolveVillainBattle()`, `calculateFinalGloryScore()`

- [ ] **Step 1: Write the failing tests for minion battle, boss resolution, and scoring**

```typescript
// tests/engine/combat.test.ts & tests/engine/scoring.test.ts
import { describe, it, expect } from 'vitest';
import { resolveMinionEncounter, resolveVillainBattle } from '../../src/engine/combat';
import { calculateFinalGloryScore } from '../../src/engine/scoring';
import { createInitialParty } from '../../src/engine/heroes';

describe('Combat and Scoring', () => {
  it('should award glory or apply damage on minion fight depending on hero level', () => {
    const party = createInitialParty();
    const minion = { id: 'goblin', reqLevel: 2, glory: 2, damage: 1 };
    const outcome = resolveMinionEncounter(party, minion);
    expect(outcome.woundsTaken).toBe(1);
    expect(outcome.gloryEarned).toBe(2);
  });

  it('should compute final glory tally deducting -9 points per resurrection', () => {
    const party = { ...createInitialParty(), resurrections: 1 };
    const score = calculateFinalGloryScore({
      party,
      minionsDefeated: 4, // 8 pts
      bossGlory: 15,      // 15 pts
      gemsCount: 3,       // 6 pts
      itemsCrafted: 2     // 4 pts
    });
    // Total: 8 + 15 + 6 + 4 - 9 = 24
    expect(score.netGlory).toBe(24);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/engine/combat.test.ts tests/engine/scoring.test.ts`  
Expected: FAIL with functions not defined.

- [ ] **Step 3: Implement combat resolvers and scoring tally in `src/engine/`**

Write `combat.ts` (solo threshold table for villains at rounds 3, 6, 8) and `scoring.ts` (comprehensive glory sheet calculator).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/engine/combat.test.ts tests/engine/scoring.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/combat.ts src/engine/scoring.ts tests/engine/combat.test.ts tests/engine/scoring.test.ts
git commit -m "feat(engine): add combat resolution and final glory scoring calculator"
```

---

### Task 6: Game State Machine & History (Undo/Redo & Autosave)

**Files:**
- Create: `src/store/gameStore.ts`
- Test: `tests/store/gameStore.test.ts`

**Interfaces:**
- Consumes: All `src/engine/*` modules
- Produces: `useGameStore`, `stageDiceAction()`, `undoAction()`, `redoAction()`, `confirmRound()`

- [ ] **Step 1: Write the failing tests for turn staging, undo/redo, and round advancement**

```typescript
// tests/store/gameStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

describe('Game Store Machine', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  it('should initialize at round 1 with rolled dice pool', () => {
    const state = useGameStore.getState();
    expect(state.currentRound).toBe(1);
    expect(state.dicePool.dice).toHaveLength(6);
  });

  it('should allow staging a movement action and reverting via undo', () => {
    const store = useGameStore.getState();
    const initialPos = store.dungeon.currentCoord;
    store.stageMove({ x: 1, y: 0 });
    expect(useGameStore.getState().dungeon.currentCoord).toEqual({ x: 1, y: 0 });
    
    useGameStore.getState().undo();
    expect(useGameStore.getState().dungeon.currentCoord).toEqual(initialPos);
  });

  it('should advance round from 1 to 2 upon confirmRound', () => {
    const store = useGameStore.getState();
    store.confirmRound();
    expect(useGameStore.getState().currentRound).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/store/gameStore.test.ts`  
Expected: FAIL with `useGameStore is not defined`.

- [ ] **Step 3: Implement Zustand store with intra-round action stack and LocalStorage adapter**

Implement `src/store/gameStore.ts` with action history for undo/redo within the active round and automatic serialization on `confirmRound()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/store/gameStore.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/store/gameStore.ts tests/store/gameStore.test.ts
git commit -m "feat(store): add Zustand state machine with intra-round undo/redo and autosave"
```

---

### Task 7: 3D Isometric Dungeon Scene (React Three Fiber)

**Files:**
- Create: `src/components/canvas/DungeonCanvas.tsx`
- Create: `src/components/canvas/RoomTile3D.tsx`
- Create: `src/components/canvas/Walls3D.tsx`
- Create: `src/components/canvas/TorchLight.tsx`
- Create: `src/components/canvas/PartyPawn3D.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useGameStore`
- Produces: 3D Isometric WebGL scene rendered within the viewport

- [ ] **Step 1: Write component smoke test for DungeonCanvas**

```typescript
// tests/components/DungeonCanvas.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { DungeonCanvas } from '../../src/components/canvas/DungeonCanvas';

describe('DungeonCanvas Component', () => {
  it('renders canvas element container without crashing', () => {
    const { container } = render(<DungeonCanvas />);
    expect(container).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/DungeonCanvas.test.tsx`  
Expected: FAIL with component not found.

- [ ] **Step 3: Implement 3D low-poly procedural dungeon scene in R3F**

Build `DungeonCanvas.tsx` with an `OrthographicCamera` configured for isometric projection, `RoomTile3D.tsx` with beveled edges and room content markers (gems, minions, boss gates), `Walls3D.tsx` for perimeter and interior walls, `TorchLight.tsx` with procedural flicker, and `PartyPawn3D.tsx` with glowing position ring.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/DungeonCanvas.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/canvas/ tests/components/DungeonCanvas.test.tsx src/App.tsx
git commit -m "feat(graphics): implement 3D isometric dungeon scene with R3F and dynamic torchlights"
```

---

### Task 8: Dark Luxury UI Overlay (HUD, Ember Measure Hero Ledger & Dice Tray)

**Files:**
- Create: `src/components/ui/HUD.tsx`
- Create: `src/components/ui/EmberLedger.tsx`
- Create: `src/components/ui/DiceTray.tsx`
- Create: `src/components/ui/CombatLog.tsx`
- Create: `src/components/ui/EndGameModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useGameStore`
- Produces: Interactive HTML/Tailwind UI overlay on top of the 3D scene

- [ ] **Step 1: Write unit tests for HUD and Ember Ledger interactions**

```typescript
// tests/components/UI.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiceTray } from '../../src/components/ui/DiceTray';
import { useGameStore } from '../../src/store/gameStore';

describe('DiceTray Component', () => {
  it('displays 6 dice and allows clicking to toggle draft selection', () => {
    useGameStore.getState().resetGame();
    render(<DiceTray />);
    const diceButtons = screen.getAllByRole('button');
    expect(diceButtons.length).toBeGreaterThanOrEqual(6);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/UI.test.tsx`  
Expected: FAIL with components not found.

- [ ] **Step 3: Implement dark luxury HUD, Ember Ledger, and Dice Tray**

Style components using Tailwind with dark background (`#0d0e12`), serif fonts (Cinzel/Playfair), glowing copper accents, interactive 3-dice drafting drawer, collapsible "The Ember Measure" hero ledger (showing the 4 classes and leveling buttons), Undo/Redo action bar, and game log.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/UI.test.tsx`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ tests/components/UI.test.tsx src/App.tsx
git commit -m "feat(ui): add dark luxury HUD, Ember Measure hero ledger, and dice tray"
```

---

### Task 9: End-to-End Game Loop Integration & Verification

**Files:**
- Modify: `src/App.tsx`
- Create: `tests/integration/gameLoop.test.ts`

**Interfaces:**
- Consumes: All UI, 3D Canvas, and GameStore systems
- Produces: Fully integrated, playable 8-round game

- [ ] **Step 1: Write comprehensive end-to-end game loop test**

```typescript
// tests/integration/gameLoop.test.ts
import { describe, it, expect } from 'vitest';
import { useGameStore } from '../../src/store/gameStore';

describe('End-to-End Game Loop', () => {
  it('simulates 8 rounds from start to final score tally', () => {
    const store = useGameStore.getState();
    store.resetGame();

    for (let r = 1; r <= 8; r++) {
      expect(useGameStore.getState().currentRound).toBe(r);
      // Draft 3 dice and confirm round
      const pool = useGameStore.getState().dicePool;
      store.stageDraft(pool.dice[0].id);
      store.stageDraft(pool.dice[1].id);
      store.stageDraft(pool.dice[2].id);
      store.confirmRound();
    }

    expect(useGameStore.getState().isGameOver).toBe(true);
    expect(useGameStore.getState().finalScore).toBeDefined();
    expect(useGameStore.getState().finalScore!.netGlory).toBeTypeOf('number');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/integration/gameLoop.test.ts`  
Expected: FAIL if full loop or game-over state is incomplete.

- [ ] **Step 3: Connect game loop triggers, round transitions, and victory certificate**

Wire round ending triggers, boss battles at rounds 3, 6, and 8, and display the final score tally modal with glory breakdown.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/integration/gameLoop.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/ tests/integration/gameLoop.test.ts
git commit -m "feat(game): complete 8-round game loop integration with end-game certificate"
```
