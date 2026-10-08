/** Army construction (drafting within the treasury) and deployment (placing pieces on the board). */

import { backRank, type Color, makeSquare, pawnRank } from './board';
import { createGame, type GameState } from './game';
import { PIECE_TYPES, PIECES, piece, pieceTypeFromSymbol, type PieceType } from './pieces';
import { emptyBoard, type Position } from './position';
import { promotionTypesFor, type PromotionTypes } from './rules';
import { shuffled } from './rng';

/** Starting treasury for each player, in gold. */
export const TREASURY = 40;

/** Files (0-based) the King may start on: d and e. */
export const KING_FILES: readonly number[] = [3, 4];

/** Number of each piece type purchased. Missing types count as zero. */
export type ArmyDraft = Readonly<Partial<Record<PieceType, number>>>;

/**
 * Where each piece starts, by file (index 0 = a-file … 7 = h-file). Files are absolute, so a King
 * on index 4 starts on e1 for White and e8 for Black.
 */
export interface Deployment {
  readonly backRank: readonly (PieceType | null)[];
  readonly pawnRow: readonly (PieceType | null)[];
}

export interface Issue<Code extends string> {
  readonly code: Code;
  readonly message: string;
}

export type DraftIssueCode =
  'over-budget' | 'king-count' | 'infantry-count' | 'no-back-rank-piece' | 'back-rank-overflow';

export type DeploymentIssueCode =
  | 'wrong-size'
  | 'pieces-differ'
  | 'pawn-row-incomplete'
  | 'infantry-on-back-rank'
  | 'piece-on-pawn-row'
  | 'king-file';

export type DraftIssue = Issue<DraftIssueCode>;
export type DeploymentIssue = Issue<DeploymentIssueCode>;

const isInfantry = (type: PieceType) => PIECES[type].family === 'infantry';
const isOfficer = (type: PieceType) => !isInfantry(type) && !PIECES[type].royal;

function countOf(draft: ArmyDraft, type: PieceType): number {
  return draft[type] ?? 0;
}

function sumCounts(draft: ArmyDraft, predicate: (type: PieceType) => boolean): number {
  return PIECE_TYPES.filter(predicate).reduce((n, t) => n + countOf(draft, t), 0);
}

export function draftCost(draft: ArmyDraft): number {
  return PIECE_TYPES.reduce((gold, t) => gold + countOf(draft, t) * PIECES[t].cost, 0);
}

/** Why another piece of `type` cannot be added to the draft, or null if it can. */
export type AddBlocker = 'budget' | 'king-limit' | 'pawn-row-full' | 'back-rank-full';

export function addBlocker(draft: ArmyDraft, type: PieceType): AddBlocker | null {
  if (draftCost(draft) + PIECES[type].cost > TREASURY) return 'budget';
  if (PIECES[type].royal) return countOf(draft, type) >= 1 ? 'king-limit' : null;
  if (isInfantry(type)) return sumCounts(draft, isInfantry) >= 8 ? 'pawn-row-full' : null;
  return sumCounts(draft, isOfficer) >= 7 ? 'back-rank-full' : null;
}

/** Number of drafted infantry (pawn row) and non-King back-rank pieces. */
export function draftSlots(draft: ArmyDraft): { infantry: number; backRank: number } {
  return { infantry: sumCounts(draft, isInfantry), backRank: sumCounts(draft, isOfficer) };
}

/** A copy of `draft` with `delta` more of `type` (never below zero). */
export function adjustDraft(draft: ArmyDraft, type: PieceType, delta: number): ArmyDraft {
  const next = { ...draft, [type]: Math.max(0, countOf(draft, type) + delta) };
  if (next[type] === 0) delete next[type];
  return next;
}

/** Every army-construction rule the draft breaks; empty when the draft is valid. */
export function validateDraft(draft: ArmyDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const cost = draftCost(draft);
  if (cost > TREASURY) {
    issues.push({
      code: 'over-budget',
      message: `Costs ${cost} gold; the treasury is ${TREASURY}.`,
    });
  }
  const kings = countOf(draft, 'king');
  if (kings !== 1) {
    issues.push({ code: 'king-count', message: `Needs exactly one King (has ${kings}).` });
  }
  const infantry = sumCounts(draft, isInfantry);
  if (infantry !== 8) {
    issues.push({
      code: 'infantry-count',
      message: `Needs exactly 8 infantry to fill the pawn row (has ${infantry}).`,
    });
  }
  const officers = sumCounts(draft, isOfficer);
  if (officers < 1) {
    issues.push({
      code: 'no-back-rank-piece',
      message: 'Needs at least one back-rank piece besides the King.',
    });
  } else if (officers > 7) {
    issues.push({
      code: 'back-rank-overflow',
      message: `The back rank has room for 7 pieces besides the King (has ${officers}).`,
    });
  }
  return issues;
}

/** The pieces a deployment uses, as a draft. */
export function deploymentDraft(deployment: Deployment): ArmyDraft {
  const draft: Partial<Record<PieceType, number>> = {};
  for (const type of [...deployment.backRank, ...deployment.pawnRow]) {
    if (type) draft[type] = (draft[type] ?? 0) + 1;
  }
  return draft;
}

function sameDraft(a: ArmyDraft, b: ArmyDraft): boolean {
  return PIECE_TYPES.every((t) => countOf(a, t) === countOf(b, t));
}

