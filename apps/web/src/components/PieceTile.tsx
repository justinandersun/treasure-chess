import { type Color, PIECES, type PieceType } from '@treasure-chess/game';
import type { ReactNode } from 'react';
import { PieceIcon } from '../pieces/PieceIcon';
import { MoveDiagram } from './MoveDiagram';
import styles from './PieceTile.module.css';

/** A responsive grid of piece tiles. */
export function PieceGrid({ children }: { readonly children: ReactNode }) {
  return <ul className={styles.grid}>{children}</ul>;
}

interface PieceTileProps {
  readonly type: PieceType;
  readonly color: Color;
  /** Heading level for the piece name, to fit the surrounding outline. */
  readonly level?: 3 | 4;
  /** `li` inside a PieceGrid; `div` when shown on its own. */
  readonly as?: 'li' | 'div';
  /** False when the surrounding element already names the piece (e.g. a dialog title). */
  readonly showName?: boolean;
}

/** A piece's name, icon, notation, and cost, over its movement diagram and description. */
export function PieceTile({
  type,
  color,
  level = 3,
  as: Element = 'li',
  showName = true,
}: PieceTileProps) {
  const { name, symbol, cost, summary } = PIECES[type];
  const Heading = level === 3 ? 'h3' : 'h4';
  return (
    <Element className={styles.tile}>
      <div className={styles.head}>
        {showName && <Heading className={styles.name}>{name}</Heading>}
        <span className={styles.meta}>
          <span className={styles.icon} aria-hidden="true">
            <PieceIcon type={type} color={color} />
          </span>
          <span className={styles.symbol}>
            <span className="visually-hidden">Notation </span>
            {symbol}
          </span>
          <span className={styles.cost}>
            {cost}
            <span aria-hidden="true"> {cost === 1 ? 'pt' : 'pts'}</span>
            <span className="visually-hidden"> {cost === 1 ? 'point' : 'points'}</span>
          </span>
        </span>
      </div>
      <MoveDiagram type={type} className={styles.diagram} />
      <p className={styles.description}>{summary}</p>
    </Element>
  );
}
