import type { Color, PieceType } from '@treasure-chess/game';
import { PIECES } from '@treasure-chess/game';
import { createElement, type CSSProperties } from 'react';
import styles from './PieceIcon.module.css';
import { PIECE_ART, PIECE_COLORS } from './pieceArt';

const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

const COLOR_VARS = Object.fromEntries(
  (['w', 'b'] as const).map((c) => [
    c,
    {
      '--piece-body': PIECE_COLORS[c].body,
      '--piece-edge': PIECE_COLORS[c].edge,
      '--piece-detail': PIECE_COLORS[c].detail,
    } as CSSProperties,
  ]),
) as Record<Color, CSSProperties>;

export interface PieceIconProps {
  readonly type: PieceType;
  readonly color: Color;
  /** Accessible name; omit when the surrounding element already describes the piece. */
  readonly title?: string | boolean;
  readonly className?: string;
}

/** Piece artwork that scales to its container. */
export function PieceIcon({ type, color, title, className }: PieceIconProps) {
  const label = title === true ? `${COLOR_NAME[color]} ${PIECES[type].name}` : title || undefined;
  return (
    <svg
      viewBox="0 0 45 45"
      className={[styles.piece, className].filter(Boolean).join(' ')}
      style={COLOR_VARS[color]}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {PIECE_ART[type].map((shape, i) =>
        createElement(shape.el, { key: i, className: styles[shape.kind], ...shape.attrs }),
      )}
    </svg>
  );
}
