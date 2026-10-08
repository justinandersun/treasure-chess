import {
  type Color,
  fileOf,
  isLightSquare,
  type Piece,
  PIECES,
  rankOf,
  type Square,
  squareName,
} from '@treasure-chess/game';
import { type KeyboardEvent, useRef, useState } from 'react';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './Board.module.css';
import { displayPosition, displaySquares, navigate } from './boardGeometry';

export type TargetKind = 'move' | 'capture';

export interface BoardProps {
  readonly board: readonly (Piece | null)[];
  /** Whose side is at the bottom. */
  readonly orientation: Color;
  readonly selected?: Square | null;
  /** Squares to mark as destinations for the selected piece. */
  readonly targets?: ReadonlyMap<Square, TargetKind>;
  readonly lastMove?: { readonly from: Square; readonly to: Square } | null;
  /** Square of a King in check. */
  readonly checkSquare?: Square | null;
  readonly onSquareClick?: (sq: Square) => void;
  readonly label?: string;
  /** Display rows to show (0 = top), e.g. [6, 7] for the player's own two ranks. */
  readonly rows?: readonly number[];
}

const ALL_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

const COLOR_NAME: Record<Color, string> = { w: 'White', b: 'Black' };

function describeSquare(sq: Square, piece: Piece | null, notes: string[]): string {
  const occupant = piece ? `${COLOR_NAME[piece.color]} ${PIECES[piece.type].name}` : 'empty';
  return [squareName(sq), occupant, ...notes].join(', ');
}

/**
 * An 8×8 board of buttons. Click or tap a square, or use the arrow keys (plus Home/End) to move
 * between squares and Enter or Space to choose one. Markers never rely on color alone: moves show a
 * dot, captures a ring, the selection an outline, and each square's label lists its state.
 */
export function Board({
  board,
  orientation,
  selected = null,
  targets,
  lastMove = null,
  checkSquare = null,
  onSquareClick,
  label = 'Chessboard',
  rows = ALL_ROWS,
}: BoardProps) {
  const [focusSquare, setFocusSquare] = useState<Square>(
    () => (orientation === 'w' ? 4 /* e1 */ : 60) /* e8 */,
  );
  const buttons = useRef(new Map<Square, HTMLButtonElement>());

  function handleKeyDown(event: KeyboardEvent, sq: Square) {
    const next = navigate(sq, event.key, orientation);
    if (next === null) return;
    event.preventDefault();
    if (!rows.includes(displayPosition(next, orientation).row)) return;
    setFocusSquare(next);
    buttons.current.get(next)?.focus();
  }

  const squares = displaySquares(orientation);
  const partial = rows.length < 8;
  return (
    <div
      className={[styles.board, partial && styles.partial].filter(Boolean).join(' ')}
      style={partial ? { aspectRatio: `8 / ${rows.length}` } : undefined}
      role="grid"
      aria-label={label}
    >
      {rows.map((row) => (
        <div key={row} role="row" className={styles.row}>
          {squares.slice(row * 8, row * 8 + 8).map((sq) => {
            const piece = board[sq] ?? null;
            const target = targets?.get(sq);
            const isLast = lastMove !== null && (lastMove.from === sq || lastMove.to === sq);
            const notes = [
              sq === selected && 'selected',
              target === 'move' && 'legal move',
              target === 'capture' && 'can capture',
              isLast && 'last move',
              sq === checkSquare && 'in check',
            ].filter((n): n is string => typeof n === 'string');
            const { row: r, col: c } = displayPosition(sq, orientation);
            const light = isLightSquare(sq);
            const classes = [
              styles.square,
              light ? styles.light : styles.dark,
              isLast && styles.last,
              sq === selected && styles.selected,
              sq === checkSquare && styles.check,
              target && styles[target],
            ];
            return (
              <div key={sq} role="gridcell" className={styles.cell}>
                <button
                  type="button"
                  ref={(el) => {
                    if (el) buttons.current.set(sq, el);
                    else buttons.current.delete(sq);
                  }}
                  className={classes.filter(Boolean).join(' ')}
                  tabIndex={sq === focusSquare ? 0 : -1}
                  aria-label={describeSquare(sq, piece, notes)}
                  onClick={() => {
                    setFocusSquare(sq);
                    onSquareClick?.(sq);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, sq)}
                >
                  {c === 0 && (
                    <span className={`${styles.coord} ${styles.rank}`} aria-hidden="true">
                      {rankOf(sq) + 1}
                    </span>
                  )}
                  {r === 7 && (
                    <span className={`${styles.coord} ${styles.file}`} aria-hidden="true">
                      {'abcdefgh'[fileOf(sq)]}
                    </span>
                  )}
                  {piece && (
                    <span className={styles.piece}>
                      <PieceIcon type={piece.type} color={piece.color} />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
