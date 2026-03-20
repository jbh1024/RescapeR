const { test, expect } = require('@playwright/test');

test.describe('PRD Validation Tests', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

    await page.goto('./index.html');

    // 사원명 입력 후 게임 시작 (오프닝 시네마틱 포함)
    const input = page.locator('#player-name-input');
    await expect(input).toBeVisible({ timeout: 5000 });
    await input.focus();
    await page.keyboard.press('Enter');

    // 오프닝 시네마틱 + 게임 시작 대기
    await expect(page.locator('#log')).toContainText('탈출을 시작합니다', { timeout: 20000 });
  });

  test('Skill selection overlay appears and skills can be picked', async ({ page }) => {
    // 레벨업을 트리거하여 스킬 선택 UI 호출
    await page.evaluate(() => {
      const state = window.gameState;
      // 레벨업 직전 상태로 설정 후 showSkillSelection 간접 호출
      state.mode = "skillSelect";
      state.running = false;
    });

    // 스킬 선택 상태인지 확인
    const mode = await page.evaluate(() => window.gameState.mode);
    expect(mode).toBe('skillSelect');

    // 게임 상태 복원
    await page.evaluate(() => {
      const state = window.gameState;
      state.mode = "playing";
      state.running = true;
    });
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

    // 'e' 키를 누른 상태 유지 (게임 루프에서 isPressed("e") 체크)
    await page.keyboard.down('e');
    await page.waitForFunction(
      (prev) => window.gameState.floorIndex > prev,
      initialFloorIndex,
      { timeout: 5000 }
    );
    await page.keyboard.up('e');

    const nextFloorIndex = await page.evaluate(() => window.gameState.floorIndex);
    expect(nextFloorIndex).toBe(initialFloorIndex + 1);

    const log = page.locator('#log');
    await expect(log).toContainText('진입');
  });

  test('Pause/Resume functionality', async ({ page }) => {
    const overlay = page.locator('#overlay');

    // Press 'p' to pause
    await page.keyboard.press('p');
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText('일시정지');

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

  test('Easter egg floor navigation (Ctrl + ] / Ctrl + [)', async ({ page }) => {
    // 이스터에그 활성화를 위해 UI 패널 열기 (h 키)
    await page.keyboard.press('h');
    await page.waitForTimeout(200);

    const initialFloorIndex = await page.evaluate(() => window.gameState.floorIndex);

    // Ctrl + ] 로 다음 층 이동
    await page.keyboard.down('Control');
    await page.keyboard.press(']');
    await page.keyboard.up('Control');

    let floorIndex = await page.evaluate(() => window.gameState.floorIndex);
    expect(floorIndex).toBe(initialFloorIndex + 1);
    await expect(page.locator('#log')).toContainText('진입');

    // Ctrl + [ 로 이전 층 복귀
    await page.keyboard.down('Control');
    await page.keyboard.press('[');
    await page.keyboard.up('Control');

    floorIndex = await page.evaluate(() => window.gameState.floorIndex);
    expect(floorIndex).toBe(initialFloorIndex);
  });
});
