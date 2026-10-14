/**
 * Original piece artwork on a 45×45 grid, as plain data so it can be rendered by React in the app
 * and by the image-generation script. Shapes have one of three kinds:
 *   b — body: filled with the piece color, outlined
 *   l — line detail: stroke only, contrasting with the body
 *   d — dot detail: filled with the contrasting color
 * Each piece is a flat emblem of its name rather than a chess piece with extras. Infantry are
 * figures whose heads count their rank (one, two, or three), the Castle family are siege works and
 * a gryphon, the Cathedral family are holy symbols and mitres, the Cavalry are animal heads, and
 * the Court are crowns and courtiers.
 *
 * Artwork © 2026 Justin Andersun, licensed under CC BY 4.0 (not MIT); see LICENSE-ART.md.
 */

import type { Color, PieceType } from '@treasure-chess/game';

export interface Shape {
  readonly el: 'path' | 'circle' | 'rect' | 'ellipse';
  readonly kind: 'b' | 'l' | 'd';
  readonly attrs: Readonly<Record<string, string | number>>;
}

/** Colors for each side: body fill, outline, and contrasting detail. */
export const PIECE_COLORS: Record<Color, { body: string; edge: string; detail: string }> = {
  w: { body: '#fbfaf7', edge: '#1f1d1a', detail: '#1f1d1a' },
  b: { body: '#2a2724', edge: '#0d0c0b', detail: '#e9e4da' },
};

export const STROKE_WIDTH = 1.5;

const body = (d: string): Shape => ({ el: 'path', kind: 'b', attrs: { d } });
const line = (d: string): Shape => ({ el: 'path', kind: 'l', attrs: { d } });
const dot = (d: string): Shape => ({ el: 'path', kind: 'd', attrs: { d } });
const ball = (cx: number, cy: number, r: number): Shape => ({
  el: 'circle',
  kind: 'b',
  attrs: { cx, cy, r },
});
const eye = (cx: number, cy: number, r = 1.4): Shape => ({
  el: 'circle',
  kind: 'd',
  attrs: { cx, cy, r },
});

/** Infantry: a flared figure under a collar; the heads go on top. */
const FIGURE = body(
  'M10.5,39.5 C10.5,35.5 13.5,34 15.5,32 C18,29.5 18.5,26 19,23.5 L26,23.5 C26.5,26 27,29.5 29.5,32 C31.5,34 34.5,35.5 34.5,39.5 Z',
);
const COLLAR = body('M13,24 C16.5,20.5 19.5,19.5 22.5,19.5 C25.5,19.5 28.5,20.5 32,24 Z');

/** A band with a diamond, worn by crowns and the Cardinal. */
const band = (y: number, left: number, right: number): Shape[] => [
  line(`M${left},${y} C${left + 6},${y - 2.5} ${right - 6},${y - 2.5} ${right},${y}`),
  dot(`M22.5,${y + 1} L25,${y + 2.75} L22.5,${y + 4.5} L20,${y + 2.75} Z`),
];

