import type { Color, Family } from '@treasure-chess/game';

export const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

/** Display names, in display order. */
export const FAMILY_NAMES: Record<Family, string> = {
  infantry: 'Infantry',
  knight: 'Cavalry',
  bishop: 'Cathedral',
  rook: 'Castle',
  royalty: 'Court',
};
