import { expect, test } from '@playwright/test';
import { move, movesList, startLocalGame, startNewGame, usePreset } from './helpers';

test('two players set up in private and play to checkmate', async ({ page }) => {
  await startNewGame(page, 'Human vs. Human');
  await expect(page.getByRole('heading', { name: 'White: Draft Your Army' })).toBeVisible();
  await usePreset(page, 'classic');
  await page.getByRole('button', { name: 'Done', exact: true }).click();

  // The handoff screen shows no board, so Black cannot see White's army.
  await expect(page.getByRole('heading', { name: 'Pass the Device to Black' })).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await usePreset(page, 'classic');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Reveal', exact: true }).click();
  await page.getByRole('button', { name: 'Start Game' }).click();

  await move(page, 'f2', 'f3');
  await move(page, 'e7', 'e5');
  await move(page, 'g2', 'g4');
  await move(page, 'd8', 'h4');

  const result = page.getByRole('dialog', { name: 'Checkmate — Black Wins' });
  await expect(result).toBeVisible();
  await expect(movesList(page)).toContainText('Qh4#');

  await result.getByRole('button', { name: 'Undo Move' }).click();
  await expect(result).toBeHidden();
  await expect(page.getByRole('status')).toContainText('Black to move');
});

test('custom drafting enforces the point budget and placement rules', async ({ page }) => {
  await startNewGame(page, 'Human vs. Human');
  const add = (name: string) => page.getByRole('button', { name: `Add ${name}` });
  await expect(add('King')).toHaveCount(0); // the King is always included
  for (let i = 0; i < 8; i++) await add('Sergeant').click();
  await add('Queen').click();
  await add('Queen').click();
  // 1 + 16 + 18 = 35 points; a third Queen would cost 44.
  await expect(add('Queen')).toBeDisabled();
  await expect(add('Pawn')).toBeDisabled(); // pawn row full
  await page.getByRole('button', { name: 'Next: Place' }).click();

  await page.getByRole('button', { name: /^King, 1 to place/ }).click();
  await expect(page.getByRole('button', { name: /^d1, empty, can move here/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^c1, empty, can move here/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Random' }).click();
  await expect(page.getByRole('button', { name: 'Done', exact: true })).toBeEnabled();
});

test('reloading keeps the session and hides private armies', async ({ page }) => {
  await startNewGame(page, 'Human vs. Human');
  await usePreset(page, 'menagerie');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pass the Device to White' })).toBeVisible();
  await expect(page.getByRole('grid')).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'White: Place Your Army' })).toBeVisible();

  await startLocalGame(page, 'classic', 'cavalry', true);
  await move(page, 'e2', 'e4');
  await page.reload();
  await expect(movesList(page)).toContainText('e4');
  await page.getByRole('button', { name: 'Treasure Chess' }).click();
  await expect(page.getByRole('button', { name: 'Continue Game' })).toBeVisible();
});

test('the Rules overlay links to the Pieces overlay', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Rules' }).click();
  await page.getByRole('dialog', { name: 'Rules' }).getByRole('button', { name: 'Pieces' }).click();
  await expect(page.getByRole('dialog', { name: 'Pieces' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Rules' })).toBeHidden();
});
