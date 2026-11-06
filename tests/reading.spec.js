const { test, expect } = require('@playwright/test');

test('whole song fits, columns preserve verses, and colors follow contrast', async ({ page }) => {
  await page.goto('/');
  await page.locator('#songSelect').selectOption('eslabon-por-eslabon');
  const original = await page.locator('.lyric-segment').allTextContents();
  for (const mode of ['fit', 'columns']) {
    await page.locator('#readingMode').selectOption(mode);
    await expect(page.locator('#fontSizeValue')).toContainText('(auto)');
    await expect(page.locator('#playPause')).toBeDisabled();
    const checkFit = async () => {
      await expect.poll(() => page.locator('#stage').evaluate(stage => {
        const bounds = stage.getBoundingClientRect();
        return [...stage.querySelectorAll('.lyric-segment')].every(el => {
          const box = el.getBoundingClientRect();
          return box.bottom <= bounds.bottom + 1 && box.right <= bounds.right + 1 && box.top >= bounds.top;
        });
      })).toBe(true);
    };
    await checkFit();
    expect(await page.locator('.lyric-segment').allTextContents()).toEqual(original);
    if (mode === 'columns') await expect(page.locator('.lyric-column')).toHaveCount(2);
    await page.locator('#fullscreen').click();
    await checkFit();
    await page.locator('#fullscreen').click();
  }
  const colors = await page.locator('.lyric-segment').evaluateAll(nodes => nodes.map(el => getComputedStyle(el).color));
  expect(colors[0]).not.toBe(colors[1]);
  await page.locator('[data-theme="paper"]').click();
  expect(await page.locator('.lyric-segment').first().evaluate(el => getComputedStyle(el).color)).not.toBe(colors[0]);
  await page.locator('#segmentColors').uncheck();
  await expect(page.locator('#lyricsDisplay')).not.toHaveClass(/colored/);
  await page.locator('#readingMode').selectOption('scroll');
  await expect(page.locator('#playPause')).toBeEnabled();
  await expect(page.locator('.lyric-column')).toHaveCount(0);
  await page.locator('#playPause').click();
  await expect(page.locator('#playLabel')).toHaveText('Pause');
});
