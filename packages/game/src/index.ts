/** Treasure Chess rules engine. Pure TypeScript with no DOM dependencies. */

/** Starting treasury for each player, in gold. */
export const TREASURY = 40;

export const BOARD_SIZE = 8;

export * from './board';
export * from './pieces';
export * from './position';
export * from './movegen';
