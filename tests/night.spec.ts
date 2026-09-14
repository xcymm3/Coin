import { test, expect } from '@playwright/test';
import { beginNight, initialState, SAVE_KEY } from '../src/rules';
import type { GameState } from '../src/rules';

async function savedGame(page: import('@playwright/test').Page, state: GameState) {
  await page.addInitScript(({ key, s }) => localStorage.setItem(key, JSON.stringify({ version: 2, state: s })), { key: SAVE_KEY, s: state });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '握紧铸币枪' })).toBeEnabled();
  await page.getByRole('button', { name: /继续上次守夜/ }).click();
}

test('真实三维场景、系统引导、持枪命中、双发续命与暂停', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await expect(page.getByRole('button', { name: '握紧铸币枪' })).toBeEnabled();
  expect(await page.locator('canvas').evaluate(c => !!(c as HTMLCanvasElement).getContext('webgl2'))).toBe(true);
  await page.screenshot({ path: 'test-results/gothic-ready.png', fullPage: true });
  await page.getByRole('button', { name: '握紧铸币枪' }).click();
  await expect(page.getByText(/契约引导 1/)).toBeVisible();
  const marker = page.locator('.guidance-marker span'); const box = (await marker.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(2700); await page.mouse.up();
  await expect(page.getByText(/契约引导 2/)).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('countdown')).toHaveText('100');
  await page.keyboard.press('Digit7'); await page.keyboard.press('Space');
  await page.waitForTimeout(500); await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '我将守到黎明' })).toBeVisible();
  await page.getByRole('button', { name: '我将守到黎明' }).click();
  await page.keyboard.press('Digit1'); await page.keyboard.press('Space');
  await expect(page.getByTestId('forge-progress')).toHaveText('2 / 1,000');
  await page.screenshot({ path: 'test-results/gothic-play.png', fullPage: true });
  await page.keyboard.press('KeyP'); await expect(page.getByText('烛火替你守着。')).toBeVisible();
  const time = await page.getByTestId('countdown').innerText(); await page.waitForTimeout(1200); await expect(page.getByTestId('countdown')).toHaveText(time);
  await page.getByRole('button', { name: '继续守夜', exact: true }).last().click();
  await page.getByRole('button', { name: '守夜手册', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('存档恢复后新祭器显现、灵仆献祭与黎明胜利', async ({ page }) => {
  const s = beginNight(initialState());
  s.elapsed = 711; s.time = 150; s.levels = { forge: 3, splitter: 3, choir: 2, ward: 2, lens: 2, seal: 1 };
  s.autoTarget = 'forge';
  await savedGame(page, s);
  await expect(page.getByRole('button', { name: '黑曜棱镜，选择瞄准' })).toBeEnabled();
  await expect(page.getByLabel('灵仆献祭')).toBeEnabled();
  await expect(page.getByTestId('forge-progress')).not.toHaveText('0 / 14,000');
  await page.screenshot({ path: 'test-results/gothic-late.png', fullPage: true });
  await expect(page.getByRole('heading', { name: '这一次，黎明是真的。' })).toBeVisible({ timeout: 16000 });
  await page.screenshot({ path: 'test-results/gothic-victory.png', fullPage: true });
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(null);
});

test('丧钟归零失败，重新签订契约重置进度', async ({ page }) => {
  const s = beginNight(initialState()); s.time = 2; s.elapsed = 50;
  await savedGame(page, s);
  await expect(page.getByRole('heading', { name: '别回头。它已在你身后。' })).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: '重新签订契约' }).click();
  await expect(page.getByTestId('splitter-progress')).toHaveText('0 / 10');
  await expect(page.getByTestId('forge-progress')).toHaveText('0 / 1,000');
});

test('小屏幕无溢出且向导、倒计时和祭器可访问', async ({ page }) => {
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/');
    await expect(page.getByRole('button', { name: '握紧铸币枪' })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/gothic-mobile-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: '我已知晓契约，直接守夜' }).click();
    await page.keyboard.press('Digit2'); await page.keyboard.press('Space');
    await expect(page.getByTestId('splitter-progress')).toHaveText('1 / 10');
    await page.getByRole('button', { name: '暂停守夜' }).click();
  }
});
