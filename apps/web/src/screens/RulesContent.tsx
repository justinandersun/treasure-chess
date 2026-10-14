import { CANNOT_MATE_ALONE, PIECES, type PieceType, TREASURY } from '@treasure-chess/game';
import styles from './RulesContent.module.css';

function listNames(types: Iterable<PieceType>): string {
  const names = [...types].map((t) => PIECES[t].name);
  return `${names.slice(0, -1).join(', ')}, or ${names.at(-1)}`;
}

export function RulesContent() {
  return (
    <div className={styles.rules}>
      <p className={styles.lede}>
        <strong>Draft → Place → Play.</strong> Build an army of chess and fairy pieces, arrange it,
        and play chess on a standard board.
      </p>

      <h3>1. Draft</h3>
      <ul>
        <li>Each player has {TREASURY} points to spend. Unspent points do nothing.</li>
        <li>Buy exactly one King (1 point) and exactly eight infantry to fill the pawn row.</li>
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

      <p className={styles.legend}>
        Every piece, with its movement diagram, is listed under <strong>Pieces</strong> in the
        header.
      </p>
    </div>
  );
}
