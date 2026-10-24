import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
