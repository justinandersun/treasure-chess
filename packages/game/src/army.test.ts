import { describe, expect, it } from 'vitest';
import {
  armyPromotionTypes,
  type ArmyDraft,
  createGameFromArmies,
  deploymentDraft,
  draftCost,
  formatDeployment,
  isValidArmy,
  KING_FILES,
  parseDeployment,
  randomDeployment,
  setupPosition,
  validateDeployment,
  validateDraft,
} from './army';
import { formatPosition } from './position';
import { createRng } from './rng';

const CLASSIC = parseDeployment('RNBQKBNR', 'PPPPPPPP');
const CLASSIC_DRAFT: ArmyDraft = { rook: 2, knight: 2, bishop: 2, queen: 1, king: 1, pawn: 8 };

const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

describe('drafting', () => {
  it('prices the classic army at exactly 40 gold', () => {
    expect(draftCost(CLASSIC_DRAFT)).toBe(40);
    expect(validateDraft(CLASSIC_DRAFT)).toEqual([]);
  });

  it('rejects armies over budget', () => {
    expect(codes(validateDraft({ ...CLASSIC_DRAFT, pawn: 0, sergeant: 8 }))).toEqual([
      'over-budget',
    ]);
  });

  it('requires exactly one King', () => {
    expect(codes(validateDraft({ ...CLASSIC_DRAFT, king: 0 }))).toEqual(['king-count']);
    expect(codes(validateDraft({ pawn: 8, king: 2, knight: 1 }))).toEqual(['king-count']);
  });

  it('requires exactly 8 infantry, in any mix', () => {
    expect(validateDraft({ pawn: 3, scout: 3, sergeant: 2, king: 1, knight: 1 })).toEqual([]);
    expect(codes(validateDraft({ pawn: 7, king: 1, knight: 1 }))).toEqual(['infantry-count']);
    expect(codes(validateDraft({ pawn: 9, king: 1, knight: 1 }))).toEqual(['infantry-count']);
  });

  it('requires 1 to 7 back-rank pieces besides the King', () => {
    expect(codes(validateDraft({ pawn: 8, king: 1 }))).toEqual(['no-back-rank-piece']);
    expect(codes(validateDraft({ pawn: 8, king: 1, priest: 8 }))).toEqual(['back-rank-overflow']);
    expect(validateDraft({ pawn: 8, king: 1, priest: 7 })).toEqual([]);
  });

  it('allows unspent gold', () => {
    expect(draftCost({ pawn: 8, king: 1, camel: 1 })).toBe(11);
    expect(validateDraft({ pawn: 8, king: 1, camel: 1 })).toEqual([]);
  });

  it('reports every broken rule with a message', () => {
    const issues = validateDraft({ queen: 5 });
    expect(codes(issues)).toEqual(['over-budget', 'king-count', 'infantry-count']);
    for (const issue of issues) expect(issue.message.length).toBeGreaterThan(0);
  });
});

describe('deployment', () => {
  it('accepts the classic formation', () => {
    expect(validateDeployment(CLASSIC, CLASSIC_DRAFT)).toEqual([]);
    expect(isValidArmy(CLASSIC)).toBe(true);
    expect(deploymentDraft(CLASSIC)).toEqual(CLASSIC_DRAFT);
  });

  it('allows empty back-rank squares', () => {
    expect(isValidArmy(parseDeployment('...K.N..', 'PPPPPPPP'))).toBe(true);
  });

  it('requires the King on the d- or e-file', () => {
    expect(isValidArmy(parseDeployment('RNBKQBNR', 'PPPPPPPP'))).toBe(true);
    expect(codes(validateDeployment(parseDeployment('RNKQBBNR', 'PPPPPPPP')))).toEqual([
      'king-file',
    ]);
  });

  it('keeps infantry on the pawn row and other pieces on the back rank', () => {
    expect(codes(validateDeployment(parseDeployment('RNBQKBNR', 'PPPPPPP.')))).toEqual([
      'pawn-row-incomplete',
    ]);
    expect(codes(validateDeployment(parseDeployment('RNBQKBSR', 'PPPPPPPN')))).toEqual([
      'piece-on-pawn-row',
      'infantry-on-back-rank',
    ]);
  });

  it('must use exactly the drafted pieces', () => {
    const swapped = parseDeployment('RNBQKBNN', 'PPPPPPPP');
    expect(codes(validateDeployment(swapped, CLASSIC_DRAFT))).toEqual(['pieces-differ']);
  });

  it('rejects ranks of the wrong size', () => {
    expect(codes(validateDeployment({ backRank: [], pawnRow: [] }))).toEqual(['wrong-size']);
  });

  it('parses and formats compact deployments', () => {
    expect(formatDeployment(parseDeployment('MYCKF1YM', 'PGSPPSGP'))).toEqual([
      'MYCKF.YM',
      'PGSPPSGP',
    ]);
    expect(() => parseDeployment('RNBQKBNX', 'PPPPPPPP')).toThrow(/Unknown/);
    expect(() => parseDeployment('RNBQ', 'PPPPPPPP')).toThrow(/8 characters/);
  });
});

describe('random deployment', () => {
  const DRAFT: ArmyDraft = { pawn: 4, scout: 2, sergeant: 2, king: 1, gryphon: 1, camel: 2 };

  it('always produces a valid placement of exactly the drafted pieces', () => {
    const kingFiles = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const d = randomDeployment(DRAFT, createRng(seed));
      expect(validateDeployment(d, DRAFT)).toEqual([]);
      kingFiles.add(d.backRank.indexOf('king'));
    }
    expect([...kingFiles].sort()).toEqual([...KING_FILES]);
  });

  it('is reproducible for the same seed', () => {
    expect(randomDeployment(DRAFT, createRng(42))).toEqual(randomDeployment(DRAFT, createRng(42)));
  });

  it('refuses invalid drafts', () => {
    expect(() => randomDeployment({ pawn: 8, king: 1 }, createRng(1))).toThrow(/Invalid draft/);
  });
});

describe('starting a game', () => {
  it('two classic armies give the standard chess position', () => {
    expect(formatPosition(setupPosition(CLASSIC, CLASSIC))).toBe(
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w',
    );
  });

  it('uses absolute files for both sides', () => {
    const white = parseDeployment('...K.N..', 'SSSSGGGG');
    const black = parseDeployment('..YQK...', 'PPPPPPPP');
    expect(formatPosition(setupPosition(white, black))).toBe(
      '2yqk3/pppppppp/8/8/8/8/SSSSGGGG/3K1N2 w',
    );
  });

  it('promotion choices come from each starting army', () => {
    const white = parseDeployment('M..KNN..', 'PPPPPPPP');
    expect(armyPromotionTypes(white, CLASSIC)).toEqual({
      w: ['camel', 'knight'],
      b: ['rook', 'bishop', 'knight', 'queen'],
    });
  });

  it('createGameFromArmies validates both armies', () => {
    expect(createGameFromArmies(CLASSIC, CLASSIC).position.turn).toBe('w');
    const tooRich = parseDeployment('QQQQKQQQ', 'PPPPPPPP');
    expect(() => createGameFromArmies(CLASSIC, tooRich)).toThrow(/Black/);
  });
});
