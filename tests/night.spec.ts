import { test, expect } from '@playwright/test';
import { beginNight, initialState, SAVE_KEY } from '../src/rules';
import type { GameState } from '../src/rules';

async function savedGame(page: import('@playwright/test').Page, state: GameState) {
  await page.addInitScript(({ key, s }) => localStorage.setItem(key, JSON.stringify({ version: 2, state: s })), { key: SAVE_KEY, s: state });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '握紧铸币枪' })).toBeVisible();
  await page.getByRole('button', { name: '继续上次守夜' }).click();
}

test('全屏世界、真实命中、强制 B 引导与只显示已有升级', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('button', { name: '握紧铸币枪' })).toBeVisible();
  const canvas = page.locator('canvas');
  const box = (await canvas.boundingBox())!;
  expect(box).toMatchObject({ x: 0, y: 0, width: 1440, height: 1100 });
  expect(await canvas.evaluate(c => !!(c as HTMLCanvasElement).getContext('webgl2'))).toBe(true);
  await expect(page.locator('header, footer, aside, .device-grid, .doom-column')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/immersive-arrival.png', fullPage: true });
  await page.getByRole('button', { name: '握紧铸币枪' }).click();
  const beacon = (await page.locator('.ritual-beacon').boundingBox())!;
  await page.mouse.move(beacon.x + beacon.width / 2, beacon.y + beacon.height / 2);
  await page.mouse.down(); await page.waitForTimeout(2800); await page.mouse.up();
  await expect(page.getByText(/现在，看最右侧的丧钟/)).toBeVisible({ timeout: 10000 });
  await page.keyboard.press('Digit7'); await page.keyboard.press('Space');
  await page.waitForTimeout(650); await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /展开契约烙印/ })).toBeVisible();
  await expect(page.getByRole('button', { name: '我将守到黎明' })).toHaveCount(0);
  await page.keyboard.press('KeyB');
  await expect(page.getByRole('dialog', { name: '已有契约烙印' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '分魂祭器' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '余烬铸币炉' })).toHaveCount(0);
  await expect(page.locator('.owned-contracts')).toContainText('2 枚铜币');
  await expect(page.locator('.owned-contracts')).not.toContainText('下一');
  const description = await canvas.getAttribute('aria-description');
  await page.waitForTimeout(1000); await expect(canvas).toHaveAttribute('aria-description', description!);
  await page.screenshot({ path: 'test-results/immersive-book.png', fullPage: true });
  await page.keyboard.press('KeyB');
  await page.getByRole('button', { name: '我将守到黎明' }).click();
  await page.waitForTimeout(7200);
  await expect(page.locator('.guide-voice, .passing-voice, .fading-controls')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/immersive-playing.png', fullPage: true });
  await page.keyboard.press('KeyP');
  await expect(page.getByRole('heading', { name: '烛火替你守着。' })).toBeVisible();
  await page.keyboard.press('KeyB'); await expect(page.getByRole('dialog', { name: '已有契约烙印' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('heading', { name: '烛火替你守着。' })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('后期契约仅显示当前能力，灵仆可改目标，合上后继续直到黎明', async ({ page }) => {
  const s = beginNight(initialState()); s.elapsed = 711; s.time = 150;
  s.levels = { forge: 3, splitter: 3, choir: 2, ward: 2, lens: 2, seal: 1 };
  await savedGame(page, s);
  await page.keyboard.press('KeyB');
  await expect(page.locator('.owned-contracts li')).toHaveCount(6);
  await expect(page.locator('.owned-contracts')).toContainText('4 枚铜币');
  await expect(page.locator('.owned-contracts')).toContainText('1.6 次齐射');
  await page.getByLabel('让灵仆聆听你的意志').selectOption('clock');
  const frozen = await page.locator('canvas').getAttribute('aria-description');
  await page.waitForTimeout(1200); await expect(page.locator('canvas')).toHaveAttribute('aria-description', frozen!);
  await page.keyboard.press('KeyB');
  await page.screenshot({ path: 'test-results/immersive-late.png', fullPage: true });
  await expect(page.getByRole('heading', { name: '这一次，黎明是真的。' })).toBeVisible({ timeout: 16000 });
  expect(await page.evaluate(key => localStorage.getItem(key), SAVE_KEY)).toBe(null);
});

test('丧钟归零失败，重开后的烙印不保留旧升级', async ({ page }) => {
  const s = beginNight(initialState()); s.time = 2; s.elapsed = 50; s.levels.splitter = 2;
  await savedGame(page, s);
  await expect(page.getByRole('heading', { name: '别回头。它已在你身后。' })).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: '重新签订契约' }).click();
  await page.keyboard.press('KeyB');
  await expect(page.locator('.owned-contracts li')).toHaveCount(0);
  await expect(page.getByText(/你的灵魂还没有新的烙印/)).toBeVisible();
});

test('小屏世界填满视口，B 菜单内部滚动而页面不滚动', async ({ page }) => {
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 850 }); await page.goto('/');
    await expect(page.getByRole('button', { name: '握紧铸币枪' })).toBeVisible();
    expect(await page.locator('canvas').boundingBox()).toMatchObject({ x: 0, y: 0, width, height: 850 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true);
    await page.getByRole('button', { name: '我已知晓契约' }).click();
    await page.keyboard.press('KeyB'); await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: 'test-results/immersive-mobile-' + width + '.png', fullPage: true });
    const menu = (await page.getByRole('dialog').boundingBox())!; expect(menu.x).toBeGreaterThanOrEqual(0); expect(menu.x + menu.width).toBeLessThanOrEqual(width);
    await page.keyboard.press('KeyB');
  }
});
