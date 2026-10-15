/**
 * Generates the static PNG images in public/ from the piece artwork:
 *   og-image.png          1200×630 link-preview image
 *   apple-touch-icon.png  180×180 home-screen icon
 *   favicon.svg           browser-tab icon
 *   icon-192.png, icon-512.png, icon-maskable-512.png   installed-app icons (manifest)
 *
 * Run with `pnpm --filter @treasure-chess/web images` (Node 24+, which runs TypeScript directly).
 * Re-run after changing the piece art, then commit the images.
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import type { Color, PieceType } from '@treasure-chess/game';
import { PIECE_ART, PIECE_COLORS, STROKE_WIDTH } from '../src/pieces/pieceArt.ts';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

const PALETTE = {
  bg: '#f7f5f0',
  fg: '#232220',
  muted: '#69655e',
  accent: '#2b2a27',
  light: '#ebe6dc',
  dark: '#b1a999',
  border: '#e3dfd6',
};
const FONT = 'Inter, Helvetica Neue, Helvetica, Arial, sans-serif';
const DISPLAY_FONT = 'Bricolage Grotesque, Helvetica Neue, Arial, sans-serif';

/** A piece drawn at (x, y) with the given width and height. */
function pieceSvg(type: PieceType, color: Color, x: number, y: number, size: number): string {
  const c = PIECE_COLORS[color];
  const paint = {
    b: `fill="${c.body}" stroke="${c.edge}"`,
    l: `fill="none" stroke="${c.detail}"`,
    d: `fill="${c.detail}"`,
  };
  const shapes = PIECE_ART[type]
    .map((s) => {
      const attrs = Object.entries(s.attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ');
      return `<${s.el} ${attrs} ${paint[s.kind]}/>`;
    })
    .join('');
  return `<g transform="translate(${x} ${y}) scale(${size / 45})" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round" stroke-linecap="round">${shapes}</g>`;
}

type Cell = [PieceType, Color] | null;

/** A small board of `cells` (rows top to bottom) with its top-left corner at (x, y). */
function boardSvg(cells: Cell[][], x: number, y: number, square: number): string {
  const parts: string[] = [];
  cells.forEach((row, r) =>
    row.forEach((cell, c) => {
      const sx = x + c * square;
      const sy = y + r * square;
      const fill = (r + c) % 2 === 0 ? PALETTE.light : PALETTE.dark;
      parts.push(`<rect x="${sx}" y="${sy}" width="${square}" height="${square}" fill="${fill}"/>`);
      if (cell)
        parts.push(
          pieceSvg(cell[0], cell[1], sx + square * 0.06, sy + square * 0.06, square * 0.88),
        );
    }),
  );
  const w = cells[0]!.length * square;
  const h = cells.length * square;
  return `<clipPath id="board"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/></clipPath>
    <g clip-path="url(#board)">${parts.join('')}</g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="${PALETTE.border}" stroke-width="2"/>`;
}

function ogImage(): string {
  const cells: Cell[][] = [
    [
      ['gryphon', 'b'],
      ['falconer', 'b'],
      ['elephant', 'b'],
      ['cardinal', 'b'],
    ],
    [null, ['scout', 'b'], ['sergeant', 'b'], null],
    [null, ['sergeant', 'w'], ['scout', 'w'], null],
    [
      ['cardinal', 'w'],
      ['elephant', 'w'],
      ['falconer', 'w'],
      ['gryphon', 'w'],
    ],
  ];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="${PALETTE.bg}"/>
    <text x="80" y="250" font-family="${DISPLAY_FONT}" font-size="80" font-weight="800" letter-spacing="-2" fill="${PALETTE.fg}">Treasure Chess</text>
    <rect x="82" y="284" width="96" height="2" fill="${PALETTE.accent}"/>
    <text font-family="${FONT}" font-size="34" fill="${PALETTE.muted}">
      <tspan x="80" y="350">A chess game of asymmetric armies.</tspan>
    </text>
    <text x="80" y="480" font-family="${FONT}" font-size="18" letter-spacing="2" fill="${PALETTE.muted}">FREE · NO ACCOUNTS · PLAYS IN YOUR BROWSER</text>
    ${boardSvg(cells, 700, 95, 110)}
  </svg>`;
}

function touchIcon(): string {
  // iOS rounds the corners itself, so the background is full-bleed.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
    <rect width="180" height="180" fill="${PALETTE.dark}"/>
    ${pieceSvg('gryphon', 'w', 12, 10, 156)}
  </svg>`;
}

/**
 * An installed-app icon: the gryphon on a full-bleed dark square. Maskable icons keep the piece
 * inside the central safe zone, since the platform may crop to a circle or rounded square.
 */
function appIcon(size: number, maskable = false): string {
  const piece = size * (maskable ? 0.62 : 0.86);
  const x = (size - piece) / 2;
  const y = (size - piece) / 2 - size * (maskable ? 0.01 : 0.02);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${PALETTE.dark}"/>
    ${pieceSvg('gryphon', 'w', x, y, piece)}
  </svg>`;
}

function favicon(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="6" fill="${PALETTE.dark}"/>
    ${pieceSvg('gryphon', 'w', 2, 2, 28)}
  </svg>`;
}

function render(svg: string, file: string): void {
  const png = new Resvg(svg, { font: { loadSystemFonts: true, defaultFontFamily: 'Helvetica' } })
    .render()
    .asPng();
  writeFileSync(join(PUBLIC_DIR, file), png);
  console.log(`Wrote public/${file} (${png.length.toLocaleString()} bytes)`);
}

render(ogImage(), 'og-image.png');
render(touchIcon(), 'apple-touch-icon.png');
render(appIcon(192), 'icon-192.png');
render(appIcon(512), 'icon-512.png');
render(appIcon(512, true), 'icon-maskable-512.png');
writeFileSync(join(PUBLIC_DIR, 'favicon.svg'), `${favicon().replace(/\s*\n\s*/g, '')}\n`);
console.log('Wrote public/favicon.svg');
