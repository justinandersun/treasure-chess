import {
  CANNOT_MATE_ALONE,
  type Family,
  PIECE_DEFINITIONS,
  PIECES,
  type PieceType,
  TREASURY,
} from '@treasure-chess/game';
import { MoveDiagram } from '../components/MoveDiagram';
import { PieceIcon } from '../pieces/PieceIcon';
import { FAMILY_NAMES } from './labels';
import styles from './RulesContent.module.css';

/** Extra detail for pieces whose movement needs more than the one-line summary. */
const NOTES: Partial<Record<PieceType, string>> = {
  pawn: 'Like a chess pawn: one square straight ahead, or two from the pawn row.',
  scout:
    'Two squares diagonally forward from the pawn row, in one direction. Captures only the square straight ahead.',
  sergeant: 'From the pawn row it may step two squares straight or diagonally forward.',
  bastion: 'Moves one square, or jumps exactly two, along a rank or file.',
  priest: 'Moves one square, or jumps exactly two, diagonally.',
  gryphon:
    'Steps one square diagonally (moving or capturing there). If that square is empty it may keep going outward in a straight line — either of the two directions leading away from where it started. It cannot jump.',
  cardinal:
    'Steps one square orthogonally (moving or capturing there). If that square is empty it may keep going outward along a diagonal — either of the two leading away from where it started. It cannot jump.',
  elephant: 'Combines the Knight and Camel jumps.',
  falconer:
    'Jumps to any square exactly two away — straight, diagonal, or a knight’s move — but never to an adjacent square.',
  king: 'As in chess, but there is no castling.',
};

function listNames(types: Iterable<PieceType>): string {
  const names = [...types].map((t) => PIECES[t].name);
  return `${names.slice(0, -1).join(', ')}, or ${names.at(-1)}`;
}

export function RulesContent() {
  const families = Object.keys(FAMILY_NAMES) as Family[];
  return (
    <div className={styles.rules}>
      <p className={styles.lede}>
        <strong>Draft → Place → Play.</strong> Build an army of chess and fairy pieces, arrange it,
        and play chess on a standard board.
      </p>

      <h3>1. Draft</h3>
      <ul>
        <li>Each player has {TREASURY} gold. Unspent gold does nothing.</li>
        <li>Buy exactly one King (1 gold) and exactly eight infantry to fill the pawn row.</li>
        <li>Buy between one and seven other pieces for the back rank. Copies are allowed.</li>
      </ul>

      <h3>2. Place</h3>
      <ul>
        <li>Infantry fill the pawn row; everything else goes on the back rank.</li>
        <li>The King starts on the d- or e-file. Back-rank squares may be left empty.</li>
        <li>Players draft and place in private; both armies are revealed together.</li>
      </ul>

      <h3>3. Play</h3>
      <ul>
        <li>White moves first. Normal chess rules apply: check, checkmate, and stalemate.</li>
        <li>There is no castling, no en passant, and no clock.</li>
        <li>
          Pieces that jump may pass over any piece but must land on an empty square or capture.
        </li>
        <li>
          Infantry only move forward. From the pawn row they may move two squares in one of their
          movement directions, if both squares are empty. A two-square move never captures.
        </li>
      </ul>

      <h3>Promotion</h3>
      <p>
        Infantry reaching the far rank must promote to any non-King, non-infantry piece type from
        their side’s starting army — even if all of that type have been captured.
      </p>

      <h3>Winning and drawing</h3>
      <ul>
        <li>Checkmate wins. Either player may resign at any time.</li>
        <li>Stalemate is a draw.</li>
        <li>
          The player to move may claim a draw when the same position has occurred three times, or
          after 50 moves each without a capture or infantry move.
        </li>
        <li>
          The game is drawn automatically after five repetitions, 75 moves each without a capture or
          infantry move, or when checkmate has become impossible — for example King and a lone{' '}
          {listNames(CANNOT_MATE_ALONE)} against a bare King.
        </li>
      </ul>

      <h3>Pieces</h3>
      <p className={styles.legend}>
        Diagrams show a White piece on an empty board: <span aria-hidden="true">●</span> moves or
        captures, <span aria-hidden="true">○</span> moves only, <span aria-hidden="true">×</span>{' '}
        captures only.
      </p>
      {families.map((family) => (
        <section key={family}>
          <h4>{FAMILY_NAMES[family]}</h4>
          <ul className={styles.pieces}>
            {PIECE_DEFINITIONS.filter((d) => d.family === family).map((d) => (
              <li key={d.type} className={styles.piece}>
                <MoveDiagram type={d.type} className={styles.diagram} />
                <div>
                  <div className={styles.name}>
                    <span className={styles.icon} aria-hidden="true">
                      <PieceIcon type={d.type} color="w" />
                    </span>
                    <strong>{d.name}</strong>
                    <span className={styles.meta}>
                      {d.symbol} · {d.cost} gold
                    </span>
                  </div>
                  <p className={styles.summary}>{NOTES[d.type] ?? d.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
