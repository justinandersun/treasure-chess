/**
 * Piece artwork on a 45×45 grid, as plain data so it can be rendered by React in the app and by the
 * image-generation script. Shapes are listed back to front and have one of three kinds:
 *   b — body: filled with the piece color, outlined
 *   l — line detail: stroke only, in the outline color
 *   d — dot detail: filled with the outline color
 * Every piece stands on the same plinth with a shared baseline at y=40. Symmetrical pieces mirror
 * exactly about x=22.5; profile pieces face left. Height tiers: minor pieces top out near y=11,
 * major pieces near y=7, and royals near y=5.
 *
 * Artwork © 2026 Justin Andersun, licensed under CC BY 4.0 (not MIT); see LICENSE-ART.md.
 */

import type { Color, PieceType } from '@treasure-chess/game';

export interface Shape {
  readonly el: 'path' | 'circle' | 'rect' | 'ellipse';
  readonly kind: 'b' | 'l' | 'd';
  readonly attrs: Readonly<Record<string, string | number>>;
}

/** Colors for each side: body fill, outline, and detail (drawn in the outline color). */
export const PIECE_COLORS: Record<Color, { body: string; edge: string; detail: string }> = {
  w: { body: '#f1ece2', edge: '#4a4339', detail: '#4a4339' },
  b: { body: '#5b544b', edge: '#16140f', detail: '#16140f' },
};

export const STROKE_WIDTH = 1.5;

/** The base every piece stands on. */
const PLINTH: Shape = {
  el: 'path',
  kind: 'b',
  attrs: { d: 'M9.5 40 L35.5 40 L35.5 37.5 Q35.5 35.5 33.5 35.5 L11.5 35.5 Q9.5 35.5 9.5 37.5 Z' },
};

/** A second, narrower base that sits on the plinth. */
const BAND: Shape = {
  el: 'rect',
  kind: 'b',
  attrs: { x: 12.5, y: 32, width: 20, height: 3.5, rx: 0.75 },
};

