const { test, expect } = require('@playwright/test');

test('complete library works offline after reload, including audio ranges', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One full library download is sufficient.');
  test.setTimeout(180000);
  await page.goto('/');
  await page.locator('#prepareOffline').click();
  await expect(page.locator('#offlineStatus')).toHaveText('Biblioteca lista para usar sin conexión.', { timeout: 120000 });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#songSelect option')).toHaveCount(13);
  const catalog = await page.evaluate(async () => (await (await fetch('songs.json')).json()).songs);
  for (const song of catalog) {
    await page.locator('#songSelect').selectOption(song.id);
    await expect(page.locator('#musicPlay')).toBeEnabled();
    await expect(page.locator('#lyricsDisplay')).not.toBeEmpty();
    const result = await page.evaluate(async path => {
      const response = await fetch(path, { headers: { Range: 'bytes=0-43' } });
      return [response.status, (await response.arrayBuffer()).byteLength, response.headers.get('content-range')];
    }, song.audio);
    expect(result[0]).toBe(206);
    expect(result[1]).toBe(44);
    expect(result[2]).toMatch(/^bytes 0-43\//);
  }
  const audio = page.locator('audio');
  await page.locator('#musicPlay').click();
  await expect.poll(() => audio.evaluate(el => el.currentTime)).toBeGreaterThan(0);
  await audio.evaluate(el => { el.currentTime = 60; });
  await expect.poll(() => audio.evaluate(el => el.currentTime)).toBeGreaterThan(60);
  const invalid = await page.evaluate(async () => (await fetch('audio/la-chona.wav', { headers: { Range: 'bytes=999999999-' } })).status);
  expect(invalid).toBe(416);
});
