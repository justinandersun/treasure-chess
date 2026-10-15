/**
 * Computer difficulty levels, as search settings. Weaker levels look less far ahead and choose
 * among near-best moves (see SearchOptions.margin), so they make plausible mistakes rather than
 * random ones, and never miss a forced mate the search can see.
 */

import type { SearchOptions } from './search';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export const DIFFICULTIES: readonly Difficulty[] = ['beginner', 'intermediate', 'advanced'];

export const DIFFICULTY_SEARCH: Record<Difficulty, SearchOptions> = {
  beginner: { maxDepth: 2, timeMs: 300, margin: 150 },
  intermediate: { maxDepth: 3, timeMs: 600, margin: 40 },
  advanced: { timeMs: 1000 },
};
