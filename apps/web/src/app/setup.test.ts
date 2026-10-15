import { deploymentDraft, parseDeployment, PRESETS } from '@treasure-chess/game';
import { describe, expect, it } from 'vitest';
import {
  gateAfterReload,
  initialSetup,
  type SetupAction,
  setupReducer,
  type SetupState,
} from './setup';

const run = (state: SetupState, ...actions: SetupAction[]) => actions.reduce(setupReducer, state);
const CLASSIC = PRESETS[0]!;
const CAVALRY = PRESETS[1]!;

describe('starting drafts', () => {
  it('starts every draft as the Classic starter army, already placed', () => {
    const s = initialSetup();
    expect(s.drafts.w).toEqual(deploymentDraft(CLASSIC.deployment));
    expect(s.deployments.w).toEqual(CLASSIC.deployment);
    expect(s.drafts.b).toEqual(s.drafts.w);
  });

  it('loads another starter and keeps its formation without leaving the draft', () => {
    const s = run(initialSetup(), { type: 'load-starter', presetId: 'cavalry' });
    expect(s.step).toBe('draft');
    expect(s.drafts.w).toEqual(deploymentDraft(CAVALRY.deployment));
    expect(run(s, { type: 'to-place' }).deployments.w).toEqual(CAVALRY.deployment);
  });

  it('clearing leaves only the King', () => {
    const s = run(initialSetup(), { type: 'set-draft', draft: {} });
    expect(s.drafts.w).toEqual({ king: 1 });
  });
});

describe('local setup flow', () => {
  it('runs draft → place → handoff → draft → place → reveal', () => {
    let s = run(initialSetup(), { type: 'to-place' });
    expect([s.step, s.color]).toEqual(['place', 'w']);
    expect(s.deployments.w).toEqual(CLASSIC.deployment);

    s = run(s, { type: 'lock' });
    expect([s.step, s.color]).toEqual(['handoff', 'b']);
    s = run(s, { type: 'continue' });
    expect([s.step, s.color]).toEqual(['draft', 'b']);

    s = run(
      s,
      { type: 'load-starter', presetId: 'cavalry' },
      { type: 'to-place' },
      { type: 'lock' },
    );
    expect(s.step).toBe('reveal');
    expect(s.deployments.w).toEqual(CLASSIC.deployment);
    expect(s.deployments.b).toEqual(CAVALRY.deployment);
  });

  it('cannot place an invalid draft or lock an incomplete placement', () => {
    const s = run(initialSetup(), { type: 'set-draft', draft: { king: 1, pawn: 8 } });
    expect(run(s, { type: 'to-place' })).toBe(s);

    const placing = run(
      s,
      { type: 'set-draft', draft: { king: 1, pawn: 8, knight: 1 } },
      { type: 'to-place' },
    );
    expect(placing.step).toBe('place');
    const empty = run(placing, {
      type: 'set-deployment',
      deployment: parseDeployment('........', '........'),
    });
    expect(run(empty, { type: 'lock' })).toBe(empty);

    const placed = run(placing, {
      type: 'set-deployment',
      deployment: parseDeployment('...KN...', 'PPPPPPPP'),
    });
    expect(run(placed, { type: 'lock' }).step).toBe('handoff');
  });

  it('keeps compatible placements when returning to the draft', () => {
    let s = run(initialSetup(), { type: 'to-place' }, { type: 'back-to-draft' });
    expect(s.step).toBe('draft');
    s = run(
      s,
      { type: 'set-draft', draft: { ...s.drafts.w, queen: 0, rook: 2 } },
      { type: 'to-place' },
    );
    expect(s.deployments.w.backRank.join(',')).toBe('rook,knight,bishop,,king,bishop,knight,rook');
  });

  it('adjust-draft applies each change to the latest draft and enforces limits', () => {
    let s = run(initialSetup(), { type: 'set-draft', draft: {} });
    for (let i = 0; i < 10; i++)
      s = setupReducer(s, { type: 'adjust-draft', piece: 'pawn', delta: 1 });
    expect(s.drafts.w).toEqual({ king: 1, pawn: 8 });
    s = run(
      s,
      { type: 'adjust-draft', piece: 'king', delta: 1 },
      { type: 'adjust-draft', piece: 'king', delta: -1 },
    );
    expect(s.drafts.w.king).toBe(1); // the King is fixed
    s = run(s, { type: 'adjust-draft', piece: 'pawn', delta: -1 });
    expect(s.drafts.w.pawn).toBe(7);
  });

  it('ignores actions that do not fit the current step', () => {
    const s = initialSetup();
    expect(run(s, { type: 'lock' })).toBe(s);
    expect(run(s, { type: 'continue' })).toBe(s);
    expect(run(s, { type: 'load-starter', presetId: 'nope' })).toBe(s);
    expect(run(s, { type: 'choose-opponent', presetId: 'cavalry' })).toBe(s);
  });
});

describe('reloading during setup', () => {
  it('hides a private step behind a handoff and resumes it', () => {
    const placing = run(initialSetup(), { type: 'to-place' });
    const gated = gateAfterReload(placing);
    expect([gated.step, gated.color, gated.resume]).toEqual(['handoff', 'w', 'place']);
    const resumed = run(gated, { type: 'continue' });
    expect(resumed.step).toBe('place');
    expect(resumed.resume).toBeUndefined();
    expect(resumed.deployments.w).toEqual(placing.deployments.w);
  });

  it('leaves public steps alone', () => {
    const reveal = run(
      initialSetup(),
      { type: 'to-place' },
      { type: 'lock' },
      { type: 'continue' },
      { type: 'to-place' },
      { type: 'lock' },
    );
    expect(reveal.step).toBe('reveal');
    expect(gateAfterReload(reveal)).toBe(reveal);
  });
});

describe('setup against the computer', () => {
  it('gives the computer the chosen starter army, which can be changed before starting', () => {
    let s = run(initialSetup('computer'), { type: 'to-place' });
    s = run(s, { type: 'lock', opponentPresetId: 'cavalry' });
    expect([s.step, s.color]).toEqual(['reveal', 'w']);
    expect(s.deployments.b).toEqual(CAVALRY.deployment);
    expect(s.deployments.w).toEqual(CLASSIC.deployment);

    expect(run(s, { type: 'choose-opponent', presetId: 'nope' })).toBe(s);
    s = run(s, { type: 'choose-opponent', presetId: 'classic' });
    expect(s.deployments.b).toEqual(CLASSIC.deployment);
    expect(s.drafts.b).toEqual(deploymentDraft(CLASSIC.deployment));
  });

  it('does not hide the only player’s army after a reload', () => {
    const placing = run(initialSetup('computer'), { type: 'to-place' });
    expect(gateAfterReload(placing)).toBe(placing);
  });
});
