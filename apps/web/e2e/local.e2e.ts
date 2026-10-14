import { expect, test } from '@playwright/test';
import { move, movesList, startLocalGame, startNewGame, usePreset } from './helpers';

test('two players set up in private and play to checkmate', async ({ page }) => {
  await startNewGame(page, 'Two players');
  await expect(page.getByRole('heading', { name: 'White: draft your army' })).toBeVisible();
  await usePreset(page, 'classic');
  await page.getByRole('button', { name: 'Lock in army' }).click();

  // The handoff screen shows no board, so Black cannot see White's army.
  await expect(page.getByRole('heading', { name: 'Pass the device to Black' })).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page.getByRole('button', { name: "I'm Black — continue" }).click();
  await usePreset(page, 'classic');
  await page.getByRole('button', { name: 'Lock in army' }).click();
  await page.getByRole('button', { name: 'Reveal armies' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();

  await move(page, 'f2', 'f3');
  await move(page, 'e7', 'e5');
  await move(page, 'g2', 'g4');
  await move(page, 'd8', 'h4');

  const result = page.getByRole('dialog', { name: 'Checkmate — Black wins' });
  await expect(result).toBeVisible();
  await expect(movesList(page)).toContainText('Qh4#');

  await result.getByRole('button', { name: 'Undo move' }).click();
  await expect(result).toBeHidden();
  await expect(page.getByRole('status')).toContainText('Black to move');
});

test('custom drafting enforces the treasury and placement rules', async ({ page }) => {
  await startNewGame(page, 'Two players');
  const add = (name: string) => page.getByRole('button', { name: `Add ${name}` });
  await add('King').click();
  for (let i = 0; i < 8; i++) await add('Sergeant').click();
  await add('Queen').click();
  await add('Queen').click();
  // 1 + 16 + 18 = 35 points; a third Queen would cost 44.
  await expect(add('Queen')).toBeDisabled();
  await expect(add('Pawn')).toBeDisabled(); // pawn row full
  await page.getByRole('button', { name: 'Place pieces' }).click();

  await page.getByRole('button', { name: /^King, 1 to place/ }).click();
  await expect(page.getByRole('button', { name: /^d1, empty, can move here/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^c1, empty, can move here/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Random' }).click();
  await expect(page.getByRole('button', { name: 'Lock in army' })).toBeEnabled();
});

test('reloading keeps the session and hides private armies', async ({ page }) => {
  await startNewGame(page, 'Two players');
  await usePreset(page, 'menagerie');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pass the device to White' })).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page.getByRole('button', { name: "I'm White — continue" }).click();
  await expect(page.getByRole('heading', { name: 'White: place your army' })).toBeVisible();

  await startLocalGame(page, 'classic', 'cavalry', true);
  await move(page, 'e2', 'e4');
  await page.reload();
  await expect(movesList(page)).toContainText('e4');
  await page.getByRole('button', { name: 'Treasure Chess' }).click();
  await expect(page.getByRole('button', { name: 'Continue game' })).toBeVisible();
});