export const PIECE_ART: Record<PieceType, readonly Shape[]> = {
  pawn: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M12.5 35.5 C13 29 17 26 19 23.5 L26 23.5 C28 26 32 29 32.5 35.5 Z' },
    },
    { el: 'rect', kind: 'b', attrs: { x: 14.5, y: 20.5, width: 16, height: 3, rx: 1.5 } },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 15.5, r: 5 } },
  ],
  scout: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M12.5 35.5 C13 29 17 26 19 23.5 L26 23.5 C28 26 32 29 32.5 35.5 Z' },
    },
    { el: 'rect', kind: 'b', attrs: { x: 14.5, y: 20.5, width: 16, height: 3, rx: 1.5 } },
    { el: 'circle', kind: 'b', attrs: { cx: 17.25, cy: 15.5, r: 4.5 } },
    { el: 'circle', kind: 'b', attrs: { cx: 27.75, cy: 15.5, r: 4.5 } },
  ],
  sergeant: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M12.5 35.5 C13 29 17 26 19 23.5 L26 23.5 C28 26 32 29 32.5 35.5 Z' },
    },
    { el: 'rect', kind: 'b', attrs: { x: 14.5, y: 20.5, width: 16, height: 3, rx: 1.5 } },
    { el: 'circle', kind: 'b', attrs: { cx: 17.75, cy: 16.5, r: 4 } },
    { el: 'circle', kind: 'b', attrs: { cx: 27.25, cy: 16.5, r: 4 } },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 11, r: 4 } },
  ],
  bastion: [
    PLINTH,
    { el: 'path', kind: 'b', attrs: { d: 'M14.5 35.5 L17.5 11 L27.5 11 L30.5 35.5 Z' } },
    { el: 'circle', kind: 'b', attrs: { cx: 14.5, cy: 32, r: 3.5 } },
    { el: 'circle', kind: 'b', attrs: { cx: 30.5, cy: 32, r: 3.5 } },
  ],
  rook: [
    PLINTH,
    { el: 'path', kind: 'b', attrs: { d: 'M15.5 17.5 L14.5 35.5 L30.5 35.5 L29.5 17.5 Z' } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M15.5 17.5 L13.5 15.5 L13.5 7 L17 7 L17 9.75 L20.5 9.75 L20.5 7 L24.5 7 L24.5 9.75 L28 9.75 L28 7 L31.5 7 L31.5 15.5 L29.5 17.5 Z',
      },
    },
    BAND,
  ],
  gryphon: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M16.5 35.5 L16.5 32.5 C16.5 29 17.5 26.5 19 25 L10 26.2 C11 24.3 14 23 17 22.5 C14 20.5 11 20.5 9.5 22 L8 24 C7 19 9.5 15.5 14 14.5 C15.5 13 16.5 12 18.5 10.5 C20 9.8 22 9.5 23.5 9.5 L21.5 6.5 C25.5 7.5 29 8.5 30.8 11 C32.3 12.5 33 14 33 16 C33 22 30.5 27 30.5 32.5 L30.5 35.5 Z',
      },
    },
    BAND,
    { el: 'path', kind: 'l', attrs: { d: 'M23.5 9.5 C25.5 11.5 26.5 13.5 27 16' } },
    { el: 'circle', kind: 'd', attrs: { cx: 18.5, cy: 15, r: 1.25 } },
  ],
  priest: [
    PLINTH,
    { el: 'path', kind: 'b', attrs: { d: 'M22.5 11 L33 35.5 L12 35.5 Z' } },
    BAND,
    { el: 'path', kind: 'l', attrs: { d: 'M22.5 22.5 L22.5 29.5 M19.5 25 L25.5 25' } },
  ],
  bishop: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M16 35.5 C14 28 16.5 20 22.5 15 C28.5 20 31 28 29 35.5 Z' },
    },
    BAND,
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 13, r: 2 } },
    { el: 'path', kind: 'l', attrs: { d: 'M22.5 20.5 L22.5 27.5 M19.5 23 L25.5 23' } },
  ],
  cardinal: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M14.5 32 L14.5 14 C14.5 11 16.5 8.5 19 6.5 L22.5 11 L26 6.5 C28.5 8.5 30.5 11 30.5 14 L30.5 32 Z',
      },
    },
    BAND,
    { el: 'path', kind: 'l', attrs: { d: 'M22.5 15.5 L22.5 22.5 M19.5 18 L25.5 18' } },
  ],
  camel: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M16.5 35.5 L16.5 32.5 C17 27 17.5 22 19.5 18.5 C16 18.5 13 19 11 19.8 C10 20.4 8.5 20.6 7.8 20 C7.3 19.5 7.6 18.8 8.3 18.6 L11.5 17.4 L7.2 16.8 C6.5 16.5 6.3 15.8 6.5 15 C6.7 13 7.5 11.5 9.5 10.5 C12.5 9.3 16.5 8.8 19.5 8 C21 7.5 22.5 7.3 24 8 C25 8.4 25.8 9 26.5 9.6 C27.2 8.8 28.6 9 28.8 10.2 C29 11 28.6 11.8 28 12.2 C29.5 14 30.5 17 30.8 21 C31 25 30.5 29 30.5 32.5 L30.5 35.5 Z',
      },
    },
    BAND,
    { el: 'circle', kind: 'd', attrs: { cx: 20, cy: 11.5, r: 1.25 } },
  ],
  knight: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M16.5 35.5 L16.5 32.5 C16.5 28.5 18.5 25.5 21.5 22.5 C19 22 15.5 22.8 13.5 24.5 C12 25.8 10 26 9 25 L10.8 23.3 L8 22.5 C7 20.5 7.8 19 9.5 18 C11.5 16.5 13 15 14.5 12.5 C15.5 11 16.5 9.5 17.5 8.5 L18.5 6.5 L20.5 8.3 C27 8.5 32.5 13.5 33 21 C33.3 26 31 29.5 30.5 32.5 L30.5 35.5 Z',
      },
    },
    BAND,
    { el: 'circle', kind: 'd', attrs: { cx: 18, cy: 13, r: 1.25 } },
  ],
  elephant: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M16.5 35.5 L16.5 32.5 L18 28 C16.5 28 15 27 14.8 25.5 C14 28 14 31 12.5 33 C11 35 7.5 35 6.5 33 C6 31.8 6.8 30.6 8 30.8 C9 31 9.2 29.8 9.2 28.5 L8.8 22 C8.6 17 9.5 13.5 11.5 11 C14 8 18 6.5 22 6.5 C26 6.5 29 8.5 30 12 C31 16 30.5 26 30.5 32.5 L30.5 35.5 Z',
      },
    },
    { el: 'circle', kind: 'd', attrs: { cx: 15, cy: 14.5, r: 1.25 } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M21 11 C26 7.5 34 7.5 36.5 13 C38.5 18 36 25.5 30.5 28.5 C27.5 30 24 29.5 23 27 C21.5 23.5 21.5 19 21 11 Z',
      },
    },
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M17.8 25 C16 30 10.5 31.5 6.2 27.5 C10.5 28.5 14.2 26.5 15.8 23.3 Z' },
    },
  ],
  consort: [PLINTH, { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 21.5, r: 10.5 } }, BAND],
  falconer: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M15 35.5 C14.5 34 14.5 30.5 15 28 L10 26.3 L15.2 23.8 C13.2 22.8 10.8 23 9.2 24.2 L7 26 C6.3 21.5 8.5 18 12.5 16.8 C14 12.5 17.5 10 22 10 C27 10 30.5 13.5 30.5 19 C30.5 25 29.5 31 30 35.5 Z',
      },
    },
    BAND,
    { el: 'circle', kind: 'd', attrs: { cx: 17.5, cy: 16.5, r: 1.25 } },
  ],
  queen: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M14.2 35.5 L8.5 14 L15 23 L15.5 11 L20 22.5 L22.5 9.5 L25 22.5 L29.5 11 L30 23 L36.5 14 L30.8 35.5 Z',
      },
    },
    BAND,
    { el: 'circle', kind: 'b', attrs: { cx: 8.5, cy: 12.3, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 15.5, cy: 9.3, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 7.6, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 29.5, cy: 9.3, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 36.5, cy: 12.3, r: 1.9 } },
  ],
  king: [
    PLINTH,
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M21.5 12 L21.5 8.5 L19.5 8.5 L19.5 6.5 L21.5 6.5 L21.5 4.75 L23.5 4.75 L23.5 6.5 L25.5 6.5 L25.5 8.5 L23.5 8.5 L23.5 12 Z',
      },
    },
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M22.5 19.5 C20 16.5 20 13.5 22.5 11.5 C25 13.5 25 16.5 22.5 19.5 Z' },
    },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M15 35.5 C9 30 8 19.5 11.5 16.5 C15 13.5 20 15 22.5 19 C25 15 30 13.5 33.5 16.5 C37 19.5 36 30 30 35.5 Z',
      },
    },
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M14.6 35.5 L14.2 31.2 C19.5 29.6 25.5 29.6 30.8 31.2 L30.4 35.5 Z' },
    },
    { el: 'path', kind: 'd', attrs: { d: 'M22.5 31.3 L24.6 32.6 L22.5 33.9 L20.4 32.6 Z' } },
  ],
};
