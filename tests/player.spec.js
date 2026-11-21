const { test, expect } = require('@playwright/test');
// Fixture routes must bypass the worker; offline behavior has its own integration test.
test.use({ serviceWorkers: 'block' });

test('local WAV controls, speed and switching without YouTube', async ({ page }) => {
  const remote = [];
  page.on('request', request => { if (/youtube|googlevideo/.test(request.url())) remote.push(request.url()); });
  await page.goto('/');
  const audio = page.locator('#songPlayer audio');
  await expect(audio).toHaveAttribute('src', 'audio/me-persigue-tu-sombra.wav');
  await expect(page.locator('#musicPlay')).toBeEnabled();
  await page.locator('#playbackRate').selectOption('0.75');
  expect(await audio.evaluate(el => el.playbackRate)).toBe(0.75);
  for (const fallback of [false, true]) {
    if (fallback) await page.evaluate(() => {
      document.querySelector('.stage-wrap').requestFullscreen = () => Promise.reject(new Error('Unavailable'));
    });
    await page.locator('#fullscreen').click();
    for (const id of ['musicPlay', 'musicPause', 'musicStop', 'musicStart']) await expect(page.locator(`#${id}`)).toBeInViewport();
    await page.locator('#musicPlay').click();
    await expect.poll(() => audio.evaluate(el => el.currentTime)).toBeGreaterThan(0);
    await page.locator('#musicPause').click();
    expect(await audio.evaluate(el => el.paused)).toBe(true);
    await audio.evaluate(el => { el.currentTime = 42; });
    await page.locator('#musicStart').click();
    expect(await audio.evaluate(el => [el.currentTime, el.paused])).toEqual([0, true]);
    await page.locator('#musicPlay').click();
    await page.locator('#musicStop').click();
    expect(await audio.evaluate(el => [el.currentTime, el.paused])).toEqual([0, true]);
    await page.locator('#fullscreen').click();
  }
  await audio.evaluate(el => { window.previousAudio = el; });
  await page.locator('#songSelect').selectOption('la-chona');
  await expect(audio).toHaveAttribute('src', 'audio/la-chona.wav');
  expect(await page.evaluate(() => window.previousAudio.paused)).toBe(true);
  await expect(page.locator('#playbackRate')).toHaveValue('1');
  expect(remote).toEqual([]);
});

test('missing and unsafe audio sources disable music controls', async ({ page }) => {
  await page.route('**/songs.json', route => route.fulfill({ json: { songs: [
    { id: 'unsafe', file: 'songs/la-chona.txt', audio: 'https://example.com/audio.wav' },
    { id: 'missing', file: 'songs/la-chona.txt', audio: 'audio/missing.wav' }
  ] } }));
  await page.goto('/');
  await expect(page.locator('#songPlayer audio')).toHaveCount(0);
  await expect(page.locator('#musicPlay')).toBeDisabled();
  await page.locator('#songSelect').selectOption('missing');
  await expect(page.locator('#playerHint')).toContainText('No se pudo cargar');
  await expect(page.locator('#musicPlay')).toBeDisabled();
});
