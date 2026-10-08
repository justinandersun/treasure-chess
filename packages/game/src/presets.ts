/** Ready-made armies with formations, for quick starts and the computer opponent. */

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
    'The orthodox chess army. Spends exactly 40 gold.',
    'RNBQKBNR',
    'PPPPPPPP',
  ),
  preset(
    'cavalry',
    'Cavalry',
    'Every piece jumps: Camels, Knights, Elephants, and a Falconer, screened by quick Scouts.',
    'MNEFKENM',
    'PSPSSPSP',
  ),
  preset(
    'fortress',
    'Fortress',
    'A wall of Sergeants backed by Rooks, Bastions, and two Consorts guarding the King.',
    'TR.OKORT',
    'GGGGGGGG',
  ),
  preset(
    'royal-court',
    'Royal Court',
    'Queen and Falconer lead, with Consorts at the King’s side and clergy on the wings.',
    'IBOQKFOI',
    'PPPPPPPP',
  ),
  preset(
    'cathedral',
    'Cathedral',
    'Diagonal power: Cardinals, Bishops, Priests, and a Queen behind a row of Scouts.',
    'ICBQKBCI',
    'SSSSSSSS',
  ),
  preset(
    'menagerie',
    'Menagerie',
    'Two Gryphons, a Cardinal, a Falconer, and Camels: unusual angles from every square.',
    'MYCKF.YM',
    'PGSPPSGP',
  ),
];

export function findPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}
