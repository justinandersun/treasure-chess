import { type Family, PIECE_DEFINITIONS, type PieceType } from '@treasure-chess/game';
import { PieceGrid, PieceTile } from '../components/PieceTile';
import { FAMILY_NAMES } from '../labels';
import styles from './PiecesContent.module.css';

/** Extra detail for pieces whose movement needs more than the one-line summary. */
const NOTES: Partial<Record<PieceType, string>> = {
  pawn: 'Like a chess pawn: one square straight ahead, or two from the pawn row.',
  scout:
    'Two squares diagonally forward from the pawn row, in one direction. Captures only the square straight ahead.',
  sergeant: 'From the pawn row it may step two squares straight or diagonally forward.',
  bastion: 'Moves one or two squares along a rank or file, like a short Rook. It cannot jump.',
  priest: 'Moves one or two squares diagonally, like a short Bishop. It cannot jump.',
  gryphon:
    'Steps one square diagonally (moving or capturing there). If that square is empty it may keep going outward in a straight line — either of the two directions leading away from where it started. It cannot jump.',
  cardinal:
    'Steps one square orthogonally (moving or capturing there). If that square is empty it may keep going outward along a diagonal — either of the two leading away from where it started. It cannot jump.',
  elephant: 'Combines the Knight and Camel jumps.',
  falconer:
    'Jumps to any square exactly two away — straight, diagonal, or a knight’s move — but never to an adjacent square.',
  king: 'As in chess, but there is no castling.',
};

export function PiecesContent() {
  const families = Object.keys(FAMILY_NAMES) as Family[];
  return (
    <div className={styles.pieces}>
      <p className={styles.legend}>
        Diagrams show a White piece on an empty board: <span aria-hidden="true">●</span> moves or
        captures, <span aria-hidden="true">○</span> moves only, <span aria-hidden="true">×</span>{' '}
        captures only.
      </p>
      {families.map((family) => (
        <section key={family} aria-labelledby={`pieces-${family}`}>
          <h3 id={`pieces-${family}`} className={styles.family}>
            {FAMILY_NAMES[family]}
          </h3>
          <PieceGrid>
            {PIECE_DEFINITIONS.filter((d) => d.family === family).map((d) => (
              <PieceTile
                key={d.type}
                type={d.type}
                color="w"
                level={4}
                description={NOTES[d.type] ?? d.summary}
              />
            ))}
          </PieceGrid>
        </section>
      ))}
    </div>
  );
}
