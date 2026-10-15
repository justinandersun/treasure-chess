/** Starter armies with formations: every draft begins as one, and the computer plays one. */

import { type Deployment, parseDeployment } from './army';

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly deployment: Deployment;
}

function preset(id: string, name: string, description: string, back: string, pawns: string) {
  return { id, name, description, deployment: parseDeployment(back, pawns) } satisfies Preset;
}

/** Back rank and pawn row are listed a-file to h-file; "." is an empty square. */
export const PRESETS: readonly Preset[] = [
  preset(
    'classic',
    'Classic',
    'The army every chess player knows by heart',
    'RNBQKBNR',
    'PPPPPPPP',
  ),
  preset(
    'stampede',
    'Stampede',
    'A thundering herd that leaps over every wall',
    'MNEFKENM',
    'PSPSSPSP',
  ),
  preset(
    'bulwark',
    'Bulwark',
    'An unbreakable front line and patient power',
    'TR.OKORT',
    'GGGGGGGG',
  ),
  preset('regency', 'Regency', 'Power gathers around the throne', 'IBOQKFOI', 'PPPPPPPP'),
  preset('conclave', 'Conclave', 'A silent council that strikes from afar', 'ICBQKBCI', 'SSSSSSSS'),
  preset(
    'menagerie',
    'Menagerie',
    'A traveling circus with unpredictable attacks',
    'MYCKF.YM',
    'PGSPPSGP',
  ),
];

export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
