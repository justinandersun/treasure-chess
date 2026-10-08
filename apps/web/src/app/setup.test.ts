import { parseDeployment, PRESETS } from '@treasure-chess/game';
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

describe('local setup flow', () => {
  it('runs draft → place → handoff → draft → place → ready → reveal', () => {
    let s = run(initialSetup(), { type: 'use-preset', presetId: 'classic' });
    expect([s.step, s.color]).toEqual(['place', 'w']);
    expect(s.deployments.w).toEqual(CLASSIC.deployment);

    s = run(s, { type: 'lock' });
    expect([s.step, s.color]).toEqual(['handoff', 'b']);
    s = run(s, { type: 'continue' });
    expect([s.step, s.color]).toEqual(['draft', 'b']);
    expect(s.drafts.b).toEqual({});

    s = run(s, { type: 'use-preset', presetId: 'cavalry' }, { type: 'lock' });
    expect(s.step).toBe('ready');
    s = run(s, { type: 'continue' });
    expect(s.step).toBe('reveal');
    expect(s.deployments.w).toEqual(CLASSIC.deployment);
    expect(s.deployments.b).toEqual(PRESETS[1]!.deployment);
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
    expect(run(placing, { type: 'lock' })).toBe(placing);

    const placed = run(placing, {
      type: 'set-deployment',
      deployment: parseDeployment('...KN...', 'PPPPPPPP'),
    });
    expect(run(placed, { type: 'lock' }).step).toBe('handoff');
  });

  it('keeps compatible placements when returning to the draft', () => {
    let s = run(initialSetup(), { type: 'use-preset', presetId: 'classic' });
    s = run(s, { type: 'back-to-draft' });
    expect(s.step).toBe('draft');
    s = run(
      s,
      { type: 'set-draft', draft: { ...s.drafts.w, queen: 0, rook: 2 } },
      { type: 'to-place' },
    );
    expect(s.deployments.w.backRank.join(',')).toBe('rook,knight,bishop,,king,bishop,knight,rook');
  });

  it('adjust-draft applies each change to the latest draft and enforces limits', () => {
    let s = initialSetup();
    for (let i = 0; i < 10; i++)
      s = setupReducer(s, { type: 'adjust-draft', piece: 'pawn', delta: 1 });
    expect(s.drafts.w).toEqual({ pawn: 8 });
    s = run(
      s,
      { type: 'adjust-draft', piece: 'king', delta: 1 },
      { type: 'adjust-draft', piece: 'king', delta: 1 },
    );
    expect(s.drafts.w.king).toBe(1);
    s = run(s, { type: 'adjust-draft', piece: 'pawn', delta: -1 });
    expect(s.drafts.w.pawn).toBe(7);
  });

  it('ignores actions that do not fit the current step', () => {
    const s = initialSetup();
    expect(run(s, { type: 'lock' })).toBe(s);
    expect(run(s, { type: 'continue' })).toBe(s);
    expect(run(s, { type: 'use-preset', presetId: 'nope' })).toBe(s);
  });
});

describe('reloading during setup', () => {
  it('hides a private step behind a handoff and resumes it', () => {
    const placing = run(initialSetup(), { type: 'use-preset', presetId: 'classic' });
    const gated = gateAfterReload(placing);
    expect([gated.step, gated.color, gated.resume]).toEqual(['handoff', 'w', 'place']);
    const resumed = run(gated, { type: 'continue' });
    expect(resumed.step).toBe('place');
    expect(resumed.resume).toBeUndefined();
    expect(resumed.deployments.w).toEqual(placing.deployments.w);
  });

  it('leaves public steps alone', () => {
    const ready = run(
      initialSetup(),
      { type: 'use-preset', presetId: 'classic' },
      { type: 'lock' },
      { type: 'continue' },
      { type: 'use-preset', presetId: 'classic' },
      { type: 'lock' },
    );
    expect(ready.step).toBe('ready');
    expect(gateAfterReload(ready)).toBe(ready);
  });
});
