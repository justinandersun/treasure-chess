import type { Color, Difficulty, Family } from '@treasure-chess/game';

export const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

/** Display names, in display order. */
export const FAMILY_NAMES: Record<Family, string> = {
  infantry: 'Infantry',
  knight: 'Cavalry',
  bishop: 'Cathedral',
  rook: 'Castle',
  royalty: 'Court',
};

export const DIFFICULTY_NAMES: Record<Difficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, string> = {
  beginner: 'Looks a move ahead and makes the odd mistake',
  intermediate: 'Plans a few moves ahead, with an occasional slip',
  advanced: 'Thinks deeply and plays its best move',
};
