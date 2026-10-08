/**
 * Original piece artwork on a 45×45 grid, as plain data so it can be rendered by React in the app
 * and by the image-generation script. Shapes have one of three kinds:
 *   b — body: filled with the piece color, outlined
 *   l — line detail: stroke only, contrasting with the body
 *   d — dot detail: filled with the contrasting color
 * Family shape language: infantry are small figures, the Rook family are towers, the Bishop family
 * wear clerical hats, the Knight family are animals, and Royalty wear crowns.
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
  b: { body: '#26231f', edge: '#0d0c0b', detail: '#e9e4da' },
};

export const STROKE_WIDTH = 1.5;

const BASE: Shape = {
  el: 'rect',
  kind: 'b',
  attrs: { x: 10, y: 35.5, width: 25, height: 4.5, rx: 1.5 },
};

export const PIECE_ART: Record<PieceType, readonly Shape[]> = {
  pawn: [
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M15,35.5 C15,28 18,24 20,22 L25,22 C27,24 30,28 30,35.5 Z' },
    },
    { el: 'rect', kind: 'b', attrs: { x: 17, y: 19.5, width: 11, height: 3, rx: 1.5 } },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 13.5, r: 5.5 } },
    BASE,
  ],
  scout: [
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M16.5,35.5 C16.5,28 19,24 20.5,22 L24.5,22 C26,24 28.5,28 28.5,35.5 Z' },
    },
    { el: 'rect', kind: 'b', attrs: { x: 17.5, y: 19.5, width: 10, height: 3, rx: 1.5 } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M22.5,5.5 C25,9 28.5,13 28,16.5 C27.5,19 17.5,19 17,16.5 C16.5,13 20,9 22.5,5.5 Z',
      },
    },
    { el: 'path', kind: 'l', attrs: { d: 'M20,30 L22.5,26.5 L25,30' } },
    BASE,
  ],
  sergeant: [
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M14,35.5 C14,28 17.5,24 19.5,22 L25.5,22 C27.5,24 31,28 31,35.5 Z' },
    },
    { el: 'rect', kind: 'b', attrs: { x: 16.5, y: 19.5, width: 12, height: 3, rx: 1.5 } },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 14.5, r: 5.5 } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M16.5,13.5 C16.5,6.5 28.5,6.5 28.5,13.5 L30.5,13.5 L30.5,15.5 L14.5,15.5 L14.5,13.5 Z',
      },
    },
    {
      el: 'path',
      kind: 'l',
      attrs: { d: 'M18.5,29 L22.5,26 L26.5,29 M18.5,32.5 L22.5,29.5 L26.5,32.5' },
    },
    BASE,
  ],
  bastion: [
    { el: 'path', kind: 'b', attrs: { d: 'M12.5,25 L12.5,35.5 L32.5,35.5 L32.5,25 Z' } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M11,25 L11,17 L15.5,17 L15.5,19.5 L20,19.5 L20,17 L25,17 L25,19.5 L29.5,19.5 L29.5,17 L34,17 L34,25 Z',
      },
    },
    {
      el: 'path',
      kind: 'd',
      attrs: { d: 'M19.5,35.5 L19.5,31 C19.5,27 25.5,27 25.5,31 L25.5,35.5 Z' },
    },
    BASE,
  ],
  rook: [
    { el: 'path', kind: 'b', attrs: { d: 'M12.5,35.5 L14,31 L31,31 L32.5,35.5 Z' } },
    { el: 'path', kind: 'b', attrs: { d: 'M15,31 L15.5,17 L29.5,17 L30,31 Z' } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M12,17 L12,9 L16,9 L16,11.5 L20.5,11.5 L20.5,9 L24.5,9 L24.5,11.5 L29,11.5 L29,9 L33,9 L33,17 Z',
      },
    },
    { el: 'path', kind: 'l', attrs: { d: 'M15.5,17 L29.5,17 M15,31 L30,31' } },
    BASE,
  ],
  gryphon: [
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M17,21 C12,16 7,15 3.5,17 C6.5,19 7.5,21 6.5,23.5 C9.5,22.5 11.5,23.5 10.5,26.5 C13,25.5 15,26 17,28 Z',
      },
    },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M28,21 C33,16 38,15 41.5,17 C38.5,19 37.5,21 38.5,23.5 C35.5,22.5 33.5,23.5 34.5,26.5 C32,25.5 30,26 28,28 Z',
      },
    },
    {
      el: 'path',
      kind: 'l',
      attrs: { d: 'M8,19 C11,19.5 13.5,21 15.5,23.5 M10,23.5 C12.5,23.5 14.5,24.5 16,26' },
    },
    {
      el: 'path',
      kind: 'l',
      attrs: { d: 'M37,19 C34,19.5 31.5,21 29.5,23.5 M35,23.5 C32.5,23.5 30.5,24.5 29,26' },
    },
    { el: 'path', kind: 'b', attrs: { d: 'M16.5,35.5 L17,16 L28,16 L28.5,35.5 Z' } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M15.5,16 L15.5,10 L18.75,10 L18.75,12.5 L21.25,12.5 L21.25,10 L23.75,10 L23.75,12.5 L26.25,12.5 L26.25,10 L29.5,10 L29.5,16 Z',
      },
    },
    { el: 'path', kind: 'l', attrs: { d: 'M17,16 L28,16' } },
    BASE,
  ],
  priest: [
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M15,35.5 C15,28 17,22.5 22.5,22.5 C28,22.5 30,28 30,35.5 Z' },
    },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 16.5, r: 5 } },
    { el: 'path', kind: 'b', attrs: { d: 'M17.8,15 C18,10.5 27,10.5 27.2,15 Z' } },
    { el: 'path', kind: 'l', attrs: { d: 'M22.5,26.5 L22.5,33 M20,28.5 L25,28.5' } },
    BASE,
  ],
  bishop: [
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M14,35.5 C16,32 18,30 19,29 L26,29 C27,30 29,32 31,35.5 Z' },
    },
    { el: 'rect', kind: 'b', attrs: { x: 15.5, y: 26, width: 14, height: 3, rx: 1 } },
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M22.5,8.5 C16,13 14,20 16,26 L29,26 C31,20 29,13 22.5,8.5 Z' },
    },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 6.5, r: 2 } },
    { el: 'path', kind: 'l', attrs: { d: 'M25.5,13.5 L20,19.5' } },
    BASE,
  ],
  cardinal: [
    { el: 'path', kind: 'b', attrs: { d: 'M14,35.5 C14,28 17,23 22.5,23 C28,23 31,28 31,35.5 Z' } },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 18.5, r: 4.5 } },
    { el: 'path', kind: 'l', attrs: { d: 'M11,15 L9.5,23 M34,15 L35.5,23' } },
    { el: 'circle', kind: 'b', attrs: { cx: 9.5, cy: 24.5, r: 1.6 } },
    { el: 'circle', kind: 'b', attrs: { cx: 35.5, cy: 24.5, r: 1.6 } },
    { el: 'ellipse', kind: 'b', attrs: { cx: 22.5, cy: 14, rx: 12.5, ry: 3 } },
    { el: 'path', kind: 'b', attrs: { d: 'M17,13.5 C17,7.5 28,7.5 28,13.5 Z' } },
    BASE,
  ],
  camel: [
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M12.5,35.5 L13.5,28 C11.5,27 10.5,25 11,22 C12,20 14,19.5 15,19 C16,15 18,13 20,13 C22,13 24,16 25,19 C27,19.5 28.5,19 29.5,17 L32,11 C33,9.5 35,9 36.5,10 L39,12 C39.5,13 39,14 38,14 L35.5,14 L32.5,22 C32,24 31.5,26 31,28 L32,35.5 L28,35.5 L27.5,29.5 L17.5,29.5 L17,35.5 Z',
      },
    },
    { el: 'circle', kind: 'd', attrs: { cx: 35.2, cy: 11.3, r: 0.9 } },
    BASE,
  ],
  knight: [
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M14,35.5 L31,35.5 C31,29 29,25 28,21.5 C30.5,19.5 32,16 31,12.5 C30,8.5 26,6.5 22,6.5 L20,3.5 L18,7.5 C14.5,9.5 12,13.5 10.5,18 C10,20.5 11.5,22 13.5,21.5 C15.5,21 17.5,19.5 19.5,19 C19.5,25 15.5,29 14,35.5 Z',
      },
    },
    { el: 'circle', kind: 'd', attrs: { cx: 22, cy: 12, r: 1.2 } },
    { el: 'path', kind: 'l', attrs: { d: 'M12.8,18.5 L13.8,17.8' } },
    BASE,
  ],
  elephant: [
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M11.5,35.5 L11.5,24 C11.5,17 16,12 23,12 C30,12 34,16 34.5,21 C35,24 36,27 37.5,30 C38,32 37,33.5 35.5,33 C34.3,32.5 34.3,31 35,30 L33,27 C32,28 31,28.5 30,28.5 L30,35.5 L25.5,35.5 L25.5,29.5 L16.5,29.5 L16.5,35.5 Z',
      },
    },
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M21.5,15.5 C17,16.5 15.5,22 18,25.5 C21,26.5 24.5,24 25,19.5 Z' },
    },
    { el: 'circle', kind: 'd', attrs: { cx: 29.5, cy: 18, r: 1 } },
    { el: 'path', kind: 'l', attrs: { d: 'M31.5,25 L35,26.5' } },
    BASE,
  ],
  consort: [
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M14.5,35.5 C14.5,28 17.5,23 22.5,23 C27.5,23 30.5,28 30.5,35.5 Z' },
    },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 16, r: 5.5 } },
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M16,13 L16,8.5 L19,10.5 L22.5,5 L26,10.5 L29,8.5 L29,13 Z' },
    },
    BASE,
  ],
  falconer: [
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M15,35.5 L30.5,35.5 C30.5,30 29.5,26 28.5,23 C30.5,21 31.5,18 31,15 C30.5,11 27.5,8.5 24,8.5 C20.5,8.5 18,11 17.5,14 L13,16 C12.5,16.5 13,17.5 14,17.3 L17.5,17 C16,21.5 15,26 15,35.5 Z',
      },
    },
    {
      el: 'path',
      kind: 'b',
      attrs: { d: 'M19.5,9.5 L19,4 L22,6.5 L24.5,3 L27,6.5 L30,4 L29.5,9.5 Z' },
    },
    { el: 'circle', kind: 'd', attrs: { cx: 21, cy: 13.3, r: 1.1 } },
    { el: 'path', kind: 'l', attrs: { d: 'M27.5,20 C24.5,24.5 22.5,28.5 22.5,33' } },
    BASE,
  ],
  queen: [
    { el: 'path', kind: 'b', attrs: { d: 'M12,35.5 L13,30 L32,30 L33,35.5 Z' } },
    { el: 'rect', kind: 'b', attrs: { x: 11.5, y: 27, width: 22, height: 3, rx: 1 } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M11.5,27 L10,12.5 L15,21 L16.75,10.5 L20,20.5 L22.5,9.5 L25,20.5 L28.25,10.5 L30,21 L35,12.5 L33.5,27 Z',
      },
    },
    { el: 'circle', kind: 'b', attrs: { cx: 10, cy: 11, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 16.75, cy: 8.8, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 22.5, cy: 7.6, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 28.25, cy: 8.8, r: 1.9 } },
    { el: 'circle', kind: 'b', attrs: { cx: 35, cy: 11, r: 1.9 } },
    BASE,
  ],
  king: [
    { el: 'path', kind: 'b', attrs: { d: 'M12,35.5 L13,30 L32,30 L33,35.5 Z' } },
    { el: 'rect', kind: 'b', attrs: { x: 11.5, y: 27, width: 22, height: 3, rx: 1 } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M12,27 C8.5,22.5 8.5,16.5 13,15.5 C16.5,14.8 19.5,16.5 22.5,20 C25.5,16.5 28.5,14.8 32,15.5 C36.5,16.5 36.5,22.5 33,27 Z',
      },
    },
    { el: 'path', kind: 'b', attrs: { d: 'M19.5,19 C19.5,14 25.5,14 25.5,19 L22.5,21 Z' } },
    {
      el: 'path',
      kind: 'b',
      attrs: {
        d: 'M21.3,4 L23.7,4 L23.7,6.8 L26.3,6.8 L26.3,9.2 L23.7,9.2 L23.7,14.2 L21.3,14.2 L21.3,9.2 L18.7,9.2 L18.7,6.8 L21.3,6.8 Z',
      },
    },
    BASE,
  ],
};
