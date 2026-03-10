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
  
  // Wait for the log element to contain the start message
  const logElement = page.locator('#log');
  await expect(logElement).toContainText('런 시작', { timeout: 10000 });
  await expect(logElement).toContainText('진입 완료', { timeout: 10000 });

  // Test 'h' key toggle for UI panels
  const layout = page.locator('.layout');
  await page.keyboard.press('h');
  await expect(layout).toHaveClass(/show-panels/);
  await page.keyboard.press('h');
  await expect(layout).not.toHaveClass(/show-panels/);

  // Test 'p' key toggle for pause
  await page.keyboard.press('p');
  await expect(logElement).toContainText('게임 일시정지');
  await page.keyboard.press('p');
  await expect(logElement).toContainText('게임 재개');
});
