/**
 * Piece catalog: the single source of truth for every piece's name, symbol, cost, and movement.
 * Move generation, rules diagrams, and evaluation all derive from these definitions.
 */

import type { Color } from './board';

/** [files, ranks]. For infantry, positive ranks mean "forward" for the moving side. */
export type Vector = readonly [df: number, dr: number];

export type MoveComponent =
  /** Jumps directly to each offset, ignoring intervening pieces. */
  | { readonly kind: 'leap'; readonly offsets: readonly Vector[] }
  /** Slides any distance along each direction until blocked. */
  | { readonly kind: 'slide'; readonly directions: readonly Vector[] }
  /**
   * Takes one `step` (moving or capturing there), then — only if that square is empty — may
   * continue sliding along any of `slides` from the turning square.
   */
  | {
      readonly kind: 'bent';
      readonly paths: readonly { readonly step: Vector; readonly slides: readonly Vector[] }[];
    }
  /**
   * Forward-only pawn movement. `moves` go to empty squares only; `captures` require an enemy;
   * `doubleMoves` are two empty steps in one direction, allowed only from the pawn row.
   */
  | {
      readonly kind: 'infantry';
      readonly moves: readonly Vector[];
      readonly captures: readonly Vector[];
      readonly doubleMoves: readonly Vector[];
    };

export type PieceType =
  | 'pawn'
  | 'scout'
  | 'sergeant'
  | 'bastion'
  | 'rook'
  | 'gryphon'
  | 'priest'
  | 'bishop'
  | 'cardinal'
  | 'camel'
  | 'knight'
  | 'elephant'
  | 'consort'
  | 'falconer'
  | 'queen'
  | 'king';

export type Family = 'infantry' | 'rook' | 'bishop' | 'knight' | 'royalty';

export interface PieceDefinition {
  readonly type: PieceType;
  readonly name: string;
  /** Unique uppercase notation letter. */
  readonly symbol: string;
  readonly family: Family;
  /** Gold cost when drafting. */
  readonly cost: number;
  /** Royal pieces may not be captured or left in check. */
  readonly royal: boolean;
  readonly movement: readonly MoveComponent[];
  /** Short human-readable movement description. */
  readonly summary: string;
}

