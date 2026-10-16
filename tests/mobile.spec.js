const { test, expect } = require('@playwright/test');
const offset = page => page.locator('#lyricsDisplay').evaluate(el => -new DOMMatrixReadOnly(getComputedStyle(el).transform).m42);
async function speed(page, value) {
  await page.locator('#scrollSpeed').fill(String(value));
  await expect(page.locator('#scrollSpeedValue')).toHaveText(`${value} px/s`);
}
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#songSelect option').first()).toBeAttached();
  await expect(page.locator('#lyricsDisplay')).not.toBeEmpty();
});
test('visible controls, playback, speed, pause, restart and live rotation', async ({ page }, testInfo) => {
  await page.screenshot({ path: testInfo.outputPath('layout.png') });
  for (const id of ['playPause', 'restart', 'fullscreen', 'scrollSpeed']) {
    await expect(page.locator(`#${id}`)).toBeInViewport({ ratio: 1 });
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await speed(page, 12);
  await page.locator('#playPause').click();
  await page.waitForTimeout(600);
  const slowStart = await offset(page);
  await page.waitForTimeout(900);
  const slowDistance = await offset(page) - slowStart;
  expect(slowDistance).toBeGreaterThan(5);
  await speed(page, 60);
  const fastStart = await offset(page);
  await page.waitForTimeout(900);
  expect(await offset(page) - fastStart).toBeGreaterThan(slowDistance * 3);
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: viewport.height, height: viewport.width });
  await page.waitForTimeout(200);
  const rotated = await offset(page);
  expect(Number.isFinite(rotated)).toBe(true);
  expect(rotated).toBeGreaterThan(0);
  await page.waitForTimeout(400);
  expect(await offset(page)).toBeGreaterThan(rotated + 10);
  await page.locator('#playPause').click();
  const paused = await offset(page);
  await page.waitForTimeout(250);
  expect(await offset(page)).toBe(paused);
  await page.locator('#restart').click();
  expect(await offset(page)).toBeCloseTo(0, 5);
});
test('touch swipe moves lyrics and speed responds to touch', async ({ page, context, isMobile }) => {
  test.skip(!isMobile, 'Touch devices only');
  const stage = await page.locator('#stage').boundingBox();
  const session = await context.newCDPSession(page);
  const x = stage.x + stage.width / 2;
  const y = stage.y + stage.height * 0.8;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - 70 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  expect(await offset(page)).toBeGreaterThan(40);
  const slider = await page.locator('#scrollSpeed').boundingBox();
  await page.touchscreen.tap(slider.x + slider.width * 0.85, slider.y + slider.height / 2);
  expect(Number(await page.locator('#scrollSpeed').inputValue())).toBeGreaterThan(45);
});
test('fullscreen fallback retains working transport', async ({ page }) => {
  await page.evaluate(() => { document.querySelector('.stage-wrap').requestFullscreen = undefined; });
  await page.locator('#fullscreen').click();
  await expect(page.locator('.stage-wrap')).toHaveClass(/expanded/);
  await expect(page.locator('#playPause')).toBeInViewport({ ratio: 1 });
  await page.locator('#playPause').click();
  await page.waitForTimeout(300);
  expect(await offset(page)).toBeGreaterThan(2);
  await page.locator('#fullscreen').click();
  await expect(page.locator('.stage-wrap')).not.toHaveClass(/expanded/);
});
test('invalid saved data does not block initialization', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('lyriccue.customSongs.v1', '{broken'));
  await page.reload();
  await expect(page.locator('#lyricsDisplay')).not.toBeEmpty();
  await page.locator('#playPause').click();
  await page.waitForTimeout(300);
  expect(await offset(page)).toBeGreaterThan(2);
});

test('native fullscreen keeps controls accessible and exits cleanly', async ({ page }) => {
  await page.locator('#fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(true);
  await expect(page.locator('#playPause')).toBeInViewport({ ratio: 1 });
  await page.locator('#playPause').click();
  await page.waitForTimeout(300);
  expect(await offset(page)).toBeGreaterThan(2);
  await page.locator('#fullscreen').click();
  await expect.poll(() => page.evaluate(() => Boolean(document.fullscreenElement))).toBe(false);
});
