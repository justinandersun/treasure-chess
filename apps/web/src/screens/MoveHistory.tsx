import { algebraicHistory, type GameState } from '@treasure-chess/game';
import { useEffect, useMemo, useRef } from 'react';
import styles from './Play.module.css';

/** Numbered move list ("1. e4 e5"), scrolled to the latest move. */
export function MoveHistory({ game }: { readonly game: GameState }) {
  const moves = useMemo(() => algebraicHistory(game), [game]);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [moves.length]);

  if (moves.length === 0) return <p className={styles.noMoves}>No moves yet.</p>;
  const pairs: [string, string | undefined][] = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i]!, moves[i + 1]]);
  return (
    <ol ref={listRef} className={styles.history} aria-label="Moves played">
      {pairs.map(([white, black], i) => (
        <li key={i}>
          <span className={styles.moveNumber}>{i + 1}.</span>
          <span className={styles.move}>{white}</span>
          <span className={styles.move}>{black ?? ''}</span>
        </li>
      ))}
    </ol>
  );
}
