import {
  algebraicHistory,
  type Color,
  type GameState,
  moveHistory,
  PIECES,
  type PieceType,
} from '@treasure-chess/game';
import { useEffect, useMemo, useRef } from 'react';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './Play.module.css';

interface Entry {
  readonly piece: PieceType;
  readonly color: Color;
  /** The notation without the moving piece's letter, which the icon replaces. */
  readonly rest: string;
}

/** One move: the moving piece's icon, then its destination (and capture, check, or promotion). */
function MoveText({ entry }: { readonly entry: Entry }) {
  return (
    <span className={styles.move}>
      <span className={styles.moveIcon} aria-hidden="true">
        <PieceIcon type={entry.piece} color={entry.color} />
      </span>
      <span className="visually-hidden">{PIECES[entry.piece].name} </span>
      {entry.rest}
    </span>
  );
}

/** Numbered move list ("1. ♙e4 ♙e5"), scrolled to the latest move. */
export function MoveHistory({ game }: { readonly game: GameState }) {
  const entries = useMemo(() => {
    const text = algebraicHistory(game);
    return moveHistory(game).map((move, i): Entry => {
      const san = text[i] ?? '';
      // Most moves start with the piece's letter ("Ye4", "Gce5"); pawn moves have none ("e4").
      const { symbol } = PIECES[move.piece];
      const rest = san.startsWith(symbol) ? san.slice(1) : san;
      return { piece: move.piece, color: i % 2 === 0 ? 'w' : 'b', rest };
    });
  }, [game]);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [entries.length]);

  if (entries.length === 0) return <p className={styles.noMoves}>No moves yet.</p>;
  const pairs: [Entry, Entry | undefined][] = [];
  for (let i = 0; i < entries.length; i += 2) pairs.push([entries[i]!, entries[i + 1]]);
  return (
    <ol ref={listRef} className={styles.history} aria-label="Moves played">
      {pairs.map(([white, black], i) => (
        <li key={i}>
          <span className={styles.moveNumber}>{i + 1}.</span>
          <MoveText entry={white} />
          {black ? <MoveText entry={black} /> : <span />}
        </li>
      ))}
    </ol>
  );
}
