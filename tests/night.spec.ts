import { expect, test } from '@playwright/test';

test.afterEach(async ({ page }) => { if (!page.isClosed()) await page.evaluate(() => window.__COIN_TEST__?.shutdown()) });

async function noPageErrors(page: import('@playwright/test').Page) {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) }); return errors;
}
async function clickTarget(page: import('@playwright/test').Page, target: 'machine:tutorial' | 'machine:cannon' | 'creature:narthex-hollow' | 'moon') {
  await expect.poll(() => page.evaluate(id => window.__COIN_TEST__?.point(id) ?? null, target)).not.toBeNull();
  const current = await page.evaluate(id => window.__COIN_TEST__!.point(id), target); expect(current).not.toBeNull(); await page.mouse.click(current!.x, current!.y); await page.waitForTimeout(480);
}

test('真实 WebGL 教程要求射线命中、实际打开 B，之后 W/A/D 才能格点移动', async ({ page }) => {
  const errors = await noPageErrors(page); await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible(); expect(await page.locator('canvas').evaluate(element => (element as HTMLCanvasElement).width)).toBeGreaterThan(0);
  expect(await page.locator('canvas').evaluate(element => (element as HTMLCanvasElement).getContext('webgl2') instanceof WebGL2RenderingContext)).toBe(true);
  await page.getByRole('button', { name: '听从月下低语' }).click();
  await page.keyboard.press('KeyW'); expect(await page.evaluate(() => window.__COIN_TEST__?.state().room)).toBe('refuge');
  for (let i = 0; i < 3; i++) await clickTarget(page, 'machine:tutorial');
  await expect(page.getByRole('status')).toContainText('按 B，亲自查看'); await page.keyboard.press('KeyB');
  await expect(page.getByRole('heading', { name: '已获得能力' })).toBeVisible(); await expect(page.getByText('银币发射', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '合上契约册' }).click(); await expect.poll(() => page.evaluate(() => window.__COIN_TEST__?.state().status)).toBe('playing');
  await page.keyboard.press('KeyW'); await expect.poll(() => page.evaluate(() => window.__COIN_TEST__?.state().room)).toBe('narthex');
  await page.keyboard.press('KeyA'); expect(await page.evaluate(() => window.__COIN_TEST__?.state().facing)).toBe('west'); await page.keyboard.press('KeyW'); expect(await page.evaluate(() => window.__COIN_TEST__?.state().room)).toBe('narthex');
  await page.keyboard.press('KeyD');
  await page.waitForTimeout(900);
  for (let i = 0; i < 8; i++) await clickTarget(page, 'creature:narthex-hollow');
  await expect.poll(() => page.evaluate(() => window.__COIN_TEST__!.state().producers)).toContain('narthex-hollow');
  const producedBefore = await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver);
  await page.waitForTimeout(700);
  expect(await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver)).toBeGreaterThan(producedBefore);
  expect(errors).toEqual([]);
});

test('在线生产增长，B/暂停冻结，版本化继续选择不会补离线收益', async ({ page }) => {
  const errors = await noPageErrors(page); await page.goto('/'); await page.getByRole('button', { name: '听从月下低语' }).click();
  await page.evaluate(() => window.__COIN_TEST__?.setStage('cannon')); const before = await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver);
  await page.waitForTimeout(700); const active = await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver); expect(active).toBeGreaterThan(before);
  await page.keyboard.press('KeyB'); await expect(page.getByRole('heading', { name: '已获得能力' })).toBeVisible(); const paused = await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver); await page.waitForTimeout(700); expect(await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver)).toBe(paused);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state.status, 'last-coin-cathedral-v3')).toBe('paused');
  const stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state.resources.silver as number, 'last-coin-cathedral-v3');
  await page.reload(); await expect(page.getByRole('button', { name: '继续上次探索' })).toBeVisible(); await page.waitForTimeout(700); expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).state.resources.silver, 'last-coin-cathedral-v3')).toBe(stored); await page.getByRole('button', { name: '继续上次探索' }).click(); const restored = await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver); expect(restored).toBeGreaterThanOrEqual(stored); expect(restored - stored).toBeLessThan(2); expect(errors).toEqual([]);
});

