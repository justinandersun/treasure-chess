import { describe, expect, it } from 'vitest';
import {
  createGameFromArmies,
  deploymentDraft,
  draftCost,
  formatDeployment,
  isValidArmy,
  TREASURY,
} from './army';
import { legalMoves } from './game';
import { findPreset, PRESETS } from './presets';

describe('presets', () => {
  it('are all valid armies within the treasury', () => {
    for (const preset of PRESETS) {
      expect(isValidArmy(preset.deployment), preset.id).toBe(true);
      expect(draftCost(deploymentDraft(preset.deployment))).toBeLessThanOrEqual(TREASURY);
    }
  });

  it('have unique ids and can be looked up', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    expect(findPreset('classic')?.name).toBe('Classic');
    expect(findPreset('missing')).toBeUndefined();
  });

  it('can face each other in any pairing', () => {
    for (const white of PRESETS) {
      for (const black of PRESETS) {
        const state = createGameFromArmies(white.deployment, black.deployment);
        expect(state.result).toBeNull();
        expect(legalMoves(state).length).toBeGreaterThan(0);
      }
    }
  });

  it('match the approved line-ups', () => {
    expect(
      PRESETS.map((p) => [
        p.id,
        ...formatDeployment(p.deployment),
        draftCost(deploymentDraft(p.deployment)),
      ]),
    ).toEqual([
      ['classic', 'RNBQKBNR', 'PPPPPPPP', 40],
      ['cavalry', 'MNEFKENM', 'PSPSSPSP', 39],
      ['fortress', 'TR.OKORT', 'GGGGGGGG', 39],
      ['royal-court', 'IBOQKFOI', 'PPPPPPPP', 39],
      ['cathedral', 'ICBQKBCI', 'SSSSSSSS', 38],
      ['menagerie', 'MYCKF.YM', 'PGSPPSGP', 40],
    ]);
  });
});
