import { test, expect } from '@playwright/test';

test('实际点击设备、解锁双发、续命、暂停与帮助', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '再争取一秒。' })).toBeVisible();
  await page.screenshot({ path: 'test-results/desktop-ready.png', fullPage: true });
  await page.getByRole('button', { name: '启动工作台' }).click();
  const canvas = page.locator('canvas'), box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 709 / 960, box.y + box.height * 337 / 620);
  for (let i = 0; i < 10; i++) await page.mouse.click(box.x + box.width * 709 / 960, box.y + box.height * 337 / 620, { delay: 45 });
  await expect(page.getByText('每次发射 3 枚铜币', { exact: true })).toBeVisible();
  await expect(page.getByTestId('splitter-progress')).toHaveText('0 / 50');
  await page.keyboard.press('Digit1'); await page.keyboard.press('Space');
  await expect(page.getByTestId('forge-progress')).toHaveText('2 / 1,000');
  const time = Number(await page.getByTestId('countdown').innerText());
  await page.keyboard.press('Digit2'); await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  expect(Number(await page.getByTestId('countdown').innerText())).toBeGreaterThanOrEqual(time + 1);
  await page.screenshot({ path: 'test-results/desktop-playing.png', fullPage: true });
  await page.keyboard.press('KeyP');
  await expect(page.getByText('喘口气。')).toBeVisible();
  const paused = await page.getByTestId('countdown').innerText(); await page.waitForTimeout(1100); await expect(page.getByTestId('countdown')).toHaveText(paused);
  await page.getByRole('button', { name: '继续值班' }).click();
  await page.getByRole('button', { name: '操作说明', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('喘口气。')).not.toBeVisible();
  expect(errors).toEqual([]);
});

test('时间耗尽触发失败并可重开', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: '启动工作台' }).click();
  await page.clock.runFor(100);
  await page.clock.fastForward(101_000);
  await page.clock.runFor(32);
  await expect(page.getByRole('heading', { name: '最后一秒，耗尽了。' })).toBeVisible();
  await expect(page.locator('.failure-stats strong').first()).toHaveText('01:40');
  await page.screenshot({ path: 'test-results/desktop-failed.png', fullPage: true });
  await page.setViewportSize({ width: 320, height: 1000 });
  await expect(page.getByRole('button', { name: '再值一次班' })).toBeInViewport();
  const failurePanel = (await page.locator('.state-panel').boundingBox())!;
  expect(failurePanel.x + failurePanel.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: 'test-results/mobile-failed.png', fullPage: true });
  await page.getByRole('button', { name: '再值一次班' }).click();
  await expect(page.getByTestId('forge-progress')).toHaveText('0 / 1,000');
  await expect(page.getByTestId('splitter-progress')).toHaveText('0 / 10');
});

test('完成固定改装序列后自动供币，暂停时停止', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '启动工作台' }).click();
  await page.keyboard.press('Digit3');
  for (const count of [10, 25, 50]) {
    for (let i = 0; i < count; i++) await page.keyboard.press('Space', { delay: 20 });
    await page.waitForTimeout(550);
  }
  await expect(page.getByLabel(/自动供币 ·/)).toBeVisible();
  await page.getByLabel(/自动供币 ·/).selectOption('forge');
  await expect(page.getByTestId('forge-progress')).not.toHaveText('0 / 1,000', { timeout: 4000 });
  await page.locator('canvas').focus(); await page.keyboard.press('KeyP');
  const progress = await page.getByTestId('forge-progress').innerText();
  await page.waitForTimeout(2300); await expect(page.getByTestId('forge-progress')).toHaveText(progress);
});

test('小屏布局无溢出且可启动射击', async ({ page }) => {
  for (const width of [320, 375, 414, 768]) {
    await page.setViewportSize({ width, height: 1000 }); await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole('button', { name: '启动工作台' })).toBeInViewport();
    await page.screenshot({ path: `test-results/mobile-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: '启动工作台' }).click();
    await page.keyboard.press('Digit3'); await page.keyboard.press('Space');
    await expect(page.getByTestId('splitter-progress')).toHaveText('1 / 10');
  }
});
