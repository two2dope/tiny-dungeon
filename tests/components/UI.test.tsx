import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { DiceTray } from '../../src/components/ui/DiceTray';
import { HUD } from '../../src/components/ui/HUD';
import { EmberLedger } from '../../src/components/ui/EmberLedger';
import { CombatLog } from '../../src/components/ui/CombatLog';
import { BossDuelModal } from '../../src/components/ui/BossDuelModal';
import { MilestoneRewardModal } from '../../src/components/ui/MilestoneRewardModal';
import { soundEngine } from '../../src/audio/soundEngine';
import { useGameStore } from '../../src/store/gameStore';
import {
  getCourtyardFadeTexture,
  getCourtyardGroundTexture,
  getEmberBedTexture,
  getGlowPoolTexture,
  getLacquerWoodTexture,
  getMistRingTexture,
  getOfudaStripTexture,
  getPanoramaTexture,
  getSlabTexture,
  getStandeeHaloTexture,
  getStylizedFlameTexture,
  getTabletopMatTexture,
  getUiTokenTexture,
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

  it('displays 6 dice in DiceTray with color-matched 2.5D sprite URLs and click drafting', () => {
    const { container } = render(<DiceTray />);
    const diceButtons = screen.getAllByRole('button');
    expect(diceButtons.length).toBeGreaterThanOrEqual(6);
    const dieImgs = container.querySelectorAll('img');
    expect(dieImgs).toHaveLength(6);
    dieImgs.forEach((img) => {
      expect(img.getAttribute('src')).toMatch(
        /^\/assets\/ui\/die-(white|black)-(sword|shield|boot|magic|rogue|skull)\.webp$/
      );
    });
  });

  it('renders HUD with map selector, vitality meter and action buttons', () => {
    render(<HUD isLedgerOpen={true} onToggleLedger={() => {}} />);
    expect(screen.getByLabelText('Selecionar Mapa')).toBeDefined();
    expect(screen.getByLabelText(/Vida \d+ de \d+/)).toBeDefined();
    expect(screen.getByRole('button', { name: /Confirmar/i })).toBeDefined();
  });

  it('renders EmberLedger with 2x2 heroes, potion checkboxes, 4-column relic showcase, gem milestones, and expandable missions', () => {
    render(<EmberLedger isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('The Ember Measure')).toBeDefined();
    expect(screen.getByText(/Ações 3\/3/)).toBeDefined();
    expect(screen.getByAltText('Retrato de Guerreiro')).toBeDefined();
    expect(screen.getByAltText('Retrato de Mago')).toBeDefined();
    expect(screen.getByAltText('Retrato de Clérigo')).toBeDefined();
    expect(screen.getByAltText('Retrato de Ladino')).toBeDefined();
    expect(screen.getByLabelText(/Trilha de Poções/i)).toBeDefined();
    expect(screen.getAllByRole('checkbox')).toHaveLength(12);
    expect(screen.getByAltText('Bônus Upgrade de Herói')).toBeDefined();
    expect(screen.getByAltText('Bônus Forja Gratuita')).toBeDefined();
    expect(screen.getByAltText('Escolha do Alquimista')).toBeDefined();
    expect(screen.getByLabelText('Acervo de Relíquias Forjadas')).toBeDefined();
    expect(screen.getByAltText('Katana Masamune')).toBeDefined();
    expect(screen.getByAltText('Gancho Kaginawa')).toBeDefined();
    expect(screen.getByAltText('Selo Onmyō')).toBeDefined();
    expect(screen.getByText(/Gemas:/)).toBeDefined();
    expect(screen.getByText(/Missões da Expedição/i)).toBeDefined();

    // Clicking a square relic tile opens the unified inspector + forge button
    const katanaDetailsBtn = screen.getByRole('button', { name: /Detalhes de Katana Masamune/i });
    fireEvent.click(katanaDetailsBtn);
    expect(screen.getByText(/Soma \+2 ao Poder Bélico da comitiva/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Forjar Katana Masamune/i })).toBeDefined();

    // Mission cards start collapsed and expand/collapse on click
    expect(screen.queryByText(/Derrote 3 ou mais monstros/i)).toBeNull();
    const slayerMissionBtn = screen.getByRole('button', { name: /Missão Caçador de Lacaios/i });
    fireEvent.click(slayerMissionBtn);
    expect(screen.getByText(/Derrote 3 ou mais monstros/i)).toBeDefined();
    fireEvent.click(slayerMissionBtn);
    expect(screen.queryByText(/Derrote 3 ou mais monstros/i)).toBeNull();
  });

  it('renders MilestoneRewardModal and applies hero level reward', () => {
    useGameStore.setState({
      pendingRewards: [
        {
          id: 'rw-test',
          source: 'potion-4',
          title: 'Marco de Poções (4/12): Upgrade de Herói',
          kind: 'choose-hero-level',
        },
      ],
    });
    render(<MilestoneRewardModal />);
    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Marco de Poções \(4\/12\)/i)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /Guerreiro/i }));
    expect(useGameStore.getState().pendingRewards).toHaveLength(0);
    expect(useGameStore.getState().party.heroes.warrior.level).toBe(2);
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

  it('returns null safely from procedural courtyard and craft textures in headless JSDOM', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    expect(() => getSlabTexture('sengoku', 3)).not.toThrow();
    expect(() => getSlabTexture('sengoku', 4)).not.toThrow();
    expect(() => getWallTexture('sengoku', 5)).not.toThrow();
    expect(() => getTabletopMatTexture('sengoku', 6)).not.toThrow();
    expect(() => getPanoramaTexture('sengoku', 7)).not.toThrow();
    expect(getCourtyardGroundTexture('sengoku', 3)).toBeNull();
    expect(getCourtyardFadeTexture('sengoku', 4)).toBeNull();
    expect(getLacquerWoodTexture('vesperfall')).toBeNull();
    expect(getMistRingTexture('sengoku', 2)).toBeNull();
    expect(getGlowPoolTexture('vesperfall')).toBeNull();
    expect(getWarBannerClothTexture('sengoku', 7)).toBeNull();
    expect(getStandeeHaloTexture('#fbbf24', 'party', 'sengoku')).toBeNull();
    expect(getStylizedFlameTexture('#ea580c', '#f59e0b', '#fef08a')).toBeNull();
    expect(getEmberBedTexture('#ea580c', '#fef08a')).toBeNull();
    expect(getUiTokenTexture('/assets/ui/token-sealed-lock.webp', 'lock')).toBeNull();
    expect(getOfudaStripTexture()).toBeNull();
  });

  it('switches across all 7 Sengoku maps and triggers map, dice, and forge detail SFX', () => {
    const playSpy = vi.spyOn(soundEngine, 'play');
    render(
      <>
        <HUD isLedgerOpen={true} onToggleLedger={() => {}} />
        <DiceTray />
        <EmberLedger isOpen={true} onClose={() => {}} />
      </>
    );

    const mapSelect = screen.getByLabelText('Selecionar Mapa') as HTMLSelectElement;
    for (const id of [1, 2, 3, 4, 5, 6, 7]) {
      fireEvent.change(mapSelect, { target: { value: String(id) } });
      expect(useGameStore.getState().mapId).toBe(id);
    }
    expect(playSpy).toHaveBeenCalledWith('map');

    const dieButtons = screen.getAllByRole('button', { name: /Dado (Branco|Negro):/i });
    expect(dieButtons).toHaveLength(6);
    fireEvent.click(dieButtons[0]);
    expect(playSpy).toHaveBeenCalledWith('dice');

    const katanaDetailsBtn = screen.getByRole('button', { name: /Detalhes de Katana Masamune/i });
    fireEvent.click(katanaDetailsBtn);
    expect(playSpy).toHaveBeenCalledWith('click');
  });
});
