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
