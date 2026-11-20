const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('**/songs/test.txt', route => route.fulfill({ body: 'Verse', contentType: 'text/plain' }));
});

test('song URL loads a player and switching removes it', async ({ page }) => {
  // Verify our integration independently of YouTube availability.
  await page.route('https://www.youtube.com/embed/**', route => route.fulfill({ body: '<html>Player fixture</html>', contentType: 'text/html' }));
  await page.route('**/songs.json', route => route.fulfill({ json: { songs: [
    { id: 'with-video', title: 'With video', file: 'songs/test.txt', url: 'https://www.youtube.com/watch?v=ULxcmMgsxf4' },
    { id: 'without-video', title: 'Without video', file: 'songs/test.txt' }
  ] } }));
  await page.goto('/');
  const player = page.locator('#songPlayer iframe');
  await expect(player).toHaveAttribute('src', /https:\/\/www.youtube.com\/embed\/ULxcmMgsxf4\?playsinline=1&enablejsapi=1&origin=/);
  await expect(player).toHaveAttribute('title', /Reproducir/);
  await expect(page.locator('#songSource')).toHaveAttribute('href', 'https://www.youtube.com/watch?v=ULxcmMgsxf4');
  const bounds = await player.boundingBox();
  expect(bounds.width).toBeGreaterThanOrEqual(200);
  expect(bounds.height).toBeGreaterThanOrEqual(200);
  await page.locator('#songSelect').selectOption('without-video');
  await expect(player).toHaveCount(0);
  await expect(page.locator('#songSource')).toBeHidden();
  await expect(page.locator('#playerHint')).toContainText('no tiene un enlace');
});

test('invalid or unsafe URLs cannot create an embed or link', async ({ page }) => {
  await page.route('**/songs.json', route => route.fulfill({ json: { songs: [{ id: 'invalid', title: 'Invalid', file: 'songs/test.txt', url: 'javascript:alert(1)' }] } }));
  await page.goto('/');
  await expect(page.locator('#stageTitle')).toHaveText('Invalid');
  await expect(page.locator('#songPlayer iframe')).toHaveCount(0);
  await expect(page.locator('#songSource')).toBeHidden();
  await expect(page.locator('#playerHint')).toContainText('No se reconoce');
});

test('speed selector uses supported rates and follows player changes', async ({ page }) => {
  await page.route('https://www.youtube.com/embed/**', route => route.fulfill({ body: '<html></html>', contentType: 'text/html' }));
  await page.addInitScript(() => {
    window.YT = { Player: class {
      constructor(frame, { events }) {
        this.rate = 1;
        this.events = events;
        window.testPlayer = this;
        setTimeout(() => events.onReady({ target: this }), 0);
      }
      playVideo() { this.playing = true; }
      pauseVideo() { this.playing = false; }
      seekTo(time) { this.time = time; }
      getAvailablePlaybackRates() { return [0.5, 0.75, 1, 1.25, 1.5, 2]; }
      getPlaybackRate() { return this.rate; }
      setPlaybackRate(rate) {
        this.rate = rate;
        this.events.onPlaybackRateChange({ target: this, data: rate });
      }
      destroy() {}
    } };
  });
  await page.route('**/songs.json', route => route.fulfill({ json: { songs: [
    { id: 'video', title: 'Video', file: 'songs/test.txt', url: 'https://youtu.be/ULxcmMgsxf4' },
    { id: 'none', title: 'None', file: 'songs/test.txt' }
  ] } }));
  await page.goto('/');
  const rate = page.locator('#playbackRate');
  await expect(rate).toBeEnabled();
  await rate.selectOption('0.75');
  expect(await page.evaluate(() => window.testPlayer.rate)).toBe(0.75);
  await page.evaluate(() => window.testPlayer.setPlaybackRate(1.5));
  await expect(rate).toHaveValue('1.5');
  for (const fallback of [false, true]) {
    if (fallback) await page.evaluate(() => {
      document.querySelector('.stage-wrap').requestFullscreen = () => Promise.reject(new Error('Unavailable'));
    });
    await page.locator('#fullscreen').click();
    for (const id of ['musicPlay', 'musicPause', 'musicStop', 'musicStart']) {
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }
    await page.locator('#musicPlay').click();
    expect(await page.evaluate(() => window.testPlayer.playing)).toBe(true);
    await page.evaluate(() => { window.testPlayer.time = 42; });
    await page.locator('#musicPause').click();
    expect(await page.evaluate(() => [window.testPlayer.playing, window.testPlayer.time])).toEqual([false, 42]);
    await page.locator('#musicPlay').click();
    await page.locator('#musicStart').click();
    expect(await page.evaluate(() => [window.testPlayer.playing, window.testPlayer.time])).toEqual([true, 0]);
    await page.locator('#musicStop').click();
    expect(await page.evaluate(() => [window.testPlayer.playing, window.testPlayer.time])).toEqual([false, 0]);
    await page.locator('#fullscreen').click();
  }
  await page.locator('#songSelect').selectOption('none');
  await expect(page.locator('#musicPlay')).toBeDisabled();
  await expect(rate).toBeDisabled();
  await expect(rate).toHaveValue('1');
});