/**
 * Every placement rule the deployment breaks; empty when it is valid. With `draft`, also checks the
 * deployment uses exactly the drafted pieces. Army-construction rules are checked separately by
 * {@link validateDraft}.
 */
export function validateDeployment(deployment: Deployment, draft?: ArmyDraft): DeploymentIssue[] {
  const { backRank, pawnRow } = deployment;
  if (backRank.length !== 8 || pawnRow.length !== 8) {
    return [{ code: 'wrong-size', message: 'Each rank must have exactly 8 files.' }];
  }
  const issues: DeploymentIssue[] = [];
  if (draft && !sameDraft(draft, deploymentDraft(deployment))) {
    issues.push({ code: 'pieces-differ', message: 'Place exactly the pieces you drafted.' });
  }
  if (pawnRow.some((t) => t === null)) {
    issues.push({ code: 'pawn-row-incomplete', message: 'Fill every square of the pawn row.' });
  }
  if (pawnRow.some((t) => t !== null && !isInfantry(t))) {
    issues.push({ code: 'piece-on-pawn-row', message: 'Only infantry may stand on the pawn row.' });
  }
  if (backRank.some((t) => t !== null && isInfantry(t))) {
    issues.push({ code: 'infantry-on-back-rank', message: 'Infantry must stand on the pawn row.' });
  }
  const kingFiles = backRank.flatMap((t, file) => (t === 'king' ? [file] : []));
  if (kingFiles.length === 1 && !KING_FILES.includes(kingFiles[0]!)) {
    issues.push({ code: 'king-file', message: 'The King must start on the d- or e-file.' });
  }
  return issues;
}

/** Whether the deployment is a complete, legal army. */
export function isValidArmy(deployment: Deployment): boolean {
  return (
    validateDraft(deploymentDraft(deployment)).length === 0 &&
    validateDeployment(deployment).length === 0
  );
}

/** A random legal placement of a valid draft. Throws if the draft is invalid. */
export function randomDeployment(draft: ArmyDraft, random: () => number): Deployment {
  const issues = validateDraft(draft);
  if (issues.length > 0) throw new Error(`Invalid draft: ${issues[0]!.message}`);
  const expand = (predicate: (t: PieceType) => boolean) =>
    PIECE_TYPES.filter(predicate).flatMap((t) => new Array<PieceType>(countOf(draft, t)).fill(t));

  const kingFile = KING_FILES[Math.floor(random() * KING_FILES.length)]!;
  const backRank: (PieceType | null)[] = new Array<PieceType | null>(8).fill(null);
  backRank[kingFile] = 'king';
  const openFiles = shuffled(
    [0, 1, 2, 3, 4, 5, 6, 7].filter((f) => f !== kingFile),
    random,
  );
  expand(isOfficer).forEach((type, i) => {
    backRank[openFiles[i]!] = type;
  });
  return { backRank, pawnRow: shuffled(expand(isInfantry), random) };
}

/** Builds the starting position from both armies, White to move. */
export function setupPosition(white: Deployment, black: Deployment): Position {
  const board = emptyBoard();
  const place = (deployment: Deployment, color: Color) => {
    deployment.backRank.forEach((type, file) => {
      if (type) board[makeSquare(file, backRank(color))] = piece(type, color);
    });
    deployment.pawnRow.forEach((type, file) => {
      if (type) board[makeSquare(file, pawnRank(color))] = piece(type, color);
    });
  };
  place(white, 'w');
  place(black, 'b');
  return { board, turn: 'w' };
}

/** Promotion choices: each side's non-royal back-rank piece types from its starting army. */
export function armyPromotionTypes(white: Deployment, black: Deployment): PromotionTypes {
  const types = (d: Deployment) => d.backRank.filter((t): t is PieceType => t !== null);
  return { w: promotionTypesFor(types(white)), b: promotionTypesFor(types(black)) };
}

/** Starts a game between two valid armies. Throws if either army is invalid. */
export function createGameFromArmies(white: Deployment, black: Deployment): GameState {
  for (const [name, army] of [
    ['White', white],
    ['Black', black],
  ] as const) {
    if (!isValidArmy(army)) throw new Error(`${name}'s army is not valid`);
  }
  return createGame({
    position: setupPosition(white, black),
    promotionTypes: armyPromotionTypes(white, black),
  });
}

/**
 * Parses a compact deployment: back rank and pawn row as 8-character strings of piece symbols,
 * a-file first, with "." or "1" for an empty square. E.g. `parseDeployment('RNBQKBNR', 'PPPPPPPP')`.
 */
export function parseDeployment(back: string, pawns: string): Deployment {
  const parseRow = (row: string): (PieceType | null)[] => {
    if (row.length !== 8) throw new Error(`Row must have 8 characters: "${row}"`);
    return [...row].map((ch) => {
      if (ch === '.' || ch === '1') return null;
      const type = pieceTypeFromSymbol(ch);
      if (!type) throw new Error(`Unknown piece symbol "${ch}" in "${row}"`);
      return type;
    });
  };
  return { backRank: parseRow(back), pawnRow: parseRow(pawns) };
}

/** Inverse of {@link parseDeployment}, using "." for empty squares. */
export function formatDeployment(deployment: Deployment): [back: string, pawns: string] {
  const row = (types: readonly (PieceType | null)[]) =>
    types.map((t) => (t ? PIECES[t].symbol : '.')).join('');
  return [row(deployment.backRank), row(deployment.pawnRow)];
}
