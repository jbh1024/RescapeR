const { test, expect } = require('@playwright/test');
const path = require('path');

test('game canvas is visible', async ({ page }) => {
  const filePath = `file://${path.resolve(__dirname, '../playable-web/index.html')}`;
  await page.goto(filePath);
  
  // Wait for the game container/canvas
  const canvas = page.locator('#game');
  await expect(canvas).toBeVisible();
});
