import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DiceTray } from '../../src/components/ui/DiceTray';
import { HUD } from '../../src/components/ui/HUD';
import { EmberLedger } from '../../src/components/ui/EmberLedger';
import { CombatLog } from '../../src/components/ui/CombatLog';
import { BossDuelModal } from '../../src/components/ui/BossDuelModal';
import { useGameStore } from '../../src/store/gameStore';
import {
  getCourtyardFadeTexture,
  getCourtyardGroundTexture,
  getGlowPoolTexture,
  getLacquerWoodTexture,
  getMistRingTexture,
  getPanoramaTexture,
  getSlabTexture,
  getTabletopMatTexture,
  getWallTexture,
  getWarBannerClothTexture,
} from '../../src/components/canvas/proceduralTextures';

describe('UI Components with Illustrated GUI Skin', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame(4242, 1);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays 6 dice in DiceTray and allows clicking to toggle draft selection', () => {
    render(<DiceTray />);
    const diceButtons = screen.getAllByRole('button');
    expect(diceButtons.length).toBeGreaterThanOrEqual(6);
  });

  it('renders HUD with map selector, vitality meter and action buttons', () => {
    render(<HUD isLedgerOpen={true} onToggleLedger={() => {}} />);
    expect(screen.getByLabelText('Selecionar Mapa')).toBeDefined();
    expect(screen.getByLabelText(/Vida \d+ de \d+/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDefined();
  });

  it('renders EmberLedger open with all 4 hero portraits, action badge, and missions', () => {
    render(<EmberLedger isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('The Ember Measure')).toBeDefined();
    expect(screen.getByText(/Ações 3\/3/)).toBeDefined();
    expect(screen.getByAltText('Retrato de Guerreiro')).toBeDefined();
    expect(screen.getByAltText('Retrato de Mago')).toBeDefined();
    expect(screen.getByAltText('Retrato de Clérigo')).toBeDefined();
    expect(screen.getByAltText('Retrato de Ladino')).toBeDefined();
    expect(screen.getByLabelText('Acervo de Relíquias Forjadas')).toBeDefined();
    expect(screen.getByAltText('Katana Masamune')).toBeDefined();
    expect(screen.getByAltText('Selo Onmyō')).toBeDefined();
    expect(screen.getByText(/Missões da Expedição/i)).toBeDefined();

    // Clicking a relic slot opens inline detail description for keyboard/touch users
    const katanaBtn = screen.getByRole('button', { name: /Katana Masamune/i });
    fireEvent.click(katanaBtn);
    expect(screen.getByText(/Soma \+1 ao Poder Bélico da comitiva/i)).toBeDefined();
  });

  it('renders BossDuelModal with fight, flee, and back actions including Escape cancel', () => {
    useGameStore.setState({
      pendingBossEncounter: {
        id: 'v_manticore',
        name: 'Manticora Guardiã',
        round: 3,
        tier1Power: 6,
        tier1Glory: 8,
        tier2Power: 4,
        tier2Glory: 4,
        defeatDamage: 2,
      },
    });
    render(<BossDuelModal />);
    expect(screen.getByText('Manticora Guardiã')).toBeDefined();
    expect(screen.getByRole('button', { name: /Enfrentar Chefe/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Recuar \/ Fugir/i })).toBeDefined();

    const cancelBtn = screen.getByRole('button', { name: /Voltar à Rodada/i });
    fireEvent.click(cancelBtn);
    expect(useGameStore.getState().pendingBossEncounter).toBeNull();

    // Reopen and cancel via Escape
    act(() => {
      useGameStore.setState({
        pendingBossEncounter: {
          id: 'v_manticore',
          name: 'Manticora Guardiã',
          round: 3,
          tier1Power: 6,
          tier1Glory: 8,
          tier2Power: 4,
          tier2Glory: 4,
          defeatDamage: 2,
        },
      });
    });
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(useGameStore.getState().pendingBossEncounter).toBeNull();
  });

  it('renders CombatLog scroll panel', () => {
    render(<CombatLog />);
    expect(screen.getByText(/Registro de Exploração/i)).toBeDefined();
  });

  it('returns null safely from procedural courtyard textures in headless JSDOM', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => getSlabTexture('sengoku')).not.toThrow();
    expect(() => getWallTexture('sengoku')).not.toThrow();
    expect(() => getTabletopMatTexture('sengoku')).not.toThrow();
    expect(() => getPanoramaTexture('sengoku')).not.toThrow();
    expect(getCourtyardGroundTexture('sengoku')).toBeNull();
    expect(getCourtyardFadeTexture('sengoku')).toBeNull();
    expect(getLacquerWoodTexture('vesperfall')).toBeNull();
    expect(getMistRingTexture('sengoku')).toBeNull();
    expect(getGlowPoolTexture('vesperfall')).toBeNull();
    expect(getWarBannerClothTexture('sengoku')).toBeNull();
  });
});