export const PIECE_ART: Record<PieceType, readonly Shape[]> = {
  pawn: [ball(22.5, 13.5, 6.5), FIGURE, COLLAR],
  scout: [ball(18.5, 14.5, 5.2), ball(26.5, 14.5, 5.2), FIGURE, COLLAR],
  sergeant: [ball(22.5, 8, 4.6), ball(18, 15, 4.6), ball(27, 15, 4.6), FIGURE, COLLAR],

  bastion: [
    body('M17.5,8 L27.5,8 L32,32 L13,32 Z'),
    body('M12,30.5 L33,30.5 L33,34 L12,34 Z'),
    ball(12, 35, 4),
    ball(33, 35, 4),
    dot('M21,15 L24,15 L24,22 C24,23.5 21,23.5 21,22 Z'),
  ],
  rook: [
    body('M14.5,16.5 L30.5,16.5 L31.5,32 L13.5,32 Z'),
    body(
      'M11,6 L15.5,6 L15.5,9.5 L19.5,9.5 L19.5,6 L25.5,6 L25.5,9.5 L29.5,9.5 L29.5,6 L34,6 L34,13.5 L30.5,16.5 L14.5,16.5 L11,13.5 Z',
    ),
    body('M13.5,32 L31.5,32 L35,35 L35.5,39.5 L9.5,39.5 L10,35 Z'),
  ],
  gryphon: [
    body(
      'M22,5 C27,9 33,12.5 35.5,16.5 C36.5,18 38.5,18 39.5,22 L39.5,38 L36.5,40.5 L20.5,40.5 C21,37 23.5,35.5 27,34.5 C28.5,31 27,29.8 22.5,30.8 C19.5,30.6 17.5,32.3 15.5,32.2 C13,32.6 11.3,31.5 10,30 C14.5,30.5 17.5,27.5 20.6,25.3 C18,24.2 16.5,23.7 14.8,23.9 C10.5,25 8.2,27.3 6.8,30 C4.5,27 4.5,22.5 7.7,19.4 C10,17 12.5,16.8 14,16.4 L17.2,13.7 C19.5,12.8 23.5,13 25.8,12.2 C24.5,9 22.2,8 22,5 Z',
    ),
    line('M25.8,12.2 C27.8,15 29.5,18 30.2,20.8'),
    line('M20.6,25.3 C22.5,25.2 24,25 24.8,24.7'),
    eye(19.5, 18.5),
  ],

  priest: [
    body('M22.5,5 L37.5,38.5 L7.5,38.5 Z'),
    dot('M21.32,22.12 A6,6 0 1 0 28.38,29.18 A5,5 0 0 1 21.32,22.12 Z'),
  ],
  bishop: [
    ball(22.5, 7, 2.5),
    body(
      'M22.5,9.5 C27,12.5 31,16 30.5,20.5 C30,23.5 28.5,25 27.5,26.5 L17.5,26.5 C16.5,25 15,23.5 14.5,20.5 C14,16 18,12.5 22.5,9.5 Z',
    ),
    body('M17.5,26.5 L27.5,26.5 L28,30 L17,30 Z'),
    body(
      'M22.5,30 C21.5,33.5 18.5,35.5 14,35.5 L10,35.5 C8,35.5 7,37 7,39 L15.5,39 C19,39 21.5,37 22.5,34.5 C23.5,37 26,39 29.5,39 L38,39 C38,37 37,35.5 35,35.5 L31,35.5 C26.5,35.5 23.5,33.5 22.5,30 Z',
    ),
    line('M22.5,14 L22.5,22.5 M19.5,17.5 L25.5,17.5'),
  ],
  cardinal: [
    ball(22.5, 5, 2.5),
    body(
      'M9,39.5 L10.5,30 L10,21 C10,14.5 15,10.5 22.5,7 C30,10.5 35,14.5 35,21 L34.5,30 L36,39.5 Z',
    ),
    line('M22.5,12.5 L22.5,24.5 M18.5,17 L26.5,17'),
    ...band(30, 10.5, 34.5),
  ],

  camel: [
    body(
      'M35,39.5 C34.5,34 32.5,29 28.5,23.5 C26.5,20.5 25.5,17.5 26.5,14 L28,10.5 L25.5,11.5 C24,11 22.5,11 21,11.5 C17,12 13,12.5 10.5,13.5 C8.5,14.5 8,16.5 9,18 C10,19 11.5,19 13,18.5 C15.5,18.5 18,18.5 19.5,19.5 C19.5,23.5 20,27 21,30 C22,33 21.5,36 20,39.5 Z',
    ),
    eye(21.5, 14.5),
    line('M9.5,16.5 L12.5,16.5'),
  ],
  knight: [
    body(
      'M14,39.5 C14,33.5 16.5,30.5 20,28 C18,27 15.5,27.5 13.5,29 L9.5,26 C9.5,24.5 8.5,24 8.5,22.5 L8.5,19.5 C12.5,16.5 17,14 21,11.5 L23.5,6 L25.5,10 C31.5,12.5 34.5,17.5 34.5,25.5 C34.5,31.5 33.5,35.5 35,39.5 Z',
    ),
    dot('M20,16.5 L23,14.5 L24.5,17 Z'),
    line('M11.5,23 L13,24.5'),
    line('M28.5,15.5 C30,19.5 28.5,23 24.5,25.5'),
  ],
  elephant: [
    body(
      'M15.5,21 C13.5,26 13,30.5 13.5,34.5 C14,37 12,39 9.5,38.5 C7.5,38 7.5,36 9,35.5 C10,36 10.5,35 10.5,33.5 C10,29 10.5,24.5 12,20.5 Z',
    ),
    body(
      'M19.5,39.5 L19.5,33 C16.5,31 14.5,28 14.5,24 C14.5,16.5 19.5,11 26,11 C31,11 35,14 36.5,18.5 L37,30 L35,39.5 Z',
    ),
    body(
      'M26.5,15.5 C31,13 37,14 38.5,19.5 C39.5,24.5 37,29.5 32,31 C29.5,31.5 27.5,30 27.5,27.5 Z',
    ),
    eye(21, 19),
  ],

  consort: [
    body(
      'M13.5,39.5 L13.5,36 L11,34.5 L11.5,32.5 L10,31.5 L11,29.5 L9,28 C8.5,27.5 8.5,27 9,26.5 L11.5,22 C11.5,13.5 16.5,8 24,8 C31.5,8 37,13.5 37,21 L37,39.5 Z',
    ),
    line('M17.5,19.5 C18.5,18.5 20,18.5 21,19.5'),
    line('M11,32 L13.5,31.5'),
  ],
  falconer: [
    body(
      'M15.5,39.5 L15.5,32 C15.5,29 13,27 12.5,24.5 L11,23 C9,23 8,24 7.5,25.5 C7,21.5 9.5,17.5 13,16.5 C16,13.5 20,12.5 24,13 C29,13.5 32,15.5 33.5,18.5 C35.5,23 37.5,30 38.5,39.5 Z',
    ),
    line('M12.5,24.5 C13,22 13.5,20.5 15,19.5'),
    eye(20, 18.5, 1.8),
  ],
  queen: [
    body(
      'M11.5,39 L13,33 C12,27.5 9.5,23.5 7,21 L14,25.5 L16,14.5 L22.5,23.5 L29,14.5 L31,25.5 L38,21 C35.5,23.5 33,27.5 32,33 L33.5,39 Z',
    ),
    ball(7, 20.5, 2.2),
    ball(16, 14, 2.2),
    ball(29, 14, 2.2),
    ball(38, 20.5, 2.2),
    ...band(33, 13, 32),
  ],
  king: [
    body(
      'M21.25,4 L23.75,4 L23.75,7 L26.5,7 L26.5,9.5 L23.75,9.5 L23.75,13.5 L21.25,13.5 L21.25,9.5 L18.5,9.5 L18.5,7 L21.25,7 Z',
    ),
    ball(22.5, 16, 3),
    body(
      'M12,39 L13,32 C9,28.5 7.5,25 8,21.5 C8.5,17 12,14.5 15.5,14.5 C18.5,14.5 21,16.5 22.5,19 C24,16.5 26.5,14.5 29.5,14.5 C33,14.5 36.5,17 37,21.5 C37.5,25 36,28.5 32,32 L33,39 Z',
    ),
    line('M22.5,19 C21,23 21,27 21.5,30.5'),
    ...band(32, 13, 32),
  ],
};
