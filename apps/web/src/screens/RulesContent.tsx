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
        Each player builds an army, places it, and then tries to checkmate the opponent’s king on a
        standard 8×8 board.
      </p>

      <h3 className="section-label">Drafting</h3>
      <p>
        Each player has up to {TREASURY} points to spend. Every army comes with a king (1 point),
        exactly eight infantry for the pawn row, and one to seven more pieces for the king row. Each
        draft starts as a starter army, which players can keep, swap for another, or change piece by
        piece.
      </p>

      <h3 className="section-label">Placement</h3>
      <p>
        Infantry go on the pawn row and everything else on the king row, with the king on the d- or
        e-file. King-row squares may stay empty. Players draft and place in private, then both
        armies are revealed together.
      </p>

      <h3 className="section-label">Play</h3>
      <p>
        White moves first, and standard chess rules apply, without castling, en passant, or a clock.
        Pieces that jump pass over anything in their way but must land on an empty square or
        capture. Infantry only move forward: from the pawn row, an infantry piece may move two
        squares in one of its directions if both are empty, but that move cannot capture.
      </p>
      <p>Players can select any piece on the board to see how it moves.</p>

      <h3 className="section-label">Promotion</h3>
      <p>
        Infantry that reach the opponent’s king row must promote, to any piece type from that
        player’s starting army other than the king and infantry.
      </p>

      <h3 className="section-label">Winning</h3>
      <p>
        A player wins by checkmating the opponent’s king. Either player may also resign at any time,
        which gives the other player the win.
      </p>

      <h3 className="section-label">Draws</h3>
      <p>
        The game is a draw by stalemate when the player to move has no legal move but is not in
        check. The player to move may claim a draw after the same position appears three times, or
        after 50 moves by each player with no capture or infantry move. The game is also drawn
        automatically after five repetitions, after 75 moves by each player with no capture or
        infantry move, or when neither side can checkmate. For example, a king and a lone{' '}
        {listNames(CANNOT_MATE_ALONE)} against a bare king.
      </p>

      <div className={styles.more}>
        <Button onClick={onShowPieces}>
          Pieces <span aria-hidden="true">→</span>
        </Button>
      </div>
    </div>
  );
}
