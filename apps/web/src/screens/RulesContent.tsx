import { CANNOT_MATE_ALONE, PIECES, type PieceType, TREASURY } from '@treasure-chess/game';
import { Button } from '../components/Button';
import styles from './RulesContent.module.css';

function listNames(types: Iterable<PieceType>): string {
  const names = [...types].map((t) => PIECES[t].name);
  return `${names.slice(0, -1).join(', ')}, or ${names.at(-1)}`;
}

export function RulesContent({ onShowPieces }: { readonly onShowPieces: () => void }) {
  return (
    <div className={styles.rules}>
      <p className={styles.lede}>
        Each player builds and places an army and then seeks to checkmate their opponent's king on
        an 8x8 board.
      </p>

      <h3 className="section-label">Draft</h3>
      <ul>
        <li>Each player has up to {TREASURY} points to spend.</li>
        <li>Every army comes with one king (1 point).</li>
        <li>Buy exactly eight infantry for the pawn row.</li>
        <li>
          Buy one to seven more pieces for the king row. You may buy more than one of a piece.
        </li>
        <li>To skip drafting, use a starter army.</li>
      </ul>

      <h3 className="section-label">Place</h3>
      <ul>
        <li>Infantry go on the pawn row. All other pieces go on the king row.</li>
        <li>The king must start on the d- or e-file. King-row squares may stay empty.</li>
        <li>Each player drafts and places in private. Both armies are revealed together.</li>
      </ul>

      <h3 className="section-label">Play</h3>
      <ul>
        <li>White moves first. Standard chess rules apply, including check and checkmate.</li>
        <li>There is no castling, no en passant, and no clock.</li>
        <li>
          Pieces that jump pass over any piece in the way, but must land on an empty square or
          capture.
        </li>
        <li>
          Infantry only move forward. From the pawn row, an infantry piece may move two squares in
          one of its directions if both squares are empty. A two-square move cannot capture.
        </li>
        <li>Select any piece on the board to see how it moves.</li>
      </ul>

      <h3 className="section-label">Promotion</h3>
      <p>
        Infantry that reach the opponent’s king row must promote. Choose any piece type from your
        starting army except the King and infantry, even if every piece of that type has been
        captured.
      </p>

      <h3 className="section-label">End</h3>
      <ul>
        <li>Checkmate wins. Either player may resign at any time.</li>
        <li>
          Stalemate, when the player to move has no legal move but is not in check, is a draw.
        </li>
        <li>
          The player to move may claim a draw when the same position has appeared three times, or
          after 50 moves by each player with no capture or infantry move.
        </li>
        <li>
          The game is a draw automatically after five repetitions, after 75 moves by each player
          with no capture or infantry move, or when neither side can checkmate. For example, a king
          and a lone {listNames(CANNOT_MATE_ALONE)} against a bare king.
        </li>
      </ul>

      <div className={styles.more}>
        <Button onClick={onShowPieces}>
          Pieces <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  );
}