test('版本化后期状态仍须在真实三维画布射击组装四段月炮并亲自击碎月亮', async ({ page }) => {
  const errors = await noPageErrors(page); await page.goto('/'); await page.getByRole('button', { name: '听从月下低语' }).click(); await page.evaluate(() => window.__COIN_TEST__?.setStage('cannon'));
  for (let i = 0; i < 4; i++) await clickTarget(page, 'machine:cannon');
  await expect.poll(() => page.evaluate(() => window.__COIN_TEST__!.state().cannonStage)).toBe(4);
  for (let i = 0; i < 8; i++) await clickTarget(page, 'moon');
  await expect(page.getByRole('heading', { name: '月亮已经沉默' })).toBeVisible(); expect(await page.evaluate(() => window.__COIN_TEST__!.state().moonStage)).toBe(2); expect(errors).toEqual([]);
});

for (const width of [320, 375, 414, 768]) test(`${width}px 无页面溢出且触控等价控件可操作`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 }); const errors = await noPageErrors(page); await page.goto('/'); await page.getByRole('button', { name: '听从月下低语' }).click(); await page.evaluate(() => window.__COIN_TEST__?.setStage('explore'));
  for (const name of ['左转九十度', '前进一格', '右转九十度', '发射银币', '查看能力', '暂停']) await expect(page.getByRole('button', { name })).toBeVisible();
  await page.getByRole('button', { name: '左转九十度' }).click(); expect(await page.evaluate(() => window.__COIN_TEST__!.state().facing)).toBe('west');
  await page.getByRole('button', { name: '右转九十度' }).click(); await page.getByRole('button', { name: '前进一格' }).click(); expect(await page.evaluate(() => window.__COIN_TEST__!.state().room)).toBe('narthex');
  const shots = await page.evaluate(() => window.__COIN_TEST__!.state().shots); await page.getByRole('button', { name: '发射银币' }).click(); expect(await page.evaluate(() => window.__COIN_TEST__!.state().shots)).toBeGreaterThan(shots);
  await page.getByRole('button', { name: '查看能力' }).click(); await expect(page.getByRole('heading', { name: '已获得能力' })).toBeVisible(); await page.getByRole('button', { name: '关闭' }).click();
  await page.getByRole('button', { name: '暂停' }).click(); await expect(page.getByRole('heading', { name: '烛火替你守着' })).toBeVisible();
  const metrics = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight, w: innerWidth, h: innerHeight })); expect(metrics.sw).toBeLessThanOrEqual(metrics.w); expect(metrics.sh).toBeLessThanOrEqual(metrics.h); expect(errors).toEqual([]);
});

test('WebGL 上下文丢失显示恢复提示并冻结', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '听从月下低语' }).click(); await page.evaluate(() => document.querySelector('canvas')!.dispatchEvent(new Event('webglcontextlost', { cancelable: true })));
  await expect(page.getByRole('heading', { name: '视野中断' })).toBeVisible(); expect(await page.evaluate(() => window.__COIN_TEST__!.state().status)).toBe('paused');
});

test('两种桌面高度、失焦暂停恢复与 reduced-motion 均保持可操作', async ({ page }) => {
  const errors = await noPageErrors(page); await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const height of [900, 1100]) { await page.setViewportSize({ width: 1440, height }); await page.goto('/'); await page.getByRole('button', { name: '听从月下低语' }).click(); await page.evaluate(() => window.__COIN_TEST__?.setStage('cannon')); const canvas = await page.locator('canvas').boundingBox(); expect(canvas).toMatchObject({ x: 0, y: 0, width: 1440, height }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight)).toBe(true) }
  await page.evaluate(() => window.dispatchEvent(new Event('blur'))); await expect(page.getByRole('heading', { name: '烛火替你守着' })).toBeVisible(); const paused = await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver); await page.waitForTimeout(500); expect(await page.evaluate(() => window.__COIN_TEST__!.state().resources.silver)).toBe(paused); await page.getByRole('button', { name: '静音' }).click(); await expect(page.getByRole('button', { name: '开启声音' })).toBeVisible(); await page.getByRole('button', { name: '继续探索' }).click(); expect(errors).toEqual([]);
});
