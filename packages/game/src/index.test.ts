import { describe, expect, it } from 'vitest';
import { BOARD_SIZE, TREASURY } from './index';

describe('game package', () => {
  it('exposes core constants', () => {
    expect(TREASURY).toBe(40);
    expect(BOARD_SIZE).toBe(8);
  });
});
