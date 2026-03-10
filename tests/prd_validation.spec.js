const { test, expect } = require('@playwright/test');

test.describe('PRD Validation Tests', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('./index.html');
    await expect(page.locator('#log')).toContainText('런 시작', { timeout: 15000 });
  });

  test('Skill selection overlay appears and skills can be picked', async ({ page }) => {
    // Trigger skill selection UI
    await page.evaluate(() => {
      window.showSkillSelection();
    });

    // Verify overlay is visible and contains skill options
    const overlay = page.locator('#overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay.locator('#skill-selection')).toBeVisible();
    
    const skillOptions = overlay.locator('.skill-option');
    await expect(skillOptions).toHaveCount(3);

    // Press '1' to pick the first skill
    await page.keyboard.press('1');

    // Verify overlay is hidden and log contains selection message
    await expect(overlay).toBeHidden();
    const log = page.locator('#log');
    await expect(log).toContainText('선택됨:');
  });

  test('Next floor progression when gate is open', async ({ page }) => {
    // Get initial floor index
    const initialFloorIndex = await page.evaluate(() => window.gameState.floorIndex);
    
    // Force gate open and position player at gate
    await page.evaluate(() => {
      const state = window.gameState;
      state.floor.gateOpen = true;
      state.player.x = state.floor.gate.x;
      state.player.y = state.floor.gate.y;
    });

    // Press 'e' to go to next floor
    await page.keyboard.press('e');

    // Verify floor index has changed and log contains entry message
    const nextFloorIndex = await page.evaluate(() => window.gameState.floorIndex);
    expect(nextFloorIndex).toBe(initialFloorIndex + 1);
    
    const log = page.locator('#log');
    await expect(log).toContainText('진입 완료');
  });

  test('Pause/Resume functionality', async ({ page }) => {
    const overlay = page.locator('#overlay');
    
    // Press 'p' to pause
    await page.keyboard.press('p');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('일시정지 중');
    
    const isRunningAfterPause = await page.evaluate(() => window.gameState.running);
    expect(isRunningAfterPause).toBe(false);

    // Press 'p' to resume
    await page.keyboard.press('p');
    await expect(overlay).toBeHidden();
    
    const isRunningAfterResume = await page.evaluate(() => window.gameState.running);
    expect(isRunningAfterResume).toBe(true);
  });

  test('HP recovery using Q key with item', async ({ page }) => {
    // Set HP low and give item
    await page.evaluate(() => {
      const p = window.gameState.player;
      p.hp = 10;
      p.maxHp = 100;
      p.inventory[0] = "회복키트";
    });

    // Press 'q' to heal
    await page.keyboard.press('q');

    // Verify HP increased
    const hp = await page.evaluate(() => window.gameState.player.hp);
    expect(hp).toBeGreaterThan(10);
    
    const log = page.locator('#log');
    await expect(log).toContainText('회복키트 사용');
  });

  test('Easter egg floor navigation (+ / -)', async ({ page }) => {
    const initialFloorIndex = await page.evaluate(() => window.gameState.floorIndex);
    
    // Press '+' to go to next floor
    await page.keyboard.press('+');
    let floorIndex = await page.evaluate(() => window.gameState.floorIndex);
    expect(floorIndex).toBe(initialFloorIndex + 1);
    await expect(page.locator('#log')).toContainText('이스터에그: 다음 층으로 이동');

    // Press '-' to go back to initial floor
    await page.keyboard.press('-');
    floorIndex = await page.evaluate(() => window.gameState.floorIndex);
    expect(floorIndex).toBe(initialFloorIndex);
    await expect(page.locator('#log')).toContainText('이스터에그: 이전 층으로 이동');
  });
});