/** Every distinct vector obtained from (a, b) by sign changes and swapping the axes. */
export function symmetricVectors(a: number, b: number): Vector[] {
  const seen = new Set<string>();
  const result: Vector[] = [];
  for (const [x, y] of [
    [a, b],
    [b, a],
  ] as const) {
    for (const sx of [1, -1]) {
      for (const sy of [1, -1]) {
        const v: Vector = [x * sx, y * sy];
        const key = `${v[0]},${v[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(v);
        }
      }
    }
  }
  return result;
}

const ORTHOGONAL = symmetricVectors(1, 0);
const DIAGONAL = symmetricVectors(1, 1);
const ADJACENT = [...ORTHOGONAL, ...DIAGONAL];
const KNIGHT = symmetricVectors(1, 2);
const CAMEL = symmetricVectors(1, 3);

/** One diagonal step, then outward along either orthogonal that continues away from the start. */
const GRYPHON_PATHS = DIAGONAL.map(([x, y]) => ({
  step: [x, y] as Vector,
  slides: [
    [x, 0],
    [0, y],
  ] as Vector[],
}));

/** One orthogonal step, then outward along either diagonal that continues away from the start. */
const CARDINAL_PATHS = ORTHOGONAL.map(([x, y]) => ({
  step: [x, y] as Vector,
  slides: (x === 0
    ? [
        [1, y],
        [-1, y],
      ]
    : [
        [x, 1],
        [x, -1],
      ]) as Vector[],
}));

const FORWARD: Vector = [0, 1];
const FORWARD_DIAGONALS: Vector[] = [
  [-1, 1],
  [1, 1],
];
const ALL_FORWARD: Vector[] = [FORWARD, ...FORWARD_DIAGONALS];

function define(def: PieceDefinition): PieceDefinition {
  return def;
}

/** Catalog in spec order (grouped by family). */
export const PIECE_DEFINITIONS: readonly PieceDefinition[] = [
  define({
    type: 'pawn',
    name: 'Pawn',
    symbol: 'P',
    family: 'infantry',
    cost: 1,
    royal: false,
    movement: [
      { kind: 'infantry', moves: [FORWARD], captures: FORWARD_DIAGONALS, doubleMoves: [FORWARD] },
    ],
    summary: 'Moves straight forward; captures diagonally forward.',
  }),
  define({
    type: 'scout',
    name: 'Scout',
    symbol: 'S',
    family: 'infantry',
    cost: 1,
    royal: false,
    movement: [
      {
        kind: 'infantry',
        moves: FORWARD_DIAGONALS,
        captures: [FORWARD],
        doubleMoves: FORWARD_DIAGONALS,
      },
    ],
    summary: 'Moves diagonally forward; captures straight forward.',
  }),
  define({
    type: 'sergeant',
    name: 'Sergeant',
    symbol: 'G',
    family: 'infantry',
    cost: 2,
    royal: false,
    movement: [
      { kind: 'infantry', moves: ALL_FORWARD, captures: ALL_FORWARD, doubleMoves: ALL_FORWARD },
    ],
    summary: 'Moves and captures one square in any forward direction.',
  }),
  define({
    type: 'bastion',
    name: 'Bastion',
    symbol: 'T',
    family: 'rook',
    cost: 3,
    royal: false,
    movement: [{ kind: 'leap', offsets: [...ORTHOGONAL, ...symmetricVectors(2, 0)] }],
    summary: 'One or two squares orthogonally; can jump.',
  }),
  define({
    type: 'rook',
    name: 'Rook',
    symbol: 'R',
    family: 'rook',
    cost: 5,
    royal: false,
    movement: [{ kind: 'slide', directions: ORTHOGONAL }],
    summary: 'Any distance orthogonally.',
  }),
  define({
    type: 'gryphon',
    name: 'Gryphon',
    symbol: 'Y',
    family: 'rook',
    cost: 6,
    royal: false,
    movement: [{ kind: 'bent', paths: GRYPHON_PATHS }],
    summary: 'One diagonal step, then may continue outward orthogonally any distance.',
  }),
  define({
    type: 'priest',
    name: 'Priest',
    symbol: 'I',
    family: 'bishop',
    cost: 2,
    royal: false,
    movement: [{ kind: 'leap', offsets: [...DIAGONAL, ...symmetricVectors(2, 2)] }],
    summary: 'One or two squares diagonally; can jump.',
  }),
  define({
    type: 'bishop',
    name: 'Bishop',
    symbol: 'B',
    family: 'bishop',
    cost: 3,
    royal: false,
    movement: [{ kind: 'slide', directions: DIAGONAL }],
    summary: 'Any distance diagonally.',
  }),
  define({
    type: 'cardinal',
    name: 'Cardinal',
    symbol: 'C',
    family: 'bishop',
    cost: 5,
    royal: false,
    movement: [{ kind: 'bent', paths: CARDINAL_PATHS }],
    summary: 'One orthogonal step, then may continue outward diagonally any distance.',
  }),
  define({
    type: 'camel',
    name: 'Camel',
    symbol: 'M',
    family: 'knight',
    cost: 2,
    royal: false,
    movement: [{ kind: 'leap', offsets: CAMEL }],
    summary: 'Jumps one square one way and three the other.',
  }),
  define({
    type: 'knight',
    name: 'Knight',
    symbol: 'N',
    family: 'knight',
    cost: 3,
    royal: false,
    movement: [{ kind: 'leap', offsets: KNIGHT }],
    summary: 'Jumps one square one way and two the other.',
  }),
  define({
    type: 'elephant',
    name: 'Elephant',
    symbol: 'E',
    family: 'knight',
    cost: 6,
    royal: false,
    movement: [{ kind: 'leap', offsets: [...KNIGHT, ...CAMEL] }],
    summary: 'Jumps like a Knight or a Camel.',
  }),
  define({
    type: 'consort',
    name: 'Consort',
    symbol: 'O',
    family: 'royalty',
    cost: 3,
    royal: false,
    movement: [{ kind: 'leap', offsets: ADJACENT }],
    summary: 'One square in any direction.',
  }),
  define({
    type: 'falconer',
    name: 'Falconer',
    symbol: 'F',
    family: 'royalty',
    cost: 8,
    royal: false,
    movement: [
      {
        kind: 'leap',
        offsets: [...symmetricVectors(2, 0), ...KNIGHT, ...symmetricVectors(2, 2)],
      },
    ],
    summary: 'Jumps to any square exactly two away: orthogonally, diagonally, or knightwise.',
  }),
  define({
    type: 'queen',
    name: 'Queen',
    symbol: 'Q',
    family: 'royalty',
    cost: 9,
    royal: false,
    movement: [{ kind: 'slide', directions: ADJACENT }],
    summary: 'Any distance orthogonally or diagonally.',
  }),
  define({
    type: 'king',
    name: 'King',
    symbol: 'K',
    family: 'royalty',
    cost: 1,
    royal: true,
    movement: [{ kind: 'leap', offsets: ADJACENT }],
    summary: 'One square in any direction. Cannot castle.',
  }),
];

export const PIECE_TYPES: readonly PieceType[] = PIECE_DEFINITIONS.map((d) => d.type);

export const PIECES = Object.fromEntries(PIECE_DEFINITIONS.map((d) => [d.type, d])) as Record<
  PieceType,
  PieceDefinition
>;

const TYPE_BY_SYMBOL = new Map(PIECE_DEFINITIONS.map((d) => [d.symbol, d.type]));

export function pieceTypeFromSymbol(symbol: string): PieceType | undefined {
  return TYPE_BY_SYMBOL.get(symbol.toUpperCase());
}

export interface Piece {
  readonly type: PieceType;
  readonly color: Color;
}

const PIECE_CACHE = new Map<string, Piece>();

/** Interned piece value: the same object is returned for the same type and color. */
export function piece(type: PieceType, color: Color): Piece {
  const key = `${color}${type}`;
  let p = PIECE_CACHE.get(key);
  if (!p) {
    p = Object.freeze({ type, color });
    PIECE_CACHE.set(key, p);
  }
  return p;
}
