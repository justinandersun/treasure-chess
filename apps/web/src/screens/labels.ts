import type { Color, Family } from '@treasure-chess/game';

export const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

export const FAMILY_NAMES: Record<Family, string> = {
  infantry: 'Infantry',
  rook: 'Rook family',
  bishop: 'Bishop family',
  knight: 'Knight family',
  royalty: 'Royalty',
};
