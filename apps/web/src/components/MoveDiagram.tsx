import { makeSquare, PIECES, type PieceType } from '@treasure-chess/game';
import { useMemo } from 'react';
import { PieceIcon } from '../pieces/PieceIcon';
import styles from './MoveDiagram.module.css';
import { DIAGRAM_SIZE, movementDiagram } from './movementDiagram';

/**
 * A small board showing a piece's moves: ● move or capture, ○ move only, × capture only.
 */
export function MoveDiagram({
  type,
  className,
}: {
  readonly type: PieceType;
  readonly className?: string | undefined;
}) {
  const { origin, marks } = useMemo(() => movementDiagram(type), [type]);
  const cells = [];
  for (let rank = DIAGRAM_SIZE - 1; rank >= 0; rank--) {
    for (let file = 0; file < DIAGRAM_SIZE; file++) {
      const sq = makeSquare(file, rank);
      const mark = marks.get(sq);
      cells.push(
        <div
          key={sq}
          className={[styles.cell, (file + rank) % 2 ? styles.light : styles.dark].join(' ')}
        >
          {sq === origin && <PieceIcon type={type} color="w" />}
          {mark && <span className={styles[mark]} />}
        </div>,
      );
    }
  }
  return (
    <div
      className={[styles.diagram, className].filter(Boolean).join(' ')}
      role="img"
      aria-label={`${PIECES[type].name} movement: ${PIECES[type].summary}`}
    >
      {cells}
    </div>
  );
}
