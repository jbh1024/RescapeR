const { test, expect } = require('@playwright/test');

test('game logic initializes and logs start message', async ({ page }) => {
  const logs = [];
  page.on('console', msg => {
    logs.push(msg.text());
    if (msg.type() === 'error') console.error('Browser console error:', msg.text());
  });
  page.on('pageerror', err => {
    logs.push(err.message);
    console.error('Browser page error:', err.message);
  });

  await page.goto('./index.html');

  // 사원명 입력 후 게임 시작 (오프닝 시네마틱 포함)
  const input = page.locator('#player-name-input');
  await expect(input).toBeVisible({ timeout: 5000 });
  await input.focus();
  await page.keyboard.press('Enter');

  // 오프닝 시네마틱 + 게임 시작 대기
  const logElement = page.locator('#log');
  await expect(logElement).toContainText('탈출을 시작합니다', { timeout: 20000 });

  // Test 'h' key toggle for UI panels
  const layout = page.locator('.layout');
  await page.keyboard.press('h');
  await expect(layout).toHaveClass(/show-panels/);
  await page.keyboard.press('h');
  await expect(layout).not.toHaveClass(/show-panels/);

  // Test 'p' key toggle for pause
  const overlay = page.locator('#overlay');
  await page.keyboard.press('p');
  await expect(overlay).toBeVisible();
  await expect(overlay).toContainText('일시정지');
  const isRunning = await page.evaluate(() => window.gameState.running);
  expect(isRunning).toBe(false);

  await page.keyboard.press('p');
  await expect(overlay).toBeHidden();
  const isResumed = await page.evaluate(() => window.gameState.running);
  expect(isResumed).toBe(true);
});
